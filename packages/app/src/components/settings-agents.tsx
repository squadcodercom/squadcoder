import type { AgentConfig } from "@squadcoder/sdk/v2/client"
import { Button } from "@squadcoder/ui/button"
import { useDialog } from "@squadcoder/ui/context/dialog"
import { Icon } from "@squadcoder/ui/icon"
import { Select } from "@squadcoder/ui/select"
import { Switch } from "@squadcoder/ui/switch"
import { TextField } from "@squadcoder/ui/text-field"
import { showToast } from "@squadcoder/ui/toast"
import { type Component, createEffect, createMemo, createSignal, For, Show } from "solid-js"
import { createStore } from "solid-js/store"
import { DialogAgentModel } from "@/components/dialog-agent-model"
import { DialogSettings } from "@/components/dialog-settings"
import { useLanguage } from "@/context/language"
import { useModels } from "@/context/models"
import { type ConfigScope, useConfigMutation } from "./settings/use-config-mutation"
import { useWorkspace } from "./settings/use-workspace"

type AgentMode = "primary" | "subagent" | "all"

// One unified list entry whether the agent is currently active (runtime) or disabled (config-only,
// since the engine drops disabled agents from `app.agents()` — see agent.ts:372). Disabled entries
// are rebuilt from config so they can be re-enabled from here.
type AgentEntry = {
  name: string
  native: boolean
  disabled: boolean
  description?: string
  mode: AgentMode
  model?: { providerID: string; modelID: string }
  temperature?: number
  topP?: number
  prompt?: string
  color?: string
}

const MODES: AgentMode[] = ["primary", "subagent", "all"]

const parseModelRef = (ref: string | undefined): { providerID: string; modelID: string } | undefined => {
  if (!ref || !ref.includes("/")) return undefined
  const idx = ref.indexOf("/")
  return { providerID: ref.slice(0, idx), modelID: ref.slice(idx + 1) }
}

