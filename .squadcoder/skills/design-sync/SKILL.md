---
name: sc:design-sync
description: "Turn a design reference into matching, production code and keep code in sync with the design. Ingest a screenshot, Figma export, design-tokens file, or a design URL; extract colors/spacing/type/radii; map them onto the project's existing design-system tokens (reuse, don't duplicate); generate or update components; then verify visual parity with a screenshot. RTL/Hebrew-aware. Activate for: design to code, sync design, match this design, implement this Figma, pixel-perfect, design tokens, design handoff, עיצוב לקוד, סנכרון עיצוב, התאמה לעיצוב, פיגמה."
argument-hint: "[design-reference] [target-component or page]"
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Design Sync — design reference → matching code

Convert a design into code that **matches the project's existing system**, and keep the two in sync.
The goal is parity *and* consistency: never hard-code a value you could pull from an existing token.

This skill is **portable** — it relies only on a design reference + the repo, so it works the same in
Claude Code, Codex, and opencode/SquadCoder. It does **not** require any hosted design connector.

## Step 0 — identify the design reference
Accept any of:
- **Screenshot / image** — read it directly (vision); measure spacing/sizes against a known element.
- **Figma export** — JSON/`design-tokens` (W3C tokens), SVG, or a CSS/Tailwind dump.
- **Design-tokens file** — `tokens.json`, `theme.css`, Style Dictionary, etc.
- **A design URL** — if reachable, fetch and read the rendered styles; otherwise ask for an export.
If nothing is provided, ask for one — do not invent a design.

## Step 1 — read the project's design system FIRST (reuse > duplicate)
Before writing anything, inventory what already exists so you extend it instead of forking it:
- Token sources: `tailwind.config.*`, CSS custom properties (`--color-*`, `--space-*`), `theme.*`,
  any `tokens.json`, or a design-system package.
- Existing components that resemble the target (buttons, cards, inputs) — match their API and styling.
- For SquadCoder/this repo: prefer the shared `@mimo-ai/ui` primitives and the bundled
  `design-system` / `israeli-ui-design-system` skills for token architecture and Hebrew typography.

## Step 2 — extract design intent, then map to tokens
1. Pull the raw values from the reference: palette, type scale, spacing rhythm, radii, shadows,
   breakpoints, states (hover/active/disabled/focus).
2. **Map each raw value to the nearest existing token.** Only mint a new token when there is a real
   gap, and add it at the right layer (primitive → semantic → component), never inline.
3. Record the mapping (design value → token) so the sync is auditable and repeatable.

## Step 3 — generate or update components
- Match the project's framework, file layout, naming, and import style (read a sibling first).
- Use **logical CSS properties** (`ms-`/`me-`/`ps-`/`pe-`/`start`/`end`, `inset-inline-*`) so the
  result works in both LTR and RTL — never physical `left/right` for layout. Mirror directional icons.
- Use semantic HTML, real focus states, and the project's tokens for every color/space value.
- Keep components small and composable; one responsibility each.

## Step 4 — verify visual parity (don't claim "pixel-perfect" blind)
- If Playwright/Chromium is available (it's bundled), render the component and **screenshot it**, then
  compare against the reference at the same width. Check both an LTR and an **RTL** render for Hebrew.
- Check spacing rhythm, type scale, color, radii, and every interactive state.
- List remaining diffs honestly; fix or flag them. Do not assert parity you didn't verify.

## Step 5 — report the sync
Output: the token mapping (Step 2), files created/changed, any new tokens added (and why), the parity
check result (with the screenshot), and any intentional deviations.

## Keeping in sync over time
- Treat the token mapping as the contract. When the design changes, re-run from Step 2 and update only
  the tokens/components whose mapped values changed — don't rewrite untouched code.
- Prefer updating a token in one place over editing many call sites.

## Guardrails
- Reuse existing tokens/components before adding new ones; flag duplication you find.
- Never inline magic numbers when a token exists.
- RTL/Hebrew is a first-class target, not an afterthought.
- Be honest about parity — verified vs estimated.
