# Bundled Skills — Attribution

MuminAI ships a curated set of **81 skills** under `.muminai/skills/`, auto-discovered by the
skill loader (`{skill,skills}/**/SKILL.md` in the `.muminai` config dir + `skills.paths`).
All bundled skills are **MIT-licensed** and work with **no network / no external API key**.

## Skills-IL (agentskills.co.il) — MIT
Hebrew/Israeli skills by **Skills-IL / YooTech** — https://agentskills.co.il, source
https://github.com/skills-il. Vendored unchanged with each repo's `LICENSE` preserved
(`.muminai/skills/LICENSE-skills-il-*.txt`).

- **localization/** — Hebrew core: `hebrew-rtl-best-practices`, `hebrew-document-generator`
  (RTL PDF/DOCX/PPTX), `hebrew-content-writer`, `hebrew-i18n`, and more.
- **developer-tools/** (~29) — `israeli-id-validator`, `israeli-phone-formatter`,
  `wcag-accessibility-widget`, `israeli-postgres-toolkit`, `israeli-spreadsheets`,
  `hebrew-chatbot-builder`, `hebrew-llm-eval-suite`, `telegram-bot-builder`,
  `n8n-hebrew-workflows`, `remotion-best-practices`, `skills-il-skill-creator`, …
- **tax-and-finance/** — `israeli-tax-returns` and related.

> The individual SKILL.md files are MIT and redistributable with attribution. The Skills-IL
> *catalog/curation/ratings* are proprietary to YooTech — we vendor individual skills only and
> link out to https://agentskills.co.il for the full browsable catalog. `government-services/`
> (citizen-service skills) is intentionally **not** bundled (off-target for a coding tool); add
> from the catalog if needed.

## ui-ux-pro-max — MIT
`nextlevelbuilder/ui-ux-pro-max-skill` — https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
(`LICENSE-ui-ux-pro-max.txt`). 7 design skills: `ui-ux-pro-max`, `ui-styling` (67 styles / 161
palettes / font pairings), `design`, `design-system`, `brand`, `banner-design`, `slides`.

## Updating
Regenerate/refresh with the upstream repos (see `script/` notes). When adding a skill, preserve
its `LICENSE` and list it here. If you are a skill author and want a skill added/removed/
re-attributed, open an issue.
