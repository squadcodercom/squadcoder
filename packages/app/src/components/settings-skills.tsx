import { Button } from "@mimo-ai/ui/button"
import { Icon } from "@mimo-ai/ui/icon"
import { Markdown } from "@mimo-ai/ui/markdown"
import { Switch } from "@mimo-ai/ui/switch"
import { showToast } from "@mimo-ai/ui/toast"
import type { PermissionActionConfig } from "@mimo-ai/sdk/v2/client"
import { type Component, createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { useLanguage } from "@/context/language"
import { usePlatform } from "@/context/platform"
import { useWorkspace } from "./settings/use-workspace"

type SkillItem = { name: string; description: string; location: string; content: string; hidden?: boolean }

const KNOWN_SOURCES = ["squadcoder", "claude", "codex", "opencode", "agents", "other"] as const
type Source = (typeof KNOWN_SOURCES)[number]

const sourceOf = (location: string): Source => {
  const l = location.toLowerCase().replace(/\\/g, "/")
  if (l.includes("/.squadcoder/")) return "squadcoder"
  if (l.includes("/.claude/")) return "claude"
  if (l.includes("/.codex/")) return "codex"
  if (l.includes("/.opencode/")) return "opencode"
  if (l.includes("/.agents/")) return "agents"
  return "other"
}

const skillPermissionMap = (config: { permission?: unknown }): Record<string, PermissionActionConfig> => {
  const perm = config.permission as { skill?: unknown } | string | undefined
  if (perm && typeof perm === "object" && perm.skill && typeof perm.skill === "object") {
    return perm.skill as Record<string, PermissionActionConfig>
  }
  return {}
}

// Effective enabled state, mirroring the engine's Permission.evaluate precedence: an explicit
// per-skill rule wins, otherwise fall back to the "*" wildcard (so a deny-all + allow-core config
// shows non-core skills as OFF instead of all-ON).
const skillRuleEnabled = (map: Record<string, PermissionActionConfig>, name: string): boolean => {
  const explicit = map[name]
  if (explicit === "deny") return false
  if (explicit === "allow") return true
  return map["*"] !== "deny"
}

// SQUADCODER Settings ▸ Skills (#38/#63): view / enable-disable / open each skill, grouped by source.
// Reuses GET /skill (content included) + the engine's `permission.skill[name]` toggle (Skill.available
// drops a skill whose evaluated action is "deny"). True create/edit/delete of skill files = Phase 4.
export const SettingsSkills: Component = () => {
  const language = useLanguage()
  const platform = usePlatform()
  const ws = useWorkspace()

  const [selected, setSelected] = createSignal<string | undefined>()
  const [busy, setBusy] = createSignal<string | undefined>()

  // Non-suspending load (createSignal + createEffect, NOT createResource) so mounting this tab doesn't
  // blank the whole app via Suspense — matches the sync-data tabs (Agents/MCP).
  const [skills, setSkills] = createSignal<SkillItem[]>([])
  const [skillsLoading, setSkillsLoading] = createSignal(true)
  createEffect(() => {
    const client = ws.client
    setSkillsLoading(true)
    void client.app
      .skills()
      .then((x) => setSkills(((x.data ?? []) as SkillItem[]).filter((s) => !s.hidden)))
      .catch(() => setSkills([]))
      .finally(() => setSkillsLoading(false))
  })

  const enabled = (name: string) => skillRuleEnabled(skillPermissionMap(ws.data.config), name)

  const toggle = async (name: string) => {
    setBusy(name)
    try {
      const current = skillPermissionMap(ws.data.config)
      // Toggle relative to the EFFECTIVE state (honours the "*" wildcard) so clicking a
      // wildcard-disabled skill enables it (explicit "allow") instead of re-denying.
      const next: Record<string, PermissionActionConfig> = { ...current, [name]: skillRuleEnabled(current, name) ? "deny" : "allow" }
      await ws.client.config.update({ config: { permission: { skill: next } } })
      const perm = ws.data.config.permission
      const base = perm && typeof perm === "object" ? (perm as Record<string, unknown>) : {}
      ws.set("config", "permission", { ...base, skill: next } as never)
    } catch (err) {
      showToast({
        variant: "error",
        title: language.t("common.requestFailed"),
        description: err instanceof Error ? err.message : String(err),
      })
    } finally {
      setBusy(undefined)
    }
  }

  const grouped = createMemo(() => {
    const list = (skills() ?? []).slice().sort((a, b) => a.name.localeCompare(b.name))
    const groups = new Map<Source, SkillItem[]>()
    for (const skill of list) {
      const src = sourceOf(skill.location)
      const arr = groups.get(src) ?? []
      arr.push(skill)
      groups.set(src, arr)
    }
    return KNOWN_SOURCES.filter((s) => groups.has(s)).map((s) => ({ source: s, items: groups.get(s)! }))
  })

  const current = createMemo(() => (skills() ?? []).find((s) => s.name === selected()))

  createEffect(() => {
    const list = skills()
    if (!selected() && list && list[0]) setSelected(list[0].name)
  })

  const skillsDir = createMemo(() => {
    const sample = (skills() ?? [])[0]?.location
    return sample ? sample.replace(/[\\/][^\\/]*[\\/]SKILL\.md$/i, "") : `${ws.directory}/.squadcoder/skills`
  })

  const openPath = (path: string) => {
    if (!platform.openPath) return
    void platform.openPath(path).catch(() => {})
  }

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <div class="flex items-start justify-between gap-3 px-4 sm:px-10 pt-6 pb-4 border-b border-border-weak-base shrink-0">
        <div class="flex flex-col gap-1 min-w-0">
          <h2 class="text-16-medium text-text-strong">{language.t("settings.skills.title")}</h2>
          <p class="text-12-regular text-text-weak">{language.t("settings.skills.description")}</p>
        </div>
        <Show when={platform.openPath}>
          <Button size="small" variant="secondary" onClick={() => openPath(skillsDir())}>
            {language.t("settings.skills.openFolder")}
          </Button>
        </Show>
      </div>

      <div class="flex flex-1 min-h-0">
        <aside class="w-60 shrink-0 border-e border-border-weak-base overflow-y-auto p-2 flex flex-col gap-2">
          <Show
            when={(skills() ?? []).length > 0}
            fallback={
              <div class="text-12-regular text-text-weak p-2">
                {skillsLoading() ? language.t("common.loading") : language.t("settings.skills.empty")}
              </div>
            }
          >
            <For each={grouped()}>
              {(group) => (
                <div class="flex flex-col gap-0.5">
                  <div class="px-2 py-1 text-10-medium uppercase tracking-wide text-text-weak">
                    {language.t(`settings.skills.source.${group.source}`)}
                  </div>
                  <For each={group.items}>
                    {(skill) => (
                      <button
                        type="button"
                        class="flex items-center gap-2 text-start px-2 py-1.5 rounded-md transition-colors"
                        classList={{
                          "bg-surface-raised-base text-text-strong": selected() === skill.name,
                          "text-text-base hover:bg-surface-raised-base-hover": selected() !== skill.name,
                        }}
                        onClick={() => setSelected(skill.name)}
                      >
                        <div
                          classList={{
                            "size-1.5 rounded-full shrink-0": true,
                            "bg-icon-success-base": enabled(skill.name),
                            "bg-border-weak-base": !enabled(skill.name),
                          }}
                        />
                        <span class="text-13-regular truncate flex-1" dir="auto">
                          {skill.name}
                        </span>
                      </button>
                    )}
                  </For>
                </div>
              )}
            </For>
          </Show>
        </aside>

        <div class="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-6">
          <Show
            when={current()}
            fallback={<div class="text-12-regular text-text-weak">{language.t("settings.skills.selectPrompt")}</div>}
          >
            {(skill) => (
              <div class="flex flex-col gap-4 max-w-2xl">
                <div class="flex items-start justify-between gap-4">
                  <div class="flex flex-col gap-1 min-w-0">
                    <h3 class="text-15-medium text-text-strong" dir="auto">
                      {skill().name}
                    </h3>
                    <p class="text-12-regular text-text-weak" dir="auto">
                      {skill().description}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 shrink-0">
                    <span class="text-12-regular text-text-weak">{language.t("settings.skills.enabled")}</span>
                    <Switch
                      checked={enabled(skill().name)}
                      disabled={busy() === skill().name}
                      onChange={() => void toggle(skill().name)}
                    />
                  </div>
                </div>

                <Show when={platform.openPath}>
                  <div>
                    <Button size="small" variant="secondary" onClick={() => openPath(skill().location)}>
                      <Icon name="open-file" size="small" />
                      {language.t("settings.skills.openFile")}
                    </Button>
                  </div>
                </Show>

                <div class="border-t border-border-weak-base pt-4" dir="auto">
                  <Markdown text={skill().content || language.t("settings.skills.noContent")} class="text-14-regular" />
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  )
}
