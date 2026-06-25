import { Button } from "@squadcoder/ui/button"
import { useDialog } from "@squadcoder/ui/context/dialog"
import { Icon } from "@squadcoder/ui/icon"
import { Switch } from "@squadcoder/ui/switch"
import { Tabs } from "@squadcoder/ui/tabs"
import { useMutation } from "@tanstack/solid-query"
import { showToast } from "@squadcoder/ui/toast"
import type { PermissionActionConfig } from "@squadcoder/sdk/v2/client"
import { useNavigate } from "@solidjs/router"
import { type Accessor, createEffect, createMemo, For, type JSXElement, onCleanup, Show } from "solid-js"
import { createStore, reconcile } from "solid-js/store"
import { DialogAgentModel } from "@/components/dialog-agent-model"
import { ServerHealthIndicator, ServerRow } from "@/components/server/server-row"
import { useLanguage } from "@/context/language"
import { useModels } from "@/context/models"
import { usePlatform } from "@/context/platform"
import { useSDK } from "@/context/sdk"
import { normalizeServerUrl, ServerConnection, useServer } from "@/context/server"
import { useSync } from "@/context/sync"
import { useCheckServerHealth, type ServerHealth } from "@/utils/server-health"

const pollMs = 10_000

// SQUADCODER: a plugin spec is either an npm `name@version` (incl. scoped `@scope/name`) or a
// local file path / file:// URL. npm names display as-is; local plugins show a clean filename
// (e.g. "anthropic-oauth") instead of the full `file:///C:/Users/.../anthropic-oauth.js` path.
// The full spec stays available on hover (title).
function pluginLabel(spec: string): string {
  const isFile = spec.startsWith("file://") || /^([a-zA-Z]:[\\/]|\/|\.\.?[\\/])/.test(spec)
  if (!isFile) return spec
  const base = spec.replace(/^file:\/\//, "").split(/[\\/]/).pop() ?? spec
  return base.replace(/\.(c|m)?[jt]s$/i, "") || spec
}

const pluginEmptyMessage = (value: string, file: string): JSXElement => {
  const parts = value.split(file)
  if (parts.length === 1) return value
  return (
    <>
      {parts[0]}
      <code class="bg-surface-raised-base px-1.5 py-0.5 rounded-sm text-text-base">{file}</code>
      {parts.slice(1).join(file)}
    </>
  )
}

const listServersByHealth = (
  list: ServerConnection.Any[],
  active: ServerConnection.Key | undefined,
  status: Record<ServerConnection.Key, ServerHealth | undefined>,
) => {
  if (!list.length) return list
  const order = new Map(list.map((url, index) => [url, index] as const))
  const rank = (value?: ServerHealth) => {
    if (value?.healthy === true) return 0
    if (value?.healthy === false) return 2
    return 1
  }

  return list.slice().sort((a, b) => {
    if (ServerConnection.key(a) === active) return -1
    if (ServerConnection.key(b) === active) return 1
    const diff = rank(status[ServerConnection.key(a)]) - rank(status[ServerConnection.key(b)])
    if (diff !== 0) return diff
    return (order.get(a) ?? 0) - (order.get(b) ?? 0)
  })
}

const useServerHealth = (servers: Accessor<ServerConnection.Any[]>, enabled: Accessor<boolean>) => {
  const checkServerHealth = useCheckServerHealth()
  const [status, setStatus] = createStore({} as Record<ServerConnection.Key, ServerHealth | undefined>)

  createEffect(() => {
    if (!enabled()) {
      setStatus(reconcile({}))
      return
    }
    const list = servers()
    let dead = false

    const refresh = async () => {
      const results: Record<string, ServerHealth> = {}
      await Promise.all(
        list.map(async (conn) => {
          results[ServerConnection.key(conn)] = await checkServerHealth(conn.http)
        }),
      )
      if (dead) return
      setStatus(reconcile(results))
    }

    void refresh()
    const id = setInterval(() => void refresh(), pollMs)
    onCleanup(() => {
      dead = true
      clearInterval(id)
    })
  })

  return status
}

const useDefaultServerKey = (
  get: (() => string | Promise<string | null | undefined> | null | undefined) | undefined,
) => {
  const [state, setState] = createStore({
    url: undefined as string | undefined,
    tick: 0,
  })

  createEffect(() => {
    state.tick
    let dead = false
    const result = get?.()
    if (!result) {
      setState("url", undefined)
      onCleanup(() => {
        dead = true
      })
      return
    }

    if (result instanceof Promise) {
      void result.then((next) => {
        if (dead) return
        setState("url", next ? normalizeServerUrl(next) : undefined)
      })
      onCleanup(() => {
        dead = true
      })
      return
    }

    setState("url", normalizeServerUrl(result))
    onCleanup(() => {
      dead = true
    })
  })

  return {
    key: () => {
      const u = state.url
      if (!u) return
      return ServerConnection.key({ type: "http", http: { url: u } })
    },
    refresh: () => setState("tick", (value) => value + 1),
  }
}

const useMcpToggleMutation = () => {
  const sync = useSync()
  const sdk = useSDK()
  const language = useLanguage()

  return useMutation(() => ({
    mutationFn: async (name: string) => {
      const status = sync.data.mcp[name]
      await (status?.status === "connected" ? sdk.client.mcp.disconnect({ name }) : sdk.client.mcp.connect({ name }))
      const result = await sdk.client.mcp.status()
      if (result.data) sync.set("mcp", result.data)
    },
    onError: (err) => {
      showToast({
        variant: "error",
        title: language.t("common.requestFailed"),
        description: err instanceof Error ? err.message : String(err),
      })
    },
  }))
}

const skillPermissionMap = (config: { permission?: unknown }): Record<string, PermissionActionConfig> => {
  const perm = config.permission as { skill?: unknown } | string | undefined
  if (perm && typeof perm === "object" && perm.skill && typeof perm.skill === "object") {
    return perm.skill as Record<string, PermissionActionConfig>
  }
  return {}
}

// Effective enabled state, mirroring the engine's Permission.evaluate precedence: an explicit
// per-skill rule wins, otherwise fall back to the "*" wildcard (so a deny-all + allow-core config
// shows the non-core skills as OFF instead of all-ON).
const skillRuleEnabled = (map: Record<string, PermissionActionConfig>, name: string): boolean => {
  const explicit = map[name]
  if (explicit === "deny") return false
  if (explicit === "allow") return true
  return map["*"] !== "deny"
}

const useSkillToggleMutation = () => {
  const sync = useSync()
  const sdk = useSDK()
  const language = useLanguage()

  return useMutation(() => ({
    // Disable/enable a skill via the engine's existing `permission.skill` rule
    // (Skill.available() drops a skill whose evaluated action is "deny"). Explicit
    // "allow" re-enables (overrides a prior "deny" through the engine's mergeDeep).
    mutationFn: async (name: string) => {
      const current = skillPermissionMap(sync.data.config)
      // Toggle relative to the EFFECTIVE state (honours the "*" wildcard), so clicking a skill that's
      // off-via-wildcard turns it on (explicit "allow") rather than redundantly re-denying it.
      const next: Record<string, PermissionActionConfig> = { ...current, [name]: skillRuleEnabled(current, name) ? "deny" : "allow" }
      await sdk.client.config.update({ config: { permission: { skill: next } } })
      const perm = sync.data.config.permission
      const base = perm && typeof perm === "object" ? (perm as Record<string, unknown>) : {}
      sync.set("config", "permission", { ...base, skill: next } as never)
    },
    onError: (err) => {
      showToast({
        variant: "error",
        title: language.t("common.requestFailed"),
        description: err instanceof Error ? err.message : String(err),
      })
    },
  }))
}

export function StatusPopoverBody(props: { shown: Accessor<boolean>; onClose?: () => void }) {
  const sync = useSync()
  const server = useServer()
  const platform = usePlatform()
  const dialog = useDialog()
  const language = useLanguage()
  const navigate = useNavigate()
  const sdk = useSDK()

  const [load, setLoad] = createStore({
    lspDone: false,
    lspLoading: false,
    mcpDone: false,
    mcpLoading: false,
    skillsDone: false,
    skillsLoading: false,
  })

  const [skillState, setSkillState] = createStore({
    list: [] as Array<{ name: string; description: string; location: string; hidden?: boolean }>,
    ready: false,
  })

  const fail = (err: unknown) => {
    showToast({
      variant: "error",
      title: language.t("common.requestFailed"),
      description: err instanceof Error ? err.message : String(err),
    })
  }

  createEffect(() => {
    if (!props.shown()) return

    if (!sync.data.mcp_ready && !load.mcpDone && !load.mcpLoading) {
      setLoad("mcpLoading", true)
      void sdk.client.mcp
        .status()
        .then((result) => {
          sync.set("mcp", result.data ?? {})
          sync.set("mcp_ready", true)
        })
        .catch((err) => {
          setLoad("mcpDone", true)
          fail(err)
        })
        .finally(() => {
          setLoad("mcpLoading", false)
        })
    }

    if (!sync.data.lsp_ready && !load.lspDone && !load.lspLoading) {
      setLoad("lspLoading", true)
      void sdk.client.lsp
        .status()
        .then((result) => {
          sync.set("lsp", result.data ?? [])
          sync.set("lsp_ready", true)
        })
        .catch((err) => {
          setLoad("lspDone", true)
          fail(err)
        })
        .finally(() => {
          setLoad("lspLoading", false)
        })
    }

    if (!skillState.ready && !load.skillsDone && !load.skillsLoading) {
      setLoad("skillsLoading", true)
      void sdk.client.app
        .skills()
        .then((result) => {
          setSkillState("list", reconcile(result.data ?? []))
          setSkillState("ready", true)
        })
        .catch((err) => {
          setLoad("skillsDone", true)
          fail(err)
        })
        .finally(() => {
          setLoad("skillsLoading", false)
        })
    }
  })

  let dialogRun = 0
  let dialogDead = false
  onCleanup(() => {
    dialogDead = true
    dialogRun += 1
  })
  const servers = createMemo(() => {
    const current = server.current
    const list = server.list
    if (!current) return list
    if (list.every((item) => ServerConnection.key(item) !== ServerConnection.key(current))) return [current, ...list]
    return [current, ...list.filter((item) => ServerConnection.key(item) !== ServerConnection.key(current))]
  })
  const health = useServerHealth(servers, props.shown)
  const sortedServers = createMemo(() => listServersByHealth(servers(), server.key, health))
  const toggleMcp = useMcpToggleMutation()
  const defaultServer = useDefaultServerKey(platform.getDefaultServer)
  const mcpNames = createMemo(() => Object.keys(sync.data.mcp ?? {}).sort((a, b) => a.localeCompare(b)))
  const mcpStatus = (name: string) => sync.data.mcp?.[name]?.status
  const mcpConnected = createMemo(() => mcpNames().filter((name) => mcpStatus(name) === "connected").length)
  const lspItems = createMemo(() => sync.data.lsp ?? [])
  const lspCount = createMemo(() => lspItems().length)
  const plugins = createMemo(() =>
    (sync.data.config.plugin ?? []).map((item) => (typeof item === "string" ? item : item[0])),
  )
  const pluginCount = createMemo(() => plugins().length)
  const pluginEmpty = createMemo(() => pluginEmptyMessage(language.t("dialog.plugins.empty"), "squadcoder.json"))
  const skillItems = createMemo(() =>
    skillState.list.filter((skill) => !skill.hidden).slice().sort((a, b) => a.name.localeCompare(b.name)),
  )
  const skillCount = createMemo(() => skillItems().length)
  const skillsDir = createMemo(() => {
    const sample = skillState.list[0]?.location
    const dir = sample ? sample.replace(/[\\/][^\\/]*[\\/]SKILL\.md$/i, "") : `${sdk.directory}/.squadcoder/skills`
    return dir
  })
  const openSkill = (location: string) => {
    if (!platform.openPath) return
    void platform.openPath(location).catch(fail)
  }
  const toggleSkill = useSkillToggleMutation()
  const skillEnabled = (name: string) => skillRuleEnabled(skillPermissionMap(sync.data.config), name)

  // #37 per-agent model: list non-hidden agents (incl. Team roles) + a model picker each.
  // Writing config.agent[name].model persists via the per-directory config.update (#55 fix).
  const models = useModels()
  const agentItems = createMemo(() =>
    (sync.data.agent ?? []).filter((a) => !a.hidden).slice().sort((a, b) => a.name.localeCompare(b.name)),
  )
  const agentCount = createMemo(() => agentItems().length)
  const agentCurrentModel = (agent: { model?: { modelID: string; providerID: string } }) =>
    agent.model
      ? models.list().find((m) => m.id === agent.model!.modelID && m.provider.id === agent.model!.providerID)
      : undefined
  const setAgentModel = async (agent: string, providerID: string, modelID: string) => {
    try {
      await sdk.client.config.update({ config: { agent: { [agent]: { model: `${providerID}/${modelID}` } } } })
    } catch (err) {
      fail(err)
    }
  }

  // #67 top-bar shortcut: deep-link from a popover tab straight into the matching Settings section.
  // Show the dialog FIRST, then close the popover — closing it first unmounts this component, which
  // sets dialogDead and the async import then bailed before dialog.show ran (the "click does nothing"
  // bug). dialog.show targets the root dialog owner, so it's safe to call as the popover tears down.
  const openSettings = (section: string) => {
    const run = ++dialogRun
    void import("./dialog-settings").then((x) => {
      if (dialogRun !== run) return // superseded by a newer openSettings (e.g. popover dismissed)
      dialog.show(() => <x.DialogSettings section={section} />)
      props.onClose?.()
    })
  }

  const ManageInSettings = (manageProps: { section: string }) => (
    <Button variant="secondary" class="mt-3 self-start h-8 px-3 py-1.5" onClick={() => openSettings(manageProps.section)}>
      {language.t("status.popover.action.manageInSettings")}
    </Button>
  )

  return (
    <div class="flex items-center gap-1 w-[420px] rounded-xl shadow-[var(--shadow-lg-border-base)]">
      <Tabs
        aria-label={language.t("status.popover.ariaLabel")}
        class="tabs bg-background-strong rounded-xl overflow-hidden"
        data-component="tabs"
        data-active="servers"
        defaultValue="servers"
        variant="alt"
      >
        <Tabs.List data-slot="tablist" class="bg-transparent border-b-0 px-4 pt-2 pb-0 gap-4 h-10">
          <Tabs.Trigger value="servers" data-slot="tab" class="text-12-regular">
            {sortedServers().length > 0 ? `${sortedServers().length} ` : ""}
            {language.t("status.popover.tab.servers")}
          </Tabs.Trigger>
          <Tabs.Trigger value="mcp" data-slot="tab" class="text-12-regular">
            {mcpConnected() > 0 ? `${mcpConnected()} ` : ""}
            {language.t("status.popover.tab.mcp")}
          </Tabs.Trigger>
          <Tabs.Trigger value="lsp" data-slot="tab" class="text-12-regular">
            {lspCount() > 0 ? `${lspCount()} ` : ""}
            {language.t("status.popover.tab.lsp")}
          </Tabs.Trigger>
          <Tabs.Trigger value="plugins" data-slot="tab" class="text-12-regular">
            {pluginCount() > 0 ? `${pluginCount()} ` : ""}
            {language.t("status.popover.tab.plugins")}
          </Tabs.Trigger>
          <Tabs.Trigger value="skills" data-slot="tab" class="text-12-regular">
            {skillCount() > 0 ? `${skillCount()} ` : ""}
            {language.t("status.popover.tab.skills")}
          </Tabs.Trigger>
          <Tabs.Trigger value="agents" data-slot="tab" class="text-12-regular">
            {agentCount() > 0 ? `${agentCount()} ` : ""}
            {language.t("status.popover.tab.agents")}
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="servers">
          <div class="flex flex-col px-2 pb-2">
            <div class="flex flex-col p-3 bg-background-base rounded-sm min-h-14">
              <For each={sortedServers()}>
                {(s) => {
                  const key = ServerConnection.key(s)
                  const blocked = () => health[key]?.healthy === false
                  return (
                    <button
                      type="button"
                      class="flex items-center gap-2 w-full h-8 ps-3 pe-1.5 py-1.5 rounded-md transition-colors text-start"
                      classList={{
                        "hover:bg-surface-raised-base-hover": !blocked(),
                        "cursor-not-allowed": blocked(),
                      }}
                      aria-disabled={blocked()}
                      onClick={() => {
                        if (blocked()) return
                        navigate("/")
                        queueMicrotask(() => server.setActive(key))
                      }}
                    >
                      <ServerHealthIndicator health={health[key]} />
                      <ServerRow
                        conn={s}
                        dimmed={blocked()}
                        status={health[key]}
                        class="flex items-center gap-2 w-full min-w-0"
                        nameClass="text-14-regular text-text-base truncate"
                        versionClass="text-12-regular text-text-weak truncate"
                        badge={
                          <Show when={key === defaultServer.key()}>
                            <span class="text-11-regular text-text-base bg-surface-base px-1.5 py-0.5 rounded-md">
                              {language.t("common.default")}
                            </span>
                          </Show>
                        }
                      >
                        <div class="flex-1" />
                        <Show when={server.current && key === ServerConnection.key(server.current)}>
                          <Icon name="check" size="small" class="text-icon-weak shrink-0" />
                        </Show>
                      </ServerRow>
                    </button>
                  )
                }}
              </For>

              <div class="flex items-center gap-2 flex-wrap">
                <Button
                  variant="secondary"
                  class="mt-3 self-start h-8 px-3 py-1.5"
                  onClick={() => {
                    const run = ++dialogRun
                    void import("./dialog-select-server").then((x) => {
                      if (dialogDead || dialogRun !== run) return
                      dialog.show(() => <x.DialogSelectServer />, defaultServer.refresh)
                    })
                  }}
                >
                  {language.t("status.popover.action.manageServers")}
                </Button>
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="mcp">
          <div class="flex flex-col px-2 pb-2">
            <div class="flex flex-col p-3 bg-background-base rounded-sm min-h-14">
              <Show
                when={mcpNames().length > 0}
                fallback={
                  <div class="text-14-regular text-text-base text-center my-auto">{language.t("dialog.mcp.empty")}</div>
                }
              >
                <For each={mcpNames()}>
                  {(name) => {
                    const status = () => mcpStatus(name)
                    const enabled = () => status() === "connected"
                    return (
                      <button
                        type="button"
                        class="flex items-center gap-2 w-full h-8 ps-3 pe-2 py-1 rounded-md hover:bg-surface-raised-base-hover transition-colors text-start"
                        onClick={() => {
                          if (toggleMcp.isPending) return
                          toggleMcp.mutate(name)
                        }}
                        disabled={toggleMcp.isPending && toggleMcp.variables === name}
                      >
                        <div
                          classList={{
                            "size-1.5 rounded-full shrink-0": true,
                            "bg-icon-success-base": status() === "connected",
                            "bg-icon-critical-base": status() === "failed",
                            "bg-border-weak-base": status() === "disabled",
                            "bg-icon-warning-base":
                              status() === "needs_auth" || status() === "needs_client_registration",
                          }}
                        />
                        <span class="text-14-regular text-text-base truncate flex-1">{name}</span>
                        <div onClick={(event) => event.stopPropagation()}>
                          <Switch
                            checked={enabled()}
                            disabled={toggleMcp.isPending && toggleMcp.variables === name}
                            onChange={() => {
                              if (toggleMcp.isPending) return
                              toggleMcp.mutate(name)
                            }}
                          />
                        </div>
                      </button>
                    )
                  }}
                </For>
              </Show>
              <ManageInSettings section="mcp" />
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="lsp">
          <div class="flex flex-col px-2 pb-2">
            <div class="flex flex-col p-3 bg-background-base rounded-sm min-h-14">
              <Show
                when={lspItems().length > 0}
                fallback={
                  <div class="text-14-regular text-text-base text-center my-auto">{language.t("dialog.lsp.empty")}</div>
                }
              >
                <For each={lspItems()}>
                  {(item) => (
                    <div class="flex items-center gap-2 w-full px-2 py-1">
                      <div
                        classList={{
                          "size-1.5 rounded-full shrink-0": true,
                          "bg-icon-success-base": item.status === "connected",
                          "bg-icon-critical-base": item.status === "error",
                        }}
                      />
                      <span class="text-14-regular text-text-base truncate">{item.name || item.id}</span>
                    </div>
                  )}
                </For>
              </Show>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="plugins">
          <div class="flex flex-col px-2 pb-2">
            <div class="flex flex-col p-3 bg-background-base rounded-sm min-h-14">
              <Show
                when={plugins().length > 0}
                fallback={<div class="text-14-regular text-text-base text-center my-auto">{pluginEmpty()}</div>}
              >
                <For each={plugins()}>
                  {(plugin) => (
                    <div class="flex items-center gap-2 w-full px-2 py-1">
                      <div class="size-1.5 rounded-full shrink-0 bg-icon-success-base" />
                      <span class="text-14-regular text-text-base truncate" title={plugin}>
                        {pluginLabel(plugin)}
                      </span>
                    </div>
                  )}
                </For>
              </Show>
              <ManageInSettings section="plugins" />
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="skills">
          <div class="flex flex-col px-2 pb-2">
            <div class="flex flex-col p-3 bg-background-base rounded-sm min-h-14 max-h-72 overflow-y-auto">
              <Show
                when={skillItems().length > 0}
                fallback={
                  <div class="text-14-regular text-text-base text-center my-auto px-2">
                    {language.t("dialog.skills.empty")}
                  </div>
                }
              >
                <For each={skillItems()}>
                  {(skill) => {
                    const interactive = () => Boolean(platform.openPath)
                    const enabled = () => skillEnabled(skill.name)
                    const busy = () => toggleSkill.isPending && toggleSkill.variables === skill.name
                    return (
                      <div class="flex items-start gap-2 w-full ps-2 pe-1.5 py-1.5 rounded-md hover:bg-surface-raised-base-hover transition-colors">
                        <button
                          type="button"
                          class="flex items-start gap-2 min-w-0 flex-1 text-start"
                          classList={{ "cursor-pointer": interactive(), "cursor-default": !interactive() }}
                          disabled={!interactive()}
                          title={skill.location}
                          onClick={() => openSkill(skill.location)}
                        >
                          <div
                            classList={{
                              "size-1.5 rounded-full shrink-0 mt-1.5": true,
                              "bg-icon-success-base": enabled(),
                              "bg-border-weak-base": !enabled(),
                            }}
                          />
                          <div class="flex flex-col min-w-0 flex-1">
                            <span
                              class="text-14-regular truncate"
                              classList={{ "text-text-base": enabled(), "text-text-weak": !enabled() }}
                            >
                              {skill.name}
                            </span>
                            <span class="text-12-regular text-text-weak line-clamp-2" dir="auto">
                              {skill.description}
                            </span>
                          </div>
                        </button>
                        <div onClick={(event) => event.stopPropagation()} class="mt-0.5">
                          <Switch
                            checked={enabled()}
                            disabled={busy()}
                            onChange={() => {
                              if (toggleSkill.isPending) return
                              toggleSkill.mutate(skill.name)
                            }}
                          />
                        </div>
                      </div>
                    )
                  }}
                </For>
              </Show>

              <div class="flex items-center gap-2 flex-wrap">
                <Show when={platform.openPath}>
                  <Button
                    variant="secondary"
                    class="mt-3 self-start h-8 px-3 py-1.5"
                    onClick={() => {
                      if (!platform.openPath) return
                      void platform.openPath(skillsDir()).catch(fail)
                    }}
                  >
                    {language.t("dialog.skills.action.manage")}
                  </Button>
                </Show>
                <ManageInSettings section="skills" />
              </div>
            </div>
          </div>
        </Tabs.Content>

        <Tabs.Content value="agents">
          <div class="flex flex-col px-2 pb-2">
            <div class="flex flex-col p-3 bg-background-base rounded-sm min-h-14 max-h-72 overflow-y-auto gap-0.5">
              <Show
                when={agentItems().length > 0}
                fallback={
                  <div class="text-14-regular text-text-base text-center my-auto">
                    {language.t("dialog.agents.empty")}
                  </div>
                }
              >
                <For each={agentItems()}>
                  {(agent) => {
                    const current = () => agentCurrentModel(agent)
                    return (
                      <div class="flex items-center gap-2 w-full ps-2 pe-1 py-1">
                        <span class="text-13-regular text-text-base truncate flex-1 capitalize">{agent.name}</span>
                        {/* #37: open a MODAL model picker (the popover is non-modal → a nested Select can't work) */}
                        <button
                          type="button"
                          class="shrink-0 max-w-[150px] truncate text-13-regular text-text-base bg-surface-raised-base hover:bg-surface-raised-base-hover rounded-md px-2.5 h-7 flex items-center gap-1.5"
                          onClick={() =>
                            dialog.show(() => (
                              <DialogAgentModel
                                agent={agent.name}
                                current={current()}
                                onSelect={(providerID, modelID) => void setAgentModel(agent.name, providerID, modelID)}
                              />
                            ))
                          }
                        >
                          <span class="truncate">
                            {current()?.name ?? language.t("dialog.agents.chooseModel")}
                          </span>
                          <Icon name="chevron-down" size="small" class="text-icon-weak shrink-0" />
                        </button>
                      </div>
                    )
                  }}
                </For>
              </Show>
              <ManageInSettings section="agents" />
            </div>
          </div>
        </Tabs.Content>
      </Tabs>
    </div>
  )
}
