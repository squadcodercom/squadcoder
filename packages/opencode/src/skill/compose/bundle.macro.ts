// SQUADCODER cache-bust 2026-06-22: this is a Bun build MACRO whose result is cached by the macro
// module's source, NOT by the .md files it reads via fs — so edits to .bundle/**/*.md won't re-inline
// unless this file also changes. Touch this comment whenever .bundle content changes.
import fs from "fs"
import path from "path"

function walkDir(base: string, rel: string, out: Record<string, string>) {
  const fullPath = rel ? path.join(base, rel) : base
  for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
    const relPath = rel ? `${rel}/${entry.name}` : entry.name
    if (entry.isDirectory()) {
      walkDir(base, relPath, out)
    } else {
      out[relPath] = fs.readFileSync(path.join(fullPath, entry.name), "utf8")
    }
  }
}

export function loadComposeBundle(): Record<string, Record<string, string>> {
  const dir = path.resolve(import.meta.dir, ".bundle")
  const result: Record<string, Record<string, string>> = {}

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const files: Record<string, string> = {}
    walkDir(path.join(dir, entry.name), "", files)
    if (Object.keys(files).length > 0) {
      result[entry.name] = files
    }
  }

  return result
}
