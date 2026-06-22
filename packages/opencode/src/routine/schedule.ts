/**
 * Routine scheduling — persists a manifest of OS-level scheduled tasks that
 * each invoke `squadcoder run --dir "<dir>" --command "<routine>"`.
 *
 * Assumes `squadcoder` is on PATH when the OS scheduler fires the task.
 *
 * Cross-platform:
 *   win32  → Windows Task Scheduler (schtasks)
 *   others → user crontab (crontab -l / crontab -)
 *
 * SECURITY: all user-supplied strings are validated before use; external
 * commands are invoked via execFile with an args array — never shell-interpolated.
 */

import fs from "node:fs"
import path from "node:path"
import { execFile, spawn } from "node:child_process"
import { promisify } from "node:util"
import { Path } from "@/global"

const execFileAsync = promisify(execFile)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Schedule {
  id: string
  routine: string
  frequency: "daily" | "weekly"
  time: string // HH:MM 24-hour
  weekday?: number // 0=Sun … 6=Sat; required when frequency==="weekly"
  directory: string
  enabled: boolean
  createdAt: number
}

interface Manifest {
  schedules: Schedule[]
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const ROUTINE_RE = /^[A-Za-z0-9_\-:\/]+$/
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/
const WEEKDAY_NAMES = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"] as const

export type ValidationError = { kind: "validation"; message: string }
export type PlatformError = { kind: "platform"; message: string; stderr?: string }
export type ScheduleError = ValidationError | PlatformError

function validationError(message: string): ValidationError {
  return { kind: "validation", message }
}

function platformError(message: string, stderr?: string): PlatformError {
  return { kind: "platform", message, stderr }
}

export function validateInputs(input: {
  routine: string
  frequency: string
  time: string
  weekday?: number
  directory: string
}): ScheduleError | null {
  if (!ROUTINE_RE.test(input.routine))
    return validationError("routine must match /^[A-Za-z0-9_\\-:\\/]+$/")

  if (input.frequency !== "daily" && input.frequency !== "weekly")
    return validationError("frequency must be 'daily' or 'weekly'")

  if (!TIME_RE.test(input.time))
    return validationError("time must be HH:MM in 24-hour format")

  if (input.frequency === "weekly") {
    if (input.weekday === undefined || input.weekday === null)
      return validationError("weekday is required for weekly frequency")
    if (!Number.isInteger(input.weekday) || input.weekday < 0 || input.weekday > 6)
      return validationError("weekday must be an integer 0 (Sun) through 6 (Sat)")
  }

  if (!path.isAbsolute(input.directory))
    return validationError("directory must be an absolute path")

  // Reject characters that are illegal in a Windows path AND shell-dangerous on unix (defense in
  // depth; cron embeds the directory in a /bin/sh line — see shq() escaping in cronLine).
  if (/["\r\n]/.test(input.directory))
    return validationError("directory contains an illegal character")

  try {
    const stat = fs.statSync(input.directory)
    if (!stat.isDirectory()) return validationError("directory must be an existing directory")
  } catch {
    return validationError("directory does not exist")
  }

  return null
}

// ---------------------------------------------------------------------------
// Manifest persistence (atomic write via temp + rename)
// ---------------------------------------------------------------------------

function manifestPath(): string {
  return path.join(Path.data, "routine-schedules.json")
}

export function readManifest(): Manifest {
  try {
    const raw = fs.readFileSync(manifestPath(), "utf8")
    const parsed = JSON.parse(raw) as Manifest
    if (!Array.isArray(parsed.schedules)) return { schedules: [] }
    return parsed
  } catch {
    return { schedules: [] }
  }
}

function writeManifest(manifest: Manifest): void {
  const target = manifestPath()
  const tmp = target + ".tmp." + process.pid
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2), "utf8")
  fs.renameSync(tmp, target)
}

// ---------------------------------------------------------------------------
// OS task creation / deletion
// ---------------------------------------------------------------------------

async function createWindowsTask(schedule: Schedule): Promise<ScheduleError | null> {
  const taskName = `SquadCoder Routine ${schedule.id}`
  // Build the command string — validated inputs only
  const tr = `squadcoder run --dir "${schedule.directory}" --command "${schedule.routine}"`

  const [hh, mm] = schedule.time.split(":")
  const st = `${hh}:${mm}`

  const args =
    schedule.frequency === "daily"
      ? ["/Create", "/F", "/TN", taskName, "/TR", tr, "/SC", "DAILY", "/ST", st]
      : [
          "/Create",
          "/F",
          "/TN",
          taskName,
          "/TR",
          tr,
          "/SC",
          "WEEKLY",
          "/D",
          WEEKDAY_NAMES[schedule.weekday!],
          "/ST",
          st,
        ]

  try {
    await execFileAsync("schtasks", args)
    return null
  } catch (err) {
    const e = err as { stderr?: string; message?: string }
    return platformError("schtasks /Create failed", e.stderr ?? e.message ?? String(err))
  }
}

async function deleteWindowsTask(id: string): Promise<ScheduleError | null> {
  const taskName = `SquadCoder Routine ${id}`
  try {
    await execFileAsync("schtasks", ["/Delete", "/F", "/TN", taskName])
    return null
  } catch (err) {
    const e = err as { stderr?: string; message?: string }
    return platformError("schtasks /Delete failed", e.stderr ?? e.message ?? String(err))
  }
}

// Shell-single-quote a string so it is safe to embed verbatim in a /bin/sh command (cron fires the
// line through the shell). Neutralizes any metacharacters in the directory/routine.
function shq(s: string): string {
  return "'" + s.replace(/'/g, "'\\''") + "'"
}

// Cron weekday: 0=Sun … 6=Sat (same as our Schedule.weekday)
function cronLine(schedule: Schedule): string {
  const [hh, mm] = schedule.time.split(":")
  const dow = schedule.frequency === "daily" ? "*" : String(schedule.weekday)
  const marker = `# squadcoder-routine:${schedule.id}`
  return `${mm} ${hh} * * ${dow}  cd ${shq(schedule.directory)} && squadcoder run --command ${shq(schedule.routine)}  ${marker}`
}

// crontab reads the new table from stdin (`crontab -`). Async execFile does NOT honor an `input`
// option (that's spawnSync only), so we pipe via spawn and write stdin ourselves.
function crontabWrite(content: string): Promise<ScheduleError | null> {
  return new Promise((resolve) => {
    const child = spawn("crontab", ["-"])
    let stderr = ""
    child.stderr.on("data", (d) => (stderr += String(d)))
    child.on("error", (e) => resolve(platformError("crontab spawn failed", e.message)))
    child.on("close", (code) => resolve(code === 0 ? null : platformError("crontab update failed", stderr)))
    child.stdin.end(content)
  })
}

async function readCrontab(): Promise<string> {
  try {
    const { stdout } = await execFileAsync("crontab", ["-l"])
    return stdout
  } catch {
    return "" // no crontab yet
  }
}

async function createCronTask(schedule: Schedule): Promise<ScheduleError | null> {
  const existing = await readCrontab()
  return crontabWrite(existing.trimEnd() + "\n" + cronLine(schedule) + "\n")
}

async function deleteCronTask(id: string): Promise<ScheduleError | null> {
  const existing = await readCrontab()
  if (!existing) return null // nothing to delete
  const marker = `# squadcoder-routine:${id}`
  const filtered =
    existing
      .split("\n")
      .filter((line) => !line.includes(marker))
      .join("\n")
      .trimEnd() + "\n"
  return crontabWrite(filtered)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function listSchedules(): Schedule[] {
  return readManifest().schedules
}

export async function createSchedule(input: {
  routine: string
  frequency: "daily" | "weekly"
  time: string
  weekday?: number
  directory: string
}): Promise<{ schedule: Schedule } | { error: ScheduleError }> {
  const validErr = validateInputs(input)
  if (validErr) return { error: validErr }

  const manifest = readManifest()

  // Replace existing schedule for same routine+directory
  const existingIdx = manifest.schedules.findIndex(
    (s) => s.routine === input.routine && s.directory === input.directory,
  )
  if (existingIdx !== -1) {
    const old = manifest.schedules[existingIdx]
    // Best-effort delete old OS task; ignore errors (may already be gone)
    if (process.platform === "win32") {
      await deleteWindowsTask(old.id)
    } else {
      await deleteCronTask(old.id)
    }
    manifest.schedules.splice(existingIdx, 1)
  }

  const schedule: Schedule = {
    id: crypto.randomUUID(),
    routine: input.routine,
    frequency: input.frequency,
    time: input.time,
    weekday: input.frequency === "weekly" ? input.weekday : undefined,
    directory: input.directory,
    enabled: true,
    createdAt: Date.now(),
  }

  // Create OS task BEFORE writing manifest — on failure, don't persist
  const osErr =
    process.platform === "win32" ? await createWindowsTask(schedule) : await createCronTask(schedule)

  if (osErr) return { error: osErr }

  manifest.schedules.push(schedule)
  writeManifest(manifest)

  return { schedule }
}

export async function deleteSchedule(id: string): Promise<{ ok: true } | { error: ScheduleError }> {
  const manifest = readManifest()
  const idx = manifest.schedules.findIndex((s) => s.id === id)
  if (idx === -1) return { ok: true } // idempotent

  const osErr =
    process.platform === "win32" ? await deleteWindowsTask(id) : await deleteCronTask(id)

  if (osErr) return { error: osErr }

  manifest.schedules.splice(idx, 1)
  writeManifest(manifest)

  return { ok: true }
}
