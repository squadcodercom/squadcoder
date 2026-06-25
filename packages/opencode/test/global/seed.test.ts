import { describe, test, expect, beforeEach, afterEach } from "bun:test"
import { type ParseError as JsoncParseError, parse as parseJsonc } from "jsonc-parser"
import fs from "fs/promises"
import { existsSync } from "fs"
import path from "path"
import os from "os"
import { seedDefaults } from "../../src/global/seed"

// seedDefaults discovers the seed source via process.env.SQUADCODER_SEED_DIR
// (must contain a `.squadcoder-seed` sentinel). We build a throwaway seed dir
// per test and point the env at it. No mocks — real fs + real impl.
const SENTINEL = ".squadcoder-seed"
const STAMP = ".squadcoder-seed-version"

const prevSeedDir = process.env.SQUADCODER_SEED_DIR

async function makeSeed(
  root: string,
  opts: { version?: string; config?: Record<string, unknown> } = {},
): Promise<string> {
  const seedDir = path.join(root, "seed-" + Math.random().toString(36).slice(2))
  await fs.mkdir(seedDir, { recursive: true })
  await fs.writeFile(path.join(seedDir, SENTINEL), opts.version ?? "2", "utf8")
  if (opts.config) {
    await fs.writeFile(path.join(seedDir, "squadcoder.json"), JSON.stringify(opts.config, null, 2) + "\n")
  }
  return seedDir
}

async function makeHost(
  root: string,
  opts: { stamp?: string; file?: string; config?: Record<string, unknown>; raw?: string } = {},
): Promise<string> {
  const host = path.join(root, "host-" + Math.random().toString(36).slice(2))
  await fs.mkdir(host, { recursive: true })
  const file = opts.file ?? "squadcoder.json"
  if (opts.raw !== undefined) {
    await fs.writeFile(path.join(host, file), opts.raw, "utf8")
  } else if (opts.config) {
    await fs.writeFile(path.join(host, file), JSON.stringify(opts.config, null, 2) + "\n")
  }
  if (opts.stamp) {
    await fs.writeFile(path.join(host, STAMP), opts.stamp, "utf8")
  }
  return host
}

// JSONC-tolerant read (tolerates comments + trailing commas), matches the engine's
// ConfigParse.jsonc behavior so a comment-bearing squadcoder.jsonc can be read back.
async function readHostConfig(host: string, file = "squadcoder.json"): Promise<Record<string, unknown>> {
  const text = await fs.readFile(path.join(host, file), "utf8")
  const errors: JsoncParseError[] = []
  const data = parseJsonc(text, errors, { allowTrailingComma: true })
  if (errors.length) throw new Error(`failed to parse ${file}: ${errors.length} error(s)`)
  return data as Record<string, unknown>
}

