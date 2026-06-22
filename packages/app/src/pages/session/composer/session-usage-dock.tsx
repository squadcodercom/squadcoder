import { Show, createMemo } from "solid-js"
import { DockTray } from "@squadcoder/ui/dock-surface"
import { Icon } from "@squadcoder/ui/icon"
import { IconButton } from "@squadcoder/ui/icon-button"
import { useDialog } from "@squadcoder/ui/context/dialog"
import { useLanguage } from "@/context/language"
import { useAnthropicUsage } from "@/hooks/use-anthropic-usage"

type Language = ReturnType<typeof useLanguage>

// SQUADCODER: yellow "approaching Claude usage limit" banner. Sits directly above the prompt input
// (DockTray + the same negative-margin / squared-bottom treatment the other docks use) so it visually
// fits the input's border radius. RTL-safe via logical CSS + logical radius keys.
function formatResetIn(language: Language, ms: number | null | undefined): string | undefined {
  if (!ms) return undefined
  const diff = ms - Date.now()
  if (diff <= 0) return undefined
  const minutes = Math.round(diff / 60_000)
  if (minutes < 60) return language.t("usage.reset.minutes", { count: minutes })
  const hours = Math.round(minutes / 60)
  if (hours < 48) return language.t("usage.reset.hours", { count: hours })
  return language.t("usage.reset.days", { count: Math.round(hours / 24) })
}

export function SessionUsageDock() {
  const language = useLanguage()
  const usage = useAnthropicUsage()
  const dialog = useDialog()

  // Open Settings → Usage (lazy import to avoid a circular dependency with the settings dialog).
  const openUsage = () =>
    void import("@/components/dialog-settings").then((x) => dialog.show(() => <x.DialogSettings section="usage" />))

  const percent = createMemo(() => Math.round(usage.worst()?.utilization ?? 0))
  const windowLabel = createMemo(() =>
    usage.worst()?.window === "sevenDay" ? language.t("usage.window.weekly") : language.t("usage.window.fiveHour"),
  )
  const resetIn = createMemo(() => formatResetIn(language, usage.worst()?.resetsAt))

  return (
    <Show when={usage.approaching()}>
      <DockTray
        data-component="session-usage-dock"
        style={{
          background: "var(--surface-warning-base)",
          border: "1px solid var(--border-warning-base)",
          "border-radius": "10px",
          "margin-bottom": "0.5rem",
        }}
      >
        <div class="ps-3 pe-2 py-2 flex items-center gap-2">
          <Icon name="warning" size="small" class="shrink-0 text-icon-warning-base" />
          <span class="min-w-0 flex-1 text-13-regular text-text-on-warning-strong">
            {language.t("usage.approaching", { percent: percent(), window: windowLabel() })}
            <Show when={resetIn()}>
              <span class="text-text-on-warning-weak"> · {language.t("usage.resetsIn", { time: resetIn()! })}</span>
            </Show>
          </span>
          <button
            type="button"
            class="shrink-0 text-12-medium text-text-on-warning-strong underline underline-offset-2 hover:opacity-80"
            onClick={openUsage}
          >
            {language.t("usage.viewDetails")}
          </button>
          <IconButton
            icon="close-small"
            size="normal"
            variant="ghost"
            class="shrink-0 text-icon-warning-base"
            aria-label={language.t("usage.dismiss")}
            onClick={() => usage.dismiss()}
          />
        </div>
      </DockTray>
    </Show>
  )
}
