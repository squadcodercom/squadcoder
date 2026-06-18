import type { Hooks, PluginInput } from "@mimo-ai/plugin"
import { Log } from "../util"
import { createServer } from "http"
import crypto from "crypto"
import { exec } from "child_process"
import { Global } from "../global"
import path from "path"
import fs from "fs"

const log = Log.create({ service: "plugin.mimo" })

const PLATFORM_URL = process.env.MIMO_PLATFORM_URL || "https://platform.xiaomimimo.com"

function getKeyName(): string {
  const filePath = path.join(Global.Path.data, "mimo-key-name")
  try {
    const existing = fs.readFileSync(filePath, "utf-8").trim()
    if (existing) return existing
  } catch {}
  const name = `mimo-code-cli-key-${crypto.randomBytes(4).toString("hex")}`
  fs.writeFileSync(filePath, name)
  return name
}

function generateKeyPair() {
  const keyPair = crypto.generateKeyPairSync("x25519", {
    publicKeyEncoding: { type: "spki", format: "der" },
    privateKeyEncoding: { type: "pkcs8", format: "der" },
  })
  const publicKeyBase64 = Buffer.from(keyPair.publicKey).toString("base64url")
  return { publicKey: publicKeyBase64, privateKeyDer: keyPair.privateKey }
}

function decrypt(privateKeyDer: Buffer, encryptedBase64: string): { sk?: string; uid: string; url?: string } {
  const encrypted = Buffer.from(encryptedBase64, "base64url")
  // Format: ephemeralPublicKey(32 bytes) + nonce(12 bytes) + ciphertext + tag(16 bytes)
  const ephemeralPub = encrypted.subarray(0, 32)
  const nonce = encrypted.subarray(32, 44)
  const ciphertextAndTag = encrypted.subarray(44)
  const tag = ciphertextAndTag.subarray(ciphertextAndTag.length - 16)
  const ciphertext = ciphertextAndTag.subarray(0, ciphertextAndTag.length - 16)

  const privateKey = crypto.createPrivateKey({ key: privateKeyDer, format: "der", type: "pkcs8" })
  const ephemeralPublicKey = crypto.createPublicKey({
    key: Buffer.concat([Buffer.from("302a300506032b656e032100", "hex"), ephemeralPub]),
    format: "der",
    type: "spki",
  })

  const sharedSecret = crypto.diffieHellman({ privateKey, publicKey: ephemeralPublicKey })
  const derivedKey = crypto.createHash("sha256").update(sharedSecret).digest()

  const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, nonce)
  decipher.setAuthTag(tag)
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()])

  return JSON.parse(decrypted.toString("utf-8"))
}

function openBrowser(url: string) {
  if (process.env.CI || process.env.NODE_ENV === "test") return
  const command =
    process.platform === "darwin"
      ? `open "${url}"`
      : process.platform === "win32"
        ? `start "" "${url}"`
        : `xdg-open "${url}"`
  exec(command, (error) => {
    if (error) {
      log.warn("could not open browser automatically", { error })
    }
  })
}

function buildAuthorizeUrl(publicKey: string, redirectUri: string): string {
  const params = new URLSearchParams({
    pk: publicKey,
    redirect_uri: redirectUri,
    kn: "mimocode",
    key_name: getKeyName(),
  })
  return `${PLATFORM_URL}/authorize?${params.toString()}`
}

