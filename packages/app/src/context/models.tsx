import { createMemo } from "solid-js"
import { createStore } from "solid-js/store"
import { DateTime } from "luxon"
import { filter, firstBy, flat, groupBy, mapValues, pipe, uniqueBy, values } from "remeda"
import { createSimpleContext } from "@mimo-ai/ui/context"
import { useProviders } from "@/hooks/use-providers"
import { Persist, persisted } from "@/utils/persist"

export type ModelKey = { providerID: string; modelID: string }

type Visibility = "show" | "hide"
type User = ModelKey & { visibility: Visibility; favorite?: boolean }
type Store = {
  user: User[]
  recent: ModelKey[]
  variant?: Record<string, string | undefined>
}

const RECENT_LIMIT = 5

function modelKey(model: ModelKey) {
  return `${model.providerID}:${model.modelID}`
}

export const { use: useModels, provider: ModelsProvider } = createSimpleContext({
  name: "Models",
  init: () => {
    const providers = useProviders()

    const [store, setStore, _, ready] = persisted(
      Persist.global("model", ["model.v1"]),
      createStore<Store>({
        user: [],
        recent: [],
        variant: {},
      }),
    )

    const available = createMemo(() =>
      providers.connected().flatMap((p) =>
        Object.values(p.models).map((m) => ({
          ...m,
          provider: p,
        })),
      ),
    )

    const release = createMemo(
      () =>
        new Map(
          available().map((model) => {
            const parsed = DateTime.fromISO(model.release_date)
            return [modelKey({ providerID: model.provider.id, modelID: model.id }), parsed] as const
          }),
        ),
    )

    const latest = createMemo(() =>
      pipe(
        available(),
        filter(
          (x) =>
            Math.abs(
              (release().get(modelKey({ providerID: x.provider.id, modelID: x.id })) ?? DateTime.invalid("invalid"))
                .diffNow()
                .as("months"),
            ) < 6,
        ),
        groupBy((x) => x.provider.id),
        mapValues((models) =>
          pipe(
            models,
            groupBy((x) => x.family),
            values(),
            (groups) =>
              groups.flatMap((g) => {
                const first = firstBy(g, [(x) => x.release_date, "desc"])
                if (!first) return []
                // SquadCoder: tag every model tied at the family's newest release_date, so a base
                // model and its "Fast" sibling (same date) are both marked Latest, not one arbitrarily.
                return g
                  .filter((x) => x.release_date === first.release_date)
                  .map((x) => ({ modelID: x.id, providerID: x.provider.id }))
              }),
          ),
        ),
        values(),
        flat(),
      ),
    )

    const latestSet = createMemo(() => new Set(latest().map((x) => modelKey(x))))

    // SquadCoder: per "provider|family" → the newest release_date string in that family.
    // Drives the curated default visibility (show only models within a window of their family's
    // newest, and Fast variants only for the newest version).
    const familyNewest = createMemo(() => {
      const map = new Map<string, string>()
      for (const m of available()) {
        if (!m.release_date) continue
        const k = `${m.provider.id}|${m.family ?? ""}`
        const cur = map.get(k)
        if (!cur || m.release_date > cur) map.set(k, m.release_date)
      }
      return map
    })

    const visibility = createMemo(() => {
      const map = new Map<string, Visibility>()
      for (const item of store.user) map.set(`${item.providerID}:${item.modelID}`, item.visibility)
      return map
    })

    const list = createMemo(() => {
      const newest = latestSet()
      return available().map((m) => ({
        ...m,
        name: m.name.replace("(latest)", "").trim(),
        // SquadCoder: "Latest" = genuinely the newest release in its family (release-date based,
        // see latestSet), NOT the unreliable "(latest)" suffix in the upstream model name — which
        // was stale (tagging Opus 4/4.1/4.5 as Latest while the real newest carried no tag).
        latest: newest.has(modelKey({ providerID: m.provider.id, modelID: m.id })),
      }))
    })

    const find = (key: ModelKey) => list().find((m) => m.id === key.modelID && m.provider.id === key.providerID)

    function update(model: ModelKey, state: Visibility) {
      const index = store.user.findIndex((x) => x.modelID === model.modelID && x.providerID === model.providerID)
      if (index >= 0) {
        setStore("user", index, (current) => ({ ...current, visibility: state }))
        return
      }
      setStore("user", store.user.length, { ...model, visibility: state })
    }

    // SquadCoder: how stale a model may be vs its family's newest before it's hidden by default.
    const FAMILY_WINDOW_MONTHS = 4

    const infoByKey = createMemo(() => {
      const map = new Map<string, ReturnType<typeof available>[number]>()
      for (const m of available()) map.set(modelKey({ providerID: m.provider.id, modelID: m.id }), m)
      return map
    })

    const visible = (model: ModelKey) => {
      const key = modelKey(model)
      // SquadCoder: hide Claude Fable 5 — not generally available yet.
      if (model.providerID === "anthropic" && model.modelID === "claude-fable-5") return false

      // SquadCoder: non-newest Fast variants are unconditionally hidden — must precede user "show"
      // overrides so stale stored state can't leak a non-newest Fast back into the list.
      const info = infoByKey().get(key)
      if (info?.id.endsWith("-fast") && info.release_date !== undefined) {
        const newest = familyNewest().get(`${info.provider.id}|${info.family ?? ""}`)
        if (newest && info.release_date !== newest) return false
      }

      const state = visibility().get(key)
      if (state === "hide") return false
      if (state === "show") return true
      // SquadCoder: drop date-suffixed duplicates (…-20251101) — the canonical alias is shown instead.
      if (/\d{6,}$/.test(model.modelID)) return false
      // Always surface the genuine newest per family.
      if (latestSet().has(key)) return true

      // Unknown/dateless models stay visible (don't hide things we can't reason about).
      if (!info?.release_date) return true

      // SquadCoder curated default: show a model only when it's within FAMILY_WINDOW_MONTHS of its
      // family's newest release. Self-maintains as new models ship. User hide/show + "Manage models" win.
      const newest = familyNewest().get(`${info.provider.id}|${info.family ?? ""}`)
      if (!newest) return true
      const cutoff = DateTime.fromISO(newest).minus({ months: FAMILY_WINDOW_MONTHS })
      return DateTime.fromISO(info.release_date) >= cutoff
    }

    const setVisibility = (model: ModelKey, state: boolean) => {
      update(model, state ? "show" : "hide")
    }

    const push = (model: ModelKey) => {
      const uniq = uniqueBy([model, ...store.recent], (x) => `${x.providerID}:${x.modelID}`)
      if (uniq.length > RECENT_LIMIT) uniq.pop()
      setStore("recent", uniq)
    }

    const variantKey = (model: ModelKey) => `${model.providerID}/${model.modelID}`
    const getVariant = (model: ModelKey) => store.variant?.[variantKey(model)]

    const setVariant = (model: ModelKey, value: string | undefined) => {
      const key = variantKey(model)
      if (!store.variant) {
        setStore("variant", { [key]: value })
        return
      }
      setStore("variant", key, value)
    }

    return {
      ready,
      list,
      find,
      visible,
      setVisibility,
      recent: {
        list: createMemo(() => store.recent),
        push,
      },
      variant: {
        get: getVariant,
        set: setVariant,
      },
    }
  },
})
