import { Button } from "@mimo-ai/ui/button"
import { Markdown } from "@mimo-ai/ui/markdown"
import { type Component, createResource, createSignal, For, Match, Show, Switch } from "solid-js"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useSDK } from "@/context/sdk"

// #42 Workspace .md viewer — lists the project's Markdown docs (CLAUDE.md / AGENTS.md / README /
// memory / SKILL.md) and renders the selected one. View-only MVP + open-in-external-editor (the
// file API is GET-only; in-app edit/delete would need a new write route — deferred).
export const DialogWorkspaceDocs: Component = () => {
  const sdk = useSDK()
  const language = useLanguage()
  const platform = usePlatform()
  const [selected, setSelected] = createSignal<string | undefined>()

  const [files] = createResource(async () => {
    const res = await sdk.client.find
      .files({ directory: sdk.directory, query: "md", type: "file", limit: 200 })
      .then((x) => x.data ?? [])
      .catch(() => [] as string[])
    const md = res.filter((p) => p.toLowerCase().endsWith(".md"))
    const priority = ["CLAUDE.md", "AGENTS.md", "README.md", "MEMORY.md"]
    md.sort((a, b) => {
      const rank = (p: string) => {
        const i = priority.findIndex((x) => p.endsWith(x))
        return i === -1 ? 99 : i
      }
      return rank(a) - rank(b) || a.localeCompare(b)
    })
    if (!selected() && md[0]) setSelected(md[0])
    return md
  })

  // Use file.read (the verified-working /file/content reader) and let the resource track loading /
  // error so the viewer never shows a silent blank pane. A swallowed error here was the root cause
  // of "I click a doc and can't view it" — now it surfaces a real error/empty/loading state below.
  const [content] = createResource(selected, async (path) => {
    const res = await sdk.client.file.read({ directory: sdk.directory, path })
    return (res.data ?? "") as string
  })

  const openExternal = () => {
    const p = selected()
    if (!p || !platform.openPath) return
    void platform.openPath(`${sdk.directory}/${p}`).catch(() => {})
  }

  return (
    <div class="flex flex-col w-[760px] max-w-[90vw] h-[560px] max-h-[80vh] rounded-xl bg-background-strong shadow-[var(--shadow-lg-border-base)] overflow-hidden">
      <div class="flex items-center justify-between gap-2 px-4 py-3 border-b border-border-weak-base">
        <h2 class="text-14-medium text-text-strong">{language.t("dialog.workspaceDocs.title")}</h2>
        <Show when={platform.openPath && selected()}>
          <Button size="small" variant="secondary" onClick={openExternal}>
            {language.t("dialog.workspaceDocs.openExternal")}
          </Button>
        </Show>
      </div>
      <div class="flex flex-1 min-h-0">
        <div class="w-56 shrink-0 border-e border-border-weak-base overflow-y-auto p-2 flex flex-col gap-0.5">
          <Show
            when={(files() ?? []).length > 0}
            fallback={<div class="text-12-regular text-text-weak p-2">{language.t("dialog.workspaceDocs.empty")}</div>}
          >
            <For each={files()}>
              {(path) => (
                <button
                  type="button"
                  dir="auto"
                  class="text-start text-12-regular truncate px-2 py-1.5 rounded-md transition-colors"
                  classList={{
                    "bg-surface-raised-base text-text-strong": selected() === path,
                    "text-text-base hover:bg-surface-raised-base-hover": selected() !== path,
                  }}
                  title={path}
                  onClick={() => setSelected(path)}
                >
                  {path}
                </button>
              )}
            </For>
          </Show>
        </div>
        <div class="flex-1 min-w-0 overflow-y-auto p-4" dir="auto">
          <Show
            when={selected()}
            fallback={
              <div class="text-12-regular text-text-weak">{language.t("dialog.workspaceDocs.selectPrompt")}</div>
            }
          >
            <Switch>
              <Match when={content.loading}>
                <div class="text-12-regular text-text-weak">{language.t("dialog.workspaceDocs.loading")}</div>
              </Match>
              <Match when={content.error}>
                <div class="text-12-regular text-text-danger-base">
                  {language.t("dialog.workspaceDocs.loadError")}
                </div>
              </Match>
              <Match when={(content() ?? "").trim().length === 0}>
                <div class="text-12-regular text-text-weak">{language.t("dialog.workspaceDocs.fileEmpty")}</div>
              </Match>
              <Match when={true}>
                <Markdown text={content() ?? ""} class="text-14-regular" />
              </Match>
            </Switch>
          </Show>
        </div>
      </div>
    </div>
  )
}
