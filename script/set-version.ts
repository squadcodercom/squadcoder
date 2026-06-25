#!/usr/bin/env bun
/**
 * SQUADCODER — set the desktop app version everywhere.
 *
 * The version shown in Settings comes from packages/desktop/package.json (via
 * app.getVersion()). This writes the SAME version to desktop + app package.json so
 * the pair can never drift — release-desktop.ts guards on them matching before it
 * publishes a tag. This is the ONE action a human runs to change the desktop version.
 *
 *   usage: bun script/set-version.ts <major.minor.patch>
 *
 * (Not the opencode CLI/npm flow — that's script/version.ts, derived from
 * packages/opencode/package.json. The desktop-installer flow is separate.)
 */
import path from "path"

const SEMVER = /^\d+\.\d+\.\d+$/

const version = process.argv[2]
if (!version || !SEMVER.test(version)) {
  console.error("usage: bun script/set-version.ts <major.minor.patch>")
  process.exit(1)
}

const root = path.resolve(import.meta.dir, "..")
for (const rel of ["packages/desktop/package.json", "packages/app/package.json"]) {
  const pkg = await Bun.file(path.join(root, rel)).json()
  pkg.version = version
  await Bun.write(path.join(root, rel), JSON.stringify(pkg, null, 2) + "\n")
}
console.log(`set version ${version} in desktop + app package.json`)
