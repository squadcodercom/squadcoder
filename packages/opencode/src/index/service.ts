// SQUADCODER — codebase index service (#40/#60).
//
// Cursor-style local semantic index: walk the workspace (ignore-aware) → chunk each
// text file → embed chunks (all-MiniLM, offline) → store as JSON under the data dir →
// answer top-K cosine queries. Incremental: unchanged files (by mtime) reuse their
// stored vectors, so re-index is cheap. No SQLite extension needed (sqlite-vec can't
// load in packaged Node) — vectors live in JSON, cosine runs in JS over an in-memory
// cache. The `codebase_search` agent tool and the Settings panel both call this.

import fs from "fs/promises"
import { createHash } from "crypto"
import path from "path"
import { Global } from "../global"
import { embed, embedOne, cosine } from "./embedder"

const INDEX_VERSION = 2
const MODEL = "Xenova/all-MiniLM-L6-v2"

// Chunking: overlapping line windows. Overlap keeps a symbol that straddles a boundary
// findable from either side.
const CHUNK_LINES = 60
const CHUNK_OVERLAP = 12
const MAX_FILE_BYTES = 256 * 1024
const MAX_FILES = 8000

const IGNORE_DIRS = new Set([
  ".git", "node_modules", "dist", "build", "out", ".next", ".nuxt", ".output", ".cache",
  "coverage", "vendor", "target", ".venv", "venv", "__pycache__", ".idea", ".vscode",
  ".turbo", ".parcel-cache", "release", ".embed-probe", "tmp", ".tmp", "bin", "obj",
])
const BINARY_EXT = new Set([
  "png", "jpg", "jpeg", "gif", "webp", "ico", "bmp", "svg", "pdf", "zip", "gz", "tgz",
  "tar", "rar", "7z", "mp4", "mp3", "wav", "mov", "avi", "mkv", "flac", "woff", "woff2",
  "ttf", "otf", "eot", "exe", "dll", "so", "dylib", "bin", "wasm", "onnx", "node",
  "class", "jar", "pyc", "map", "ipynb", "psd", "ai", "sketch", "db", "sqlite",
])

export type Chunk = { file: string; start: number; end: number; text: string; vec: number[] }
export type IndexData = {
  version: number
  model: string
  root: string
  updatedAt: number
  files: Record<string, number> // relPath -> mtimeMs (incremental key)
  chunks: Chunk[]
}
export type Progress = {
  indexed: number
  total: number
  count: number // chunk count
  indexing: boolean
  done: boolean
  file?: string
  updatedAt?: number
  exists: boolean
}
export type ProgressCb = (p: Progress) => void
export type SearchHit = { file: string; start: number; end: number; score: number; text: string }

const memcache = new Map<string, IndexData>()
const live = new Map<string, Progress>()
const running = new Map<string, Promise<Progress>>()

function key(root: string) {
  return path.resolve(root)
}

function indexPath(root: string) {
  const hash = createHash("sha256").update(key(root)).digest("hex").slice(0, 16)
  return path.join(Global.Path.data, "index", `${hash}.json`)
}

async function load(root: string): Promise<IndexData | null> {
  const k = key(root)
  const cached = memcache.get(k)
  if (cached) return cached
  try {
    const raw = await fs.readFile(indexPath(root), "utf8")
    const data = JSON.parse(raw) as IndexData
    if (data.version === INDEX_VERSION && data.model === MODEL) {
      memcache.set(k, data)
      return data
    }
  } catch {}
  return null
}

async function persist(root: string, data: IndexData) {
  const p = indexPath(root)
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, JSON.stringify(data))
  memcache.set(key(root), data)
}

async function walk(root: string): Promise<string[]> {
  const out: string[] = []
  async function recurse(dir: string) {
    if (out.length >= MAX_FILES) return
    let entries: import("fs").Dirent[]
    try {
      entries = await fs.readdir(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entries) {
      if (out.length >= MAX_FILES) return
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (IGNORE_DIRS.has(e.name)) continue
        if (e.name.startsWith(".")) continue // skip hidden dirs (.git, .squadcoder, .github…)
        await recurse(full)
      } else if (e.isFile()) {
        const lower = e.name.toLowerCase()
        const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".") + 1) : ""
        if (BINARY_EXT.has(ext)) continue
        if (lower.endsWith(".min.js") || lower.endsWith(".min.css")) continue
        if (lower.endsWith(".lock") || lower === "bun.lock" || lower === "package-lock.json" || lower === "yarn.lock" || lower === "pnpm-lock.yaml") continue
        out.push(full)
      }
    }
  }
  await recurse(root)
  return out
}

