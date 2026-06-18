// SQUADCODER: rebranded wordmark (was MiMo Code / Xiaomi). Spells "MUMIN AI".
export const logoThin = {
  left: [
    "                     ",
    "                     ",
    "█▀▄▀█ █ █ █▀▄▀█ █ █▄ █",
    "█ ▀ █ █ █ █ ▀ █ █ █ ▀█",
    "▀   ▀ ▀▀▀ ▀   ▀ ▀ ▀  ▀",
  ],
  right: [
    "  SquadCoder",
    "         ",
    " █▀▀█ █",
    " █▀▀█ █",
    " ▀  ▀ ▀",
  ],
}

export const logo = logoThin

export const logos = {
  thin: logoThin,
  classic: logoThin,
} as const

export type LogoKey = keyof typeof logos

export const go = {
  left: ["    ", "█▀▀█", "█  █", "▀▀▀▀"],
  right: ["    ", "█▀▀▀", "█ __", "▀▀▀▀"],
}

export const marks = "_^~,"
