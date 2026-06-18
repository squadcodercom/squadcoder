# SquadCoder — Team Mode & extra modes (מצב צוות)

SquadCoder ships extra agent **types** beyond the upstream `build` / `plan` / `compose`.
They are pure config — markdown agent files in `.squadcoder/agent/` — so they update with
upstream and need **zero core changes**. Switch primary modes with `Tab` (or pick in the
GUI agent selector); spawn role subagents with `@team-…` or let the orchestrator fire them.

## Team Mode — `team` (primary)

An **orchestrator** that runs a full engineering org. It classifies your request, fires
the right specialists **in parallel**, coordinates them through shared task-memory, and
synthesizes one result. It does not do the deep work itself.

### The roster (role subagents)

| Agent             | Role             | Default model tier |
| ----------------- | ---------------- | ------------------ |
| `team-product`    | Product / CEO    | standard           |
| `team-architect`  | Architect / CTO  | ultra              |
| `team-researcher` | Researcher ⚠️    | standard (opt-in)  |
| `team-dev`        | Developer (×N)   | standard           |
| `team-frontend`   | UI/UX Engineer   | standard           |
| `team-security`   | Security / Cyber | ultra              |
| `team-qa`         | QA / Reviewer    | lite               |

Model **tiers** (`ultra`/`standard`/`lite`) resolve via `model_groups` in `squadcoder.json`.
If you don't configure groups, every tier falls back to your default model — so it works
out of the box and you can tune cost later. Example:

```json
{
  "model_groups": {
    "ultra":    "anthropic/claude-opus-4-8",
    "standard": "anthropic/claude-sonnet-4-6",
    "lite":     "anthropic/claude-haiku-4-5-20251001"
  }
}
```

### How it fires (token discipline)

The orchestrator matches the team to the task size, so you don't pay for an org on a typo:

- **Trivial** → does it itself or one `team-dev`.
- **Small** → `team-dev` → `team-qa` (+ `team-frontend` if UI).
- **Feature** → `team-architect` → `team-dev ×N` ∥ `team-frontend` → `team-security` ∥ `team-qa`.
- **Greenfield** → `team-product` first, then the Feature flow.

It announces the chosen roster in one line before spawning, so you see the cost up front.

### Coordination = MiMoCode auto-memory

For multi-role work the orchestrator opens a `task` per workstream and binds each
subagent to it (`task_id`), so every role writes its findings to
`tasks/<id>/progress.md` — a durable shared record the whole team reads from. Roles also
inherit a checkpoint summary (`context: "state"`) and can message each other
(`actor send`) to hand off contracts (e.g. Architect → Dev API spec). This is the same
persistent memory SquadCoder already uses — Team Mode just coordinates through it.

### ⚠️ The Researcher toggle (token-heavy)

`team-researcher` is **off by default** and **expensive**. The orchestrator will **ask you
to confirm** before spawning it, with a one-line cost note, and prefers the cheap
`context7` MCP for routine "how does library X work" questions.

- **Tooltip wording (for the GUI toggle):** _"Researcher — deep web/docs research. Uses
  significantly more tokens; keep off unless the task needs external research."_
- **Hard-disable** entirely in `squadcoder.json`:
  ```json
  { "agent": { "team-researcher": { "disable": true } } }
  ```
  (A GUI on/off switch just writes this flag.)

### Cost & scale knobs

- Fewer roles = fewer tokens (the orchestrator already minimizes by task size).
- More parallel `team-dev` instances = faster but pricier; it uses the minimum the work
  splits into. Roles are spawned via the `actor` tool, which has **no hard concurrency
  cap** — the orchestrator self-limits by task classification, and per-spawn timeouts
  bound runaways. (The separate `workflow.maxConcurrentAgents` setting bounds the
  `workflow()` tool's fan-out, not Team Mode.)
- `context: "none"` (cheapest) is the default; `"state"`/`"full"` only where a role needs it.

## Other standalone modes (primary, no orchestration)

Single-purpose, cheap, `Tab`-switchable — when you want one expert, not the whole team:

- **`audit`** — read-only **security & cyber review** (OWASP, authz, injection, secrets,
  deps). Reports findings with severity + fixes; changes nothing.
- **`design`** — focused **UI/UX** pass with the bundled `ui-ux-pro-max` + Hebrew/RTL
  skills, accessibility and mobile-first built in. Can also implement the result.

## Customizing

Every role is a plain markdown file under `.squadcoder/agent/`. Edit a prompt, change a
model tier, add a role (`team-devops.md`, `team-data.md`, …) — drop in a file with
`mode: subagent` and it becomes spawnable automatically. Disable any role with
`{"agent": {"<name>": {"disable": true}}}`.
