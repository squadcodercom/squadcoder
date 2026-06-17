# MuminAI Remote Sessions (`mumin` over SSH / tunnels)

MuminAI reuses MiMoCode/opencode's existing client–server split — **no new core code** — so you
can run the agent on a remote dev box and drive it locally. This doc is the `mumin remote` story.

## What core already gives us
- **`mumin serve`** — headless HTTP/WebSocket server (`packages/opencode/src/cli/cmd/serve.ts`).
  Bind it on the remote host: `mumin serve --hostname 127.0.0.1 --port 4096`
  (optionally `--password $TOKEN` for basic auth; see `--mdns` for LAN discovery).
- **`mumin attach <url>`** — a client that attaches to a remote `serve` instance
  (reuse/continue/fork a session). The terminal-native UI is also just `ssh user@host mumin`.

## Recommended secure transports (adopt, don't rebuild)
Pick one; all are mature and permissively licensed:

### 1. Tailscale (recommended for private dev) — BSD
Zero-config encrypted mesh; works through NAT/firewalls without port-forwarding.
```bash
# both machines on your tailnet
mumin serve --hostname 0.0.0.0 --port 4096      # remote
mumin attach http://<remote-tailscale-name>:4096 # local
```

### 2. Plain SSH + persistence (simplest) — for the terminal UI
```bash
ssh user@host
mumin                     # run the TUI on the remote
# survive disconnects: run inside zellij/tmux, or use mosh:
mosh user@host -- mumin
```
`mosh` (GPLv2) survives roaming/sleep/packet-loss. Install it yourself (`brew/apt install mosh`);
we invoke/document it rather than bundling (license).

### 3. Cloudflare Tunnel (temporary public link) — Apache-2.0
```bash
mumin serve --port 4096
cloudflared tunnel --url http://localhost:4096   # gives a temporary https URL
```

## Security notes
- Prefer Tailscale or SSH (private) over public tunnels for real work.
- Always set a `--password`/token on `mumin serve` if it can be reached beyond localhost.
- Keys/credentials stay on your machines; MuminAI adds no credential middleman.

## Roadmap (`mumin remote` sugar)
A thin `mumin remote` wrapper (reconnect-resilience + `--tailscale` auto-resolve) is planned on top
of the above — it adds convenience, not new transport. Tracked in the project task list.
