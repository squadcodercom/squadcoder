# SquadCoder — Codebase Indexing (#40 / #60)

> Goal (user): Cursor-style semantic codebase index, **built into the engine**, that **auto-syncs
> when a workspace is added** (local *and* remote), with a **settings toggle + resync** and a
> **progress UI** — using a **cheap, self-contained** embedder (the user explicitly does **not**
> want to require installing external Ollama).

## What core already has (and doesn't)
- **Has:** fast **lexical** search — ripgrep + fuzzy file/symbol find (`packages/opencode/src/file/`),
  used by the picker and `@`-mentions. This is exact/fuzzy, **not semantic**.
- **Does not have:** any embedding-based semantic index. There is no vector store, no embedder, no
  per-workspace index lifecycle. So semantic "find code by meaning" is genuinely net-new.

## Interim (shipping now): offline MCP, disabled by default
`squadcoder.json` bundles `opencode-codebase-index-mcp@0.11.0` (MIT, Helweg) as `enabled:false`:
```jsonc
"codebase-index": {
  "type": "local",
  "command": ["npx", "-y", "opencode-codebase-index-mcp@0.11.0", "--project", "."],
  "enabled": false, "timeout": 30000
}
```
- Fully **offline** (local embeddings), Windows-supported, opencode-native.
- **Caveat:** v0.11.0 uses a local **Ollama** embedder — which the user wants to avoid as a hard
  dependency. So it stays **disabled** and is only the *fallback* for power users who already run
  Ollama, not the default experience.

## Chosen direction for the built-in feature (no Ollama)
A self-contained engine **IndexService** with a **bundled** embedder, so a fresh install indexes with
zero external setup:

1. **Embedder — bundled `fastembed` (ONNX, in-process).** Ships a small quantized model
   (e.g. `bge-small-en` / multilingual `bge-small` for Hebrew), ~80–130 MB, downloaded once on first
   index (or pre-seeded). No server, no Ollama, no API key, no cloud egress. This is the "cheap modal"
   the user asked for. (Alternative, opt-in: cloud embeddings via the user's existing provider key —
   faster, but cloud egress; off by default.)
2. **Store — SQLite + sqlite-vec** alongside the existing trajectory DB under the project's
   `.squadcoder` instance dir. One index per workspace key; remote workspaces index **on the remote
   engine** (the index lives next to the code, so remote-SSH workspaces get it for free).
3. **Chunking** — tree-sitter-aware (function/class spans) with line-ranged chunks; respects
   `.gitignore` + our seeded default ignores (reuse the #460 ignore set).
4. **Lifecycle / auto-sync** — build on `worktree add` / project open; incremental re-embed on file
   change (debounced) via the existing file-watch bus; `config.index.auto` (default on) gates it.
5. **Events / progress** — a `session.index` (or `project.index`) bus event (`{state, done, total}`)
   mirrored into the app sync, exactly like the `session.goal` pattern, to drive a progress bar +
   a settings "Resync" button.
6. **Surface** — a new tool (`semantic_search`) the agent can call, plus an `@`-mention source; a
   Settings ▸ Indexing panel (toggle, status, resync, model size).

## Why it isn't shipped in this pass
- It needs a **dependency decision** (bundle fastembed model in the installer vs first-run download)
  and a **live index run** to verify embed latency + memory on a real repo — neither is verifiable
  blind here. Shipping a half-wired indexer would violate "production-grade, not hacks."
- It touches the engine core (new service + bus event + tool) — we keep that diff isolated and
  upstreamable, so it's worth doing deliberately rather than rushed.

**Decision needed from the user:** embedder packaging — (A) bundle the fastembed model in the
installer (bigger download, instant first index, fully offline) vs (B) first-run model download
(smaller installer, needs one network fetch once). Default recommendation: **A** for the IL/offline
focus. Once chosen, IndexService is a bounded, isolated build.
