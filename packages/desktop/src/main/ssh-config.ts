// SQUADCODER — read & parse the user's ~/.ssh/config so the "Add remote" flow can offer their
// already-configured hosts (e.g. "Relay") to import instead of retyping host/user/key/port.
// Pure parse split out for unit testing; readSshConfig() does the file IO in the Electron main.

import { readFileSync } from "node:fs"
import { homedir } from "node:os"
import { join } from "node:path"

export interface SshConfigHost {
  /** The `Host` alias (what the user types as the target). */
  host: string
  /** `HostName` — the real address, if different from the alias. */
  hostName?: string
  user?: string
  port?: number
  /** `IdentityFile`, ~ expanded to the home dir. */
  identityFile?: string
}

const expandHome = (p: string): string => (/^~(?=$|[/\\])/.test(p) ? p.replace(/^~/, homedir()) : p)

/** Parse ~/.ssh/config text into concrete, importable hosts (wildcards like `Host *` are skipped). */
export function parseSshConfigText(text: string): SshConfigHost[] {
  const hosts: SshConfigHost[] = []
  let current: SshConfigHost | undefined

  const flush = () => {
    if (current && current.host) hosts.push(current)
    current = undefined
  }

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || line.startsWith("#")) continue
    // `Key value` or `Key=value`
    const m = line.match(/^(\S+?)[=\s]+(.+)$/)
    if (!m) continue
    const key = m[1].toLowerCase()
    const value = m[2].trim()

    if (key === "host") {
      flush()
      // a Host line may list several patterns; take the first concrete (non-wildcard) alias
      const alias = value.split(/\s+/).find((a) => a && !a.includes("*") && !a.includes("?"))
      current = alias ? { host: alias } : undefined
    } else if (current) {
      if (key === "hostname") current.hostName = value
      else if (key === "user") current.user = value
      else if (key === "port") {
        const p = Number(value)
        if (Number.isFinite(p) && p > 0) current.port = p
      } else if (key === "identityfile") current.identityFile = expandHome(value)
    }
  }
  flush()
  return hosts.filter((h) => h.host)
}

/** Read + parse ~/.ssh/config. Returns [] if it doesn't exist or can't be read. */
export function readSshConfig(): SshConfigHost[] {
  try {
    return parseSshConfigText(readFileSync(join(homedir(), ".ssh", "config"), "utf8"))
  } catch {
    return []
  }
}
