<!-- SQUADCODER:start (merge=ours) -->
# SquadCoder

This repo is **SquadCoder** — an open-source, **RTL/Hebrew-first** AI coding assistant, a rebranded
fork of **MiMoCode** (`XiaomiMiMo/MiMo-Code`, itself a fork of `sst/opencode`).

- **Goal:** keep pulling bug fixes/updates from MiMo/opencode (`upstream`/`opencode` remotes)
  while keeping our brand and developing our way. Isolate our diff — see `docs/FORK_STRATEGY.md`.
- **What's ours (don't expect upstream to maintain):** `.squadcoder/` (config, skills, plugins),
  `packages/squadcoder-plugin-*`, and rebrand edits tagged `SQUADCODER:`. These are `merge=ours`.
- **Working method:** reuse before build (core → plugin/config → safe third-party → build);
  only i18n/RTL/branding touch core, kept small and marked.
- **⛔ BEFORE BUILDING ANY FEATURE, READ `docs/REUSE_AUDIT.md`** — the canonical per-feature verdict
  (already-in-core? safe extension to adopt? or build?). It exists so we **never double-work**.
  `docs/PROJECT_STATUS.md` is the living status board (requirements, done, pending, user's notes).
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
- **SQUADCODER: desktop release version is single-sourced from `packages/desktop/package.json`** (what Settings displays via `app.getVersion()`). Never hand-type a release tag — derive it. To cut a release: (1) `bun script/set-version.ts <v>` (writes the same version to desktop + app, anti-drift), (2) build the installer per the recipe above, (3) `bun script/release-desktop.ts` (derives the `v<v>` tag from package.json and creates/refreshes the GitHub release; `--dry-run` previews). This is separate from the opencode CLI/npm flow (`script/version.ts`/`script/release.ts`, sourced from `packages/opencode/package.json`).

## GitHub: use the configured MCP (DEFAULT for all GitHub work)
- A GitHub MCP is configured and authenticated (account `snipecoder`, target `squadcodercom/squadcoder`). For ANY GitHub/repo operation — PRs, issues, releases, code search, reading/creating/updating files on the remote, comments, reviews — ALWAYS use the GitHub MCP tools FIRST. Do NOT shell out to `git`/`gh` for these.
- What the MCP CAN do: it makes REAL commits on the remote via the REST API — `create_or_update_file` (one file) and `push_files` (multiple files in one commit), plus branches, PRs, issues, releases, code search, comments, reviews. For any NEW change authored against the remote, the MCP is the correct tool.
- What the MCP CANNOT do: replicate your EXISTING LOCAL git commit history. The REST API authors fresh commits server-side file-by-file; it cannot upload pre-existing local commit objects/graph. So when your local branch already has unpushed commits, use `git push` to sync them — otherwise the MCP would create divergent fresh commits on the remote that don't match local HEAD.
- Rule of thumb: local branch has unpushed commits → `git push` to mirror them. Editing/adding files directly on the remote with no local-history concern → GitHub MCP.
- `git push` to this repo requires a token with BOTH `repo` AND `workflow` scopes — the repo contains `.github/workflows/*`, and GitHub rejects any push that touches workflow files when the token lacks `workflow` scope. The MCP uses the same token, so it hits the same wall on workflow files.
- The repo has a husky PRE-PUSH hook that runs `turbo typecheck`; a typecheck error in ANY package blocks the push — fix it (do NOT use `--no-verify` unless the user explicitly asks).
- Remote `origin` = https://github.com/squadcodercom/squadcoder.git ; default branch `main`.

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
