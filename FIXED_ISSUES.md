# MuminAI — Upstream Issue Tracker (do not re-investigate these)

Status of XiaomiMiMo/MiMo-Code issues vs our fork. **Check this file before triaging upstream
issues again** so we don't repeat work. Branch: `feat/muminai-foundation`.

## Upstream sync
- Fork point: `e8775a4`. Merged `upstream/main` → **at parity** (last pull brought `98c283a`
  feat(voice) #900, clean merge). No release tags exist upstream yet.
- Re-sync: `git fetch upstream && git merge upstream/main` (our diff is isolated + `merge=ours`).

## ✅ Fixed in our fork
| Issue | What | Where | Verify |
|---|---|---|---|
| **#460** data loss: Auto agent `rm`-deletes files with no backup (no `.git`) | enabled undo-snapshots for **non-git** projects (shadow git never needed user `.git`); seeded default ignores so non-git snapshots stay bounded | `packages/opencode/src/snapshot/index.ts` (`enabled()`, `sync()`, `defaultIgnore`) | empirically proven: shadow git over non-git dir restores `rm -rf`'d files |
| **#212** `mimo upgrade` "unsupported update channel: curl"; `--method` ignored | pass resolved `method` into `latest()`; clean error instead of opaque "Unexpected error" | `packages/opencode/src/cli/cmd/upgrade.ts` | typecheck; trace matches sibling call sites |
| **#79** custom/opencode provider models invisible after login | opencode/opencode-go disable now opt-out via `MUMINAI_ENABLE_OPENCODE_PROVIDERS=1` (default unchanged); clearer custom-provider login warning | `packages/opencode/src/plugin/mimo.ts`, `cli/cmd/providers.ts` | typecheck; default path unchanged |
| **#522** Windows mojibake after the node/TUI process is killed | idempotent **win32-only** terminal-restore guard on `exit`/SIGINT/SIGTERM (strict improvement; hard `taskkill /F` still needs a shell reset) | `cli/cmd/tui/win32.ts` (`win32InstallTerminalRestoreGuard`) wired into `app.tsx`/`thread.ts`/`attach.ts` | typecheck; manual Windows repro pending |
| **#11** can't scroll up to view long TUI output | opt-in `MIMOCODE_TUI_MAIN_SCREEN=1` forces main-screen (native scrollback); default full-screen UI unchanged | `cli/cmd/tui/app.tsx` (rendererConfig), `flag/flag.ts` | typecheck; live-terminal check pending |

All fixes are tagged `MUMINAI(#NN)` in code and documented in `.muminai/SETUP.md` (env flags).

## ✅ Already fixed at our fork point (no action)
| Issue | Note |
|---|---|
| **#530** 88GB logs fill disk / **#317** 5GB/min log explosion | `packages/opencode/src/util/log.ts` already caps `MAX_FILE_SIZE=50MB`, `MAX_TOTAL_SIZE=200MB`, with `rotate()`/cleanup citing "runaway session". Filed against old 0.1.0-preview. Can be closed as fixed. |

## ⏸ Deferred — NOT patched (would need a live Windows terminal / our own release endpoint)
Do not blind-patch these; a wrong change risks a no-op or regression.
| Issue | Why deferred | Path if revisited |
|---|---|---|
| **#182** can't paste in the **legacy Windows console** (double-clicked `.exe`/conhost) | conhost doesn't deliver bracketed-paste/Ctrl+V to the app; the proposed Ctrl+V clipboard fallback could no-op or double-paste depending on terminal version — needs live repro. Bonus RTL follow-up: sanitize bidi controls (U+200E/200F/202A-E) on paste. | `cli/cmd/tui/component/prompt/index.tsx` |
| **#59** Windows curl-install: command not found | install script needs Windows `.exe` handling + native registry PATH (`setx`), and our distribution/release endpoint doesn't exist yet; verify in Git Bash before shipping. FIX A (handle `.exe`) is low-risk when we set up distribution. | root `install` script |

## ❌ Won't-fix in our fork (upstream service/backend, not code)
- **#516 / #507 / #364** constant `429 Too Many Requests` on the free `mimo-auto` tier — Xiaomi backend rate limits, not our code. We default users to BYOK/OpenRouter anyway.
- **#125 / #75 / #509 / #130 / #588 / #711 / #672** — feature requests / meta / informational.

## How to extend
When you fix another issue: tag it `MUMINAI(#NN)` in code, add a row above, update `.muminai/SETUP.md`
if it adds a flag, and (if user-facing) note it in `release/README.md`.
