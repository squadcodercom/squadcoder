import z from "zod"
import { Effect } from "effect"
import { SessionCwd } from "./session-cwd"
import * as Tool from "./tool"
import * as Index from "../index/service"

const DESCRIPTION = `Semantic ("meaning-based") search over an embedded index of the current workspace's code.

Unlike grep (which matches exact text/regex), this finds code by CONCEPT — describe what you're
looking for in natural language and it returns the most relevant files and line ranges, even when
the wording differs. Use it to locate where a feature lives, find similar implementations, or get
oriented in an unfamiliar codebase before reading/editing.

Examples of good queries:
  - "where are the window minimize/maximize/close buttons rendered"
  - "JWT access-token refresh and rotation logic"
  - "how are chat sessions grouped by date in the sidebar"

Returns ranked results with file:path:line-range and a short code preview. If the index is still
building, it says so — fall back to grep/glob meanwhile. Prefer this for "where/how is X done"
questions; prefer grep for an exact symbol or string.`

export const CodebaseSearchTool = Tool.define(
  "codebase_search",
  Effect.gen(function* () {
    return {
      description: DESCRIPTION,
      parameters: z.object({
        query: z.string().describe("Natural-language description of the code you're looking for."),
        limit: z.number().min(1).max(20).optional().describe("Maximum number of results (default 8)."),
      }),
      execute: (params: { query: string; limit?: number }, ctx: Tool.Context) =>
        Effect.gen(function* () {
          if (!params.query?.trim()) throw new Error("query is required")

          yield* ctx.ask({
            permission: "codebase_search",
            patterns: [params.query],
            always: ["*"], // read-only: auto-approve
            metadata: { query: params.query },
          })

          const cwd = SessionCwd.get(ctx.sessionID)
          const limit = params.limit ?? 8

          const st = yield* Effect.promise(() => Index.status(cwd))
          if (!st.exists && !st.indexing) {
            // Indexing is OPT-IN (off by default). Uninvited background embedding of a large repo
            // loads a big index into a permanent in-memory cache and can OOM the engine. Build it
            // explicitly from Settings ▸ Indexing, or set SQUADCODER_AUTO_INDEX=1 to auto-build.
            if (process.env["SQUADCODER_AUTO_INDEX"] === "1") {
              Index.reindex(cwd).catch(() => {})
              return {
                title: params.query,
                metadata: { results: 0, indexing: true },
                output:
                  "The codebase index is being built for the first time (this happens once). " +
                  "Re-run codebase_search shortly, or use grep/glob/read meanwhile.",
              }
            }
            return {
              title: params.query,
              metadata: { results: 0, indexing: false },
              output:
                "No codebase index exists for this workspace and indexing is disabled by default. " +
                "Use grep/glob/read instead, or build the index from Settings ▸ Indexing.",
            }
          }

          const hits = yield* Effect.promise(() => Index.search(cwd, params.query, limit))
          if (hits.length === 0) {
            return {
              title: params.query,
              metadata: { results: 0, indexing: st.indexing },
              output: st.indexing
                ? `Index still building (${st.indexed}/${st.total} files). No matches yet — try again shortly.`
                : "No semantically relevant code found. Try grep for an exact symbol/string.",
            }
          }

          const out: string[] = [`Found ${hits.length} relevant code location(s) for "${params.query}":`, ""]
          for (const h of hits) {
            out.push(`${h.file}:${h.start}-${h.end}  (relevance ${h.score.toFixed(2)})`)
            const preview = h.text.split("\n").slice(0, 10).join("\n")
            out.push("```")
            out.push(preview)
            out.push("```")
            out.push("")
          }
          if (st.indexing) out.push(`(index still building: ${st.indexed}/${st.total} files)`)

          return {
            title: params.query,
            metadata: { results: hits.length, indexing: st.indexing },
            output: out.join("\n"),
          }
        }).pipe(Effect.orDie),
    }
  }),
)
