// SQUADCODER — pure, dependency-free helpers for the Remote-SSH tunnel manager.
//
// Kept separate from ssh-tunnel.ts (which imports `electron`) so the argv construction, the remote
// bootstrap script, and the stderr/output classifiers can be unit-tested without an Electron runtime.
// These functions enforce the security invariants (loopback-only binds, accept-new host keys, password
// via stdin not argv) by construction — see ssh-tunnel.test.ts.

import type { SshErrorCode, SshTunnelOptions } from "../preload/types"

// The remote CLI engine authenticates Basic against MIMOCODE_SERVER_USERNAME (default "mimocode") +
// MIMOCODE_SERVER_PASSWORD. We pin the username to "squadcoder" on the remote so it matches the
// app-wide default in createSdkForServer — sidestepping the "mimocode" 401-over-the-tunnel trap.
export const SERVER_USERNAME = "squadcoder"
export const DEFAULT_REMOTE_PORT = 4096
export const DEFAULT_SSH_PORT = 22

export class SshError extends Error {
  constructor(
    public code: SshErrorCode,
    message: string,
  ) {
    super(message)
    this.name = "SshError"
  }
}

/** Common `-o` options shared by the bootstrap exec and the long-lived tunnel. */
export function buildBaseSshArgs(opts: SshTunnelOptions, knownHosts: string): string[] {
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
    `UserKnownHostsFile=${knownHosts}`,
    "-o",
    "ConnectTimeout=10",
    // key/agent auth only in MVP → fail fast instead of hanging on a hidden password prompt.
    "-o",
    "BatchMode=yes",
  ]
  if (opts.auth.kind === "key") args.push("-o", "IdentitiesOnly=yes", "-i", opts.auth.keyFile)
  if (opts.port && opts.port !== DEFAULT_SSH_PORT) args.push("-p", String(opts.port))
  return args
}

/** Full argv for the long-lived port-forward child. Local + remote binds are pinned to 127.0.0.1. */
export function buildTunnelArgs(
  opts: SshTunnelOptions,
  localPort: number,
  remotePort: number,
  knownHosts: string,
): string[] {
  return [
    "-N",
    "-T",
    ...buildBaseSshArgs(opts, knownHosts),
    "-L",
    `127.0.0.1:${localPort}:127.0.0.1:${remotePort}`,
    `${opts.user}@${opts.host}`,
  ]
}

/** Full argv for a short remote exec (`sh -lc <script>`). Password is sent via stdin, not argv. */
export function buildExecArgs(opts: SshTunnelOptions, script: string, knownHosts: string): string[] {
  return ["-T", ...buildBaseSshArgs(opts, knownHosts), `${opts.user}@${opts.host}`, "sh", "-lc", script]
}

// SQUADCODER VS-Code-style server root on the remote: a per-user, version-pinned engine dir,
// exactly like ~/.vscode-server. `<version>` is sha256(node.js)[:12] from the bundled VERSION,
// so a new engine build => new dir => re-upload, an unchanged engine => instant reuse.
export const REMOTE_SERVER_ROOT = "$HOME/.squadcoder-server"
/** Validate the version token (hex only) — it is interpolated into the remote shell script. */
export function safeVersion(v: string): string {
  if (!/^[a-f0-9]{6,40}$/i.test(v)) throw new SshError("engine-failed", `invalid engine version token: ${v}`)
  return v
}

// Shared snippet: start the bundled launcher under its OWN Node (Node 22 + --experimental-sqlite for
// node:sqlite), loopback-bound, password via env (not argv), then poll health → STARTED|FAILED.
// umask 077 hardens token files at-rest on shared remote hosts (auth.json / mcp-auth.json are written
// lazily on first login and on every refresh, so a one-shot chmod 600 would race the write — the umask
// makes EVERY file the engine creates owner-only for its whole lifetime).
function startEngineSnippet(): string[] {
  return [
    // Self-heal: evict any STALE squadcoder engine still holding the port from a previous version /
    // unclean disconnect (bootstrap already ruled out reuse). Scoped to OUR server root via the cmdline
    // match, so it never touches the user's other services. Then a fresh engine can bind cleanly.
    `for _p in $(ps -eo pid=,args= 2>/dev/null | grep "[n]ode-bin" | grep "${REMOTE_SERVER_ROOT}" | awk '{print $1}'); do kill "$_p" 2>/dev/null || true; done; sleep 1`,
    `chmod +x "$DIR/node-bin" 2>/dev/null || true`,
    `umask 077; MIMOCODE_SERVER_USERNAME=${SERVER_USERNAME} MIMOCODE_SERVER_PASSWORD="$SC_PW" SC_PORT="$P" SQUADCODER_SEED_DIR="$DIR/seed" ` +
      `nohup "$DIR/node-bin" --experimental-sqlite "$DIR/launcher.mjs" >"${REMOTE_SERVER_ROOT}/serve.log" 2>&1 &`,
    "PID=$!",
    `i=0; while [ $i -lt 60 ]; do if curl -fsS -u "${SERVER_USERNAME}:$SC_PW" -o /dev/null "http://127.0.0.1:$P/global/health" 2>/dev/null; then echo "STARTED $P $PID"; exit 0; fi; sleep 0.3; i=$((i+1)); done`,
    `echo "FAILED $P"; tail -n 25 "${REMOTE_SERVER_ROOT}/serve.log" 2>/dev/null`,
  ]
}

