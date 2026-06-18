// SQUADCODER — Hebrew/RTL terminal display helper.
//
// A terminal is a fixed left-to-right cell grid with no bidi: to show RTL text we must
// hand it the text ALREADY in visual order. This reorders logical-order strings to visual
// order via the Unicode Bidirectional Algorithm (bidi-js, UAX#9), so embedded LTR runs
// (code, paths, URLs, numbers) stay readable inside Hebrew. Display-only — input stays LTR.
// Hebrew needs no glyph shaping (unlike Arabic), so reordering is sufficient.
//
// Gated by the caller on Hebrew locale so non-Hebrew users are byte-for-byte unaffected.
// Known caveat: width/wrap is approximate near boundaries and for nikud; see TUI RTL notes.
import bidiFactory from "bidi-js"

const bidi = bidiFactory()

// Strong RTL ranges: Hebrew (incl. presentation forms) + Arabic (defensive). \u escapes only.
const RTL_RE = /[֐-׿؀-ۿ܀-ݏיִ-﷿ﹰ-﻿]/
// Combining marks (Hebrew nikud/cantillation + general) — zero terminal width.
const COMBINING_RE = /[̀-֑ͯ-ׇֽֿׁׂׅׄؐ-ًؚ-ٰٟۖ-ۜ۟-۪ۤۧۨ-ۭ]/
// Invisible bidi control/override/isolate chars: LRM/RLM (200E/200F), LRE/RLE/PDF/LRO/RLO
// (202A-202E), LRI/RLI/FSI/PDI (2066-2069). Stripped from PASTED content to defend against
// Trojan-Source-style hidden reordering — they never legitimately appear in pasted code/prose
// for this tool (display direction is handled by reorderForTerminal, not embedded controls).
const BIDI_CONTROLS_RE = /[‎‏‪-‮⁦-⁩]/g

/** Does the string contain any strong RTL (Hebrew/Arabic) character? */
export function hasRtl(s: string): boolean {
  return !!s && RTL_RE.test(s)
}

/** Remove invisible bidi control/override chars (Trojan-Source defense). Closes deferred #182. */
export function stripBidiControls(s: string): string {
  return s.replace(BIDI_CONTROLS_RE, "")
}

/** Approximate terminal column width of a string (code points minus zero-width combining marks). */
export function visualWidth(s: string): number {
  let w = 0
  for (const ch of s) {
    if (COMBINING_RE.test(ch)) continue
    w += 1
  }
  return w
}

/**
 * Reorder ONE line (no newlines) from logical to visual order. Base direction is "auto"
 * (by first strong char, like CSS unicode-bidi:plaintext / dir=auto). LTR runs are kept
 * intact by the algorithm. Returns the string unchanged when there is no RTL content.
 */
export function reorderLine(line: string): string {
  if (!hasRtl(line)) return line
  // bidi-js: null explicit direction = auto-detect base direction per paragraph.
  const levels = bidi.getEmbeddingLevels(line, null)
  return bidi.getReorderedString(line, levels)
}

/** Pad a (already-visual) line on the LEFT to right-align it within `width` columns. */
function rightAlign(visual: string, width: number): string {
  const pad = width - visualWidth(visual)
  return pad > 0 ? " ".repeat(pad) + visual : visual
}

/** Greedy word-wrap in LOGICAL order at `width` columns (bidi requires wrap-then-reorder). */
function wrapLogical(line: string, width: number): string[] {
  if (width <= 0 || visualWidth(line) <= width) return [line]
  const out: string[] = []
  let cur = ""
  for (const word of line.split(/(\s+)/)) {
    if (visualWidth(cur) + visualWidth(word) > width && cur.trim() !== "") {
      out.push(cur.replace(/\s+$/, ""))
      cur = word.replace(/^\s+/, "")
    } else {
      cur += word
    }
  }
  if (cur.trim() !== "" || out.length === 0) out.push(cur.replace(/\s+$/, ""))
  return out
}

/**
 * Full pipeline for a block of text: wrap (logical) -> reorder each line (visual) -> right-align.
 * `width` is the available content width in columns. When `rightAlignment` is false, the visual
 * lines are left as-is (no padding). No-op (returns input) when the text has no RTL content.
 */
export function reorderForTerminal(text: string, width: number, rightAlignment = true): string {
  if (!hasRtl(text)) return text
  const out: string[] = []
  for (const logicalLine of text.split("\n")) {
    const wrapped = width > 0 ? wrapLogical(logicalLine, width) : [logicalLine]
    for (const w of wrapped) {
      const visual = reorderLine(w)
      out.push(rightAlignment && width > 0 ? rightAlign(visual, width) : visual)
    }
  }
  return out.join("\n")
}
