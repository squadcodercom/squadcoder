import { createMemo, createSignal, onCleanup } from "solid-js"
import { useGlobalSDK } from "@/context/global-sdk"
import { useWorkspace } from "@/components/settings/use-workspace"

// SQUADCODER: reads the Anthropic Pro/Max subscription-window usage snapshot the auth plugin captures
// from `anthropic-ratelimit-unified-*` response headers and the engine serves at GET /usage/anthropic.
// Drives the yellow "approaching usage limit" dock above the prompt input. OAuth-only — API-key auth
// returns an empty object, so the banner simply never shows.

export type UsageBucket = { utilization: number | null; resetsAt: number | null }
export type AnthropicUsage = {
  status?: string | null
  fiveHour?: UsageBucket
  sevenDay?: UsageBucket
  capturedAt?: number
}

type WorstBucket = { window: "fiveHour" | "sevenDay"; utilization: number; resetsAt: number | null }

const POLL_MS = 60_000
const WARN_AT = 80 // % utilization at which we start warning (matches Claude Code's posture)

export function useAnthropicUsage() {
  const globalSDK = useGlobalSDK()
  const ws = useWorkspace()
  const [data, setData] = createSignal<AnthropicUsage | undefined>()
  const [dismissedReset, setDismissedReset] = createSignal<number | null | undefined>(undefined)

  const poll = async () => {
    const res = await fetch(`${globalSDK.url}/usage/anthropic`, {
      headers: { "x-mimocode-directory": ws.directory },
    }).catch(() => undefined)
    if (!res?.ok) return
    const json = (await res.json().catch(() => undefined)) as AnthropicUsage | undefined
    if (json) {
      // Utilization can arrive as a 0–1 FRACTION (0.75) — normalize to a 0–100 percent so the % display
      // AND the WARN_AT threshold are correct (0.75 → 75; an already-0–100 value passes through). This is
      // the fix for the "1%" bug (0.75 was being Math.round'ed to 1).
      const norm = (b: UsageBucket | undefined): UsageBucket | undefined =>
        b && typeof b.utilization === "number"
          ? { ...b, utilization: b.utilization <= 1 ? b.utilization * 100 : b.utilization }
          : b
      json.fiveHour = norm(json.fiveHour)
      json.sevenDay = norm(json.sevenDay)
    }
    setData(json?.fiveHour || json?.sevenDay ? json : undefined)
  }

  void poll()
  const timer = setInterval(() => void poll(), POLL_MS)
  onCleanup(() => clearInterval(timer))

  const worst = createMemo<WorstBucket | undefined>(() => {
    const d = data()
    if (!d) return undefined
    const five = d.fiveHour?.utilization ?? -1
    const seven = d.sevenDay?.utilization ?? -1
    if (five < 0 && seven < 0) return undefined
    return five >= seven
      ? { window: "fiveHour", utilization: five, resetsAt: d.fiveHour?.resetsAt ?? null }
      : { window: "sevenDay", utilization: seven, resetsAt: d.sevenDay?.resetsAt ?? null }
  })

  const approaching = createMemo(() => {
    const d = data()
    const w = worst()
    if (!d || !w) return false
    const hot = w.utilization >= WARN_AT || d.status === "allowed_warning" || d.status === "rejected"
    if (!hot) return false
    // Stay dismissed only until the relevant window resets (resetsAt changes) — then warn again.
    return dismissedReset() !== w.resetsAt
  })

  const dismiss = () => setDismissedReset(worst()?.resetsAt ?? null)

  return { usage: data, worst, approaching, dismiss }
}
