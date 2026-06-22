---
description: Routine — pre-ship verification: typecheck + tests + RTL/LTR visual pass, stop at the first hard failure
---

Run the **pre-ship routine** on the current working changes, in order. Stop and report at the first hard failure.

1. **Typecheck** — run `bun typecheck` from each affected **package** directory (never the repo root — the root guard blocks it). Ignore the known benign `custom-elements.d.ts` tsgo error; report any real error.
2. **Tests** — run the test suite from each affected package dir (e.g. `packages/opencode`). Summarize pass/fail with the failing output.
3. **RTL + LTR** — if the change touches UI, verify it renders correctly in **both Hebrew (RTL) and English (LTR)**: no clipped/overlapping text, icons mirrored only where appropriate, logical CSS (`ps-`/`pe-`/`margin-inline-*`). Drive Playwright at 1440×900 if the dev server is up.
4. **Summary** — a concise **PASS/FAIL per step** with the exact failing command output. Never claim success on red.

Notes / scope: $ARGUMENTS
