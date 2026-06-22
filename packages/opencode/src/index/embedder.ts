// SQUADCODER — local, offline text embedder for codebase indexing (#40/#60).
//
// The actual model (all-MiniLM-L6-v2, 384-dim, via transformers.js / onnxruntime) runs in a
// SEPARATE NODE child process — see embed-worker.mjs. Why out-of-process:
//   • onnxruntime-node SEGFAULTS under Bun (the dev engine) when loaded in the server process.
//   • Even under Node, synchronous native inference would block the engine's event loop (freezing
//     the UI/progress during a large index). A child process keeps the engine responsive.
// This module is the client: it spawns the worker (under Node — system `node` in dev, Electron-as-
// node when packaged), streams newline-delimited JSON, and resolves vectors by request id.

import { spawn, type ChildProcess } from "node:child_process"
import { fileURLToPath } from "node:url"

export const EMBED_DIM = 384

type Pending = { resolve: (v: number[][]) => void; reject: (e: Error) => void }

let child: ChildProcess | null = null
let ready: Promise<void> | null = null
let buffer = ""
let nextId = 1
const pending = new Map<number, Pending>()

function workerPath() {
  return process.env.SQUADCODER_EMBED_WORKER || fileURLToPath(new URL("./embed-worker.mjs", import.meta.url))
}

function spawnCommand(): { cmd: string; args: string[] } {
  const wp = workerPath()
  const isBun = !!(process.versions as { bun?: string }).bun
  // Dev engine runs under Bun → spawn the real `node` (onnxruntime is unstable under Bun).
  // Packaged engine runs under Electron's Node main → re-exec Electron as Node.
  if (isBun) return { cmd: process.env.SQUADCODER_NODE || "node", args: [wp] }
  return { cmd: process.execPath, args: [wp] }
}

function failAll(err: Error) {
  for (const [, p] of pending) p.reject(err)
  pending.clear()
}

function ensureChild(): Promise<void> {
  if (child && ready) return ready
  const { cmd, args } = spawnCommand()
  const proc = spawn(cmd, args, {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: "1" },
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  })
  child = proc

  ready = new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("embed worker did not become ready in time")), 180_000)
    proc.on("error", (e) => {
      clearTimeout(timeout)
      reject(new Error(`failed to start embed worker (${cmd}): ${e.message}`))
    })

    proc.stdout!.setEncoding("utf8")
    proc.stdout!.on("data", (d: string) => {
      buffer += d
      let nl: number
      while ((nl = buffer.indexOf("\n")) >= 0) {
        const line = buffer.slice(0, nl)
        buffer = buffer.slice(nl + 1)
        if (!line.trim()) continue
        let msg: { id?: number; vectors?: number[][]; error?: string; ready?: boolean; fatal?: string }
        try {
          msg = JSON.parse(line)
        } catch {
          continue
        }
        if (msg.ready) {
          clearTimeout(timeout)
          resolve()
          continue
        }
        if (msg.fatal) {
          clearTimeout(timeout)
          reject(new Error(msg.fatal))
          failAll(new Error(msg.fatal))
          continue
        }
        if (typeof msg.id === "number") {
          const p = pending.get(msg.id)
          if (!p) continue
          pending.delete(msg.id)
          if (msg.error) p.reject(new Error(msg.error))
          else p.resolve(msg.vectors ?? [])
        }
      }
    })
  })

  proc.on("exit", () => {
    child = null
    ready = null
    failAll(new Error("embed worker exited"))
  })

  return ready
}

export function isReady() {
  return child !== null && ready !== null
}

export async function warm() {
  await ensureChild()
}

/** Embed an array of texts → array of unit-normalised 384-dim vectors (computed in the worker). */
export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return []
  await ensureChild()
  const id = nextId++
  return new Promise<number[][]>((resolve, reject) => {
    pending.set(id, { resolve, reject })
    try {
      child!.stdin!.write(JSON.stringify({ id, texts }) + "\n")
    } catch (e) {
      pending.delete(id)
      reject(e instanceof Error ? e : new Error(String(e)))
    }
  })
}

/** Embed a single query string → one 384-dim vector. */
export async function embedOne(text: string): Promise<number[]> {
  const [v] = await embed([text])
  return v
}

/** Cosine similarity for two unit-normalised vectors == dot product. */
export function cosine(a: number[], b: number[]): number {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}
