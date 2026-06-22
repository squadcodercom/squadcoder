import { useParams } from "@solidjs/router"
import { createMemo } from "solid-js"
import { useGlobalSDK } from "@/context/global-sdk"
import { useGlobalSync } from "@/context/global-sync"
import { decode64 } from "@/utils/base64"

// The Settings dialog is shown from the root shell (pages/layout.tsx) via dialog.show(), whose owner
// sits ABOVE the per-directory SyncProvider/SDKProvider (those live in DirectoryLayout). So useSync()
// and useSDK() THROW inside Settings → sections rendered blank. This hook rebuilds the same surface
// (directory, per-directory data store + setter, a directory-bound SDK client) from app-root contexts
// (useGlobalSync child store + useGlobalSDK), which ARE reachable from the Settings dialog owner.
export function useWorkspace() {
  const params = useParams()
  const globalSync = useGlobalSync()
  const globalSDK = useGlobalSDK()

  const directory = createMemo(() => decode64(params.dir) || globalSync.data.path.directory || "")
  const pair = createMemo(() => globalSync.child(directory()))
  const client = createMemo(() => globalSDK.createClient({ directory: directory(), throwOnError: true }))

  return {
    get directory() {
      return directory()
    },
    // Per-directory reactive store — same shape as the old useSync().data (config, agent, mcp, …).
    get data() {
      return pair()[0]
    },
    // Per-directory store setter — same signature as the old useSync().set.
    get set() {
      return pair()[1]
    },
    // Directory-bound SDK client — same surface as the old useSDK().client.
    get client() {
      return client()
    },
  }
}
