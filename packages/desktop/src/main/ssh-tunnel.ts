// SQUADCODER — Remote-SSH tunnel manager (Electron main process).
//
// Owns one long-lived `ssh -N -L 127.0.0.1:<local>:127.0.0.1:<remote> user@host` child per remote,
// plus a short separate `ssh exec` that idempotently bootstraps `squadcoder serve` on the remote.
// The renderer drives this over IPC and attaches to the tunneled loopback URL using the existing
// ServerConnection.Ssh path — the engine itself is never modified.
//
// Security invariants (also enforced by the arg builders below):
//   • local + remote binds are ALWAYS literal 127.0.0.1 (never 0.0.0.0 / bare port).
//   • host keys: accept-new (TOFU) into an APP-MANAGED known_hosts; changed keys hard-reject.
//   • the random server password is written to the remote over ssh STDIN (never argv → invisible in
//     remote `ps`); Basic-auth protects the loopback tunnel as defense-in-depth.
//   • all user input passed as discrete argv (shell:false) — no shell interpolation.
//
// MVP scope: key / ssh-agent auth (the Windows-clean happy path). Password-only hosts, the interactive
// trust-host-key UI, reconnect/backoff, and persistence are layered on top later.

import { spawn, type ChildProcess } from "node:child_process"
import { createServer } from "node:net"
import { mkdirSync, existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { app } from "electron"
import { resolveAppPath } from "./apps"
import {
  bootstrapScript,
  buildExecArgs,
  buildScpArgs,
  buildTunnelArgs,
  classifyStderr,
  DEFAULT_REMOTE_PORT,
  installAndStartScript,
  parseBootstrapOutput,
  remoteBundlePath,
  SERVER_USERNAME,
  SshError,
} from "./ssh-tunnel-args"
import type { SshDetectResult, SshTunnelOptions, SshTunnelResult, SshTunnelStatus } from "../preload/types"

export { SshError } from "./ssh-tunnel-args"

const READY_TIMEOUT_MS = 20_000

type Entry = {
  child: ChildProcess
  localPort: number
  remotePort: number
  remotePid?: string
  result: SshTunnelResult
  opts: SshTunnelOptions
}

const tunnels = new Map<string, Entry>()
let statusListener: ((s: SshTunnelStatus) => void) | undefined

export function onTunnelStatus(cb: (s: SshTunnelStatus) => void) {
  statusListener = cb
}
function emit(host: string, phase: SshTunnelStatus["phase"], message?: string) {
  statusListener?.({ host, phase, message })
}

function sshExe(): string {
  // Reuse the desktop's robust Windows `where`-based resolver; falls back to PATH "ssh".
  return resolveAppPath("ssh") ?? "ssh"
}

function scpExe(): string {
  return resolveAppPath("scp") ?? "scp"
}

// The self-contained Linux engine bundle shipped in the installer (resources/remote-engine/,
// assembled by `bun script/make-remote-engine.ts`). Returns the tarball path + its version hash,
// or undefined if this build doesn't carry one.
function resolveRemoteEngineBundle(): { tgz: string; version: string } | undefined {
  const candidates = [
    process.resourcesPath ? join(process.resourcesPath, "remote-engine") : undefined,
    join(app.getAppPath(), "..", "..", "remote-engine"), // dev: repo-root/remote-engine
    join(app.getAppPath(), "remote-engine"),
  ].filter((x): x is string => Boolean(x))
  for (const base of candidates) {
    const tgz = join(base, "squadcoder-remote-engine.tgz")
    const verFile = join(base, "VERSION")
    try {
      if (existsSync(tgz) && existsSync(verFile)) {
        const version = readFileSync(verFile, "utf8").trim()
        if (version) return { tgz, version }
      }
    } catch {}
  }
  return undefined
}

/** scp a local file to the remote (key/agent auth — no password stdin). Resolves on exit 0. */
function runScp(opts: SshTunnelOptions, localFile: string, remoteRelPath: string): Promise<void> {
  const exe = scpExe()
  const args = buildScpArgs(opts, localFile, remoteRelPath, knownHostsFile())
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true })
    let err = ""
    child.stderr?.on("data", (d) => (err += d.toString()))
    const timer = setTimeout(() => {
      child.kill()
      reject(new SshError("timed-out", "engine upload timed out"))
    }, 300_000)
    child.on("error", (e) => {
      clearTimeout(timer)
      reject(new SshError("client-missing", e.message))
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code === 0) resolve()
      else reject(new SshError(classifyStderr(err), err.trim() || `scp exited with code ${code}`))
    })
  })
}

