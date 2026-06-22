import type { Config } from "@mimo-ai/sdk/v2/client"
import { reconcile } from "solid-js/store"
import { showToast } from "@mimo-ai/ui/toast"
import { useGlobalSync } from "@/context/global-sync"
import { useLanguage } from "@/context/language"
import { normalizeAgentList } from "@/context/global-sync/utils"
import { useWorkspace } from "./use-workspace"

export type ConfigScope = "project" | "global"

// Single CRUD funnel for Settings sections. project = the per-directory PATCH /config path (the #55
// loader fix, proven in status-popover-body); global = the app-wide global config update + reload.
// Both DEEP-MERGE into config.json — they cannot delete keys or array elements, so:
//   - to "remove" a map entry, write a disable flag (enabled:false / disable:true)
//   - to change an array (plugins/mcp), resend the whole desired array via replaceArray()
// Uses useWorkspace (root-safe) instead of useSDK/useSync, which throw in the Settings dialog owner.
export function useConfigMutation() {
  const ws = useWorkspace()
  const globalSync = useGlobalSync()
  const language = useLanguage()

  const apply = async (scope: ConfigScope, patch: Config) => {
    if (scope === "global") {
      await globalSync.updateConfig(patch)
      return
    }
    await ws.client.config.update({ config: patch })
  }

  // Deep-set a single config path, e.g. setKey("project", ["agent", name], {...}).
  const setKey = async (scope: ConfigScope, path: string[], value: unknown) => {
    const patch: Record<string, unknown> = {}
    let node = patch
    for (let i = 0; i < path.length - 1; i++) {
      const next: Record<string, unknown> = {}
      node[path[i]] = next
      node = next
    }
    node[path[path.length - 1]] = value
    await apply(scope, patch as Config)
  }

  // Resend a whole array (plugins / mcp removal) since merge can't drop elements.
  const replaceArray = async (scope: ConfigScope, key: keyof Config, next: unknown[]) => {
    await apply(scope, { [key]: next } as Config)
  }

  // Re-read the engine's agent list after a config write so the editor reflects what was persisted.
  const refreshAgents = async () => {
    const result = await ws.client.app.agents()
    ws.set("agent", reconcile(normalizeAgentList(result.data), { key: "name" }))
  }

  const fail = (err: unknown) => {
    showToast({
      variant: "error",
      title: language.t("common.requestFailed"),
      description: err instanceof Error ? err.message : String(err),
    })
  }

  return { apply, setKey, replaceArray, refreshAgents, fail }
}
