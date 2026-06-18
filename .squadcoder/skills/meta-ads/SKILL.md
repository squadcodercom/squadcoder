---
name: meta-ads
description: "Expert playbook for planning, building, and optimizing Meta Ads (Facebook + Instagram) — campaign objectives, Advantage+ Sales/Shopping (ASC), Advantage+ Audience, ad-set structure, the Meta Pixel + Conversions API (CAPI) server-side, Aggregated Event Measurement, CBO/ABO budgeting, Reels/Stories/feed creative, and dynamic catalog (DPA). Use when the user wants to create, structure, scale, fix, or audit Facebook/Instagram ad campaigns, audiences, pixel/CAPI tracking, or creative. Activate for: facebook ads, instagram ads, meta ads, advantage plus, ASC, CBO, ABO, lookalike, custom audience, retargeting, meta pixel, conversions API, CAPI, ROAS, CPA, catalog ads, DPA, ad fatigue, פרסום בפייסבוק, פרסום באינסטגרם, מטא אדס, קמפיין פייסבוק, קהל יעד, קהל דומה, רימרקטינג, פיקסל, המרות, החזר על ההוצאה."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Meta Ads (Facebook + Instagram) — Media Buyer Playbook

A pro operating playbook for building and scaling performance campaigns on Meta. Default to **business outcomes**, not vanity metrics. When you activate, you build a complete, launch-ready plan (structure + targeting + creative + tracking + optimization cadence), call out the trade-offs, and flag anything that is account-risky (policy, attribution gaps, broken tracking).

> Terminology note (2026): "Advantage+ Shopping Campaign (ASC)" has been folded into **Advantage+ Sales**, and Advantage+ now activates **automatically** when you combine broad targeting + Advantage+ placements + a campaign-level budget + a purchase/conversion event. This doc uses ASC / Advantage+ Sales interchangeably.

---

## 1. Account & campaign architecture

Meta has three levels: **Campaign → Ad Set → Ad**. Objective and budget-type are set at the campaign level; targeting, placement, and budget (in ABO) at the ad-set level; creative at the ad level.

### Objectives (ODAX) — pick by the action you actually want
- **Sales** — purchases / catalog sales. The default for ecommerce and any bottom-funnel conversion. Use for ASC / Advantage+ Sales.
- **Leads** — form fills (Instant Forms / lead gen), calls, messages, sign-ups. For services, B2B, real estate, education.
- **Engagement** — messages (WhatsApp/Messenger/IG DM), video views, post engagement. Strong in Israel where WhatsApp-to-business is huge.
- **Traffic** — link clicks / landing-page views. Use sparingly: it optimizes for clicks, **not** buyers. Only for pure top-funnel reach to a strong site, or when you have no pixel data yet.
- **Awareness** — reach, brand awareness, video views, ad recall lift. Branding / launches, not direct response.
- **App promotion** — installs / in-app events (separate setup with the SDK / Advantage+ App).

**Rule of thumb:** always optimize for the **lowest-funnel event you can feed** (≈50 of that event per ad set per week). If you can't hit 50 purchases/week, optimize for Add-to-Cart or Initiate-Checkout, or use **value rules / VBO** once data matures.

### Recommended structure (most ecommerce/lead accounts)
1. **Prospecting / scaling: 1× Advantage+ Sales (ASC) campaign**, CBO, broad. This is the workhorse — let the system find buyers across placements.
2. **1× ABO testing campaign** — isolated ad sets to test creatives/angles/audiences with equal budget, then graduate winners.
3. **1× Retargeting campaign** (CBO or ABO) — warm audiences (site visitors, IG/FB engagers, ATC-no-purchase, catalog viewers via DPA).
Keep it **consolidated**. Too many ad sets fragments the ~50-event signal and keeps everything in the learning phase. Fewer ad sets + more budget per ad set = faster exit from learning.

---

## 2. Targeting & audiences

Meta's signal has shifted from manual interest-stacking to **broad + creative + the algorithm**. Targeting is now mostly a *seed/guardrail*, not a precision tool.

### Advantage+ Audience (the modern default)
- You give Meta an **audience suggestion** (interests, lookalikes, customer list) and it treats it as a *starting hint*, then expands beyond it when it finds cheaper conversions. For most conversion campaigns this beats narrow manual targeting.
- Use original (locked) audiences only when you have a hard compliance/relevance reason (e.g. age-gated products, B2B job titles, geo restriction).

