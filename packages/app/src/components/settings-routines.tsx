import { type Component, For, Show, createEffect, createMemo, createSignal } from "solid-js"
import { createStore } from "solid-js/store"
import { Button } from "@mimo-ai/ui/button"
import { Select } from "@mimo-ai/ui/select"
import { TextField } from "@mimo-ai/ui/text-field"
import { showToast } from "@mimo-ai/ui/toast"
import { useLanguage } from "@/context/language"
import { useGlobalSDK } from "@/context/global-sdk"
import { useWorkspace } from "./settings/use-workspace"

type Schedule = {
  id: string
  routine: string
  frequency: "daily" | "weekly"
  time: string
  weekday?: number
  directory: string
  enabled: boolean
  createdAt: number
}

// SQUADCODER (T8): Settings → Routines. List saved routines (slash-commands) and attach an OS-level
// schedule (Windows Task Scheduler / cron) via the engine /routine/schedule routes. Scheduled runs are
// safe-by-default — `squadcoder run` auto-denies any permission-gated tool.
export const SettingsRoutines: Component = () => {
  const language = useLanguage()
  const globalSDK = useGlobalSDK()
  const ws = useWorkspace()
  const headers = () => ({ "x-mimocode-directory": ws.directory })

  // NON-suspending loads (createSignal + createEffect, NOT createResource) — createResource suspends to
  // the nearest Suspense boundary while loading, which blanks the whole app when this tab mounts. The
  // working tabs (Agents/MCP) read sync ws.data and never suspend; this matches that behavior.
  const [routines, setRoutines] = createSignal<{ name: string; description?: string }[]>([])
  createEffect(() => {
    const client = ws.client
    void client.command
      .list()
      .then((x) => setRoutines((x?.data ?? []) as { name: string; description?: string }[]))
      .catch(() => {})
  })

  const [schedules, setSchedules] = createSignal<Schedule[]>([])
  const refetch = async () => {
    const res = await fetch(`${globalSDK.url}/routine/schedule`, { headers: headers() }).catch(() => undefined)
    if (!res?.ok) {
      setSchedules([])
      return
    }
    const json = (await res.json().catch(() => undefined)) as { schedules?: Schedule[] } | undefined
    setSchedules(json?.schedules ?? [])
  }
  createEffect(() => {
    void refetch()
  })

  const [selected, setSelected] = createSignal<string | undefined>()
  const [busy, setBusy] = createSignal(false)
  const [form, setForm] = createStore<{ frequency: "daily" | "weekly"; time: string; weekday: number }>({
    frequency: "daily",
    time: "09:00",
    weekday: 1,
  })

  const scheduleFor = (routine: string) => schedules()?.find((s) => s.routine === routine)
  const current = createMemo(() => (selected() ? scheduleFor(selected()!) : undefined))

  createEffect(() => {
    const list = routines()
    if (!selected() && list && list[0]) setSelected(list[0].name)
  })

  createEffect(() => {
    const s = current()
    if (s) setForm({ frequency: s.frequency, time: s.time, weekday: s.weekday ?? 1 })
  })

  const dayName = (d: number) =>
    new Date(Date.UTC(2024, 0, 7 + d)).toLocaleDateString(language.locale(), { weekday: "long" })

  const freqOptions = createMemo(() => [
    { value: "daily" as const, label: language.t("settings.routines.freq.daily") },
    { value: "weekly" as const, label: language.t("settings.routines.freq.weekly") },
  ])
  const weekdayOptions = createMemo(() => [0, 1, 2, 3, 4, 5, 6].map((d) => ({ value: d, label: dayName(d) })))

  const scheduleLabel = (s: Schedule) =>
    s.frequency === "weekly"
      ? language.t("settings.routines.scheduled.weekly", { day: dayName(s.weekday ?? 0), time: s.time })
      : language.t("settings.routines.scheduled.daily", { time: s.time })

  const save = async () => {
    const routine = selected()
    if (!routine) return
    setBusy(true)
    try {
      const res = await fetch(`${globalSDK.url}/routine/schedule`, {
        method: "POST",
        headers: { ...headers(), "content-type": "application/json" },
        body: JSON.stringify({
          routine,
          frequency: form.frequency,
          time: form.time,
          ...(form.frequency === "weekly" ? { weekday: form.weekday } : {}),
          directory: ws.directory,
        }),
      })
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        showToast({ variant: "error", title: err.error ?? language.t("settings.routines.failed") })
        return
      }
      showToast({ variant: "success", title: language.t("settings.routines.saved") })
      await refetch()
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    setBusy(true)
    try {
      await fetch(`${globalSDK.url}/routine/schedule/${id}`, { method: "DELETE", headers: headers() }).catch(() => undefined)
      await refetch()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <div class="flex flex-col gap-1 px-4 sm:px-10 pt-6 pb-4 border-b border-border-weak-base shrink-0">
        <h2 class="text-16-medium text-text-strong">{language.t("settings.routines.title")}</h2>
        <p class="text-12-regular text-text-weak">{language.t("settings.routines.description")}</p>
      </div>

      <div class="flex flex-1 min-h-0">
        <aside class="w-56 shrink-0 border-e border-border-weak-base overflow-y-auto p-2 flex flex-col gap-0.5">
          <Show
            when={routines()?.length}
            fallback={<div class="text-12-regular text-text-weak p-2">{language.t("settings.routines.empty")}</div>}
          >
            <For each={routines()}>
              {(routine) => (
                <button
                  type="button"
                  class="flex items-center gap-2 text-start px-2 py-1.5 rounded-md transition-colors"
                  classList={{
                    "bg-surface-raised-base text-text-strong": selected() === routine.name,
                    "text-text-base hover:bg-surface-raised-base-hover": selected() !== routine.name,
                  }}
                  onClick={() => setSelected(routine.name)}
                >
                  <div
                    classList={{
                      "size-1.5 rounded-full shrink-0": true,
                      "bg-icon-success-base": !!scheduleFor(routine.name),
                      "bg-border-weak-base": !scheduleFor(routine.name),
                    }}
                  />
                  <span class="text-13-regular truncate flex-1">{routine.name}</span>
                </button>
              )}
            </For>
          </Show>
        </aside>

        <div class="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-6">
          <Show
            when={selected()}
            fallback={<div class="text-12-regular text-text-weak">{language.t("settings.routines.selectPrompt")}</div>}
          >
            <div class="flex flex-col gap-6 max-w-xl">
              <div class="flex items-center gap-2">
                <h3 class="text-15-medium text-text-strong">/{selected()}</h3>
                <Show when={current()}>
                  {(s) => (
                    <span class="text-11-medium text-text-on-warning-strong bg-surface-warning-base px-1.5 py-0.5 rounded">
                      {scheduleLabel(s())}
                    </span>
                  )}
                </Show>
              </div>

              <div class="flex flex-col gap-2">
                <span class="text-14-medium text-text-strong">{language.t("settings.routines.frequency")}</span>
                <Select
                  options={freqOptions()}
                  current={freqOptions().find((o) => o.value === form.frequency)}
                  value={(o) => o.value}
                  label={(o) => o.label}
                  onSelect={(o) => o && setForm("frequency", o.value)}
                  size="small"
                  triggerVariant="settings"
                  aria-label={language.t("settings.routines.frequency")}
                />
              </div>

              <div class="flex flex-wrap gap-4">
                <div class="flex flex-col gap-2 w-40">
                  <span class="text-14-medium text-text-strong">{language.t("settings.routines.time")}</span>
                  <TextField
                    value={form.time}
                    onChange={(v) => setForm("time", v)}
                    placeholder="09:00"
                    aria-label={language.t("settings.routines.time")}
                  />
                </div>
                <Show when={form.frequency === "weekly"}>
                  <div class="flex flex-col gap-2 w-48">
                    <span class="text-14-medium text-text-strong">{language.t("settings.routines.weekday")}</span>
                    <Select
                      options={weekdayOptions()}
                      current={weekdayOptions().find((o) => o.value === form.weekday)}
                      value={(o) => String(o.value)}
                      label={(o) => o.label}
                      onSelect={(o) => o && setForm("weekday", o.value)}
                      size="small"
                      triggerVariant="settings"
                      aria-label={language.t("settings.routines.weekday")}
                    />
                  </div>
                </Show>
              </div>

              <p class="text-12-regular text-text-weak bg-surface-warning-weak border border-border-warning-base rounded-md px-3 py-2">
                {language.t("settings.routines.securityNote")}
              </p>

              <div class="flex items-center gap-3 pt-2">
                <Button variant="primary" onClick={() => void save()} disabled={busy()}>
                  {language.t("settings.routines.save")}
                </Button>
                <Show when={current()}>
                  {(s) => (
                    <Button variant="ghost" onClick={() => void remove(s().id)} disabled={busy()}>
                      {language.t("settings.routines.remove")}
                    </Button>
                  )}
                </Show>
              </div>
            </div>
          </Show>
        </div>
      </div>
    </div>
  )
}
