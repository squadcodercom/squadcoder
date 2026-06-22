const fs = require("fs")
const os = require("os")
const p = os.homedir() + "/.claude/.credentials.json"
const creds = JSON.parse(fs.readFileSync(p, "utf8"))
const oauth = creds.claudeAiOauth
const CID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e"
const CC = "You are Claude Code, Anthropic's official CLI for Claude."

async function callMessages(access, betaHeader, label) {
  const headers = {
    authorization: "Bearer " + access,
    "anthropic-version": "2023-06-01",
    "anthropic-beta": betaHeader,
    "user-agent": "claude-cli/1.0.128 (external, cli)",
    "x-app": "cli",
    "anthropic-dangerous-direct-browser-access": "true",
    "content-type": "application/json",
  }
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers,
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: 16, system: [{ type: "text", text: CC }], messages: [{ role: "user", content: "hi" }] }),
  })
  console.log(`\n[${label}] beta="${betaHeader}" => HTTP ${res.status}`)
  console.log("   " + (await res.text()).slice(0, 200))
}

;(async () => {
  // 1) refresh against the new endpoint
  const r = await fetch("https://api.anthropic.com/v1/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ grant_type: "refresh_token", refresh_token: oauth.refreshToken, client_id: CID }),
  })
  console.log("refresh status:", r.status)
  if (!r.ok) { console.log("refresh failed:", (await r.text()).slice(0, 200)); return }
  const j = await r.json()
  const access = j.access_token
  // 2) write rotated tokens back so `claude` CLI keeps working
  oauth.accessToken = access
  if (j.refresh_token) oauth.refreshToken = j.refresh_token
  oauth.expiresAt = Date.now() + (j.expires_in ?? 3600) * 1000
  fs.writeFileSync(p, JSON.stringify(creds, null, 2))
  console.log("rotated token persisted to ~/.claude. scopes:", j.scope || "n/a")

  // 3) A/B test: WITHOUT vs WITH claude-code-20250219
  await callMessages(access, "oauth-2025-04-20", "OLD (no claude-code beta)")
  await callMessages(access, "claude-code-20250219,oauth-2025-04-20,interleaved-thinking-2025-05-14,fine-grained-tool-streaming-2025-05-14", "NEW (claude-code beta)")
})().catch((e) => console.log("ERR", e.message))
