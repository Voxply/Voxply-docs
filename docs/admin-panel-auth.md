# Admin Panel Auth — Archived

This design (Ed25519 challenge-signing + TOTP for a hub web admin panel) was
designed and implemented, then reverted.

**Reason:** The hub web admin panel was removed entirely. Hub management belongs
in the desktop client. Hub ownership is established at creation time through the
client wizard; there is no runtime bootstrapping problem requiring a web panel.

See `decisions.md` for the recorded decisions:
- "Hub admin panel removed"
- "Architecture: Farm → Server → Hub"

The farm panel (server-operator infrastructure view) uses simple static-token
auth (`web_admin_token` in `farm.toml`) and is not covered by this doc.