function knownHostsFile(): string {
  const dir = join(app.getPath("userData"), "ssh")
  try {
    mkdirSync(dir, { recursive: true })
  } catch {}
  return join(dir, "known_hosts")
}

// ---- runtime ----------------------------------------------------------------------------------

function pickLocalLoopbackPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.on("error", reject)
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address()
      if (typeof addr !== "object" || !addr) {
        srv.close()
        reject(new Error("failed to allocate a local port"))
        return
      }
      const port = addr.port
      srv.close(() => resolve(port))
    })
  })
}

export async function detectSsh(): Promise<SshDetectResult> {
  const exe = sshExe()
  return await new Promise((resolve) => {
    const child = spawn(exe, ["-V"], { windowsHide: true })
    let err = ""
    let out = ""
    child.stderr?.on("data", (d) => (err += d.toString()))
    child.stdout?.on("data", (d) => (out += d.toString()))
    child.on("error", () => resolve({ available: false }))
    child.on("close", (code) => {
      // `ssh -V` prints the version banner to stderr and exits 0.
      const banner = (err || out).trim()
      if (code === 0 || /openssh/i.test(banner)) resolve({ available: true, version: banner || undefined })
      else resolve({ available: false })
    })
  })
}

/** Run a short remote exec, writing `stdinInput` to stdin. Resolves stdout; rejects SshError. */
function runExec(opts: SshTunnelOptions, script: string, stdinInput: string): Promise<string> {
  const exe = sshExe()
  const args = buildExecArgs(opts, script, knownHostsFile())
  return new Promise((resolve, reject) => {
    const child = spawn(exe, args, { windowsHide: true })
    let out = ""
    let err = ""
    const timer = setTimeout(() => {
      child.kill()
      reject(new SshError("timed-out", "remote bootstrap timed out"))
    }, 30_000)
    child.stdout?.on("data", (d) => (out += d.toString()))
    child.stderr?.on("data", (d) => (err += d.toString()))
    child.on("error", (e) => {
      clearTimeout(timer)
      reject(new SshError("client-missing", e.message))
    })
    child.on("close", (code) => {
      clearTimeout(timer)
      if (code === 0 || out.trim()) {
        resolve(out)
        return
      }
      reject(new SshError(classifyStderr(err), err.trim() || `ssh exited with code ${code}`))
    })
    // Send the password as the first stdin line, then close stdin.
    child.stdin?.write(stdinInput.endsWith("\n") ? stdinInput : stdinInput + "\n")
    child.stdin?.end()
  })
}

/** Probe the tunneled engine over loopback Basic auth. */
async function probeEngine(localPort: number, password: string): Promise<boolean> {
  const headers = new Headers()
  headers.set("authorization", `Basic ${Buffer.from(`${SERVER_USERNAME}:${password}`).toString("base64")}`)
  try {
    const res = await fetch(`http://127.0.0.1:${localPort}/global/health`, {
      method: "GET",
      headers,
      signal: AbortSignal.timeout(3000),
    })
    return res.ok
  } catch {
    return false
  }
}

