---
name: sc:deploy-remote
description: >-
  Deploy / sync the current LOCAL workspace to its linked REMOTE host over SSH, and manage that
  remote (create dirs, run commands, restart services) — all from the local workspace. Use when the
  user asks to deploy, push to production, sync to the server/remote, ship, release, or "handle the
  remote". Reads the per-workspace link from .squadcoder/remote.json. Security-first: never ships
  secrets, dry-runs first, confirms destructive actions. Auto-fires on: deploy, push to production,
  ship it, release, sync to remote, deploy to relay, manage the server, פרוס, העלה לשרת, דחוף לפרודקשן.
---

# Deploy & manage the remote from the local workspace

This skill lets the agent **develop locally** and then **deploy / manage a remote host over SSH**
without leaving the local workspace. The workspace is *linked* to its remote via a small config file;
you push code and run remote commands through that link. **No remote engine, no server switching.**

## 1. Read (or create) the workspace ↔ remote link

The link lives at **`.squadcoder/remote.json`** in the workspace root:

```json
{
  "host": "Relay",                      // an ~/.ssh/config alias (preferred) OR user@host
  "path": "/opt/squadcoder",            // the remote target directory
  "build": "npm run build",             // optional: local build to run before deploy (or null)
  "exclude": ["node_modules", ".git", ".env", ".env.*", "*.key", "*.pem", "id_*", "*.log", "dist/cache"],
  "postDeploy": "sudo systemctl restart squadcoder || true"  // optional: remote command after sync
}
```

- If the file exists, use it.
- If it does **not** exist, ASK the user for the **host** (offer the hosts in `~/.ssh/config`) and the
  **remote path**, then WRITE the file (with the secret-safe `exclude` defaults above) so the link
  persists for next time. Confirm the values back before deploying.

## 2. Pre-flight (do these EVERY time, in order)

1. **Confirm the target out loud**: "Deploying `<workspace>` → `<host>:<path>`. Proceed?" Wait for go on
   the first deploy of a session.
2. **Verify SSH reachability** (non-destructive): `ssh <host> 'echo ok && whoami && uname -a'`. If it
   fails, stop and report — do not guess credentials.
3. **Create the remote dir if missing** (idempotent, never deletes): `ssh <host> 'mkdir -p "<path>"'`.
4. **Local build** if `build` is set: run it locally and stop on failure (never deploy a broken build).

## 3. Security gate (MANDATORY — this is the whole point of the exclude list)

Before any file leaves the machine:
- **NEVER sync secrets.** Always apply the `exclude` patterns (`.env*`, `*.key`, `*.pem`, `id_*`,
  credentials, `.git`). If you detect a secret-looking file that isn't excluded, STOP and warn.
- **Scan the diff for hard-coded secrets** (API keys, tokens, passwords) in the files about to ship;
  if found, refuse and tell the user to move them to env/secret storage on the remote.
- **Least privilege**: prefer a non-root SSH user + `sudo` only for the specific service restart. Never
  `chmod 777`, never deploy as root unless the user explicitly says so.
- **Loopback/keys only**: rely on the host's key auth from `~/.ssh/config`; never put passwords in argv.

## 3b. Environment separation — local DEV config ≠ remote PROD config (critical)

The remote has its **own** production `.env`, database credentials, API keys, and service config that are
**different** from local dev. Treat them as sacred:
- **NEVER push local secrets/config over the remote's.** The `exclude` list already keeps `.env*`, keys,
  and `.git` local-only, so a normal `/deploy` leaves the remote's prod config intact.
- **DB migrations / seeds / backend tasks run ON the remote**, so they use the **remote's** prod database
  + creds (because the command executes there via `ssh <host> '…'`), not the local dev DB. Before any
  migration: confirm the target, prefer a backup/dump first (`pg_dump`/`mysqldump`), and never run a
  destructive migration without explicit confirmation naming the DB.
- **To change a remote-only file** (the prod `.env`, an nginx/systemd unit): read it first
  (`ssh <host> 'cat <file>'`), make a timestamped backup (`cp <file> <file>.bak.$(date +%s)`), apply the
  minimal edit, and show the user the diff. Do NOT regenerate it from local.
- If the user asks to "update the backend", clarify scope: **code** (→ `/deploy`), **deps/build**
  (→ run on remote), **DB** (→ migrate on remote, backup first), or **a config value** (→ edit remote file).

## 4. Deploy (rsync — safe by default)

1. **DRY-RUN FIRST, always**:
   `rsync -azP --dry-run --delete --exclude-from=<excludes> ./ <host>:"<path>/"`
   Show the user exactly what will be **added / changed / DELETED**.
2. **`--delete` is destructive** — only include it after the user sees the dry-run and confirms (it
   removes remote files not present locally). Default to NO `--delete` unless asked for a clean mirror.
3. On confirmation, run the real rsync (drop `--dry-run`).
4. **Post-deploy command** if `postDeploy` is set (e.g. restart the service). Then verify it's healthy
   (`ssh <host> 'systemctl is-active <svc>'` or curl a health endpoint) and report.

## 5. Managing the remote (beyond deploy)

For "restart X / check logs / disk space / run migration on the remote", run the command over SSH
against the linked `host` (read-only first — `ls`, `cat`, `journalctl`, `df -h` — before anything that
changes state). Always echo the exact command and the host before a state-changing action, and never
run destructive commands (`rm -rf`, `DROP`, `systemctl stop`) without an explicit confirmation that
names the target.

## Hard rules
- Secrets never leave local. Dry-run before every sync. Confirm before `--delete` or any destructive
  remote command. Verify reachability before acting. Stop + report on any SSH/auth failure — never
  retry blindly. Respond in the user's language (Hebrew or English).
