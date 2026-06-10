# Architecture

Voxply is six repositories. The hub backend lives in one Rust workspace;
each client and the discovery service is its own repo.

## The repository map

```
Voxply              ── docs, ROADMAP.md, openapi.yaml (this repo)
Voxply-server       ── Rust workspace: hub/, seed/, identity/, farm/,
                       server/, voxply-store/, voxply-store-sqlite/ crates
Voxply-desktop      ── Tauri 2 + React desktop client: desktop/, voice/
Voxply-android      ── Tauri 2 Android wrapper: android/
Voxply-web          ── Browser React client: web/
Voxply-discovery    ── Next.js hub discovery service
```

## The Voxply-server workspace

The canonical deployment unit is **Farm → Server → Hub** (see
[decisions.md](decisions.md), "Architecture: Farm → Server → Hub"): a
farm is the control plane, a server is a compute node running a server
agent, and a hub is the community space the agent spawns and manages.
Standalone `voxply-hub` binary usage is deprecated.

### `hub/` crate

A single hub. Owns:
- An axum HTTP+WebSocket API (port 3000 by default).
- A UDP voice relay (port 3001 by default).
- A SQLite database (`hub.db`).
- An outbox worker for federated DMs (`dm_worker.rs`).
- A federation client for talking to other hubs.
- Background workers: federated ban-list sync (`banlist_worker.rs`),
  data retention (`retention_worker.rs`), cert maintenance
  (`cert_worker.rs`).

Entry: `hub/src/main.rs` → `server.rs` (router setup), in Voxply-server.

Key submodules (all under `hub/src/` in Voxply-server):
- `auth/` — challenge-response signature auth (see [identity.md](identity.md))
- `routes/` — every HTTP endpoint, one file per resource
- `federation/` — hub-to-hub HTTP client + handlers
- `db/migrations.rs` — schema (see [data-model.md](data-model.md))

### `farm/` crate

The control plane. Manages a fleet of servers and the hubs running on
them: server registration (one-time tokens, `token.rs`), hub lifecycle
delegation to connected server agents (`hub_manager.rs`), reverse
proxying to hub processes (`proxy.rs`), and its own SQLite database.
Rationale in [decisions.md](decisions.md) ("Farm model phases 1 + 2"
and "phase 3") and design in [farm-model.md](farm-model.md) /
[farm-impl.md](farm-impl.md).

### `server/` crate

The server agent (`voxply-server` binary). Runs on each compute node,
reverse-connects to its farm over WebSocket (`agent.rs`), and spawns,
monitors, and stops local hub processes on the farm's behalf
(`hub_manager.rs`). No HTTP surface of its own.

### `seed/` crate

Cross-farm discovery (layer 5 in [farm-model.md](farm-model.md)): a
self-hostable registry where farms publish signed self-listings —
`POST/DELETE /farms/register`, public catalog at `GET /farms`, plus a
revalidation worker that re-checks registered farms.

### `identity/` crate

Ed25519 keypairs, BIP39 recovery phrases, proof-of-work helpers. No
networking, no storage. The hub consumes it directly, and it is the
**canonical wire-format authority**: signing bytes, key encodings, and
verification rules are defined by this crate. Non-Rust clients do not
link it — the Tauri shells carry their own `identity.rs`
(Voxply-desktop, Voxply-android) and the browser clients carry
TypeScript implementations (Voxply-web `web/src/identity/`,
Voxply-android `voxply-web/src/identity/`) — so each reimplementation
must match the crate byte-for-byte, validated against shared test
vectors. A wire-format spec with test vectors is being added at
`docs/wire-format.md` in Voxply-server.

- Lib entry: `identity/src/lib.rs` (Voxply-server)
- Recovery phrases: `identity/src/recovery.rs` (Voxply-server)
- PoW helpers (anti-spam, future): `identity/src/pow.rs` (Voxply-server)

### `voxply-store/` and `voxply-store-sqlite/` crates

The database abstraction layer. `voxply-store` defines domain-split
traits (`AuthStore`, `UserStore`, `MessageStore`, …) collected into a
`HubStore` super-trait plus a `StoreError` enum; `voxply-store-sqlite`
is the SQLite backend. The hub holds `Arc<dyn HubStore>` so backends
can be selected at runtime (a Postgres backend is the intended
community contribution). Rationale in [decisions.md](decisions.md)
("Database abstraction: trait-based store crate split") and design in
[store-trait-design.md](store-trait-design.md).

### `voice/` crate (in Voxply-desktop)

Audio pipeline: capture → denoise (RNNoise) → encode (Opus) → transport
→ decode → playback. Used by the desktop client and (in some flows) the
hub voice relay.

- Pipeline orchestration: `voice/src/pipeline.rs` (Voxply-desktop)
- Codec: `voice/src/codec.rs` (Voxply-desktop)
- UDP transport: `voice/src/transport.rs` (Voxply-desktop)
- Wire protocol: `voice/src/protocol.rs` (Voxply-desktop)

See [voice.md](voice.md) for the full data flow.

### `desktop/` (in Voxply-desktop)

Tauri 2 (Rust shell) + React 19 (UI). The Rust side handles file I/O,
voice, and OS integration; the React side is everything you see.

- React entry: `desktop/src/main.tsx` → `App.tsx` (Voxply-desktop)
- Tauri commands (Rust ↔ JS bridge): `desktop/src-tauri/src/lib.rs` (Voxply-desktop)

See [client.md](client.md) for the structure.

## Federation, briefly

Hubs are independent. They peer over HTTPS + WebSocket using their own
Ed25519 keypairs as identity. There's no central directory — you connect
to a hub by URL. Federation enables:

- **DMs across hubs** — sender's hub queues to recipient's hub via outbox.
- **Alliances** — named groups of peer hubs sharing channels and reactions.

See [federation.md](federation.md) for the protocol and
[alliances.md](alliances.md) for alliances.

## Why this shape

- **Hubs over a central server**: communities own their data and their
  moderation policy. Federation lets them stay connected without a single
  operator. (See [decisions.md](decisions.md).)
- **One canonical identity implementation**: identity rules must agree
  exactly between hub and clients. The Rust `identity/` crate in
  Voxply-server is the single source of truth for the wire format;
  client reimplementations (Rust shells and TypeScript) are verified
  against it with shared test vectors rather than linking the crate.
- **Farm → Server → Hub**: hubs are managed processes, not hand-run
  binaries, so fleet operations and hub creation have one control
  surface. (See [decisions.md](decisions.md).)
- **Tauri over Electron**: smaller binaries, native voice, real OS APIs.