### Audience types
- **Core (interest/demographic/behavior)** — still useful for cold testing of *angles* in ABO, and where Advantage+ Audience isn't appropriate. Don't over-narrow; combined audiences of <500K rarely help.
- **Custom Audiences (1st-party — your strongest signal):**
  - Website (pixel) — all visitors, specific URLs, time-on-site, by event (ViewContent, ATC, Purchase).
  - Engagement — IG account, FB Page, video viewers (25/50/75/95%), lead-form openers, event responders.
  - Customer list (CRM upload, hashed) — buyers, email/phone lists, LTV segments. Foundation for retargeting + lookalike seeds.
  - App activity, offline events.
- **Lookalike Audiences (LAL)** — built from a custom-audience seed. Use a **high-quality seed** (purchasers, high-LTV, top 25% by value — not "all visitors"). Start 1–3%; widen to 5–10% for scale. Value-based LALs (from a value-weighted seed) outperform plain ones.
- **Retargeting ladder** (warmest → coldest): cart abandoners → ATC → product viewers → all site visitors (30/60/180d) → social engagers. DPA/catalog ads are the highest-ROAS layer here.

### Exclusions (don't skip)
Exclude recent purchasers (e.g. last 30–180d, unless repeat-purchase product), exclude existing leads from lead campaigns, and exclude warm audiences from cold prospecting so the two don't cannibalize.

---

## 3. Budget & bidding

### CBO vs ABO (Advantage+ Campaign Budget vs Ad-Set Budget)
- **ABO (Ad-Set Budget Optimization)** — budget set per ad set. Use for **testing**: guarantees each creative/audience gets a fair, equal slice (e.g. ₪35–₪55 per ad set). Best for controlled experiments and small budgets.
- **CBO (Advantage+ Campaign Budget)** — one budget at the campaign level; Meta distributes to the best-performing ad sets in real time. Use for **scaling** proven winners and for ASC. Risk: Meta can starve a good-but-slow ad set, so keep ad sets comparable.
- **Pro workflow:** test in ABO → identify winners → duplicate the winning **post ID** into a CBO/ASC campaign to scale, keeping the ABO originals live.

### Bid strategies (pick deliberately)
- **Highest Volume (lowest cost)** — default; no cap. Maximizes conversions for the budget. Start here.
- **Cost per Result Goal (Cost Cap)** — soft target CPA; controls efficiency while scaling. Use once you know your real CPA.
- **Bid Cap** — hard ceiling on auction bid; advanced, for strict unit economics / auction control.
- **ROAS Goal (minimum ROAS / VBO)** — for value optimization once the pixel has rich purchase-value data. Best for catalogs with varied price points.
Avoid setting caps too tight at launch — it suffocates delivery and traps you in learning.

### Learning phase & budget pacing
- An ad set needs **~50 optimization events within ~7 days** to exit *Learning*. Under-budgeting keeps it in *Learning Limited* — the #1 hidden killer of performance.
- Budget floor guidance: aim for budget ≈ **(target CPA × ~10–20) per ad set per week**. Meta's rough minimum is ~₪50–₪180/day for conversion ad sets to exit learning in a week.
- **Don't edit during learning.** Significant edits (budget >20%, audience, optimization event, creative swap on the same ad set) **reset the learning phase**. Make changes in steps of ≤20% and wait.

---

## 4. Creative — the real lever (specs + best practice)

In 2026, **creative is the primary targeting input.** Spend most effort here.

### Formats & placements
- **Reels / Stories (9:16, full-screen vertical)** — highest-reach surface; design mobile-first, sound-on optional but caption everything.
- **Feed (1:1 or 4:5)** — 4:5 takes more screen real estate than 1:1; prefer it for feed.
- **Carousel** — multi-product / multi-angle / step-by-step; great for DPA/catalog.
- **Collection / Instant Experience** — catalog + hero video, fast mobile shopping.
- **Advantage+ Creative enhancements** — auto crops, music, text variations, image/brightness tweaks per placement; enable selectively and review (it can distort Hebrew text/logos).

### Specs (current)
- **Vertical video (Reels/Stories):** 9:16, 1080×1920, MP4/MOV, keep core message in the safe zone (avoid top ~14% / bottom ~20% UI overlap).
- **Square/portrait image:** 1:1 (1080×1080) or 4:5 (1080×1350).
- **Primary text:** ~125 chars before truncation; **Headline:** ~27–40 chars; **Description:** ~30 chars.
- Upload one master asset and let placement-asset customization adapt, OR (better) supply native 9:16 + 4:5 versions.

