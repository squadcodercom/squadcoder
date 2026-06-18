---
name: google-ads
description: "Expert Google Ads playbook for planning, building, and optimizing campaigns across Search, Performance Max, Display, Shopping, Demand Gen, and YouTube. Covers keyword match types and negatives, Smart Bidding (tCPA/tROAS/Max Conversions/Max Conversion Value), asset groups, audience signals, and conversion tracking (Google tag + Enhanced Conversions). Can drive the bundled google-ads MCP for live account operations. Activate for: Google Ads, Google AdWords, AdWords, PPC, paid search, search ads, Performance Max, PMax, Shopping ads, Demand Gen, YouTube ads, Smart Bidding, tCPA, tROAS, target ROAS, quality score, negative keywords, responsive search ads, RSA, asset groups, Enhanced Conversions, Merchant Center, google-ads MCP, גוגל אדס, גוגל אדוורדס, פרסום בגוגל, קמפיין בגוגל, מודעות גוגל, פרסום ממומן, חיפוש ממומן, מילות מפתח, מילות מפתח שליליות, ניהול קמפיינים, פרפורמנס מקס, שופינג, יוטיוב אדס, אופטימיזציה לקמפיין, ROAS, מעקב המרות."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Google Ads — Pro Playbook

A practitioner's guide to architecting, launching, and scaling Google Ads accounts. Use real
platform terminology and current features. When the user has connected the **bundled google-ads MCP**
(`uvx googleads/google-ads-mcp`), drive it for live account operations: read with `gads_google_ads_search_google_ads`
(GAQL), build with the `gads_campaign_*`, `gads_ad_group_*`, `gads_asset_group_*`, `gads_bidding_strategy_*`
and `gads_keyword_*` tools, and pull keyword ideas with `gads_keyword_plan_idea_*`. Always read before you
write, and stage large changes through `gads_batch_job_*`.

> **Reuse note:** this skill is authored fresh for SquadCoder; structure informed by public MIT Google Ads
> skill packs (e.g. TheMattBerman/google-ads-copilot, nowork-studio/NotFair).

---

## 1. Account & campaign structure

**Hierarchy:** MCC (manager) → Account → Campaign → Ad group / Asset group → Ads / Assets → Keywords / Audiences.

**Pick the campaign type by intent and inventory:**
- **Search** — high-intent text ads on the SERP. The backbone of most accounts. Use intent-tight ad groups.
- **Performance Max (PMax)** — one campaign serving all Google inventory (Search, Shopping, Display, YouTube,
  Discover, Gmail, Maps) via **asset groups** + **audience signals**. Goal-based; great for ecommerce + lead-gen
  once you have conversion data. It cannibalizes Shopping/brand Search, so guard brand terms.
- **Shopping** — product ads from a **Merchant Center** feed. Standard Shopping gives priority/placement control;
  PMax replaces "Smart Shopping". Use feed quality (titles, GTINs, product types) as your lever.
- **Demand Gen** — visually rich social-style ads on YouTube (in-feed, Shorts), Discover, and Gmail. Use for
  mid-funnel demand creation with lookalike ("similar") segments and your 1st-party lists.
- **Display** — GDN banners/responsive display. Cheap reach + remarketing; weak for cold prospecting alone.
- **YouTube / Video** — objectives: brand awareness/reach, consideration (in-stream skippable, in-feed),
  action (Video action campaigns / VAC). Use bumpers (6s) for frequency, skippable in-stream for storytelling.

**Account architecture principles:**
- **One theme per ad group.** Tight ad group → relevant RSA → high Quality Score → lower CPC.
- **Separate brand vs non-brand** campaigns (different intent, CPC, and budgets; protects brand ROAS reporting).
- **Isolate competitor and high-spend terms** so budget and negatives don't bleed across themes.
- **STAG/SKAG is mostly dead** post-close-variants — prefer tightly-themed ad groups over single-keyword groups.
- Use **shared budgets sparingly**; prefer per-campaign budgets for clean control unless portfolio-bidding.

---

## 2. Keywords, match types & negatives

**Match types (current behavior):**
- **Broad match** — widest reach; relies on Smart Bidding + audience signals to stay efficient. Only use broad
  with a conversion-based Smart Bidding strategy and a solid negative list. Never broad on manual CPC.
- **Phrase match** `"..."` — meaning of the phrase, order respected; the workhorse for controlled scale.
- **Exact match** `[...]` — same meaning/intent; tightest control, best for proven converters.

**Strategy:** start phrase + exact on proven terms; layer in a **broad-match + tCPA** test campaign to mine
new queries, then harvest winning search terms into phrase/exact and add the rest as negatives.

**Negatives are non-negotiable:**
- Build an **account-level negative keyword list** (shared set) for junk: "free", "jobs", "salary", "תמונות",
  "חינם", "משרות", plus irrelevant brands.
- Mine the **Search Terms report** weekly; add irrelevant terms as negatives at the right level.
- Use negatives to **sculpt traffic** between brand/non-brand and between ad groups.
- Mind match type on negatives (negative broad does NOT match close variants/synonyms the way positive broad does).

