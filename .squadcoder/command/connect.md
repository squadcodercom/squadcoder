---
description: Link this workspace to a remote host (SSH) so the agent can deploy + manage it from here
agent: team
---

Set up (or update) this workspace's **remote link** so you can deploy and manage the remote **from this
local workspace** — no remote engine, no server switching. Use the **sc:deploy-remote** skill.

Steps:
1. **Pick the host** — read `~/.ssh/config`, show me the configured hosts (alias + HostName/IP), and ask
   which one to use (e.g. **Relay**). If I named one below, use it. The SSH **key** comes from that host's
   `IdentityFile` — confirm it.
2. **Remote path** — ask the target directory (e.g. `/opt/squadcoder`). **Create it if it doesn't exist**
   (`ssh <host> 'mkdir -p "<path>"'` — idempotent, never deletes).
3. **Verify reachability** (non-destructive): `ssh <host> 'echo ok && whoami && uname -a'`. Stop + report
   if it fails — never guess credentials.
4. **Save the link** to **`.squadcoder/remote.json`** (host + path + secret-safe `exclude` defaults) **AND
   record it to project memory** (so you AUTO-RECALL which remote this workspace deploys to next time,
   without me re-telling you — e.g. write a memory note: "workspace <name> deploys to <host>:<path>").

Confirm the saved link back to me. After this, `/deploy` (or "push to Relay") just works.

Host / target (optional): $ARGUMENTS
