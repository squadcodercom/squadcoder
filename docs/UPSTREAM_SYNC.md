# Upstream Sync Log — SquadCoder ← MiMoCode / opencode

Tracks what we pull from upstream and what we deliberately skip, so we never re-patch
something upstream already fixed, and never let an upstream change clobber our work.

- `upstream` = `XiaomiMiMo/MiMo-Code` (our fork base)
- `opencode` = `sst/opencode` (generic fixes to cherry-pick)
- Isolation: `.gitattributes merge=ours` on `packages/muminai-*`/`.squadcoder/`, branding,
  i18n, `patches/`. See `FORK_STRATEGY.md`.

## Why the rebrand to `squadcoder.json` matters (user's point, 2026-06-18)
We renamed the config file `opencode.json`/`mimocode.json` → **`squadcoder.json`** specifically so
that a user migrating from opencode/MiMoCode does NOT get their old config silently picked up and
conflicting with ours (which is exactly the kind of clash the user hit with the inherited
`~/.claude.json` MCPs). Lowercase WIRE tokens (`$schema https://opencode.ai/config.json`,
`opencode://` scheme, `OPENCODE_*` env) are intentionally LEFT for back-compat — see `mumin/docs/REBRAND.md`.

## Status snapshot (2026-06-18)
- Our HEAD: `666c7e1` on `feat/muminai-foundation`.
- **Behind `upstream/main` by 25 commits.** `git fetch upstream` succeeds (network OK).
- Last proven clean merge: voice feat #900 (zero conflicts via merge=ours).

### Upstream commits NOT yet merged (candidates — review before merging)
High value (pull):
- `3edb904` fix(tui): force full repaint after interactive command resume (#1124)
- `82d3f95` fix(compose): tighten brainstorm scope check to prevent skill bypass (#1122)
- `28d6f3c` feat(log): support flag to disable log rotation
- `16868d8` refactor(session): unify LLM request header injection — ⚠️ verify it doesn't fight our
  `AnthropicProxyPlugin` Bearer-injection (Claude Pro/Max auth, mimo.ts).
- `dd69005` fix: restore TUI model selector search box & update AGENTS.md (#932)
- `292b80e` fix(test): resolve 7 pre-existing test failures (#911)
- `087e3d4` / `da89151` build: rename private overlay paths `private`→`ext` (#915) — ⚠️ touches
  `build.ts`, which we modified (squadcoder binary name + seed copy). Merge carefully.

Rebrand-relevant (review — may conflict with our branding):
- `daa8d4a` fix: rename opencode references to mimocode in upgrade command (#941) — we want
  squadcoder, not mimocode; take the FIX, keep OUR brand string.
- `b1f036e` fix: website links /en/mimocode → /coder (#942) — our links are `#` placeholders now;
  likely skip / keep ours.

Docs/CI/community (low priority, mostly skip):
- `ddb573b` ci workflows, `24df619` build tweaks, `43b915b`/`b3c8ec5` WeChat QR docs, `2ecfe94` release bump.

### ⚠️ 2026-06-18: WHOLESALE `git merge` IS IMPOSSIBLE — unrelated histories
`git merge upstream/main` → **"fatal: refusing to merge unrelated histories"**, and
`git merge-base HEAD upstream/main` returns **nothing** (no common ancestor). Our fork's history
and `upstream/main` share zero commits — MiMoCode is a squashed import and our tree diverged
completely. `--allow-unrelated-histories` would conflict on *every* shared file (no merge base),
which is unusable. **The earlier "zero-conflict merge" note (when 1 behind) no longer holds.**

**New strategy = selective port, NOT merge.** Treat upstream as a source to cherry-pick/diff-apply
specific fixes from, opportunistically. For each wanted commit:
`git show upstream/main -- <path>` or `git diff <our-file> upstream/main:<path>`, then hand-apply.
The high-value targets are listed above (#1124 TUI repaint, #1122 compose scope, #911 test fixes,
#932 model-selector search, #28d6f3c log-rotation flag). Skip rebrand/docs/CI commits.

**This UNBLOCKS feature work:** since there's no merge gate (a merge can't happen), the "merge first,
then features" ordering from the research is moot — build features now; port upstream fixes one-by-one
when each is relevant. No double-conflict risk because there's no merge.

### (obsolete) Plan to merge (do as a FOCUSED operation, not rushed)
1. `git fetch upstream && git checkout -b sync/upstream-2026-06-18`.
2. `git merge upstream/main` — `merge=ours` protects our isolated dirs; resolve conflicts in
   build.ts / session header-injection / branding by hand, KEEPING our changes.
3. Re-run: `app`+`ui` typecheck, the Anthropic `/provider/auth` check, RTL browser spot-check,
   a non-git `/undo` (#460 regression guard), and a desktop build.
4. Record the merge SHA + what was taken/skipped/conflicted here.
5. Cross-check `mumin/docs/FIXED_ISSUES.md` so we don't re-fix anything on this list.

> Not merged yet as of 2026-06-18 — flagged for the next focused sync turn to avoid clobbering the
> RTL / Anthropic-auth / favicon / branding work done this session.
