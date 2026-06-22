---
name: sc:codebase-index
description: "Semantic codebase search & indexing (Cursor-style). When a question is conceptual ('where is X handled', 'find everything related to auth') or the codebase is large/unfamiliar, index it once with the code-memory tools and use semantic search instead of blind grep — then verify hits by reading the real files. Activate for: where is this implemented, find where, search the codebase, semantic search, index the codebase, find all usages of, how does X work, איפה זה מטופל, חפש בקוד, אינדקס לקוד, חיפוש סמנטי, מצא את כל המקומות."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Codebase indexing & semantic search (reuse the `code-memory` MCP)

SquadCoder ships the **`code-memory`** MCP (local, offline, no API key — `uvx code-memory`) for
Cursor-style semantic code search. This skill tells you **when and how** to use it so the agent indexes
and searches the codebase the way a Cursor user expects — without anyone wiring it by hand.

> If the `code-memory` tools (`index_codebase`, `search_code`, `search_docs`, `search_history`) are
> **not** available, the MCP is disabled — fall back to `grep`/`glob` and (optionally) tell the user they
> can enable **code-memory** in Settings ▸ MCP for semantic search. Do **not** invent these tools.

## When to use semantic search vs grep

- **Conceptual / fuzzy** ("where is rate-limiting handled?", "find everything about billing", "how does
  auth flow work?") → **semantic** (`search_code` / `search_docs`). It finds relevant code even when the
  wording differs from the symbols.
- **Exact token** (a known symbol, string literal, error code, file name) → **`grep`/`glob`**. Don't pay
  for embeddings when you already know the literal.
- **History / "who changed this and why"** → `search_history` (commit/blame/file-history).

## Flow

1. **Index once per workspace.** On the first semantic query in a session (or when the user opens a new /
   large codebase), call `index_codebase` for the project root. It's incremental — re-running is cheap and
   keeps the index fresh after edits. The first ever run downloads the embedding model (~600 MB) and may
   take a minute; say so if the user is waiting.
2. **Search.** Use `search_code` (and `search_docs` for prose/markdown) with a natural-language query.
   Pull the top hits.
3. **ALWAYS verify before acting.** Semantic hits are *leads*, not ground truth — open the actual files
   and read the real lines before you edit, quote, or conclude. Never edit a file you only saw in a search
   snippet.
4. **Keep it fresh.** After a batch of edits that change structure, re-index so later searches stay
   accurate.

## Notes

- Fully **local & offline** — code never leaves the machine (fits SquadCoder's privacy posture).
- Prefer this over re-reading the whole tree when the codebase is big; prefer direct reads when it's small.
- This is a thin reuse layer over the MCP — no engine changes; works the same in CLI, desktop, and web.
