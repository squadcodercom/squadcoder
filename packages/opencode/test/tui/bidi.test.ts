import { describe, expect, test } from "bun:test"
import { hasRtl, visualWidth, reorderLine, reorderForTerminal } from "../../src/cli/cmd/tui/i18n/bidi"

describe("tui bidi", () => {
  test("hasRtl detects Hebrew, not Latin", () => {
    expect(hasRtl("שלום")).toBe(true)
    expect(hasRtl("hello world")).toBe(false)
    expect(hasRtl("commit שלום")).toBe(true)
    expect(hasRtl("")).toBe(false)
  })

  test("pure Latin is returned unchanged", () => {
    expect(reorderLine("hello world")).toBe("hello world")
    expect(reorderForTerminal("plain ascii", 40)).toBe("plain ascii")
  })

  test("pure Hebrew reverses to visual order for a L2R terminal", () => {
    // logical ש-ל-ו-ם  ->  visual ם-ו-ל-ש
    expect(reorderLine("שלום")).toBe("םולש")
  })

  test("embedded LTR run stays intact (readable) inside RTL", () => {
    const out = reorderLine("שלום world")
    // the English word must survive un-reversed somewhere in the visual line
    expect(out.includes("world")).toBe(true)
    // and the Hebrew must be reordered (not the original logical order)
    expect(out).not.toBe("שלום world")
  })

  test("numbers/paths inside Hebrew stay LTR", () => {
    const out = reorderLine("הקובץ src/index.ts בשורה 42")
    expect(out.includes("src/index.ts")).toBe(true)
    expect(out.includes("42")).toBe(true)
  })

  test("visualWidth ignores zero-width nikud", () => {
    // שָׁלוֹם has 4 base letters + nikud marks; width should be 4
    expect(visualWidth("שָׁלוֹם")).toBe(4)
    expect(visualWidth("abc")).toBe(3)
  })

  test("reorderForTerminal right-aligns within width", () => {
    const w = 10
    const out = reorderForTerminal("שלום", w)
    expect(out.startsWith(" ")).toBe(true) // left-padded => right-aligned
    expect(visualWidth(out)).toBe(w)
    expect(out.endsWith("םולש")).toBe(true)
  })

  test("reorderForTerminal wraps long lines then reorders each", () => {
    const out = reorderForTerminal("שלום עולם זה טקסט ארוך מאוד בעברית", 12)
    const lines = out.split("\n")
    expect(lines.length).toBeGreaterThan(1)
    for (const l of lines) expect(visualWidth(l)).toBeLessThanOrEqual(12)
  })
})
