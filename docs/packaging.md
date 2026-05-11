# Packaging & Release

How Voxply ships to end users across Windows, macOS, and Linux, and how
the hub server is distributed to operators. The Tauri 2 bundler does the
heavy lifting; this doc captures what surrounds it — signing, updates,
CI, and the secrets matrix.

---

## 1. Target platforms and formats

Tauri 2's bundler produces all of these via `tauri build --bundles`. No
custom packaging scripts.

| Platform | Primary format | Secondary | Notes |
|---|---|---|---|
| Windows | `.exe` (NSIS) | `.msi` (WiX) | NSIS gives a friendlier installer UX; MSI for enterprise / Group Policy |
| macOS | `.dmg` (universal) | — | Single universal binary — `x86_64-apple-darwin` + `aarch64-apple-darwin` lipo'd together |
| Linux | `.AppImage` | `.deb`, `.rpm` | AppImage works on every distro; `.deb`/`.rpm` for users who want package-manager integration |

Mobile (iOS / Android) is deferred — see Open questions.

---

## 2. Code signing

Two tiers: **dev builds** ship unsigned (CI artifact, devs and early
testers click through OS warnings); **release builds** are signed and
notarized where the platform requires it.

### Windows — Authenticode

- **Updater signature**: `TAURI_SIGNING_PRIVATE_KEY` (Tauri's own Ed25519
  key, not a code-signing cert) signs the update payload.
- **Authenticode**: standard or EV cert signs the `.exe` / `.msi`. EV
  cert (or Azure Trusted Signing) earns immediate SmartScreen trust;
  standard cert builds reputation over time.
- **Dev builds**: unsigned. Users see a SmartScreen warning ("More info"
  → "Run anyway"). Acceptable pre-1.0.

### macOS — Developer ID + notarization

Mandatory for Gatekeeper. Without notarization the app refuses to launch
on a fresh Mac.

| Env var | Purpose |
|---|---|
| `APPLE_CERTIFICATE` | Developer ID Application cert, base64-encoded `.p12` |
| `APPLE_CERTIFICATE_PASSWORD` | Passphrase for the `.p12` |
| `APPLE_ID` | Apple ID used for notarization |
| `APPLE_PASSWORD` | App-specific password (not the AppleID password) |
| `APPLE_TEAM_ID` | Developer team ID |

Entitlements required (in `macos.entitlements.plist`):

- `com.apple.security.device.microphone` — voice capture
- `com.apple.security.device.camera` — webcam (screen share v2)
- Hardened runtime enabled (notarization requirement)

### Linux — optional GPG

No mandatory signing on Linux. We may GPG-sign the AppImage so users
who care can verify. Distro-package repos (PPA, COPR) are out of scope
for now.

---

## 3. Auto-update (`tauri-plugin-updater`)

### Wire-up

- Add `tauri-plugin-updater` to `Cargo.toml` and register it in
  `tauri.conf.json` under `plugins.updater`.
- Endpoint: `https://releases.voxply.io/latest.json` (cuttable to GitHub
  Releases API in development).

### Update manifest shape

Tauri 2 updater JSON, served from the endpoint:

```
{
  "version": "0.2.0",
  "notes": "...",
  "pub_date": "2026-06-01T12:00:00Z",
  "platforms": {
    "windows-x86_64":  { "url": "...", "signature": "..." },
    "darwin-aarch64":  { "url": "...", "signature": "..." },
    "darwin-x86_64":   { "url": "...", "signature": "..." },
    "linux-x86_64":    { "url": "...", "signature": "..." }
  }
}
```

### Update signing key

- Separate Ed25519 keypair, generated via `tauri signer generate`.
- **Private key** → CI secret (`TAURI_SIGNING_PRIVATE_KEY`,
  `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`).
- **Public key** → embedded in `tauri.conf.json` at
  `plugins.updater.pubkey`. Rotating it requires shipping a release; we
  treat the keypair as long-lived.

### UX

- Check on startup, non-blocking.
- Toast on available update: "Voxply v0.x.y is available — restart to
  update."
- Silent background download. Apply on next restart. No forced
  interruptions.

---

## 4. GitHub Actions CI/CD

Two workflows. **Describe their structure; do not write the YAML here.**

### `release.yml` — on `git tag v*`

| Step | Notes |
|---|---|
| Matrix | `windows-latest`, `macos-latest`, `ubuntu-22.04` |
| Checkout | shallow, with tags |
| Setup Node | LTS (currently 20.x) |
| Setup Rust | stable; on macOS add both `x86_64-apple-darwin` and `aarch64-apple-darwin` targets |
| Install `tauri-cli` | `cargo install tauri-cli --version "^2"` |
| Build | `tauri build`; macOS uses `--target universal-apple-darwin` |
| Upload | Attach artifacts to the GitHub Release for the tag |

### `build.yml` — on PR and push to `main`

