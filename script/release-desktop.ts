#!/usr/bin/env bun
/**
 * SQUADCODER — publish/refresh the desktop GitHub release from the built installer.
 *
 * Derives the release tag from packages/desktop/package.json (the single source of
 * truth) and uploads the already-built installer from release/. Run AFTER building
 * the installer (see AGENTS.md release recipe). The tag can never drift from the
 * displayed version because both derive from the same package.json, and the
 * desktop==app guard here makes a half-bumped version fail loud.
 *
 *   usage: bun script/release-desktop.ts [--dry-run]
 *
 * --dry-run prints what it would do (tag, repo, paths, exists?-check, create-vs-clobber)
 * and exits before any mutating gh command. The read-only `gh release view` still runs.
 */
import { $ } from "bun"
import path from "path"

const SEMVER = /^\d+\.\d+\.\d+$/
const root = path.resolve(import.meta.dir, "..")

async function readVersion(rel: string) {
  return (await Bun.file(path.join(root, rel)).json()).version as string
}

const desktopVersion = await readVersion("packages/desktop/package.json")
const appVersion = await readVersion("packages/app/package.json")
if (desktopVersion !== appVersion) {
  throw new Error(
    `version drift: desktop=${desktopVersion} app=${appVersion} — run \`bun script/set-version.ts <v>\` first`,
  )
}
const version = desktopVersion
// Refuse to interpolate into gh unless it's strict semver (treat as untrusted).
if (!SEMVER.test(version)) {
  throw new Error(`invalid semver in packages/desktop/package.json: ${version}`)
}

const tag = `v${version}`
const repo = process.env.GH_REPO ?? "squadcodercom/squadcoder"
const installer = path.join(root, "release", "SquadCoder-desktop-win-x64-installer.exe")
const blockmap = installer + ".blockmap"
const notes = process.env.RELEASE_NOTES ?? `Release ${tag}`
const dryRun = process.argv.includes("--dry-run")

// Read-only: does the release already exist?
const exists = (await $`gh release view ${tag} --repo ${repo}`.quiet().nothrow()).exitCode === 0
const installerExists = await Bun.file(installer).exists()

if (dryRun) {
  console.log("dry-run — no mutations will be performed")
  console.log(`  repo:            ${repo}`)
  console.log(`  tag:             ${tag}`)
  console.log(`  installer:       ${installer}  (exists: ${installerExists})`)
  console.log(`  blockmap:        ${blockmap}`)
  console.log(`  notes:           ${notes}`)
  console.log(`  release exists?: ${exists}`)
  console.log(
    `  action:          ${exists ? "gh release upload --clobber (refresh assets so tag==version)" : "gh release create (target main)"}`,
  )
  process.exit(0)
}

if (!installerExists) {
  throw new Error(`installer not found at ${installer} — build it first (see AGENTS.md release recipe)`)
}

if (!exists) {
  await $`gh release create ${tag} --repo ${repo} --target main --title ${`SquadCoder ${tag}`} --notes ${notes} ${installer} ${blockmap}`
} else {
  await $`gh release upload ${tag} --repo ${repo} --clobber ${installer} ${blockmap}`
}
console.log(`https://github.com/${repo}/releases/tag/${tag}`)
