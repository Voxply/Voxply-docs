# Voxply Roadmap

Tracks **what's next, what's broken, and what we'd like to build but
haven't designed yet**. Everything else — architecture, design rationale,
shipped features, design questions — lives in the wiki at
[`docs/`](docs/README.md).

## 🔨 Next up

**Pre-launch blockers (P0):**
- **Group DMs plaintext warning** — group DMs are not E2E encrypted; users must be clearly told before entering one
- **Windows SmartScreen** — document the unsigned installer workaround in CHANGELOG.md and README.md

**Pre-launch blockers (P1):**
- **Multi-device Tauri commands** — verify/wire `subkey_issue`, `prefs_sync_push/pull`, `pairing_offer_create`, `pairing_poll`, `device_list`, `device_revoke` on the `src-tauri/` side
- **Demo hub** — deploy a Voxply-operated instance and flip `DEMO_HUB_URL` from `null`
- **Observability** — structured JSON logging, optional Sentry DSN, request-id middleware, basic `/metrics` endpoint

**Pre-launch polish (P2):**
- **Cert bootstrap caveat** — ensure `cert_mode` defaults to `'none'`; add admin warning about day-1 lockout
- **Recovery contact flow docs** — in-app step-by-step guide for the out-of-band rotation request flow

## 🚧 Blocked

_(nothing blocked)_

## 📌 Wishlist (undesigned)

Things we want to build but haven't committed to a design yet. Designed
items live in the wiki — see
[`future-features.md`](docs/future-features.md),
[`gaming.md`](docs/gaming.md).

- **E2E group DMs** — Signal-style sender-key scheme (v2 of e2e-encryption.md); blocks until 1:1 E2E is proven stable
- **Windows Authenticode code signing** — needs certificate procurement; unblocks SmartScreen warning permanently
- **Missions system** — self-funding via sponsor-attested cosmetic actions; needs operator and anti-fraud design (see monetization.md)
- **Gaming Tier 3** — MMO + proximity voice; stretch goal

## 🧭 Designed, not started

_(nothing)_

## ⚠️ Known issues

- **Group DMs are plaintext** — hub operator can read group DM content; 1:1 DMs are E2E encrypted. Warning UI pending (Task #29)
- **Windows installer unsigned** — users see SmartScreen "Unknown publisher" warning; documentation pending (Task #30)

## 💤 Won't do

- **Load-aware DM routing across a user's hubs** — failover only; load-balancing needs gossip + cross-hub consistency. See [decisions.md](docs/decisions.md)
- **Concurrent mic test while in voice** — two cpal input streams unreliable cross-platform; live meter covers it
