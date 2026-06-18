# SquadCoder Fork & Upstream-Sync Strategy

SquadCoder is a rebranded, RTL/Hebrew-first fork of **MiMoCode** (`XiaomiMiMo/MiMo-Code`),
which is itself a fork of **opencode** (`sst/opencode`). A core goal: **keep pulling bug
fixes and updates from MiMo/opencode** while keeping our brand and developing our own way.

This document is how we make that sustainable.

## Remotes

```
origin     → (your SquadCoder GitHub repo — add once created: git remote add origin <url>)
upstream   → https://github.com/XiaomiMiMo/MiMo-Code.git   (primary — memory/compose/etc.)
opencode   → https://github.com/sst/opencode.git           (original — generic fixes)
```

This clone was created shallow (`--depth 1`). Before the **first** upstream merge, fetch
full history so merges have a base:

```
git fetch --unshallow upstream      # or: git fetch upstream --depth=1000
git fetch opencode
```

## The rule that keeps merges cheap: isolate our diff

1. **New features live in their own packages** — `packages/squadcoder-plugin-*` — and in the
   config layer `.squadcoder/`. These never collide with upstream.
2. **Only three things require editing shared core files**: i18n string tables, RTL/direction,
   and branding. Keep each edit **small, marked with a `SQUADCODER:` comment, and centralized**
   (brand constants in one module). Do NOT scatter logic changes into core.
3. **`merge=ours` is only for 100% SquadCoder-owned files** (see `.gitattributes`). Shared core
   files we edit are deliberately left out so we still receive upstream fixes there and
   reconcile them.

## Enable the `ours` merge driver (one-time, per clone)

```
git config merge.ours.driver true
```

(CI/fresh clones must run this; it's not stored in the repo. Consider a `bun run setup` hook.)

## Periodic merge workflow

```
git fetch upstream
git switch -c sync/upstream-$(date +%Y%m%d) main
git merge upstream/main          # conflicts should be mostly brand/i18n, not logic
# resolve, run: bun install && bun run typecheck && bun test
# open PR sync/... → main, verify app still runs, then merge
```

If a merge is too noisy (MiMoCode history is young/squashed), fall back to cherry-picking the
specific fixes we need rather than a full merge. We are **owners who pull upstream
opportunistically**, not auto-rebasers.

## Shrink the permanent diff: upstream our generic work

RTL/i18n is generally useful. Contribute it back to opencode (open issues **#6284**, **#10908**)
and MiMoCode where accepted. Every accepted PR removes a file from our permanent diff and
lowers future merge cost.

## What is SquadCoder-owned (don't expect upstream to maintain)

- `packages/squadcoder-plugin-*` (bootstrap, brand, anthropic-oauth)
- `.squadcoder/` (default config, bundled skills, brand constants)
- `CLAUDE.md`, `AGENTS.md`, `FORK_STRATEGY.md`, `SKILLS_ATTRIBUTION.md`
- Rebrand edits (scopes `@mimo-ai/*`→`@squadcoder/*`, binary `mimo`→`mumin`, config dir
  `.mimocode/`→`.squadcoder/`, stripped Xiaomi-hosted defaults) — all tagged `SQUADCODER:`.
