# Voxply Roadmap

Tracks **what's next, what's broken, and what we'd like to build but
haven't designed yet**. Everything else — architecture, design rationale,
shipped features, design questions — lives in the wiki at
[`docs/`](docs/README.md).

## 🔨 Next up

- **External bots — backend completion** — foundation shipped (migrations, auth,
  CRUD routes, slash dispatch, ephemeral messages, incoming webhooks). Still needed:
  - `hub/src/bots/events.rs` — event subscription fan-out: publish hub events to
    subscribed bot WS sessions, write to `hub_audit_log` (design: `docs/bots.md` §8)
  - Component interaction dispatch — `component_interaction` WS envelope → signed
    webhook POST → `ComponentResponse` apply (design: `docs/bots.md` §11)
  - `GET /admin/audit-log` route — paginated, filterable (design: `docs/bots.md` §8)
  - Event replay on reconnect — `seq` on audit log, `resume` / `replay_complete`
    envelopes (design: `docs/bots.md` §12)
  - `token_expiring_soon` WS push 72 h before session expiry (design: `docs/bots.md` §1)

- **External bots — remaining UI** — backend and rendering are shipped. Still needed:
  - Wire `handleComponentInteract` in desktop + web clients once component dispatch lands
  - Bot hover/click card — avatar, name, description, commands list, "automated account"
    notice (design: `docs/bots.md` §10)
  - Hub Settings → Bots tab: external invite flow (paste pubkey → copy invite token)
    + per-bot channel scope selector (desktop + web)
  - Hub Settings → Integrations → Incoming Webhooks (create, copy URL, delete;
    desktop + web)

- **Android client — bots rendering parity** — BOT/APP badges, ephemeral message
  styling, `MessageEmbeds`, `MessageComponents`, and updated member list not yet
  ported to Android (`C:\repo\Voxply\android`). Same changes as web client.

- **Activities button** — design complete (`docs/gaming.md`). Channel toolbar button
  opens a game picker modal over hub-installed games; feeds the same Tier 1 iframe
  sandbox. Implement in desktop + web clients.

## 🚧 Blocked

_(nothing blocked)_

## 📌 Wishlist (undesigned)

Things we want to build but haven't committed to a design yet. Designed
items live in the wiki — see
[`future-features.md`](docs/future-features.md),
[`farm-model.md`](docs/farm-model.md),
[`gaming.md`](docs/gaming.md).

_(moved to Next up)_
- **Performance ceiling** — load test WS broadcast, search, voice relay
- **Accessibility + i18n** — keyboard nav audit, screen-reader, localization

## ⚠️ Known issues

_(none currently)_

## 💤 Won't do

- **Load-aware DM routing across a user's hubs** — failover only; load-balancing needs gossip + cross-hub consistency. See [decisions.md](docs/decisions.md)
- **Concurrent mic test while in voice** — two cpal input streams unreliable cross-platform; live meter covers it
