# Architecture

Voxply is six repositories. The hub backend lives in one Rust workspace;
each client and the discovery service is its own repo.

## The repository map

```
Voxply              ── docs, ROADMAP.md, openapi.yaml (this repo)
Voxply-server       ── Rust workspace: hub/, seed/, identity/ crates
Voxply-desktop      ── Tauri 2 + React desktop client: desktop/, voice/
Voxply-android      ── Tauri 2 Android wrapper: android/
Voxply-web          ── Browser React client: web/
Voxply-discovery    ── Next.js hub discovery service
```

### `identity/` crate (in Voxply-server)

Ed25519 keypairs, BIP39 recovery phrases, proof-of-work helpers. No
networking, no storage. Both the hub and the desktop client depend on it
so that signing and verification use the exact same code.

- Lib entry: `identity/src/lib.rs` (Voxply-server)
- Recovery phrases: `identity/src/recovery.rs` (Voxply-server)
- PoW helpers (anti-spam, future): `identity/src/pow.rs` (Voxply-server)

### `voice/` crate (in Voxply-desktop)

Audio pipeline: capture → denoise (RNNoise) → encode (Opus) → transport
→ decode → playback. Used by the desktop client and (in some flows) the
hub voice relay.

- Pipeline orchestration: `voice/src/pipeline.rs` (Voxply-desktop)
- Codec: `voice/src/codec.rs` (Voxply-desktop)
- UDP transport: `voice/src/transport.rs` (Voxply-desktop)
- Wire protocol: `voice/src/protocol.rs` (Voxply-desktop)

See [voice.md](voice.md) for the full data flow.

### `hub/` crate (in Voxply-server)

A single hub. Owns:
- An axum HTTP+WebSocket API (port 3000 by default).
- A UDP voice relay (port 3001 by default).
- A SQLite database (`hub.db`).
- An outbox worker for federated DMs (`dm_worker.rs`).
- A federation client for talking to other hubs.

Entry: `hub/src/main.rs` → `server.rs` (router setup), in Voxply-server.

Key submodules (all under `hub/src/` in Voxply-server):
- `auth/` — challenge-response signature auth (see [identity.md](identity.md))
- `routes/` — every HTTP endpoint, one file per resource
- `federation/` — hub-to-hub HTTP client + handlers
- `db/migrations.rs` — schema (see [data-model.md](data-model.md))

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
- **Shared identity crate**: identity rules must agree exactly between
  hub and client. The `identity/` crate ships from Voxply-server and is
  consumed by clients that link to it directly.
- **Tauri over Electron**: smaller binaries, native voice, real OS APIs.
