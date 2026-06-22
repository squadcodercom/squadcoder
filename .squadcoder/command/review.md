---
description: Routine — senior-engineer review of the current changes (correctness → security → performance → readability → tests)
---

Run a **code-review routine** on the current changes. Use the `sc:code-review` skill for the rubric.

1. Gather the changes: `git status`, `git diff`, and `git diff --staged` (include untracked files). If $ARGUMENTS names a commit range or a path, scope to that instead.
2. Review like a senior engineer, in priority order: **correctness & edge cases → security → performance → readability → tests**. Tie every finding to a specific `file:line`.
3. Verify each claim against the actual code; prefer real bugs over style nits.
4. Output **severity-tagged, actionable findings** (Critical / High / Medium / Low). If it's clean, say so plainly — don't invent issues.

Scope: $ARGUMENTS
