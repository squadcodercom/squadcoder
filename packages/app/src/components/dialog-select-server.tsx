import { Button } from "@mimo-ai/ui/button"
import { useDialog } from "@mimo-ai/ui/context/dialog"
import { Dialog } from "@mimo-ai/ui/dialog"
import { DropdownMenu } from "@mimo-ai/ui/dropdown-menu"
import { Icon } from "@mimo-ai/ui/icon"
import { IconButton } from "@mimo-ai/ui/icon-button"
import { List } from "@mimo-ai/ui/list"
import { TextField } from "@mimo-ai/ui/text-field"
import { useMutation } from "@tanstack/solid-query"
import { showToast } from "@mimo-ai/ui/toast"
import { useNavigate } from "@solidjs/router"
import { createEffect, createMemo, createResource, For, onCleanup, Show } from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import { ServerHealthIndicator, ServerRow } from "@/components/server/server-row"
import { useLanguage } from "@/context/language"
import { usePlatform, type SshConfigEntry } from "@/context/platform"
import { normalizeServerUrl, ServerConnection, useServer } from "@/context/server"
import { type ServerHealth, useCheckServerHealth } from "@/utils/server-health"

const DEFAULT_USERNAME = "squadcoder"

// SQUADCODER: map stable SSH error codes (from the desktop tunnel manager) → localized message keys.
const SSH_ERROR_KEY: Record<string, string> = {
  "client-missing": "server.ssh.error.clientMissing",
  "auth-failed": "server.ssh.error.authFailed",
  "host-key-changed": "server.ssh.error.hostKeyChanged",
  "forward-failed": "server.ssh.error.forwardFailed",
  "engine-not-installed": "server.ssh.error.engineNotInstalled",
  "engine-failed": "server.ssh.error.engineFailed",
  "timed-out": "server.ssh.error.timedOut",
}

const SSH_PHASE_KEY: Record<string, string> = {
  connecting: "server.ssh.phase.connecting",
  bootstrapping: "server.ssh.phase.bootstrapping",
  "opening-tunnel": "server.ssh.phase.openingTunnel",
  attached: "server.ssh.phase.attached",
}

interface ServerFormProps {
  value: string
  name: string
  username: string
  password: string
  placeholder: string
  busy: boolean
  error: string
  status: boolean | undefined
  onChange: (value: string) => void
  onNameChange: (value: string) => void
  onUsernameChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: () => void
  onBack: () => void
}

function showRequestError(language: ReturnType<typeof useLanguage>, err: unknown) {
  showToast({
    variant: "error",
    title: language.t("common.requestFailed"),
    description: err instanceof Error ? err.message : String(err),
  })
}

function useDefaultServer() {
  const language = useLanguage()
  const platform = usePlatform()
  const [defaultKey, defaultUrlActions] = createResource(
    async () => {
      try {
        const key = await platform.getDefaultServer?.()
        if (!key) return null
        return key
      } catch (err) {
        showRequestError(language, err)
        return null
      }
    },
    { initialValue: null },
  )

  const canDefault = createMemo(() => !!platform.getDefaultServer && !!platform.setDefaultServer)
  const setDefault = async (key: ServerConnection.Key | null) => {
    try {
      await platform.setDefaultServer?.(key)
      defaultUrlActions.mutate(key)
    } catch (err) {
      showRequestError(language, err)
    }
  }

  return { defaultKey, canDefault, setDefault }
}

