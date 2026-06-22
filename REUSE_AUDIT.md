# SquadCoder — REUSE-BEFORE-BUILD AUDIT (⛔ READ BEFORE BUILDING ANYTHING)

> # ⛔ DO NOT DOUBLE-WORK.
> **Before building ANY feature, find it in the table below.** Most of what we want is **already in
> opencode/MiMoCode core** or has a **safe, maintained, production extension** to adopt. We only build
> what is genuinely net-new and UI-coupled. This file is the canonical verdict — update it, don't re-research.

Audit method (workflow `wf_d67eb78e-61e`, 2026-06-18, 13 agents): for each feature → (1) already in core?
(2) safe maintained production extension/MCP? (3) only then build. Each verdict has file-path evidence
(core) and real URLs/licenses (extensions).

---

## ⭐ VERDICTS AT A GLANCE

| Feature | Task# | Verdict | What to actually do |
|---|---|---|---|
| First-run onboarding | 34 | **reuse-core** | Card is inherited core (`layout.tsx:2300`). Keep our 14-line tweak. **Fix ~18 locales** still saying "free models". Build nothing. |
| Per-agent model mapping | 37 | **reuse-core** | Mechanism exists (`agent.<name>.model`, `model_groups`, Team-mode tiers). Build **GUI-only** editor reusing `dialog-select-model.tsx`. |
| Self-improving skills/memory | 41 | **reuse-core** | `/distill` + `/dream` + `auto-dream.ts` (7d/30d) + `compose:self-extend` already do this. Just **surface + Hebrew-localize** + reconcile stale `.mimocode` paths. |
| Subagents / parallel + toggle | 43 | **reuse-core** | `actor.ts` + `compose:parallel` + `tools.actor`/`permission.actor` exist. Build a **thin settings toggle** over existing flags. |
| Loop / until-done ("Ralph") | 46 | **reuse-core** | Core `/goal` (judge-gated stop, `session/goal.ts`) is **stronger than naive Ralph re-prompt loops**. Add a GUI button over `/goal`; **do NOT** adopt ralph-loop/opencode-loop (weaker). |
| Bundled MCPs / curated set | 44/45 | **reconsider** | Mechanism right (pure config). But `google-ads` was **broken** (Python repo via npx) — fixed. Higgsfield endpoint correct. |
| **Phone control (Telegram)** | 48 | **adopt-extension** | Adopt **`grinev/opencode-telegram-bot`** (MIT, 819★, Win, single-user allowlist). Don't build a bridge. Opt-in, document in REMOTE.md. |
| **Auto semantic index** | 40 | **adopt-extension** | Adopt **`opencode-codebase-index`** (Helweg, MIT, offline Ollama, Win, opencode-native). Bundle **disabled**. Don't author an indexer. |
| Skills tab (view) | 38 | **build** (thin) | ✅ DONE — thin GUI over `GET /skill`. No plugin can add GUI tabs; justified. |
| Skill enable/disable | 49 | **build** (thin) | Write the existing **`permission.skill {name: deny\|allow}`** — NOT a new disabled-array. Add a minimal config-write route if none exists. |
| Workspace `.md` hub tab | 42 | **build** (thin) | In-app tab, ~70-80% reused primitives (`file-tree`, `markdown.tsx`). **MVP = view-only**; true edit/delete needs a new write route (defer). |

---

## ✅ APPLIED THIS SESSION (2026-06-18)