export async function MimoAuthPlugin(_input: PluginInput): Promise<Hooks> {
  return {
    config: async (input) => {
      input.provider ??= {}
      input.provider.xiaomi ??= {}
      const xiaomi = input.provider.xiaomi
      xiaomi.name ??= "MiMo"
      xiaomi.api ??= "https://api.xiaomimimo.com/v1"
      // Disable upstream SquadCoder hosted providers so they don't silently
      // auto-load their free/public tier (opencode autoloads zero-cost models
      // with apiKey "public" when no key is configured). Previously set by the
      // free channel; moved here so it applies in every build (the free channel
      // is now an optional private overlay).
      input.disabled_providers ??= []
      // SQUADCODER(#79): keep disabled by default (don't auto-light upstream's free tier), but
      // let power users who explicitly authenticated their own opencode key opt back in.
      if (process.env.SQUADCODER_ENABLE_OPENCODE_PROVIDERS !== "1") {
        for (const id of ["opencode", "opencode-go"]) {
          if (!input.disabled_providers.includes(id)) input.disabled_providers.push(id)
        }
      }
    },
    auth: {
      provider: "xiaomi",
      async loader(getAuth) {
        const auth = (await getAuth()) as { type: string; metadata?: Record<string, string> }
        if (auth?.type !== "api" || !auth.metadata?.base_url) return {}
        return { baseURL: auth.metadata.base_url }
      },
      methods: [
        {
          label: "浏览器登录",
          type: "oauth" as const,
          authorize: async () => {
            const { publicKey, privateKeyDer } = generateKeyPair()

            const server = createServer()
            await new Promise<void>((resolve, reject) => {
              server.listen(0, () => resolve())
              server.on("error", reject)
            })
            const addr = server.address()
            const port = typeof addr === "object" && addr ? addr.port : 0
            log.info("mimo oauth server started", { port })

            const redirectUri = `http://localhost:${port}/`
            const authUrl = buildAuthorizeUrl(publicKey, redirectUri)
            const manualUrl = buildAuthorizeUrl(publicKey, `${PLATFORM_URL}/authorize/code/callback`)

            openBrowser(authUrl)

            const serverCallbackPromise = new Promise<{ sk?: string; uid: string; url?: string }>((resolve, reject) => {
              const timeout = setTimeout(() => {
                server.close()
                reject(new Error("Authorization timeout"))
              }, 5 * 60 * 1000)

              server.on("request", (req, res) => {
                const url = new URL(req.url || "/", `http://localhost`)
                log.info("mimo oauth callback received", { path: url.pathname, query: url.search.substring(0, 100) })

                const u = url.searchParams.get("u")

                if (!u) {
                  log.warn("mimo oauth callback missing u param")
                  res.writeHead(302, { Location: `${PLATFORM_URL}/authorize/callback?status=error&message=missing_data` })
                  res.end()
                  reject(new Error("Missing encrypted data"))
                  return
                }

                try {
                  const result = decrypt(privateKeyDer, u)
                  log.info("mimo oauth decrypt success", { uid: result.uid, url: result.url })
                  res.writeHead(302, { Location: `${PLATFORM_URL}/authorize/callback?status=success` })
                  res.end()
                  clearTimeout(timeout)
                  resolve(result)
                } catch (err) {
                  log.error("mimo oauth decrypt failed", { error: err })
                  res.writeHead(302, { Location: `${PLATFORM_URL}/authorize/callback?status=error&message=decrypt_failed` })
                  res.end()
                  reject(new Error("Decryption failed"))
                }
              })
            })
            serverCallbackPromise.catch(() => {})

            return {
              url: manualUrl,
              method: "auto" as const,
              instructions: "在浏览器中完成授权，或粘贴 Code 完成登录。",
              callback: async (code?: string) => {
                if (code) {
                  try {
                    const result = decrypt(privateKeyDer, code.trim())
                    server.close()
                    const metadata: Record<string, string> = { uid: result.uid }
                    if (result.url) metadata.base_url = result.url
                    return { type: "success" as const, key: result.sk ?? "", metadata }
                  } catch {
                    return { type: "failed" as const }
                  }
                }
                try {
                  const result = await serverCallbackPromise
                  server.close()
                  const metadata: Record<string, string> = { uid: result.uid }
                  if (result.url) metadata.base_url = result.url
                  return { type: "success" as const, key: result.sk ?? "", metadata }
                } catch {
                  server.close()
                  return { type: "failed" as const }
                }
              },
            }
          },
        },
      ],
    },
    "chat.headers": async (input, output) => {
      if (input.model.providerID !== "xiaomi") return
      output.headers["X-Mimo-Source"] = "mimocode-cli"
    },
  }
}

