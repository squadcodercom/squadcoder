// SQUADCODER — engine-side SSH tunnel manager, so Remote-SSH works on the WEB (and CLI), not just the
// Electron desktop. A browser can't spawn `ssh`; the engine (which has shell access) does it and returns
// a loopback URL. For the CO-LOCATED case (browser + engine on the same machine, e.g. local/self-host)
// the browser reaches that loopback port directly — no reverse-proxy needed. Same proven logic as the
// desktop `ssh-tunnel.ts`: loopback-only binds, accept-new host keys, password over stdin (never argv).
//
// Exposed via global HTTP routes (/ssh/detect, /ssh/connect, /ssh/disconnect) in routes/global.ts.

import { spawn, type ChildProcess } from "node:child_process"
import { createServer } from "node:net"
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import { randomUUID } from "node:crypto"
import { Global } from "@/global"
import { Log } from "@/util"

const log = Log.create({ service: "ssh-tunnel" })

const SERVER_USERNAME = "squadcoder"
const DEFAULT_REMOTE_PORT = 4096
const DEFAULT_SSH_PORT = 22
const READY_TIMEOUT_MS = 20_000

export type SshAuth = { kind: "agent" } | { kind: "key"; keyFile: string }
export type SshConnectInput = {
  host: string
  user: string
  port?: number
  auth: SshAuth
  remotePort?: number
}
export type SshConnectResult = {
  host: string
  url: string
  username: string
  password: string
  remotePort: number
}
export type SshErrorCode =
  | "client-missing"
  | "auth-failed"
  | "host-key-changed"
  | "forward-failed"
  | "engine-not-installed"
  | "engine-failed"
  | "timed-out"
  | "unknown"

export class SshError extends Error {
  constructor(
    public code: SshErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "SshError"
  }
}

function knownHostsFile(): string {
  const dir = join(Global.Path.data, "ssh")
  try {
    mkdirSync(dir, { recursive: true })
  } catch {}
  return join(dir, "known_hosts")
}

function baseSshArgs(opts: SshConnectInput): string[] {
  const args = [
    "-o",
    "ExitOnForwardFailure=yes",
    "-o",
    "ServerAliveInterval=15",
    "-o",
    "ServerAliveCountMax=3",
    "-o",
    "StrictHostKeyChecking=accept-new",
    "-o",
    `UserKnownHostsFile=${knownHostsFile()}`,
    "-o",
    "ConnectTimeout=10",
    "-o",
    "BatchMode=yes",
  ]
  if (opts.auth.kind === "key") args.push("-o", "IdentitiesOnly=yes", "-i", opts.auth.keyFile)
  if (opts.port && opts.port !== DEFAULT_SSH_PORT) args.push("-p", String(opts.port))
  return args
}

function tunnelArgs(opts: SshConnectInput, localPort: number, remotePort: number): string[] {
  return [
    "-N",
    "-T",
    ...baseSshArgs(opts),
    "-L",
    `127.0.0.1:${localPort}:127.0.0.1:${remotePort}`,
    `${opts.user}@${opts.host}`,
  ]
}

function execArgs(opts: SshConnectInput, script: string): string[] {
  return ["-T", ...baseSshArgs(opts), `${opts.user}@${opts.host}`, "sh", "-lc", script]
}

function bootstrapScript(remotePort: number): string {
  const p = String(remotePort)
  return [
    "read SC_PW",
    "mkdir -p ~/.squadcoder",
    `P=${p}`,
    `if curl -fsS -u "${SERVER_USERNAME}:$SC_PW" -o /dev/null "http://127.0.0.1:$P/global/health" 2>/dev/null; then echo "REUSE $P"; exit 0; fi`,
    "if ! command -v squadcoder >/dev/null 2>&1; then echo NOTINSTALLED; exit 0; fi",
    `MIMOCODE_SERVER_USERNAME=${SERVER_USERNAME} MIMOCODE_SERVER_PASSWORD="$SC_PW" nohup squadcoder serve --hostname 127.0.0.1 --port "$P" >~/.squadcoder/serve.log 2>&1 &`,
    "PID=$!",
    `i=0; while [ $i -lt 40 ]; do if curl -fsS -u "${SERVER_USERNAME}:$SC_PW" -o /dev/null "http://127.0.0.1:$P/global/health" 2>/dev/null; then echo "STARTED $P $PID"; exit 0; fi; sleep 0.3; i=$((i+1)); done`,
    `echo "FAILED $P"; tail -n 20 ~/.squadcoder/serve.log 2>/dev/null`,
  ].join("\n")
}

type BootstrapOutcome =
  | { kind: "reuse"; port: number }
  | { kind: "started"; port: number; pid?: string }
  | { kind: "not-installed" }
  | { kind: "failed"; detail: string }

function parseBootstrap(stdout: string): BootstrapOutcome {
  for (const line of stdout.trim().split(/\r?\n/)) {
    const reuse = line.match(/^REUSE\s+(\d+)/)
    if (reuse) return { kind: "reuse", port: Number(reuse[1]) }
    const started = line.match(/^STARTED\s+(\d+)\s*(\S+)?/)
    if (started) return { kind: "started", port: Number(started[1]), pid: started[2] }
    if (/^NOTINSTALLED/.test(line)) return { kind: "not-installed" }
  }
  return { kind: "failed", detail: stdout.trim() || "no output from remote" }
}