### Creative best practice
- **Hook in the first 1–3 seconds** (motion, pattern interrupt, problem statement, on-screen text). Most drop-off is here.
- **Always caption** (sound-off viewing is the norm) and burn in subtitles.
- Test **angles**, not just visuals — pain point, social proof, offer, UGC, founder story, comparison, before/after.
- **UGC / native-looking** content beats polished studio ads for direct response on Reels/Stories.
- Clear single CTA; one product/offer per ad; brand/price visible.
- Refresh cadence: add **3–5 new creatives every 1–2 weeks**; don't delete still-performing ones (the algo down-ranks fatigued ones naturally).

---

## 5. Conversion tracking & measurement (do this BEFORE spending)

### Meta Pixel + Conversions API (CAPI) — run BOTH
- **Pixel** = browser-side events (fires in the user's browser). Blocked by iOS/ATT, ad blockers, ITP → lossy.
- **Conversions API (CAPI)** = **server-side** events sent directly from your backend/CRM/store to Meta. Resilient to browser blocking; recovers signal lost post-iOS14.
- **Deduplication is mandatory:** send the same event from both Pixel and CAPI with a shared `event_id` (+ `fbp`/`fbc`) so Meta counts it once. Without it you double-count.
- Pass rich **customer-information parameters** (hashed email, phone, name, location, external_id) and `event_source_url`, `action_source` to raise **Event Match Quality (EMQ)** — aim EMQ ≥ 6–7. Higher EMQ = better optimization and attribution.
- Implementation paths: native Shopify/WooCommerce/store integrations, GTM server-side container, a CAPI gateway, or direct Graph API. Prefer a real server source over partner-browser-only.

### Key standard events to map
`PageView`, `ViewContent`, `Search`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, `Purchase` (with `value` + `currency` = **ILS**), `Lead`, `CompleteRegistration`, `Contact`. For catalog/DPA, `content_ids`/`content_type` must match the feed.

### Aggregated Event Measurement (AEM) — post-iOS14 reality
- Verify your **domain** in Business Manager and configure **8 prioritized web events** per domain in Events Manager (rank Purchase #1, then Checkout, ATC, …). Only the highest-priority event a user does is counted for opted-out iOS users.
- Attribution defaults: **7-day click / 1-day view** (you can also view 1-day-click). In-platform numbers will **under-report** vs. true sales — corroborate with GA4 + actual store revenue + a blended **MER** (marketing efficiency ratio), not ROAS alone.

---

## 6. Dynamic catalog / DPA (Advantage+ Catalog Ads)

- Build a **Catalog** (product feed) in Commerce Manager; keep it fresh and complete (title, price, availability, `content_id` matching pixel/CAPI). Connect to your store or upload a scheduled feed.
- **Retargeting DPA:** show users the exact products they viewed/ATC'd but didn't buy — highest-ROAS layer; pair with a small incentive.
- **Broad / prospecting catalog (Advantage+ Catalog):** let Meta show relevant products to cold users based on intent — extends ASC.
- Use carousel/collection formats; enable catalog overlays (price, % off, free-shipping badge) where compliant.

---

## 7. Optimization workflow (what to check, when)

**Cadence — don't touch it hourly.** Conversion campaigns need data to breathe.

**Daily (5 min):** spend pacing vs. budget, any ad set in *Learning Limited* or rejected ads, sudden CPA spike, broken tracking (events dropping in Events Manager), comment/quality issues.

**Every 3 days (after ≥50 events / exit of learning):** evaluate at the **ad-set and ad level** on CPA / ROAS / CTR (link) / CPM / hook-rate (3-sec) / thumb-stop. Kill clear losers; let in-range performers keep running. Never judge within the learning phase.

**Weekly:** creative refresh (3–5 new), scale winners, prune fatigued creative (rising frequency + falling CTR + rising CPM), audience/placement breakdown, check **frequency** (cold >2–3 over 7d = fatigue/saturation), review EMQ & AEM.

### Scaling rules
- **Vertical:** raise budget **≤20% every 2–3 days** on a winning CBO/ASC to avoid re-entering learning. For aggressive scaling, **duplicate** the winner at a higher budget instead of editing.
- **Horizontal:** duplicate winning **post IDs** into new audiences/lookalikes/geos; add new creative angles.
- Move proven ABO winners → CBO/ASC.

### Kill rules (guideline, adapt to your CPA)
- Ad spent **~1.5–2× target CPA with 0 conversions** → pause.
- CTR (link) well below account avg **and** high CPM → creative problem, pause/replace.
- Ad set can't exit learning after 7d at adequate budget → consolidate or increase budget.
- Frequency climbing with falling results → refresh creative or expand audience.

---

## 8. Common mistakes / pitfalls

- **Too many tiny ad sets** → signal fragmentation, perpetual learning. Consolidate.
- **Editing inside the learning phase** (budget >20%, audience, event, creative) → resets learning. Be patient.
- **Optimizing for Traffic/Clicks** when you want sales → you get cheap clicks, no buyers.
- **Pixel only, no CAPI** (or CAPI with no dedup) → lost/garbled signal post-iOS14, or double-counted conversions.
- **Unverified domain / unconfigured 8 events** → AEM under-delivers and under-reports.
- **Narrow stacked interests** in a conversion campaign → starves the algorithm; go broad + Advantage+ Audience.
- **Judging on in-platform ROAS alone** → ignore attribution gaps; use blended MER + real revenue.
- **No purchaser exclusions** → wasting budget re-selling to people who just bought.
- **Cost/Bid caps too tight at launch** → no delivery, stuck in learning.
- **Creative neglect** → expecting targeting to save weak ads. Creative is the lever.
- **Letting Advantage+ enhancements mangle Hebrew text/logos** → review every placement.

---

## 9. Israel / Hebrew market notes

- **Currency & budgets:** plan and report in **₪ (ILS)**; set the ad account + pixel `currency` to ILS so `Purchase value` and ROAS are correct. Israeli CPMs run lower than US but the market is small — don't over-segment a small country.
- **Hebrew + RTL creative:** write right-to-left, native Hebrew copy (not translated-sounding). Keep Hebrew text inside the safe zone; verify text isn't clipped/mirrored after Advantage+ enhancements; ensure fonts render correctly in 9:16. Bilingual (Hebrew + Arabic, or + English for tech/tourism) where the audience warrants.
- **WhatsApp-first behavior:** Israelis convert heavily via **WhatsApp/Messenger** — strongly consider Engagement→WhatsApp / Click-to-Message objectives and "click to WhatsApp" CTAs for services, local retail, and lead gen, alongside or instead of forms.
- **Shabbat & holiday timing:** Friday afternoon → Saturday night activity and shopping patterns differ; many businesses pause or shift. Use **dayparting/ad scheduling** (requires lifetime budget) to align with when your audience buys, and plan launches around Jewish holidays (חגים) and the local sales calendar. Kosher/Shabbat-observant audiences may avoid Shabbat ordering — set expectations on delivery/response.
- **Local seasonality & sales events:** plan creative/offers around Israeli peaks — חגי תשרי, Black Friday / blackfriday-IL, Passover (פסח), summer, back-to-school, Yom Ha'atzmaut promos.
- **Geo & language targeting:** target Israel; use Hebrew (and Arabic where relevant) language signals; mind the spread (center vs. periphery) for delivery/logistics promises.
- **Privacy expectations:** Israeli consumers are privacy-aware; keep CAPI customer-data hashing compliant, honor consent, and keep landing pages trustworthy (Hebrew, local payment, clear business identity).

---

## 10. Output — what to produce when this skill activates

When the user asks to build/fix a Meta campaign, deliver a concrete, launch-ready package:

1. **Campaign skeleton** — recommended objective + structure (ASC/Advantage+ Sales vs ABO test vs retargeting), CBO/ABO choice with rationale, and a starting budget in **₪/day** tied to target CPA and the ~50-event learning rule.
2. **Targeting plan** — Advantage+ Audience suggestion vs locked audiences, the custom-audience + lookalike seeds to build, the retargeting ladder, and required exclusions.
3. **Creative brief — 3 variants** — distinct angles, with hook lines, primary text (~125c), headline (~30c), CTA, and format/aspect ratio (9:16 Reels/Stories + 4:5 feed), written in **native Hebrew/RTL** when the audience is Israeli.
4. **Tracking plan** — Pixel + CAPI server-side with `event_id` dedup, the standard events to map (Purchase value in ILS), domain verification + the prioritized 8 AEM events, target EMQ, and (if ecommerce) catalog/DPA setup.
5. **Optimization plan** — the check cadence, scaling rules (≤20%/2–3d or duplicate), kill rules vs. target CPA, and which KPIs to judge on (CPA/ROAS + blended MER).
6. **Risk/quality flags** — policy concerns, attribution caveats, learning-phase warnings, and anything that needs the user's real account data to finalize.

Always state assumptions, ask for missing inputs (offer, AOV/CPA target, budget, catalog/CRM availability), and never claim in-platform numbers are ground truth — reconcile with real revenue.
