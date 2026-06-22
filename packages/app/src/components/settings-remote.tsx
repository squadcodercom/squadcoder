import { Button } from "@squadcoder/ui/button"
import { useDialog } from "@squadcoder/ui/context/dialog"
import { Icon } from "@squadcoder/ui/icon"
import { type Component, createMemo, For, Show } from "solid-js"
import { ServerRow } from "@/components/server/server-row"
import { useLanguage } from "@/context/language"
import { ServerConnection, useServer } from "@/context/server"

// SQUADCODER Settings ▸ Remote (#64): manage server connections (local + remote SSH/HTTP). Pure reuse
// of the existing ServerConnection store + the DialogSelectServer add-server flow (which already has
// the SSH / Tailscale setup steps). No new transport.
export const SettingsRemote: Component = () => {
  const language = useLanguage()
  const server = useServer()
  const dialog = useDialog()

  let dialogRun = 0

  const servers = createMemo(() => server.list)
  const activeKey = () => server.key

  const openAdd = () => {
    const run = ++dialogRun
    void import("./dialog-select-server").then((x) => {
      if (dialogRun !== run) return
      dialog.show(() => <x.DialogSelectServer />)
    })
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 sm:px-10 pb-10">
      <div class="flex items-start justify-between gap-3 pt-6 pb-6">
        <div class="flex flex-col gap-1 min-w-0">
          <h2 class="text-16-medium text-text-strong">{language.t("settings.remote.title")}</h2>
          <p class="text-12-regular text-text-weak">{language.t("settings.remote.description")}</p>
        </div>
        <Button size="small" variant="primary" onClick={openAdd}>
          <Icon name="server" size="small" />
          {language.t("settings.remote.add")}
        </Button>
      </div>

      <div class="flex flex-col rounded-lg border border-border-weak-base divide-y divide-border-weak-base max-w-2xl w-full">
        <Show
          when={servers().length > 0}
          fallback={<div class="text-12-regular text-text-weak p-4">{language.t("settings.remote.empty")}</div>}
        >
          <For each={servers()}>
            {(conn) => {
              const key = ServerConnection.key(conn)
              const isActive = () => key === activeKey()
              return (
                <div class="flex items-center gap-3 px-4 py-2.5">
                  <ServerRow
                    conn={conn}
                    class="flex items-center gap-2 min-w-0 flex-1"
                    nameClass="text-14-regular text-text-base truncate"
                    versionClass="text-12-regular text-text-weak truncate"
                  />
                  <Show when={isActive()}>
                    <span class="text-11-regular text-text-base bg-surface-base px-1.5 py-0.5 rounded-md shrink-0">
                      {language.t("settings.remote.active")}
                    </span>
                  </Show>
                  <Show when={!isActive()}>
                    <Button size="small" variant="ghost" onClick={() => server.remove(key)}>
                      {language.t("settings.remote.remove")}
                    </Button>
                  </Show>
                </div>
              )
            }}
          </For>
        </Show>
      </div>

      <p class="text-12-regular text-text-weak max-w-2xl mt-4">{language.t("settings.remote.note")}</p>
    </div>
  )
}
