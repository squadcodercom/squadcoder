import { Dialog } from "@mimo-ai/ui/dialog"
import { List } from "@mimo-ai/ui/list"
import { useDialog } from "@mimo-ai/ui/context/dialog"
import { Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useModels } from "@/context/models"

// SQUADCODER (#37): per-agent model picker as a MODAL dialog. The status popover is non-modal, so a
// nested Select portals its listbox outside the popover and the click closes it instead of selecting.
// A modal dialog owns the focus scope, so the searchable model List works reliably.
export function DialogAgentModel(props: {
  agent: string
  current?: { id: string; provider: { id: string } }
  onSelect: (providerID: string, modelID: string) => void
}) {
  const dialog = useDialog()
  const language = useLanguage()
  const models = useModels()

  const items = () => models.list()
  const current = () =>
    props.current
      ? items().find((m) => m.id === props.current!.id && m.provider.id === props.current!.provider.id)
      : undefined

  return (
    <Dialog title={language.t("dialog.agentModel.title", { agent: props.agent })}>
      <div class="flex flex-1 min-h-0 flex-col">
        <List
          search={{ placeholder: language.t("dialog.agentModel.search"), autofocus: true }}
          items={items}
          key={(m) => `${m.provider.id}/${m.id}`}
          current={current()}
          emptyMessage={language.t("dialog.agentModel.empty")}
          onSelect={(m) => {
            if (!m) return
            props.onSelect(m.provider.id, m.id)
            dialog.close()
          }}
          class="flex-1 min-h-0 px-5 pb-5 [&_[data-slot=list-scroll]]:flex-1 [&_[data-slot=list-scroll]]:overflow-y-auto"
        >
          {(m) => (
            <div class="flex items-center gap-2 w-full min-w-0">
              <span class="text-14-regular text-text-base truncate flex-1">{m.name}</span>
              <span class="text-12-regular text-text-weak shrink-0">{m.provider.id}</span>
              <Show when={props.current && m.id === props.current.id && m.provider.id === props.current.provider.id}>
                <span class="text-11-regular text-text-base bg-surface-base px-1.5 py-0.5 rounded-md shrink-0">
                  {language.t("common.current")}
                </span>
              </Show>
            </div>
          )}
        </List>
      </div>
    </Dialog>
  )
}
