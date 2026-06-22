# SquadCoder — Placeholder Links (fill in when URLs exist)

These were opencode.ai / Discord links inherited from upstream. They now point to `#`
(or a local asset) so nothing leaks to opencode while we don't have our own URLs yet.
Replace the `#` with the real SquadCoder URL when ready.

| Where | File | What it is | Current value | Replace with |
|---|---|---|---|---|
| Sidebar **Help** button | `packages/app/src/pages/layout.tsx` (`onOpenHelp`) | Opens help/support | `#` | SquadCoder support/GitHub URL |
| **Error page** "report this error" | `packages/app/src/pages/error.tsx` (report button `onClick`) | Opens Discord/community | `#` | SquadCoder Discord/community URL |
| **Changelog** feed | `packages/app/src/context/highlights.tsx` (`CHANGELOG_URL`) | Fetches release notes JSON | `#` | `https://<squadcoder-domain>/changelog.json` |
| Web push **notification icon** | `packages/app/src/entry.tsx` | Notification image | `/favicon-96x96-v3.png` (local `>_`) | (already local — fine) |
| Desktop **notification icon** | `packages/desktop/src/renderer/index.tsx` | Notification image | `/favicon-96x96-v3.png` (local `>_`) | (already local — fine) |

## Intentionally LEFT as `opencode.ai` (wire tokens / back-compat — do NOT change)
- `$schema: "https://opencode.ai/config.json"` — JSON-schema identifier the config validates against. Changing it breaks config validation. (per `mumin/REBRAND.md`)
- `opencode://` URL scheme, `OPENCODE_*` env vars, `@squadcoder/*` import scope — protocol/wire identifiers.

## Not touched yet (lower priority, not in the main GUI)
- `packages/enterprise/src/routes/share/[shareID].tsx` — public share page footer links to opencode.ai + opencode.ai/discord (enterprise share view; rebrand when that surface is in scope).
- `packages/console/mail/emails/templates/InviteEmail.tsx`, `packages/console/function/src/auth.ts` — console/email backend (not the desktop/web GUI).
- `social-share.png` / `social-share-zen.png` (OG images) — still broken symlink stubs; regenerate as SquadCoder social cards when doing the landing page.
- `favicon-v3.ico` / `favicon.ico` — still the old blue opencode .ico (legacy fallback). Modern browsers use the `>_` SVG; regenerate the .ico with a proper converter for old-browser/desktop parity.
