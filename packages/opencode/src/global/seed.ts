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

// SQUADCODER upgrade migration: when the seed version changes, UNION-merge the
// seed's top-level `plugin` array into an EXISTING host squadcoder.json so
// already-seeded hosts (local upgrades + remote SSH engines) pick up newly
// shipped plugins (e.g. @dietrichgebert/ponytail) without clobbering any other
// user key. Pure-additive on `plugin` only; every other host key is preserved.
//
// Runs ONLY when the seed version changed (the caller has already early-returned
// on "up-to-date") AND a host squadcoder.json already exists. If the host has no
// squadcoder.json yet, copyMissing creates it fresh (with the new plugin) — this
// branch must NOT create one.
//
// Security hardening (mandatory, from the Security review):
//   1. ATOMIC WRITE — temp file in the same dir, then rename over the target;
//      never a partial write to squadcoder.json.
//   2. POST-MERGE PARSE GUARD — stringify the merged object and re-parse it to
//      confirm validity before writing; on any failure ABORT (no-op), never write
//      a corrupt file.
//   3. NO ENV-EXPAND — read the host file as raw text and JSON.parse it; merge
//      only `plugin`; write back. Never resolve `${VAR}` / `{env:VAR}` placeholders
//      (they expand in-memory at config-load only). Uses fs + JSON exclusively,
//      never a config loader.
//   4. SILENT NO-OP — the whole branch is wrapped in try/catch; any failure
//      returns 0 and never blocks startup or corrupts the file.
//
// Locking note: the engine has an Flock pattern (Flock.withLock, keyed off the
// global state dir, requires Flock.setGlobal to have run). seedDefaults is a
// once-per-version, single-process-at-boot operation and the rest of the flow
// (copyMissing + stamp write) is already lock-free; pulling Flock in solely for
// this branch would add a global-state ordering dependency for no real gain and
// would be inconsistent with the surrounding seed code. The atomic temp+rename +
// try/catch is the agreed minimum (ponytail rule: smallest correct change).
async function mergePlugins(src: string, configDir: string): Promise<number> {
  try {
    const seedConfigPath = path.join(src, "squadcoder.json")
    const hostConfigPath = path.join(configDir, "squadcoder.json")

    // Raw text only — never a config loader (would expand env placeholders).
    const seedRaw = await fs.readFile(seedConfigPath, "utf8").catch(() => undefined)
    const hostRaw = await fs.readFile(hostConfigPath, "utf8").catch(() => undefined)
    if (!seedRaw || !hostRaw) return 0 // nothing to migrate (no seed/host config)

    const seed = JSON.parse(seedRaw)
    const host = JSON.parse(hostRaw)
    if (!seed || typeof seed !== "object") return 0
    if (!host || typeof host !== "object") return 0

    const seedPlugins = Array.isArray(seed.plugin) ? seed.plugin : []
    const hostPlugins = Array.isArray(host.plugin) ? host.plugin : []
    // Union, host order first, append new seed entries; dedup.
    const mergedPlugin = Array.from(new Set([...hostPlugins, ...seedPlugins]))
    // Nothing new → skip the write entirely (avoid a needless rewrite).
    if (JSON.stringify(mergedPlugin) === JSON.stringify(hostPlugins)) return 0

    const merged = { ...host, plugin: mergedPlugin }
    const text = JSON.stringify(merged, null, 2) + "\n"
    // POST-MERGE PARSE GUARD: confirm the serialized form round-trips before write.
    JSON.parse(text)

    // ATOMIC WRITE: temp file in the same dir, then rename over the target.
    const tmp = path.join(configDir, `.squadcoder.json.${process.pid}.${Date.now()}.tmp`)
    await fs.writeFile(tmp, text, "utf8")
    try {
      await fs.rename(tmp, hostConfigPath)
    } catch (err) {
      await fs.rm(tmp, { force: true }).catch(() => undefined)
      throw err
    }
    return 1
  } catch {
    // SILENT NO-OP — never block startup or corrupt the file.
    return 0
  }
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
    // Upgrade migration: union new seed plugins into an existing host config.
    // Only acts when the version changed (we did not early-return above) AND a
    // host squadcoder.json already exists; silent no-op otherwise.
    const merged = await mergePlugins(src, configDir)
    await fs.writeFile(stampPath, version, "utf8")
    return { seeded: true, copied: copied + merged }
  } catch (err) {
    return { seeded: false, copied: 0, reason: `error: ${err instanceof Error ? err.message : String(err)}` }
  }
}
