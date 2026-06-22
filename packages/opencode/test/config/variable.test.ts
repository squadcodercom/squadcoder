import { test, expect, describe, afterEach } from "bun:test"
import { expandEnv, substitute } from "../../src/config/variable"

const TOKEN = "MuminAI_test_token_value"
const SHARED = "shared_value"

describe("ConfigVariable.expandEnv", () => {
  afterEach(() => {
    delete process.env.MUMIN_TEST_TOKEN
    delete process.env.MUMIN_TEST_SHARED
  })

  test("resolves shell-style ${VAR} from process.env", () => {
    process.env.MUMIN_TEST_TOKEN = TOKEN
    expect(expandEnv("Bearer ${MUMIN_TEST_TOKEN}")).toBe(`Bearer ${TOKEN}`)
  })

  test("resolves brace-style {env:VAR} from process.env", () => {
    process.env.MUMIN_TEST_TOKEN = TOKEN
    expect(expandEnv("Bearer {env:MUMIN_TEST_TOKEN}")).toBe(`Bearer ${TOKEN}`)
  })

  test("${VAR} and {env:VAR} resolve identically", () => {
    process.env.MUMIN_TEST_SHARED = SHARED
    expect(expandEnv("v=${MUMIN_TEST_SHARED}")).toBe(expandEnv("v={env:MUMIN_TEST_SHARED}"))
  })

  test("expands multiple tokens of both syntaxes in one string", () => {
    process.env.MUMIN_TEST_TOKEN = TOKEN
    process.env.MUMIN_TEST_SHARED = SHARED
    expect(expandEnv("${MUMIN_TEST_TOKEN} {env:MUMIN_TEST_SHARED}")).toBe(`${TOKEN} ${SHARED}`)
  })

  test("missing variable expands to empty string (both syntaxes)", () => {
    expect(expandEnv("Bearer ${MUMIN_TEST_TOKEN}")).toBe("Bearer ")
    expect(expandEnv("Bearer {env:MUMIN_TEST_TOKEN}")).toBe("Bearer ")
  })

  test("leaves invalid ${...} names untouched (not a valid env-var identifier)", () => {
    expect(expandEnv("${1abc}")).toBe("${1abc}")
    expect(expandEnv("${FOO-BAR}")).toBe("${FOO-BAR}")
    expect(expandEnv("${ two words }")).toBe("${ two words }")
  })

  test("returns input unchanged when no tokens are present", () => {
    expect(expandEnv("plain text")).toBe("plain text")
    expect(expandEnv("")).toBe("")
  })
})

describe("ConfigVariable.substitute", () => {
  afterEach(() => {
    delete process.env.MUMIN_TEST_TOKEN
  })

  test("substitute() applies both {env:VAR} and ${VAR} (no file refs)", async () => {
    process.env.MUMIN_TEST_TOKEN = TOKEN
    const text = '{"auth": "Bearer ${MUMIN_TEST_TOKEN}", "legacy": "{env:MUMIN_TEST_TOKEN}"}'
    const result = await substitute({ text, type: "virtual", source: "test", dir: "." })
    expect(result).toBe(`{"auth": "Bearer ${TOKEN}", "legacy": "${TOKEN}"}`)
  })
})