// SQUADCODER Settings ▸ Agents (#37/#62): config-layer editor for every agent (built-in + custom).
// Reuses `sync.data.agent` (runtime) + `config.agent[name]` writes (the #55-fixed loader path) +
// the modal model picker. No new engine routes — true delete/groups for file agents come in Phase 4.
export const SettingsAgents: Component<{ agent?: string }> = (props) => {
  const language = useLanguage()
  const ws = useWorkspace()
  const models = useModels()
  const dialog = useDialog()
  const mutation = useConfigMutation()

  const [scope, setScope] = createSignal<ConfigScope>("project")
  const [selected, setSelected] = createSignal<string | undefined>(props.agent)
  const [busy, setBusy] = createSignal(false)

  const configAgents = createMemo(() => (ws.data.config.agent ?? {}) as Record<string, AgentConfig>)

  // Active agents from the engine (built-in + config + file), minus hidden ones.
  const runtime = createMemo<AgentEntry[]>(() =>
    (ws.data.agent ?? [])
      .filter((a) => !a.hidden)
      .map((a) => ({
        name: a.name,
        native: a.native ?? false,
        disabled: false,
        description: a.description,
        mode: a.mode,
        model: a.model,
        temperature: a.temperature,
        topP: a.topP,
        prompt: a.prompt,
        color: a.color,
      })),
  )

  // Config agents flagged disabled (engine hides them from the runtime list) — surface so they can
  // be turned back on.
  const disabled = createMemo<AgentEntry[]>(() => {
    const live = new Set(runtime().map((a) => a.name))
    return Object.entries(configAgents())
      .filter(([name, cfg]) => cfg.disable && !live.has(name))
      .map(([name, cfg]) => ({
        name,
        native: false,
        disabled: true,
        description: cfg.description,
        mode: (cfg.mode as AgentMode) ?? "all",
        model: parseModelRef(cfg.model),
        temperature: cfg.temperature,
        topP: cfg.top_p,
        prompt: cfg.prompt,
        color: typeof cfg.color === "string" ? cfg.color : undefined,
      }))
  })

  const agents = createMemo(() =>
    [...runtime(), ...disabled()].sort((a, b) => a.name.localeCompare(b.name)),
  )

  // SquadCoder: group the flat list into Primary / Team roles / Subagents so the org hierarchy reads
  // clearly (e.g. team-architect/team-dev sit under "Team roles", not scattered alphabetically among
  // unrelated agents). A "team" agent (or any name starting with "team-") is a Team role regardless
  // of mode; the rest split by mode (primary vs subagent), with "all"-mode agents shown as primary.
  const isTeamRole = (name: string) => name === "team" || name.startsWith("team-")
  const groupedAgents = createMemo(() => {
    const team: AgentEntry[] = []
    const primary: AgentEntry[] = []
    const subagent: AgentEntry[] = []
    for (const a of agents()) {
      if (isTeamRole(a.name)) team.push(a)
      else if (a.mode === "subagent") subagent.push(a)
      else primary.push(a)
    }
    return [
      { key: "primary", label: language.t("settings.agents.group.primary"), items: primary },
      { key: "team", label: language.t("settings.agents.group.team"), items: team },
      { key: "subagent", label: language.t("settings.agents.group.subagent"), items: subagent },
    ].filter((g) => g.items.length > 0)
  })

  const currentEntry = createMemo(() => agents().find((a) => a.name === selected()))

  const [form, setForm] = createStore({
    description: "",
    mode: "all" as AgentMode,
    model: undefined as { providerID: string; modelID: string } | undefined,
    temperature: "",
    topP: "",
    prompt: "",
    color: "",
    enabled: true,
  })

  // Auto-select the first agent + reseed the form whenever the selection changes.
  createEffect(() => {
    const list = agents()
    if (!selected() && list[0]) setSelected(list[0].name)
  })

  createEffect(() => {
    const entry = currentEntry()
    if (!entry) return
    setForm({
      description: entry.description ?? "",
      mode: entry.mode,
      model: entry.model,
      temperature: entry.temperature != null ? String(entry.temperature) : "",
      topP: entry.topP != null ? String(entry.topP) : "",
      prompt: entry.prompt ?? "",
      color: entry.color ?? "",
      enabled: !entry.disabled,
    })
  })

  const modelLabel = createMemo(() => {
    const m = form.model
    if (!m) return undefined
    const found = models.list().find((x) => x.id === m.modelID && x.provider.id === m.providerID)
    return found?.name ?? `${m.providerID}/${m.modelID}`
  })

  const save = async () => {
    const name = selected()
    if (!name) return
    setBusy(true)
    try {
      // Merge-only write: only defined keys are sent. Empty number/text fields are skipped so the
      // existing/default value is preserved (true "clear back to default" needs a file route — P4).
      const patch: AgentConfig = { mode: form.mode, disable: !form.enabled }
      const desc = form.description.trim()
      if (desc) patch.description = desc
      if (form.model) patch.model = `${form.model.providerID}/${form.model.modelID}`
      const temp = form.temperature.trim()
      if (temp !== "" && !Number.isNaN(Number(temp))) patch.temperature = Number(temp)
      const topP = form.topP.trim()
      if (topP !== "" && !Number.isNaN(Number(topP))) patch.top_p = Number(topP)
      if (form.prompt.trim()) patch.prompt = form.prompt
      const color = form.color.trim()
      if (color) patch.color = color

      await mutation.setKey(scope(), ["agent", name], patch)
      await mutation.refreshAgents()
      showToast({ variant: "success", title: language.t("settings.agents.saved") })
    } catch (err) {
      mutation.fail(err)
    } finally {
      setBusy(false)
    }
  }

  const scopeOptions = createMemo(() => [
    { value: "project" as ConfigScope, label: language.t("settings.scope.project") },
    { value: "global" as ConfigScope, label: language.t("settings.scope.global") },
  ])

  return (
    <div class="flex flex-col h-full overflow-hidden">
      <div class="flex items-start justify-between gap-3 px-4 sm:px-10 pt-6 pb-4 border-b border-border-weak-base shrink-0">
        <div class="flex flex-col gap-1 min-w-0">
          <h2 class="text-16-medium text-text-strong">{language.t("settings.agents.title")}</h2>
          <p class="text-12-regular text-text-weak">{language.t("settings.agents.description")}</p>
        </div>
        <div class="shrink-0">
          <Select
            options={scopeOptions()}
            current={scopeOptions().find((o) => o.value === scope())}
            value={(o) => o.value}
            label={(o) => o.label}
            onSelect={(o) => o && setScope(o.value)}
            size="small"
            triggerVariant="settings"
            aria-label={language.t("settings.scope.label")}
          />
        </div>
      </div>

      <div class="flex flex-1 min-h-0">
        {/* Master: agent list */}
        <aside class="w-56 shrink-0 border-e border-border-weak-base overflow-y-auto p-2 flex flex-col gap-0.5">
          <Show
            when={agents().length > 0}
            fallback={<div class="text-12-regular text-text-weak p-2">{language.t("settings.agents.empty")}</div>}
          >
            <For each={groupedAgents()}>
              {(group) => (
                <div class="flex flex-col gap-0.5">
                  <div class="text-10-medium uppercase tracking-wide text-text-weak px-2 pt-2 pb-1">
                    {group.label}
                  </div>
                  <For each={group.items}>
                    {(agent) => (
                      <button
                        type="button"
                        class="flex items-center gap-2 text-start px-2 py-1.5 rounded-md transition-colors"
                        classList={{
                          "bg-surface-raised-base text-text-strong": selected() === agent.name,
                          "text-text-base hover:bg-surface-raised-base-hover": selected() !== agent.name,
                        }}
                        onClick={() => setSelected(agent.name)}
                      >
                        <div
                          classList={{
                            "size-1.5 rounded-full shrink-0": true,
                            "bg-icon-success-base": !agent.disabled,
                            "bg-border-weak-base": agent.disabled,
                          }}
                        />
                        <span class="text-13-regular truncate flex-1 capitalize">{agent.name}</span>
                        <Show when={agent.native}>
                          <span class="text-10-medium text-text-weak bg-surface-base px-1.5 py-0.5 rounded shrink-0">
                            {language.t("settings.agents.builtin")}
                          </span>
                        </Show>
                      </button>
                    )}
                  </For>
                </div>
              )}
            </For>
          </Show>
        </aside>

        {/* Detail: editor */}
        <div class="flex-1 min-w-0 overflow-y-auto px-4 sm:px-8 py-6">
          <Show
            when={currentEntry()}
            fallback={
              <div class="text-12-regular text-text-weak">{language.t("settings.agents.selectPrompt")}</div>
            }
          >
            {(entry) => (
              <div class="flex flex-col gap-6 max-w-2xl">
                <div class="flex items-center gap-2">
                  <h3 class="text-15-medium text-text-strong capitalize">{entry().name}</h3>
                  <Show when={entry().disabled}>
                    <span class="text-10-medium text-text-weak bg-surface-base px-1.5 py-0.5 rounded">
                      {language.t("settings.agents.disabled")}
                    </span>
                  </Show>
                </div>

                {/* Enabled toggle */}
                <div class="flex items-center justify-between gap-4 py-1">
                  <div class="flex flex-col gap-0.5 min-w-0">
                    <span class="text-14-medium text-text-strong">{language.t("settings.agents.field.enabled")}</span>
                    <span class="text-12-regular text-text-weak">{language.t("settings.agents.field.enabledHint")}</span>
                  </div>
                  <Switch checked={form.enabled} onChange={(v) => setForm("enabled", v)} />
                </div>

                {/* Mode chips */}
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.agents.field.mode")}</span>
                  <div class="flex gap-2">
                    <For each={MODES}>
                      {(mode) => (
                        <Button
                          size="small"
                          variant={form.mode === mode ? "primary" : "secondary"}
                          onClick={() => setForm("mode", mode)}
                        >
                          {language.t(`settings.agents.mode.${mode}`)}
                        </Button>
                      )}
                    </For>
                  </div>
                </div>

                {/* Model override */}
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.agents.field.model")}</span>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      class="flex items-center gap-1.5 max-w-[260px] truncate text-13-regular text-text-base bg-surface-raised-base hover:bg-surface-raised-base-hover rounded-md px-3 h-8"
                      onClick={() => {
                        // The dialog context is single-slot: dialog.show() disposes this Settings
                        // dialog (and its unsaved form). Capture name+scope into plain consts so the
                        // onSelect closure never reads disposed signals, persist directly, then
                        // re-show Settings back on the Agents pane for this agent.
                        const capturedName = entry().name
                        const capturedScope = scope()
                        const capturedCurrent = form.model
                          ? { id: form.model.modelID, provider: { id: form.model.providerID } }
                          : undefined
                        dialog.show(() => (
                          <DialogAgentModel
                            agent={capturedName}
                            current={capturedCurrent}
                            closeOnSelect={false}
                            onSelect={async (providerID, modelID) => {
                              await mutation.setKey(capturedScope, ["agent", capturedName], {
                                model: `${providerID}/${modelID}`,
                              })
                              await mutation.refreshAgents()
                              dialog.show(() => <DialogSettings section="agents" agent={capturedName} />)
                            }}
                          />
                        ))
                      }}
                    >
                      <span class="truncate">{modelLabel() ?? language.t("settings.agents.modelDefault")}</span>
                      <Icon name="chevron-down" size="small" class="text-icon-weak shrink-0" />
                    </button>
                    <Show when={form.model}>
                      <Button size="small" variant="ghost" onClick={() => setForm("model", undefined)}>
                        {language.t("settings.agents.modelReset")}
                      </Button>
                    </Show>
                  </div>
                </div>

                {/* Temperature + Top-P */}
                <div class="flex flex-wrap gap-4">
                  <div class="flex flex-col gap-2 w-40">
                    <span class="text-14-medium text-text-strong">{language.t("settings.agents.field.temperature")}</span>
                    <TextField
                      type="number"
                      inputmode="decimal"
                      step="0.1"
                      min="0"
                      max="2"
                      value={form.temperature}
                      onChange={(v) => setForm("temperature", v)}
                      placeholder={language.t("settings.agents.placeholder.temperature")}
                      aria-label={language.t("settings.agents.field.temperature")}
                    />
                  </div>
                  <div class="flex flex-col gap-2 w-40">
                    <span class="text-14-medium text-text-strong">{language.t("settings.agents.field.topP")}</span>
                    <TextField
                      type="number"
                      inputmode="decimal"
                      step="0.05"
                      min="0"
                      max="1"
                      value={form.topP}
                      onChange={(v) => setForm("topP", v)}
                      placeholder={language.t("settings.agents.placeholder.topP")}
                      aria-label={language.t("settings.agents.field.topP")}
                    />
                  </div>
                </div>

                {/* Description */}
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.agents.field.description")}</span>
                  <span class="text-12-regular text-text-weak">{language.t("settings.agents.field.descriptionHint")}</span>
                  <TextField
                    multiline
                    dir="auto"
                    value={form.description}
                    onChange={(v) => setForm("description", v)}
                    placeholder={language.t("settings.agents.placeholder.description")}
                    aria-label={language.t("settings.agents.field.description")}
                  />
                </div>

                {/* System prompt */}
                <div class="flex flex-col gap-2">
                  <span class="text-14-medium text-text-strong">{language.t("settings.agents.field.prompt")}</span>
                  <span class="text-12-regular text-text-weak">{language.t("settings.agents.field.promptHint")}</span>
                  <TextField
                    multiline
                    dir="auto"
                    class="font-mono"
                    value={form.prompt}
                    onChange={(v) => setForm("prompt", v)}
                    placeholder={language.t("settings.agents.placeholder.prompt")}
                    aria-label={language.t("settings.agents.field.prompt")}
                  />
                </div>

                <p class="text-12-regular text-text-weak">{language.t("settings.agents.mergeNote")}</p>

                <div class="flex items-center gap-3 pt-2">
                  <Button variant="primary" onClick={() => void save()} disabled={busy()}>
                    {language.t("settings.agents.save")}
                  </Button>
                </div>
              </div>
            )}
          </Show>
        </div>
      </div>
    </div>
  )
}
