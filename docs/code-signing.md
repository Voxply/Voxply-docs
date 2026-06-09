# Windows Code Signing (Authenticode)

How the Voxply desktop app (Voxply-desktop) earns Windows' trust so users
stop seeing SmartScreen's "Windows protected your PC" on first run. Today
the NSIS `.exe` installer is unsigned; the workaround documented in
Voxply-desktop's `CHANGELOG.md` is "More info → Run anyway". This doc
designs the path to Authenticode signing and where it slots into CI.

The **updater payload signature** (`TAURI_SIGNING_PRIVATE_KEY`, Ed25519,
documented in `packaging.md` section 3) is a separate concern — it proves
an update came from us. Authenticode proves the installer did, to the OS.

---

## Decision 1 — EV certificate, not OV

**Decision**: buy an **Extended Validation (EV)** code-signing certificate,
not an Organisation Validation (OV) one.

**Alternative considered — OV**: cheaper (~$100–250/yr) and easier to
obtain. The fatal problem is SmartScreen reputation: an OV-signed binary
still shows the warning until the certificate accumulates enough install
reputation — typically 6–12 months and thousands of clean installs. For a
low-volume open-source project that threshold may never be reached, so the
warning could be effectively permanent.

**Why EV won**: EV certificates are trusted by SmartScreen **immediately**
— no reputation accumulation. The friction disappears on day one of the
first signed release. The cost (~$300–600/yr) is higher, but it buys a
deterministic outcome instead of an open-ended wait. For a project whose
whole onboarding pitch is "this is safe, not a sketchy download," removing
the scary dialog from first run is worth the premium.

**Tradeoff**: EV mandates key storage on an HSM (hardware or cloud), which
constrains how CI signs. See Decision 2.

---

## Decision 2 — Cloud HSM (SignPath free OSS tier), not a physical token

**Decision**: store the EV key in a **cloud HSM** and sign from CI. First
choice: **SignPath.io's free tier for open-source projects**, which provides
a cloud HSM and an EV certificate at no cost to qualifying OSS projects —
no physical token to mail around. Commercial fallback if SignPath
eligibility lapses: **DigiCert** or **Sectigo** EV with their cloud
KeyLocker / KeyVault offering.

**Alternative considered — physical USB token**: the traditional EV
delivery method. Rejected for a CI-first project: a hardware token cannot
be plugged into an ephemeral GitHub Actions runner. The alternatives are a
self-hosted runner with the token attached (operational burden, a single
point of failure, a secret sitting in a drawer) or manual local signing of
every release (defeats the automated release pipeline in `packaging.md`
section 4).

**Why cloud HSM won**: it is the only EV option that is CI-friendly. The
key never leaves the HSM; CI authenticates to the HSM and asks it to sign a
hash. SignPath's free OSS tier removes the cost objection that deferred
signing in the first place (`packaging.md` section 2 noted Azure Trusted
Signing at ~$9/month as the eventual path — SignPath is the cheaper,
OSS-native variant of the same idea).

**Tradeoff**: dependence on a third-party signing service's availability and
on continued OSS-tier eligibility. Mitigated by keeping DigiCert/Sectigo as
a documented fallback and by the timestamp guarantee — already-released
binaries stay trusted regardless of provider changes.

---

## Signing scope

What gets signed and why each piece matters:

- **The NSIS `.exe` installer** — the primary artifact users download and
  double-click. This is what SmartScreen evaluates first. Non-negotiable.
- **The inner `voxply.exe`** (and any bundled sidecar binaries, e.g. the
  voice Rust helper) — signed **before** they are packed into the
  installer. Reason: once the installer extracts them to disk, Windows
  evaluates them on first launch. An unsigned inner binary inside a signed
  installer still trips SmartScreen at first app launch. Correct order:
  sign inner binaries → build installer → sign installer.
- **The MSI** (WiX, the secondary Windows format) — if produced, signed
  as its own artifact with the same certificate.

---

## Decision 3 — always timestamp (RFC 3161)

**Decision**: every signature carries an RFC 3161 timestamp.

Without a timestamp a signature becomes invalid the moment the certificate
expires — a 2026 release would start warning users in 2027. A timestamp
asserts "this was signed while the cert was valid," so the binary stays
trusted **after cert expiry**, indefinitely. This is what makes key
rotation (Decision 4) painless. Timestamp server:
`http://timestamp.sectigo.com` or `http://timestamp.digicert.com` (match
the cert vendor where possible).

---

## Decision 4 — cert renewal and key rotation

EV certs are issued for 1 or 3 years. Rotation is cheap because of
timestamping:

- On renewal, update **two things**: the `WINDOWS_CERT_THUMBPRINT` GitHub
  Actions secret and the matching value in Voxply-desktop's
  `tauri.conf.json` (`bundle.windows.certificateThumbprint`).
- **Old signatures stay valid** — they are timestamped, so binaries
  released under the previous cert keep working. No re-release needed.
- New releases sign with the new cert automatically.

---

## What to do (procurement → CI)

### Step 1 — Apply to SignPath Foundation (OSS tier)

Go to **signpath.io** → "Free for Open Source" and submit an application.
You will need:

- The **Voxply GitHub organisation URL** (`github.com/Voxply`)
- A short description of the project (self-hosted voice/chat, open source, MIT/Apache licence)
- Contact email — use the project maintainer's address
- Confirmation that the project has no commercial gating (free, no paid tiers)

All Voxply repos are public and the project is free software, so it meets
the eligibility criteria. Approval typically takes a few days to a week.

### Step 2 — Set up the SignPath portal after approval

Once approved, SignPath creates an organisation for you. Log in and do the
following in order:

1. **Create a Project**: name it `voxply-desktop`, slug `voxply-desktop`.
2. **Create an Artifact Configuration** (slug: `nsis-installer`). This tells
   SignPath which files inside your submitted zip to sign and how. Set it up
   to deep-sign the NSIS installer:
   ```xml
   <artifact-configuration xmlns="http://signpath.io/artifact-configuration/v1">
     <pe-binary>
       <authenticode-sign/>
     </pe-binary>
   </artifact-configuration>
   ```
   SignPath's NSIS deep-signing support will also sign the inner `voxply.exe`
   PE binary that the installer wraps. Confirm this in their docs for your
   exact SignPath tier.
3. **Create a Signing Policy** (slug: `release-signing`):
   - Certificate: select the EV cert SignPath provisioned for you
   - Allowed signers: GitHub Actions CI user (see next step)
   - Optionally require a manual approval step for release tags
4. **Create a CI User** with the role "Submitter" scoped to the
   `voxply-desktop` project. Generate an API token for it.
5. **Link the GitHub repository** (`Voxply/Voxply-desktop`) to the project
   so SignPath can read artifacts from GitHub Actions runs.

### Step 3 — Store secrets in GitHub Actions

Go to **Voxply-desktop** → Settings → Secrets → Actions and add:

| Secret | Value |
|---|---|
| `SIGNPATH_API_TOKEN` | The API token from the CI user you created |
| `SIGNPATH_ORGANIZATION_ID` | Your org ID from the SignPath portal URL |

### Step 4 — Complete EV vetting

SignPath Foundation coordinates EV vetting with their CA partner (GlobalSign).
They will contact you to verify the project's legal identity. This is the
slow step — days to a couple of weeks. Start it immediately after step 1
approval.

### Step 5 — Smoke test

After the first signed release tag (`git tag v0.x.y && git push --tags`):

1. Download the `.exe` installer on a **clean Windows 11 VM** (one that has
   never seen Voxply before, to avoid cached reputation).
2. Double-click it. If SmartScreen is gone — done. If it still shows, run:
   ```
   signtool verify /pa /v voxply-setup.exe
   ```
   and check the output for the certificate chain.

### How the CI signing works

SignPath does **not** expose the private key or act as a CSP/KSP that
`signtool` can address directly. Instead it is a **signing service**: you
submit an unsigned binary, their HSM signs it, and you get the signed binary
back. The `release.yml` workflow reflects this:

1. Tauri builds the unsigned NSIS installer.
2. The installer is uploaded as a GitHub Actions artifact.
3. `signpath/github-action-submit-signing-request` sends the artifact to the
   SignPath API. SignPath deep-signs both the inner `voxply.exe` and the NSIS
   wrapper.
4. The action downloads the signed artifact, which is then swapped into the
   bundle directory and verified with `signtool verify`.

`tauri.conf.json` intentionally has no `certificateThumbprint` — Tauri's
bundler is not in the signing path; SignPath handles it entirely after the
build.

---

## What changes on the implementation side

| File / repo | Change |
|---|---|
| `tauri.conf.json` (Voxply-desktop) | Add `bundle.windows` with `certificateThumbprint`, `digestAlgorithm`, `timestampUrl` — or leave minimal if signing runs via an explicit CI step. |
| `.github/workflows/release.yml` (Voxply-desktop) | Windows job: sign inner binaries pre-bundle, `tauri build`, sign installer + MSI, `signtool verify`. Reads the new secrets. |
| `packaging.md` (docs repo) | Update section 2 Windows from "unsigned / deferred" to "EV via cloud HSM"; add secrets matrix additions; add rotation note. |
| `CHANGELOG.md` (Voxply-desktop) | Remove the "More info → Run anyway" workaround once the first signed release ships. |

### New secrets (Voxply-desktop GitHub Actions)

| Secret | Purpose |
|---|---|
| `SIGNPATH_API_TOKEN` | Bearer token generated in the SignPath portal for the CI user |
| `SIGNPATH_ORGANIZATION_ID` | Your SignPath organisation ID (shown in the portal URL and settings) |

These sit alongside the existing updater secrets (`TAURI_SIGNING_PRIVATE_KEY`,
`TAURI_SIGNING_PRIVATE_KEY_PASSWORD`), which are unchanged.

Both secrets are optional at build time — signing is skipped when `SIGNPATH_API_TOKEN`
is absent (normal for feature branches). Only release tags need them set.

---

## What's deferred

- **macOS notarization** — separate cert authority (Apple Developer
  Program, $99/yr); deferred per `packaging.md`.
- **Linux GPG signing** of the AppImage — optional; not driven by this doc.
- **Android signing** — Android keystore; tracked in `android-client.md`
  and `packaging.md`.
- **Reproducible builds** so third parties can verify the signed binary
  matches public source — desirable but a larger effort; deferred.
