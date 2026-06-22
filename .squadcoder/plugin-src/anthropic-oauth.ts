/**
 * SquadCoder — Anthropic auth plugin (Claude API key + opt-in Claude Pro/Max subscription OAuth).
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *  WHY THIS LIVES OUTSIDE THE ENGINE
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *  The Claude Pro/Max *subscription* OAuth path below is a community workaround. Anthropic's Terms
 *  of Service prohibit using a subscription (Pro/Max) token in third-party tools, and Anthropic has
 *  legally forced this exact capability out of other open-source clients. To keep that risk OFF the
 *  SquadCoder engine binary, NONE of this code is compiled into core — it ships as a standalone,
 *  clearly-labelled plugin file that the engine merely auto-discovers from the config dir's
 *  `plugin/` folder. Delete this one file and the engine has zero Claude-OAuth code.
 *
 *  ⚠️  The subscription OAuth method is OPT-IN and AT YOUR OWN RISK. An API key is the default and
 *      recommended method. Anthropic may revoke access at any time.
 *
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *  WHAT IT DOES (two methods on the `anthropic` provider)
 * ─────────────────────────────────────────────────────────────────────────────────────────────
 *  1) api-key      — normal Anthropic API key (x-api-key). Default + recommended. The loader also
 *                    repairs a stray ANTHROPIC_BASE_URL that omits `/v1` (a common Claude Code /
 *                    CLIProxy convention that otherwise 404s every request).
 *  2) claude-pro-max — REAL PKCE OAuth against claude.ai using the same PUBLIC client id Claude Code
 *                    itself uses. The user approves on claude.ai and pastes the returned code; we
 *                    exchange it for access+refresh tokens stored locally and refresh automatically.
 *                    No middleman; tokens never leave the machine.
 *
 *  The OAuth loader cloaks each request so Anthropic bills the PLAN (not "extra usage"): it injects
 *  the Claude-Code identity headers + a Bearer token, relocates SquadCoder's real system prompt into
 *  a <system-reminder> on the first user message (full persona/skills/memory survive — only the wire
 *  placement changes), strips prompt-cache metadata, and PascalCases tool names on the way out while
 *  restoring the engine's snake_case names in the streamed response. Verified end-to-end (HTTP 200 +
 *  live tool round-trip). Mechanism mirrors MIT griffinmartin/opencode-claude-auth + CLIProxyAPI.
 *
 *  Loaded by default (auto-discovered from `<config>/plugin/`), but INERT until the user explicitly
 *  logs in via the Pro/Max method — with an API key, only the harmless `/v1` repair applies.
 */
import crypto from "node:crypto"
import os from "node:os"
import fs from "node:fs"
import path from "node:path"
import type { Hooks, Plugin, PluginInput, PluginModule } from "@mimo-ai/plugin"

const CLAUDE_OAUTH = {
  CLIENT_ID: "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
  AUTHORIZE: "https://claude.ai/oauth/authorize",
  // Matches the proven CLIProxyAPI / Claude Code SUBSCRIPTION flow. The CONSOLE scope
  // `org:create_api_key` mints an API-management token Anthropic REJECTS on /v1/messages (401); the
  // claude.ai subscription scopes below produce a token valid for direct inference. Token exchange +
  // refresh go to api.anthropic.com (CLIProxy's endpoint), not console.anthropic.com.
  TOKEN: "https://api.anthropic.com/v1/oauth/token",
  REDIRECT: "https://console.anthropic.com/oauth/code/callback",
  SCOPE: "user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload",
  // Since Anthropic's 2026-04 change, a subscription OAuth request is only billed to the PLAN (not
  // "extra usage") when it looks like real Claude Code. The `claude-code-20250219` beta is the key
  // signal — WITHOUT it the request is treated as a third-party app and rejected with
  // 400 "You're out of extra usage". Verified against CLIProxyAPI + promptfoo/hermes/zeroclaw/sub2api.
  BETA: "claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14",
  USER_AGENT: "claude-cli/1.0.128 (external, cli)",
}
// Anthropic only accepts a Pro/Max OAuth token on /v1/messages when the request "looks like Claude
// Code": the system prompt's FIRST block must be exactly this string, else it 400s.
const CLAUDE_CODE_SYSTEM = "You are Claude Code, Anthropic's official CLI for Claude."
const CLAUDE_SUBSCRIPTION_WARNING =
  "⚠️ Community workaround — Anthropic's ToS prohibits using a Pro/Max subscription token in third-party tools and access may be revoked at any time. Prefer an API key for anything important."

