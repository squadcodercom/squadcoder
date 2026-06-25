import { describe, test, expect } from "bun:test"
// Cheap, side-effect-free imports: both are plain `string[]` exports. seed.ts
// has no Effect/runtime deps; config.ts's GLOBAL_CONFIG_FILENAMES is a plain
// array literal evaluated at module load. We do NOT touch any config service,
// so the Effect/Auth/Instance machinery in config.ts never runs here.
import { GLOBAL_HOST_CANDIDATES } from "../../src/global/seed"
import { GLOBAL_CONFIG_FILENAMES } from "../../src/config/config"

// LOCKSTEP GUARD (CTO-mandated):
// seed.ts writes the upgrade plugin-merge into the precedence-WINNING host
// config file it discovers via GLOBAL_HOST_CANDIDATES. config.ts globalConfigFile()
// discovers the file the engine actually LOADS via GLOBAL_CONFIG_FILENAMES. If
// these two arrays drift (order OR elements), the seed would write into a file
// the loader ignores — re-introducing the exact bug the seed fix repaired.
// This test fails CI on any drift. The two arrays are intentionally NOT shared
// (no import cycle, per CTO); this guard is the contract.
describe("global config candidate filenames — seed ↔ loader lockstep", () => {
  test("GLOBAL_HOST_CANDIDATES (seed) deep-equals GLOBAL_CONFIG_FILENAMES (loader)", () => {
    expect(GLOBAL_HOST_CANDIDATES).toEqual(GLOBAL_CONFIG_FILENAMES)
  })

  test("candidate order is squadcoder-first, config.json last (precedence contract)", () => {
    // First-existing-wins, so the brand-new file must come first and the
    // legacy fallback last. Pinning the exact order catches a silent reorder.
    expect(GLOBAL_HOST_CANDIDATES).toEqual([
      "squadcoder.jsonc",
      "squadcoder.json",
      "mimocode.jsonc",
      "mimocode.json",
      "config.json",
    ])
    expect(GLOBAL_CONFIG_FILENAMES).toEqual([
      "squadcoder.jsonc",
      "squadcoder.json",
      "mimocode.jsonc",
      "mimocode.json",
      "config.json",
    ])
  })

  test("same length (no silent add/drop on one side only)", () => {
    expect(GLOBAL_HOST_CANDIDATES.length).toBe(GLOBAL_CONFIG_FILENAMES.length)
  })
})
