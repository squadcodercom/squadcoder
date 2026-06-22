import type { Config, McpLocalConfig, McpRemoteConfig } from "@squadcoder/sdk/v2/client"
import { Button } from "@squadcoder/ui/button"
import { Switch } from "@squadcoder/ui/switch"
import { TextField } from "@squadcoder/ui/text-field"
import { showToast } from "@squadcoder/ui/toast"
import { type Component, createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { useLanguage } from "@/context/language"
import { useWorkspace } from "./settings/use-workspace"

type Transport = "local" | "remote"
const NEW = "__new__"

const linesToRecord = (text: string, sep: string): Record<string, string> => {
  const out: Record<string, string> = {}
  for (const raw of text.split("\n")) {
    const line = raw.trim()
    if (!line) continue
    const idx = line.indexOf(sep)
    if (idx === -1) continue
    const key = line.slice(0, idx).trim()
    const value = line.slice(idx + sep.length).trim()
    if (key) out[key] = value
  }
  return out
}

const recordToLines = (rec: Record<string, string> | undefined, sep: string): string =>
  rec ? Object.entries(rec).map(([k, v]) => `${k}${sep}${v}`).join("\n") : ""

const statusColor = (status?: string) => ({
  "bg-icon-success-base": status === "connected",
  "bg-icon-critical-base": status === "failed",
  "bg-border-weak-base": status === "disabled" || !status,
  "bg-icon-warning-base": status === "needs_auth" || status === "needs_client_registration" || status === "pending",
})

const statusTextColor = (status?: string) =>
  status === "connected"
    ? "text-text-success"
    : status === "failed"
      ? "text-text-critical"
      : status === "needs_auth" || status === "needs_client_registration" || status === "pending"
        ? "text-text-warning"
        : "text-text-weak"

const STATUS_LABEL: Record<string, string> = {
  connected: "mcp.status.connected",
  failed: "mcp.status.failed",
  needs_auth: "mcp.status.needs_auth",
  needs_client_registration: "mcp.status.needs_auth",
  disabled: "mcp.status.disabled",
}

// SQUADCODER Settings ▸ MCP (#63): list / add / edit / enable-disable MCP servers. Reuses the engine
// routes POST /mcp (runtime add), /mcp/:name/connect|disconnect, GET /mcp + persists to config.mcp
// (merge-only, so "remove" = enabled:false). OAuth authorize browser-flow is deferred (needs live test).
export const SettingsMcp: Component = () => {
  const language = useLanguage()
  const ws = useWorkspace()

  const [selected, setSelected] = createSignal<string | undefined>()
  const [busy, setBusy] = createSignal(false)
  const [importOpen, setImportOpen] = createSignal(false)
  const [importText, setImportText] = createSignal("")

  // Load runtime status once.
  createEffect(() => {
    if (ws.data.mcp_ready) return
    void ws.client.mcp
      .status()
      .then((r) => {
        ws.set("mcp", r.data ?? {})
        ws.set("mcp_ready", true)
      })
      .catch(() => {})
  })

  const configMcp = createMemo(
    () => (ws.data.config.mcp ?? {}) as Record<string, McpLocalConfig | McpRemoteConfig | { enabled: boolean }>,
  )
  const runtime = createMemo(() => ws.data.mcp ?? {})

  const names = createMemo(() =>
    [...new Set([...Object.keys(configMcp()), ...Object.keys(runtime())])].sort((a, b) => a.localeCompare(b)),
  )

  const statusOf = (name: string) => runtime()[name]?.status
  const errorOf = (name: string) => {
    const s = runtime()[name] as { status?: string; error?: string } | undefined
    return s && (s.status === "failed" || s.status === "needs_client_registration") ? s.error : undefined
  }
  const statusLabelOf = (name: string) => {
    const key = STATUS_LABEL[statusOf(name) ?? "disabled"]
    return key ? language.t(key) : statusOf(name)
  }

  const [form, setForm] = createStore({
    name: "",
    transport: "local" as Transport,
    command: "",
    environment: "",
    url: "",
    headers: "",
    enabled: true,
  })

  const isNew = () => selected() === NEW

  const seedFrom = (name: string) => {
    const cfg = configMcp()[name] as McpLocalConfig | McpRemoteConfig | { enabled: boolean } | undefined
    if (cfg && "type" in cfg && cfg.type === "remote") {
      setForm({
        name,
        transport: "remote",
        command: "",
        environment: "",
        url: cfg.url ?? "",
        headers: recordToLines(cfg.headers, ": "),
        enabled: cfg.enabled !== false,
      })
      return
    }
    if (cfg && "type" in cfg && cfg.type === "local") {
      setForm({
        name,
        transport: "local",
        command: (cfg.command ?? []).join(" "),
        environment: recordToLines(cfg.environment, "="),
        url: "",
        headers: "",
        enabled: cfg.enabled !== false,
      })
      return
    }
    // runtime-only or {enabled} entry — minimal seed
    setForm({
      name,
      transport: "local",
      command: "",
      environment: "",
      url: "",
      headers: "",
      enabled: (cfg as { enabled?: boolean } | undefined)?.enabled !== false,
    })
  }

  createEffect(() => {
    const list = names()
    if (!selected() && list[0]) setSelected(list[0])
  })

  createEffect(() => {
    const sel = selected()
    if (!sel) return
    if (sel === NEW) {
      setForm({ name: "", transport: "local", command: "", environment: "", url: "", headers: "", enabled: true })
      return
    }
    seedFrom(sel)
  })

  const buildConfig = (): McpLocalConfig | McpRemoteConfig => {
    if (form.transport === "remote") {
      const cfg: McpRemoteConfig = { type: "remote", url: form.url.trim(), enabled: form.enabled }
      const headers = linesToRecord(form.headers, ":")
      if (Object.keys(headers).length) cfg.headers = headers
      return cfg
    }
    const cfg: McpLocalConfig = {
      type: "local",
      command: form.command.split(/\s+/).filter(Boolean),
      enabled: form.enabled,
    }
    const env = linesToRecord(form.environment, "=")
    if (Object.keys(env).length) cfg.environment = env
    return cfg
  }

  const persist = async (name: string, cfg: McpLocalConfig | McpRemoteConfig) => {
    await ws.client.config.update({ config: { mcp: { [name]: cfg } } as Config })
    // optimistic config update
    const base = (ws.data.config.mcp ?? {}) as Record<string, unknown>
    ws.set("config", "mcp", { ...base, [name]: cfg } as never)
  }

  const refreshStatus = async () => {
    const r = await ws.client.mcp.status()
    if (r.data) ws.set("mcp", r.data)
  }

  const fail = (err: unknown) =>
    showToast({
      variant: "error",
      title: language.t("common.requestFailed"),
      description: err instanceof Error ? err.message : String(err),
    })

  const save = async () => {
    const name = form.name.trim()
    if (!name) return
    setBusy(true)
    try {
      const cfg = buildConfig()
      if (isNew()) {
        // Runtime add (so it connects now) + persist to config.
        await ws.client.mcp.add({ name, config: cfg }).catch(() => {})
      }
      await persist(name, cfg)
      if (cfg.enabled) await ws.client.mcp.connect({ name }).catch(() => {})
      await refreshStatus()
      setSelected(name)
      if (cfg.enabled && statusOf(name) !== "connected") {
        showToast({
          variant: "error",
          title: statusLabelOf(name) ?? language.t("mcp.status.failed"),
          description: errorOf(name) ?? name,
        })
        return
      }
      showToast({ variant: "success", title: language.t("settings.mcp.saved") })
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const toggleConnect = async (name: string) => {
    setBusy(true)
    try {
      const wasConnected = statusOf(name) === "connected"
      if (wasConnected) await ws.client.mcp.disconnect({ name })
      else await ws.client.mcp.connect({ name })
      await refreshStatus()
      if (wasConnected) {
        showToast({ variant: "success", title: language.t("settings.mcp.disconnect"), description: name })
        return
      }
      const status = statusOf(name)
      if (status === "connected") {
        showToast({ variant: "success", title: language.t("mcp.status.connected"), description: name })
        return
      }
      showToast({
        variant: "error",
        title: statusLabelOf(name) ?? language.t("mcp.status.failed"),
        description: errorOf(name) ?? name,
      })
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (name: string) => {
    setBusy(true)
    try {
      const cfg = configMcp()[name]
      const next = cfg && "type" in cfg ? { ...cfg, enabled: false } : { enabled: false }
      await ws.client.config.update({ config: { mcp: { [name]: next } } as Config })
      const base = (ws.data.config.mcp ?? {}) as Record<string, unknown>
      ws.set("config", "mcp", { ...base, [name]: next } as never)
      await ws.client.mcp.disconnect({ name }).catch(() => {})
      await refreshStatus()
      showToast({ variant: "success", title: language.t("settings.mcp.removed") })
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const runImport = async () => {
    setBusy(true)
    try {
      const parsed = JSON.parse(importText())
      const servers: Record<string, unknown> =
        parsed && typeof parsed === "object" && "mcpServers" in parsed
          ? (parsed.mcpServers as Record<string, unknown>)
          : (parsed as Record<string, unknown>)
      const next: Record<string, McpLocalConfig | McpRemoteConfig> = {}
      for (const [name, raw] of Object.entries(servers)) {
        const v = raw as Record<string, unknown>
        if (typeof v.url === "string") {
          next[name] = {
            type: "remote",
            url: v.url,
            enabled: true,
            ...(v.headers ? { headers: v.headers as Record<string, string> } : {}),
          }
        } else if (v.command) {
          const command = Array.isArray(v.command)
            ? (v.command as string[])
            : [String(v.command), ...((v.args as string[]) ?? [])]
          next[name] = {
            type: "local",
            command,
            enabled: true,
            ...(v.env ? { environment: v.env as Record<string, string> } : {}),
          }
        }
      }
      if (!Object.keys(next).length) throw new Error(language.t("settings.mcp.importEmpty"))
      await ws.client.config.update({ config: { mcp: next } as Config })
      const base = (ws.data.config.mcp ?? {}) as Record<string, unknown>
      ws.set("config", "mcp", { ...base, ...next } as never)
      setImportOpen(false)
      setImportText("")
      showToast({ variant: "success", title: language.t("settings.mcp.imported", { count: Object.keys(next).length }) })
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <div class="flex items-start justify-between gap-3 px-4 sm:px-10 pt-6 pb-4 border-b border-border-weak-base shrink-0">
        <div class="flex flex-col gap-1 min-w-0">
          <h2 class="text-16-medium text-text-strong">{language.t("settings.mcp.title")}</h2>
          <p class="text-12-regular text-text-weak">{language.t("settings.mcp.description")}</p>
        </div>
        <div class="flex items-center gap-2 shrink-0">
          <Button size="small" variant="secondary" onClick={() => setImportOpen((v) => !v)}>
            {language.t("settings.mcp.import")}
          </Button>
          <Button size="small" variant="primary" onClick={() => setSelected(NEW)}>
            {language.t("settings.mcp.add")}
          </Button>
        </div>
      </div>

      <Show when={importOpen()}>
        <div class="flex flex-col gap-2 px-4 sm:px-10 py-3 border-b border-border-weak-base bg-background-base">
          <span class="text-12-regular text-text-weak">{language.t("settings.mcp.importHint")}</span>
          <TextField
            multiline
            class="font-mono"
            value={importText()}
            onChange={setImportText}
            placeholder='{ "mcpServers": { "name": { "command": "npx", "args": ["-y", "pkg"] } } }'
            aria-label={language.t("settings.mcp.import")}
          />
          <div class="flex gap-2">
            <Button size="small" variant="primary" onClick={() => void runImport()} disabled={busy() || !importText().trim()}>
              {language.t("settings.mcp.importApply")}
            </Button>
            <Button size="small" variant="ghost" onClick={() => setImportOpen(false)}>
              {language.t("common.cancel")}
            </Button>
          </div>
        </div>
      </Show>

      <div class="flex flex-1 min-h-0">
        <aside class="w-56 shrink-0 border-e border-border-weak-base overflow-y-auto p-2 flex flex-col gap-0.5">
          <Show
            when={names().length > 0}
            fallback={<div class="text-12-regular text-text-weak p-2">{language.t("settings.mcp.empty")}</div>}
          >
            <For each={names()}>
              {(name) => (
                <button
                  type="button"
                  class="flex items-center gap-2 text-start px-2 py-1.5 rounded-md transition-colors"
                  classList={{
                    "bg-surface-raised-base text-text-strong": selected() === name,
                    "text-text-base hover:bg-surface-raised-base-hover": selected() !== name,
                  }}
                  onClick={() => setSelected(name)}
                >
                  <div classList={{ "size-1.5 rounded-full shrink-0": true, ...statusColor(statusOf(name)) }} />
                  <span class="text-13-regular truncate flex-1">{name}</span>
                </button>
              )}
            </For>
          </Show>
        </aside>

        <div class="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-6">
          <Show
            when={selected()}
            fallback={<div class="text-12-regular text-text-weak">{language.t("settings.mcp.selectPrompt")}</div>}
          >
            <div class="flex flex-col gap-5 max-w-2xl">
              <Show when={isNew()}>
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.mcp.field.name")}</span>
                  <TextField
                    value={form.name}
                    onChange={(v) => setForm("name", v)}
                    placeholder={language.t("settings.mcp.placeholder.name")}
                    aria-label={language.t("settings.mcp.field.name")}
                  />
                </div>
              </Show>
              <Show when={!isNew()}>
                <div class="flex flex-col gap-1.5">
                  <div class="flex items-center gap-2">
                    <h3 class="text-15-medium text-text-strong">{form.name}</h3>
                    <div classList={{ "size-1.5 rounded-full shrink-0": true, ...statusColor(statusOf(form.name)) }} />
                    <span classList={{ "text-12-regular": true, [statusTextColor(statusOf(form.name))]: true }}>
                      {statusLabelOf(form.name)}
                    </span>
                  </div>
                  <Show when={errorOf(form.name)}>
                    <p class="text-12-regular text-text-critical break-words">{errorOf(form.name)}</p>
                  </Show>
                </div>
              </Show>

              {/* Transport */}
              <div class="flex flex-col gap-2">
                <span class="text-14-medium text-text-strong">{language.t("settings.mcp.field.transport")}</span>
                <div class="flex gap-2">
                  <For each={["local", "remote"] as Transport[]}>
                    {(t) => (
                      <Button
                        size="small"
                        variant={form.transport === t ? "primary" : "secondary"}
                        onClick={() => setForm("transport", t)}
                      >
                        {language.t(`settings.mcp.transport.${t}`)}
                      </Button>
                    )}
                  </For>
                </div>
              </div>

              <Show when={form.transport === "local"}>
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.mcp.field.command")}</span>
                  <TextField
                    class="font-mono"
                    value={form.command}
                    onChange={(v) => setForm("command", v)}
                    placeholder="npx -y @modelcontextprotocol/server-filesystem"
                    aria-label={language.t("settings.mcp.field.command")}
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.mcp.field.env")}</span>
                  <span class="text-12-regular text-text-weak">{language.t("settings.mcp.field.envHint")}</span>
                  <TextField
                    multiline
                    class="font-mono"
                    value={form.environment}
                    onChange={(v) => setForm("environment", v)}
                    placeholder="API_KEY=..."
                    aria-label={language.t("settings.mcp.field.env")}
                  />
                </div>
              </Show>

              <Show when={form.transport === "remote"}>
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.mcp.field.url")}</span>
                  <TextField
                    class="font-mono"
                    value={form.url}
                    onChange={(v) => setForm("url", v)}
                    placeholder="https://example.com/mcp"
                    aria-label={language.t("settings.mcp.field.url")}
                  />
                </div>
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.mcp.field.headers")}</span>
                  <span class="text-12-regular text-text-weak">{language.t("settings.mcp.field.headersHint")}</span>
                  <TextField
                    multiline
                    class="font-mono"
                    value={form.headers}
                    onChange={(v) => setForm("headers", v)}
                    placeholder="Authorization: Bearer ..."
                    aria-label={language.t("settings.mcp.field.headers")}
                  />
                </div>
              </Show>

              {/* Enabled */}
              <div class="flex items-center justify-between gap-4 py-1">
                <div class="flex flex-col gap-0.5 min-w-0">
                  <span class="text-14-medium text-text-strong">{language.t("settings.mcp.field.enabled")}</span>
                  <span class="text-12-regular text-text-weak">{language.t("settings.mcp.field.enabledHint")}</span>
                </div>
                <Switch checked={form.enabled} onChange={(v) => setForm("enabled", v)} />
              </div>

              <p class="text-12-regular text-text-weak">{language.t("settings.mcp.mergeNote")}</p>

              <div class="flex items-center gap-3 pt-2 flex-wrap">
                <Button variant="primary" onClick={() => void save()} disabled={busy() || !form.name.trim()}>
                  {language.t("settings.agents.save")}
                </Button>
                <Show when={!isNew()}>
                  <Button
                    variant="secondary"
                    onClick={() => void toggleConnect(form.name)}
                    disabled={busy()}
                  >
                    {statusOf(form.name) === "connected"
                      ? language.t("settings.mcp.disconnect")
                      : language.t("settings.mcp.connect")}
                  </Button>
                  <Button variant="ghost" onClick={() => void remove(form.name)} disabled={busy()}>
                    {language.t("settings.mcp.remove")}
                  </Button>
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
