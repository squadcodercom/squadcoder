import { For, Show, createSignal } from "solid-js"
import { useLanguage } from "@/context/language"
import { Icon } from "@mimo-ai/ui/icon"

// SQUADCODER: per-workspace onboarding guide shown on the empty-session view.
// Reuses the built-in `/init` (guided AGENTS.md setup) and points the user at the
// pieces that make a new workspace productive: project context, durable notes,
// the right skills, and the local→remote-sync workflow. Dismissible, persisted
// per workspace (so it greets you once per project, never nags). UX-first, RTL-safe
// (logical `text-start`), fully translated.

const DISMISS_PREFIX = "squadcoder:onboarding-dismissed:"

interface WorkspaceOnboardingProps {
  projectRoot: string
}

export function WorkspaceOnboarding(props: WorkspaceOnboardingProps) {
  const language = useLanguage()

  const storageKey = () => DISMISS_PREFIX + props.projectRoot
  const initialDismissed = () => {
    try {
      return typeof localStorage !== "undefined" && localStorage.getItem(storageKey()) === "1"
    } catch {
      return false
    }
  }
  const [dismissed, setDismissed] = createSignal(initialDismissed())

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey(), "1")
    } catch {
      /* ignore quota/availability */
    }
    setDismissed(true)
  }

  const steps = () => [
    {
      key: "init",
      title: language.t("onboarding.workspace.init.title"),
      body: language.t("onboarding.workspace.init.body"),
      command: "/init",
    },
    {
      key: "notes",
      title: language.t("onboarding.workspace.notes.title"),
      body: language.t("onboarding.workspace.notes.body"),
    },
    {
      key: "skills",
      title: language.t("onboarding.workspace.skills.title"),
      body: language.t("onboarding.workspace.skills.body"),
    },
    {
      key: "remote",
      title: language.t("onboarding.workspace.remote.title"),
      body: language.t("onboarding.workspace.remote.body"),
    },
  ]

  return (
    <Show when={!dismissed()}>
      <div class="w-full max-w-160 mt-2 rounded-xl border border-border-weak bg-surface-base/60 p-4 text-start flex flex-col gap-3">
        <div class="flex items-start justify-between gap-3">
          <div class="flex flex-col gap-0.5 min-w-0">
            <div class="text-13-medium text-text-strong">{language.t("onboarding.workspace.title")}</div>
            <div class="text-12-regular text-text-weak leading-5">{language.t("onboarding.workspace.subtitle")}</div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            class="shrink-0 text-text-weak hover:text-text-strong transition-colors"
            aria-label={language.t("onboarding.workspace.dismiss")}
            title={language.t("onboarding.workspace.dismiss")}
          >
            <Icon name="close" size="small" />
          </button>
        </div>

        <ol class="flex flex-col gap-2.5">
          <For each={steps()}>
            {(step, index) => (
              <li class="flex items-start gap-3">
                <span class="shrink-0 mt-0.5 size-5 rounded-full bg-surface-strong text-text-weak text-11-medium flex items-center justify-center tabular-nums">
                  {index() + 1}
                </span>
                <div class="flex flex-col gap-0.5 min-w-0">
                  <div class="text-12-medium text-text-strong leading-5">
                    {step.title}
                    <Show when={step.command}>
                      <code class="ms-1.5 px-1.5 py-0.5 rounded bg-surface-strong text-text-strong text-11-medium font-mono">
                        {step.command}
                      </code>
                    </Show>
                  </div>
                  <div class="text-12-regular text-text-weak leading-5 break-words">{step.body}</div>
                </div>
              </li>
            )}
          </For>
        </ol>
      </div>
    </Show>
  )
}