| Step | Notes |
|---|---|
| Matrix | same three OSes (catch platform-specific compile breakage) |
| Setup Rust + Node | as above, no Tauri targets needed |
| Validate | `cargo check --workspace` + `tsc --noEmit` in `client/voxply-desktop` |
| No bundling | No installers, no signing — fast PR feedback |

### Secrets matrix

| Secret | Used by | Required for |
|---|---|---|
| `TAURI_SIGNING_PRIVATE_KEY` | all platforms | Updater payload signature |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | all platforms | Updater key passphrase |
| `APPLE_CERTIFICATE` | macOS | Code signing |
| `APPLE_CERTIFICATE_PASSWORD` | macOS | Code signing |
| `APPLE_ID` | macOS | Notarization |
| `APPLE_PASSWORD` | macOS | Notarization (app-specific password) |
| `APPLE_TEAM_ID` | macOS | Notarization |

Windows code-signing secrets (cert + passphrase, or Azure Trusted
Signing creds) are added when an Authenticode cert is procured. Until
then, Windows release builds are unsigned with an explicit caveat in the
release notes.

---

## 5. Hub server distribution

The hub (`server/voxply-hub`) is a separate Rust binary with its own
release shape — no Tauri, no updater. Two artifacts per release:

### Docker image

- `server/voxply-hub/Dockerfile`: multi-stage build.
  - Stage 1: `rust:1-slim` builds the binary.
  - Stage 2: `gcr.io/distroless/cc` runs it. Distroless = no shell,
    no package manager, tiny attack surface.
- Exposes port `3000` (HTTP/WS) and `3001/udp` (voice).
- Pushed to `ghcr.io/voxply/hub:<version>` and `:latest` on tag.

### Static binary

- `cargo build --release --target x86_64-unknown-linux-musl` for a
  portable single-file binary. Drops into `/usr/local/bin/voxply-hub` on
  any Linux distro without runtime deps.

### Environment

| Var | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | `sqlite://hub.db` | SQLite path |
| `BIND_ADDR` | `0.0.0.0:3000` | HTTP/WS listener |
| `HUB_IDENTITY_PATH` | `~/.voxply/hub_identity.json` | Ed25519 keypair location |
| `VOICE_UDP_PORT` | `3001` | Voice relay UDP socket |

### Docker Compose for self-hosters

The release ships a sample `docker-compose.yml` that runs the hub
image, mounts a volume for the SQLite file + identity, maps ports 3000
(TCP) and 3001 (UDP), and wires the env vars above. Operators who want
TLS terminate it in a reverse proxy (Caddy / nginx); see `hosting.md`.

---

## 6. Versioning

- **Semver**. `v0.x.y` until the wire protocol stabilises.
- **Client and hub share a single tag** — monorepo = one tag covers
  both. Mismatched client/hub versions are an operator concern only when
  someone runs a non-release build of one against the other.
- **`CHANGELOG.md`** at repo root, [Keep a Changelog](https://keepachangelog.com/)
  format. Sections: Added / Changed / Deprecated / Removed / Fixed /
  Security.
- **Minor bump on breaking wire protocol changes** (between major-zero
  releases this is our breaking-change signal). Patch bumps are
  protocol-compatible.

---

## 7. `tauri.conf.json` additions

Fields to add when packaging lands. Described, not written:

- `bundle.active: true` — enable the bundler in `tauri build`.
- `bundle.targets: ["nsis", "dmg", "appimage"]` — primary formats.
  Secondary formats (`msi`, `deb`, `rpm`) can be added per-platform.
- `bundle.icon` — paths to platform-specific icons
  (`icons/icon.icns`, `icons/icon.ico`, `icons/icon.png`).
- `plugins.updater.pubkey` — public half of the updater signing key.
- `plugins.updater.endpoints` — array containing the
  `releases.voxply.io/latest.json` URL.
- `bundle.macOS.entitlements` — path to the entitlements plist (mic +
  camera + hardened runtime).
- `bundle.macOS.minimumSystemVersion` — pin to a sane floor (e.g.
  `10.15`).

The `identifier` (`com.voxply.desktop`), `productName` (`Voxply`), and
`version` already exist and don't change.

---

## 8. Open questions

- **Hub auto-update**: Tauri updater doesn't apply to the hub binary.
  Options: `systemd` unit with `ExecStartPre` pulling a new Docker
  image; Watchtower or similar for container hosts; or fully manual.
  Deferred — operators currently update on their own cadence.
- **Mobile (iOS / Android)**: Tauri 2 supports both, but each has its
  own signing pipeline, its own store policy, and (on iOS) sandboxing
  that conflicts with `voxply://` and free voice access. Deferred until
  the desktop story is stable.
- **Windows Store / Mac App Store**: store sandboxing breaks the
  `voxply://` deep link, breaks unrestricted filesystem access for
  attachments, and on macOS forbids the entitlements we need. Not worth
  pursuing.
- **Delta updates**: Tauri's updater downloads the full installer each
  time. At current binary size (tens of MB) this is acceptable for v1.
  Revisit if the binary balloons or if mobile lands (cellular concerns).

