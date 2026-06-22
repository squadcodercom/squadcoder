import { Hono } from "hono"
import { describeRoute, validator, resolver } from "hono-openapi"
import z from "zod"
import { lazy } from "@/util/lazy"
import { errors } from "../../error"
import {
  listSchedules,
  createSchedule,
  deleteSchedule,
} from "@/routine/schedule"

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const ScheduleSchema = z
  .object({
    id: z.string(),
    routine: z.string(),
    frequency: z.enum(["daily", "weekly"]),
    time: z.string(),
    weekday: z.number().int().min(0).max(6).optional(),
    directory: z.string(),
    enabled: z.boolean(),
    createdAt: z.number(),
  })
  .meta({ ref: "RoutineSchedule" })

const CreateScheduleBody = z.object({
  routine: z.string().describe("Saved command/routine name"),
  frequency: z.enum(["daily", "weekly"]),
  time: z.string().describe("HH:MM in 24-hour format"),
  weekday: z
    .number()
    .int()
    .min(0)
    .max(6)
    .optional()
    .describe("0=Sun … 6=Sat; required when frequency is weekly"),
  directory: z.string().describe("Absolute path to the project directory"),
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

export const RoutineRoutes = lazy(() =>
  new Hono()
    .get(
      "/schedule",
      describeRoute({
        summary: "List routine schedules",
        description: "Return all OS-scheduled routine tasks managed by SquadCoder.",
        operationId: "routine.schedule.list",
        responses: {
          200: {
            description: "List of scheduled routines",
            content: {
              "application/json": {
                schema: resolver(z.object({ schedules: ScheduleSchema.array() })),
              },
            },
          },
        },
      }),
      (c) => c.json({ schedules: listSchedules() }),
    )
    .post(
      "/schedule",
      describeRoute({
        summary: "Create routine schedule",
        description:
          "Register an OS-level scheduled task that runs a saved routine on a cron. " +
          "If a schedule already exists for the same routine+directory it is replaced.",
        operationId: "routine.schedule.create",
        responses: {
          200: {
            description: "Created schedule",
            content: {
              "application/json": {
                schema: resolver(ScheduleSchema),
              },
            },
          },
          ...errors(400),
        },
      }),
      validator("json", CreateScheduleBody),
      async (c) => {
        const body = c.req.valid("json")
        const result = await createSchedule(body)
        if ("error" in result) {
          const { error } = result
          if (error.kind === "validation") return c.json({ error: error.message }, 400)
          return c.json({ error: error.message, stderr: error.stderr }, 500)
        }
        return c.json(result.schedule)
      },
    )
    .delete(
      "/schedule/:id",
      describeRoute({
        summary: "Delete routine schedule",
        description: "Remove an OS-scheduled routine task by its id.",
        operationId: "routine.schedule.delete",
        responses: {
          200: {
            description: "Schedule deleted",
            content: {
              "application/json": {
                schema: resolver(z.object({ ok: z.literal(true) })),
              },
            },
          },
          ...errors(400),
        },
      }),
      async (c) => {
        const id = c.req.param("id")
        const result = await deleteSchedule(id)
        if ("error" in result) {
          const { error } = result
          if (error.kind === "validation") return c.json({ error: error.message }, 400)
          return c.json({ error: error.message, stderr: error.stderr }, 500)
        }
        return c.json({ ok: true as const })
      },
    ),
)
