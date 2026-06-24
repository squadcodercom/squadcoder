#!/usr/bin/env bun
/**
 * repair-orphaned-sessions.ts
 *
 * One-shot repair for "ghost / stuck working" sessions left behind when the
 * desktop app (or engine) is FORCE-KILLED mid-stream (e.g. closing the Windows
 * "Not Responding" dialog). A killed process leaves:
 *   1. assistant `message` rows with NO `time.completed`   -> UI busy() spins forever, Stop does nothing
 *   2. `task` rows stuck at status='in_progress'/'pending'  -> Team workflow thinks it's mid-run
 *   3. `actor_registry` rows at status pending/running      -> (engine already self-heals these on boot)
 *
 * This mirrors what the engine's own `sweepOrphanAssistants` does, but globally
 * and with no age gate (after a restart nothing can be in-flight, so it is safe).
 *
 * USAGE (run with the SquadCoder app fully QUIT so the DB is not write-locked):
 *   bun scripts/repair-orphaned-sessions.ts            # dry-run, reports only
 *   bun scripts/repair-orphaned-sessions.ts --apply    # actually writes the fix
 *
 * The DB path can be overridden with SQUADCODER_DB=/path/to/mimocode.db
 */
import { Database } from "bun:sqlite"

const DB_PATH =
  process.env.SQUADCODER_DB ||
  `${process.env.USERPROFILE || process.env.HOME}/.local/share/squadcoder/mimocode.db`
const APPLY = process.argv.includes("--apply")

const ABORTED_ERROR = {
  name: "MessageAbortedError",
  data: { message: "Abandoned: previous request interrupted before completion" },
}

const db = new Database(DB_PATH, APPLY ? { readwrite: true, create: false } : { readonly: true })
const now = Date.now()

// ---- 1. orphaned assistant messages (no time.completed) ----
const msgRows = db
  .query(
    `SELECT m.id, m.session_id, m.data, s.title
       FROM message m LEFT JOIN session s ON s.id = m.session_id
      WHERE json_extract(m.data, '$.role') = 'assistant'
        AND json_extract(m.data, '$.time.completed') IS NULL`,
  )
  .all() as Array<{ id: string; session_id: string; data: string; title: string | null }>

// ---- 2. tasks stuck in a non-terminal state ----
const taskRows = db
  .query(`SELECT id, session_id, status, summary FROM task WHERE status IN ('in_progress','pending','running')`)
  .all() as Array<{ id: string; session_id: string; status: string; summary: string | null }>

// ---- 3. actors stuck pending/running (engine also heals these; included for completeness) ----
const actorRows = db
  .query(`SELECT session_id, actor_id, status FROM actor_registry WHERE status IN ('pending','running')`)
  .all() as Array<{ session_id: string; actor_id: string; status: string }>

const bySession = new Map<string, { title: string; msgs: number }>()
for (const m of msgRows) {
  const e = bySession.get(m.session_id) ?? { title: m.title ?? m.session_id, msgs: 0 }
  e.msgs++
  bySession.set(m.session_id, e)
}

console.log(`DB: ${DB_PATH}`)
console.log(`Mode: ${APPLY ? "APPLY (writing)" : "DRY-RUN (no changes)"}\n`)
console.log(`Orphaned assistant messages: ${msgRows.length}  across ${bySession.size} session(s)`)
for (const [sid, e] of bySession) console.log(`   - ${e.title}  (${e.msgs} msg)  [${sid}]`)
console.log(`Stuck tasks (in_progress/pending/running): ${taskRows.length}`)
for (const t of taskRows) console.log(`   - ${t.status}: ${(t.summary ?? "").slice(0, 60)}  [${t.id}]`)
console.log(`Stuck actors (pending/running): ${actorRows.length}`)

if (!APPLY) {
  console.log(`\nDry-run only. Re-run with --apply (app must be QUIT) to write these fixes.`)
  db.close()
  process.exit(0)
}

// ---- apply ----
let fixedMsgs = 0
const tx = db.transaction(() => {
  for (const m of msgRows) {
    const d = JSON.parse(m.data)
    d.time = { ...(d.time ?? {}), completed: d.time?.created ?? now }
    if (!d.error) d.error = ABORTED_ERROR
    db.query(`UPDATE message SET data = ?, time_updated = ? WHERE id = ?`).run(JSON.stringify(d), now, m.id)
    fixedMsgs++
  }
  for (const t of taskRows) {
    db.query(`UPDATE task SET status = 'abandoned', ended_at = ?, last_event_at = ? WHERE id = ?`).run(now, now, t.id)
  }
  db.query(
    `UPDATE actor_registry SET status='idle', last_outcome='failure',
       last_error='orphaned: repaired by repair-orphaned-sessions', time_updated=?, time_completed=?
     WHERE status IN ('pending','running')`,
  ).run(now, now)
})
tx()

console.log(`\n✅ Applied: finalized ${fixedMsgs} message(s), abandoned ${taskRows.length} task(s), idled ${actorRows.length} actor(s).`)
console.log(`Restart SquadCoder — the affected sessions will show idle and open without freezing.`)
db.close()
