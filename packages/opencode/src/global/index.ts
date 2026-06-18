import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import os from "os"
import { Filesystem } from "../util"
import { Flock } from "@mimo-ai/shared/util/flock"
import { resolveMimocodeHome } from "@mimo-ai/shared/global"
import { seedDefaults } from "./seed"

const resolved = resolveMimocodeHome()
const { data, cache, config, state } = resolved

export const Path = {
  // HOME/USERPROFILE read directly because Bun caches os.homedir() at startup.
  // Tests set these env vars to isolate from the developer's real home.
  get home() {
    return process.env.HOME || process.env.USERPROFILE || os.homedir()
  },
  data,
  bin: path.join(cache, "bin"),
  log: path.join(data, "log"),
  cache,
  config,
  state,
}

// Initialize Flock with global state path
Flock.setGlobal({ state })

// SQUADCODER: one-time migration from the previous-brand (mimocode) XDG dirs, so an
// existing mimocode install keeps its config/data/state after the rebrand. Runs
// BEFORE the mkdirs below (which would otherwise create empty targets first).
// Cache is intentionally skipped — it's regenerable and version-stamped.
if (resolved.legacy) {
  for (const key of ["config", "data", "state"] as const) {
    const from = resolved.legacy[key]
    const to = resolved[key]
    try {
      if (!existsSync(to) && existsSync(from)) {
        await fs.cp(from, to, { recursive: true })
      }
    } catch {}
  }
}

await Promise.all([
  fs.mkdir(Path.data, { recursive: true }),
  fs.mkdir(Path.config, { recursive: true }),
  fs.mkdir(Path.state, { recursive: true }),
  fs.mkdir(Path.log, { recursive: true }),
  fs.mkdir(Path.bin, { recursive: true }),
])

// SQUADCODER: first-run seed of bundled defaults (config + skills + agents +
// instructions) into the global config dir. No-op in dev or when no seed dir is
// shipped; never overwrites existing user files. Best-effort — never blocks boot.
await seedDefaults(Path.config).catch(() => {})

const CACHE_VERSION = "21"

const version = await Filesystem.readText(path.join(Path.cache, "version")).catch(() => "0")

if (version !== CACHE_VERSION) {
  try {
    const contents = await fs.readdir(Path.cache)
    await Promise.all(
      contents.map((item) =>
        fs.rm(path.join(Path.cache, item), {
          recursive: true,
          force: true,
        }),
      ),
    )
  } catch {}
  await Filesystem.write(path.join(Path.cache, "version"), CACHE_VERSION)
}

export * as Global from "."