function chunkFile(rel: string, content: string): Array<{ file: string; start: number; end: number; text: string }> {
  const lines = content.split(/\r?\n/)
  const chunks: Array<{ file: string; start: number; end: number; text: string }> = []
  if (lines.length === 0) return chunks
  const step = CHUNK_LINES - CHUNK_OVERLAP
  for (let i = 0; i < lines.length; i += step) {
    const slice = lines.slice(i, i + CHUNK_LINES)
    const text = slice.join("\n").trim()
    if (text.length >= 24) {
      chunks.push({ file: rel, start: i + 1, end: Math.min(i + CHUNK_LINES, lines.length), text })
    }
    if (i + CHUNK_LINES >= lines.length) break
  }
  return chunks
}

function relpath(root: string, full: string) {
  return path.relative(root, full).split(path.sep).join("/")
}

/** Live status: a run in progress wins; else reflect what's on disk. */
export async function status(root: string): Promise<Progress> {
  const k = key(root)
  const cur = live.get(k)
  if (cur && cur.indexing) return cur
  const data = await load(root)
  if (data) {
    const n = Object.keys(data.files).length
    return { indexed: n, total: n, count: data.chunks.length, indexing: false, done: true, updatedAt: data.updatedAt, exists: true }
  }
  return { indexed: 0, total: 0, count: 0, indexing: false, done: false, exists: false }
}

export function isIndexing(root: string) {
  return running.has(key(root))
}

/**
 * (Re)build the index for `root`. Incremental: unchanged files reuse stored vectors.
 * Concurrent calls share one run. Emits progress per processed file.
 */
export function reindex(root: string, onProgress?: ProgressCb): Promise<Progress> {
  const k = key(root)
  const existing = running.get(k)
  if (existing) return existing
  const run = doReindex(root, onProgress).finally(() => running.delete(k))
  running.set(k, run)
  return run
}

async function doReindex(root: string, onProgress?: ProgressCb): Promise<Progress> {
  const k = key(root)
  const prev = await load(root)
  const prevChunksByFile = new Map<string, Chunk[]>()
  if (prev) for (const c of prev.chunks) {
    const arr = prevChunksByFile.get(c.file)
    if (arr) arr.push(c)
    else prevChunksByFile.set(c.file, [c])
  }

  const files = await walk(root)
  const total = files.length
  const data: IndexData = { version: INDEX_VERSION, model: MODEL, root: k, updatedAt: Date.now(), files: {}, chunks: [] }

  let processed = 0
  const emit = (file?: string, done = false) => {
    const p: Progress = {
      indexed: processed,
      total,
      count: data.chunks.length,
      indexing: !done,
      done,
      file,
      updatedAt: data.updatedAt,
      exists: true,
    }
    live.set(k, p)
    onProgress?.(p)
  }
  emit()

  for (const full of files) {
    const rel = relpath(root, full)
    let stat: import("fs").Stats
    try {
      stat = await fs.stat(full)
    } catch {
      processed++
      continue
    }
    if (stat.size > MAX_FILE_BYTES) {
      processed++
      emit(rel)
      continue
    }
    const mtime = stat.mtimeMs
    data.files[rel] = mtime

    const unchanged = prev && prev.files[rel] === mtime && prevChunksByFile.has(rel)
    if (unchanged) {
      data.chunks.push(...prevChunksByFile.get(rel)!)
      processed++
      emit(rel)
      continue
    }

    let content: string
    try {
      content = await fs.readFile(full, "utf8")
    } catch {
      processed++
      emit(rel)
      continue
    }
    if (content.includes("\u0000")) {
      processed++
      emit(rel)
      continue
    }
    const cks = chunkFile(rel, content)
    if (cks.length) {
      try {
        const vecs = await embed(cks.map((c) => `${c.file}\n${c.text}`))
        for (let j = 0; j < cks.length; j++) data.chunks.push({ ...cks[j], vec: vecs[j] })
      } catch {
        // embedding failure for one file shouldn't abort the whole run
      }
    }
    processed++
    emit(rel)
  }

  data.updatedAt = Date.now()
  await persist(root, data)
  emit(undefined, true)
  return live.get(k)!
}

/** Top-K semantic search. Returns [] if there's no index yet. */
export async function search(root: string, query: string, limit = 8): Promise<SearchHit[]> {
  const data = await load(root)
  if (!data || data.chunks.length === 0) return []
  const q = await embedOne(query)
  const scored: SearchHit[] = data.chunks.map((c) => ({
    file: c.file,
    start: c.start,
    end: c.end,
    text: c.text,
    score: cosine(q, c.vec),
  }))
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, Math.max(1, Math.min(limit, 30)))
}

/** Drop the index for a workspace. */
export async function clear(root: string) {
  const k = key(root)
  memcache.delete(k)
  live.delete(k)
  try {
    await fs.rm(indexPath(root), { force: true })
  } catch {}
}
