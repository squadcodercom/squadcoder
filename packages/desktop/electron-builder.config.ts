import { execFile } from "node:child_process"
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
