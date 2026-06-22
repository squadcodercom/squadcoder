import { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import z from "zod"
import { Effect } from "effect"
import { Instance } from "@/project/instance"
import { lazy } from "@/util/lazy"
import { jsonRequest } from "./trace"
import * as Index from "@/index/service"

// SQUADCODER — codebase index routes (#40/#60). The Settings panel polls /index/status
// for a live progress bar + file count, and POSTs /index/reindex to (re)build. The agent
// uses the index via the `codebase_search` tool, not these routes.

const Status = z.object({
  indexed: z.number(),
  total: z.number(),
  count: z.number(),
  indexing: z.boolean(),
  done: z.boolean(),
  exists: z.boolean(),
  file: z.string().optional(),
  updatedAt: z.number().optional(),
})

export const CodeIndexRoutes = lazy(() =>
  new Hono()
    .get(
      "/status",
      describeRoute({
        summary: "Codebase index status",
        description: "Indexed file count, total, chunk count, and whether an index build is in progress.",
        operationId: "index.status",
        responses: {
          200: {
            description: "Index status",
            content: { "application/json": { schema: resolver(Status) } },
          },
        },
      }),
      async (c) =>
        jsonRequest("CodeIndexRoutes.status", c, function* () {
          return yield* Effect.promise(() => Index.status(Instance.directory))
        }),
    )
    .post(
      "/reindex",
      describeRoute({
        summary: "Build / refresh the codebase index",
        description: "Start an incremental (re)index of the current workspace. Returns immediately; poll /index/status.",
        operationId: "index.reindex",
        responses: {
          200: {
            description: "Index build started",
            content: { "application/json": { schema: resolver(Status) } },
          },
        },
      }),
      async (c) =>
        jsonRequest("CodeIndexRoutes.reindex", c, function* () {
          const dir = Instance.directory
          // Fire-and-forget: the run updates the in-memory status that /status reports.
          Index.reindex(dir).catch(() => {})
          return yield* Effect.promise(() => Index.status(dir))
        }),
    )
    .post(
      "/clear",
      describeRoute({
        summary: "Clear the codebase index",
        operationId: "index.clear",
        responses: {
          200: {
            description: "Index cleared",
            content: { "application/json": { schema: resolver(z.object({ success: z.literal(true) })) } },
          },
        },
      }),
      async (c) =>
        jsonRequest("CodeIndexRoutes.clear", c, function* () {
          yield* Effect.promise(() => Index.clear(Instance.directory))
          return { success: true as const }
        }),
    ),
)
