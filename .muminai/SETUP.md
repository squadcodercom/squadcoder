# MuminAI Setup — bundled MCPs, skills, and optional Claude subscription login

## Bundled MCP servers (config-driven, zero core changes)
`.muminai/muminai.json` ships a default `mcp` block. Servers run on demand via `npx`/`uvx`:
All **enabled** servers are npx-based and need **NO API key**:
- **playwright** (`@playwright/mcp`) — browser automation/testing. Enabled.
- **context7** (`@upstash/context7-mcp`) — up-to-date library/framework docs. Enabled.
- **sequential-thinking** (`@modelcontextprotocol/server-sequential-thinking`) — structured multi-step reasoning. Enabled.
- **memory-graph** (`@modelcontextprotocol/server-memory`) — knowledge-graph memory. Disabled by default (MuminAI already has its own session memory; enable if you want a separate graph).
- **github** (`@modelcontextprotocol/server-github`) — disabled until you set `GITHUB_TOKEN`.

### One-time: install Playwright browsers
The Playwright MCP needs browser binaries. After install, run once:
```bash
npx playwright install chromium
```
(A future `muminai-plugin-bootstrap` / installer step will do this automatically on first run.)

## Bundled skills (81, all MIT, no API key)
Skills auto-load from `.muminai/skills/**/SKILL.md` — full list in `SKILLS_ATTRIBUTION.md`:
- **Hebrew/Israeli (Skills-IL):** `hebrew-rtl-best-practices`, `hebrew-document-generator`
  (RTL PDF/DOCX/PPTX), `hebrew-content-writer`, `hebrew-i18n`, `israeli-tax-returns`,
  `israeli-id-validator`, `wcag-accessibility-widget`, + ~70 more dev/Israeli skills.
- **UI/UX (ui-ux-pro-max):** `ui-ux-pro-max`, `ui-styling` (67 styles/161 palettes), `design`,
  `design-system`, `brand`, `banner-design`, `slides`.

Add more by dropping a folder with a `SKILL.md`.

## Maximum-coding configuration (pre-tuned in muminai.json)
Tuned out-of-the-box for parallel, high-throughput coding:
- `experimental.batch_tool: true` — the agent issues multiple tool calls in **parallel** (faster multi-file reads/edits).
- **Parallel subagents** — build/plan/compose agents spawn subagents that run concurrently; the ceiling auto-scales to your CPU (`min(16, 2×cores)`). Override with `workflow.maxConcurrentAgents`.
- **Compose mode** (`Tab` to switch agent) — specs-driven workflow with built-in skills: plan, execute, code-review, TDD, debug, verify, merge.
- **Max Mode** (opt-in — best quality, higher cost): switch to the `max` agent / set `experimental.maxMode.candidates` to run N parallel reasoning candidates per step with a judge. Not default (multiplies token cost).
- Persistent **memory + checkpoints**, `/dream`, and `/distill` (auto-skill creation) are core MuminAI features, on by default.

## Environment flags (upstream-issue fixes)
- `MIMOCODE_TUI_MAIN_SCREEN=1` — render the TUI in the terminal's **main screen** so native
  scrollback works for long output (fixes the "can't scroll up" complaint, upstream #11). The
  full-screen UI is the default; this is opt-in. (Zero-code alternative: `OTUI_USE_ALTERNATE_SCREEN=false`.)
- `MUMINAI_ENABLE_OPENCODE_PROVIDERS=1` — re-enable the `opencode`/`opencode-go` providers if you
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
  see `.muminai/plugins/anthropic-oauth.ts`. It is **not enabled by default**. To enable, add it
  to the `plugin` array in `.muminai/muminai.json`:
  ```json
  "plugin": [".muminai/plugins/anthropic-oauth.ts"]
  ```
  ⚠️ Anthropic's ToS prohibits using subscription tokens outside official clients, and Anthropic
  actively blocks this. It may stop working and could risk your account. Use API keys for anything
  important. This is a community workaround, not endorsed by Anthropic or MuminAI.
