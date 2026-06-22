import { defineConfig } from "electron-vite"
import appPlugin from "@squadcoder/app/vite"
import * as fs from "node:fs/promises"

const channel = (() => {
  const raw = process.env.OPENCODE_CHANNEL
  if (raw === "dev" || raw === "beta" || raw === "prod") return raw
  return "dev"
})()

const OPENCODE_SERVER_DIST = "../opencode/dist/node"

const nodePtyPkg = `@lydell/node-pty-${process.platform}-${process.arch}`

export default defineConfig({
  main: {
    define: {
      "import.meta.env.OPENCODE_CHANNEL": JSON.stringify(channel),
    },
    build: {
      rollupOptions: {
        input: { index: "src/main/index.ts" },
      },
      externalizeDeps: { include: [nodePtyPkg] },
    },
    plugins: [
      {
        name: "opencode:node-pty-narrower",
        enforce: "pre",
        resolveId(s) {
          if (s === "@lydell/node-pty") return nodePtyPkg
        },
      },
      {
        name: "opencode:virtual-server-module",
        enforce: "pre",
        resolveId(id) {
          // Externalize the prebuilt engine bundle instead of letting rollup re-bundle it.
          // node.js is a COMPLETE, valid Bun bundle (esbuild transpiles it cleanly; the
          // Bun-built CLI runs from it). Re-bundling its 21MB output through rollup's
          // CJS-interop/chunking corrupts it — rollup emits an unterminated string in the
          // re-chunked engine ("Unterminated string literal" at esbuild-transpile). So we
          // ship node.js verbatim into out/main/chunks/ (beside its .wasm, which it
          // references relatively) and load it at runtime via the dynamic import below.
          if (id === "virtual:opencode-server") return { id: "./chunks/node.js", external: true }
        },
      },
      {
        name: "opencode:copy-server-assets",
        async writeBundle() {
          await fs.mkdir("./out/main/chunks", { recursive: true })
          for (const l of await fs.readdir(OPENCODE_SERVER_DIST)) {
            // Copy the engine bundle itself (now external) plus its .wasm siblings.
            if (l !== "node.js" && !l.endsWith(".wasm")) continue
            if (l === "node.js") {
              // The engine is now self-contained except the native node-pty meta-package.
              // Rewrite that specifier to the concrete platform package (the only one
              // installed/packaged) — same job the build-time node-pty-narrower does for
              // rollup-bundled code, applied here to the externalized engine.
              let code = await fs.readFile(`${OPENCODE_SERVER_DIST}/${l}`, "utf8")
              code = code.replaceAll(`"@lydell/node-pty"`, `"${nodePtyPkg}"`).replaceAll(`'@lydell/node-pty'`, `'${nodePtyPkg}'`)
              await fs.writeFile(`./out/main/chunks/${l}`, code)
            } else {
              await fs.writeFile(`./out/main/chunks/${l}`, await fs.readFile(`${OPENCODE_SERVER_DIST}/${l}`))
            }
          }
        },
      },
    ],
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: "src/preload/index.ts" },
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
      },
    },
  },
  renderer: {
    plugins: [appPlugin],
    publicDir: "../../../app/public",
    root: "src/renderer",
    define: {
      "import.meta.env.VITE_OPENCODE_CHANNEL": JSON.stringify(channel),
    },
    build: {
      rollupOptions: {
        input: {
          main: "src/renderer/index.html",
          loading: "src/renderer/loading.html",
        },
      },
    },
  },
})