/**
 * Remote bootstrap script. Reads the server password from stdin (line 1), then:
 *   • REUSE if an engine with OUR password is already healthy on the port,
 *   • NEEDUPLOAD <version> if this engine version isn't installed under the server root yet,
 *   • else start the bundled launcher (loopback-bound) and wait for health → STARTED <port> <pid>,
 *   • FAILED <port> + tail of the log otherwise.
 */
export function bootstrapScript(remotePort: number, version: string): string {
  const p = String(remotePort)
  const v = safeVersion(version)
  return [
    "read SC_PW",
    `mkdir -p "${REMOTE_SERVER_ROOT}"; chmod 700 "${REMOTE_SERVER_ROOT}"`,
    `P=${p}`,
    `DIR="${REMOTE_SERVER_ROOT}/${v}"`,
    `if curl -fsS -u "${SERVER_USERNAME}:$SC_PW" -o /dev/null "http://127.0.0.1:$P/global/health" 2>/dev/null; then echo "REUSE $P"; exit 0; fi`,
    `if [ ! -f "$DIR/launcher.mjs" ]; then echo "NEEDUPLOAD ${v}"; exit 0; fi`,
    ...startEngineSnippet(),
  ].join("\n")
}

/**
 * After the desktop has scp'd the bundle to "<root>/<version>.tgz", extract it into
 * "<root>/<version>/" and start the engine. Same STARTED|FAILED contract. Password via stdin.
 */
export function installAndStartScript(remotePort: number, version: string): string {
  const p = String(remotePort)
  const v = safeVersion(version)
  return [
    "read SC_PW",
    `P=${p}`,
    `DIR="${REMOTE_SERVER_ROOT}/${v}"`,
    `TGZ="${REMOTE_SERVER_ROOT}/${v}.tgz"`,
    `if [ ! -f "$TGZ" ]; then echo "FAILED $P"; echo "bundle not uploaded"; exit 0; fi`,
    `rm -rf "$DIR"; mkdir -p "$DIR"; chmod 700 "${REMOTE_SERVER_ROOT}" 2>/dev/null || true`,
    `tar -xzf "$TGZ" -C "$DIR" || { echo "FAILED $P"; echo "extract failed"; exit 0; }`,
    `rm -f "$TGZ"`,
    ...startEngineSnippet(),
  ].join("\n")
}

/** The remote path (relative to the SSH user's home) the bundle is scp'd to before install. */
export function remoteBundlePath(version: string): string {
  return `.squadcoder-server/${safeVersion(version)}.tgz`
}

export type BootstrapOutcome =
  | { kind: "reuse"; port: number }
  | { kind: "started"; port: number; pid?: string }
  | { kind: "need-upload"; version: string }
  | { kind: "not-installed" }
  | { kind: "failed"; detail: string }

/** Parse the bootstrap script's stdout into a structured outcome. */
export function parseBootstrapOutput(stdout: string): BootstrapOutcome {
  const text = stdout.trim()
  const lines = text.split(/\r?\n/)
  for (const line of lines) {
    const reuse = line.match(/^REUSE\s+(\d+)/)
    if (reuse) return { kind: "reuse", port: Number(reuse[1]) }
    const started = line.match(/^STARTED\s+(\d+)\s*(\S+)?/)
    if (started) return { kind: "started", port: Number(started[1]), pid: started[2] }
    const upload = line.match(/^NEEDUPLOAD\s+([a-f0-9]+)/i)
    if (upload) return { kind: "need-upload", version: upload[1] }
    if (/^NOTINSTALLED/.test(line)) return { kind: "not-installed" }
  }
  return { kind: "failed", detail: text || "no output from remote" }
}

/** scp argv to push a local file to the remote (relative to home). Uses `-P` (uppercase) for port. */
export function buildScpArgs(
  opts: SshTunnelOptions,
  localFile: string,
  remoteRelPath: string,
  knownHosts: string,
): string[] {
  const args = [
    "-o",
    "StrictHostKeyChecking=accept-new",
    "-o",
    `UserKnownHostsFile=${knownHosts}`,
    "-o",
    "ConnectTimeout=10",
    "-o",
    "BatchMode=yes",
  ]
  if (opts.auth.kind === "key") args.push("-o", "IdentitiesOnly=yes", "-i", opts.auth.keyFile)
  if (opts.port && opts.port !== DEFAULT_SSH_PORT) args.push("-P", String(opts.port))
  args.push(localFile, `${opts.user}@${opts.host}:${remoteRelPath}`)
  return args
}

/** Map raw ssh stderr to a stable error code for localized UI messages. */
export function classifyStderr(stderr: string): SshErrorCode {
  const s = stderr.toLowerCase()
  if (s.includes("permission denied") || s.includes("authentication failed") || s.includes("no such identity"))
    return "auth-failed"
  if (s.includes("host key verification failed") || s.includes("remote host identification has changed"))
    return "host-key-changed"
  if (s.includes("forward") && (s.includes("failed") || s.includes("refused"))) return "forward-failed"
  if (s.includes("channel") && s.includes("open failed")) return "forward-failed"
  if (s.includes("timed out") || s.includes("connection timed out") || s.includes("operation timed out"))
    return "timed-out"
  if (s.includes("connection refused") || s.includes("could not resolve") || s.includes("no route to host"))
    return "timed-out"
  return "unknown"
}
