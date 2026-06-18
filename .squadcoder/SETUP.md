# SquadCoder Setup — bundled MCPs, skills, and optional Claude subscription login

## Bundled MCP servers (config-driven, zero core changes)
`.squadcoder/squadcoder.json` ships a default `mcp` block. Servers run on demand via `npx`/`uvx`:
**Enabled by default — NO API key required:**
- **playwright** (`@playwright/mcp`) — browser automation/testing.
- **context7** (`@upstash/context7-mcp`) — up-to-date library/framework docs.
- **sequential-thinking** (`@modelcontextprotocol/server-sequential-thinking`) — structured multi-step reasoning.
- **memory-graph** (`@modelcontextprotocol/server-memory`) — knowledge-graph memory. **Enabled** (no key). Optional complement to the engine-native `/distill`+`/dream`+`MEMORY.md`; disable if you don't want a second store.

**Disabled until you provide the prerequisite (so a fresh, keyless install never errors):**
- **github** — official remote MCP `https://api.githubcopilot.com/mcp/` (sends `Authorization: Bearer ${GITHUB_TOKEN}`). Set `GITHUB_TOKEN`, then enable. *(Replaces the deprecated `@modelcontextprotocol/server-github`.)*
- **higgsfield** — remote MCP `https://mcp.higgsfield.ai/mcp`, image/video generation. Needs a **paid Higgsfield account**; authorize via **OAuth** on first connect (no key stored).
- **google-ads** — official Apache-2.0 `googleads/google-ads-mcp` run via **`uvx`**. Needs **Python 3.12+ and uv**, plus `GOOGLE_ADS_DEVELOPER_TOKEN` / `GOOGLE_ADS_CLIENT_ID` / `GOOGLE_ADS_CLIENT_SECRET` / `GOOGLE_ADS_REFRESH_TOKEN`. *(Was a broken `npx github:promobase/...` — that repo is Python, not npm.)*
- **codebase-index** — `opencode-codebase-index`, a fully-offline semantic codebase index (Cursor-like). Needs a local **[Ollama](https://ollama.com)** + `ollama pull nomic-embed-text` (zero cloud egress, zero API cost). On Windows the native binary uses a non-SIMD scalar fallback (functional, slightly slower).

> **Intentionally not bundled** (safety-vetted): `fetch` (unpatched SSRF advisory CVE-2025-65513),
> `sqlite` & `puppeteer` (upstream **archived**, no security updates; Puppeteer is also redundant with
> Playwright), `filesystem`/`git` (redundant with built-in file/shell tools; `filesystem` also needs a
> per-user path). Add any of these yourself if you accept the trade-off.

### One-time: install Playwright browsers
The Playwright MCP needs browser binaries. After install, run once:
```bash
npx playwright install chromium
```
(A future `squadcoder-plugin-bootstrap` / installer step will do this automatically on first run.)

## Bundled skills (93, all MIT/permissive, no API key)
Skills auto-load from `.squadcoder/skills/**/SKILL.md` (portable — they also work if dropped into a
`.claude/`, `.codex/`, `.opencode/`, or `.agents/` skills dir). Full list in `SKILLS_ATTRIBUTION.md`:
- **Hebrew/Israeli (Skills-IL):** `hebrew-rtl-best-practices`, `hebrew-document-generator`
  (RTL PDF/DOCX/PPTX), `hebrew-content-writer`, `hebrew-i18n`, `israeli-tax-returns`,
  `israeli-id-validator`, `wcag-accessibility-widget`, + ~70 more dev/Israeli skills.
- **UI/UX (ui-ux-pro-max):** `ui-ux-pro-max`, `ui-styling` (67 styles/161 palettes), `design`,
  `design-system`, `brand`, `banner-design`, `slides`.
- **Advertising platforms (NEW):** `google-ads`, `meta-ads`, `tiktok-ads`, `linkedin-ads`,
  `x-ads`, `snapchat-ads`, `pinterest-ads`, `amazon-ads`, `ad-measurement-tracking`,
  `cross-platform-ad-strategy` — pro campaign playbooks with Hebrew/IL-market notes; `google-ads`
  can drive the bundled google-ads MCP. Plus `ad-copywriting` + `image-gen-prompting`.

Add more by dropping a folder with a `SKILL.md`.

## Team Mode + extra agent types (NEW — see `TEAM_MODE.md`)
Beyond upstream `build`/`plan`/`compose`, SquadCoder ships extra primary modes (`Tab` to switch):
- **`team`** — orchestrator that runs a whole engineering org: it classifies your task and
  fires specialist subagents (**Product, Architect, Researcher, Developer ×N, UI/UX,
  Security, QA**) **in parallel**, coordinating them through the persistent task-memory,
  then synthesizes one result. Token-aware: it scales the team to the task size and
  announces the roster before spawning.
- **`audit`** — standalone read-only security/cyber review (OWASP, authz, injection, secrets, deps).
- **`design`** — standalone UI/UX pass using the bundled `ui-ux-pro-max` + Hebrew/RTL skills.

The **Researcher** role is token-heavy and **off by default** — the orchestrator confirms
before using it. Hard-disable with `{"agent":{"team-researcher":{"disable":true}}}`.
Role model tiers (`ultra`/`standard`/`lite`) come from `model_groups`; unset = your default
model. Full details, the tooltip wording, and cost knobs are in `.squadcoder/TEAM_MODE.md`.

## Maximum-coding configuration (pre-tuned in squadcoder.json)
Tuned out-of-the-box for parallel, high-throughput coding:
- `experimental.batch_tool: true` — the agent issues multiple tool calls in **parallel** (faster multi-file reads/edits).
- **Parallel subagents** — build/plan/compose/team agents spawn subagents (via the `actor` tool) that run concurrently; multiple tool calls in one turn execute in parallel. The separate `workflow.maxConcurrentAgents` setting (default `min(16, 2×cores)`) bounds the heavier `workflow()` tool fan-out.
- **Compose mode** (`Tab` to switch agent) — specs-driven workflow with built-in skills: plan, execute, code-review, TDD, debug, verify, merge.
- **Max Mode** (opt-in — best quality, higher cost): switch to the `max` agent / set `experimental.maxMode.candidates` to run N parallel reasoning candidates per step with a judge. Not default (multiplies token cost).
- Persistent **memory + checkpoints**, `/dream`, and `/distill` (auto-skill creation) are core SquadCoder features, on by default.

## Environment flags (upstream-issue fixes)
- `MIMOCODE_TUI_MAIN_SCREEN=1` — render the TUI in the terminal's **main screen** so native
  scrollback works for long output (fixes the "can't scroll up" complaint, upstream #11). The
  full-screen UI is the default; this is opt-in. (Zero-code alternative: `OTUI_USE_ALTERNATE_SCREEN=false`.)
- `SQUADCODER_ENABLE_OPENCODE_PROVIDERS=1` — re-enable the `opencode`/`opencode-go` providers if you
  authenticated your own key (they're disabled by default so the upstream free tier doesn't
  auto-load; upstream #79).

> Known Windows-terminal limitations we don't paper over: in the **legacy console** (a
> double-clicked `.exe`, conhost) paste may not work and output can garble — run inside **Windows
> Terminal** / PowerShell instead. Tracked upstream as #182 / #522 (we added a console-restore
> guard for abnormal exits; full coverage needs a live-terminal fix).

## Authentication
- **Default (recommended):** BYOK API key, or **Import from Claude Code** (copies
  `ANTHROPIC_API_KEY` from `~/.claude/settings*.json`), or any OpenRouter model
  (incl. `openrouter/fusion`).
- **Optional (advanced, at your own risk):** Claude Pro/Max **subscription** login —
  see `.squadcoder/optional/anthropic-oauth.ts`. It lives in `optional/` (which is **not**
  auto-scanned, so it never loads unless you ask for it). To enable, add it to the `plugin`
  array in `.squadcoder/squadcoder.json`:
  ```json
  "plugin": [".squadcoder/optional/anthropic-oauth.ts"]
  ```
  ⚠️ Anthropic's ToS prohibits using subscription tokens outside official clients, and Anthropic
  actively blocks this. It may stop working and could risk your account. Use API keys for anything
  important. This is a community workaround, not endorsed by Anthropic or SquadCoder.
