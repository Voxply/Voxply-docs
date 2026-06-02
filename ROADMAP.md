# Voxply Roadmap

Tracks **what's next, what's broken, and what we'd like to build but
haven't designed yet**. Everything else — architecture, design rationale,
shipped features, design questions — lives in the wiki at
[`docs/`](docs/README.md).

## 🔨 Next up

_(nothing — all pre-launch blockers are resolved)_

## 🚧 Blocked

- **Demo hub** — code is ready (`DEMO_HUB_URL` constant + conditional button). Blocked on ops: a Voxply-operated hub instance needs to be deployed and the constant flipped to its URL before the "Try a demo hub" button goes live.

## 📌 Wishlist (undesigned)

Things we want to build but haven't committed to a design yet. Designed
items live in the wiki — see
[`future-features.md`](docs/future-features.md),
[`gaming.md`](docs/gaming.md).

- **E2E group DMs** — Signal-style sender-key scheme (v2 of e2e-encryption.md); blocks until 1:1 E2E is proven stable
- **Windows Authenticode code signing** — needs certificate procurement; unblocks SmartScreen warning permanently
- **macOS universal binary (arm64 + x86_64)** — blocked by `audiopus_sys v0.1.8` which compiles Opus for the host arch only; current macOS DMG is arm64 (Apple Silicon). Fix requires upgrading the audio stack to a crate that supports fat library compilation.
- **Missions system** — self-funding via sponsor-attested cosmetic actions; needs operator and anti-fraud design (see monetization.md)
- **Gaming Tier 3** — MMO + proximity voice; stretch goal
- **OS-level picture-in-picture for screen share** — second always-on-top Tauri window keeps the viewer alive when the main app is minimized; builds on the "Floating overlay" layout already designed in screen-share.md
- **Multiple audio output device routing** — assign different speakers/headsets per voice participant or globally; device enumeration already in `voice/src/devices.rs`
- **Multi-stream overlay** — view N simultaneous sharers in a channel as independent movable overlays; requires lifting the one-sharer-per-channel cap (open question in screen-share.md)
- **Cross-channel stream subscription** — subscribe to a screen share from channel B while staying in voice in channel A; decouples stream viewing from voice membership; see future-features.md

## 🧭 Designed, not started

_(nothing)_

## ⚠️ Known issues

- **Group DMs are plaintext** — hub operator can read group DM content; 1:1 DMs are E2E encrypted. Warning shown before entering group DMs. E2E group DMs (sender-key scheme) are in the wishlist.
- **Windows installer unsigned** — users see SmartScreen "Windows protected your PC" warning; workaround documented in CHANGELOG.md (`More info → Run anyway`). Permanent fix requires Authenticode cert procurement (see Wishlist).

## 💤 Won't do

- **Load-aware DM routing across a user's hubs** — failover only; load-balancing needs gossip + cross-hub consistency. See [decisions.md](docs/decisions.md)
- **Concurrent mic test while in voice** — two cpal input streams unreliable cross-platform; live meter covers it
