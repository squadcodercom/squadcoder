import { dlopen, ptr } from "bun:ffi"
import type { ReadStream } from "node:tty"

const STD_INPUT_HANDLE = -10
const ENABLE_PROCESSED_INPUT = 0x0001

const kernel = () =>
  dlopen("kernel32.dll", {
    GetStdHandle: { args: ["i32"], returns: "ptr" },
    GetConsoleMode: { args: ["ptr", "ptr"], returns: "i32" },
    SetConsoleMode: { args: ["ptr", "u32"], returns: "i32" },
    FlushConsoleInputBuffer: { args: ["ptr"], returns: "i32" },
  })

let k32: ReturnType<typeof kernel> | undefined

function load() {
  if (process.platform !== "win32") return false
  try {
    k32 ??= kernel()
    return true
  } catch {
    return false
  }
}

/**
 * Clear ENABLE_PROCESSED_INPUT on the console stdin handle.
 */
export function win32DisableProcessedInput() {
  if (process.platform !== "win32") return
  if (!process.stdin.isTTY) return
  if (!load()) return

  const handle = k32!.symbols.GetStdHandle(STD_INPUT_HANDLE)
  const buf = new Uint32Array(1)
  if (k32!.symbols.GetConsoleMode(handle, ptr(buf)) === 0) return

  const mode = buf[0]!
  if ((mode & ENABLE_PROCESSED_INPUT) === 0) return
  k32!.symbols.SetConsoleMode(handle, mode & ~ENABLE_PROCESSED_INPUT)
}

/**
 * Discard any queued console input (mouse events, key presses, etc.).
 */
export function win32FlushInputBuffer() {
  if (process.platform !== "win32") return
  if (!process.stdin.isTTY) return
  if (!load()) return

  const handle = k32!.symbols.GetStdHandle(STD_INPUT_HANDLE)
  k32!.symbols.FlushConsoleInputBuffer(handle)
}

// SQUADCODER(#522): best-effort terminal restore on abnormal exit. OpenTUI's native setupTerminal()
// puts the Windows console into alt-screen + raw + VT-output mode and pushes theme colors via
// OSC 10/11/12. A graceful /exit or caught error restores it, but a SIGINT/SIGTERM or process.exit
// (e.g. the agent killing node) skips those JS paths and leaves the console emitting constant
// mojibake. Install once; idempotent. (Does NOT cover hard SIGKILL/`taskkill /F`, which delivers
// no JS-observable signal — that's a strict-improvement mitigation, not a total cure.)
let restoreInstalled = false
export function win32InstallTerminalRestoreGuard() {
  if (process.platform !== "win32") return
  if (restoreInstalled) return
  restoreInstalled = true

  let done = false
  const restore = () => {
    if (done) return
    done = true
    try {
      // leave alt-screen; disable mouse + bracketed-paste; SGR reset; show cursor;
      // reset terminal fg/bg/cursor colors pushed by the theme (OSC 110/111/112).
      process.stdout.write("\x1b[?1049l\x1b[?1000l\x1b[?1002l\x1b[?1003l\x1b[?2004l\x1b[0m\x1b[?25h\x1b]110\x07\x1b]111\x07\x1b]112\x07")
    } catch {}
  }

  process.once("exit", restore)
  for (const sig of ["SIGINT", "SIGTERM", "SIGHUP", "SIGBREAK"] as const) {
    process.once(sig as NodeJS.Signals, () => {
      restore()
      process.exit(1)
    })
  }
}

let unhook: (() => void) | undefined

/**
 * Keep ENABLE_PROCESSED_INPUT disabled.
 *
 * On Windows, Ctrl+C becomes a CTRL_C_EVENT (instead of stdin input) when
 * ENABLE_PROCESSED_INPUT is set. Various runtimes can re-apply console modes
 * (sometimes on a later tick), and the flag is console-global, not per-process.
 *
 * We combine:
 * - A `setRawMode(...)` hook to re-clear after known raw-mode toggles.
 * - A low-frequency poll as a backstop for native/external mode changes.
 */
export function win32InstallCtrlCGuard() {
  if (process.platform !== "win32") return
  if (!process.stdin.isTTY) return
  if (!load()) return
  if (unhook) return unhook

  const stdin = process.stdin as ReadStream
  const original = stdin.setRawMode

  const handle = k32!.symbols.GetStdHandle(STD_INPUT_HANDLE)
  const buf = new Uint32Array(1)

  if (k32!.symbols.GetConsoleMode(handle, ptr(buf)) === 0) return
  const initial = buf[0]!

  const enforce = () => {
    if (k32!.symbols.GetConsoleMode(handle, ptr(buf)) === 0) return
    const mode = buf[0]!
    if ((mode & ENABLE_PROCESSED_INPUT) === 0) return
    k32!.symbols.SetConsoleMode(handle, mode & ~ENABLE_PROCESSED_INPUT)
  }

  // Some runtimes can re-apply console modes on the next tick; enforce twice.
  const later = () => {
    enforce()
    setImmediate(enforce)
  }

  let wrapped: ReadStream["setRawMode"] | undefined

  if (typeof original === "function") {
    wrapped = (mode: boolean) => {
      const result = original.call(stdin, mode)
      later()
      return result
    }

    stdin.setRawMode = wrapped
  }

  // Ensure it's cleared immediately too (covers any earlier mode changes).
  later()

  const interval = setInterval(enforce, 100)
  interval.unref()

  let done = false
  unhook = () => {
    if (done) return
    done = true

    clearInterval(interval)
    if (wrapped && stdin.setRawMode === wrapped) {
      stdin.setRawMode = original
    }

    k32!.symbols.SetConsoleMode(handle, initial)
    unhook = undefined
  }

  return unhook
}
