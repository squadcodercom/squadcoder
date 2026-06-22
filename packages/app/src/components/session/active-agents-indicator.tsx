import { For, Show, createSignal } from "solid-js"
import { Button } from "@mimo-ai/ui/button"
import { Icon } from "@mimo-ai/ui/icon"
import { Popover } from "@mimo-ai/ui/popover"
import { useLanguage } from "@/context/language"
import type { ActiveSubagent } from "@/pages/session/active-subagents"

// SQUADCODER (#70): live "N agents working ▾" indicator for Team runs. Opens a dropdown
// of who/what/which-model is running, with a Stop-all that aborts the whole run (the
// orchestrator + every blocking subagent). Driven by the running task/actor parts.

interface ActiveAgentsIndicatorProps {
  subagents: () => ActiveSubagent[]
  onStopAll: () => void
}

const roleLabel = (role: string) => role.replace(/^team-/, "").replace(/[-_]/g, " ").trim()
const modelLabel = (model?: string) => (model ? model.split("/").pop() : undefined)

export function ActiveAgentsIndicator(props: ActiveAgentsIndicatorProps) {
  const language = useLanguage()
  const [shown, setShown] = createSignal(false)
  const count = () => props.subagents().length

  return (
    <Show when={count() > 0}>
      <Popover
        open={shown()}
        onOpenChange={setShown}
        triggerAs={Button}
        triggerProps={{
          variant: "ghost",
          class: "h-7 gap-1.5 px-2 text-12-medium text-text-weak hover:text-text-strong",
          "aria-label": language.t("agents.active.title"),
        }}
        trigger={
          <>
            <span class="relative flex size-2">
              <span class="absolute inline-flex size-2 rounded-full bg-icon-success-base opacity-75 animate-ping" />
              <span class="relative inline-flex size-2 rounded-full bg-icon-success-base" />
            </span>
            <span>{language.t("agents.active.count", { count: count() })}</span>
            <Icon name="chevron-down" size="small" />
          </>
        }
        class="w-[320px] max-w-[calc(100vw-40px)] p-0 rounded-xl"
        gutter={6}
        placement="top-start"
      >
        <div class="flex flex-col text-start">
          <div class="px-3 py-2 flex items-center justify-between gap-2 border-b border-border-weak">
            <div class="text-12-medium text-text-strong">{language.t("agents.active.title")}</div>
            <button
              type="button"
              onClick={() => {
                props.onStopAll()
                setShown(false)
              }}
              class="text-11-medium text-icon-critical-base hover:underline shrink-0"
            >
              {language.t("agents.active.stopAll")}
            </button>
          </div>
          <div class="max-h-64 overflow-y-auto py-1">
            <For each={props.subagents()}>
              {(agent) => (
                <div class="px-3 py-1.5 flex flex-col gap-0.5">
                  <div class="flex items-center gap-2">
                    <span class="size-1.5 rounded-full bg-icon-success-base shrink-0" />
                    <span class="text-12-medium text-text-strong capitalize">{roleLabel(agent.role)}</span>
                    <Show when={modelLabel(agent.model)}>
                      {(model) => <span class="ms-auto text-11-regular text-text-weak shrink-0">{model()}</span>}
                    </Show>
                  </div>
                  <Show when={agent.description}>
                    <div class="ps-3.5 text-11-regular text-text-weak leading-4 break-words line-clamp-2">
                      {agent.description}
                    </div>
                  </Show>
                </div>
              )}
            </For>
          </div>
        </div>
      </Popover>
    </Show>
  )
}
