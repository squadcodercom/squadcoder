// Ambient types for bidi-js (lojjic/bidi-js@1.0.3, MIT) — ships no .d.ts.
// Only the surface SquadCoder uses (see ./bidi.ts) is declared.
declare module "bidi-js" {
  export interface EmbeddingLevels {
    levels: Uint8Array
    paragraphs: Array<{ start: number; end: number; level: number }>
  }
  export interface Bidi {
    /** explicitDirection: "ltr" | "rtl" | null (null = auto-detect base direction per paragraph). */
    getEmbeddingLevels(text: string, explicitDirection?: "ltr" | "rtl" | null): EmbeddingLevels
    getReorderSegments(
      text: string,
      embeddingLevels: EmbeddingLevels,
      start?: number,
      end?: number,
    ): Array<[number, number]>
    getReorderedString(text: string, embeddingLevels: EmbeddingLevels, start?: number, end?: number): string
    getReorderedIndices(text: string, embeddingLevels: EmbeddingLevels, start?: number, end?: number): number[]
    getMirroredCharacter(char: string): string | null
  }
  export default function bidiFactory(): Bidi
}