function classifyStderr(s: string): SshErrorCode {
  const t = s.toLowerCase()
  if (t.includes("permission denied") || t.includes("authentication failed") || t.includes("no such identity"))
    return "auth-failed"
  if (t.includes("host key verification failed") || t.includes("remote host identification has changed"))
    return "host-key-changed"
  if (t.includes("forward") && (t.includes("failed") || t.includes("refused"))) return "forward-failed"
  if (t.includes("channel") && t.includes("open failed")) return "forward-failed"
  if (t.includes("timed out") || t.includes("connection refused") || t.includes("could not resolve")) return "timed-out"
  return "unknown"
}

type Entry = { child: ChildProcess; remotePid?: string; result: SshConnectResult; opts: SshConnectInput }
const tunnels = new Map<string, Entry>()

function pickLocalPort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = createServer()
    srv.on("error", reject)
    srv.listen(0, "127.0.0.1", () => {
      const addr = srv.address()
      if (typeof addr !== "object" || !addr) {
        srv.close()
        reject(new Error("no port"))
        return
      }
      const port = addr.port
      srv.close(() => resolve(port))
    })
  })
}

export async function detectSsh(): Promise<{ available: boolean; version?: string }> {
  return await new Promise((resolve) => {
    const child = spawn("ssh", ["-V"], { windowsHide: true })
    let out = ""
    child.stderr?.on("data", (d) => (out += d.toString()))
    child.stdout?.on("data", (d) => (out += d.toString()))
    child.on("error", () => resolve({ available: false }))
    child.on("close", (code) => {
      const banner = out.trim()
      if (code === 0 || /openssh/i.test(banner)) resolve({ available: true, version: banner || undefined })
      else resolve({ available: false })
    })
  })
}

function runExec(opts: SshConnectInput, script: string, stdin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("ssh", execArgs(opts, script), { windowsHide: true })
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
      if (code === 0 || out.trim()) resolve(out)
      else reject(new SshError(classifyStderr(err), err.trim() || `ssh exited ${code}`))
    })
    child.stdin?.write(stdin.endsWith("\n") ? stdin : stdin + "\n")
    child.stdin?.end()
  })
}

async function probe(localPort: number, password: string): Promise<boolean> {
  const headers = new Headers()
  headers.set("authorization", `Basic ${Buffer.from(`${SERVER_USERNAME}:${password}`).toString("base64")}`)
  try {
    const res = await fetch(`http://127.0.0.1:${localPort}/global/health`, {
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
      const code = classifyStderr(stderr)
      throw new SshError(code === "unknown" ? "forward-failed" : code, stderr.trim() || "tunnel exited")
    }
    if (await probe(localPort, password)) return
    await new Promise((r) => setTimeout(r, 250))
  }
  throw new SshError("timed-out", "tunnel did not become ready")
}

export async function connect(opts: SshConnectInput): Promise<SshConnectResult> {
  const host = opts.host
  const existing = tunnels.get(host)
  if (existing && existing.child.exitCode === null && !existing.child.killed) return existing.result

  const remotePort = opts.remotePort ?? DEFAULT_REMOTE_PORT
  const password = randomUUID()
  const bootstrap = parseBootstrap(await runExec(opts, bootstrapScript(remotePort), password))
  if (bootstrap.kind === "not-installed") throw new SshError("engine-not-installed", "squadcoder is not installed on the remote")
  if (bootstrap.kind === "failed") throw new SshError("engine-failed", bootstrap.detail)
  const effectiveRemotePort = bootstrap.port || remotePort
  const remotePid = bootstrap.kind === "started" ? bootstrap.pid : undefined

  const localPort = await pickLocalPort()
  const child = spawn("ssh", tunnelArgs(opts, localPort, effectiveRemotePort), {
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

  const result: SshConnectResult = {
    host,
    url: `http://127.0.0.1:${localPort}`,
    username: SERVER_USERNAME,
    password,
    remotePort: effectiveRemotePort,
  }
  const entry: Entry = { child, remotePid, result, opts }
  tunnels.set(host, entry)
  child.on("close", () => {
    if (tunnels.get(host) === entry) tunnels.delete(host)
  })
  log.info("ssh tunnel up", { host, localPort, remotePort: effectiveRemotePort })
  return result
}

export async function disconnect(host: string): Promise<void> {
  const entry = tunnels.get(host)
  if (!entry) return
  tunnels.delete(host)
  if (entry.remotePid) {
    runExec(entry.opts, `kill ${Number(entry.remotePid)} >/dev/null 2>&1 || true; echo ok`, entry.result.password).catch(
      () => {},
    )
  }
  try {
    entry.child.kill()
  } catch {}
}

export function stopAll(): void {
  for (const [, e] of tunnels) {
    try {
      e.child.kill()
    } catch {}
  }
  tunnels.clear()
}

export * as Ssh from "./ssh"
