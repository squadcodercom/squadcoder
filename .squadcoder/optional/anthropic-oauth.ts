/**
 * SquadCoder — OPTIONAL Claude Pro/Max subscription login (opt-in, at your own risk).
 *
 * ⚠️  Anthropic's Terms of Service prohibit using subscription (Pro/Max) OAuth tokens outside
 *     official clients, and Anthropic actively blocks third-party use (it legally forced this
 *     exact feature out of opencode in 2026). This plugin may stop working at any time and could
 *     put your account at risk. Prefer a BYOK API key or OpenRouter for anything important.
 *
 * This is NOT enabled by default — it lives in `.squadcoder/optional/`, which the plugin loader
 * does NOT auto-scan (only a `plugin(s)/` folder is auto-loaded). To enable, add to
 * `.squadcoder/squadcoder.json`:
 *     "plugin": [".squadcoder/optional/anthropic-oauth.ts"]
 *
 * Design (safest variant — credential reuse, no middleman): instead of re-implementing
 * Anthropic's OAuth dance, we reuse the token that Claude Code already stores and manages
 * (Claude Code itself refreshes it). Pattern based on the MIT, local-only
 * `griffinmartin/opencode-claude-auth`. Token never leaves the machine.
 *
 * NOTE: the exact request headers/beta flag used against the Messages API are reverse-engineered
 * and may change; confirm against the reference above if requests are rejected.
 */
import os from "os"
import path from "path"
import fs from "fs/promises"
import type { Plugin, PluginModule } from "@mimo-ai/plugin"

type ClaudeCredentials = {
  claudeAiOauth?: { accessToken?: string; refreshToken?: string; expiresAt?: number }
  // some versions store a flat shape:
  access_token?: string
  refresh_token?: string
  expires_at?: number
}

const WARNING =
  "⚠️ Community workaround — Anthropic ToS prohibits subscription tokens in third-party tools and may revoke access. Use at your own risk."

async function readClaudeCodeCredentials(): Promise<{
  access: string
  refresh?: string
  expires?: number
} | null> {
  // Linux/Windows: ~/.claude/.credentials.json  (macOS commonly uses Keychain — not handled here)
  const file = path.join(os.homedir(), ".claude", ".credentials.json")
  const raw = await fs.readFile(file, "utf8").catch(() => null)
  if (!raw) return null
  const parsed = JSON.parse(raw) as ClaudeCredentials
  const oauth = parsed.claudeAiOauth
  const access = oauth?.accessToken ?? parsed.access_token
  if (!access) return null
  return {
    access,
    refresh: oauth?.refreshToken ?? parsed.refresh_token,
    expires: oauth?.expiresAt ?? parsed.expires_at,
  }
}

const server: Plugin = async () => ({
  auth: {
    provider: "anthropic",
    // Only inject the OAuth bearer when the stored auth is our oauth type — never interfere
    // with normal API-key (x-api-key) auth.
    loader: async (getAuth) => {
      const auth = await getAuth().catch(() => undefined)
      if (!auth || auth.type !== "oauth") return {}
      const creds = await readClaudeCodeCredentials()
      const access = creds?.access ?? (auth as { access?: string }).access
      if (!access) return {}
      // Use the subscription OAuth token as a bearer (instead of x-api-key).
      return {
        apiKey: "",
        headers: {
          authorization: `Bearer ${access}`,
          // reverse-engineered beta flag — confirm against the reference if rejected:
          "anthropic-beta": "oauth-2025-04-20",
        },
      }
    },
    methods: [
      {
        type: "oauth",
        label: `Login with Claude Pro/Max (subscription) — ${WARNING}`,
        authorize: async () => {
          const creds = await readClaudeCodeCredentials()
          if (!creds) {
            return {
              url: "https://claude.ai/login",
              instructions:
                "Log in with the official Claude Code CLI first (`claude` → /login), then retry. " +
                "On macOS the token lives in Keychain and isn't read by this plugin yet.",
              method: "auto",
              callback: async () => ({ type: "failed" }),
            }
          }
          return {
            url: "https://claude.ai",
            instructions: `Reusing your existing Claude Code subscription token. ${WARNING}`,
            method: "auto",
            callback: async () => ({
              type: "success" as const,
              refresh: creds.refresh ?? "",
              access: creds.access,
              expires: creds.expires ?? 0,
            }),
          }
        },
      },
    ],
  },
})

export const id = "squadcoder-anthropic-oauth"
export { server }
export default { id, server } satisfies PluginModule
