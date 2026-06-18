import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path"

// SQUADCODER first-run seed: on an installed build, copy the bundled defaults
// (config + skills + agents + instructions) into the user's global config dir on
// first launch, so a fresh install ships with the full SquadCoder setup and the user
// only has to add an API model. Pure additive: never overwrites a file the user
// already has, so user edits always win and new defaults land on upgrade.
//
// The seed source is a `seed/` directory assembled at build time (see
// script/make-seed.ts) and shipped:
//   - desktop: as extraResources; the Electron main sets SQUADCODER_SEED_DIR
//   - cli: next to the binary in the release zip (<execDir>/seed)
// In dev there is no seed dir, so this is a silent no-op (the repo `.squadcoder`
// is already picked up via the project config scan).

const SENTINEL = ".squadcoder-seed"
const STAMP = ".squadcoder-seed-version"

function safeJoin(base: string | undefined | null, ...rest: string[]): string | undefined {
  if (!base) return undefined
  try {
    return path.join(base, ...rest)
  } catch {
    return undefined
  }
}

function resolveSeedSource(): string | undefined {
  const candidates = [
    process.env.SQUADCODER_SEED_DIR,
    safeJoin(process.execPath ? path.dirname(process.execPath) : undefined, "seed"),
    // Electron-only; in a spawned engine child this is usually undefined, which is
    // why the desktop main process also exports SQUADCODER_SEED_DIR.
    safeJoin((process as unknown as { resourcesPath?: string }).resourcesPath, "seed"),
  ].filter(Boolean) as string[]

  for (const c of candidates) {
    if (existsSync(path.join(c, SENTINEL))) return c
  }
  return undefined
}

async function readSeedVersion(dir: string): Promise<string> {
  return fs
    .readFile(path.join(dir, SENTINEL), "utf8")
    .then((s) => s.trim())
    .catch(() => "1")
}

// Recursively copy files from src into dest that don't already exist in dest.
// Skips the sentinel/stamp bookkeeping files.
async function copyMissing(src: string, dest: string): Promise<number> {
  let copied = 0
  const entries = await fs.readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name === SENTINEL || entry.name === STAMP) continue
    const from = path.join(src, entry.name)
    const to = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await fs.mkdir(to, { recursive: true })
      copied += await copyMissing(from, to)
    } else if (entry.isFile() || entry.isSymbolicLink()) {
      if (existsSync(to)) continue
      await fs.mkdir(path.dirname(to), { recursive: true })
      await fs.copyFile(from, to)
      copied++
    }
  }
  return copied
}

/**
 * Seed the user's global config dir with bundled defaults, once per seed version.
 * Best-effort: any failure is swallowed so it can never block startup.
 * Returns a small status object (used by callers/tests; ignored at boot).
 */
export async function seedDefaults(
  configDir: string,
): Promise<{ seeded: boolean; copied: number; reason?: string }> {
  try {
    const src = resolveSeedSource()
    if (!src) return { seeded: false, copied: 0, reason: "no-seed-source" }

    const version = await readSeedVersion(src)
    const stampPath = path.join(configDir, STAMP)
    const current = await fs.readFile(stampPath, "utf8").then((s) => s.trim()).catch(() => undefined)
    if (current === version) return { seeded: false, copied: 0, reason: "up-to-date" }

    await fs.mkdir(configDir, { recursive: true })
    const copied = await copyMissing(src, configDir)
    await fs.writeFile(stampPath, version, "utf8")
    return { seeded: true, copied }
  } catch (err) {
    return { seeded: false, copied: 0, reason: `error: ${err instanceof Error ? err.message : String(err)}` }
  }
}
