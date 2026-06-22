// SQUADCODER — embedding worker (#40/#60).
//
// Runs as a standalone NODE child process (never Bun: onnxruntime-node segfaults under Bun, and
// running it out-of-process also keeps the heavy native inference off the engine's event loop).
// Protocol: newline-delimited JSON over stdin/stdout.
//   in : {"id": <n>, "texts": ["…", …]}
//   out: {"id": <n>, "vectors": [[…384], …]}  | {"id": <n>, "error": "…"}
// Emits {"ready": true} once the model has loaded.

import readline from "node:readline"
import path from "node:path"

const MODEL = "Xenova/all-MiniLM-L6-v2"

process.env.OMP_NUM_THREADS = "1"
process.env.ORT_NUM_THREADS = "1"

let extractorPromise = null

async function getExtractor() {
  if (extractorPromise) return extractorPromise
  extractorPromise = (async () => {
    const { pipeline, env } = await import("@huggingface/transformers")
    try {
      env.backends.onnx.wasm.numThreads = 1
    } catch {}
    const bundled = process.env.SQUADCODER_MODEL_DIR
    if (bundled) {
      env.allowRemoteModels = false
      env.localModelPath = bundled
    } else {
      const cache = process.env.SQUADCODER_MODEL_CACHE
      if (cache) env.cacheDir = path.join(cache, "models")
      env.allowRemoteModels = true
    }
    // q8 quantized weights: ~23MB vs ~87MB fp32, near-identical retrieval quality — keeps the
    // bundled offline model small.
    return pipeline("feature-extraction", MODEL, { dtype: "q8" })
  })()
  return extractorPromise
}

async function embedBatch(extractor, texts) {
  const out = []
  const BATCH = 32
  for (let i = 0; i < texts.length; i += BATCH) {
    const batch = texts.slice(i, i + BATCH)
    const res = await extractor(batch, { pooling: "mean", normalize: true })
    const dim = res.dims[res.dims.length - 1]
    for (let r = 0; r < batch.length; r++) {
      out.push(Array.from(res.data.slice(r * dim, (r + 1) * dim)))
    }
  }
  return out
}

const rl = readline.createInterface({ input: process.stdin })
rl.on("line", async (line) => {
  const trimmed = line.trim()
  if (!trimmed) return
  let msg
  try {
    msg = JSON.parse(trimmed)
  } catch {
    return
  }
  const { id, texts } = msg
  try {
    const extractor = await getExtractor()
    const vectors = await embedBatch(extractor, texts ?? [])
    process.stdout.write(JSON.stringify({ id, vectors }) + "\n")
  } catch (e) {
    process.stdout.write(JSON.stringify({ id, error: e && e.message ? e.message : String(e) }) + "\n")
  }
})

// Warm the model immediately so the first request isn't cold, and announce readiness.
getExtractor()
  .then(() => process.stdout.write(JSON.stringify({ ready: true }) + "\n"))
  .catch((e) => process.stdout.write(JSON.stringify({ fatal: e && e.message ? e.message : String(e) }) + "\n"))
