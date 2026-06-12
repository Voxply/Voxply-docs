# Web client design review — 2026-06-13

Playwright screenshot-driven review of the web client (local seeded hub,
1440x900 + 1920x1080). Screenshots + full critique live in the workspace at
`.design-review/` (internal, not committed). Labels continue the
[pilot feedback](pilot-feedback-2026-06-12.md) convention; cross-client items
are flagged — the clients share design DNA, so most apply to desktop too.

## Functional discoveries (not just polish)

- **Polls are dead code in web** — `PollComposer.tsx`/`PollCard.tsx` exist but
  are imported by nothing; poll messages render as plain text. Web parity gap.
- **Composer CSS root cause (D5a)** — a bare `.input-area button` selector
  paints every form button as a mint CTA: the emoji toggle renders as a second
  send button while attach (a `<label>`, escaping the selector) stays a ghost.
- **Web voice contradiction** — the enabled "join voice" button coexists with
  a "voice unavailable in browser" banner.

## Top 10 (priority order; severity detail in workspace REVIEW.md)

1. Rebuild composer to the D5b spec (in-box right-aligned "+" menu + emoji;
   spec precise enough to implement) — *also desktop*
2. Wire polls into web (mount PollComposer via the "+" menu; render PollCard)
3. Mixed Italian/English on every screen — enforce locale coverage
4. Ask for display name at onboarding — users are hex strings everywhere —
   *likely desktop too*
5. Unify message-row anatomy (content gutter, reaction placement, reply
   S-path) — *desktop too*
6. Honest + distinct voice-channel UI in web; design the consolidated control
   bar once for D3/D9
7. Emoji picker rebuild (4 mint columns, clipped bottom row)
8. Cap chat column width (~1300px lines at 1920) — *desktop too*
9. Channel-type icons + unread treatment; DRAFT badge overlaps active pill —
   *desktop too*
10. First-run dead ends: no auto-selected channel, unwired "Browse public
    hubs", DM empty state references a non-existent friends list

Bonus: duplicate `button.hub-icon.dm` DOM ids (a11y), settings double-close
affordance, seed hex shown by default on the recovery screen.
