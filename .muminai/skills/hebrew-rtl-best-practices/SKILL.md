---
name: hebrew-rtl-best-practices
description: Build correct right-to-left (RTL) Hebrew web interfaces — logical CSS properties, dir handling, bidirectional text, icon mirroring, and Hebrew typography. Use when creating or fixing Hebrew/RTL UI.
---

# Hebrew RTL Best Practices

Guidance for producing correct, polished right-to-left Hebrew interfaces. This is original
MuminAI guidance; for the broader Skills-IL catalog see `SKILLS_ATTRIBUTION.md`.

## Core rules

1. **Set direction at the root, by language — not globally.**
   - Apply `dir="rtl"` on `<html>` (or the app root) only when the active UI language is RTL
     (Hebrew `he`, Arabic `ar`). Keep `dir="ltr"` otherwise.
   - For mixed content (a Hebrew message in an LTR UI, or vice-versa), set `dir="auto"` on the
     individual text container so the browser's bidi algorithm picks the right direction per
     block. Do **not** force the whole UI to flip just because one message is Hebrew.

2. **Use CSS logical properties, never physical ones.**
   - `margin-inline-start/end` instead of `margin-left/right`.
   - `padding-inline-*`, `inset-inline-*`, `border-inline-*`, `text-align: start/end`.
   - In Tailwind: `ms-*`/`me-*` (not `ml-*`/`mr-*`), `ps-*`/`pe-*`, `start-*`/`end-*`,
     `border-s`/`border-e`, `text-start`/`text-end`. These flip automatically with `dir`.

3. **Mirror directional icons.** Arrows, chevrons, back/forward, send, and progress indicators
   must mirror in RTL. Use `rtl:-scale-x-100` (Tailwind) or `[dir=rtl] &{ transform: scaleX(-1) }`.
   Do **not** mirror icons that are not directional (logos, checkmarks, search, brand glyphs).

4. **Numbers, code, and LTR islands stay LTR.** Wrap code, URLs, file paths, version numbers,
   and Latin identifiers in an element with `dir="ltr"` and `unicode-bidi: isolate` so they
   don't get reordered inside Hebrew sentences.

5. **Typography.** Use a Hebrew-capable font stack (e.g. `Heebo`, `Rubik`, `Assistant`,
   `Noto Sans Hebrew`) with a sensible fallback. Hebrew has no uppercase; avoid `text-transform`.
   Give slightly more line-height — Hebrew diacritics (nikud) need vertical room.

## Quick checklist
- [ ] Root `dir` driven by language, not hard-coded.
- [ ] Per-message/`per-field` `dir="auto"` for user/AI content.
- [ ] All spacing/positioning uses logical properties.
- [ ] Directional icons mirror; brand/semantic icons don't.
- [ ] LTR islands (code/numbers/URLs) isolated.
- [ ] Hebrew-capable font with fallback; comfortable line-height.

## Common bugs
- Layout looks right but a few buttons sit on the wrong side → leftover `ml-`/`mr-`/`left-`/`right-`.
- Punctuation jumps to the wrong end of a line → missing `dir="auto"` / bidi isolation around mixed text.
- Arrow points the wrong way → directional icon not mirrored.
