import { type Component, type JSX, Show } from "solid-js"

// Shared Settings page shell — one consistent frame for every Settings section (Agents, Skills, MCP,
// Plugins, Remote, Indexing). Matches the existing SettingsGeneral layout (scrollable body, sticky
// header) so new sections look native. RTL-safe (logical padding, dir="auto" left to children).
export const SettingsSection: Component<{
  title: string
  description?: JSX.Element
  /** Right-aligned action slot in the header (e.g. an "Add" button or scope selector). */
  action?: JSX.Element
  children: JSX.Element
}> = (props) => {
  return (
    <div class="flex flex-col h-full overflow-hidden">
      <div class="flex items-start justify-between gap-3 px-4 sm:px-10 pt-6 pb-4 border-b border-border-weak-base shrink-0">
        <div class="flex flex-col gap-1 min-w-0">
          <h2 class="text-16-medium text-text-strong">{props.title}</h2>
          <Show when={props.description}>
            <p class="text-12-regular text-text-weak">{props.description}</p>
          </Show>
        </div>
        <Show when={props.action}>
          <div class="shrink-0">{props.action}</div>
        </Show>
      </div>
      <div class="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 sm:px-10 py-6">{props.children}</div>
    </div>
  )
}

// Shared title/description-start, control-end row. Promoted from the private SettingsRow in
// settings-general.tsx so sections stop hand-rolling rows.
export const SettingsRow: Component<{
  title: string | JSX.Element
  description?: string | JSX.Element
  children: JSX.Element
}> = (props) => {
  return (
    <div class="flex flex-wrap items-center gap-4 py-3 border-b border-border-weak-base last:border-none sm:flex-nowrap">
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="text-14-medium text-text-strong">{props.title}</span>
        <Show when={props.description}>
          <span class="text-12-regular text-text-weak" dir="auto">
            {props.description}
          </span>
        </Show>
      </div>
      <div class="flex w-full justify-end sm:w-auto sm:shrink-0">{props.children}</div>
    </div>
  )
}
