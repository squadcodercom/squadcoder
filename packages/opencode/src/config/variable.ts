export * as ConfigVariable from "./variable"

import path from "path"
import os from "os"
import { Filesystem } from "@/util"
import { InvalidError } from "./error"

type ParseSource =
  | {
      type: "path"
      path: string
    }
  | {
      type: "virtual"
      source: string
      dir: string
    }

type SubstituteInput = ParseSource & {
  text: string
  missing?: "error" | "empty"
}

function source(input: ParseSource) {
  return input.type === "path" ? input.path : input.source
}

function dir(input: ParseSource) {
  return input.type === "path" ? path.dirname(input.path) : input.dir
}

const ENV_BRACE = /\{env:([^}]+)\}/g
// Shell-style ${VAR}: restricted to valid env-var names so unrelated ${...} text
// (e.g. template literals, shell substitutions) is left untouched. Linear regex.
const ENV_SHELL = /\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g

/** Synchronously expand `{env:VAR}` and shell-style `${VAR}` references against
 *  `process.env`. Missing variables expand to an empty string. Used to resolve
 *  values at use-time regardless of how they entered the config (e.g.
 *  GUI-entered remote MCP headers that bypass the on-disk config loader). */
export function expandEnv(text: string) {
  return text
    .replace(ENV_BRACE, (_, varName) => process.env[varName] || "")
    .replace(ENV_SHELL, (_, varName) => process.env[varName] || "")
}

/** Apply {env:VAR}, ${VAR}, and {file:path} substitutions to config text. */
export async function substitute(input: SubstituteInput) {
  const missing = input.missing ?? "error"
  const text = expandEnv(input.text)

  const fileMatches = Array.from(text.matchAll(/\{file:[^}]+\}/g))
  if (!fileMatches.length) return text

  const configDir = dir(input)
  const configSource = source(input)
  let out = ""
  let cursor = 0

  for (const match of fileMatches) {
    const token = match[0]
    const index = match.index!
    out += text.slice(cursor, index)

    const lineStart = text.lastIndexOf("\n", index - 1) + 1
    const prefix = text.slice(lineStart, index).trimStart()
    if (prefix.startsWith("//")) {
      out += token
      cursor = index + token.length
      continue
    }

    let filePath = token.replace(/^\{file:/, "").replace(/\}$/, "")
    if (filePath.startsWith("~/")) {
      filePath = path.join(os.homedir(), filePath.slice(2))
    }

    const resolvedPath = path.isAbsolute(filePath) ? filePath : path.resolve(configDir, filePath)
    const fileContent = (
      await Filesystem.readText(resolvedPath).catch((error: NodeJS.ErrnoException) => {
        if (missing === "empty") return ""

        const errMsg = `bad file reference: "${token}"`
        if (error.code === "ENOENT") {
          throw new InvalidError(
            {
              path: configSource,
              message: errMsg + ` ${resolvedPath} does not exist`,
            },
            { cause: error },
          )
        }
        throw new InvalidError({ path: configSource, message: errMsg }, { cause: error })
      })
    ).trim()

    out += JSON.stringify(fileContent).slice(1, -1)
    cursor = index + token.length
  }

  out += text.slice(cursor)
  return out
}
