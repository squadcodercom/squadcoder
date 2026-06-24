#!/usr/bin/env bun
// SQUADCODER — assemble the self-contained Linux engine bundle for Remote-SSH (VS Code-style).
//
// Produces  remote-engine/squadcoder-remote-engine.tgz  + remote-engine/VERSION, shipped in the
// installer via electron-builder extraResources (resources/remote-engine/). When you connect to a
// remote that has no engine, the desktop scp's this tarball to ~/.squadcoder-server/<version>/,
// extracts it, and runs  ./node-bin --experimental-sqlite launcher.mjs.
//
// SELF-CONTAINED on purpose: it bundles its OWN Linux Node (the remote's may be too old for the
// engine's node:sqlite — e.g. Node 21), so it runs on any x64 Linux host regardless of what's there.
// node-pty is stubbed (remote terminals off in this MVP; file/edit/bash-tool/agents/chat all work).
//
// Reuse key = first 12 hex of sha256(node.js): a new engine build => new <version> dir => re-upload;
// an unchanged engine => the remote already has it => instant reuse.

import { $ } from "bun"
import { existsSync, mkdirSync, rmSync, cpSync, writeFileSync, readFileSync, readdirSync, statSync } from "node:fs"
import { createHash } from "node:crypto"
import { join } from "node:path"

const ROOT = join(import.meta.dir, "..")
const NODE_VERSION = "22.23.0" // 22 LTS; node:sqlite behind --experimental-sqlite, incl. setReturnArrays (>=22.13)
const NODE_TARBALL = `node-v${NODE_VERSION}-linux-x64.tar.xz`
const NODE_URL = `https://nodejs.org/dist/v${NODE_VERSION}/${NODE_TARBALL}`

const engineDir = join(ROOT, "packages/opencode/dist/node")
const outDir = join(ROOT, "remote-engine")
const cacheDir = join(outDir, "cache")
const stageDir = join(outDir, "stage")

function log(msg: string) {
  console.log(`[make-remote-engine] ${msg}`)
}

function dirSize(dir: string) {
  let total = 0
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    total += e.isDirectory() ? dirSize(p) : statSync(p).size
  }
  return total
}

// 1. Ensure the engine node bundle exists (build-node.ts output).
if (!existsSync(join(engineDir, "node.js"))) {
  log("engine bundle missing — running build-node.ts…")
  await $`bun script/build-node.ts`.cwd(join(ROOT, "packages/opencode"))
}
if (!existsSync(join(engineDir, "node.js"))) {
  throw new Error("engine bundle (packages/opencode/dist/node/node.js) not found after build")
}

// 2. Download the Linux Node binary (cached).
mkdirSync(cacheDir, { recursive: true })
const nodeBin = join(cacheDir, `node-${NODE_VERSION}-linux-x64`)
if (!existsSync(nodeBin)) {
  log(`downloading Linux Node ${NODE_VERSION}…`)
  const xz = join(cacheDir, NODE_TARBALL)
  if (!existsSync(xz)) await $`curl -fsSL -o ${xz} ${NODE_URL}`
  // extract just bin/node — run inside cacheDir with a relative archive name so Windows tar
  // doesn't read the `C:` drive prefix as a remote host (host:path syntax).
  await $`tar xf ${NODE_TARBALL} node-v${NODE_VERSION}-linux-x64/bin/node`.cwd(cacheDir).quiet()
  cpSync(join(cacheDir, `node-v${NODE_VERSION}-linux-x64`, "bin", "node"), nodeBin)
}
log(`Linux Node ready (${(Bun.file(nodeBin).size / 1e6).toFixed(0)}MB)`)

// 3. Stage the bundle.
rmSync(stageDir, { recursive: true, force: true })
mkdirSync(join(stageDir, "node_modules"), { recursive: true })

// 3a. engine bundle + sourcemap + every tree-sitter .wasm sibling
cpSync(join(engineDir, "node.js"), join(stageDir, "node.js"))
for (const f of readdirSync(engineDir)) {
  if (f.endsWith(".wasm") || f === "node.js.map") cpSync(join(engineDir, f), join(stageDir, f))
}

// 3b. node binary
cpSync(nodeBin, join(stageDir, "node-bin"))

// 3c. jsonc-parser (real external) — prefer 3.x
const jsoncCandidates = [
  join(ROOT, "node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser"),
  join(ROOT, "node_modules/jsonc-parser"),
]
const jsonc = jsoncCandidates.find((p) => existsSync(p))
if (!jsonc) throw new Error("jsonc-parser not found in node_modules")
cpSync(jsonc, join(stageDir, "node_modules/jsonc-parser"), { recursive: true })

// 3d. @lydell/node-pty — the REAL wrapper + the linux-x64 native prebuild, so REMOTE TERMINALS
// work (full VS Code-style access). The wrapper does `require(@lydell/node-pty-${platform}-${arch})`
// at load → on the remote (linux-x64) it resolves the native package we bundle alongside it.
const bunDir = join(ROOT, "node_modules/.bun")
const ptyWrapDir = readdirSync(bunDir)
  .filter((d) => d.startsWith("@lydell+node-pty@"))
  .map((d) => join(bunDir, d, "node_modules/@lydell/node-pty"))
  .find((p) => existsSync(p))