---

## 3. Bidding & budget strategy

**Smart Bidding (auction-time, conversion-based) — pick by goal:**
- **Maximize Conversions** — spend the budget to get the most conversions. Use at launch when learning volume;
  add an optional **tCPA** cap once you have ~15–30 conversions/30 days.
- **Target CPA (tCPA)** — hit an average cost per conversion. Lead-gen default once stable.
- **Maximize Conversion Value** — most value within budget; the value-based launch mode for ecommerce.
- **Target ROAS (tROAS)** — hit a revenue/spend ratio. Requires conversion **values**; the ecommerce endgame.
  Set tROAS slightly below current achieved ROAS to avoid throttling, then ratchet up.
- **Target Impression Share** — for brand defense / absolute-top placement; not a performance strategy.
- **Manual CPC / Enhanced CPC** — legacy; avoid except niche control cases. eCPC is being deprecated.

**Portfolio bid strategies** let several campaigns share one tCPA/tROAS target — useful for thin-data campaigns.

**Budget pacing & CBO/ABO equivalent:**
- Google has **no CBO toggle** like Meta. **Campaign-level budget = ABO** (the norm); **portfolio strategy +
  shared budget ≈ CBO** behavior. Default to per-campaign budgets for control.
- Daily budget can spend up to **2× on a given day**, capped at the monthly average — don't panic at daily spikes.
- Give Smart Bidding **~7–14 days** to exit the **learning period** after major changes; avoid budget/target
  swings >20% at once. Use **seasonality adjustments** for short spikes (sale weekend), **data exclusions** to
  mask broken-tracking days.

---

## 4. Creative specs & best practices

**Responsive Search Ads (RSA) — the only Search ad unit:**
- Up to **15 headlines (30 char)** + **4 descriptions (90 char)**. Aim for ≥8–10 distinct headlines.
- Include the **keyword/theme** in 2–3 headlines; pin sparingly (pin 1–2 must-have headlines to positions, leave
  the rest unpinned so Google can mix). Over-pinning kills Ad Strength.
- Target **"Good"/"Excellent" Ad Strength**; add benefits, offers, CTAs, social proof, and a **DKI/customizer**
  where relevant. Use **ad customizers** + **countdown** for dynamic pricing/urgency.
- **Assets (formerly extensions):** always run **sitelinks (≥4), callouts (≥4), structured snippets**, plus
  **call, lead form, image, price, promotion**, and **location** where applicable. Assets lift CTR for free.

**Performance Max asset groups:** per group supply text (headlines/long headlines/descriptions), **images**
(1.91:1, 1:1, 4:5 — min 600×314 / 300×300), **logos** (1:1, 4:1), and **video** (≥10s; supply your own or Google
auto-generates — always upload real video). Add **audience signals** (your data + custom segments) to speed learning.

**Display / Demand Gen:** responsive display assets (landscape 1.91:1, square 1:1, portrait 4:5/9:16 for Demand
Gen + Shorts). Lead with the hook in the first 2s; design for sound-off and mobile.

**YouTube:** skippable in-stream needs a hook before the 5s skip; bumpers (6s, non-skippable) for reach/frequency;
use a clear end-card CTA. Vertical/Shorts assets for Demand Gen and VAC.

**Shopping:** the "creative" is your **feed** — optimize titles (brand + product + key attributes first 40 chars),
high-res images, correct **GTIN/MPN**, `product_type`/Google category, and competitive `price`.

---

## 5. Conversion tracking & measurement

This is the foundation — Smart Bidding is only as good as the conversion data.
- **Google tag (gtag.js)** or **Google Tag Manager** sitewide; define **conversion actions** in Google Ads
  (or import from GA4). Mark only true business outcomes as **Primary**; demote micro-events to **Secondary**.
- **Enhanced Conversions** — send hashed (SHA-256) 1st-party data (email/phone) to recover conversions lost to
  cookie/consent gaps. Enable **Enhanced Conversions for web** (and **for leads** in lead-gen) — meaningful uplift.
- **Server-side / offline:** upload **offline click conversions** (GCLID) for CRM-qualified leads/closed deals so
  bidding optimizes to revenue, not raw form fills. Use **conversion value rules** to adjust value by
  geo/device/audience.
- **Consent Mode v2** (`update_default`/`update`) is required for EEA traffic and feeds conversion modeling.
- **Attribution:** Google Ads now uses **data-driven attribution (DDA)** by default — last-click is deprecated.
- Via MCP: create actions with `gads_conversion_create_conversion_action`, push Enhanced Conversions with
  `gads_user_data_upload_enhanced_conversions`, and upload offline conversions with
  `gads_conversion_upload_upload_click_conversions`.

---

## 6. Optimization workflow (cadence & rules)

**Daily (5 min):** check for disapprovals, billing/budget-limited flags, tracking breakage (0 conversions where
there should be some), and sudden CPA/ROAS swings.

**2–3× / week:**
- **Search Terms report** → harvest winners (add as exact/phrase), add junk as negatives.
- Watch campaigns in **learning** after edits; don't stack changes.
- Review **asset/RSA Ad Strength** and swap low-performing assets.