function useServerPreview() {
  const checkServerHealth = useCheckServerHealth()

  const looksComplete = (value: string) => {
    const normalized = normalizeServerUrl(value)
    if (!normalized) return false
    const host = normalized.replace(/^https?:\/\//, "").split("/")[0]
    if (!host) return false
    if (host.includes("localhost") || host.startsWith("127.0.0.1")) return true
    return host.includes(".") || host.includes(":")
  }

  const previewStatus = async (
    value: string,
    username: string,
    password: string,
    setStatus: (value: boolean | undefined) => void,
  ) => {
    setStatus(undefined)
    if (!looksComplete(value)) return
    const normalized = normalizeServerUrl(value)
    if (!normalized) return
    const http: ServerConnection.HttpBase = { url: normalized }
    if (username) http.username = username
    if (password) http.password = password
    const result = await checkServerHealth(http)
    setStatus(result.healthy)
  }

  return { previewStatus }
}

function ServerForm(props: ServerFormProps) {
  const language = useLanguage()
  const keyDown = (event: KeyboardEvent) => {
    event.stopPropagation()
    if (event.key === "Escape") {
      event.preventDefault()
      props.onBack()
      return
    }
    if (event.key !== "Enter" || event.isComposing) return
    event.preventDefault()
    props.onSubmit()
  }

  return (
    <div class="px-5">
      <div class="bg-surface-base rounded-md p-5 flex flex-col gap-3">
        <div class="flex-1 min-w-0 [&_[data-slot=input-wrapper]]:relative">
          <TextField
            type="text"
            label={language.t("dialog.server.add.url")}
            placeholder={props.placeholder}
            value={props.value}
            autofocus
            validationState={props.error ? "invalid" : "valid"}
            error={props.error}
            disabled={props.busy}
            onChange={props.onChange}
            onKeyDown={keyDown}
          />
        </div>
        <TextField
          type="text"
          label={language.t("dialog.server.add.name")}
          placeholder={language.t("dialog.server.add.namePlaceholder")}
          value={props.name}
          disabled={props.busy}
          onChange={props.onNameChange}
          onKeyDown={keyDown}
        />
        <div class="grid grid-cols-2 gap-2 min-w-0">
          <TextField
            type="text"
            label={language.t("dialog.server.add.username")}
            placeholder={language.t("dialog.server.add.usernamePlaceholder")}
            value={props.username}
            disabled={props.busy}
            onChange={props.onUsernameChange}
            onKeyDown={keyDown}
          />
          <TextField
            type="password"
            label={language.t("dialog.server.add.password")}
            placeholder={language.t("dialog.server.add.passwordPlaceholder")}
            value={props.password}
            disabled={props.busy}
            onChange={props.onPasswordChange}
            onKeyDown={keyDown}
          />
        </div>
        <div dir="auto" class="mt-1 rounded-md bg-background-base/60 px-3 py-2.5 flex flex-col gap-1.5">
          <div class="text-12-medium text-text-base">{language.t("dialog.server.add.help.title")}</div>
          <ol class="text-12-regular text-text-weak ps-4 list-decimal flex flex-col gap-1">
            <li>
              {language.t("dialog.server.add.help.step1")}{" "}
              <code class="text-text-base bg-surface-raised-base rounded px-1 py-0.5">
                squadcoder serve --port 4096
              </code>
            </li>
            <li>
              {language.t("dialog.server.add.help.step2")}{" "}
              <code class="text-text-base bg-surface-raised-base rounded px-1 py-0.5">
                ssh -L 4096:localhost:4096 user@host
              </code>
            </li>
            <li>{language.t("dialog.server.add.help.step3")}</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

interface SshFormProps {
  host: string
  user: string
  port: string
  keyFile: string
  useAgent: boolean
  remotePort: string
  name: string
  busy: boolean
  error: string
  phase: string
  onHostChange: (value: string) => void
  onUserChange: (value: string) => void
  onPortChange: (value: string) => void
  onRemotePortChange: (value: string) => void
  onNameChange: (value: string) => void
  onUseAgentChange: (value: boolean) => void
  onKeyFileChange: (value: string) => void
  onPickKey: () => void
  canBrowse: boolean
  onSubmit: () => void
  onBack: () => void
  onImport: (entry: SshConfigEntry) => void
}

function SshForm(props: SshFormProps) {
  const language = useLanguage()
  const sshPlatform = usePlatform()
  // SQUADCODER (#72): offer the user's existing ~/.ssh/config hosts (e.g. "Relay") to import
  // instead of retyping host/user/key/port. Desktop-only; web has no readSshConfig.
  const [configHosts] = createResource(
    () => sshPlatform.readSshConfig?.() ?? Promise.resolve([] as SshConfigEntry[]),
  )
  const keyDown = (event: KeyboardEvent) => {
    event.stopPropagation()
    if (event.key === "Escape") {
      event.preventDefault()
      props.onBack()
      return
    }
    if (event.key !== "Enter" || event.isComposing) return
    event.preventDefault()
    props.onSubmit()
  }

  const phaseLabel = () => {
    const key = SSH_PHASE_KEY[props.phase]
    return key ? language.t(key as Parameters<typeof language.t>[0]) : ""
  }

  return (
    <div class="px-5">
      <div class="bg-surface-base rounded-md p-5 flex flex-col gap-3">
        <Show when={(configHosts()?.length ?? 0) > 0}>
          <div class="flex flex-col gap-1">
            <label class="text-12-medium text-text-weak text-start">{language.t("server.ssh.import.label")}</label>
            <select
              class="h-9 rounded-md bg-surface-strong border border-border-weak px-2 text-13-regular text-text-strong"
              disabled={props.busy}
              onChange={(e) => {
                const entry = configHosts()?.find((h) => h.host === e.currentTarget.value)
                e.currentTarget.value = ""
                if (entry) props.onImport(entry)
              }}
            >
              <option value="">{language.t("server.ssh.import.placeholder")}</option>
              <For each={configHosts()}>
                {(h) => (
                  <option value={h.host}>
                    {h.host}
                    {h.hostName ? ` — ${h.hostName}` : ""}
                  </option>
                )}
              </For>
            </select>
          </div>
        </Show>
        <div class="grid grid-cols-[1fr_auto] gap-2 min-w-0">
          <TextField
            type="text"
            label={language.t("server.ssh.field.host")}
            placeholder={language.t("server.ssh.field.hostPlaceholder")}
            value={props.host}
            autofocus
            disabled={props.busy}
            onChange={props.onHostChange}
            onKeyDown={keyDown}
          />
          <div class="w-24">
            <TextField
              type="text"
              label={language.t("server.ssh.field.port")}
              placeholder="22"
              value={props.port}
              disabled={props.busy}
              onChange={props.onPortChange}
              onKeyDown={keyDown}
            />
          </div>
        </div>
        <TextField
          type="text"
          label={language.t("server.ssh.field.user")}
          placeholder={language.t("server.ssh.field.userPlaceholder")}
          value={props.user}
          disabled={props.busy}
          onChange={props.onUserChange}
          onKeyDown={keyDown}
        />

        {/* Auth: ssh-agent vs key file (key-based login is the recommended path). */}
        <div class="flex flex-col gap-2">
          <span class="text-12-medium text-text-base">{language.t("server.ssh.auth.label")}</span>
          <div class="inline-flex rounded-md bg-background-base/60 p-0.5 self-start">
            <button
              type="button"
              disabled={props.busy}
              onClick={() => props.onUseAgentChange(true)}
              class={`text-12-medium px-3 py-1.5 rounded-[5px] transition-colors ${
                props.useAgent ? "bg-surface-raised-base text-text-base" : "text-text-weak hover:text-text-base"
              }`}
            >
              {language.t("server.ssh.auth.agent")}
            </button>
            <button
              type="button"
              disabled={props.busy}
              onClick={() => props.onUseAgentChange(false)}
              class={`text-12-medium px-3 py-1.5 rounded-[5px] transition-colors ${
                !props.useAgent ? "bg-surface-raised-base text-text-base" : "text-text-weak hover:text-text-base"
              }`}
            >
              {language.t("server.ssh.auth.key")}
            </button>
          </div>
          <Show when={!props.useAgent}>
            <div class="flex items-end gap-2 min-w-0">
              <div class="flex-1 min-w-0">
                <TextField
                  type="text"
                  label={language.t("server.ssh.field.keyFile")}
                  placeholder={language.t("server.ssh.field.keyFilePlaceholder")}
                  value={props.keyFile}
                  disabled={props.busy}
                  onChange={props.onKeyFileChange}
                  onKeyDown={keyDown}
                />
              </div>
              <Show when={props.canBrowse}>
                <Button variant="secondary" size="large" onClick={props.onPickKey} disabled={props.busy} class="px-3 py-1.5">
                  {language.t("server.ssh.field.keyFileBrowse")}
                </Button>
              </Show>
            </div>
          </Show>
        </div>

        <TextField
          type="text"
          label={language.t("dialog.server.add.name")}
          placeholder={language.t("dialog.server.add.namePlaceholder")}
          value={props.name}
          disabled={props.busy}
          onChange={props.onNameChange}
          onKeyDown={keyDown}
        />
        <div class="w-40">
          <TextField
            type="text"
            label={language.t("server.ssh.field.remotePort")}
            placeholder="4096"
            value={props.remotePort}
            disabled={props.busy}
            onChange={props.onRemotePortChange}
            onKeyDown={keyDown}
          />
        </div>

        <div dir="auto" class="mt-1 rounded-md bg-background-base/60 px-3 py-2.5 text-12-regular text-text-weak">
          {language.t("server.ssh.help")}
        </div>

        <Show when={props.busy && phaseLabel()}>
          <div class="flex items-center gap-2 text-12-regular text-text-base animate-pulse">
            <span class="inline-block size-2 rounded-full bg-text-base" />
            <span>{phaseLabel()}</span>
          </div>
        </Show>

        <Show when={!props.busy && props.error}>
          <div dir="auto" class="text-12-regular text-text-on-critical-base">
            {props.error}
          </div>
        </Show>
      </div>
    </div>
  )
}

export function DialogSelectServer() {
  const navigate = useNavigate()
  const dialog = useDialog()
  const server = useServer()
  const platform = usePlatform()
  const language = useLanguage()
  const { defaultKey, canDefault, setDefault } = useDefaultServer()
  const { previewStatus } = useServerPreview()
  const checkServerHealth = useCheckServerHealth()
  const [store, setStore] = createStore({
    status: {} as Record<ServerConnection.Key, ServerHealth | undefined>,
    addServer: {
      url: "",
      name: "",
      username: DEFAULT_USERNAME,
      password: "",
      error: "",
      showForm: false,
      status: undefined as boolean | undefined,
      // SQUADCODER: SSH connection mode (desktop only)
      connType: "http" as "http" | "ssh",
      sshHost: "",
      sshUser: "",
      sshPort: "",
      sshKeyFile: "",
      sshUseAgent: true,
      sshRemotePort: "",
      sshPhase: "",
    },
    editServer: {
      id: undefined as string | undefined,
      value: "",
      name: "",
      username: "",
      password: "",
      error: "",
      status: undefined as boolean | undefined,
    },
  })

  const resetAdd = () => {
    setStore("addServer", {
      url: "",
      name: "",
      username: DEFAULT_USERNAME,
      password: "",
      error: "",
      showForm: false,
      status: undefined,
      connType: "http",
      sshHost: "",
      sshUser: "",
      sshPort: "",
      sshKeyFile: "",
      sshUseAgent: true,
      sshRemotePort: "",
      sshPhase: "",
    })
  }
  const resetEdit = () => {
    setStore("editServer", {
      id: undefined,
      value: "",
      name: "",
      username: "",
      password: "",
      error: "",
      status: undefined,
    })
  }

  const addMutation = useMutation(() => ({
    mutationFn: async (value: string) => {
      const normalized = normalizeServerUrl(value)
      if (!normalized) {
        resetAdd()
        return
      }

      const conn: ServerConnection.Http = {
        type: "http",
        http: { url: normalized },
      }
      if (store.addServer.name.trim()) conn.displayName = store.addServer.name.trim()
      if (store.addServer.password) conn.http.password = store.addServer.password
      if (store.addServer.password && store.addServer.username) conn.http.username = store.addServer.username
      const result = await checkServerHealth(conn.http)
      if (!result.healthy) {
        setStore("addServer", { error: language.t("dialog.server.add.error") })
        return
      }

      resetAdd()
      await select(conn, true)
    },
  }))

  // SQUADCODER: Remote-SSH connect. Desktop opens the tunnel in the Electron main process; WEB asks the
  // connected ENGINE to open it (the engine has shell access, the browser doesn't) and — for the
  // co-located case — reaches the returned loopback URL directly. Either way it attaches via the
  // existing ServerConnection.Ssh path.
  const sshAvailable = createMemo(() => typeof platform.openSshTunnel === "function" || !!server.current)

  // Web path: call the engine's /ssh routes on the active server.
  const engineHttp = () => server.current?.http
  const engineHeaders = () => {
    const h = engineHttp()
    const headers: Record<string, string> = { "content-type": "application/json" }
    if (h?.password) headers.authorization = `Basic ${btoa(`${h.username ?? DEFAULT_USERNAME}:${h.password}`)}`
    return headers
  }
  const sshConnectViaEngine = async (opts: {
    host: string
    user: string
    port?: number
    keyFile?: string
    remotePort?: number
  }) => {
    const h = engineHttp()
    if (!h?.url) throw new Error("No active server to run SSH on")
    const res = await fetch(`${h.url.replace(/\/+$/, "")}/global/ssh/connect`, {
      method: "POST",
      headers: engineHeaders(),
      body: JSON.stringify(opts),
    })
    const outcome = (await res.json().catch(() => ({ ok: false, code: "unknown", message: "Bad engine response" }))) as
      | { ok: true; result: { host: string; url: string; username: string; password: string } }
      | { ok: false; code?: string; message?: string }
    if (!outcome.ok) {
      const e = new Error(outcome.message || "SSH failed") as Error & { code?: string }
      e.code = outcome.code
      throw e
    }
    return outcome.result
  }
  const doSshConnect = (opts: { host: string; user: string; port?: number; keyFile?: string; remotePort?: number }) =>
    platform.openSshTunnel ? platform.openSshTunnel(opts) : sshConnectViaEngine(opts)
  const doSshDisconnect = (host: string) => {
    if (platform.closeSshTunnel) return void platform.closeSshTunnel(host)
    const h = engineHttp()
    if (!h?.url) return
    void fetch(`${h.url.replace(/\/+$/, "")}/global/ssh/disconnect`, {
      method: "POST",
      headers: engineHeaders(),
      body: JSON.stringify({ host }),
    }).catch(() => {})
  }

  const localizeSshError = (err: unknown) => {
    const code = (err as { code?: string } | undefined)?.code
    const key = code ? SSH_ERROR_KEY[code] : undefined
    if (key) return language.t(key as Parameters<typeof language.t>[0])
    return err instanceof Error ? err.message : String(err)
  }

  const sshMutation = useMutation(() => ({
    mutationFn: async () => {
      const host = store.addServer.sshHost.trim()
      const user = store.addServer.sshUser.trim()
      if (!host || !user) {
        setStore("addServer", { error: language.t("server.ssh.error.missingFields") })
        return
      }
      if (!sshAvailable()) return
      setStore("addServer", { error: "", sshPhase: "connecting" })
      try {
        const portNum = Number(store.addServer.sshPort)
        const remoteNum = Number(store.addServer.sshRemotePort)
        const res = await doSshConnect({
          host,
          user,
          port: Number.isFinite(portNum) && portNum > 0 ? portNum : undefined,
          keyFile: store.addServer.sshUseAgent ? undefined : store.addServer.sshKeyFile.trim() || undefined,
          remotePort: Number.isFinite(remoteNum) && remoteNum > 0 ? remoteNum : undefined,
        })
        const conn: ServerConnection.Ssh = {
          type: "ssh",
          host: res.host,
          http: { url: res.url, username: res.username, password: res.password },
        }
        if (store.addServer.name.trim()) conn.displayName = store.addServer.name.trim()
        // Remember the server (no secrets) so it reconnects on next launch.
        void platform.persistSshServer?.({
          host,
          user,
          port: Number.isFinite(portNum) && portNum > 0 ? portNum : undefined,
          keyFile: store.addServer.sshUseAgent ? undefined : store.addServer.sshKeyFile.trim() || undefined,
          remotePort: Number.isFinite(remoteNum) && remoteNum > 0 ? remoteNum : undefined,
          displayName: store.addServer.name.trim() || undefined,
        })
        resetAdd()
        dialog.close()
        server.add(conn)
        navigate("/")
      } catch (err) {
        setStore("addServer", { error: localizeSshError(err), sshPhase: "" })
      }
    },
  }))

  // Live tunnel-phase updates while the SSH form is open.
  createEffect(() => {
    if (!store.addServer.showForm || store.addServer.connType !== "ssh") return
    const unsub = platform.onSshTunnelStatus?.((status) => setStore("addServer", "sshPhase", status.phase))
    onCleanup(() => unsub?.())
  })

  const pickSshKey = async () => {
    const picked = await platform.openFilePickerDialog?.({ title: language.t("server.ssh.field.keyFile") })
    const path = Array.isArray(picked) ? picked[0] : picked
    if (path) setStore("addServer", { sshKeyFile: path, sshUseAgent: false, error: "" })
  }

  const editMutation = useMutation(() => ({
    mutationFn: async (input: { original: ServerConnection.Any; value: string }) => {
      if (input.original.type !== "http") return
      const normalized = normalizeServerUrl(input.value)
      if (!normalized) {
        resetEdit()
        return
      }

      const name = store.editServer.name.trim() || undefined
      const username = store.editServer.username || undefined
      const password = store.editServer.password || undefined
      const existingName = input.original.displayName
      if (
        normalized === input.original.http.url &&
        name === existingName &&
        username === input.original.http.username &&
        password === input.original.http.password
      ) {
        resetEdit()
        return
      }

      const conn: ServerConnection.Http = {
        type: "http",
        displayName: name,
        http: { url: normalized, username, password },
      }
      const result = await checkServerHealth(conn.http)
      if (!result.healthy) {
        setStore("editServer", { error: language.t("dialog.server.add.error") })
        return
      }
      if (normalized === input.original.http.url) {
        server.add(conn)
      } else {
        replaceServer(input.original, conn)
      }

      resetEdit()
    },
  }))

  const replaceServer = (original: ServerConnection.Http, next: ServerConnection.Http) => {
    const active = server.key
    const newConn = server.add(next)
    if (!newConn) return
    const nextActive = active === ServerConnection.key(original) ? ServerConnection.key(newConn) : active
    if (nextActive) server.setActive(nextActive)
    server.remove(ServerConnection.key(original))
  }

  const items = createMemo(() => {
    const current = server.current
    const list = server.list
    if (!current) return list
    if (!list.includes(current)) return [current, ...list]
    return [current, ...list.filter((x) => x !== current)]
  })

  const current = createMemo(() => items().find((x) => ServerConnection.key(x) === server.key) ?? items()[0])

  const sortedItems = createMemo(() => {
    const list = items()
    if (!list.length) return list
    const active = current()
    const order = new Map(list.map((url, index) => [url, index] as const))
    const rank = (value?: ServerHealth) => {
      if (value?.healthy === true) return 0
      if (value?.healthy === false) return 2
      return 1
    }
    return list.slice().sort((a, b) => {
      if (a === active) return -1
      if (b === active) return 1
      const diff = rank(store.status[ServerConnection.key(a)]) - rank(store.status[ServerConnection.key(b)])
      if (diff !== 0) return diff
      return (order.get(a) ?? 0) - (order.get(b) ?? 0)
    })
  })

  async function refreshHealth() {
    const results: Record<ServerConnection.Key, ServerHealth> = {}
    await Promise.all(
      items().map(async (conn) => {
        results[ServerConnection.key(conn)] = await checkServerHealth(conn.http)
      }),
    )
    setStore("status", reconcile(results))
  }

  createEffect(() => {
    items()
    void refreshHealth()
    const interval = setInterval(refreshHealth, 10_000)
    onCleanup(() => clearInterval(interval))
  })

  async function select(conn: ServerConnection.Any, persist?: boolean) {
    if (!persist && store.status[ServerConnection.key(conn)]?.healthy === false) return
    dialog.close()
    if (persist && conn.type === "http") {
      server.add(conn)
      navigate("/")
      return
    }
    navigate("/")
    queueMicrotask(() => server.setActive(ServerConnection.key(conn)))
  }

  const handleAddChange = (value: string) => {
    if (addMutation.isPending) return
    setStore("addServer", { url: value, error: "" })
    void previewStatus(value, store.addServer.username, store.addServer.password, (next) =>
      setStore("addServer", { status: next }),
    )
  }

  const handleAddNameChange = (value: string) => {
    if (addMutation.isPending) return
    setStore("addServer", { name: value, error: "" })
  }

  const handleAddUsernameChange = (value: string) => {
    if (addMutation.isPending) return
    setStore("addServer", { username: value, error: "" })
    void previewStatus(store.addServer.url, value, store.addServer.password, (next) =>
      setStore("addServer", { status: next }),
    )
  }

  const handleAddPasswordChange = (value: string) => {
    if (addMutation.isPending) return
    setStore("addServer", { password: value, error: "" })
    void previewStatus(store.addServer.url, store.addServer.username, value, (next) =>
      setStore("addServer", { status: next }),
    )
  }

  const handleEditChange = (value: string) => {
    if (editMutation.isPending) return
    setStore("editServer", { value, error: "" })
    void previewStatus(value, store.editServer.username, store.editServer.password, (next) =>
      setStore("editServer", { status: next }),
    )
  }

  const handleEditNameChange = (value: string) => {
    if (editMutation.isPending) return
    setStore("editServer", { name: value, error: "" })
  }

  const handleEditUsernameChange = (value: string) => {
    if (editMutation.isPending) return
    setStore("editServer", { username: value, error: "" })
    void previewStatus(store.editServer.value, value, store.editServer.password, (next) =>
      setStore("editServer", { status: next }),
    )
  }

  const handleEditPasswordChange = (value: string) => {
    if (editMutation.isPending) return
    setStore("editServer", { password: value, error: "" })
    void previewStatus(store.editServer.value, store.editServer.username, value, (next) =>
      setStore("editServer", { status: next }),
    )
  }

  const mode = createMemo<"list" | "add" | "edit">(() => {
    if (store.editServer.id) return "edit"
    if (store.addServer.showForm) return "add"
    return "list"
  })

  const editing = createMemo(() => {
    if (!store.editServer.id) return
    return items().find((x) => x.type === "http" && x.http.url === store.editServer.id)
  })

  const resetForm = () => {
    resetAdd()
    resetEdit()
  }

  const startAdd = () => {
    resetEdit()
    setStore("addServer", {
      showForm: true,
      url: "",
      name: "",
      username: DEFAULT_USERNAME,
      password: "",
      error: "",
      status: undefined,
      connType: "http",
      sshHost: "",
      sshUser: "",
      sshPort: "",
      sshKeyFile: "",
      sshUseAgent: true,
      sshRemotePort: "",
      sshPhase: "",
    })
  }

  const startEdit = (conn: ServerConnection.Http) => {
    resetAdd()
    setStore("editServer", {
      id: conn.http.url,
      value: conn.http.url,
      name: conn.displayName ?? "",
      username: conn.http.username ?? "",
      password: conn.http.password ?? "",
      error: "",
      status: store.status[ServerConnection.key(conn)]?.healthy,
    })
  }

  const submitForm = () => {
    if (mode() === "add") {
      if (store.addServer.connType === "ssh") {
        if (sshMutation.isPending) return
        setStore("addServer", { error: "" })
        sshMutation.mutate()
        return
      }
      if (addMutation.isPending) return
      setStore("addServer", { error: "" })
      addMutation.mutate(store.addServer.url)
      return
    }
    const original = editing()
    if (!original) return
    if (editMutation.isPending) return
    setStore("editServer", { error: "" })
    editMutation.mutate({ original, value: store.editServer.value })
  }

  const isFormMode = createMemo(() => mode() !== "list")
  const isAddMode = createMemo(() => mode() === "add")
  const isSshAdd = createMemo(() => isAddMode() && store.addServer.connType === "ssh")
  const formBusy = createMemo(() =>
    isAddMode() ? (isSshAdd() ? sshMutation.isPending : addMutation.isPending) : editMutation.isPending,
  )

  const formTitle = createMemo(() => {
    if (!isFormMode()) return language.t("dialog.server.title")
    return (
      <div class="flex items-center gap-2 -ms-2">
        <IconButton icon="arrow-left" variant="ghost" onClick={resetForm} aria-label={language.t("common.goBack")} />
        <span>{isAddMode() ? language.t("dialog.server.add.title") : language.t("dialog.server.edit.title")}</span>
      </div>
    )
  })

  createEffect(() => {
    if (!store.editServer.id) return
    if (editing()) return
    resetEdit()
  })

  async function handleRemove(url: ServerConnection.Key) {
    server.remove(url)
    if ((await platform.getDefaultServer?.()) === url) {
      void platform.setDefaultServer?.(null)
    }
  }

  // SQUADCODER: tear down an SSH server — close the tunnel (+ best-effort stop the remote engine) then
  // drop it from the list.
  const handleDisconnectSsh = (conn: ServerConnection.Any) => {
    if (conn.type !== "ssh") return
    doSshDisconnect(conn.host)
    void platform.forgetSshServer?.(conn.host)
    server.remove(ServerConnection.key(conn))
  }

  return (
    <Dialog title={formTitle()}>
      <div class="flex flex-1 min-h-0 flex-col gap-2">
        <Show
          when={!isFormMode()}
          fallback={
            <div class="flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto">
              <Show when={isAddMode() && sshAvailable()}>
                <div class="px-5">
                  <div class="inline-flex rounded-md bg-surface-base p-0.5">
                    <button
                      type="button"
                      disabled={formBusy()}
                      onClick={() => setStore("addServer", { connType: "http", error: "" })}
                      class={`text-12-medium px-3 py-1.5 rounded-[5px] transition-colors ${
                        store.addServer.connType === "http"
                          ? "bg-surface-raised-base text-text-base"
                          : "text-text-weak hover:text-text-base"
                      }`}
                    >
                      {language.t("server.ssh.type.http")}
                    </button>
                    <button
                      type="button"
                      disabled={formBusy()}
                      onClick={() => setStore("addServer", { connType: "ssh", error: "" })}
                      class={`text-12-medium px-3 py-1.5 rounded-[5px] transition-colors ${
                        store.addServer.connType === "ssh"
                          ? "bg-surface-raised-base text-text-base"
                          : "text-text-weak hover:text-text-base"
                      }`}
                    >
                      {language.t("server.ssh.type.ssh")}
                    </button>
                  </div>
                </div>
              </Show>
              <Show
                when={isSshAdd()}
                fallback={
                  <ServerForm
                    value={isAddMode() ? store.addServer.url : store.editServer.value}
                    name={isAddMode() ? store.addServer.name : store.editServer.name}
                    username={isAddMode() ? store.addServer.username : store.editServer.username}
                    password={isAddMode() ? store.addServer.password : store.editServer.password}
                    placeholder={language.t("dialog.server.add.placeholder")}
                    busy={formBusy()}
                    error={isAddMode() ? store.addServer.error : store.editServer.error}
                    status={isAddMode() ? store.addServer.status : store.editServer.status}
                    onChange={isAddMode() ? handleAddChange : handleEditChange}
                    onNameChange={isAddMode() ? handleAddNameChange : handleEditNameChange}
                    onUsernameChange={isAddMode() ? handleAddUsernameChange : handleEditUsernameChange}
                    onPasswordChange={isAddMode() ? handleAddPasswordChange : handleEditPasswordChange}
                    onSubmit={submitForm}
                    onBack={resetForm}
                  />
                }
              >
                <SshForm
                  host={store.addServer.sshHost}
                  user={store.addServer.sshUser}
                  port={store.addServer.sshPort}
                  keyFile={store.addServer.sshKeyFile}
                  useAgent={store.addServer.sshUseAgent}
                  remotePort={store.addServer.sshRemotePort}
                  name={store.addServer.name}
                  busy={formBusy()}
                  error={store.addServer.error}
                  phase={store.addServer.sshPhase}
                  onHostChange={(v) => setStore("addServer", { sshHost: v, error: "" })}
                  onUserChange={(v) => setStore("addServer", { sshUser: v, error: "" })}
                  onPortChange={(v) => setStore("addServer", { sshPort: v, error: "" })}
                  onRemotePortChange={(v) => setStore("addServer", { sshRemotePort: v, error: "" })}
                  onNameChange={(v) => setStore("addServer", { name: v, error: "" })}
                  onUseAgentChange={(v) => setStore("addServer", { sshUseAgent: v, error: "" })}
                  onKeyFileChange={(v) => setStore("addServer", { sshKeyFile: v, error: "" })}
                  onPickKey={pickSshKey}
                  canBrowse={typeof platform.openFilePickerDialog === "function"}
                  onSubmit={submitForm}
                  onBack={resetForm}
                  onImport={(entry) =>
                    setStore("addServer", {
                      // connect to the real address; ssh aliases aren't resolved by our own arg builder
                      sshHost: entry.hostName || entry.host,
                      sshUser: entry.user ?? store.addServer.sshUser,
                      sshPort: entry.port ? String(entry.port) : store.addServer.sshPort,
                      sshKeyFile: entry.identityFile ?? store.addServer.sshKeyFile,
                      sshUseAgent: entry.identityFile ? false : store.addServer.sshUseAgent,
                      name: store.addServer.name || entry.host,
                      error: "",
                    })
                  }
                />
              </Show>
            </div>
          }
        >
          <List
            search={{
              placeholder: language.t("dialog.server.search.placeholder"),
              autofocus: false,
            }}
            noInitialSelection
            emptyMessage={language.t("dialog.server.empty")}
            items={sortedItems}
            key={(x) => x.http.url}
            onSelect={(x) => {
              if (x) void select(x)
            }}
            divider={true}
            class="flex-1 min-h-0 px-5 [&_[data-slot=list-search-wrapper]]:w-full [&_[data-slot=list-scroll]]:flex-1 [&_[data-slot=list-scroll]]:overflow-y-auto [&_[data-slot=list-items]]:bg-surface-base [&_[data-slot=list-items]]:rounded-md [&_[data-slot=list-item]]:min-h-14 [&_[data-slot=list-item]]:p-3 [&_[data-slot=list-item]]:!bg-transparent"
          >
            {(i) => {
              const key = ServerConnection.key(i)
              return (
                <div class="flex items-center gap-3 min-w-0 flex-1 w-full group/item">
                  <div class="flex flex-col h-full items-start w-5">
                    <ServerHealthIndicator health={store.status[key]} />
                  </div>
                  <ServerRow
                    conn={i}
                    dimmed={store.status[key]?.healthy === false}
                    status={store.status[key]}
                    class="flex items-center gap-3 min-w-0 flex-1"
                    badge={
                      <Show when={defaultKey() === ServerConnection.key(i)}>
                        <span class="text-text-base bg-surface-base text-14-regular px-1.5 rounded-xs">
                          {language.t("dialog.server.status.default")}
                        </span>
                      </Show>
                    }
                    showCredentials
                  />
                  <div class="flex items-center justify-center gap-4 ps-4">
                    <Show when={ServerConnection.key(current()) === key}>
                      <Icon name="check" class="h-6" />
                    </Show>

                    <Show when={i.type === "http"}>
                      <DropdownMenu>
                        <DropdownMenu.Trigger
                          as={IconButton}
                          icon="dot-grid"
                          variant="ghost"
                          class="shrink-0 size-8 hover:bg-surface-base-hover data-[expanded]:bg-surface-base-active"
                          onClick={(e: MouseEvent) => e.stopPropagation()}
                          onPointerDown={(e: PointerEvent) => e.stopPropagation()}
                        />
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content class="mt-1">
                            <DropdownMenu.Item
                              onSelect={() => {
                                if (i.type !== "http") return
                                startEdit(i)
                              }}
                            >
                              <DropdownMenu.ItemLabel>{language.t("dialog.server.menu.edit")}</DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                            <Show when={canDefault() && defaultKey() !== key}>
                              <DropdownMenu.Item onSelect={() => setDefault(key)}>
                                <DropdownMenu.ItemLabel>
                                  {language.t("dialog.server.menu.default")}
                                </DropdownMenu.ItemLabel>
                              </DropdownMenu.Item>
                            </Show>
                            <Show when={canDefault() && defaultKey() === key}>
                              <DropdownMenu.Item onSelect={() => setDefault(null)}>
                                <DropdownMenu.ItemLabel>
                                  {language.t("dialog.server.menu.defaultRemove")}
                                </DropdownMenu.ItemLabel>
                              </DropdownMenu.Item>
                            </Show>
                            <DropdownMenu.Separator />
                            <DropdownMenu.Item
                              onSelect={() => handleRemove(ServerConnection.key(i))}
                              class="text-text-on-critical-base hover:bg-surface-critical-weak"
                            >
                              <DropdownMenu.ItemLabel>{language.t("dialog.server.menu.delete")}</DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu>
                    </Show>

                    <Show when={i.type === "ssh"}>
                      <DropdownMenu>
                        <DropdownMenu.Trigger
                          as={IconButton}
                          icon="dot-grid"
                          variant="ghost"
                          class="shrink-0 size-8 hover:bg-surface-base-hover data-[expanded]:bg-surface-base-active"
                          onClick={(e: MouseEvent) => e.stopPropagation()}
                          onPointerDown={(e: PointerEvent) => e.stopPropagation()}
                        />
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content class="mt-1">
                            <DropdownMenu.Item
                              onSelect={() => handleDisconnectSsh(i)}
                              class="text-text-on-critical-base hover:bg-surface-critical-weak"
                            >
                              <DropdownMenu.ItemLabel>{language.t("server.ssh.disconnect")}</DropdownMenu.ItemLabel>
                            </DropdownMenu.Item>
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu>
                    </Show>
                  </div>
                </div>
              )
            }}
          </List>
        </Show>

        <div class="shrink-0 px-5 pb-5">
          <Show
            when={isFormMode()}
            fallback={
              <Button
                variant="secondary"
                icon="plus-small"
                size="large"
                onClick={startAdd}
                class="py-1.5 ps-1.5 pe-3 flex items-center gap-1.5"
              >
                {language.t("dialog.server.add.button")}
              </Button>
            }
          >
            <Button variant="primary" size="large" onClick={submitForm} disabled={formBusy()} class="px-3 py-1.5">
              {formBusy()
                ? isSshAdd()
                  ? language.t("server.ssh.connecting")
                  : language.t("dialog.server.add.checking")
                : isSshAdd()
                  ? language.t("server.ssh.connect")
                  : isAddMode()
                    ? language.t("dialog.server.add.button")
                    : language.t("common.save")}
            </Button>
          </Show>
        </div>
      </div>
    </Dialog>
  )
}
