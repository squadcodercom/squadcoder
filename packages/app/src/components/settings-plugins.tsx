import type { Config } from "@mimo-ai/sdk/v2/client"
import { Button } from "@mimo-ai/ui/button"
import { Icon } from "@mimo-ai/ui/icon"
import { TextField } from "@mimo-ai/ui/text-field"
import { showToast } from "@mimo-ai/ui/toast"
import { type Component, createMemo, createSignal, For, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { useWorkspace } from "./settings/use-workspace"

type PluginSpec = string | [string, Record<string, unknown>]
const specId = (spec: PluginSpec) => (typeof spec === "string" ? spec : spec[0])
// SQUADCODER: friendly label — local/file plugins show their filename (e.g. "anthropic-oauth")
// instead of the full file:// path; npm `name@version` specs display as-is. Full spec kept for hover/remove.
const pluginLabel = (id: string): string => {
  const isFile = id.startsWith("file://") || /^([a-zA-Z]:[\\/]|\/|\.\.?[\\/])/.test(id)
  if (!isFile) return id
  const base = id.replace(/^file:\/\//, "").split(/[\\/]/).pop() ?? id
  return base.replace(/\.(c|m)?[jt]s$/i, "") || id
}

// SQUADCODER Settings ▸ Plugins (#64): manage the declared `config.plugin` array. remeda mergeDeep
// REPLACES arrays wholesale, so writing the full desired array adds AND removes entries cleanly.
// Auto-discovered file plugins (under .squadcoder/plugin) load implicitly and are managed via the folder.
export const SettingsPlugins: Component = () => {
  const language = useLanguage()
  const ws = useWorkspace()

  const [draft, setDraft] = createSignal("")
  const [busy, setBusy] = createSignal(false)

  const plugins = createMemo(() => (ws.data.config.plugin ?? []) as PluginSpec[])

  const fail = (err: unknown) =>
    showToast({
      variant: "error",
      title: language.t("common.requestFailed"),
      description: err instanceof Error ? err.message : String(err),
    })

  const write = async (next: PluginSpec[]) => {
    await ws.client.config.update({ config: { plugin: next } as Config })
    ws.set("config", "plugin", next as never)
  }

  const add = async () => {
    const value = draft().trim()
    if (!value) return
    if (plugins().some((p) => specId(p) === value)) {
      setDraft("")
      return
    }
    setBusy(true)
    try {
      await write([...plugins(), value])
      setDraft("")
      showToast({ variant: "success", title: language.t("settings.plugins.added") })
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  const remove = async (id: string) => {
    setBusy(true)
    try {
      await write(plugins().filter((p) => specId(p) !== id))
      showToast({ variant: "success", title: language.t("settings.plugins.removed") })
    } catch (err) {
      fail(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div class="flex flex-col h-full overflow-y-auto no-scrollbar px-4 sm:px-10 pb-10">
      <div class="flex flex-col gap-1 pt-6 pb-6">
        <h2 class="text-16-medium text-text-strong">{language.t("settings.plugins.title")}</h2>
        <p class="text-12-regular text-text-weak">{language.t("settings.plugins.description")}</p>
      </div>

      <div class="flex flex-col gap-3 max-w-2xl w-full">
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <TextField
              class="font-mono"
              value={draft()}
              onChange={setDraft}
              onKeyDown={(e: KeyboardEvent) => {
                if (e.key === "Enter") void add()
              }}
              placeholder={language.t("settings.plugins.addPlaceholder")}
              aria-label={language.t("settings.plugins.add")}
            />
          </div>
          <Button variant="primary" onClick={() => void add()} disabled={busy() || !draft().trim()}>
            {language.t("settings.plugins.add")}
          </Button>
        </div>

        <div class="flex flex-col rounded-lg border border-border-weak-base divide-y divide-border-weak-base">
          <Show
            when={plugins().length > 0}
            fallback={<div class="text-12-regular text-text-weak p-4">{language.t("settings.plugins.empty")}</div>}
          >
            <For each={plugins()}>
              {(spec) => (
                <div class="flex items-center gap-3 px-4 py-2.5">
                  <div class="size-1.5 rounded-full shrink-0 bg-icon-success-base" />
                  <span class="text-13-regular text-text-base font-mono truncate flex-1" title={specId(spec)}>
                    {pluginLabel(specId(spec))}
                  </span>
                  <Button size="small" variant="ghost" onClick={() => void remove(specId(spec))} disabled={busy()}>
                    <Icon name="trash" size="small" />
                    {language.t("settings.plugins.remove")}
                  </Button>
                </div>
              )}
            </For>
          </Show>
        </div>

        <p class="text-12-regular text-text-weak">{language.t("settings.plugins.note")}</p>
      </div>
    </div>
  )
}
