# Monetization

How Voxply funds itself while staying free for everyone, forever.

## Constraints

- No subscriptions. No premium tiers. No capability ever locked behind
  money.
- A user with a zero balance must have an identical product experience to
  a paying one.
- Community hubs the project does not operate must never be touched by
  money flows. A hub admin should never have to think about billing.
- Forks and self-hosters are first-class. Any monetization surface must
  be disablable without breaking the protocol.

---

## Funding mechanism 1 — Missions (primary upside)

### What it is

Sponsors pay the project a small fixed fee each time a user completes an
attested, voluntary action ("mission"). The user earns **sparks** — a
cosmetic-only currency with no monetary value and no capability effect.
Sparks are redeemed for cosmetic items (profile flair, avatar frames,
colour themes). The conversation and voice surfaces stay completely
ad-free.

### How a mission works

1. The official **mission service** (a project-operated service, likely
   a sibling repo to `Voxply-discovery`) publishes a signed list of
   active missions. Each mission has: a sponsor, a description, a reward
   in sparks, and an attestation endpoint URL.
2. The client fetches the mission list on demand and displays it in a
   **Missions panel** (a separate, opt-in surface — not in-chat).
3. The user initiates the action described (e.g. "visit sponsor's page
   and solve a short quiz"). This is **pull, not push** — the client
   never injects missions into the conversation flow.
4. On completion, the attestation endpoint issues a signed
   **completion token** bound to the user's pubkey. The user's client
   submits this token to the mission service to claim sparks.
5. The mission service credits the spark balance. The sponsor is billed
   per verified completion.

### Spark balance and cosmetics

- The spark balance is **personal-axis state** — it lives on the user's
  home hub list (same shape as the entitlement blobs in
  [`home-hub.md`](home-hub.md)), not on any community hub.
- Cosmetics are **client-side entitlements**: master-signed blobs
  the client holds locally. Hubs display flair by reading the blob,
  not by calling a money service. A community hub never holds a balance
  or calls a billing endpoint.
- The cosmetic catalog (which items exist, what they cost in sparks) is
  defined by the project. Self-hosters and forks can ignore it entirely.

### What's gated behind a client constant

The Missions panel and cosmetic rendering in the official clients are
compiled behind a `MISSIONS_ENABLED` constant (default: `true` in
official builds, easy to flip in forks). Disabling it removes the panel
entirely and renders no cosmetics. The protocol is unaffected — a client
with the panel disabled still connects to hubs and sends messages
normally.

### Anti-fraud

Full design in [`missions.md`](missions.md). Summary:

- **PoW on claim** — difficulty scales with `reward_sparks`.
- **Per-pubkey and per-IP rate limits** — plus a young-account spark
  discount to drain the throwaway-key incentive.
- **Sponsor-side callbacks** — optional per-mission; sponsor can veto a
  completion before sparks are credited.
- Heavier defences (behavioral signals, ML anomaly detection) deferred
  until abuse patterns are observed.

### Revenue flow

```
Sponsor → mission service (per-completion fee)
    ↓
Project operating budget
    ↓
Infrastructure + development
```

The user receives sparks. No money changes hands with the user.

---

## Funding mechanism 2 — Farm hosting plans (durable floor)

### What it is

The project operates a **managed farm** (see [`farm-model.md`](farm-model.md))
where communities can host hubs without running their own server. Hosting
plans cover operational costs: compute, storage, bandwidth.

### Why this fits the ethos

This sells **operations**, not software features. A self-hoster running
the same software gets the exact same product. The hosting plan pays for
the electricity and staff time, not for unlocked capabilities.

### Tiers (indicative)

| Tier | What it covers |
|------|---------------|
| Free | Small community, project-subsidised (funded by missions + donations) |
| Supported | Larger community, cost-covering rate |
| Dedicated | Dedicated hardware for high-traffic hubs |

The free tier exists as long as the project can fund it. There is no
"free tier degraded to push upgrades" pattern — if the free tier can't
be sustained, it is removed transparently, not quietly throttled.

### What's not in any tier

No tier unlocks protocol features. A paid-tier hub has the same
channels, voice, alliances, and permissions as a self-hosted one.

---

## Funding mechanism 3 — Donations

Simple, voluntary, no perks. A donate link in the app and on the project
website. Donors may optionally receive a cosmetic acknowledgement (a
"supporter" flair) — this is the one case where a cosmetic is tied to
money, and the rule is strict: **the flair is cosmetic only and grants
zero capability**. If the flair ever grants priority, quota, or any
functional advantage it has become a subscription tier in disguise and
must be removed.

Donations are the most ethos-aligned mechanism (no sponsor relationship,
no hosting dependency) and the least scalable. They are the moral floor,
not the financial plan.

---

## Ranking by ethos fit

1. **Donations** — cleanest. User gives voluntarily; project receives.
   No sponsor relationship, no hosting lock-in.
2. **Farm hosting plans** — sells operations, not features. A community
   that outgrows self-hosting pays for convenience, not capability.
3. **Missions** — introduces a sponsor relationship. Carefully scoped
   (cosmetic-only, pull-not-push, disablable in forks) but structurally
   more complex and more susceptible to ethos drift. The cosmetic-only
   rule is the permanent constraint that keeps missions from becoming
   advertising.

### Mechanisms explicitly rejected

- **Subscriptions / premium tiers**: splits users into paying and
  non-paying, which works only by making the free product deliberately
  worse. See [`decisions.md`](decisions.md).
- **In-chat or in-voice advertising**: rejected on no-surveillance and
  channel-as-place grounds. The conversation surface stays ad-free.
- **Selling telemetry or user data**: rejected on sovereignty grounds.
- **Paid-placement in hub or gaming discovery**: borderline — a sponsor
  paying to appear first in the gaming catalog distorts organic
  recommendations. If ever implemented it must be visibly labelled as
  sponsored and kept separate from organic results. Deferred until the
  catalog has enough volume for placement to matter.

---

## What lives where

| Concern | Lives on |
|---------|---------|
| Spark balance | User's home hub list (personal-axis) |
| Cosmetic entitlement blobs | Client-side, master-signed |
| Mission list + attestation | Project-operated mission service |
| Billing for hosting plans | Farm operator (project-operated farm) |
| Donation processing | Project website / payment processor |
| Community hub | **Nothing above** — never holds a balance, never bills |

Self-hosters and forks are entirely outside all money flows. They get
the full software; they run their own costs.

---

## Open questions and deferred work

- **Full missions design**: wire protocol, data model, attestation flow,
  anti-fraud layers, and the cosmetic catalog are all designed in
  [`missions.md`](missions.md). The remaining open items are:
- **Sponsor onboarding process** — v1 is manual/admin; a self-service
  onboarding UI is not designed.
- **Paid-placement rules in the gaming catalog**: deferred. Must be
  visibly labelled if ever implemented.
- **Free tier sustainability threshold**: at what point does the free
  farm tier become unsustainable? No metric defined yet.
