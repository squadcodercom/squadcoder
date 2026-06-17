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
| **#908 / #861** memory system never loads on **Windows** ("path outside memory layout") — full cross-session amnesia | normalize `\`→`/` before the path regex in `parsePath`/`parseCcPath` (reconcile builds backslash paths via `path.join`) | `packages/opencode/src/memory/paths.ts` | **unit test added** (`test/memory/paths.test.ts`, Windows cases pass) |
| **#152** server error middleware leaks full `err.stack` (abs paths, versions) to HTTP clients | return `err.message` to clients; full stack still logged server-side | `packages/opencode/src/server/middleware.ts` | typecheck |
| **#155** `mcp auth status` prints first 20 chars of the live OAuth access token | mask like the refresh token (`present (N chars)`) | `packages/opencode/src/cli/cmd/mcp.ts` | typecheck |
| **#758** `mimo -c` hangs on a blank screen when there's no prior session (invalid `dummy` route) | fall back to home + toast once sync is `complete` instead of hanging | `packages/opencode/src/cli/cmd/tui/app.tsx` (continue effect) | typecheck |
| **#216** worker shutdown 5s timeout force-kills mid-cleanup on large workspaces ("crash on quit") | bump grace to 15s, overridable via `MIMOCODE_SHUTDOWN_TIMEOUT_MS` | `packages/opencode/src/cli/cmd/tui/thread.ts` | typecheck |

All fixes are tagged `MUMINAI(#NN)` in code and documented in `.muminai/SETUP.md` (env flags).

## ✅ Already fixed at our fork point (no action)
| Issue | Note |
|---|---|
| **#530** 88GB logs fill disk / **#317** 5GB/min log explosion | `packages/opencode/src/util/log.ts` already caps `MAX_FILE_SIZE=50MB`, `MAX_TOTAL_SIZE=200MB`, with `rotate()`/cleanup citing "runaway session". Filed against old 0.1.0-preview. Can be closed as fixed. |
| **#243 / #721 / #405** `EEXIST mkdir '.git/info'` crash in git repos / Windows+OneDrive | already fixed at our fork point (snapshot dir creation is idempotent). |
| **#381** TUI scrolling overwrites history | same as our **#11** fix (opt-in main-screen). |
| **#808** self-updater rejects `curl` channel | same as our **#212** fix. |

## 🔬 Critical but NOT blind-patched — investigate with a live repro before touching (data-loss risk)
These are high-severity but a wrong fix is dangerous; require careful reproduction first.
| Issue | Risk |
|---|---|
| **#740** "entire E: drive wiped during uninstall" | uninstall path deletion scope — audit `cli/cmd/uninstall.ts` against absolute/parent paths before changing. |
| **#729** `/undo` in plan mode auto-runs `git revert`, destroyed a day of work | revert/undo semantics in `session/revert.ts` — needs a real plan-mode repro. |
| **#842** agent ignores MEMORY.md approval rule + Esc interrupt | prompt/permission/interrupt timing — behavioral, needs live session. |
| **#607** macOS IPC socket path `ENAMETOOLONG` (sun_path limit) startup crash | shorten socket path; verify on macOS. |
| **#495** all tools fail `undefined is not an object (J.replace)` (Win/xiaomi) | provider/template specific; needs that provider + Windows. |
| **#874** task tool poisoned into permanent `JSON Parse error: EOF` | malformed-tool-call state machine; needs repro harness. |
| **#909 / #561 / #161** subagent op param sent as string not object | actor/tool param serialization — needs a delegating run to confirm. |
| **#299 / #871** postinstall picks AVX2 binary on non-AVX2 CPU → SIGILL | CPU-feature detection in `postinstall.mjs`; needs non-AVX2 hardware. |
| **#10 / #469** Windows: platform binary missing / ENTRYPOINT_NOT_FOUND | npm platform-package resolution; needs our published packages. |

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