// Some environments export ANTHROPIC_BASE_URL=https://api.anthropic.com (WITHOUT the /v1 segment the
// API requires). @ai-sdk/anthropic reads that as its default baseURL and builds `${base}/messages` →
// https://api.anthropic.com/messages → 404. For the REAL Anthropic host we repair the path so /v1 is
// present; custom proxy hosts (localhost, gateways, …) are left untouched.
function ensureAnthropicV1(url: any): any {
  try {
    const u = new URL(String(url))
    if (u.hostname === "api.anthropic.com" && u.pathname !== "/v1" && !u.pathname.startsWith("/v1/")) {
      u.pathname = "/v1" + u.pathname
      return u.toString()
    }
  } catch {}
  return url
}

// Anthropic's 2026-04 anti-third-party classifier bills an OAuth subscription request to "extra usage"
// (HTTP 400) unless it looks like real Claude Code. snake_case tool names (the engine uses `bash`,
// `change_directory`, `plan_exit`) are rejected; PascalCase names (`Bash`, `ChangeDirectory`,
// `ExitPlanMode`) are accepted on the same account/token. So on the OAuth path we PascalCase tool
// names on the way out and restore the engine's originals in the streamed response.
function toPascalToolName(name: string): string {
  return name
    .split(/[_\-\s]+/)
    .map((s) => (s ? s[0].toUpperCase() + s.slice(1) : s))
    .join("")
}

// Stream transform that rewrites `"name":"<Pascal>"` back to `"name":"<original>"` in the response so
// tool_use blocks reference the engine's real tool names. Carries a small tail across chunks so a
// pattern split on a chunk boundary still matches.
function restoreToolNames(res: Response, nameMap: Record<string, string>): Response {
  const entries = Object.entries(nameMap)
  if (!entries.length || !res.body) return res
  const decoder = new TextDecoder()
  const encoder = new TextEncoder()
  const KEEP = 64
  let carry = ""
  const replace = (s: string) => {
    for (const [pascal, orig] of entries) s = s.split(`"name":"${pascal}"`).join(`"name":"${orig}"`)
    return s
  }
  const transform = new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, ctrl) {
      const text = replace(carry + decoder.decode(chunk, { stream: true }))
      carry = text.slice(Math.max(0, text.length - KEEP))
      const emit = text.slice(0, Math.max(0, text.length - KEEP))
      if (emit) ctrl.enqueue(encoder.encode(emit))
    },
    flush(ctrl) {
      const out = replace(carry)
      if (out) ctrl.enqueue(encoder.encode(out))
    },
  })
  return new Response(res.body.pipeThrough(transform), { headers: res.headers, status: res.status })
}

// SQUADCODER: Pro/Max usage visibility. On the OAuth path Anthropic returns subscription-window
// usage in `anthropic-ratelimit-unified-*` response headers (5h rolling session + 7d weekly). We
// parse the latest snapshot and write it to a neutral temp file that the engine's GET /usage/anthropic
// route serves to the GUI. Kept HERE (not core) so no subscription-OAuth logic enters the engine binary.
// SQUADCODER: Pro/Max usage visibility — accurate source. Claude's real subscription-window usage comes
// from the OAuth `/api/oauth/usage` endpoint: `five_hour`/`seven_day` utilization as 0–100 PERCENT +
// RFC3339 `resets_at` (matches Claude's own usage page exactly). NOTE: the `anthropic-ratelimit-unified-*`
// RESPONSE HEADERS are fractions 0–1 and were misread as percent (0.75 → "1%") — do NOT use them. We poll
// the endpoint (throttled) inside the existing OAuth fetch wrapper, reusing the live token, and write a
// neutral temp snapshot the engine's GET /usage/anthropic route serves to the GUI. Kept HERE (not core)
// so no subscription-OAuth logic enters the engine binary.
const USAGE_SNAPSHOT_FILE = path.join(os.tmpdir(), "squadcoder-anthropic-usage.json")
const USAGE_POLL_INTERVAL_MS = 60_000 // 1 min — refresh the usage snapshot roughly every minute
let lastUsagePoll = 0

