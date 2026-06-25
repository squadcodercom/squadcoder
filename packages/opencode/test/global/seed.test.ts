import { describe, test, expect, beforeEach, afterEach } from "bun:test"
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
  opts: { stamp?: string; config?: Record<string, unknown> } = {},
): Promise<string> {
  const host = path.join(root, "host-" + Math.random().toString(36).slice(2))
  await fs.mkdir(host, { recursive: true })
  if (opts.config) {
    await fs.writeFile(path.join(host, "squadcoder.json"), JSON.stringify(opts.config, null, 2) + "\n")
  }
  if (opts.stamp) {
    await fs.writeFile(path.join(host, STAMP), opts.stamp, "utf8")
  }
  return host
}

async function readHostConfig(host: string): Promise<Record<string, unknown>> {
  return JSON.parse(await fs.readFile(path.join(host, "squadcoder.json"), "utf8"))
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
      const beforeStat = await fs.stat(path.join(host, "squadcoder.json"))

      const res = await seedDefaults(host)
      expect(res.seeded).toBe(true)

      const after = await readHostConfig(host)
      expect(after.plugin).toEqual(["a@1.0.0", "b@2.0.0", "c@3.0.0"])
      expect(after.extra).toBe("keep")
      // No temp files left behind.
      const leftovers = (await fs.readdir(host)).filter((f) => f.endsWith(".tmp"))
      expect(leftovers).toEqual([])
      void beforeStat
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
  })
})
