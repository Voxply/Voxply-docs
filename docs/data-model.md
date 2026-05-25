# Data Model

The hub uses SQLite (via sqlx). Schema migrations live in one file:
`hub/src/db/migrations.rs` (in Voxply-server). This page is a map, not the
schema — read the migrations file for column-level detail.

## Tables by concern

### Identity & membership
- `users` — pubkey-keyed user rows local to this hub
- `roles`, `role_permissions`, `user_roles` — role bundles + assignments
- `hub_settings` — single-row config for this hub
- `bans`, `mutes`, `timeouts` — moderation state

### Channels & messages
- `channels` — **one table for both categories and rooms**.
  `is_category` boolean splits them; `parent_id` (self-referential) lets
  any channel nest under another. **No `kind` column** — every non-
  category channel is unified text + voice (see [decisions.md](decisions.md)).
- `messages` — local channel messages (text history)
- `reactions` — emoji × message × user
- (attachments are stored inline as a JSON column on `messages`,
  not a side table)
- (mention tracking is computed from message bodies, not a separate
  table)

Voice is **runtime state**, not a table — `state.voice_channels` is an
in-memory map of `channel_id → set of public keys currently connected`.
There's no persistent record of who was in voice when.

### DMs
- `dms` — local DM messages (both inbox and sent)
- `dm_outbox` — pending outbound federated DMs (the worker drains this)

### Federation
- `peer_hubs` — hubs we know about (URL + pubkey)
- `federated_messages` — cached messages pulled from peer hubs

### Alliances
- `alliances` — id + metadata
- `alliance_members` — hub pubkeys per alliance
- `alliance_shared_channels` — which local channels we share

### Notifications & prefs
- `notification_settings` — three-state per scope (all / mentions / silent)

## Conventions

- **IDs are TEXT** — UUID strings, generated client- or server-side
  depending on the resource.
- **Timestamps are INTEGER** — unix seconds (or ms in some places; check
  the column).
- **Pubkeys are TEXT** — hex-encoded Ed25519 pubkey.
- **No cross-table foreign keys to peer hubs**. Federated rows reference
  remote ids by string only — the source hub is authoritative.

## Migration strategy

Migrations are idempotent `CREATE TABLE IF NOT EXISTS` + `ALTER TABLE`
statements. We do not version-stamp the schema. New tables/columns
are added; we don't drop or rename in place.

## Querying

All query code is in `hub/src/routes/*.rs` (Voxply-server) next to the
endpoint that owns the data. There's no separate repository layer — sqlx
queries are written inline with `sqlx::query!`/`query_as!` macros for
compile-time checking.