// SQUADCODER: Claude Pro/Max subscription login — REAL OAuth (PKCE) against Anthropic's claude.ai
// OAuth, the same PUBLIC client id Claude Code itself uses. The user opens a real authorize page,
// approves, and pastes the returned code; we exchange it for access+refresh tokens stored locally
// and refresh them automatically. No middleman; tokens never leave the machine.
// ⚠️ Anthropic's ToS prohibits using a Pro/Max subscription token in third-party tools and access
// may be revoked at any time. Opt-in, clearly warned. Pattern: MIT griffinmartin/opencode-claude-auth.
const CLAUDE_OAUTH = {
  CLIENT_ID: "9d1c250a-e61b-44d9-88ed-5944d1962f5e",
  AUTHORIZE: "https://claude.ai/oauth/authorize",
  TOKEN: "https://console.anthropic.com/v1/oauth/token",
  REDIRECT: "https://console.anthropic.com/oauth/code/callback",
  SCOPE: "org:create_api_key user:profile user:inference",
  BETA: "oauth-2025-04-20",
}
const CLAUDE_SUBSCRIPTION_WARNING =
  "⚠️ Community workaround — Anthropic's ToS prohibits using a Pro/Max subscription token in third-party tools and access may be revoked at any time. Prefer an API key for anything important."

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

export async function AnthropicProxyPlugin(_input: PluginInput): Promise<Hooks> {
  return {
    auth: {
      provider: "anthropic",
      async loader(getAuth, provider) {
        // SQUADCODER: when the user logged in via Pro/Max subscription (stored as type:"oauth"),
        // inject the OAuth Bearer instead of x-api-key, refreshing the token if it's about to expire.
        // Never touches normal API-key auth.
        const stored = (await getAuth?.().catch(() => undefined)) as
          | { type?: string; access?: string; refresh?: string; expires?: number }
          | undefined
        if (stored?.type === "oauth") {
          let access = stored.access
          if (stored.expires && stored.expires < Date.now() + 60_000 && stored.refresh) {
            const next = await refreshClaudeToken(stored.refresh).catch(() => null)
            if (next?.access) access = next.access
          }
          if (access) {
            return {
              apiKey: "",
              headers: {
                authorization: `Bearer ${access}`,
                "anthropic-beta": CLAUDE_OAUTH.BETA,
              },
            }
          }
        }
        if (!provider?.options?.baseURL) return {}
        return {
          async fetch(url: any, init: any) {
            if (init?.headers && typeof init.headers === "object" && !Array.isArray(init.headers)) {
              delete init.headers["anthropic-beta"]
            }
            const res = await fetch(url, init)
            if (!res.body || !res.headers.get("content-type")?.includes("text/event-stream")) return res
            const reader = res.body.getReader()
            const decoder = new TextDecoder()
            let done = false
            let buffer = ""
            const body = new ReadableStream<Uint8Array>({
              async pull(ctrl) {
                if (done) { ctrl.close(); return }
                const chunk = await reader.read()
                if (chunk.done) { ctrl.close(); return }
                ctrl.enqueue(chunk.value)
                buffer += decoder.decode(chunk.value, { stream: true })
                if (buffer.includes("\nevent: message_stop\n") || buffer.includes("\ndata: {\"type\":\"message_stop\"}")) {
                  done = true
                  void reader.cancel()
                  ctrl.close()
                }
                if (buffer.length > 512) buffer = buffer.slice(-256)
              },
              cancel() { reader.cancel() },
            })
            return new Response(body, { headers: res.headers, status: res.status })
          },
        }
      },
      // SQUADCODER: both connection methods so the Anthropic connect dialog is never empty.
      // Labels are stable keys localized client-side (dialog-connect-provider.tsx#methodLabel);
      // "claude-pro-max" also drives the Pro/Max dialog title.
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
  }
}
