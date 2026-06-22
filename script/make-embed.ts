#!/usr/bin/env bun
// SQUADCODER — assemble the offline codebase-index embed bundle (#40/#60) into repo-root `embed/`.
//
// Produces a self-contained Node bundle (~124MB) that electron-builder ships via extraResources →
// resources/embed, and that the engine spawns (Electron-as-Node) to embed code fully offline:
//   embed/
//     embed-worker.mjs                          (copied from packages/opencode/src/index)
//     node_modules/                             (transformers + win-x64 onnxruntime + sharp)
//     models/Xenova/all-MiniLM-L6-v2/           (quantized q8 model + tokenizer/config)
//
// Trims: onnxruntime-node → win32/x64 only; drops onnxruntime-web (node backend doesn't need it).
// Re-run after bumping @huggingface/transformers or changing the worker.
//
//   bun script/make-embed.ts

import { $ } from "bun"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const root = path.resolve(fileURLToPath(new URL("..", import.meta.url)))
const embed = path.join(root, "embed")
const worker = path.join(root, "packages/opencode/src/index/embed-worker.mjs")
const MODEL = "Xenova/all-MiniLM-L6-v2"
const TRANSFORMERS_VERSION = "4.2.0"

console.log("• resetting embed/")
fs.rmSync(embed, { recursive: true, force: true })
fs.mkdirSync(embed, { recursive: true })

fs.writeFileSync(
  path.join(embed, "package.json"),
  JSON.stringify(
    { name: "squadcoder-embed", private: true, version: "1.0.0", type: "module", dependencies: { "@huggingface/transformers": TRANSFORMERS_VERSION } },
    null,
    2,
  ),
)

console.log("• npm install (clean, node-resolvable; includes sharp win binary)")
await $`npm install --no-audit --no-fund`.cwd(embed)

console.log("• trim onnxruntime-node → win32/x64 only")
const ortBin = path.join(embed, "node_modules/onnxruntime-node/bin/napi-v6")
for (const d of ["darwin", "linux", "win32/arm64"]) fs.rmSync(path.join(ortBin, d), { recursive: true, force: true })

console.log("• drop onnxruntime-web (node backend only)")
fs.rmSync(path.join(embed, "node_modules/onnxruntime-web"), { recursive: true, force: true })

console.log("• copy worker")
fs.copyFileSync(worker, path.join(embed, "embed-worker.mjs"))

// Quantized model: fetch once (online) into a temp cache, then copy just the q8 weights.
const modelOut = path.join(embed, "models", MODEL)
fs.mkdirSync(path.join(modelOut, "onnx"), { recursive: true })
console.log("• fetching quantized model (one-time, online)…")
const tmpCache = path.join(embed, ".modelcache")
await $`node ${path.join(embed, "embed-worker.mjs")}`
  .env({ ...process.env, SQUADCODER_MODEL_CACHE: tmpCache })
  .stdin(new Response(JSON.stringify({ id: 1, texts: ["warm"] }) + "\n"))
  .quiet()
  .catch(() => {})
const cachedModel = path.join(tmpCache, "models", MODEL)
for (const f of ["config.json", "tokenizer.json", "tokenizer_config.json"]) {
  fs.copyFileSync(path.join(cachedModel, f), path.join(modelOut, f))
}
fs.copyFileSync(path.join(cachedModel, "onnx/model_quantized.onnx"), path.join(modelOut, "onnx/model_quantized.onnx"))
fs.rmSync(tmpCache, { recursive: true, force: true })

console.log("✓ embed/ assembled")
