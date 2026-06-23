import { Component, createEffect, createMemo, on, Show } from "solid-js"
import { createStore } from "solid-js/store"
import type { Config } from "@squadcoder/sdk/v2/client"
import { useSync } from "@/context/sync"
import { useSDK } from "@/context/sdk"
import { Dialog } from "@squadcoder/ui/dialog"
import { List } from "@squadcoder/ui/list"
import { Switch } from "@squadcoder/ui/switch"
import { showToast } from "@squadcoder/ui/toast"
import { useLanguage } from "@/context/language"

const statusLabels = {
  connected: "mcp.status.connected",
  failed: "mcp.status.failed",
  needs_auth: "mcp.status.needs_auth",
  disabled: "mcp.status.disabled",
} as const

export const DialogSelectMcp: Component = () => {
  const sync = useSync()
  const sdk = useSDK()
  const language = useLanguage()
  const [state, setState] = createStore({
    done: false,
    loading: false,
  })
  // Per-server toggle state: "enabling"/"disabling" while that server's op + status refetch is in
  // flight, undefined when idle. Keyed by name so multiple servers toggle independently (no single
  // global isPending blocking the whole list) and doubles as the optimistic intended switch value.
  const [toggleState, setToggleState] = createStore<Record<string, "enabling" | "disabling" | undefined>>({})

  createEffect(
    on(
      () => sync.data.mcp_ready,
      (ready, prev) => {
        if (!ready && prev) setState("done", false)
      },
      { defer: true },
    ),
  )

  createEffect(() => {
    if (state.done || state.loading) return
    if (sync.data.mcp_ready) {
      setState("done", true)
      return
    }

    setState("loading", true)
    void sdk.client.mcp
      .status()
      .then((result) => {
        sync.set("mcp", result.data ?? {})
        sync.set("mcp_ready", true)
        setState("done", true)
      })
      .catch((err) => {
        setState("done", true)
        showToast({
          variant: "error",
          title: language.t("common.requestFailed"),
          description: err instanceof Error ? err.message : String(err),
        })
      })
      .finally(() => {
        setState("loading", false)
      })
  })

  const items = createMemo(() =>
    Object.entries(sync.data.mcp ?? {})
      .map(([name, status]) => ({ name, status: status.status }))
      .sort((a, b) => a.name.localeCompare(b.name)),
  )

  // Switch reflects the optimistic intended value while a toggle is in flight, else the real
  // connected status. This is what kills the "blinks back to the previous value" symptom: the
  // switch flips instantly on click and only reconciles to reality on settle.
  const enabledOf = (name: string) => {
    const t = toggleState[name]
    if (t === "enabling") return true
    if (t === "disabling") return false
    return sync.data.mcp[name]?.status === "connected"
  }

  // Live toggle without a global busy flag: persist the config flag, connect/disconnect at runtime,
  // then refetch status. Per-server pending means toggling server A never blocks or reverts server B.
  const toggle = async (name: string) => {
    if (toggleState[name] !== undefined) return
    const nextEnabled = !enabledOf(name)
    setToggleState(name, nextEnabled ? "enabling" : "disabling")
    try {
      // 1. Persist the config flag + optimistically mirror it in the local config store.
      const base = (sync.data.config.mcp ?? {}) as Record<string, unknown>
      const existing = base[name] as Record<string, unknown> | undefined
      const cfg =
        existing && typeof existing === "object"
          ? { ...existing, enabled: nextEnabled }
          : { enabled: nextEnabled }
      await sdk.client.config.update({ config: { mcp: { [name]: cfg } } as Config })
      sync.set("config", "mcp", { ...base, [name]: cfg } as never)

      // 2. Connect/disconnect at runtime.
      if (nextEnabled) await sdk.client.mcp.connect({ name })
      else await sdk.client.mcp.disconnect({ name })

      // 3. Refetch status and reconcile the switch to the real resulting state.
      const result = await sdk.client.mcp.status()
      if (result.data) sync.set("mcp", result.data)
    } catch (err) {
      showToast({
        variant: "error",
        title: language.t("common.requestFailed"),
        description: err instanceof Error ? err.message : String(err),
      })
      // Refetch so the switch reflects the actual resulting status rather than silently snapping back.
      try {
        const result = await sdk.client.mcp.status()
        if (result.data) sync.set("mcp", result.data)
      } catch {
        /* secondary failure already surfaced via the toast above */
      }
    } finally {
      setToggleState(name, undefined)
    }
  }

  const enabledCount = createMemo(() => items().filter((i) => i.status === "connected").length)
  const totalCount = createMemo(() => items().length)

  return (
    <Dialog
      title={language.t("dialog.mcp.title")}
      description={language.t("dialog.mcp.description", { enabled: enabledCount(), total: totalCount() })}
    >
      <List
        search={{ placeholder: language.t("common.search.placeholder"), autofocus: true }}
        emptyMessage={language.t("dialog.mcp.empty")}
        key={(x) => x?.name ?? ""}
        items={items}
        filterKeys={["name", "status"]}
        sortBy={(a, b) => a.name.localeCompare(b.name)}
        onSelect={(x) => {
          if (!x || toggleState[x.name] !== undefined) return
          void toggle(x.name)
        }}
      >
        {(i) => {
          const mcpStatus = () => sync.data.mcp[i.name]
          const status = () => mcpStatus()?.status
          const statusLabel = () => {
            const key = status() ? statusLabels[status() as keyof typeof statusLabels] : undefined
            if (!key) return
            return language.t(key)
          }
          const error = () => {
            const s = mcpStatus()
            return s?.status === "failed" ? s.error : undefined
          }
          const pending = () => toggleState[i.name] !== undefined
          return (
            <div class="w-full flex items-center justify-between gap-x-3">
              <div class="flex flex-col gap-0.5 min-w-0">
                <div class="flex items-center gap-2">
                  <span class="truncate">{i.name}</span>
                  <Show when={statusLabel()}>
                    <span class="text-11-regular text-text-weaker">{statusLabel()}</span>
                  </Show>
                  <Show when={pending()}>
                    <span class="text-11-regular text-text-weak">{language.t("common.loading.ellipsis")}</span>
                  </Show>
                </div>
                <Show when={error()}>
                  <span class="text-11-regular text-text-weaker truncate">{error()}</span>
                </Show>
              </div>
              <div onClick={(e) => e.stopPropagation()}>
                <Switch
                  checked={enabledOf(i.name)}
                  disabled={pending()}
                  onChange={() => void toggle(i.name)}
                />
              </div>
            </div>
          )
        }}
      </List>
    </Dialog>
  )
}
