# MuminAI — Downloads (Windows x64)

**MuminAI** is an open-source, RTL/Hebrew-first AI coding assistant — a rebranded fork of
MiMoCode (itself a fork of opencode) with full Hebrew right-to-left support, bundled Hebrew/dev
skills, and pre-configured MCP servers (Playwright, context7).

## Artifacts in this folder

| File | What it is | How to use |
|------|------------|------------|
| `MuminAI-cli-windows-x64.zip` | Standalone **CLI** (`mumin.exe`) | Extract, then run `bin\mumin.exe` from a terminal. Try `mumin --help`, `mumin --version`. |
| `MuminAI-desktop-windows-x64-portable.zip` | **Portable desktop app** | Extract anywhere, run `MuminAI.exe`. No install needed. |
| `MuminAI-Setup.exe` | **Installer** (recommended) | Double-click to install MuminAI (choose install dir, Start-menu shortcut). |

> Note: if Windows shows an old/black icon on a downloaded `.exe`, that's the Explorer **icon cache**, not the file — the embedded icon is correct. Copying/renaming the file or running `ie4uinit.exe -show` refreshes it.

> First run: the Playwright MCP needs browser binaries once — run `npx playwright install chromium`.
> Authentication: bring your own API key, import from Claude Code, or use any OpenRouter model
> (incl. `openrouter/fusion`). Optional Claude subscription login is documented in
> `.muminai/SETUP.md` (opt-in, at your own risk).

## Switch to Hebrew (RTL)
Select **עברית** in the language menu — the whole UI flips to right-to-left. Hebrew AI replies
render RTL automatically (English stays LTR), and asking for a Hebrew PDF uses the bundled
`hebrew-document-generator` skill to produce a correct RTL document.

## Build from source
```bash
bun install
# CLI single binary:
cd packages/opencode && bun run build:dev      # -> dist/muminai-windows-x64/bin/mumin.exe
# Desktop app + installer:
cd packages/desktop && OPENCODE_CHANNEL=prod bun run build && bun run package:win
```
Requires bun >= 1.3.11. On OneDrive paths, clear `dist/` between rebuilds if you hit file locks.

## Keeping up with upstream
MuminAI tracks MiMoCode/opencode (`upstream`/`opencode` git remotes) with an isolated diff —
see `FORK_STRATEGY.md`.
