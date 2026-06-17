# Bundled Skills — Attribution

MuminAI ships a curated set of skills under `.muminai/skills/`. Skills load automatically via
the `{skill,skills}/**/SKILL.md` discovery in the `.muminai` config directory (and any paths
listed under `skills.paths` in `.muminai/muminai.json`).

## MuminAI-original skills
- `hebrew-rtl-best-practices` — authored by the MuminAI project (MIT, same as this repo).

## Skills-IL (agentskills.co.il)
Hebrew/Israeli skills curated by **Skills-IL / YooTech** — https://agentskills.co.il,
source org https://github.com/skills-il.

- **Individual skills are MIT-licensed** and may be redistributed with attribution. We vendor a
  curated subset (e.g. `hebrew-document-generator`, `hebrew-content-writer`,
  `israeli-tax-returns`) into `.muminai/skills/`, preserving each skill's `LICENSE`/attribution.
- **The curated catalog, ratings, metadata, and arrangement are proprietary to YooTech.** We do
  **not** scrape or republish the catalog. For the full, browsable catalog, see
  https://agentskills.co.il.

When vendoring a Skills-IL skill, copy its full directory (including any `LICENSE` and original
`SKILL.md`) unchanged, and list it here with a link to its source.

## Other bundled skills
- `ui-ux-pro-max` — https://github.com/nextlevelbuilder/ui-ux-pro-max-skill (verify license/format before vendoring).

> If you are a skill author and want a skill added, removed, or re-attributed, open an issue.
