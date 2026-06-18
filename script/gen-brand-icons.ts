// SQUADCODER: generate all brand icons/favicons/banner from assets/brand/*.svg
// Run: bun run script/gen-brand-icons.ts
import { promises as fs } from "fs"
import path from "path"
import { createRequire } from "module"

const ROOT = path.resolve(import.meta.dir, "..")
// sharp is a transitive dep (not declared by any package), so resolve it from the bun store.
const require = createRequire(import.meta.url)
const bunStore = path.join(ROOT, "node_modules", ".bun")
const sharpDir = (await fs.readdir(bunStore)).find((d) => d.startsWith("sharp@"))
if (!sharpDir) throw new Error("sharp not found in node_modules/.bun")
const sharp = require(path.join(bunStore, sharpDir, "node_modules", "sharp")) as typeof import("sharp")
const BRAND = path.join(ROOT, "assets", "brand")
const iconSvg = await fs.readFile(path.join(BRAND, "squadcoder-icon.svg"))
const bannerSvg = await fs.readFile(path.join(BRAND, "squadcoder-banner.svg"))

const png = (size: number) =>
  sharp(iconSvg, { density: 384 }).resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer()

// Assemble a Windows .ico from PNG-compressed entries (Vista+ supports embedded PNG).
function buildIco(entries: { size: number; data: Buffer }[]): Buffer {
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2) // type = icon
  header.writeUInt16LE(entries.length, 4)
  const dir = Buffer.alloc(16 * entries.length)
  let offset = 6 + 16 * entries.length
  const bodies: Buffer[] = []
  entries.forEach((e, i) => {
    const d = dir.subarray(i * 16, i * 16 + 16)
    d.writeUInt8(e.size >= 256 ? 0 : e.size, 0) // width (0 => 256)
    d.writeUInt8(e.size >= 256 ? 0 : e.size, 1) // height
    d.writeUInt8(0, 2) // palette
    d.writeUInt8(0, 3) // reserved
    d.writeUInt16LE(1, 4) // planes
    d.writeUInt16LE(32, 6) // bpp
    d.writeUInt32LE(e.data.length, 8)
    d.writeUInt32LE(offset, 12)
    offset += e.data.length
    bodies.push(e.data)
  })
  return Buffer.concat([header, dir, ...bodies])
}

async function ico(): Promise<Buffer> {
  const sizes = [16, 32, 48, 256]
  const entries = await Promise.all(sizes.map(async (s) => ({ size: s, data: await png(s) })))
  return buildIco(entries)
}

async function write(p: string, data: Buffer) {
  await fs.mkdir(path.dirname(p), { recursive: true })
  await fs.writeFile(p, data)
  console.log("wrote", path.relative(ROOT, p))
}

const ICO = await ico()
const PNG1024 = await png(1024)
const PNG512 = await png(512)
const PNG180 = await png(180)
const PNG96 = await png(96)
const banner = await sharp(bannerSvg, { density: 192 }).png().toBuffer()

// Desktop app icons (electron-builder uses icon.ico on Windows, icon.png on Linux)
await write(path.join(ROOT, "packages/desktop/resources/icons/icon.png"), PNG1024)
await write(path.join(ROOT, "packages/desktop/resources/icons/icon.ico"), ICO)

// Web + app favicons (cover both base and -v3 names the HTML may reference)
for (const base of ["packages/app/public", "packages/web/public"]) {
  await write(path.join(ROOT, base, "favicon.ico"), ICO)
  await write(path.join(ROOT, base, "favicon-v3.ico"), ICO)
  await write(path.join(ROOT, base, "favicon-96x96.png"), PNG96)
  await write(path.join(ROOT, base, "favicon-96x96-v3.png"), PNG96)
  await write(path.join(ROOT, base, "apple-touch-icon.png"), PNG180)
  await write(path.join(ROOT, base, "apple-touch-icon-v3.png"), PNG180)
  await write(path.join(ROOT, base, "favicon.svg"), iconSvg)
  await write(path.join(ROOT, base, "favicon-v3.svg"), iconSvg)
}

// README banner (keep legacy filename so existing README markdown still resolves) + branded copy
await write(path.join(ROOT, "assets/readme/mimocode-banner.png"), banner)
await write(path.join(ROOT, "assets/brand/squadcoder-banner.png"), banner)
await write(path.join(ROOT, "packages/desktop/resources/icons/icon-512.png"), PNG512)

// Desktop channel SOURCE icons: packages/desktop/scripts/copy-icons.ts copies
// packages/desktop/icons/<channel>/ into resources/icons at build time, so the SOURCE must be
// branded or the build reverts to opencode. (icon.icns kept as-is — regenerate for mac builds.)
const channelSizes: Record<string, number> = {
  "icon.png": 1024,
  "dock.png": 512,
  "32x32.png": 32,
  "64x64.png": 64,
  "128x128.png": 128,
  "128x128@2x.png": 256,
  "StoreLogo.png": 50,
  "Square30x30Logo.png": 30,
  "Square44x44Logo.png": 44,
  "Square71x71Logo.png": 71,
  "Square89x89Logo.png": 89,
  "Square107x107Logo.png": 107,
  "Square142x142Logo.png": 142,
  "Square150x150Logo.png": 150,
  "Square284x284Logo.png": 284,
  "Square310x310Logo.png": 310,
}
for (const ch of ["dev", "beta", "prod"]) {
  const dir = path.join(ROOT, "packages/desktop/icons", ch)
  try {
    await fs.access(dir)
  } catch {
    continue
  }
  await write(path.join(dir, "icon.ico"), ICO)
  for (const [name, size] of Object.entries(channelSizes)) {
    await write(path.join(dir, name), await png(size))
  }
}

console.log("done — SquadCoder brand assets generated")