**Weekly:**
- Bid-target tuning: nudge **tCPA/tROAS by ≤10–15%** toward goal; never yank targets.
- Pause or restructure ad groups/keywords with spend but **no conversions** over a statistically meaningful window.
- Check **auction insights** (impression share lost to rank vs budget) to decide raise-bid vs raise-budget.
- Review **Recommendations** tab — apply the good ones (negatives, new keywords) skeptically; **decline auto-apply**
  of broad-match/budget recs unless intended.

**Scaling rules:** when a campaign hits target and is **limited by budget** (impression share lost to budget > 10%),
raise budget **15–25% at a time**, then let it re-stabilize. To scale efficiency, loosen tROAS / raise tCPA in small
steps to unlock volume. Use **Experiments / drafts** (`gads_experiment_*`) to A/B structural or bidding changes
before rolling out.

**Kill rules:** pause keywords/ad groups/products with clearly-above-target CPA and enough data; pause placements
(Display/Video) with spend + zero conversions; exclude irrelevant or brand-unsafe placements and content labels.

---

## 7. Common mistakes / pitfalls

- **Broad match on manual CPC** with no Smart Bidding and weak negatives → budget incineration.
- **No / wrong conversion tracking** (counting every page view, double-counting, or tracking broken) → bidding to noise.
- **Too many primary conversion actions** of unequal value → the algorithm optimizes to the cheap one.
- **Over-pinning RSA headlines** → "Poor" Ad Strength, low reach.
- **Letting PMax cannibalize brand** → add brand as account negatives to PMax (via support/exclusions) and run a
  dedicated brand Search campaign.
- **Reacting to single days** / changing targets daily → perpetual learning, never stabilizes.
- **Ignoring the Search Terms & placement reports** → wasted spend on junk queries and MFA sites.
- **Geo set to "presence + interest" by accident** → ads show to people merely *searching about* your area. Use
  **"Presence: people in your targeted locations"** for local businesses.
- **Auto-applied recommendations left on** → silent broad-match/budget changes you didn't intend.

---

## 8. Israel / Hebrew market notes

- **Language & targeting:** target **Hebrew** (and often **Arabic** + **Russian** for relevant segments) plus
  **English** for tech/B2B. Set Location = **Israel** (or specific cities) with **"presence"** targeting for local.
- **RTL creative:** write Hebrew headlines/descriptions natively RTL — verify line breaks, punctuation (`?`/`!`/`,`
  placement), and that numbers/Latin brand names render correctly inside RTL text. Don't machine-translate ad copy;
  Hebrew CTAs differ ("קבל הצעת מחיר", "השאירו פרטים", "קנו עכשיו").
- **Hebrew keyword nuance:** Hebrew is written without niqqud and has heavy morphology (prefixes ב/ל/ה/ו/מ/ש,
  plural/gender forms, construct state). Cover spelling variants (with/without **כתיב מלא** extra yod/vav),
  common transliterations of brand/English terms, and slang. Lean on **broad + Smart Bidding** to catch variants,
  then harvest. Search volumes are smaller than EN — don't over-fragment ad groups.
- **Budgets in NIS (₪):** quote and pace budgets in shekels; CPCs vary widely by vertical (legal/insurance/real-estate
  are expensive). Account currency is set once at creation — confirm before building.
- **Shabbat & holidays:** Israeli buying patterns dip Friday afternoon–Saturday and around **חגים** (Rosh Hashana,
  Yom Kippur, Sukkot, Pesach). Use **ad scheduling** + **seasonality adjustments**; for some audiences shift weight to
  **Sunday–Thursday**. Plan promo pushes around חגים and local sale events.
- **Privacy/consent:** Israel follows its own privacy law (Protection of Privacy Law) plus growing GDPR-style
  expectations; implement **Consent Mode** and clear consent UX, especially for EU-facing traffic.

---

## 9. Output (what to produce when this skill activates)

When asked to plan or build, produce a concrete, ready-to-implement deliverable:
1. **Campaign skeleton** — campaign type(s), naming, budget (₪/day), bid strategy + target, locations, languages,
   ad schedule; brand/non-brand split.
2. **Ad group / asset group plan** — themes with **keywords by match type** and seed **negative keyword list**
   (account + campaign level); for PMax/Shopping, the **audience signals** and feed/asset-group breakdown.
3. **Creative** — at least **3 RSA variants** (≥10 headlines + 4 descriptions each, Hebrew + English where relevant),
   plus the full **asset/extension** set (sitelinks, callouts, snippets, images, etc.).
4. **Tracking plan** — conversion actions (primary/secondary + values), Google tag/GTM + **Enhanced Conversions**,
   offline-conversion plan for lead-gen, DDA attribution.
5. **Optimization & scaling plan** — review cadence, target-tuning steps, scaling and kill rules, experiment plan.

If the **google-ads MCP** is connected, offer to apply the plan live (create budget → campaign → ad groups →
keywords → RSAs → conversion actions), reading current state first and staging bulk writes via a batch job.
Always confirm spend-affecting changes with the user before executing.
