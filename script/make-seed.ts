#!/usr/bin/env bun
/**
 * SQUADCODER — assemble the first-run seed.
 *
 * Produces `seed/` at the repo root: the exact layout copied into a user's global
 * config dir (%APPDATA%/squadcoder, XDG elsewhere) on first launch by
 * packages/opencode/src/global/seed.ts. Run at build time (desktop + CLI packaging).
 *
 * Layout produced (chosen so everything auto-discovers from the global config dir
 * with no project-relative paths):
 *   seed/squadcoder.json   <- root squadcoder.json, minus `instructions` & `skills.paths`
 *                          (relative paths don't resolve from the global dir; skills
 *                          auto-discover from the dir scan, instructions via AGENTS.md)
 *   seed/AGENTS.md      <- .squadcoder/instructions.md   (auto-loaded as global instructions)
 *   seed/skills/**      <- .squadcoder/skills/**          (auto-discovered)
 *   seed/agent/**       <- .squadcoder/agent/**           (auto-discovered)
 *   seed/plugin/**      <- .squadcoder/plugin/**          (auto-discovered: anthropic auth + opt-in
 *                          Claude Pro/Max OAuth ships as a plugin file, NOT compiled into the engine)
 *   seed/optional/**    <- .squadcoder/optional/**        (stored, not auto-scanned)
 *   seed/SETUP.md, seed/TEAM_MODE.md                    (discoverability)
 *   seed/.squadcoder-seed  <- seed version stamp
 */
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const SEED_VERSION = "1"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")
const squadcoderDir = path.join(root, ".squadcoder")
const seedDir = path.join(root, "seed")

function rmrf(p: string) {
  fs.rmSync(p, { recursive: true, force: true })
}

function copyDir(from: string, to: string) {
  if (!fs.existsSync(from)) return
  fs.cpSync(from, to, { recursive: true })
}

rmrf(seedDir)
fs.mkdirSync(seedDir, { recursive: true })

// 1) Global config file: keep path-independent blocks only.
const rootConfig = JSON.parse(fs.readFileSync(path.join(root, "squadcoder.json"), "utf8"))
delete rootConfig.instructions
if (rootConfig.skills) {
  delete rootConfig.skills.paths
  if (Object.keys(rootConfig.skills).length === 0) delete rootConfig.skills
}
fs.writeFileSync(path.join(seedDir, "squadcoder.json"), JSON.stringify(rootConfig, null, 2) + "\n")

// 2) Instructions -> AGENTS.md (auto-loaded from the global config dir).
const instructions = path.join(squadcoderDir, "instructions.md")
if (fs.existsSync(instructions)) {
  fs.copyFileSync(instructions, path.join(seedDir, "AGENTS.md"))
}

// 3) Auto-discovered + stored dirs.
copyDir(path.join(squadcoderDir, "skills"), path.join(seedDir, "skills"))
copyDir(path.join(squadcoderDir, "agent"), path.join(seedDir, "agent"))
// SQUADCODER: a developer's local .squadcoder/agent may pin worker roles to a personal provider
// (e.g. zai/GLM-5.2 for a Z.ai plan). The SHIPPED seed must default to Anthropic so fresh installs
// work without that provider — reset any worker model back to the Anthropic default in the seed copy.
{
  const seedAgentDir = path.join(seedDir, "agent")
  const resetModels: Record<string, string> = {
    "team-dev.md": "anthropic/claude-sonnet-4-6",
    "team-frontend.md": "anthropic/claude-opus-4-8",
  }
  for (const [file, model] of Object.entries(resetModels)) {
    const p = path.join(seedAgentDir, file)
    if (fs.existsSync(p)) {
      fs.writeFileSync(p, fs.readFileSync(p, "utf8").replace(/^model:.*$/m, `model: ${model}`))
    }
  }
}
// SQUADCODER: ship the slash-command launchers (/ads, /build) so the flows are one-tap discoverable.
copyDir(path.join(squadcoderDir, "command"), path.join(seedDir, "command"))
// `plugin/` auto-discovers from the global config dir scan (ConfigPlugin.load → {plugin,plugins}/*.{ts,js}).
// The Anthropic auth plugin (incl. opt-in Claude Pro/Max OAuth) ships PRE-COMPILED to .js: the packaged
// engine runs on Electron's NODE runtime, which can't transpile a .ts plugin at import time (it throws
// "Bun is not defined") — so we Bun.build the editable .squadcoder/plugin-src/*.ts into seed/plugin/*.js.
// The compiled file is self-contained (only node:crypto), so no @mimo-ai/plugin runtime dep is needed.
const pluginSrcDir = path.join(squadcoderDir, "plugin-src")
if (fs.existsSync(pluginSrcDir)) {
  const outDir = path.join(seedDir, "plugin")
  fs.mkdirSync(outDir, { recursive: true })
  for (const entry of fs.readdirSync(pluginSrcDir).filter((f) => f.endsWith(".ts") && !f.endsWith(".d.ts"))) {
    const result = await Bun.build({
      entrypoints: [path.join(pluginSrcDir, entry)],
      target: "node",
      format: "esm",
    })
    if (!result.success) throw new AggregateError(result.logs, `failed to compile plugin ${entry}`)
    const js = await result.outputs[0].text()
    fs.writeFileSync(path.join(outDir, entry.replace(/\.ts$/, ".js")), js)
  }
}
// Any pre-built .js plugins committed directly under .squadcoder/plugin/ are copied as-is too.
copyDir(path.join(squadcoderDir, "plugin"), path.join(seedDir, "plugin"))
copyDir(path.join(squadcoderDir, "optional"), path.join(seedDir, "optional"))

// 4) Docs for discoverability.
for (const doc of ["SETUP.md", "TEAM_MODE.md"]) {
  const src = path.join(squadcoderDir, doc)
  if (fs.existsSync(src)) fs.copyFileSync(src, path.join(seedDir, doc))
}

// 5) Version sentinel (also marks this dir as a valid seed source).
fs.writeFileSync(path.join(seedDir, ".squadcoder-seed"), SEED_VERSION)

// Report.
function count(dir: string): number {
  if (!fs.existsSync(dir)) return 0
  let n = 0
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) n += count(path.join(dir, e.name))
    else n++
  }
  return n
}
console.log(`seed assembled at ${seedDir}`)
console.log(`  files: ${count(seedDir)}  (skills: ${count(path.join(seedDir, "skills"))}, agents: ${count(path.join(seedDir, "agent"))})`)
console.log(`  version: ${SEED_VERSION}`)
