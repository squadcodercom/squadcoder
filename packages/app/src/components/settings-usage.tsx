import { type Component, For, Show, createMemo } from "solid-js"
import { Collapsible } from "@squadcoder/ui/collapsible"
import { ProviderIcon } from "@squadcoder/ui/provider-icon"
import { Tag } from "@squadcoder/ui/tag"
import { useProviders } from "@/hooks/use-providers"
import { useLanguage } from "@/context/language"
import { useAnthropicUsage } from "@/hooks/use-anthropic-usage"

type Language = ReturnType<typeof useLanguage>

// SQUADCODER (T9): Settings → Usage. FAQ-style accordion of every connection type (provider): see at a
// glance which are connected, expand for the connection method + live usage where we have it (Anthropic
// Pro/Max 5h + weekly windows, from /usage/anthropic).
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

const UsageBar: Component<{ label: string; percent: number; resets?: string }> = (props) => (
  <div class="flex flex-col gap-1">
    <div class="flex items-center justify-between text-12-regular text-text-base">
      <span>{props.label}</span>
      <span class="text-text-weak">
        {props.percent}%
        <Show when={props.resets}> · {props.resets}</Show>
      </span>
    </div>
    <div class="h-1.5 rounded-full bg-surface-base overflow-hidden">
      <div
        class="h-full rounded-full"
        style={{
          width: `${Math.min(100, Math.max(0, props.percent))}%`,
          background: props.percent >= 80 ? "var(--icon-warning-base)" : "var(--icon-success-base)",
        }}
      />
    </div>
  </div>
)

export const SettingsUsage: Component = () => {
  const language = useLanguage()
  const providers = useProviders()
  const anthropic = useAnthropicUsage()

  const connectedIds = createMemo(() => new Set(providers.connected().map((p) => p.id)))

  const items = createMemo(() => {
    const connected = providers.connected().map((p) => ({ provider: p, connected: true }))
    const rest = providers
      .popular()
      .filter((p) => !connectedIds().has(p.id))
      .map((p) => ({ provider: p, connected: false }))
    return [...connected, ...rest]
  })

  const total = createMemo(() => items().length)
  const connectedCount = createMemo(() => items().filter((i) => i.connected).length)

  const methodLabel = (item: { provider: { id: string }; connected: boolean }): string | undefined => {
    if (!item.connected) return undefined
    const source = "source" in item.provider ? (item.provider as { source?: string }).source : undefined
    if (source === "env") return language.t("settings.providers.tag.environment")
    if (source === "api") return language.t("provider.connect.method.apiKey")
    if (source === "config") return language.t("settings.providers.tag.config")
    if (source === "custom") return language.t("settings.providers.tag.custom")
    return undefined
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 pb-10 sm:px-10 sm:pb-10">
      <div class="flex flex-col gap-1 pt-6 pb-4 max-w-[720px]">
        <h2 class="text-16-medium text-text-strong">{language.t("settings.usage.title")}</h2>
        <p class="text-12-regular text-text-weak">{language.t("settings.usage.description")}</p>
        <span class="text-12-medium text-text-base pt-1">
          {language.t("settings.usage.summary", { connected: connectedCount(), total: total() })}
        </span>
      </div>

      <div class="flex flex-col gap-1.5 max-w-[720px]">
        <For each={items()}>
          {(item) => {
            const isAnthropic = item.provider.id === "anthropic"
            const usage = createMemo(() => (isAnthropic ? anthropic.usage() : undefined))
            return (
              <Collapsible variant="ghost" class="border border-border-weak-base rounded-md px-3">
                <Collapsible.Trigger>
                  <div class="flex items-center gap-3 min-w-0 flex-1">
                    <ProviderIcon id={item.provider.id} class="size-5 shrink-0 icon-strong-base" />
                    <span class="text-14-medium text-text-strong truncate">{item.provider.name}</span>
                    <Show when={methodLabel(item)}>{(label) => <Tag>{label()}</Tag>}</Show>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <div
                      classList={{
                        "size-1.5 rounded-full": true,
                        "bg-icon-success-base": item.connected,
                        "bg-border-weak-base": !item.connected,
                      }}
                    />
                    <span
                      classList={{
                        "text-12-medium": true,
                        "text-text-base": item.connected,
                        "text-text-weak": !item.connected,
                      }}
                    >
                      {item.connected
                        ? language.t("settings.usage.connected")
                        : language.t("settings.usage.notConnected")}
                    </span>
                  </div>
                  <Collapsible.Arrow />
                </Collapsible.Trigger>
                <Collapsible.Content>
                  <div class="flex flex-col gap-3 pb-3 ps-8 pe-1">
                    <Show
                      when={isAnthropic && usage()}
                      fallback={
                        <span class="text-12-regular text-text-weak">{language.t("settings.usage.noUsage")}</span>
                      }
                    >
                      <UsageBar
                        label={language.t("settings.usage.fiveHour")}
                        percent={Math.round(usage()!.fiveHour?.utilization ?? 0)}
                        resets={formatResetIn(language, usage()!.fiveHour?.resetsAt)}
                      />
                      <UsageBar
                        label={language.t("settings.usage.sevenDay")}
                        percent={Math.round(usage()!.sevenDay?.utilization ?? 0)}
                        resets={formatResetIn(language, usage()!.sevenDay?.resetsAt)}
                      />
                    </Show>
                  </div>
                </Collapsible.Content>
              </Collapsible>
            )
          }}
        </For>
      </div>
    </div>
  )
}
