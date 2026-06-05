# Voxply Roadmap

Tracks **what's next, what's broken, and what we'd like to build but
haven't designed yet**. Everything else — architecture, design rationale,
shipped features, design questions — lives in the wiki at
[`docs/`](docs/README.md).

## 🔨 Next up

## 🚢 Pre-launch checklist

Work through these in order before shipping. Goal: reach a state where the
only remaining work is polish and responding to user feedback.

### Blockers (must fix before any public release)

- [ ] **Windows code-signing** — procure EV cert via SignPath.io OSS tier;
  wire `WINDOWS_CERT_THUMBPRINT` secret into `release.yml` CI. Without this,
  every Windows user hits a SmartScreen "Windows protected your PC" wall.
  See [`code-signing.md`](docs/code-signing.md).

- [ ] **Fix server panics in games.rs** — replace ~10 bare `.unwrap()` calls
  on `Mutex::lock()` and `serde_json::to_string()` (lines 114, 248, 317, 394,
  404, 506, 569, 594, 602, 707 in `hub/hub/src/routes/games.rs`).
  A poisoned mutex or bad serialization crashes the whole hub process.

- [ ] **Deploy the demo hub** — flip `DEMO_HUB_URL` constant so "Try a demo
  hub" works. New users downloading the desktop app currently have no quick
  way to experience Voxply without also running a server themselves.

### Server

- [ ] **Health-check endpoint** — `GET /health` returning version, uptime, and
  DB status. Required for any ops monitoring and load balancer probes.

- [ ] **Rate-limit auth endpoints** — brute-force protection on
  `POST /auth/login` and `/auth/challenge` before public exposure.

- [ ] **Document game permissions gap** — `set_game_permissions` is currently
  a no-op (hub has no backing route). Either implement capability grants for
  games or add a clear notice in the admin UI so operators know it has no
  effect yet.

### Client

- [ ] **Hub join error messages** — "Join hub by URL" shows raw error strings
  on failure (unreachable server, wrong URL, auth error). Replace with
  user-readable messages.

- [ ] **First-run experience** — new users land with no guidance: create
  identity → join or create a hub → basic tooltips/welcome flow.

- [ ] **Discovery dead-end** — hubs can set tags (`set_discovery_tags`) but
  there is no public hub directory yet, so tagging has no effect from a user's
  perspective. Either hide discovery settings until the index exists, or show
  an explicit "coming soon" note in the admin panel.

### Discovery

- [ ] **Public hub directory (minimal)** — even a simple static listing of
  opt-in hubs would let self-hosters be found. Full dynamic suite
  (uptime tracking, global search, farm catalog) is Wishlist — but some
  form of directory is needed for self-hosting to have network value.

### Documentation

- [ ] **User-facing README / getting-started guide** — what is Voxply,
  download link, how to join a hub, key concepts (identity, certifications,
  badges). Currently `docs/` is architecture reference only.

- [ ] **Hub operator guide** — env vars, first-run bootstrap, backup/restore,
  upgrade path, basic hardening checklist.

- [ ] **Games SDK reference** — postMessage API surface, event types,
  shared-KV, voice zones. Needed for third-party game developers to build on
  the platform.

## 🚧 Blocked

- **Demo hub** — code is ready (`DEMO_HUB_URL` constant + conditional button). Blocked on ops: a Voxply-operated hub instance needs to be deployed and the constant flipped to its URL before the "Try a demo hub" button goes live.

## 📌 Wishlist (undesigned)

Things we want to build but haven't committed to a design yet. Designed
items live in the wiki — see
[`future-features.md`](docs/future-features.md),
[`gaming.md`](docs/gaming.md).

### Carry-over

- **Gaming Tier 3** — MMO + persistent shared world; stretch goal.
  Proximity voice is already a general platform primitive; only the
  persistent-world layer is undesigned.

## 🚀 Recently shipped

- **Cert/badge, game management, discovery Tauri commands** — all remaining
  missing commands wired: `get_cert_settings`, `list_issued_certs`, `save_cert_settings`,
  `issue_cert`, `revoke_cert`, `fetch_my_certs`, `list_badges`, `list_pending_badges`,
  `accept_badge`, `decline_badge`, `remove_badge`, `grant_badge`, `list_admin_games`,
  `fetch_game_manifest`, `install_game`, `uninstall_game`, `set_game_permissions`,
  `set_game_channels`, `game_list_channel_users`, `game_post_message`,
  `game_get_recent_messages`, `game_kv_get`, `game_kv_set`, `get_discovery_settings`,
  `set_discovery_tags`. Hub also gained `GET /admin/settings/certs` and nsfw support
  on `GET/PATCH /admin/settings/tags`.
- **Forum channels** — `forum_list_posts`, `forum_get_post`, `forum_create_post`,
  `forum_create_reply`, `forum_get_post_replies`, `forum_pin_post`, `forum_lock_post`
  Tauri commands wired; hub routes and UI components (`ForumPostList`, `ForumPostDetail`,
  `ForumComposer`) were already complete. Design in [`forum.md`](docs/forum.md).
- **Block / ignore / DND persistence** — `load_ignored_users` / `save_ignored_users` and
  `load_dnd_settings` / `save_dnd_settings` Tauri commands added; App.tsx seeds both
  states from disk on startup. Phase 1+2 client-side block/ignore is now fully persistent.
  Design in [`block-mute-ignore.md`](docs/block-mute-ignore.md).
