# SquadCoder — Curated Extensions & the Loop/Until‑Done Mode (#46)

> Reuse-before-build, security-reviewed. This is the canonical list of which community
> extensions we adopt vs avoid, and how the built-in **loop / until-done** mode works.
> Source verdicts: `REUSE_AUDIT.md` (workflow `wf_d67eb78e`, 13 agents). Don't re-research — update here.

---

## 1. Loop / until-done ("Ralph loop") — already in core, use `/goal`

**Do not build a re-prompt loop and do not bundle `ralph-loop` / `opencode-loop` / `OpenLoop`.**
Core already ships a **stronger** mechanism: `/goal` (`packages/opencode/src/session/goal.ts`).

How it works:
- `/goal <condition>` sets a per-session **stop condition**. The main run loop then refuses to
  stop until an **independent judge model** — a separate call that only *reads* the transcript,
  so it stays cold relative to the working agent's optimism — returns `{ok:true}`.
- The judge can also return `{ok:false, impossible:true}` to abort a genuinely unachievable goal,
  so the loop can't spin forever. Re-entries are bounded (`MAX_GOAL_REACT` in `prompt.ts`).
- `/goal clear` aborts the active goal.
- Every change broadcasts a `session.goal` event (condition + latest verdict) for UI indicators.

Why this beats naive Ralph loops: a blind "keep re-prompting until it says done" trusts the
agent's *self-report*; `/goal` gates on an **independent verdict over the real tool calls/results**,
which is the whole point of an until-done mode.

Usage (any surface — CLI / desktop / web):
```
/goal all unit tests pass and `bun run typecheck` is clean
…work happens autonomously, judged each turn…
/goal clear        # if you want to stop early
```

> GUI enhancement (future, optional): a persistent "loop active" banner + one-click stop driven by
> the `session.goal` event. The mechanism is fully usable today via the `/goal` slash command in the
> composer; the banner is cosmetic, so it's deferred rather than shipped unverified.

### Safe autonomous-run guardrails (opt-in)
When running long `/goal` loops unattended, layer these **passive, MIT** backstops (document, don't
auto-enable):
- **CC Safety Net** (MIT, ~1.4k★) — passive destructive-command backstop (catches `rm -rf`-class
  mistakes). Complements our own #460 fix (shadow-git `/undo` works even in non-git projects).
- **Envsitter Guard** (MIT) — blocks `.env`/secret leakage into the transcript.
- Keep **permission auto-approval OFF** for destructive tools during unattended runs.

---

## 2. Extensions — ADOPT (safe, permissive, maintained, Windows)

| Extension | License / health | Task | Why / how we use it |
|---|---|---|---|
| `grinev/opencode-telegram-bot` | MIT, 819★, active | #48 | Phone control. Standalone process talking to `squadcoder serve` over local HTTP. Single-user allowlist, no open ports, permission confirmation inline. **Document, don't bundle** (it's a separate process, not an MCP). See `REMOTE.md`. |
| `Helweg/opencode-codebase-index` | MIT, v0.11.0, active | #40/#60 | Semantic codebase index. Fully **offline** (local embeddings), Windows binaries, opencode-native. Bundled **disabled** in `squadcoder.json`. See `INDEXING.md`. |
| `CC Safety Net` | MIT, ~1.4k★ | #46 | Passive destructive-command backstop for autonomous loops. Opt-in. |
| `Envsitter Guard` | MIT | #46 | `.env` / secret leak guard. Opt-in. |

## 3. Extensions — AVOID bundling (security / fit)

| Category | Examples | Why we avoid |
|---|---|---|
| Naive loop plugins | `ralph-loop`, `opencode-loop`, `OpenLoop` | Weaker than core `/goal` (no independent judge). |
| Credential-proxy auth plugins | Antigravity, Omniroute, Kilo | High blast radius — route your credentials through a middleman. We do **local, no-middleman** auth only (API key default; subscription OAuth opt-in & ToS-warned). |
| Scrapers | Xquik, x-twitter scrapers | ToS/legal risk; not core to a coding IDE. |
| Network-egress notifiers / search | Google AI Search, WakaTime, Slack/ntfy bridges | Wrong for an **offline-first, privacy-first Hebrew IDE**; silent egress. |
| CLI skill installers | `openskills` et al. | Clone + execute external content (supply-chain risk). Our Skills tab is a **viewer/toggler**, not an installer. |

---

## 4. Security model (read before enabling anything network-facing)
- Everything above is **opt-in**. The default install makes **zero outbound calls** beyond the model
  provider you configure.
- Remote/phone bridges grant **remote code execution** on this machine — bind `serve` to `127.0.0.1`
  with a password, use a single-user allowlist, keep destructive-tool auto-approval OFF.
- Keys/credentials never transit a SquadCoder middleman. MCPs that need a key stay `enabled:false`
  until you add one (`mcp/index.ts` short-circuits disabled servers — no first-run errors).