async function waitReady(child: ChildProcess, localPort: number, password: string): Promise<void> {
  const deadline = Date.now() + READY_TIMEOUT_MS
  let exited: number | null | undefined
  let stderr = ""
  child.stderr?.on("data", (d) => (stderr += d.toString()))
  child.on("close", (code) => (exited = code))
  while (Date.now() < deadline) {
    if (exited !== undefined) {
      // ExitOnForwardFailure makes the child die early when the forward can't be set up.
      throw new SshError(classifyStderr(stderr) === "unknown" ? "forward-failed" : classifyStderr(stderr), stderr.trim() || "tunnel exited")
    }
    if (await probeEngine(localPort, password)) return
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new SshError("timed-out", "tunnel did not become ready in time")
}

export async function startTunnel(opts: SshTunnelOptions): Promise<SshTunnelResult> {
  const host = opts.host
  // If a tunnel for this host already exists and is alive, reuse it.
  const existing = tunnels.get(host)
  if (existing && !existing.child.killed && existing.child.exitCode === null) return existing.result

  const remotePort = opts.remotePort ?? DEFAULT_REMOTE_PORT
  const password = randomUUID()

  emit(host, "bootstrapping")
  const bundle = resolveRemoteEngineBundle()
  if (!bundle) throw new SshError("engine-not-installed", "remote engine bundle is missing from this build")

  let bootstrap = parseBootstrapOutput(await runExec(opts, bootstrapScript(remotePort, bundle.version), password))

  // First-time (or new engine version) on this host: push the self-contained bundle (~52MB) to
  // ~/.squadcoder-server/<version>.tgz, extract it, and start it. Subsequent connects REUSE the
  // installed version with no upload (VS Code-server model).
  if (bootstrap.kind === "need-upload") {
    emit(host, "installing", "uploading engine to remote (first connect)…")
    await runScp(opts, bundle.tgz, remoteBundlePath(bundle.version))
    emit(host, "installing", "installing engine on remote…")
    bootstrap = parseBootstrapOutput(await runExec(opts, installAndStartScript(remotePort, bundle.version), password))
  }

  if (bootstrap.kind === "not-installed") throw new SshError("engine-not-installed", "remote engine install failed")
  if (bootstrap.kind === "need-upload") throw new SshError("engine-failed", "remote engine did not start after install")
  if (bootstrap.kind === "failed") throw new SshError("engine-failed", bootstrap.detail)
  const effectiveRemotePort = bootstrap.kind === "reuse" || bootstrap.kind === "started" ? bootstrap.port : remotePort
  const remotePid = bootstrap.kind === "started" ? bootstrap.pid : undefined

  emit(host, "opening-tunnel")
  const localPort = await pickLocalLoopbackPort()
  const exe = sshExe()
  const child = spawn(exe, buildTunnelArgs(opts, localPort, effectiveRemotePort, knownHostsFile()), {
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true,
  })

  try {
    await waitReady(child, localPort, password)
  } catch (e) {
    try {
      child.kill()
    } catch {}
    throw e
  }

  const result: SshTunnelResult = {
    host,
    url: `http://127.0.0.1:${localPort}`,
    username: SERVER_USERNAME,
    password,
    remotePort: effectiveRemotePort,
  }
  const entry: Entry = { child, localPort, remotePort: effectiveRemotePort, remotePid, result, opts }
  tunnels.set(host, entry)
  child.on("close", () => {
    if (tunnels.get(host) === entry) {
      tunnels.delete(host)
      emit(host, "disconnected")
    }
  })
  emit(host, "attached")
  return result
}

export async function stopTunnel(host: string): Promise<void> {
  const entry = tunnels.get(host)
  if (!entry) return
  tunnels.delete(host)
  // Best-effort: stop the remote engine we started so it doesn't accumulate across reconnects.
  if (entry.remotePid) {
    runExec(entry.opts, `kill ${Number(entry.remotePid)} >/dev/null 2>&1 || true; echo ok`, entry.result.password).catch(
      () => {},
    )
  }
  try {
    entry.child.kill()
  } catch {}
  emit(host, "disconnected")
}

export function stopAllTunnels(): void {
  for (const [, entry] of tunnels) {
    try {
      entry.child.kill()
    } catch {}
  }
  tunnels.clear()
}
