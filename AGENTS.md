<!-- SQUADCODER:start (merge=ours) -->
# SquadCoder

This repo is **SquadCoder** — an open-source, **RTL/Hebrew-first** AI coding assistant, a rebranded
fork of **MiMoCode** (`XiaomiMiMo/MiMo-Code`, itself a fork of `sst/opencode`).

- **Goal:** keep pulling bug fixes/updates from MiMo/opencode (`upstream`/`opencode` remotes)
  while keeping our brand and developing our way. Isolate our diff — see `FORK_STRATEGY.md`.
- **What's ours (don't expect upstream to maintain):** `.squadcoder/` (config, skills, plugins),
  `packages/squadcoder-plugin-*`, and rebrand edits tagged `SQUADCODER:`. These are `merge=ours`.
- **Working method:** reuse before build (core → plugin/config → safe third-party → build);
  only i18n/RTL/branding touch core, kept small and marked.
- **⛔ BEFORE BUILDING ANY FEATURE, READ `REUSE_AUDIT.md`** — the canonical per-feature verdict
  (already-in-core? safe extension to adopt? or build?). It exists so we **never double-work**.
  `PROJECT_STATUS.md` is the living status board (requirements, done, pending, user's notes).
- **Durable context lives outside the repo:** the memory store at
  `~/.claude/projects/C--Users-raviv-OneDrive-Desktop-SquadCoder/memory/` (`MEMORY.md` index) and
  the plan at `~/.claude/plans/i-decided-to-create-compiled-corbato.md`. Read them first.

## Build & release (auto-rebuild rule)
- When a set of fixes is COMPLETE and requires a rebuild for the user to install, REBUILD THE PRODUCTION INSTALLER automatically (without waiting to be asked) to the canonical path:
  `C:\Users\raviv\OneDrive\Desktop\MuminAI\mumin\release\SquadCoder-desktop-win-x64-installer.exe`
- Recipe (run from `packages/desktop`, prod channel). If `seed/` or `.squadcoder/plugin-src/*` changed, first run `bun script/make-seed.ts` from repo root:
  1. Clear `out/` + `dist/` first (OneDrive locks files).
  2. `$env:OPENCODE_CHANNEL='prod'; bun run build`
  3. `$env:OPENCODE_CHANNEL='prod'; bun run package:win`
  4. `Copy-Item -Force packages/desktop/dist/SquadCoder-desktop-win-x64-installer.exe release/` (also copy the `.blockmap`).
- Renderer-only edits (packages/app components / i18n) ship via `bun run build` alone — SKIP `prebuild`. A `.squadcoder/plugin-src/*` or engine (`packages/opencode`) change is engine-side → run `bun run prebuild` (re-bundles the plugin + rebuilds the engine node bundle) BEFORE `package:win`.
- `bun run build` (electron-vite/babel+solid) is a SEPARATE pass from `bun typecheck` — a file can pass typecheck yet fail babel parse (e.g. a duplicate import). Always run the real build before declaring a fix shipped.

## GitHub: use the configured MCP
- A GitHub MCP is configured and authenticated (account `snipecoder`, org/repo target `squadcodercom/squadcoder`). PREFER the GitHub MCP tools for GitHub & repo operations: opening/reading PRs, issues, releases, code search, and single-file commits/edits/reads against the remote.
- EXCEPTION — the one-time initial full-history repo mirror uses `git push` (the MCP REST API cannot transfer existing git history/commits). After the repo exists on GitHub, use the MCP for ongoing changes.
- Git remote `origin` = https://github.com/squadcodercom/squadcoder.git ; default branch `main`. The repo has a husky PRE-PUSH hook that runs `turbo typecheck` — a typecheck error in ANY package blocks `git push`; fix the error (do NOT use --no-verify unless the user explicitly asks).

The opencode/MiMoCode developer style guide follows and still applies.
<!-- SQUADCODER:end -->

- Always use superpowers skill instead of builtin plan mode.
- To regenerate the JavaScript SDK, run `./packages/sdk/js/script/build.ts`.
- ALWAYS USE PARALLEL TOOLS WHEN APPLICABLE.
- The default branch in this repo is `main`.
- CI triggers on both `main` and `dev` branches.
- Prefer automation: execute requested actions without confirmation unless blocked by missing info or safety/irreversibility.

## Style Guide

### General Principles

- Keep things in one function unless composable or reusable
- Avoid `try`/`catch` where possible
- Avoid using the `any` type
- Use Bun APIs when possible, like `Bun.file()`
- Rely on type inference when possible; avoid explicit type annotations or interfaces unless necessary for exports or clarity
- Prefer functional array methods (flatMap, filter, map) over for loops; use type guards on filter to maintain type inference downstream
- In `src/config`, follow the existing self-export pattern at the top of the file (for example `export * as ConfigAgent from "./agent"`) when adding a new config module.

Reduce total variable count by inlining when a value is only used once.

```ts
// Good
const journal = await Bun.file(path.join(dir, "journal.json")).json()

// Bad
const journalPath = path.join(dir, "journal.json")
const journal = await Bun.file(journalPath).json()
```

### Destructuring

Avoid unnecessary destructuring. Use dot notation to preserve context.

```ts
// Good
obj.a
obj.b

// Bad
const { a, b } = obj
```

### Variables

Prefer `const` over `let`. Use ternaries or early returns instead of reassignment.

```ts
// Good
const foo = condition ? 1 : 2

// Bad
let foo
if (condition) foo = 1
else foo = 2
```

### Control Flow

Avoid `else` statements. Prefer early returns.

```ts
// Good
function foo() {
  if (condition) return 1
  return 2
}

// Bad
function foo() {
  if (condition) return 1
  else return 2
}
```

### Schema Definitions (Drizzle)

Use snake_case for field names so column names don't need to be redefined as strings.

```ts
// Good
const table = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull(),
  created_at: integer().notNull(),
})

// Bad
const table = sqliteTable("session", {
  id: text("id").primaryKey(),
  projectID: text("project_id").notNull(),
  createdAt: integer("created_at").notNull(),
})
```

## Testing

- Avoid mocks as much as possible
- Test actual implementation, do not duplicate logic into tests
- Tests cannot run from repo root (guard: `do-not-run-tests-from-root`); run from package dirs like `packages/opencode`.

## Type Checking

- Always run `bun typecheck` from package directories (e.g., `packages/opencode`), never `tsc` directly.
