---
description: Deploy/sync this workspace to its linked remote over SSH (security-first), and manage the remote
agent: team
---

Deploy this workspace to its **linked remote** using the **sc:deploy-remote** skill.

1. Read the link from **`.squadcoder/remote.json`** (or recall it from project memory). If no link exists
   yet, run the **/connect** setup first (pick the host from `~/.ssh/config`, set the path, create it).
2. Follow the skill's **security gate**: never ship secrets (`.env*`, `*.key`, `*.pem`, `id_*`, `.git`),
   scan the diff for hard-coded credentials, **dry-run rsync first and show me the changes**, and confirm
   before any `--delete` or destructive remote command.
3. Sync, run the `postDeploy` step if set (e.g. restart the service), verify the remote is healthy, and
   report exactly what changed.

Extra instructions (optional, e.g. "only the build folder", "restart nginx"): $ARGUMENTS