if (!ptyWrapDir) throw new Error("@lydell/node-pty wrapper not found in node_modules")
const ptyVersion = JSON.parse(readFileSync(join(ptyWrapDir, "package.json"), "utf8")).version as string
cpSync(ptyWrapDir, join(stageDir, "node_modules/@lydell/node-pty"), { recursive: true })

// linux-x64 native package (download cached). Extract its `package/` payload into the bundle.
const ptyTgzName = `node-pty-linux-x64-${ptyVersion}.tgz`
const ptyTgz = join(cacheDir, ptyTgzName)
if (!existsSync(ptyTgz)) {
  log(`downloading @lydell/node-pty-linux-x64@${ptyVersion}…`)
  await $`curl -fsSL -o ${ptyTgz} https://registry.npmjs.org/@lydell/node-pty-linux-x64/-/node-pty-linux-x64-${ptyVersion}.tgz`
}
rmSync(join(cacheDir, "package"), { recursive: true, force: true })
await $`tar xzf ${ptyTgzName}`.cwd(cacheDir).quiet() // extracts to cacheDir/package/
cpSync(join(cacheDir, "package"), join(stageDir, "node_modules/@lydell/node-pty-linux-x64"), { recursive: true })
rmSync(join(cacheDir, "package"), { recursive: true, force: true })
log(`bundled real node-pty ${ptyVersion} + linux-x64 prebuild (remote terminals enabled)`)

// 3e. launcher.mjs — point the engine at the bundled seed BEFORE it loads (so a remote/Relay
// engine first-run-seeds the full stack: skills, agents, instructions, the anthropic-oauth plugin
// — exactly like a local install), then boot the HTTP server on loopback. The import of node.js MUST
// be DYNAMIC: seedDefaults runs at node.js module-eval time, and a static import is hoisted so it
// would run BEFORE the env assignment below.
writeFileSync(
  join(stageDir, "launcher.mjs"),
  [
    'import { fileURLToPath } from "node:url"',
    'import { dirname, join as pathJoin } from "node:path"',
    'const __dir = dirname(fileURLToPath(import.meta.url))',
    'process.env.SQUADCODER_SEED_DIR ||= pathJoin(__dir, "seed")',
    'const { Log, Server } = await import("./node.js")',
    'await Log.init({ level: "WARN" })',
    'const port = Number(process.env.SC_PORT || process.env.MIMOCODE_SERVER_PORT || 4096)',
    'const l = await Server.listen({',
    '  port,',
    '  hostname: "127.0.0.1",',
    '  username: process.env.MIMOCODE_SERVER_USERNAME || "squadcoder",',
    '  password: process.env.MIMOCODE_SERVER_PASSWORD || "",',
    '  cors: [],',
    '})',
    'console.log("LISTENING " + l.hostname + ":" + l.port)',
    "",
  ].join("\n"),
)

// 3f. seed/ — the full SquadCoder default stack (config + skills + agents + instructions + the
// anthropic-oauth plugin). The launcher points SQUADCODER_SEED_DIR at <extractDir>/seed so the
// remote engine first-run-seeds exactly like local. Throw if missing so a build can NEVER silently
// ship a remote engine that degrades to bare opencode.
const seedSrc = join(ROOT, "seed")
if (!existsSync(join(seedSrc, ".squadcoder-seed")))
  throw new Error("seed/.squadcoder-seed missing — run `bun script/make-seed.ts` before make-remote-engine")
if (!existsSync(join(seedSrc, "plugin", "anthropic-oauth.js")))
  throw new Error("seed/plugin/anthropic-oauth.js missing — reseed (the OAuth login plugin must ship)")
cpSync(seedSrc, join(stageDir, "seed"), { recursive: true })
log(`bundled seed/ (${(dirSize(seedSrc) / 1e6).toFixed(1)}MB)`)

// 4. Version = reuse key. Include the seed sentinel + a bundle-format salt so that bundling the seed
// (which does NOT change node.js) still produces a NEW version — forcing remotes to re-upload the
// seeded bundle instead of reusing a previously-extracted BARE engine dir.
const seedVersion = readFileSync(join(seedSrc, ".squadcoder-seed"), "utf8").trim() || "0"
const BUNDLE_FORMAT = "2-seeded"
const version = createHash("sha256")
  .update(readFileSync(join(engineDir, "node.js")))
  .update("\u0000seed:" + seedVersion)
  .update("\u0000fmt:" + BUNDLE_FORMAT)
  .digest("hex")
  .slice(0, 12)
writeFileSync(join(stageDir, "VERSION"), version)

// 5. Tar it. Run inside outDir with relative names (avoid the Windows `C:` host-path trap).
const tgz = join(outDir, "squadcoder-remote-engine.tgz")
rmSync(tgz, { force: true })
await $`tar -czf squadcoder-remote-engine.tgz -C stage .`.cwd(outDir).quiet()
writeFileSync(join(outDir, "VERSION"), version)
rmSync(stageDir, { recursive: true, force: true })

const sizeMB = (Bun.file(tgz).size / 1e6).toFixed(1)
log(`assembled ${tgz}`)
log(`  version: ${version}`)
log(`  size:    ${sizeMB}MB`)