- **Multi-stream screen share overlay** — floating, draggable, resizable `ScreenShareOverlay`
  replaces the inline viewer; multiple co-op streams tile in a CSS grid. Hub cap removed —
  unlimited concurrent sharers per channel. Design in [`decisions.md`](docs/decisions.md).
- **E2E group DMs** — sender-key scheme (Signal-style); hub endpoints + Tauri commands +
  desktop client all complete. Design in [`e2e-encryption.md`](docs/e2e-encryption.md).

- **Whisper UI** — `useWhisper` hook with inbound event tracking and
  list persistence. `WhisperPanel` in the voice bar with User/Channel/Saved
  Lists tabs, target checkboxes, one-click activate, save-as-list form.
  Inbound whisper badge on participant rows in the channel sidebar.
  Design in [`whisper.md`](docs/whisper.md).
- **Hub server operations** — backup/restore CLI, data retention sweep,
  Prometheus `/metrics`, hub key rotation (`voxply-hub rotate-key` +
  `GET /key-rotation`). Design in [`hub-operations.md`](docs/hub-operations.md).
- **Hub admin tooling** — web admin panel at `/admin/panel` (token-gated,
  embedded HTML), `voxply-hub admin` CLI subcommands, farm heartbeat +
  fleet console. Design in [`hub-admin-panel.md`](docs/hub-admin-panel.md).
- **Hub moderation enhancements** — federated ban lists (`GET /federation/banlist`,
  6h background sync), auto-mod webhook (500ms, fail-open, HMAC-SHA256),
  content reporting (`POST /messages/:id/report`, admin review queue).
  Design in [`moderation-enhancements.md`](docs/moderation-enhancements.md).
- **Discovery: full suite** — hub uptime tracking, global search, farm
  browsing catalog, anonymous aggregate analytics, hub config template
  catalog, hub creation wizard (`/new`). Design in
  [`discovery-v2.md`](docs/discovery-v2.md) and
  [`hub-creation-wizard.md`](docs/hub-creation-wizard.md).
- **Hub first-run bootstrap** — `VOXPLY_TEMPLATE_URL` / `VOXPLY_BOOTSTRAP_TOKEN`
  on empty-DB first launch; applies channels, roles, hub name from template.
  Design in [`hub-creation-wizard.md`](docs/hub-creation-wizard.md).
- **Client quality-of-life** — global message search (FTS5), message drafts,
  custom emojis per hub, events/calendar (`EventCard`, `EventsPanel`),
  native polls (`PollCard`, live bars), thread collapse/expand, notification
  grouping (3s per-hub debounce). Design in [`client-qol.md`](docs/client-qol.md).
- **Events / calendar** — `hub_events` + `event_rsvps` tables, full REST,
  `EventCard`, `EventsPanel`, Tauri commands. Design in [`client-qol.md`](docs/client-qol.md).
- **Native polls** — `polls` + `poll_votes`, live broadcast, `PollCard`,
  Tauri command. Design in [`client-qol.md`](docs/client-qol.md).
- **Video in voice channels** — WebRTC mesh, active-speaker management
  (top-3, 3s linger), `VideoGrid` (equal grid ≤4, active-speaker+thumbnails
  5+, self-view overlay), `BackgroundProcessor` (MediaPipe none/blur/image),
  camera toggle + background picker in voice bar, hub signaling envelopes.
  Scale: mesh works up to ~20; SFU hook designed-in for large events.
  Design in [`video-voice.md`](docs/video-voice.md).
- **Voice advanced settings** — Standard / Music / Custom audio quality
  profiles. `EffectiveVoiceConfig` resolved at pipeline start; Denoiser
  bypass; VAD gate per-profile; custom Opus bitrate, app mode, channels,
  frame size, complexity. Settings persisted to `voice.json`.
  Design in [`voice-advanced-settings.md`](docs/voice-advanced-settings.md).
- **Windows Authenticode signing** — CI signing wired in `release.yml`;
  activates once `WINDOWS_CERT_THUMBPRINT` secret is set (cert
  procurement via SignPath.io OSS tier still pending).
- **Missions system** — API routes in Voxply-discovery, Missions panel +
  PoW claim flow in desktop, spark balance + cosmetic catalog with
  entitlement blobs. Design in [`missions.md`](docs/missions.md).
- **Per-participant voice volume** — `sender_id` in UDP fan-out,
  per-sender gain pipeline, volume slider in channel sidebar, persistence
  to `voice_gains.json`. Design in [`voice-volume.md`](docs/voice-volume.md).
- **Proximity voice** — voice zones in hub (WS protocol, in-memory state,
  `manage_voice` permission), client-side attenuation (4 models), game SDK
  calls (`voxply:createVoiceZone`, `voxply:setVoicePosition`). Design in
  [`proximity-voice.md`](docs/proximity-voice.md).
- **Gaming Tier 2 client SDK** — `voxply:game:ready/start/send/end/
  snapshot/sharedKvGet|Set/setJoinPolicy` postMessage calls, incoming
  event delivery to iframe, Activities live-session badge, session
  create/join/leave Tauri commands. Full Tier 2 now complete.

## ⚠️ Known issues

- **Windows installer unsigned** — users see SmartScreen "Windows protected your PC" warning; workaround: "More info → Run anyway". Permanent fix once EV cert is procured (see code-signing.md).

## 💤 Won't do

- **Load-aware DM routing across a user's hubs** — failover only; load-balancing needs gossip + cross-hub consistency. See [decisions.md](docs/decisions.md)
- **Concurrent mic test while in voice** — two cpal input streams unreliable cross-platform; live meter covers it
