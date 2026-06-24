# SquadCoder — Project Status & Working Notes (LIVING DOC)

> **Read this first, every session, alongside `CLAUDE.md` + the memory store.**
> This is the single human-readable source of truth for *what we're building, what's done, what's
> pending, and the user's standing requests*. Update it whenever scope or status changes.
> Last updated: **2026-06-19** (session 5).

---

## 0. What SquadCoder is

Open-source, **RTL/Hebrew-first** AI coding assistant for the Israeli market. Fork of
`XiaomiMiMo/MiMo-Code` (MiMoCode), itself a fork of `sst/opencode` (MIT). We inherit memory /
compose / dream-distill / agents / MCP / skills — **reuse, don't rebuild**.

Repo on disk: `C:\Users\raviv\OneDrive\Desktop\MuminAI\mumin` — branch `feat/muminai-foundation`.

**4 locked decisions:** (1) Open-core (MIT, keep attribution). (2) GUI-first RTL. (3) Claude auth =
API-key import **+** opt-in Claude Pro/Max OAuth (both, API key default). (4) Lean MVP first.

---

## 1. THE WORKING METHOD (non-negotiable — the user reminds us often)

**REUSE before BUILD.** For *every* feature decide in order:
1. Already in opencode/MiMoCode **core**?
2. An existing **safe, maintained, production** plugin / extension / **MCP**?
3. A safe third-party tool?
4. **Only then** build it ourselves.

- **Do NOT reinvent the wheel.** Before building anything, check core + the ecosystem.
- **Everything in the ENGINE core / seed** so it's shared across CLI + desktop + web + VS-Code ext.
- **Keep the core upstream-updatable** — prefer plugins + `.squadcoder/` config over editing core.
- **Verify third-party before bundling** (license, safety, maintenance, Windows).
- **Persist decisions** to memory + this doc so nothing slips across sessions.
- **UX first**, production-grade, Hebrew-translate everything, verify in BOTH RTL + LTR.

---

## 2. USER'S STANDING REQUESTS & NOTES (the backlog the user is tracking)

Grouped from the user's own words across sessions. ✅ = done, 🟡 = in progress, ⏳ = pending.

### Branding / UI / RTL
- ✅ Rename everything (opencode/MuminAI → **SquadCoder**); `>_` terminal-prompt logo = THE brand mark.
- ✅ Favicon → `>_` incl. real `.ico`; fixed broken web manifest; removed dev perf box (DebugBar).
- ✅ `opencode.json` → `squadcoder.json` in UI text; Discord/opencode/github links → `#` placeholders.
- ✅ Full Hebrew GUI + RTL that mirrors LTR perfectly (sidebar/main/icons). Verify RTL+LTR on every change.