describe("seedDefaults", () => {
  let root: string

  beforeEach(async () => {
    root = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "seed-test-")))
  })

  afterEach(async () => {
    if (prevSeedDir === undefined) delete process.env.SQUADCODER_SEED_DIR
    else process.env.SQUADCODER_SEED_DIR = prevSeedDir
    await fs.rm(root, { recursive: true, force: true }).catch(() => undefined)
  })

  describe("plugin merge on version bump", () => {
    test("unions new seed plugins into existing host config, preserves other keys", async () => {
      const seedDir = await makeSeed(root, {
        version: "2",
        config: {
          plugin: ["opencode-ignore@1.1.0", "@dietrichgebert/ponytail@4.8.3"],
          model_groups: { ultra: "anthropic/claude-opus-4-8" },
        },
      })
      process.env.SQUADCODER_SEED_DIR = seedDir
      // Host was seeded at v1 with an OLD plugin array (no ponytail) and a
      // user-customized key that must survive untouched.
      const host = await makeHost(root, {
        stamp: "1",
        config: {
          plugin: ["opencode-ignore@1.1.0"],
          theme: "dark",
          permission: { skill: { "*": "deny" } },
          mcp: { github: { headers: { Authorization: "Bearer ${GITHUB_TOKEN}" } } },
        },
      })

      const res = await seedDefaults(host)

      expect(res.seeded).toBe(true)
      const after = await readHostConfig(host)
      // New plugin appended, host order first, dedup.
      expect(after.plugin).toEqual(["opencode-ignore@1.1.0", "@dietrichgebert/ponytail@4.8.3"])
      // Other host keys preserved verbatim.
      expect(after.theme).toBe("dark")
      expect(after.permission).toEqual({ skill: { "*": "deny" } })
      // Env placeholder stays literal on disk (never expanded).
      expect((after.mcp as any).github.headers.Authorization).toBe("Bearer ${GITHUB_TOKEN}")
      // Seed-only keys are NOT pulled in (merge is plugin-only).
      expect(after.model_groups).toBeUndefined()
      // Stamp advanced.
      expect(await fs.readFile(path.join(host, STAMP), "utf8")).toBe("2")
    })

    test("skips write when host already has all seed plugins (nothing new)", async () => {
      const seedDir = await makeSeed(root, {
        version: "2",
        config: { plugin: ["a@1.0.0", "b@2.0.0"] },
      })
      process.env.SQUADCODER_SEED_DIR = seedDir
      const host = await makeHost(root, {
        stamp: "1",
        config: { plugin: ["a@1.0.0", "b@2.0.0", "c@3.0.0"], extra: "keep" },
      })

      const res = await seedDefaults(host)
      expect(res.seeded).toBe(true)

      const after = await readHostConfig(host)
      expect(after.plugin).toEqual(["a@1.0.0", "b@2.0.0", "c@3.0.0"])
      expect(after.extra).toBe("keep")
      // No temp files left behind.
      const leftovers = (await fs.readdir(host)).filter((f) => f.endsWith(".tmp"))
      expect(leftovers).toEqual([])
    })

    test("creates fresh squadcoder.json via copyMissing when host has none (merge is a no-op there)", async () => {
      const seedDir = await makeSeed(root, {
        version: "2",
        config: { plugin: ["@dietrichgebert/ponytail@4.8.3"] },
      })
      process.env.SQUADCODER_SEED_DIR = seedDir
      const host = await makeHost(root, { stamp: "1" }) // no squadcoder.json
      expect(existsSync(path.join(host, "squadcoder.json"))).toBe(false)

      const res = await seedDefaults(host)
      expect(res.seeded).toBe(true)

      const after = await readHostConfig(host)
      expect(after.plugin).toEqual(["@dietrichgebert/ponytail@4.8.3"])
    })

    test("malformed host squadcoder.json is a silent no-op (file untouched, stamp still advances)", async () => {
      const seedDir = await makeSeed(root, {
        version: "2",
        config: { plugin: ["@dietrichgebert/ponytail@4.8.3"] },
      })
      process.env.SQUADCODER_SEED_DIR = seedDir
      const host = await makeHost(root, { stamp: "1" })
      const broken = "{ this is not valid json "
      await fs.writeFile(path.join(host, "squadcoder.json"), broken, "utf8")

      const res = await seedDefaults(host)
      expect(res.seeded).toBe(true) // seed still ran (copyMissing + stamp); merge just no-op'd

      // Corrupt content preserved exactly — merge did not touch it.
      expect(await fs.readFile(path.join(host, "squadcoder.json"), "utf8")).toBe(broken)
      expect(await fs.readFile(path.join(host, STAMP), "utf8")).toBe("2")
    })

    test("up-to-date stamp short-circuits (no merge, no copy)", async () => {
      const seedDir = await makeSeed(root, { version: "2", config: { plugin: ["x@1"] } })
      process.env.SQUADCODER_SEED_DIR = seedDir
      const host = await makeHost(root, {
        stamp: "2",
        config: { plugin: ["old@1"] },
      })

      const res = await seedDefaults(host)
      expect(res.seeded).toBe(false)
      expect(res.reason).toBe("up-to-date")
      const after = await readHostConfig(host)
      expect(after.plugin).toEqual(["old@1"])
    })

    // --- Regression: the merge MUST target the precedence-WINNING host file. ---
    // The engine's loadGlobal merges config.json -> mimocode.json -> mimocode.jsonc
    // -> squadcoder.json -> squadcoder.jsonc (last wins; plugin arrays replace).
    // A host whose active config is squadcoder.jsonc ignores a merge written to
    // squadcoder.json — that was the live bug.

    test("(a) merges into an existing host squadcoder.JSONC, preserves comments + other keys, ${VAR} literal, does NOT touch squadcoder.json", async () => {
      const seedDir = await makeSeed(root, {
        version: "3",
        config: { plugin: ["opencode-ignore@1.1.0", "@dietrichgebert/ponytail@4.8.3"] },
      })
      process.env.SQUADCODER_SEED_DIR = seedDir
      // Host has a squadcoder.jsonc with a comment, an existing plugin, and an
      // env placeholder that must stay literal on disk.
      const host = await makeHost(root, {
        stamp: "2",
        file: "squadcoder.jsonc",
        raw: [
          "{",
          "  // my custom theme",
          '  "theme": "dark",',
          '  "plugin": ["opencode-ignore@1.1.0"],',
          '  "mcp": { "github": { "headers": { "Authorization": "Bearer ${GITHUB_TOKEN}" } } }',
          "}",
        ].join("\n"),
      })

      const res = await seedDefaults(host)
      expect(res.seeded).toBe(true)

      const onDisk = await fs.readFile(path.join(host, "squadcoder.jsonc"), "utf8")
      // (d) Comment preserved byte-for-byte.
      expect(onDisk).toContain("// my custom theme")

      const after = await readHostConfig(host, "squadcoder.jsonc")
      // New plugin appended into the .JSONC (host order first, dedup).
      expect(after.plugin).toEqual(["opencode-ignore@1.1.0", "@dietrichgebert/ponytail@4.8.3"])
      // Other host keys preserved.
      expect(after.theme).toBe("dark")
      // (d) Env placeholder stays literal on disk (never expanded).
      expect((after.mcp as any).github.headers.Authorization).toBe("Bearer ${GITHUB_TOKEN}")
      // Stamp advanced.
      expect(await fs.readFile(path.join(host, STAMP), "utf8")).toBe("3")
    })

    test("(b) precedence: when both .jsonc and .json exist, only the .jsonc is updated", async () => {
      const seedDir = await makeSeed(root, {
        version: "3",
        config: { plugin: ["@dietrichgebert/ponytail@4.8.3"] },
      })
      process.env.SQUADCODER_SEED_DIR = seedDir
      // Host has a LOWER-precedence squadcoder.json ...
      const host = await makeHost(root, {
        stamp: "2",
        file: "squadcoder.json",
        config: { plugin: ["from-json@1.0.0"], keep: "json-side" },
      })
      // ... and a HIGHER-precedence squadcoder.jsonc (wins on merge).
      await fs.writeFile(
        path.join(host, "squadcoder.jsonc"),
        ['{', '  // jsonc wins', '  "plugin": ["from-jsonc@1.0.0"]', '}'].join("\n") + "\n",
        "utf8",
      )

      // Capture the .json content BEFORE the merge so "untouched" is provable.
      const jsonBefore = await fs.readFile(path.join(host, "squadcoder.json"), "utf8")

      await seedDefaults(host)

      // The .jsonc is the one updated.
      const jsoncText = await fs.readFile(path.join(host, "squadcoder.jsonc"), "utf8")
      expect(jsoncText).toContain("// jsonc wins")
      const jsonc = await readHostConfig(host, "squadcoder.jsonc")
      expect(jsonc.plugin).toEqual(["from-jsonc@1.0.0", "@dietrichgebert/ponytail@4.8.3"])

      // The lower-precedence .json is left byte-for-byte untouched by the merge.
      const json = await readHostConfig(host, "squadcoder.json")
      expect(json.plugin).toEqual(["from-json@1.0.0"])
      expect(json.keep).toBe("json-side")
      expect(await fs.readFile(path.join(host, "squadcoder.json"), "utf8")).toBe(jsonBefore)
    })

    test("(c) existing behavior: only squadcoder.json present still works", async () => {
      const seedDir = await makeSeed(root, {
        version: "3",
        config: { plugin: ["@dietrichgebert/ponytail@4.8.3"] },
      })
      process.env.SQUADCODER_SEED_DIR = seedDir
      const host = await makeHost(root, {
        stamp: "2",
        file: "squadcoder.json",
        config: { plugin: ["existing@1.0.0"], extra: "keep" },
      })
      expect(existsSync(path.join(host, "squadcoder.jsonc"))).toBe(false)

      const res = await seedDefaults(host)
      expect(res.seeded).toBe(true)

      const after = await readHostConfig(host, "squadcoder.json")
      expect(after.plugin).toEqual(["existing@1.0.0", "@dietrichgebert/ponytail@4.8.3"])
      expect(after.extra).toBe("keep")
      // squadcoder.jsonc never created.
      expect(existsSync(path.join(host, "squadcoder.jsonc"))).toBe(false)
    })

    test("(e) malformed host squadcoder.jsonc is a silent no-op (file untouched, stamp still advances)", async () => {
      const seedDir = await makeSeed(root, {
        version: "3",
        config: { plugin: ["@dietrichgebert/ponytail@4.8.3"] },
      })
      process.env.SQUADCODER_SEED_DIR = seedDir
      const host = await makeHost(root, { stamp: "2" })
      const broken = "{ this is not valid jsonc "
      await fs.writeFile(path.join(host, "squadcoder.jsonc"), broken, "utf8")

      const res = await seedDefaults(host)
      expect(res.seeded).toBe(true) // seed ran (copyMissing + stamp); merge no-op'd

      // Corrupt content preserved exactly.
      expect(await fs.readFile(path.join(host, "squadcoder.jsonc"), "utf8")).toBe(broken)
      expect(await fs.readFile(path.join(host, STAMP), "utf8")).toBe("3")
    })
  })
})
