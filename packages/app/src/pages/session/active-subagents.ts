import type { Message, Part } from "@mimo-ai/sdk/v2"

// SQUADCODER (#70): a Team run spawns role subagents via the `task`/`actor` tools. Each one
// surfaces as a tool part on the orchestrator's messages, carrying state.status = pending|running
// while it is alive. Collect those into a flat list so the GUI can show "N agents working", who/
// what/which-model, and keep the Stop affordance visible while background subagents run.

export interface ActiveSubagent {
  id: string
  role: string
  description: string
  model?: string
  action?: string
}

export function collectActiveSubagents(
  messages: Message[] | undefined,
  parts: Record<string, Part[] | undefined>,
  resolveModel?: (role: string) => string | undefined,
): ActiveSubagent[] {
  if (!messages) return []
  const out: ActiveSubagent[] = []
  for (const message of messages) {
    const list = parts[message.id]
    if (!list) continue
    for (const part of list) {
      if (part.type !== "tool") continue
      if (part.tool !== "task" && part.tool !== "actor") continue
      const state = part.state as { status?: string; input?: Record<string, unknown> } | undefined
      if (!state || (state.status !== "running" && state.status !== "pending")) continue
      const input = (state.input ?? {}) as Record<string, unknown>
      const op = ((input.operation as Record<string, unknown> | undefined) ?? input) as Record<string, unknown>
      const role = typeof op.subagent_type === "string" && op.subagent_type ? op.subagent_type : "agent"
      const description = typeof op.description === "string" ? op.description : ""
      const model = typeof op.model === "string" && op.model ? op.model : resolveModel?.(role)
      const action = typeof op.action === "string" ? op.action : undefined
      const id = (part as { callID?: string }).callID ?? part.id
      out.push({ id, role, description, model, action })
    }
  }
  return out
}
