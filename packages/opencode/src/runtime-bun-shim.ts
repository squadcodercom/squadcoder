// SQUADCODER runtime shim.
//
// The desktop app loads the engine as a bundled ESM file inside Electron's MAIN process, which is the
// **Node** runtime — not Bun. But the engine source uses `Bun.file()` / `Bun.write()` in the prompt,
// memory, checkpoint and workflow paths (Bun.build does NOT polyfill the `Bun` global for target:node).
// Under Node those calls throw `Bun is not defined`, which is exactly what made every chat turn fail
// (`prompt_async failed: Bun is not defined`). This module provides a minimal Node-backed `Bun.file` /
// `Bun.write` so those calls work. It is imported FIRST in src/node.ts so it runs before any engine
// module evaluates.
//
// It is INERT under the real Bun runtime (detected via process.versions.bun) — Bun keeps its native,
// faster implementation. Code that legitimately branches on "are we Bun?" must test
// `process.versions.bun`, NOT `typeof Bun` (see npm/index.ts, plugin/index.ts), so this shim never
// causes a false "we're in Bun" detection.
import { promises as fs } from "node:fs"

const g = globalThis as unknown as {
  Bun?: unknown
  process?: { versions?: { bun?: string } }
}

const isRealBun = !!g.process?.versions?.bun

if (!isRealBun && typeof g.Bun === "undefined") {
  const toBuffer = async (data: unknown): Promise<Buffer | string> => {
    if (typeof data === "string") return data
    if (data instanceof Uint8Array) return Buffer.from(data)
    if (data instanceof ArrayBuffer) return Buffer.from(data)
    // A BunFile-like value (used by Bun.write(dst, Bun.file(src)) to copy).
    if (data && typeof (data as { arrayBuffer?: unknown }).arrayBuffer === "function") {
      return Buffer.from(await (data as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer())
    }
    return Buffer.from(String(data))
  }

  const file = (path: string | URL) => ({
    async text() {
      return fs.readFile(path, "utf8")
    },
    async exists() {
      try {
        await fs.access(path)
        return true
      } catch {
        return false
      }
    },
    async arrayBuffer() {
      const buf = await fs.readFile(path)
      return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
    },
    async bytes() {
      return new Uint8Array(await fs.readFile(path))
    },
    async json() {
      return JSON.parse(await fs.readFile(path, "utf8"))
    },
  })

  const write = async (path: string | URL, data: unknown) => {
    const content = await toBuffer(data)
    await fs.writeFile(path, content)
    return typeof content === "string" ? Buffer.byteLength(content) : content.length
  }

  g.Bun = { file, write }
}
