---
name: sc:mcp-builder
description: "Design and build a production MCP (Model Context Protocol) server: pick stdio vs HTTP transport, define tools/resources/prompts with strict input schemas, handle auth and secrets safely, and ship it. Covers Node/TypeScript and Python SDKs, error handling, and how to register it in an opencode/Claude/Codex config. Activate for: build an MCP, MCP server, model context protocol, add a tool server, expose an API as MCP, MCP טו‎ול, שרת MCP."
argument-hint: "[what the MCP should expose]"
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# MCP Builder — ship a production Model Context Protocol server

Build an MCP server that an agent can safely call. Optimize for **small, well-typed tools** and a
**tight security surface** — an MCP tool is remote code execution by another name.

## Step 0 — scope it
- **What does it expose?** Tools (actions), resources (readable data), prompts (templates) — pick only
  what's needed. Fewer, sharper tools beat many fuzzy ones.
- **Transport:** `stdio` for a local process the client spawns (most common, simplest); **streamable
  HTTP** for a hosted/shared server. Don't expose stdio servers on a network.
- **Secrets:** which env vars/keys does it need? They stay in the client config / env, never hard-coded.

## Step 1 — scaffold (reuse the official SDK, don't hand-roll the protocol)
**TypeScript/Node** (`@modelcontextprotocol/sdk`):
```ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
import { z } from "zod"

const server = new McpServer({ name: "my-mcp", version: "1.0.0" })

server.tool(
  "get_thing",
  "Fetch a thing by id. Read-only.",
  { id: z.string().describe("the thing id") },
  async ({ id }) => ({ content: [{ type: "text", text: await fetchThing(id) }] }),
)

await server.connect(new StdioServerTransport())
```
**Python** (`mcp` package) mirrors this with `FastMCP` + `@mcp.tool()`.

## Step 2 — design each tool well
- **Name** = a verb_noun the model will guess (`search_issues`, not `do`).
- **Description** = one line: what it does + side effects + "read-only" if it is.
- **Input schema** = strict (zod/pydantic). Validate everything; reject unknown fields. Describe each param.
- **Output** = structured `content` (text/json/image). Return useful errors as content, not silent failures.
- **Idempotency & side effects** — mark mutating tools clearly; never auto-delete without confirmation.

## Step 3 — security (do this, not later)
- Validate and sanitize all inputs; **path-escape** checks for any filesystem tool (refuse paths that
  escape the project root). Parameterize any DB/query tool — never string-concat user input.
- Secrets only from env; never log them; never echo them in tool output.
- Least privilege: a read tool must not be able to write. Time out and bound expensive calls.
- For HTTP transport: require auth, bind to `127.0.0.1` unless intentionally public, rate-limit.

## Step 4 — test
- Unit-test each tool's handler directly.
- Smoke-test over the wire with the MCP Inspector (`npx @modelcontextprotocol/inspector <cmd>`).
- Verify error paths (bad input, missing auth) return clean errors, not stack traces.

## Step 5 — register it
opencode/SquadCoder `squadcoder.json` (or `.mcp.json`):
```jsonc
"mcp": {
  "my-mcp": {
    "type": "local",
    "command": ["npx", "-y", "my-mcp-server"],
    "enabled": true,          // key-required servers ship enabled:false until configured
    "environment": { "MY_API_KEY": "${MY_API_KEY}" }
  }
}
```
Document required env vars and whether it ships enabled or disabled.

## Checklist before shipping
- [ ] Every tool: clear name, one-line description, strict schema, side-effects noted.
- [ ] Inputs validated; paths/queries safe; secrets from env only.
- [ ] Errors returned cleanly; expensive calls bounded.
- [ ] Tested via Inspector; registered with documented env.
- [ ] License + README with setup steps.