### Models / auth / providers
- ✅ Default model **MiMo → Claude (Opus 4.8)**; strip the fake "connected" MiMo (Xiaomi default).
- ✅ Anthropic auth = **BOTH** Claude Pro/Max **OAuth** (real PKCE flow) **AND** API key. (Don't drop either.)
- ⏳ **#37 Per-agent model mapping** (Team roles → models, e.g. CTO=opus, dev=sonnet) — GUI **and** CLI.
  *(Audit note: core agents likely already support a per-agent `model` — so maybe only the GUI is new.)*

### Onboarding / first-run
- ✅ **#34** First-run welcome card (`>_` mark + accurate copy).
- ⏳ **AUDIT QUESTION (user's callout):** can onboarding be delivered by core's connect-provider flow or
  an existing extension instead of our custom card? → being audited now.

### Skills (BIG focus — see §3)
- 🟡 **Skills tab** in the addons box — ✅ view + open-folder shipped & verified; ⏳ enable/disable (#49).
- ⏳ **Ad-platform skills the user is STILL WAITING FOR:** Google Ads, Meta Ads, TikTok Ads — **and more**
  (LinkedIn, X/Twitter, Snapchat, Pinterest, Amazon) + measurement + cross-platform strategy. (#50)
- ⏳ **Auto-fire skills** — skills auto-activate when relevant; "have all skills in hand." (#51)
- ⏳ **Universal / portable** skills — usable with **Codex, Claude Code, opencode** etc. (#52)
- ⏳ **Auto-use & self-improve** skills/memory (relates to core `/distill` + `/dream`; build only the gap). (#41)
- ✅/⏳ **Pro skills** incl. the **UI/UX** one (`ui-ux-pro-max` already bundled; verify it's pro-grade).
- ⏳ Curate more dev/UI-UX/image-gen/ad-copy skills + MCPs. (#45)

### Engine features ("in core, pre-installed")
- ✅ **#44** Bundle **Higgsfield** MCP (`https://mcp.higgsfield.ai/mcp`) + **Google Ads** MCP, key-config.
- ⏳ **Ralph loop in core** — Geoffrey Huntley's autonomous "until-done" loop (re-feed the spec until the
  task is complete), wired into the engine. (#46/#53)
- ⏳ **#43** Subagents / **parallel** in core + enable/disable **toggle in settings**.
  *(Audit note: subagents + `compose:parallel` + `batch_tool` already exist; likely only a toggle is new.)*
- ⏳ **#40** Auto-index project (Cursor-like) + progress UI. *(Plan: via a safe indexing MCP, opt-in, v2.)*
- ⏳ **#42** Workspace `.md` files viewer/editor tab (CLAUDE.md/AGENTS.md/memory/skills: view/edit/delete/disable).
- ⏳ **#48** Remote control **from phone** (Telegram / remote-opencode bridge). *(REMOTE.md already covers
  serve/attach + Tailscale/cloudflared; phone-specific bridge being audited for a safe existing option.)*

### MCPs / skills must be PRE-INSTALLED + no-key ones ENABLED & WORKING
- ⏳ Verify every bundled MCP/skill ships **in the engine seed** (all surfaces) and the **no-API-key** ones
  (playwright, context7, sequential-thinking, memory-graph) are **enabled and actually connecting**. → audit.

### Cross-cutting
- ✅ Translate all new strings to Hebrew (en + he; other 17 locales fall back to en).
- ⏳ **#33** Pull latest upstream fixes safely + document. *(Unrelated histories → selective cherry-pick.)*
- ⏳ **#32** Bundle `design-sync` skill. *(BLOCKED on claude.ai connector.)*
- 🔁 **`/loop`** autonomous mode active — "continue, no 4-minute wait."

---

## 3. STATUS BOARD (by task #)

### ✅ DONE & verified
`#1-#31` foundation: repo/upstream setup, recon, baseline build, rebrand, RTL+Hebrew GUI (3 layers),
bundle skills, bundle MCPs+bootstrap, Anthropic OAuth scaffold, remote sessions doc, installers,
remove `.mimocode`, vendor Hebrew+ui-ux skills, curated no-key MCPs, parallel-agent config,
Team Mode, first-run seed, RTL logical-CSS sweep, icon mirroring, Hebrew font, GUI he.ts dicts,
fix web manifest, `>_` favicon/icons, remove DebugBar, `squadcoder.json` strings, placeholder links,
clean ultramode MCPs, GlobalSDK crash investigation, agent-mode dropdown hovercards.
- **#30** Anthropic API key + Claude Pro/Max OAuth (real PKCE). **#34** onboarding card.
  **#35** default → Claude. **#36** strip MiMo default. **#38** Skills tab (view+open-folder, RTL+LTR verified, commit `d562767`).
  **#39** "Server" headline + new strings translated. **#44** Higgsfield + Google Ads MCPs. **#47** research pass.

### ✅ DONE this session (session 5, 2026-06-19) — all typecheck-clean & committed
- **#42** Workspace `.md` viewer dialog (`dialog-workspace-docs.tsx`, command + i18n) — commit `17bbb82`.
- **#59** Collapsible date-grouped sessions sidebar (Today/Yesterday/7d/30d/Older), opt-in toggle in
  project menu + command palette, persisted — commit `b0d0fc0`.
- **#57** Open-project picker root-cause fix: empty filter now shallow-lists the home dir (was empty
  `find.files` → "No folders found"); footer hint + clearer copy — commit `8ff5626`.
- **#56/#57b** Guided remote (SSH/Tailscale) connect: empty-state "Connect to remote" + setup steps in
  the add-server form; reuses existing remote-engine connect — commit `92653a7`, `REMOTE.md` updated.
- **#46** Loop/until-done = reuse core `/goal` (judge-gated) + curated safe extensions w/ security
  review → `EXTENSIONS.md`; **#40/#60** indexing plan → `INDEXING.md` — commit `60be8fc`.
- **#32** Portable `sc:design-sync` skill vendored (design→code, no hosted connector) — commit `6bd89e6`.
- **#45** Dev skills vendored: `sc:mcp-builder`, `sc:webapp-testing`, `sc:code-review` — commit `d6f861b`.

### ⏳ PENDING (need a user decision or careful live verification — not blind-buildable)
- **#40 / #60** Built-in semantic indexing. Plan written (`INDEXING.md`): self-contained **fastembed**
  (no Ollama) engine IndexService + auto-sync + progress UI. **Blocked on ONE decision:** embedder
  packaging — (A) bundle the model in the installer vs (B) first-run download. Interim offline MCP is
  bundled `enabled:false`. Recommend (A) for offline/IL focus.
- **#33** Upstream selective sync — 25 commits behind `upstream/main`; per-commit take/skip in
  `UPSTREAM_SYNC.md`. Not merged: conflict risk (build.ts, header-injection vs our Bearer plugin,
  mimocode-rename) + can't fully verify a build blind. Do interactively.

---

## 4. CURRENT ACTIVITY (live)

1. **Reuse-before-build audit** — `wf_d67eb78e-61e`. 10 feature auditors (already-in-core? safe extension?
   build-justified?) + 2 MCP/skill verifiers (pre-install in seed? no-key ones connecting?) + 1 synthesis.
   → output will be written to `REUSE_AUDIT.md` and drive the next actions.
2. **Ad-platform skill authoring** — dedicated workflow to deliver the skills the user is waiting for (#50).
3. **`/loop`** autonomous mode — advancing pending tasks between user turns.

---

## 5. BUNDLED MCPs & SKILLS (current state — `squadcoder.json`)

| MCP | Type | Needs key? | Enabled? | Notes |
|---|---|---|---|---|
| playwright | local npx | no | ✅ | browser automation |
| context7 | local npx | no | ✅ | live library docs |
| sequential-thinking | local npx | no | ✅ | reasoning |
| memory-graph | local npx | no | ❌ | **AUDIT: should this be enabled? (no key)** |
| github | local npx | yes (`GITHUB_TOKEN`) | ❌ | enable after token |
| higgsfield | remote http | yes (oauth) | ❌ | `https://mcp.higgsfield.ai/mcp` |
| google-ads | local npx | yes (GOOGLE_ADS_*) | ❌ | `github:promobase/google-ads-mcp` |

**Skills:** ~90 user-facing bundled (Israeli/Hebrew set + `ckm:*` design + `ui-ux-pro-max` +
`sc:ad-copywriting` + `sc:image-gen-prompting`), discovered from `.squadcoder/skills`. Compose-internal
`compose:*` skills are hidden. **Gap:** no ad-PLATFORM playbook skills yet (Google/Meta/TikTok ads) → #50.

---

## 6. BUILD & VERIFY CHEATSHEET

- **Seed:** `bun script/make-seed.ts` (repo root) → `seed/` (gitignored), from `.squadcoder/`.
- **CLI:** `cd packages/opencode && MIMOCODE_CHANNEL=prod bun run script/build.ts --single`.
- **Desktop:** `cd packages/desktop && OPENCODE_CHANNEL=prod bun run build` then `... package:win`.
  ⚠️ **must set `OPENCODE_CHANNEL=prod`** (else "SquadCoder Dev"). Clear `out/ dist/` first (OneDrive locks).
- **Zips:** PowerShell `Compress-Archive` (`zip` not in Git Bash here).
- **Engine route check:** `curl -H "x-mimocode-directory: <repo>" http://127.0.0.1:4096/<route>` (e.g. `/skill`, `/mcp`).
- **Browser verify:** vite dev on `:3000`; set locale via `localStorage["opencode.global.dat:language"]={"locale":"he"|"en"}` then reload; Playwright at 1440×900.
- **Typecheck:** `bun run --filter '@squadcoder/app' typecheck` (pre-existing `custom-elements.d.ts` tsgo quirk is benign).
- Build needs **bun ≥ 1.3.11**. Upstream merge = **unrelated histories** → cherry-pick/diff-apply only.

---

## 7. OPEN DECISIONS / RISKS

- **Onboarding**: keep custom card vs. adopt core/extension flow → audit verdict pending.
- **#49 skill toggle**: `Config.update` does `mergeDeep` + `Instance.dispose()` — verify array-merge semantics
  before building (re-enable may not persist otherwise).
- **Phone/Telegram (#48)**: a bot driving a coding agent is high-risk — adopt only a vetted-safe option, else document-only.
- **Auto-index (#40)**: pick a Windows-safe, maintained indexing MCP; was scoped v2.
- **NOT yet rebuilt**: installers do NOT yet include the session-4 GUI changes (Skills tab etc.) — batched rebuild pending.

---

## 8. RELATED DOCS

`CLAUDE.md` (entry point) · `FORK_STRATEGY.md` · `UPSTREAM_SYNC.md` · `FIXED_ISSUES.md` ·
`REMOTE.md` · `REBRAND.md` · `PLACEHOLDER_LINKS.md` · `SKILLS_ATTRIBUTION.md` · `REUSE_AUDIT.md` (pending) ·
plan: `~/.claude/plans/i-decided-to-create-compiled-corbato.md` · memory store: `…/memory/MEMORY.md`.