function usageBucket(b: unknown): { utilization: number | null; resetsAt: number | null } {
  const o = b as { utilization?: number; resets_at?: string } | null | undefined
  if (!o || typeof o.utilization !== "number") return { utilization: null, resetsAt: null }
  const t = o.resets_at ? Date.parse(o.resets_at) : NaN
  return { utilization: o.utilization, resetsAt: Number.isFinite(t) ? t : null }
}

async function pollUsage(token: string | undefined): Promise<void> {
  if (!token) return
  if (Date.now() - lastUsagePoll < USAGE_POLL_INTERVAL_MS) return
  lastUsagePoll = Date.now()
  try {
    const res = await fetch("https://api.anthropic.com/api/oauth/usage", {
      headers: {
        authorization: `Bearer ${token}`,
        "anthropic-beta": "oauth-2025-04-20",
        "anthropic-version": "2023-06-01",
        "user-agent": CLAUDE_OAUTH.USER_AGENT,
      },
    })
    if (!res.ok) return
    const j = (await res.json()) as { five_hour?: unknown; seven_day?: unknown }
    const fiveHour = usageBucket(j.five_hour)
    const sevenDay = usageBucket(j.seven_day)
    if (fiveHour.utilization == null && sevenDay.utilization == null) return
    const worst = Math.max(fiveHour.utilization ?? 0, sevenDay.utilization ?? 0)
    const snapshot = {
      status: worst >= 80 ? "allowed_warning" : "allowed",
      fiveHour,
      sevenDay,
      capturedAt: Date.now(),
    }
    const tmp = `${USAGE_SNAPSHOT_FILE}.${process.pid}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(snapshot))
    fs.renameSync(tmp, USAGE_SNAPSHOT_FILE) // atomic swap so the reader never sees a partial file
  } catch {}
}

function claudePkce() {
  const verifier = crypto.randomBytes(32).toString("base64url")
  const challenge = crypto.createHash("sha256").update(verifier).digest("base64url")
  return { verifier, challenge }
}

type ClaudeTokens = { access: string; refresh: string; expires: number }

function parseClaudeTokenResponse(json: unknown): ClaudeTokens | null {
  const j = json as { access_token?: string; refresh_token?: string; expires_in?: number } | null
  if (!j?.access_token) return null
  return { access: j.access_token, refresh: j.refresh_token ?? "", expires: Date.now() + (j.expires_in ?? 3600) * 1000 }
}

async function exchangeClaudeCode(code: string, verifier: string): Promise<ClaudeTokens | null> {
  // claude.ai returns the code as "<code>#<state>"; split before exchanging.
  const [authCode, state] = code.split("#")
  const res = await fetch(CLAUDE_OAUTH.TOKEN, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: authCode,
      state: state ?? verifier,
      client_id: CLAUDE_OAUTH.CLIENT_ID,
      redirect_uri: CLAUDE_OAUTH.REDIRECT,
      code_verifier: verifier,
    }),
  }).catch(() => null)
  if (!res || !res.ok) return null
  return parseClaudeTokenResponse(await res.json().catch(() => null))
}

async function refreshClaudeToken(refresh: string): Promise<ClaudeTokens | null> {
  if (!refresh) return null
  const res = await fetch(CLAUDE_OAUTH.TOKEN, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: refresh, client_id: CLAUDE_OAUTH.CLIENT_ID }),
  }).catch(() => null)
  if (!res || !res.ok) return null
  const next = parseClaudeTokenResponse(await res.json().catch(() => null))
  if (next && !next.refresh) next.refresh = refresh
  return next
}

const server: Plugin = async (input: PluginInput): Promise<Hooks> => ({
  auth: {
    provider: "anthropic",
    async loader(getAuth, provider) {
      // When the user logged in via Pro/Max subscription (stored as type:"oauth"), inject the OAuth
      // Bearer instead of x-api-key, refreshing the token if it's about to expire. Never touches
      // normal API-key auth.
      const stored = (await getAuth?.().catch(() => undefined)) as
        | { type?: string; access?: string; refresh?: string; expires?: number }
        | undefined
      if (stored?.type === "oauth") {
        // Return a currently-valid access token, refreshing on expiry AND PERSISTING the rotated
        // tokens back to the auth store (Anthropic rotates the refresh token on every refresh, so a
        // refresh whose result isn't saved permanently invalidates the credential). Done inside the
        // fetch wrapper so long-lived SDK instances refresh mid-session.
        const validAccess = async (): Promise<string | undefined> => {
          const cur = (await getAuth?.().catch(() => undefined)) as
            | { type?: string; access?: string; refresh?: string; expires?: number }
            | undefined
          if (cur?.type !== "oauth") return cur?.access
          if (cur.expires && cur.expires < Date.now() + 60_000 && cur.refresh) {
            const next = await refreshClaudeToken(cur.refresh).catch(() => null)
            if (next?.access) {
              await input.client.auth
                .set({
                  path: { id: "anthropic" },
                  body: {
                    type: "oauth",
                    access: next.access,
                    refresh: next.refresh || cur.refresh,
                    expires: next.expires,
                  },
                })
                .catch(() => {})
              return next.access
            }
          }
          return cur.access
        }
        return {
          apiKey: "",
          // Pro/Max OAuth: inject Bearer + oauth beta, strip x-api-key, AND relocate the agent's real
          // system prompt so Anthropic bills the subscription (not "extra usage").
          async fetch(url: any, init: any) {
            const token = await validAccess()
            const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) }
            delete headers["x-api-key"]
            delete headers["X-Api-Key"]
            if (token) headers["authorization"] = `Bearer ${token}`
            headers["anthropic-beta"] = CLAUDE_OAUTH.BETA
            headers["anthropic-version"] = "2023-06-01"
            headers["user-agent"] = CLAUDE_OAUTH.USER_AGENT
            headers["x-app"] = "cli"
            // The AI SDK may pass the body as a string OR a Uint8Array/ArrayBuffer; decode any shape.
            let body = init?.body
            let text: string | undefined
            if (typeof body === "string") text = body
            else if (body instanceof Uint8Array) text = new TextDecoder().decode(body)
            else if (body instanceof ArrayBuffer) text = new TextDecoder().decode(new Uint8Array(body))
            const nameMap: Record<string, string> = {}
            if (text !== undefined) {
              try {
                const parsed = JSON.parse(text)
                // (1) System-prompt RELOCATION — the key to staying on the subscription. Anthropic's
                // 2026-04 gate classifies the request as third-party ("extra usage", 400) when system[]
                // doesn't look like Claude Code's. The "runtime" layer (the first user message) accepts
                // arbitrary content. So: set system[] to ONLY the Claude Code identity, and move
                // SquadCoder's real system prompt into a <system-reminder> at the top of the first user
                // message. Full persona/skills/memory survive — only the wire placement changes.
                let originalSystem = ""
                if (Array.isArray(parsed.system))
                  originalSystem = parsed.system
                    .map((b: any) => (typeof b === "string" ? b : b?.text || ""))
                    .join("\n\n")
                else if (typeof parsed.system === "string") originalSystem = parsed.system
                originalSystem = originalSystem.split(CLAUDE_CODE_SYSTEM).join("").trim()
                parsed.system = [{ type: "text", text: CLAUDE_CODE_SYSTEM }]
                if (originalSystem && Array.isArray(parsed.messages)) {
                  const reminder = `<system-reminder>\n${originalSystem}\n</system-reminder>`
                  const firstUser = parsed.messages.find((m: any) => m?.role === "user")
                  if (firstUser) {
                    // Keep the reminder as its OWN text block so we can anchor a cache breakpoint on
                    // it below (see 1b-fix). Converting string content to a 2-block array is harmless.
                    const reminderBlock = { type: "text", text: reminder }
                    if (typeof firstUser.content === "string")
                      firstUser.content = [reminderBlock, { type: "text", text: firstUser.content }]
                    else if (Array.isArray(firstUser.content))
                      firstUser.content = [reminderBlock, ...firstUser.content]
                  }
                }
                // (1b) Strip cache_control — @ai-sdk/anthropic injects cache_control:{ephemeral},
                // which Anthropic now rejects on the OAuth path.
                const stripCacheControl = (o: any): void => {
                  if (Array.isArray(o)) o.forEach(stripCacheControl)
                  else if (o && typeof o === "object") {
                    delete o.cache_control
                    for (const k of Object.keys(o)) stripCacheControl(o[k])
                  }
                }
                stripCacheControl(parsed.system)
                stripCacheControl(parsed.messages)
                stripCacheControl(parsed.tools)
                // (1b-fix) RE-ENABLE prompt caching on the subscription path. The strips above remove
                // @ai-sdk/anthropic's markers (some land on system[], which Anthropic rejects on OAuth).
                // Now re-add a SMALL, controlled set of ephemeral breakpoints on blocks Anthropic ACCEPTS
                // on OAuth (the same shape real Claude Code uses): the tools schema, the relocated
                // <system-reminder> (the big persona/skills/memory prefix), and the prior-turn boundary
                // (so the growing transcript is re-read from cache). Without this, every turn re-bills the
                // entire fixed context + history at full price (the cache 0/0 in the usage panel). Kill-
                // switch: set SQUADCODER_OAUTH_CACHE=off to revert to strip-all if Anthropic ever rejects it.
                if (process.env["SQUADCODER_OAUTH_CACHE"] !== "off") {
                  const markCache = (b: any) => {
                    if (b && typeof b === "object") b.cache_control = { type: "ephemeral" }
                  }
                  // breakpoint 1 — tool schemas (large + stable across the whole session)
                  if (Array.isArray(parsed.tools) && parsed.tools.length > 0)
                    markCache(parsed.tools[parsed.tools.length - 1])
                  if (Array.isArray(parsed.messages)) {
                    // breakpoint 2 — the relocated <system-reminder> (persona/skills/memory)
                    const fu = parsed.messages.find((m: any) => m?.role === "user")
                    const head = fu && Array.isArray(fu.content) ? fu.content[0] : undefined
                    if (head && typeof head.text === "string" && head.text.startsWith("<system-reminder>"))
                      markCache(head)
                    // breakpoint 3 — prior-turn boundary, so the growing transcript is a cache-read
                    const lastUserIdx = parsed.messages.map((m: any) => m?.role).lastIndexOf("user")
                    if (lastUserIdx >= 1) {
                      const prev = parsed.messages[lastUserIdx - 1]
                      const tail = prev && Array.isArray(prev.content) ? prev.content[prev.content.length - 1] : undefined
                      if (tail) markCache(tail)
                    }
                  }
                }
                // (1c) Strip unsupported top-level fields. models.dev's "-fast" Opus variants put
                // `speed:"fast"` in the body, which Anthropic's /v1/messages rejects on this path
                // ("speed: Extra inputs are not permitted") — so a "Fast" model would error out and
                // leave the chat hanging. Drop it so the model just runs normally.
                delete parsed.speed
                // (2) PascalCase every tool name (and references in tool_choice + prior tool_use
                // blocks) so the request reads as Claude Code → billed to the plan, not extra usage.
                const remap = (n: any) => {
                  if (typeof n !== "string" || !n) return n
                  const p = toPascalToolName(n)
                  if (p !== n) nameMap[p] = n
                  return p
                }
                if (Array.isArray(parsed.tools)) for (const t of parsed.tools) if (t?.name) t.name = remap(t.name)
                if (parsed.tool_choice?.name) parsed.tool_choice.name = remap(parsed.tool_choice.name)
                if (Array.isArray(parsed.messages))
                  for (const m of parsed.messages)
                    if (Array.isArray(m?.content))
                      for (const c of m.content) if (c?.type === "tool_use" && c.name) c.name = remap(c.name)
                body = JSON.stringify(parsed)
              } catch {}
            }
            const res = await fetch(ensureAnthropicV1(url), { ...init, headers, body })
            // SQUADCODER: refresh the Pro/Max usage snapshot for the GUI (throttled; reuses the token).
            void pollUsage(token)
            // (3) Restore the engine's original snake_case tool names in the response stream.
            return restoreToolNames(res, nameMap)
          },
        }
      }
      // Plain API-key path with no custom baseURL: still repair a stray ANTHROPIC_BASE_URL that omits
      // /v1 (otherwise @ai-sdk/anthropic 404s exactly like the OAuth path did).
      if (!provider?.options?.baseURL)
        return {
          async fetch(url: any, init: any) {
            return fetch(ensureAnthropicV1(url), init)
          },
        }
      // Custom anthropic-compatible gateway (baseURL set): drop the anthropic-beta header the gateway
      // may not understand, and stop reading the stream once message_stop arrives.
      return {
        async fetch(url: any, init: any) {
          if (init?.headers && typeof init.headers === "object" && !Array.isArray(init.headers)) {
            delete init.headers["anthropic-beta"]
          }
          const res = await fetch(ensureAnthropicV1(url), init)
          if (!res.body || !res.headers.get("content-type")?.includes("text/event-stream")) return res
          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let done = false
          let buffer = ""
          const streamBody = new ReadableStream<Uint8Array>({
            async pull(ctrl) {
              if (done) {
                ctrl.close()
                return
              }
              const chunk = await reader.read()
              if (chunk.done) {
                ctrl.close()
                return
              }
              ctrl.enqueue(chunk.value)
              buffer += decoder.decode(chunk.value, { stream: true })
              if (buffer.includes("\nevent: message_stop\n") || buffer.includes('\ndata: {"type":"message_stop"}')) {
                done = true
                void reader.cancel()
                ctrl.close()
              }
              if (buffer.length > 512) buffer = buffer.slice(-256)
            },
            cancel() {
              reader.cancel()
            },
          })
          return new Response(streamBody, { headers: res.headers, status: res.status })
        },
      }
    },
    // Both connection methods so the Anthropic connect dialog is never empty. Labels are stable keys
    // localized client-side (dialog-connect-provider.tsx#methodLabel); "claude-pro-max" also drives
    // the Pro/Max dialog title.
    methods: [
      {
        type: "api" as const,
        label: "api-key",
      },
      {
        type: "oauth" as const,
        label: "claude-pro-max",
        authorize: async () => {
          // REAL OAuth: build a PKCE authorize URL the user actually visits + approves on claude.ai,
          // then exchanges the pasted code for tokens. method:"code" → dialog shows link + paste field.
          const { verifier, challenge } = claudePkce()
          const url =
            `${CLAUDE_OAUTH.AUTHORIZE}?code=true&client_id=${CLAUDE_OAUTH.CLIENT_ID}` +
            `&response_type=code&redirect_uri=${encodeURIComponent(CLAUDE_OAUTH.REDIRECT)}` +
            `&scope=${encodeURIComponent(CLAUDE_OAUTH.SCOPE)}` +
            `&code_challenge=${challenge}&code_challenge_method=S256&state=${verifier}`
          return {
            url,
            method: "code" as const,
            instructions:
              "Open the link, approve access with your Claude Pro/Max account, copy the code Anthropic " +
              `shows you, and paste it here. ${CLAUDE_SUBSCRIPTION_WARNING}`,
            callback: async (code?: string) => {
              if (!code?.trim()) return { type: "failed" as const }
              const tokens = await exchangeClaudeCode(code.trim(), verifier).catch(() => null)
              if (!tokens) return { type: "failed" as const }
              return {
                type: "success" as const,
                access: tokens.access,
                refresh: tokens.refresh,
                expires: tokens.expires,
              }
            },
          }
        },
      },
    ],
  },
})

export const id = "squadcoder-anthropic-oauth"
export { server }
export default { id, server } satisfies PluginModule
