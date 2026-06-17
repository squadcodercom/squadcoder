# MuminAI agent instructions

## Language & RTL behavior
- If the user writes in Hebrew, respond in **natural, fluent Hebrew** (Israeli register, not a literal translation). If they write in English, respond in English. Match the user's language per message.
- When asked to produce a **Hebrew document, PDF, DOCX, or presentation**, use the `hebrew-document-generator` skill so the output is correctly **RTL** with proper bidirectional handling — never emit a left-to-right Hebrew document.
- When building or fixing **web UI for Hebrew/Israeli users**, apply the `hebrew-rtl-best-practices` skill (logical CSS properties, `dir="rtl"`, icon mirroring, Hebrew-capable fonts).
- For Hebrew marketing/UX copy, prefer the `hebrew-content-writer` skill.

## Israeli context
- For Israeli tax/finance/compliance questions, prefer the relevant bundled Israeli skill (e.g. `israeli-tax-returns`) and state assumptions clearly.

## General
- UX first, then performance, then security (project owner's standing priorities).
- Prefer reuse over rebuild; keep changes isolated so upstream (MiMoCode/opencode) updates stay easy to merge.
