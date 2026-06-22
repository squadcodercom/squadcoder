I now have full verification of both bugs. `state().content` is the raw `x.data` from `sdk.client.file.read`, and `contents()` reads `state()?.content?.content` — so `file.read` returns an object with a `.content` property. The blank-view culprit is confirmed: if `x.data` is empty/falsy, `setLoaded` still sets `loaded=true` (line 135) while `content` is undefined, so `<Match when={state()?.loaded}>` passes but `contents()` returns `""` → blank, and the error branch never runs because `loaded` is true not `error`.

I have everything I need. Writing the plan now.

---

# SquadCoder Settings System + Two Bug Fixes — Implementation Plan

All paths absolute under `C:\Users\raviv\OneDrive\Desktop\MuminAI\mumin\`. One mutation primitive: `PATCH /config` via `sdk.client.config.update({ config: {...} })` deep-merges into `config.json`. **Merge cannot delete keys or array elements** — every section below works around this (disable-flags; resend-whole-array). Everything reuses existing engine GET routes + the OpenChamber store/master-detail patterns; only **4 minimal new engine routes** are required and each is flagged explicitly.

---

## 0. Shared foundation (build once, reuse everywhere)

**Create `packages/app/src/components/settings/settings-row.tsx`** — promote the unexported `SettingsRow` from `settings-general.tsx:802-812` into a shared, exported primitive (title/description start, control end, `border-b last:border-none`). Purpose: stop hand-rolling rows in every section.

**Create `packages/app/src/components/settings/settings-section.tsx`** — the page shell: scrollable root (`flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10`), sticky gradient header with `<h2 class="text-16-medium text-text-strong">`, optional right-aligned action slot. Purpose: one consistent section frame.

**Create `packages/app/src/components/settings/use-config-mutation.ts`** — the load-bearing reuse. A thin hook wrapping `useGlobalSync().updateConfig` that mirrors OpenChamber's `refreshAfterOpenCodeRestart`: write partial config → the engine's `Instance.dispose()` already forces reload → re-read affected `sync.data.*`. Exposes helpers:
- `setConfigKey(path, value)` — deep set for `agent[name].x`, `mcp[name].x`, `permission.skill[name]`.
- `replaceArray("plugin", nextArray)` — for plugins/MCP-removal where merge can't drop elements, send the full desired array.
- `scope: "project" | "global"` switch (project = `PATCH /config`; global = `PATCH /config` global / `global.config.update`). Purpose: single CRUD funnel so sections don't each re-derive directory threading.

**Create `packages/app/src/components/settings/scope-select.tsx`** — OpenChamber's `SettingsProjectSelector` + scope (project/global) dropdown, hides itself when only one option. Purpose: the "where does it live" control reused by Agents/Skills/MCP/Plugins/Import.

**Create `packages/app/src/components/settings/sidebar-group.tsx`** — port OpenChamber `SidebarGroup`: collapsible, localStorage-persisted expand state (`squadcoder:settings-group:<key>:<label>`), count badge, left border on children. Purpose: "group = subfolder" for Agents/Skills with zero schema change.

i18n: every new key added to **both** `packages/app/src/i18n/en.ts` and `packages/app/src/i18n/he.ts` in the same edit. Namespace `settings.<section>.*`, tab labels `settings.tab.<section>`, nav group titles `settings.section.<group>`.

---

## PHASE 1 — Bug fixes + smallest end-to-end Settings win

Goal: ship visible value fast, prove the section-adding pattern, fix the two reported bugs. No new engine routes.

### 1A. Bug (a) — tab-overflow scroller
**Edit `packages/ui/src/components/tabs.css`** (`alt` variant block, lines 270-285).
- Root cause (verified): `[data-variant="alt"] [data-slot="tabs-list"]` sets `padding-left/right:24px; gap:12px` but never re-declares `overflow-x`; the base `overflow-x:auto` (line 14-21) is inherited but the scrollbar is hidden (lines 22-27) and the popover body is `w-[360px]` (`status-popover-body.tsx:344`) while the wrapper is `w-[420px]` (`status-popover.tsx:50`). 6 count-prefixed tabs overflow 360px with no scroll affordance → trailing **Agents** tab unreachable.
- Fix: in the `alt` list block convert `padding-left/right` → logical `padding-inline: 24px` (RTL-correct), reduce `gap: 12px → 8px`, add explicit `overflow-x: auto; scroll-snap-type: x proximity;` and a thin edge-fade affordance (mask-image left/right gradient) so overflow is discoverable. **Edit `status-popover-body.tsx:344`** change `w-[360px]` → `w-[420px]` to match the wrapper and the per-tab content width. Verify all 6 tabs reachable at both `dir=ltr` and `dir=rtl`.

### 1B. Bug (b) — blank file view (two surfaces)
**Surface 1 — in-session tab. Edit `packages/app/src/context/file.tsx`.**
- Root cause (verified): `load()` (`:176-184`) calls `setLoaded(file, content)` even when `x.data` is falsy; `setLoaded` (`:130-139`) sets `loaded:true` regardless. `file-tabs.tsx:201` reads `state()?.content?.content` → `""`; `<Match when={state()?.loaded}>` (`:447`) passes, the `error` branch (`:451`) never runs because there's no error. Result: blank pane, no error.
- Fix: in `load()` `.then`, if `content == null` OR `content.content` is empty/undefined, call `setLoadError(file, language.t("error.file.empty"))` instead of `setLoaded`, OR set a distinct `state.empty` flag and add a `<Match when={state()?.empty}>` empty-state in `file-tabs.tsx`. Also guard the renderer: in `file-tabs.tsx:447` change `when={state()?.loaded}` → `when={state()?.loaded && contents().length > 0}` with a fallthrough empty `<Match>`. Add i18n `error.file.empty` / `file.view.empty` (en+he).
- Secondary check: confirm the `diffs-container` custom element is registered at boot (it is referenced in `app.tsx`/`layout.tsx`/`titlebar.tsx`); add a dev assert `customElements.get('diffs-container')` log so a future registration failure surfaces instead of painting blank.

**Surface 2 — workspace .md dialog. Edit `packages/app/src/components/dialog-workspace-docs.tsx`.**
- Root cause (verified): both resources swallow errors — `files` does `.catch(() => [])` (`:21`), `content` does `.catch(() => undefined)` then returns `""` (`:39-41`). The in-session loader uses `sdk.client.file.read` (returns `{content}`) but this dialog uses `sdk.client.file.content` — the `typeof res === "string" ? res : res.content` ternary (`:41`) signals API-shape uncertainty. If `file.content`'s response shape or the bare-`path` (vs `${sdk.directory}/${p}`) resolution differs, content silently renders empty.
- Fix: (1) align on **one** API — switch this dialog to `sdk.client.file.read({ path })` to match the verified working in-session path, removing the ternary. (2) Replace silent `.catch(() => "")` with a visible error state: show `language.t("dialog.workspaceDocs.loadError")` when the read fails or returns empty, never a blank `<Markdown text="">`. (3) Add a loading state while `content.loading`.

### 1C. First Settings win — **Agents section (config-layer editor, no groups yet)**
The smallest *new* section that delivers the user's headline ask and reuses an existing data source + mutation. Reuses `sync.data.agent` (`GET /agent`) + per-agent `config.agent[name].*` writes (already proven in `status-popover-body.tsx:335-341`).
- **Edit `packages/app/src/components/dialog-settings.tsx`**: add a new `<Tabs.SectionTitle>{t("settings.section.workspace")}</Tabs.SectionTitle>` group with `<Tabs.Trigger value="agents"><Icon name="robot"/>…</Tabs.Trigger>`; add matching `<Tabs.Content value="agents"><SettingsAgents/></Tabs.Content>`; import `SettingsAgents`.
- **Create `packages/app/src/components/settings-agents.tsx`**: master-detail. Left = agent list (built-in vs custom badges via `Agent.Info.native`; hidden ones filtered). Right = editor form porting OpenChamber `AgentsPage` fields → all writable via `config.agent[name]`: `description` (textarea), `mode` (3 chip buttons primary/subagent/all), `model` override (reuse existing `DialogSelectModel`/model picker), `temperature` + `top_p` (NumberInput, undefined-able with clear-✕), `prompt` (mono textarea), `color`, `disable` (the enable/disable toggle), `hidden`. Save → `setConfigKey("agent."+name, {...})`.
- **Delete semantics**: config-defined agent → `disable:true` only (note in UI "disabled, not removed"); file-defined agent → needs file route (deferred to Phase 4). Document this in the UI.

**Phase 1 verification**: `bun run typecheck` in `packages/app` + `packages/ui` (expect only the known `app/src/custom-elements.d.ts` tsgo quirk). Browser via vite (localhost:3000) + engine `serve --port 4096`, locale=he/dir=rtl with Playwright: (1) open status popover, confirm all 6 tabs reachable + edge-fade visible; (2) click a real file in-session → renders content, click an empty file → empty state not blank; (3) open workspace-docs → CLAUDE.md renders, a non-existent doc shows error; (4) open Settings → Agents, edit a Team role's model + temperature, save, reopen → persisted; toggle disable → agent drops from chat selector.

---

## PHASE 2 — Skills (+ enable/disable/view) and MCP (full)

Both reuse existing rich engine surfaces; no new routes for the core CRUD.

### 2A. Skills section
Data: `GET /skill` (`sync` → `sdk.client.app.skills()`), returns `{name,description,location,content,hidden}`. Enable/disable: `permission.skill[name]="deny"|"allow"` (the only API toggle — already in `status-popover-body.tsx:168-193`).
- **Edit `dialog-settings.tsx`**: add `skills` trigger + content under the workspace group.
- **Create `packages/app/src/components/settings-skills.tsx`**: master-detail. List grouped by `SidebarGroup` (group = subfolder parsed from `location`) + source badge (claude/codex/opencode/squadcoder derived from path). Detail = read-only `SKILL.md` viewer (`Markdown text={skill.content}`) + enable/disable `<Switch>` (→ `permission.skill`) + "Open file" (`platform.openPath(skill.location)`) + "Manage folder".
- **Add/Edit/Delete of skill files** = file ops with no engine route today. MVP: "Add skill" registers a folder/URL via `config.skills.paths[]`/`urls[]` (no file write needed) + "Open in editor" for edit. **True in-app create/edit/delete deferred to Phase 4 (needs file routes).**

### 2B. MCP section
Richest existing route set (`server/routes/instance/mcp.ts`): `GET /mcp`, `POST /mcp` (add, runtime), `POST /mcp/:name/connect|disconnect`, `POST/DELETE /mcp/:name/auth*`. Persist via `config.mcp[name]`.
- **Edit `dialog-settings.tsx`**: add `mcp` trigger + content (group "server" or "tools").
- **Create `packages/app/src/components/settings-mcp.tsx`**: port OpenChamber `McpPage` master-detail. List = config `mcp` + runtime `mcp.status()` dot. Editor: transport toggle local/remote; local = command argv + env editor; remote = url + headers + collapsible OAuth. Header live actions: **Connect/Disconnect** (`sdk.client.mcp.connect/disconnect` — reuse `useMcpToggleMutation`), **Authorize** (`POST /mcp/:name/auth` + `/auth/authenticate` browser flow + paste-callback fallback), **Test**, **Clear auth** (`DELETE /mcp/:name/auth`).
- **Durable add** = do BOTH: `POST /mcp` (runtime connect) + `config.mcp[name]={...}` (persist). **Disable** = `config.mcp[name].enabled=false` + `disconnect`. **Delete**: merge can't drop the key → set `enabled:false` and gray it out; true removal needs editing config.json (flag this; optional Phase 4 file route).
- **Import-JSON paste** (port `mcpImport.ts`): paste Claude-Desktop / `mcpServers` snippet → `parseImportedMcpSnippet` → fill form. (Feeds Phase 6 Import too.)

**Phase 2 verification**: typecheck both packages. Playwright he/rtl: toggle a skill off → it leaves the chat skill set; open a bundled MCP (e.g. higgsfield), Connect → status dot green, Test → ok; paste an MCP JSON snippet → form fills; persisted across reload.

---

## PHASE 3 — Plugins, Remote-SSH, Indexing (status + toggle)

### 3A. Plugins section
Data: `config.plugin[]` (no dedicated list route — read from `GET /config`). Specs are `string` or `[id, opts]`.
- **Create `packages/app/src/components/settings-plugins.tsx`**: list config plugins + runtime `plugin_origins`; add via `AddPluginDialog`-style tabbed import (npm spec / path / file). **Add/remove must resend the whole `plugin` array** (`replaceArray("plugin", next)`) because merge replaces by index and can't drop entries. No `enabled` flag → "disable" = remove from array. File plugins are read-only (delete needs file route, Phase 4).
- **Edit `dialog-settings.tsx`**: add `plugins` trigger + content.

### 3B. Remote-SSH section
Reuse — do NOT build a transport. Lift the existing `DialogSelectServer` add-server form (`dialog-select-server.tsx`, already has SSH/Tailscale setup steps per memory session 5) into a Settings pane.
- **Create `packages/app/src/components/settings-remote.tsx`**: list configured servers (`sync.data` servers + `useServerHealth`), "Add server" → existing `DialogSelectServer`, per-server health/version/default badge, connect/remove. Pure reuse of `ServerConnection.Http`. Update `REMOTE.md` if behavior changes.
- **Edit `dialog-settings.tsx`**: add `remote` trigger under "server" group.

### 3C. Indexing section (status + re-scan, Cursor-like) — **honest MVP**
**Hard limitation (verified)**: engine has no native IndexService, no index status route, and **no generic "call MCP tool" route** — so a re-scan button cannot invoke `index_codebase` over HTTP today. Two-stage delivery:
- **Stage 1 (this phase, no new core code)**: Settings▸Indexing panel shows the bundled `codebase-index` MCP state (from `mcp.status()`), an enable toggle (`config.mcp["codebase-index"].enabled=true` + connect), and a clear "indexing runs through the agent" note. "Re-scan" sends a session turn invoking the index tool (drive-the-agent path) rather than a direct call — labeled as such. Progress = none yet (no event).
- **Stage 2 (requires the blocked embedder-packaging decision + new routes)**: the planned native `IndexService` (fastembed + sqlite-vec) with **NEW minimal engine routes** `POST /index/resync`, `GET /index/status`, and a `session.index` bus event for the progress bar. **Flag for user decision: (A) bundle model in installer vs (B) first-run download — recommend A.** Build the real progress-bar UI only after Stage 2 routes exist.
- **Edit `dialog-settings.tsx`**: add `indexing` trigger under "workspace".
- **Create `packages/app/src/components/settings-indexing.tsx`**: status card + enable toggle + re-scan (Stage-1 agent-driven) + a progress-bar placeholder wired to `session.index` (no-op until Stage 2).

**New engine routes named (Stage 2 only, minimal)**: `POST /index/resync` (kick off), `GET /index/status` (percent + file count), `session.index` SSE event. **None needed for Phases 1-3 Stage-1.**

**Phase 3 verification**: typecheck. Playwright: add an npm plugin (array resends correctly, persists); Remote pane lists servers + add-server opens; Indexing pane toggles the MCP on and the re-scan note is accurate.

---

## PHASE 4 — File-level CRUD enablement (the one real engine gap)

Everything above is config-merge-only. True create/edit/delete of **file-defined** agents and skills, and true MCP/plugin removal, need file writes the API doesn't expose today.

**New minimal engine routes** (mirror OpenChamber's `/api/config/*`, write into `.squadcoder/`):
- `POST /agent/file` `{name, scope, frontmatter, body}` → writes `.squadcoder/agent/<name>.md` (or `agent/<group>/<name>.md` for groups). `DELETE /agent/file/:name` → removes the `.md`.
- `POST /skill/file` `{name, scope, group, frontmatter, instructions, supportingFiles}` → writes `<dir>/skills/<name>/SKILL.md`. `PATCH`/`DELETE` analogues + `…/files/:path` for supporting files.
- Optional `DELETE /mcp/config/:name` and `DELETE /plugin/config/:name` that truly drop the key from config.json (the only way to delete given merge limitations) — small, surgical, write through `cfg.update` with a delete-aware path.

These let Phase 1-3 sections upgrade from "disable-only" to true delete, and add **Agent Groups** (write into `agent/<group>/`) and **Skill create/edit**.

- **Edit** `packages/opencode/src/server/routes/instance/` (add `agent-file.ts`, extend `skill`/`mcp` route files), register in the server router. Keep edits small + marked (core diff). 
- **Upgrade** `settings-agents.tsx` (groups via `SidebarGroup` + create/delete), `settings-skills.tsx` (create/edit/delete + supporting files), `settings-mcp.tsx`/`settings-plugins.tsx` (true delete).

**Phase 4 verification**: typecheck engine (`packages/opencode`) + app. Playwright: create a custom agent in group "team" → appears under collapsible group, file exists on disk; delete it → file gone; create+edit a skill; delete an MCP entry → truly removed from config.json.

---

## PHASE 5 — Skills Catalog (browse / install)

Port OpenChamber's catalog wholesale; point a source at the SquadCoder seed repo (serves #38/#45).
- **New engine routes** (mirror OpenChamber): `GET /skill/catalog`, `GET /skill/catalog/source?sourceId=&cursor=`, `POST /skill/scan` (validate repo has SKILL.md), `POST /skill/install` (`{source, subpath, scope, selections, conflictPolicy, conflictDecisions}`). Reuse the Phase-4 skill-file writer for the actual install.
- **Create** `packages/app/src/components/settings-skills-catalog.tsx` + `dialog-install-skill.tsx` + `dialog-add-catalog.tsx` + `dialog-install-conflicts.tsx` (ports of OpenChamber catalog components). Source `Select` (SquadCoder seed + Anthropic GitHub + custom), search, install with conflict/auth handling, "Load more" pagination.
- **Edit `dialog-settings.tsx`**: add `catalog` trigger (sub-tab of Skills, or its own).

**Phase 5 verification**: typecheck. Playwright: open catalog, search, install a skill → lands in `.squadcoder/skills/`, conflict dialog appears on re-install.

---

## PHASE 6 — Import-from-existing

Two classes (verified): **already-live** (skills from `.claude/.codex/.opencode`, `.claude` commands — engine auto-discovers) → *discovery + toggle*, not a copy wizard. **Not-live** (Claude/Cursor agents, Claude-Desktop/Cursor MCP, `.claude.json` MCP which is default-OFF) → *real selective import* that converts + writes into `.squadcoder/`.
- **New engine route** (one, minimal): `GET /import/scan?sources=` → scans `~/.claude/agents/*.md`, `~/.claude.json`, `%APPDATA%\Claude\claude_desktop_config.json`, `<project>/.cursor/mcp.json`, external skill/command dirs; returns previewable candidates with secrets **redacted** (reuse `redactCommand`/`redactString`). `POST /import/apply` `{selections, scope}` → for MCP runs each through the existing `ConfigMCP.fromClaude` converter and writes to `config.mcp`; for agents transforms frontmatter (`tools` comma-string → map, default `mode:subagent`) and writes `.squadcoder/agent/<name>.md` via the Phase-4 writer.
- **Create `packages/app/src/components/settings-import.tsx`**: tabbed by source class. "Discovered (already active)" = list skills/commands with per-source on/off mapping to `MIMOCODE_DISABLE_*` flags + optional "copy into project". "Import" = checklist of agents/MCP candidates, redacted secrets, scope (global/project) picker, confirm → `POST /import/apply`. Never copy plaintext keys silently — prompt to confirm/re-enter.
- **Edit `dialog-settings.tsx`**: add `import` trigger.

**Phase 6 verification**: typecheck. Playwright: scan → see Claude agents + Claude-Desktop MCP candidates with redacted env; import a Claude agent → appears in Agents section + file written; toggle a discovered skill source off → skill leaves the set.

---

## Top-bar shortcuts design

The status popover (`status-popover.tsx`) already aggregates servers/mcp/lsp/plugins/skills/agents. Make each popover tab a **direct deep-link into the matching Settings section** instead of only an inline list.
- **Mechanism**: add a Settings-open command per section. Reuse the existing settings dialog + Kobalte `Tabs` controlled `value`. Convert `DialogSettings` to accept an optional `defaultValue` prop (or a `settings.open` command with a `section` arg) so `openSettings("mcp")` opens straight to the MCP pane.
- **Edit `status-popover-body.tsx`**: each tab's footer "Manage …" button → `openSettings("<section>")` and close the popover. Servers→`remote`, mcp→`mcp`, lsp→ (read-only, link to a future LSP view or `general`), plugins→`plugins`, skills→`skills`, agents→`agents`.
- **Command palette**: register `settings.agents`, `settings.skills`, `settings.mcp`, `settings.plugins`, `settings.indexing`, `settings.remote`, `settings.import` commands (each opens settings at that section) so they're keyboard-reachable. Add i18n labels (en+he).
- **Edit `dialog-settings.tsx`**: thread the `defaultValue`/section arg into `<Tabs ... value={...}>`.

---

## Prioritized TODO (execution order — each a shippable, verifiable unit)

1. **Tab-overflow fix** (`tabs.css` alt block logical padding + gap + overflow affordance; widen body to 420px). Ship + verify all 6 tabs reachable LTR+RTL.
2. **Blank-file fix, in-session** (`context/file.tsx` setLoaded guard + `file-tabs.tsx` content-length Match + empty/error state, en+he keys). Verify empty + populated files.
3. **Blank-file fix, workspace docs** (`dialog-workspace-docs.tsx` → `file.read`, visible error/loading states). Verify.
4. **Shared foundation** (`settings-row`, `settings-section`, `use-config-mutation`, `scope-select`, `sidebar-group`). No UI yet — unblocks all sections.
5. **Agents section v1** (`settings-agents.tsx` config-layer editor + `dialog-settings.tsx` wiring + i18n). Verify model/temp/top_p/prompt/mode/disable persist.
6. **Top-bar shortcuts** (`DialogSettings` section arg + `settings.*` commands + popover "Manage" deep-links). Verify each popover tab opens the right pane.
7. **Skills section** (`settings-skills.tsx`: list/group/view/enable-disable/register-path). Verify toggle + view.
8. **MCP section** (`settings-mcp.tsx`: editor + connect/disconnect/auth/test + import-JSON; persist via config). Verify a bundled MCP end-to-end.
9. **Plugins section** (`settings-plugins.tsx`: array-resend add/remove + tabbed add dialog). Verify add/remove persist.
10. **Remote-SSH section** (`settings-remote.tsx`: reuse `DialogSelectServer`). Verify list + add.
11. **Indexing Stage-1** (`settings-indexing.tsx`: status + enable toggle + agent-driven re-scan note + progress placeholder). Verify toggle.
12. **Engine file routes** (Phase 4: `/agent/file`, `/skill/file`, true `DELETE` for mcp/plugin config). Verify create/delete on disk.
13. **Agents groups + true delete; Skills create/edit/delete** (upgrade sections on the new routes).
14. **Skills Catalog** (Phase 5: catalog routes + install/scan/conflict dialogs, SquadCoder seed source). Verify install.
15. **Import-from-existing** (Phase 6: `/import/scan` + `/import/apply` reusing `fromClaude` + redaction; `settings-import.tsx`). Verify Claude agent + Claude-Desktop MCP import.
16. **Indexing Stage-2** (BLOCKED on embedder-packaging decision): native `IndexService` + `POST /index/resync` + `GET /index/status` + `session.index` event + real progress bar.

---

## New engine routes — complete minimal list (nothing else invented)

| Route | Phase | Why merge-only config can't do it |
|---|---|---|
| `POST/DELETE /agent/file[/:name]` | 4 | File-defined agents aren't config; need a `.md` write/delete |
| `POST/PATCH/DELETE /skill/file[/:name]` (+ `/files/:path`) | 4 | Skills are files only; no config map exists |
| `DELETE /mcp/config/:name`, `DELETE /plugin/config/:name` | 4 (optional) | `mergeDeep` can't drop a key — only true delete path |
| `GET /skill/catalog`, `…/source`, `POST /skill/scan`, `POST /skill/install` | 5 | Catalog browse/install |
| `GET /import/scan`, `POST /import/apply` | 6 | Scan external dirs + convert via `fromClaude`/frontmatter transform |
| `POST /index/resync`, `GET /index/status`, `session.index` event | 3 Stage-2 | No native index + no generic MCP-tool-call route exists |

Everything in Phases 1-3 Stage-1 uses **only existing routes** (`PATCH /config`, `GET /agent|/skill|/mcp|/config`, `POST /mcp/*`). The two bugs need **zero** engine changes.

Key existing files to touch first: `packages/app/src/components/dialog-settings.tsx` (every section wires here), `packages/ui/src/components/tabs.css` (bug a), `packages/app/src/context/file.tsx` + `packages/app/src/pages/session/file-tabs.tsx` (bug b surface 1), `packages/app/src/components/dialog-workspace-docs.tsx` (bug b surface 2), `packages/app/src/components/status-popover-body.tsx` (shortcuts), `packages/app/src/i18n/{en,he}.ts` (every new key, both files, same edit).