Config fixes already made to **`squadcoder.json`** (regenerate seed + mirror to `seed/squadcoder.json` on next build):
1. **`github` MCP** — replaced the **DEPRECATED** `@modelcontextprotocol/server-github` (archived, last publish 2025-04-08) with the **official remote** `github/github-mcp-server` (`https://api.githubcopilot.com/mcp/`, `Authorization: Bearer ${GITHUB_TOKEN}`). Stays `enabled:false` (token-gated).
2. **`google-ads` MCP** — was **dead-on-arrival** (`npx -y github:promobase/google-ads-mcp` can't run a Python repo). Switched to the **official Apache-2.0** `googleads/google-ads-mcp` via **`uvx`**. Stays `enabled:false`; **requires Python 3.12+ + uv** (document in SETUP).
3. **`memory-graph` MCP** — flipped to **`enabled:true`** (no-key, safe) to honor "no-key MCPs enabled & working". NOTE: overlaps core `/distill`+`/dream`+`MEMORY.md`; it's an *additional* graph store — flip off if the two-stores overlap is unwanted.
4. **`codebase-index` MCP (#40)** — **adopted** `opencode-codebase-index-mcp@0.11.0` as a new entry, **`enabled:false`** (opt-in). Local Ollama embeddings = zero cloud egress; needs a local Ollama to enable.

Still TODO from this audit (tracked as tasks): adopt Telegram bot doc (#48), GUI-only model editor (#37), settings toggle (#43), `/goal` button (#46), surface auto-dream (#41), fix onboarding locales (#34), skill toggle via `permission.skill` (#49), `.md` hub view-only tab (#42), `.squadcoder/SETUP.md` (Python/uv + Ollama + Higgsfield-credits + GitHub-token prereqs).

---

## 📋 FULL SYNTHESIS REPORT

> Scope: tasks #34, #37, #38/#49, #40, #41, #42, #43, #44/#45, #46, #48 + bundled MCP/skill pre-install verification.
> Working principle: **reuse-core → adopt-safe-extension → build (last resort).**

### TL;DR

- **Almost nothing here needs building — the heavy lifting is already in core.** Six features are **reuse-core**: onboarding (#34), per-agent model mapping (#37), self-improving skills/memory (#41), subagents/parallel + toggle (#43), loop/until-done (#46). The only net-new work is thin GUI/Hebrew surfacing over existing config/commands.
- **Clean adopt for phone control (#48):** `grinev/opencode-telegram-bot` (MIT, 819★, release 3 days before audit, Windows, single-user allowlist, no open ports, explicit permission confirmation). Adopt + document opt-in.
- **Adopt for v2 indexing (#40):** `opencode-codebase-index` (Helweg, MIT, fully offline via local Ollama, Windows binaries, opencode-native). Core has **no** semantic index (only ripgrep/fuzzy). Bundle **disabled by default**.
- **One bundled MCP was broken (#44):** `google-ads` invoked a Python repo via npx (dead-on-arrival). Fixed to official `googleads/google-ads-mcp` via uvx.
- **No-key MCPs enabled AND runtime-verified working:** `playwright`, `context7`, `sequential-thinking` returned `status:connected` on the live engine; real current npm packages. Skills genuinely in the **engine seed** (83 SKILL.md, 822-file seed) reaching all four surfaces (CLI/desktop/web/VS-ext) via one shipping path.
- **Two MCP cleanups:** deprecated `github` package (swapped to official); `memory-graph` no-key default (we enabled it).
- **Only two genuine builds, both thin & UI-coupled:** Skills tab (#38/#49) and `.md` hub tab (#42) — no plugin can supply in-app GUI tabs and neither is in core. #42's edit/delete half is blocked by a GET-only file API (defer true editing).

### Onboarding (#34) — answered directly

**Yes — onboarding is already delivered by core; SquadCoder did NOT and should NOT build a custom onboarding component.** The "welcome → add first model → skip/later" flow is the native opencode/MiMoCode **getting-started card** (`packages/app/src/pages/layout.tsx:2300-2326`) wired to the core `DialogConnectProvider` (api-key/oauth), inherited at fork commit `7233b71`. Task #34 was a justified 14-line customization (`>_` Mark + en/he copy). No onboarding plugin exists in the awesome-opencode registry (only credential-auth helpers, already covered by `DialogConnectProvider` + #30 OAuth), and onboarding is UI-coupled so a plugin isn't the right vehicle. **Action:** keep the edit; fix the ~18 other locales still falsely promising "free models" (false after the MiMo strip #36).

### MCPs & skills pre-install — verified

The **no-key set is enabled AND runtime-verified working**; MCPs + skills bundle in the **engine seed** (not per-surface) so all four surfaces inherit them; key-required servers are inert until configured (`mcp/index.ts:431/516` short-circuit on `enabled:false` → no first-run errors). Seed path: `script/make-seed.ts:60` copies `.squadcoder/skills → seed/skills`; CLI → `dist/<name>/bin/seed`; desktop → `extraResources` + `SQUADCODER_SEED_DIR`; engine seeds the global config dir once per version (`seedDefaults`). `make-seed` strips only `instructions` + `skills.paths` (skills auto-discover via dir scan); the `mcp` block is preserved verbatim.

### Recommended changes (ordered; tags [reuse]/[fix]/[build]/[drop])

1. **[fix]** Fix/drop broken `google-ads` (Python via uvx, not npx; Python 3.12+; keep off; maybe exclude from MVP). ✅ *fixed to official uvx.*
2. **[fix]** Replace deprecated `github` package with official `github/github-mcp-server`. ✅ *done (remote).* 
3. **[adopt]** Phone control (#48): adopt `grinev/opencode-telegram-bot`; document opt-in in REMOTE.md (serve+password, `TELEGRAM_ALLOWED_USER_ID`, permission auto-approve OFF, bind 127.0.0.1, bot-token==RCE). Reference in docs, NOT the MCP list.
4. **[reuse]** Per-agent model (#37): GUI-only editor writing existing `agent.<name>.model` + `model_groups` tiers; reuse `dialog-select-model.tsx`. Don't rebuild resolver/schema.
5. **[reuse]** Subagent/parallel toggle (#43): thin settings UI over `tools.actor` / workflow flag / `permission.actor`. (Upstream request #15222 — candidate to upstream.)
6. **[reuse]** Loop/until-done (#46): GUI button over core `/goal` + live judge verdict. Don't build loop logic or adopt naive re-prompt loops (ralph-loop/opencode-loop/OpenLoop are weaker than the judge gate).
7. **[reuse]** Self-improving memory/skills (#41): expose `auto-dream`/`auto-distill` toggles + intervals; Hebrew activity entries; make `/distill`/`/dream`/`/init`/`compose:self-extend` discoverable. Confirm the trajectory DB resolves under `.squadcoder` after rebrand.
8. **[fix]** Reconcile stale `.mimocode`/`mimocode.db` refs in `distill.txt`/`dream.txt`/`self-extend` vs the `.squadcoder` rebrand.
9. **[fix]** Fix the ~18 non-en/he onboarding locales (#34) still promising "free models".
10. **[build]** Skills tab (#38) — keep thin GUI. #49 toggle = write `permission.skill {name: deny|allow}` (+ optional `hidden:true`), not a bespoke store; add a minimal config-write route if none exists. Don't adopt openskills/CLI installers (they clone+exec external content).
11. **[build]** Workspace `.md` hub tab (#42) — in-app tab, MVP view-only (reuse `file-tree.tsx` + `markdown.tsx` + file-protocol tabs). Defer in-app edit/delete (needs new write route + security surface). Markdown preview is an open upstream request (#10022/#13705/#14187/#16782) — candidate to upstream.
12. **[adopt]** Auto index (#40): adopt `opencode-codebase-index@0.11.0` disabled-by-default, local Ollama embeddings, surface its progress + Hebrew enable flow. Fallbacks documented: `zilliztech/claude-context`, `flupkede/codesearch`. Reject `code-index-mcp` (lexical-only). ✅ *added disabled.*
13. **[adopt]** Autonomous-run guardrails (#46 second half): adopt **CC Safety Net** (MIT, 1.4k★, passive destructive-command backstop) + **Envsitter Guard** (MIT, `.env` leak guard) as opt-in. Avoid scrapers, credential-proxy auth plugins, network-egress notifiers for an offline-first Hebrew IDE.
14. **[fix]** `memory-graph` default decision — we **enabled** it (no-key) per the "no-key enabled" directive; flip off if two memory stores overlap.
15. **[fix]** Pin supply-chain refs (google-ads pinned via official; consider pinning `@latest` on playwright/context7); re-test every bundled MCP `npx -y <pkg>` on a clean Windows box.
16. **[reuse]** Verdicts recorded in memory so they aren't re-introduced.

---

## Extensions assessed (safe to adopt vs avoid)

**Adopt (safe, MIT/Apache, maintained, Windows):**
- `grinev/opencode-telegram-bot` — MIT, 819★, v0.21.2 (2026-06-15), official SDK, single-user allowlist → **#48 phone**.
- `Helweg/opencode-codebase-index` — MIT, v0.11.0 (2026-06-16), offline Ollama, Windows binaries → **#40 index**.
- `CC Safety Net` (MIT, 1.4k★) + `Envsitter Guard` (MIT) — opt-in guardrails for autonomous `/goal` runs → **#46**.

**Avoid bundling:** scrapers (Xquik/x-twitter), credential-proxy auth plugins (Antigravity/Omniroute/Kilo — high blast radius), network-egress notifiers/search (Google AI Search, WakaTime, Slack/ntfy) — wrong for an offline-first Hebrew IDE. Naive loop plugins (ralph-loop/opencode-loop/OpenLoop) — weaker than core `/goal`. CLI skill installers (openskills et al.) — clone+exec external content (skill-installer risk, not a viewer).

---

## 2026-06-21 — Routines + Usage-limit indicator

### Routines — VERDICT: reuse-core + adopt-extension (do NOT copy OpenChamber)
- **OpenChamber has NO "routines" feature** — only UI-layer "Project Actions" + per-project notes/todos, all OpenChamber-only (not opencode-engine reusable). Verified via README/roadmap/releases. Nothing to port from it.
- **"Saved / reusable / multi-step task" = opencode CORE `command/**/*.md`** (frontmatter `template`/`description`/`agent`/`model`/`subtask` + `$ARGUMENTS` / `!shell` / `@file`). Implement SquadCoder routines as **`.squadcoder/command/*.md`** (auto-seeded by make-seed, merge-safe). Multi-step = a `steps`-style convention expanded in the routine prompt — **cannot depend on `subtask2`** (PolyForm Noncommercial = reuse blocker; design reference only).
- **Recurrence/scheduling = NOT in core.** Adopt **MIT `different-ai/opencode-scheduler`** (~408★, Windows via schtasks) OR keep scheduling out-of-process (OS Task Scheduler / GitHub Actions calling `opencode run`). Scheduling must live **outside the agent loop**; bundle disabled/opt-in + security-review autonomous runs before shipping.
- **Status:** verdict delivered + recorded. Implementation is a separate tracked task (pending user go) — user wants on-demand + recurring + multi-step, shipped automatically on install.

### Usage-limit indicator — VERDICT: build-thin (DONE 2026-06-21)
- Anthropic **Pro/Max OAuth** subscription usage = `anthropic-ratelimit-unified-5h/7d-{utilization,reset,status}` response headers (also `GET /api/oauth/usage`). Reverse-engineered/undocumented, **medium-high** confidence (ccusage + claude-relay + Claude Code all rely on them). The SquadCoder OAuth plugin already sends the required `oauth-2025-04-20` beta.
- **Built:** plugin captures headers → temp JSON snapshot (`anthropic-oauth.ts`, kept OUT of core for ToS reasons); dumb core route `GET /usage/anthropic` serves it; app polls + renders a yellow `DockTray` above the prompt input (`use-anthropic-usage.ts` + `session-usage-dock.tsx`, en/he, RTL). Ships via seed. Safe degradation: if headers absent, box never shows.
