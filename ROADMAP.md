# Voxply Roadmap

Tracks **what's next, what's broken, and what we'd like to build but
haven't designed yet**. Everything else — architecture, design rationale,
shipped features, design questions — lives in the wiki at
[`docs/`](docs/README.md).

## 🔨 Next up

- **Farm Phase 1 — client integration** — hub advertises `farm_url` in `GET /info`;
  clients need to branch on it and route `/auth/*` calls to the farm URL instead of
  the hub. Desktop, web, and Android. No new UI — transparent to the user.
- **Farm Phase 3 (admin panel)** — creation policy (`open`/`admin_only`/`disabled`),
  `PATCH /farm/settings`, hub suspend/delete admin UI, user index. Detailed design
  in [`farm-impl.md`](docs/farm-impl.md).

## 🚧 Blocked

_(nothing blocked)_

## 📌 Wishlist (undesigned)

Things we want to build but haven't committed to a design yet. Designed
items live in the wiki — see
[`future-features.md`](docs/future-features.md),
[`farm-model.md`](docs/farm-model.md),
[`gaming.md`](docs/gaming.md).

- **Performance ceiling** — load test WS broadcast, search, voice relay
- **Accessibility + i18n** — keyboard nav audit, screen-reader, localization

## 🧭 Designed, not started

_(Farm Phase 2 shipped — see commit history)_

## ⚠️ Known issues

_(none currently)_

## 💤 Won't do

- **Load-aware DM routing across a user's hubs** — failover only; load-balancing needs gossip + cross-hub consistency. See [decisions.md](docs/decisions.md)
- **Concurrent mic test while in voice** — two cpal input streams unreliable cross-platform; live meter covers it
