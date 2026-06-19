---
name: sc:code-review
description: "Review a diff or PR like a senior engineer: correctness and edge cases first, then security, performance, readability, and tests — with severity-tagged, actionable findings tied to specific lines. Prioritizes real bugs over style nits and verifies claims against the code. Activate for: review this code, code review, review my PR, review the diff, find bugs, security review, סקירת קוד, בדיקת קוד, ביקורת קוד."
argument-hint: "[diff, files, or PR]"
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Code Review — senior-engineer pass over a diff/PR

Find what matters and say it clearly. A good review surfaces **real defects** with evidence, not a
list of style opinions. Default to reviewing the **changed lines** and their blast radius.

## Step 0 — orient
- What is this change trying to do? (Read the PR description / commit messages / the diff intent.)
- What's the blast radius — what calls this, what does it call, what data does it touch?
- Get the actual diff (`git diff`), don't review from memory.

## Review dimensions (in priority order)
1. **Correctness & edge cases** — does it do what it claims? Off-by-one, null/empty/None, error paths,
   async races, unhandled rejections, boundary inputs, wrong default. **This is most of the value.**
2. **Security** — input validation, injection (SQL/command/path traversal), authn/authz checks,
   secrets in code/logs, unsafe deserialization, XSS/CSRF for web, SSRF for fetchers.
3. **Resource & performance** — N+1 queries, unbounded loops/memory, missing pagination, blocking I/O
   on a hot path, leaks (listeners, handles), needless re-renders.
4. **API & data contracts** — backward compatibility, migration safety, nullable changes, error shapes.
5. **Readability & maintainability** — names, dead code, duplication, function size, matches the
   surrounding style. Flag, don't bikeshed.
6. **Tests** — is the new behavior covered? Are the tests meaningful (assert real outcomes) or hollow?

## How to report findings
For each finding:
- **Severity**: `blocker` / `major` / `minor` / `nit`.
- **Location**: `file:line` (clickable).
- **What & why**: the concrete problem and the failure it causes — quote the code.
- **Fix**: a specific suggestion (or a diff), not "consider improving this".

Group by severity; lead with blockers. Example:
> **[blocker] `auth.ts:42`** — token compared with `==`, so an empty token matches when the stored
> value is also falsy. Use a constant-time compare and reject empty tokens.

## Discipline
- **Verify before asserting.** Trace the data flow; don't claim a bug you didn't confirm in the code.
  If you're unsure, say "possible issue — verify X", don't state it as fact.
- Separate **must-fix** (correctness/security) from **nice-to-have** (style). Don't drown blockers in nits.
- Praise genuinely good choices briefly — it calibrates the rest.
- If the diff is large, review in passes (correctness → security → the rest) rather than skimming once.
- RTL/Hebrew web code: check for physical-CSS leftovers (`left/right`/`ml-`/`mr-`) that break RTL —
  prefer logical properties.

## Output shape
A short summary verdict (approve / approve-with-changes / request-changes), then findings grouped by
severity, then a one-line note on test coverage.
