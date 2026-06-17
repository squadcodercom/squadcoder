# MuminAI Setup — bundled MCPs, skills, and optional Claude subscription login

## Bundled MCP servers (config-driven, zero core changes)
`.muminai/muminai.json` ships a default `mcp` block. Servers run on demand via `npx`/`uvx`:
- **playwright** (`@playwright/mcp`) — browser automation. **Enabled by default.**
- **context7** (`@upstash/context7-mcp`) — up-to-date library docs. Enabled by default.
- **github** (`@modelcontextprotocol/server-github`) — disabled until you set `GITHUB_TOKEN`.

### One-time: install Playwright browsers
The Playwright MCP needs browser binaries. After install, run once:
```bash
npx playwright install chromium
```
(A future `muminai-plugin-bootstrap` / installer step will do this automatically on first run.)

## Bundled skills
Skills auto-load from `.muminai/skills/**/SKILL.md`:
- `hebrew-rtl-best-practices` — correct RTL Hebrew UI.
- `hebrew-document-generator` — RTL Hebrew PDF/DOCX/PPTX.

Add more (incl. MIT Skills-IL skills) by dropping a folder with a `SKILL.md`. See
`SKILLS_ATTRIBUTION.md`.

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
