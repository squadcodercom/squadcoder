# SquadCoder — Full Rebrand Map (every place a brand name lives)

> Purpose: when you pick the **new name**, do a *single* systematic sweep instead of re-searching.
> This maps **every brand-bearing location** found by a 10-agent audit of the repo (≈333 sites).
> Lineage: `sst/opencode` → (content fork) `XiaomiMiMo/MiMo-Code` → (our fork) **this repo**.

## 0. Read this first — the repo has THREE brand layers

The codebase is *mid-rebrand*. Three brands coexist, at different depths:

| Layer | Tokens | State |
|---|---|---|
| **opencode** (original) | `opencode`, `SquadCoder`, `ai.opencode`, `opencode.ai`, `anomalyco`, `anoma.ly`, `sst-dev`, `OPENCODE_*` | Still everywhere one+ layers down (web site, docs, infra, icons, env wire-names, VS Code ext) |
| **MiMoCode** (Xiaomi's layer) | `mimocode`, `@squadcoder/*`, `MIMOCODE_*`, `MiMo`, `Xiaomi`, `mimo.xiaomi.com`, `XiaomiMiMo/MiMo-Code` | The npm scope of **every** package + the whole env-flag namespace; itself never finished |
| **SquadCoder** (our visible layer) | `SquadCoder`, `mumin`, `squadcoder`, `MUMIN AI`, `.squadcoder`, `ai.squadcoder`, `@squadcoder/`, `SQUADCODER_*` | Only the *visible* surface: CLI wordmark, binary name, desktop productName/appId, config dir, brand SVGs, seed, Team Mode |

**So a "rename to NewName" is two jobs:**
- **Job A** — swap our **SquadCoder** tokens → **NewName** (small, ~40 sites; we chose these).
- **Job B** — finish the inherited rebrand: the **opencode / mimocode / @mimo-ai / Xiaomi** leftovers (large, ~270 sites). Optional for a soft launch, required for a clean product.

Plus a hard **DO-NOT-TOUCH** set (wire identifiers + back-compat) that will break things if renamed — see §6.

---

## 1. Decisions the new name forces (lock these before sweeping)

| Decision | Current | Notes |
|---|---|---|
| **Display name** | `SquadCoder` / `MUMIN AI` | the brand string + ASCII wordmark |
| **Binary name** | `mumin` | `bin/mumin`, build outfile, install command |
| **npm scope** | mixed: `@squadcoder/*` (desktop, cli platform pkgs) **and** `@squadcoder/*` (everything else) | **Biggest blast radius** — `@squadcoder/` appears in **261 imports across 100+ files**. Decide: rename the whole scope to `@newname/` (touches every package + import) or leave `@mimo-ai` internal. |
| **Config dir** | `.squadcoder` (with `.mimocode` read for back-compat) | not shipped yet → safe to rename `.squadcoder`→`.newname`; keep `.mimocode` back-compat only |
| **Config home (XDG app dir)** | `squadcoder` (`packages/shared/src/global.ts` `APP`) | `%APPDATA%/squadcoder` etc.; legacy `mimocode` already migrated |
| **App ID** | `ai.squadcoder.desktop[.dev/.beta]` | macOS/Windows app identity |
| **Deep-link scheme** | `squadcoder://` (+ `opencode://` kept for back-compat) | |
| **Marketplace publisher** (VS Code) | none yet (CLI installs `sst-dev.opencode`!) | requires a real VS Marketplace + Open VSX **publisher account** — see §5 |
| **Repo / domain / org** | `XiaomiMiMo/MiMo-Code`, `mimo.xiaomi.com`, `opencode.ai`, `anomalyco` | pick the real GitHub repo URL, marketing domain, support email, install URL |
| **Env-flag namespace** | `MIMOCODE_*` (active) + `OPENCODE_*` (wire) + `SQUADCODER_*` (ours) | mostly **keep** (see §6); only rename `SQUADCODER_*` |

---

## 2. JOB A — our SquadCoder tokens → NewName (we chose these; swap all)

Token find→replace (case-sensitive variants all exist):

| Find | Where it lives | Replace with |
|---|---|---|
| `SquadCoder` | desktop `productName`, window titles, menus, banners, README, i18n `he.ts`, docs | `NewName` |
| `MUMIN AI` (ASCII art) | `packages/opencode/src/cli/logo.ts`, `cli/ui.ts` | new ASCII wordmark |
| `mumin` (binary) | `packages/opencode/bin/mumin`, `script/build.ts` outfile+smoke, `package.json` bin | `newbin` |
| `squadcoder` (lowercase id) | `ai.squadcoder.*`, `rpm` pkg, `artifactName`, dirs, `@squadcoder/` | `newname` |
| `.squadcoder` (config/seed dir) | `config/paths.ts`, `global/seed.ts`, `.squadcoder/`, `squadcoder.json` | `.newname` |
| `squadcoder.json[c]` (config file) | `config/config.ts` candidates, root `squadcoder.json`, `seed/squadcoder.json` | `newname.json` |
| `@squadcoder/` (partial npm scope) | `script/build.ts` platform pkgs, `packages/desktop/package.json` | `@newscope/` |
| `ai.squadcoder.desktop` (appId) | `packages/desktop/electron-builder.config.ts` | `ai.newname.desktop` |
| `SQUADCODER_SEED_DIR`, `SQUADCODER_ENABLE_OPENCODE_PROVIDERS` (env) | `global/seed.ts`, `desktop/src/main/server.ts`, `plugin/mimo.ts`, `.squadcoder/SETUP.md` | `NEWNAME_*` |
| `squadcoder-icon.svg`, `squadcoder-banner.svg/.png` (assets) | `assets/brand/*`, `script/gen-brand-icons.ts` | regenerate (see §4) |

**Files that are already SquadCoder and need the swap** (high-signal): `packages/opencode/src/cli/logo.ts`, `cli/ui.ts`, `packages/desktop/electron-builder.config.ts`, `packages/desktop/package.json`, `packages/desktop/src/main/server.ts`, `packages/shared/src/global.ts` (`APP`), `packages/opencode/src/config/{paths,config}.ts` (candidate lists), `packages/opencode/src/global/seed.ts`, `script/make-seed.ts`, `script/gen-brand-icons.ts`, `assets/brand/*`, root `squadcoder.json` + `.squadcoder/**`, `seed/**`, the 10 Team Mode files in `.squadcoder/agent/*.md`, `release/README.md`, memory docs.

---

## 3. JOB B — finish the inherited rebrand (opencode / mimocode / @mimo-ai / Xiaomi)

Grouped by surface. **(R)** = text rename, **(?)** = review/decide, **(K)** = keep (see §6).

### 3a. Build / binary / publish pipeline
- `packages/opencode/script/build.ts` **(R)** — UA `mimocode/${version}`, `MIMOCODE_VERSION/_CHANNEL` defines, repo url `XiaomiMiMo/MiMo-Code` **(?)**
- `packages/opencode/script/build-node.ts` **(R)** — `@squadcoder/script`, `MIMOCODE_CHANNEL`
- `packages/opencode/src/installation/{index,version}.ts` **(R)** — `USER_AGENT mimocode/…`, `PACKAGE_NAME @squadcoder/cli`, install URL `mimo.xiaomi.com/install`, releases `XiaomiMiMo/MiMo-Code`, `MIMOCODE_VERSION/_CHANNEL` consumers
- `packages/opencode/package.json` **(R)** — name `@squadcoder/cli`; **ships BOTH `mimo` and `mumin` bins**
- `packages/opencode/bin/mumin` **(R)** — internals still resolve `@squadcoder/mimocode-<plat>`, `mimo`/`mimo.exe`, `.mimocode`, `MIMOCODE_BIN_PATH` (MUST match build.ts output names)
- `packages/opencode/bin/mimo` **(?)** — fully MiMo-branded duplicate launcher; likely **delete** or keep as alias
- `packages/opencode/script/postinstall.mjs` **(R)** — `@squadcoder/mimocode-*`, `mimo`(.exe)
- `packages/opencode/script/publish.ts` **(R)** — author "Xiaomi MiMo Team", `mimo.xiaomi.com`, keywords xiaomi/mimo, bin `mimo`
- `packages/script/src/index.ts` + `packages/script/package.json` **(R)** — `MIMOCODE_*` env reads, `@squadcoder/script`
- root `script/{release,publish,version}.ts`, root `package.json` (name `opencode`, repo `anomalyco`) **(R)**

### 3b. npm scope & package names — `@squadcoder/*` (the big one)
Every workspace package is still `@squadcoder/*`: `cli, script, shared, plugin, sdk, app, ui, web, enterprise, function, slack, storybook, console-{app,core,function,mail,resource}`. **261 import sites across 100+ `.ts/.tsx`.** Renaming the scope = update all package `name` fields **and** every `from "@squadcoder/…"` import. Decide first (Job-A scope `@squadcoder/` is only on 2 packages). `packages/sdk/openapi.json` also references `@mimo-ai` **(?)**.

### 3c. Web marketing/docs site — `packages/web` (NOT rebranded at all)
Still full opencode/Anomaly: `config.mjs` (`opencode.ai`, `github.com/anomalyco/opencode`, `contact@anoma.ly`, discord), `astro.config.mjs` title, `components/{Head,Lander,Footer}.astro`, `pages/s/[id].astro`, `content/i18n/*.json`, and the **docs content tree** `content/docs/**/*.mdx` across ~18 locales (`opencode`, `SquadCoder`, `OPENCODE_`, `ai.opencode`, `@mimo-ai`, `anomalyco`). Logos/favicons → §4.

### 3d. CLI / TUI / GUI visible strings & i18n
- `cli/logo.ts`, `cli/ui.ts` **(?)** — already "MUMIN AI" but still contain `MiMo Code`/`Xiaomi`/`MIMOCODE` leftovers
- TUI i18n `packages/opencode/src/cli/cmd/tui/i18n/{en,es,fr,ja,ru,zh,zht}.ts` **(R)** — visible `MiMoCode`/`MiMo Code`/`Xiaomi`/`opencode`
- App i18n `packages/app/src/i18n/*.ts` (all locales) **(R)** — `SquadCoder`/`opencode`
- Console i18n `packages/console/app/src/i18n/*.ts` **(R)**; `component/header.tsx` **(asset/R)**
- Desktop GUI: `src/main/{index,menu,windows}.ts`, `src/renderer/{index,loading}.html`, `src/renderer/i18n/*.ts` **(R)** — `SquadCoder`, menu links `opencode.ai/docs`, `discord.com/invite/opencode`, `github.com/anomalyco/opencode`
- `packages/ui/src/components/{logo.tsx,favicon.tsx}`, `assets/favicon/site.webmanifest` **(R/asset)**

### 3e. Cloud infra / containers / nix (critic-found — never mapped before)
- `infra/{stage,app,console,enterprise}.ts` **(?)** — SST: domains `opencode.ai`/`dev.opencode.ai`, org `anomalyco`, `OPENCODE_STORAGE_*`, display names "SquadCoder Go"/"SquadCoder Black"
- `packages/containers/script/build.ts` + `*/Dockerfile` + `README.md` **(?)** — registry `ghcr.io/anomalyco`, buildx builder `opencode`
- `nix/{desktop,node_modules}.nix` **(?)** — `opencode-desktop`, `SquadCoder.app`, pnames
- `packages/identity/{mark.svg,mark-light.svg,mark-*.png}` **(asset)** — a 6-file brand-mark set `gen-brand-icons.ts` does NOT regenerate

### 3f. Repo meta / CI / dev
- `.github/workflows/test.yml` **(R)** — CI git user `ci@mimo.ai` / `mimo-ci`
- `.github/ISSUE_TEMPLATE/bug-report.yml` **(R)** — `mimocode-version`, `MiMoCode`
- `.vscode/launch.example.json` **(R)** — debug config "opencode (attach)"
- `.gitignore` **(?)** — legacy paths `/opencode.json`, `.mimo-worktrees`, `.mimocode/`, `/mimoapi/`
- `.gitattributes` **(?)** — NUANCE: declares `merge=ours` for `packages/squadcoder-plugin-bootstrap/**` etc. that **don't exist** (our code lives in `.squadcoder/`); fix the patterns
- `patches/install-korean-ime-fix.sh` **(?)** — 3rd-party upstream patch, hard-codes `~/.opencode`, `claudianus/opencode`
- root docs `README*.md`, `SECURITY.md`, `CONTRIBUTING.md`, `USE_RESTRICTIONS.md` **(R)** — Xiaomi/MiMo/SquadCoder/anomalyco

---

## 4. Assets to REGENERATE (binary — not text edits)

Source of truth: `assets/brand/squadcoder-icon.svg` + `squadcoder-banner.svg` → `script/gen-brand-icons.ts` rasterizes them. **Rename the SVG sources + update the generator's output strings, then re-run it.** It writes:
- `packages/desktop/resources/icons/**` and `packages/desktop/icons/{dev,beta,prod}/**` (Win `.ico`, mac `.icns` ← *still opencode*, PNG sets, Store/Square/android/ios) 
- `packages/app/public/**` + `packages/web/public/**` favicons/apple-touch/social-share/manifest icons
- `packages/ui/src/assets/favicon/**` (← *still opencode*)
- `assets/brand/squadcoder-banner.png`

**NOT covered by the generator — replace by hand:**
- `packages/identity/mark*.{svg,png}` (6 files, opencode/mimo)
- `packages/console/app/src/asset/{brand,lander}/opencode-*.{svg,png}` + `logo*.svg` (opencode wordmarks/logos)
- `sdks/vscode/images/{icon.png,button-dark.svg,button-light.svg}` (opencode — see §5)
- `packages/extensions/zed/icons/opencode.svg`
- legacy `assets/readme/mimocode-banner.png` **(K — historical)**

> Tip: extend `gen-brand-icons.ts` to also emit `packages/identity/` and the console/zed/vscode marks, so one `bun script/gen-brand-icons.ts` covers everything next time.

---

## 5. The two editor extensions (special — one needs a publisher account)

### VS Code extension — `sdks/vscode/` ⚠️ 100% unrebranded
- `sdks/vscode/package.json`: `name: opencode`, `displayName: opencode`, **`publisher: sst-dev`**, `opencode.openTerminal`/`openNewTerminal`/`addFilepathToTerminal` commands.
- `sdks/vscode/src/extension.ts`, `README.md`, `images/*`, `script/{publish,release}` — opencode branding.
- **Auto-install logic** `packages/opencode/src/ide/index.ts:53` runs `code --install-extension sst-dev.opencode` → today the CLI installs **opencode's** marketplace extension. Also `alreadyInstalled()` reads `OPENCODE_CALLER`.
- **To make it ours:** rebrand the manifest (name, **new publisher id**, commands `newname.*`, icons), **publish to VS Marketplace + Open VSX** (needs a publisher account), then repoint `ide/index.ts` `install()` to `<publisher>.<newname>` and update the `OPENCODE_CALLER` env handshake. Supports VS Code, Cursor, Windsurf, VSCodium, Code-Insiders.

### Zed extension — `packages/extensions/zed/` ⚠️ unrebranded (TOML-only)
- `extension.toml`: id/name/description/author/repository all `opencode`/`SquadCoder`/`Anomaly`/`anomalyco`; binary ref `opencode.exe`. `icons/opencode.svg`. `LICENSE` **(K)**.

---

## 6. DO NOT TOUCH — renaming these breaks things

**Back-compat (keep the legacy token so old installs/links keep working):**
- `.mimocode` dir reads, `mimocode.json[c]` candidates, `MIMOCODE_HOME`, the whole `MIMOCODE_*` env-flag namespace (`config/paths.ts`, `config/config.ts`, `flag/flag.ts`, `cli/cmd/tui/config/*`, `installation/index.ts`, `uninstall.ts`, `project-id.ts`, `cli/cmd/uninstall.ts`)
- Desktop legacy: `opencode://` deep-link scheme, `ai.opencode.desktop*` migration (`src/main/migrate.ts`), `opencode.settings.dat`/`opencode.global.dat` store keys, `__OPENCODE__` renderer global

**Internal wire / build-define constants (must match on define-side AND consumer-side; not user-visible):**
- `OPENCODE_MIGRATIONS` (`storage/db.ts`), `OPENCODE_WORKER_PATH` (`tui/thread.ts`), `OPENCODE_LIBC` (`file/watcher.ts`), `OPENCODE_CHANNEL`/`VITE_OPENCODE_CHANNEL` (desktop), `virtual:opencode-server` (vite virtual module), `__OPENCODE__`
- Enterprise/infra `OPENCODE_STORAGE_*`, `OPENCODE_DEPLOYMENT_TARGET`, `OPENCODE_BASE_URL`, `OPENCODE_MODELS_URL` (env contracts with deploy infra)

**Third-party / external contracts (renaming = breakage):**
- `https://opencode.ai/config.json` — the JSON-Schema `$schema` URL in every config (`squadcoder.json`, `seed/squadcoder.json`, docs). It's opencode's published schema; keep unless you host your own.
- provider ids / API headers in `provider/{provider,schema,transform}.ts`, `session/llm.ts` (`opencode`/`x-opencode-*`), GitHub Action `opencode-agent` (`cli/cmd/github.ts`) — wire identifiers to external services
- Xiaomi `mimo-v2.5` provider + `xiaomimimo.com` voice endpoint (`plugin/mimo.ts`, `tui/util/voice.ts`) — real backend; rebrand only if you drop that provider
- Bundled skills' `opencode`/`SquadCoder` **compatibility tags** in `.squadcoder/skills/**` (and `seed/` mirror) — keep (they describe tool compat, not our brand)

**Keep-as-history:** `FORK_STRATEGY.md`, `FIXED_ISSUES.md`, `AGENTS.md`, `REMOTE.md`, `USE_RESTRICTIONS.md` (trademark/attribution — review, don't blindly strip).

---

## 7. Recommended sweep order + helper

1. Lock §1 decisions (esp. npm scope + marketplace publisher + repo/domain).
2. **Job A** token swap (§2) — small, our tokens.
3. **Job B** by surface (§3) — start with web/docs + i18n (most visible), then build/publish, then the `@mimo-ai` scope (mechanical but wide).
4. Regenerate assets (§4); rebrand both extensions (§5).
5. Respect §6 throughout.
6. Rebuild + the runtime verifications in `FORK_STRATEGY.md` / memory.

Audit grep (counts every brand token, excluding deps/build output):
```bash
rg -i --stats -g '!node_modules' -g '!dist' -g '!out' -g '!.dev-home' \
  'squadcoder|mumin|mimocode|@mimo-ai|\bmimo\b|opencode|MiMo|xiaomi|anomalyco|anoma\.ly|sst-dev' .
```

> Generated 2026-06-18 from a 10-agent audit (≈333 sites). If you rename, update this file's token table to the new name so the next sweep is trivial.
