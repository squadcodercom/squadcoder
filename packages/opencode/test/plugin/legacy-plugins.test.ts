import { describe, expect, test } from "bun:test"
import fs from "fs"
import { getLegacyPlugins } from "../../src/plugin"

// Regression for the @dietrichgebert/ponytail load failure.
// Ponytail ships a bare-function `default` (the real plugin) alongside a named
// helper export (`parseCommandFile`). The legacy scanner used to invoke EVERY
// function export as a plugin, so the helper ran `fs.readFileSync(pluginContextObject)`
// and threw "The 'path' argument must be of type string... Received an instance of Object",
// aborting the whole load. The fix: when `default` is itself a server plugin, use only it.
describe("getLegacyPlugins", () => {
  test("bare-function default with a named helper yields ONLY the default (ponytail shape)", () => {
    let helperInvoked = false
    const realPlugin = async () => ({ async event() {} })
    // Mirrors ponytail's `parseCommandFile(filePath)` — would throw if handed the
    // plugin-context object instead of a path string.
    const parseCommandFile = (filePath: string) => {
      helperInvoked = true
      return fs.readFileSync(filePath, "utf8")
    }

    const mod = { default: realPlugin, parseCommandFile }

    const plugins = getLegacyPlugins(mod)

    expect(plugins).toHaveLength(1)
    expect(plugins[0]).toBe(realPlugin)
    // The helper must not be collected (and therefore never invoked) as a plugin.
    expect(helperInvoked).toBe(false)
  })

  test("module with no default and named plugin export(s) still scans named exports", () => {
    const pluginA = async () => ({ async event() {} })
    const pluginB = async () => ({ async event() {} })
    const mod = { pluginA, pluginB }

    const plugins = getLegacyPlugins(mod)

    expect(plugins).toHaveLength(2)
    expect(plugins).toContain(pluginA)
    expect(plugins).toContain(pluginB)
  })

  test("guard does not short-circuit when default is absent (named scan runs)", () => {
    // No `default` key at all -> getServerPlugin(undefined) is falsy -> loop runs.
    const only = async () => ({ async event() {} })
    const mod = { only }

    const plugins = getLegacyPlugins(mod)

    expect(plugins).toEqual([only])
  })

  test("throws when a module has no usable plugin export", () => {
    // No default, and a named export that isn't a function.
    expect(() => getLegacyPlugins({ notAPlugin: { foo: 1 } })).toThrow(TypeError)
  })
})
