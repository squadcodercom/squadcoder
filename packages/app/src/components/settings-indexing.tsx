import { Button } from "@mimo-ai/ui/button"
import { showToast } from "@mimo-ai/ui/toast"
import { type Component, createEffect, createMemo, createSignal, on, onCleanup, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useGlobalSDK } from "@/context/global-sdk"
import { useWorkspace } from "./settings/use-workspace"

// SQUADCODER Settings ▸ Indexing (#40/#60) — REAL Cursor-style semantic index, driven by the
// engine IndexService (walk → chunk → embed all-MiniLM → cosine search). Agents use it via the
// `codebase_search` tool; this panel shows live progress + file/chunk counts and lets you rebuild.
type IndexStatus = {
  indexed: number
  total: number
  count: number // chunk count
  indexing: boolean
  done: boolean
  exists: boolean
  file?: string
  updatedAt?: number
}

export const SettingsIndexing: Component = () => {
  const language = useLanguage()
  const ws = useWorkspace()
  const globalSDK = useGlobalSDK()

  const [status, setStatus] = createSignal<IndexStatus | undefined>()
  const [busy, setBusy] = createSignal(false)

  const api = async (path: string, method: "GET" | "POST") => {
    const base = globalSDK.url.replace(/\/$/, "")
    const dir = ws.directory
    const url = new URL(base + "/index" + path)
    url.searchParams.set("directory", dir)
    const res = await fetch(url.toString(), {
      method,
      headers: { "x-mimocode-directory": encodeURIComponent(dir) },
    })
    if (!res.ok) throw new Error(`index${path}: ${res.status}`)
    return res.json()
  }

  const refresh = async () => {
    try {
      setStatus((await api("/status", "GET")) as IndexStatus)
    } catch {
      /* engine not ready yet — keep last status */
    }
  }

  // Poll only while a build is in progress, so the bar + counts update live.
  let timer: ReturnType<typeof setInterval> | undefined
  const stopTimer = () => {
    if (timer) {
      clearInterval(timer)
      timer = undefined
    }
  }
  createEffect(() => {
    const indexing = status()?.indexing
    if (indexing && !timer) timer = setInterval(() => void refresh(), 800)
    else if (!indexing) stopTimer()
  })
  onCleanup(stopTimer)

  const reindex = async () => {
    setBusy(true)
    try {
      setStatus((await api("/reindex", "POST")) as IndexStatus)
      await refresh()
    } catch (err) {
      showToast({
        variant: "error",
        title: language.t("common.requestFailed"),
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(false)
    }
  }

  // On open: load status ONLY. Indexing is opt-in — the user starts it with the "Re-index now"
  // button. Auto-building a large repo on panel-open could OOM the engine.
  createEffect(
    on(
      () => ws.directory,
      (dir) => {
        if (!dir) return
        void refresh()
      },
    ),
  )

  const pct = createMemo(() => {
    const s = status()
    if (!s || s.total === 0) return 0
    return Math.min(100, Math.round((s.indexed / s.total) * 100))
  })

  const state = createMemo<"building" | "ready" | "empty">(() => {
    const s = status()
    if (!s) return "empty"
    if (s.indexing) return "building"
    if (s.exists && s.count > 0) return "ready"
    return "empty"
  })

  const statusLabel = createMemo(() => {
    switch (state()) {
      case "building":
        return language.t("settings.indexing.status.building")
      case "ready":
        return language.t("settings.indexing.status.ready")
      default:
        return language.t("settings.indexing.status.empty")
    }
  })

  const relativeUpdated = createMemo(() => {
    const t = status()?.updatedAt
    if (!t) return undefined
    try {
      const rtf = new Intl.RelativeTimeFormat(language.intl?.() ?? undefined, { numeric: "auto" })
      const diffMin = Math.round((t - Date.now()) / 60000)
      if (Math.abs(diffMin) < 60) return rtf.format(diffMin, "minute")
      return rtf.format(Math.round(diffMin / 60), "hour")
    } catch {
      return undefined
    }
  })

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 sm:px-10 pb-10">
      <div class="flex flex-col gap-1 pt-6 pb-6">
        <h2 class="text-16-medium text-text-strong">{language.t("settings.indexing.title")}</h2>
        <p class="text-12-regular text-text-weak">{language.t("settings.indexing.description")}</p>
      </div>

      <div class="flex flex-col gap-4 max-w-2xl w-full">
        <div class="flex flex-col gap-3 rounded-lg border border-border-weak-base px-4 py-4">
          <div class="flex items-center gap-3">
            <div
              classList={{
                "size-2.5 rounded-full shrink-0": true,
                "bg-icon-success-base": state() === "ready",
                "bg-icon-warning-base animate-pulse": state() === "building",
                "bg-border-weak-base": state() === "empty",
              }}
            />
            <div class="flex flex-col min-w-0 flex-1">
              <span class="text-14-medium text-text-strong">{statusLabel()}</span>
              <Show
                when={state() === "ready"}
                fallback={
                  <Show when={state() === "building"}>
                    <span class="text-12-regular text-text-weak truncate">
                      {language.t("settings.indexing.buildingDetail", {
                        indexed: String(status()?.indexed ?? 0),
                        total: String(status()?.total ?? 0),
                      })}
                      <Show when={status()?.file}> · {status()?.file}</Show>
                    </span>
                  </Show>
                }
              >
                <span class="text-12-regular text-text-weak">
                  {language.t("settings.indexing.summary", {
                    files: String(status()?.indexed ?? 0),
                    chunks: String(status()?.count ?? 0),
                  })}
                  <Show when={relativeUpdated()}>{(r) => <> · {r()}</>}</Show>
                </span>
              </Show>
            </div>
            <span class="text-14-medium text-text-strong tabular-nums shrink-0">
              <Show when={state() === "building"}>{pct()}%</Show>
            </span>
          </div>

          <Show when={state() === "building"}>
            <div class="h-2 w-full rounded-full bg-surface-base overflow-hidden" style={{ direction: "ltr" }}>
              <div
                class="h-full rounded-full bg-icon-warning-base transition-[width] duration-300"
                style={{ width: `${pct()}%` }}
              />
            </div>
          </Show>
        </div>

        <div class="flex items-center gap-3">
          <Button
            variant="secondary"
            class="cursor-pointer"
            onClick={() => void reindex()}
            disabled={busy() || state() === "building"}
          >
            {language.t("settings.indexing.reindex")}
          </Button>
          <Show when={state() === "ready"}>
            <span class="text-12-regular text-text-weak">
              {language.t("settings.indexing.fileCount", { count: String(status()?.indexed ?? 0) })}
            </span>
          </Show>
        </div>

        <p class="text-12-regular text-text-weak">{language.t("settings.indexing.note")}</p>
      </div>
    </div>
  )
}
