#!/usr/bin/env bun
import { $ } from "bun"

import { resolveChannel } from "./utils"

const channel = resolveChannel()
await $`bun ./scripts/copy-icons.ts ${channel}`

await $`cd ../opencode && bun script/build-node.ts`

// SQUADCODER: assemble the self-contained Linux engine bundle for Remote-SSH (needs the engine
// node bundle that build-node.ts just produced). Lands in repo-root/remote-engine/ →
// resources/remote-engine/ via electron-builder extraResources.
await $`cd ../.. && bun script/make-remote-engine.ts`
