import { execFile } from "node:child_process"
import { cp } from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { promisify } from "node:util"

import type { Configuration } from "electron-builder"

const execFileAsync = promisify(execFile)
const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..")
const signScript = path.join(rootDir, "script", "sign-windows.ps1")

async function signWindows(configuration: { path: string }) {
  if (process.platform !== "win32") return
  if (process.env.GITHUB_ACTIONS !== "true") return

  await execFileAsync(
    "pwsh",
    ["-NoLogo", "-NoProfile", "-ExecutionPolicy", "Bypass", "-File", signScript, configuration.path],
    { cwd: rootDir },
  )
}

const channel = (() => {
  const raw = process.env.OPENCODE_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
})()

const getBase = (): Configuration => ({
  // Descriptive default name, e.g. SquadCoder-desktop-windows-x64.zip / .dmg / .AppImage
  artifactName: "SquadCoder-desktop-${os}-${arch}.${ext}",
  directories: {
    output: "dist",
    buildResources: "resources",
  },
  files: ["out/**/*", "resources/**/*"],
  // The engine (out/main/chunks/node.js) is now an external ESM bundle loaded at
  // runtime via dynamic import, and it reads its tree-sitter .wasm from disk. Unpack
  // the chunks dir from the asar so both resolve to real files (ESM-from-asar + WASM
  // reads are unreliable packed). jsonc-parser is the engine's one pure-JS external —
  // unpack it too so the (unpacked) engine can resolve it on disk (a packed copy in a
  // different asar tree is unreachable from the unpacked engine).
  asarUnpack: ["out/main/chunks/**", "**/node_modules/jsonc-parser/**"],
  extraResources: [
    {
      from: "native/",
      to: "native/",
      filter: ["index.js", "index.d.ts", "build/Release/mac_window.node", "swift-build/**"],
    },
    {
      // SQUADCODER first-run seed (config + skills + agents + instructions). Assembled by
      // `bun script/make-seed.ts` → repo-root seed/. Lands at resources/seed; the main
      // process exports SQUADCODER_SEED_DIR=<resources>/seed so the engine seeds on first run.
      from: "../../seed/",
      to: "seed/",
      filter: ["**/*"],
    },
    {
      // SQUADCODER offline codebase-index embedder (#40/#60). Self-contained Node bundle:
      // embed-worker.mjs + node_modules (transformers + win-x64 onnxruntime) + the quantized
      // all-MiniLM model. Assembled by `bun script/make-embed.ts` → repo-root embed/. Lands at
      // resources/embed; the main process exports SQUADCODER_EMBED_WORKER + SQUADCODER_MODEL_DIR
      // so the engine spawns it (Electron-as-Node) and indexes fully offline.
      from: "../../embed/",
      to: "embed/",
      filter: ["**/*"],
    },
    {
      // SQUADCODER Remote-SSH self-contained Linux engine (#72). The desktop scp's this tarball
      // to ~/.squadcoder-server/<version>/ on a remote that lacks the engine (VS Code-server model).
      // Assembled by `bun script/make-remote-engine.ts` → repo-root remote-engine/. Ship ONLY the
      // tarball + VERSION (NOT the multi-hundred-MB node download cache).
      from: "../../remote-engine/",
      to: "remote-engine/",
      filter: ["squadcoder-remote-engine.tgz", "VERSION"],
    },
  ],
  mac: {
    category: "public.app-category.developer-tools",
    icon: `resources/icons/icon.icns`,
    hardenedRuntime: true,
    gatekeeperAssess: false,
    entitlements: "resources/entitlements.plist",
    entitlementsInherit: "resources/entitlements.plist",
    notarize: true,
    target: ["dmg", "zip"],
  },
  dmg: {
    sign: true,
  },
  protocols: {
    name: "SquadCoder",
    schemes: ["squadcoder", "opencode"],
  },
  win: {
    icon: `resources/icons/icon.ico`,
    signtoolOptions: {
      sign: signWindows,
    },
    target: ["nsis"],
  },
  nsis: {
    // Explicit installer name with short "win" token (fresh Explorer icon-cache key),
    // e.g. SquadCoder-desktop-win-x64-installer.exe
    artifactName: "SquadCoder-desktop-win-${arch}-installer.${ext}",
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    installerIcon: `resources/icons/icon.ico`,
    installerHeaderIcon: `resources/icons/icon.ico`,
  },
  linux: {
    icon: `resources/icons`,
    category: "Development",
    target: ["AppImage", "deb", "rpm"],
  },
  // electron-builder strips node_modules from extraResources (it owns the app dep tree), so the
  // offline embed bundle's node_modules (transformers + win-x64 onnxruntime) never gets copied.
  // Copy it into the packed app manually, after packing, before the installer is built. The bundle
  // MUST keep the literal name `node_modules` so transformers' internal bare imports resolve.
  afterPack: async (context: { appOutDir: string }) => {
    const copies: Array<[string, string]> = []
    // offline embed bundle node_modules (transformers + onnxruntime)
    const embedSrc = path.join(rootDir, "embed", "node_modules")
    if (existsSync(embedSrc))
      copies.push([embedSrc, path.join(context.appOutDir, "resources", "embed", "node_modules")])
    // @parcel/watcher native binding — the engine require()s `@parcel/watcher-<platform>-<arch>`
    // at runtime via createRequire from the unpacked engine chunks, so the .node must sit in the
    // app.asar.unpacked node_modules. The computed require name hides it from electron-builder's
    // dep walker, so copy it explicitly (belt-and-suspenders alongside the optionalDependencies).
    const watcherPkg = `@parcel/watcher-${process.platform}-${process.arch}`
    // Bun hoists to a .bun store + symlinks, so the package sits in the desktop workspace's
    // node_modules (same as node-pty), not the plain root node_modules/@parcel path — probe the
    // likely locations and copy the first that actually contains the .node binding.
    const watcherCandidates = [
      path.join(rootDir, "packages", "desktop", "node_modules", ...watcherPkg.split("/")),
      path.join(rootDir, "node_modules", ...watcherPkg.split("/")),
      path.join(
        rootDir,
        "node_modules",
        ".bun",
        `@parcel+watcher-${process.platform}-${process.arch}@2.5.1`,
        "node_modules",
        ...watcherPkg.split("/"),
      ),
    ]
    const watcherSrc = watcherCandidates.find((p) => existsSync(path.join(p, "watcher.node")))
    const watcherDest = path.join(
      context.appOutDir,
      "resources",
      "app.asar.unpacked",
      "node_modules",
      ...watcherPkg.split("/"),
    )
    // electron-builder already packs this (it's a desktop optionalDependency), so normally the dest
    // exists and we skip. Only copy as a fallback if the binding is missing — and `dereference`,
    // since bun's workspace copy is a symlink into the .bun store (a plain cp onto the packed dir
    // throws ENOTDIR).
    if (watcherSrc && !existsSync(path.join(watcherDest, "watcher.node"))) copies.push([watcherSrc, watcherDest])
    for (const [src, dest] of copies) await cp(src, dest, { recursive: true, dereference: true })
  },
})

function getConfig() {
  const base = getBase()

  switch (channel) {
    case "dev": {
      return {
        ...base,
        appId: "ai.squadcoder.desktop.dev",
        productName: "SquadCoder Dev",
        rpm: { packageName: "squadcoder-dev" },
      }
    }
    case "beta": {
      return {
        ...base,
        appId: "ai.squadcoder.desktop.beta",
        productName: "SquadCoder Beta",
        protocols: { name: "SquadCoder Beta", schemes: ["squadcoder", "opencode"] },
        rpm: { packageName: "squadcoder-beta" },
      }
    }
    case "prod": {
      return {
        ...base,
        appId: "ai.squadcoder.desktop",
        productName: "SquadCoder",
        protocols: { name: "SquadCoder", schemes: ["squadcoder", "opencode"] },
        rpm: { packageName: "squadcoder" },
      }
    }
  }
}

export default getConfig()
