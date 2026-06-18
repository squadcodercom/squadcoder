---
name: cross-platform-ad-strategy
description: "Build full-funnel, cross-channel paid media plans: funnel-to-channel mapping, budget allocation and portfolio bidding, creative testing matrices, KPIs per funnel stage, incrementality/MMM measurement, and a complete Israeli-market media plan (Hebrew/RTL creative, NIS budgets, local platforms, Shabbat/holiday timing). Ties together the per-platform ad skills + ad-measurement-tracking + sc:ad-copywriting + sc:image-gen-prompting. Activate for: media plan, media planning, cross-platform ads, omnichannel, channel mix, budget allocation, marketing funnel, full-funnel strategy, paid media strategy, incrementality, marketing mix, MMM, תוכנית מדיה, תכנון מדיה, אסטרטגיית פרסום, מימון משפך, תקציב פרסום, ערוצי שיווק, פרסום רב-ערוצי, אומניצ'אנל."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Cross-Platform Ad Strategy & Media Planning

Plan paid media as a **portfolio**, not a pile of disconnected campaigns. Every shekel is mapped to a funnel stage, a channel that wins that stage, a KPI that judges it, and a measurement plan that proves it actually moved the business. This skill is the conductor — it sequences the per-platform skills (Google, Meta, TikTok, LinkedIn, YouTube), `ad-measurement-tracking`, `sc:ad-copywriting`, and `sc:image-gen-prompting` into one coherent plan.

## Step 0 — gather the brief (ask if missing)
- **Business & offer**: product, AOV/LTV, gross margin, sales cycle length, lead-to-customer rate.
- **Goal & primary KPI**: revenue/ROAS, CPA, qualified leads, app installs, store visits, awareness/reach.
- **Total budget & horizon**: monthly spend in NIS, flighting (always-on vs bursts), seasonality.
- **Constraints**: target CPA/ROAS, min/max per channel, brand-safety rules, regulated vertical (finance, health, gambling — restricted on most platforms in IL).
- **Maturity**: existing pixel/CAPI data, email/CRM list size, retargeting pool size, prior winners.
- **Market**: Hebrew/Israel? B2C or B2B? National or local? — see Israeli-market section.

If the offer or margin is unknown, you cannot set a defensible target CPA. Ask before planning.

## 1. The funnel → channel map
Map each stage to the channels that structurally win it. A channel can serve multiple stages with different campaign types.

| Stage | Job | Best-fit channels | Campaign / inventory |
|---|---|---|---|
| **Awareness (TOF)** | Reach cold audience cheaply, build brand | YouTube, Meta (Reels/Stories), TikTok, CTV/OTT, programmatic display | Video views, reach, ThruPlay, Demand Gen |
| **Consideration (MOF)** | Earn intent, get clicks/engagement, build retargeting pools | Meta traffic/engagement, TikTok, YouTube in-feed, Discovery/Demand Gen, Google non-brand search | Traffic, lead forms, in-feed video |
| **Conversion (BOF)** | Capture demand, close | Google Search (brand + high-intent non-brand), Shopping/PMax, Meta Advantage+ Shopping, retargeting (DPA), Microsoft Ads | Conversions, sales, Performance Max |
| **Retention/Loyalty (post-purchase)** | Repeat, cross-sell, win-back, advocacy | Email/SMS (owned), CRM-match audiences, lifecycle retargeting, loyalty offers | Customer-match, DPA cross-sell |

Principles:
- **Demand capture vs demand generation.** Search/Shopping/PMax *capture* existing demand; social/video *generate* it. A plan that is all-capture stalls once it saturates branded + in-market queries — you must fund generation to keep the capture layer fed.
- **Brand search is a floor, not a strategy.** Always own your brand terms (cheap, defensive) but never count it as incremental growth.
- **Don't double-count retargeting.** Retargeting harvests demand other channels created; attribute its lift carefully (see §5).

## 2. Budget allocation & portfolio bidding
Allocate top-down by funnel, then by channel, then let platform bidding optimize within.

**Funnel split (starting points — tune to maturity):**
- *Growth/scaling brand*: ~40% TOF / 35% MOF / 25% BOF (heavy demand-gen to fill the funnel).
- *Performance/DTC steady-state*: ~20% TOF / 30% MOF / 50% BOF.
- *Pure lead-gen / long cycle B2B*: ~25% TOF / 45% MOF / 30% BOF.

**The 70/20/10 rule (operational layer):** 70% to proven channels/campaigns, 20% to scaling recent winners, 10% to genuine tests (new platform, new audience, new format). Protects performance while guaranteeing a learning pipeline.

**Marketing as % of revenue:** ~7–10% of gross revenue as a baseline for established brands; growth-stage often 15–25%+. Use as a sanity check on total budget.

**Portfolio bidding — pick the strategy per objective:**
- **Google**: Maximize Conversions / **tCPA** (lead gen), Maximize Conversion Value / **tROAS** (ecommerce), Target Impression Share (brand defense). Use **portfolio bid strategies** to share a tCPA/tROAS goal across multiple campaigns and let Google move budget to the best auctions.
- **Meta**: **Advantage+ Campaign Budget (CBO)** to let the system shift spend across ad sets; **cost-per-result goal** or **ROAS goal** as guardrails. Use **ABO** (ad-set budgets) only when you must protect a specific audience/test from being starved.
- **TikTok**: **Campaign Budget Optimization** + Lowest Cost or Cost Cap; **Smart+** for automated end-to-end.
- **Pacing**: avoid daily whiplash — judge on 7-day windows; expect a **learning phase** (~50 conversions/week per ad set/campaign) before reading results. Don't exceed ~20% budget changes/day on smart bidding or you reset learning.
- **CBO/ABO equivalents**: CBO (Meta) ≈ campaign-level budget on Google portfolio/PMax ≈ TikTok CBO ≈ "let the algorithm distribute." ABO ≈ manual per-ad-set/ad-group control — use for isolation, not as default.

**Marginal-ROAS thinking:** stop allocating by *average* ROAS and allocate by *marginal* ROAS — the return on the **next** shekel. Channels with high average ROAS (brand search) often have near-zero marginal headroom; mid-funnel video may have lower average but high marginal lift. Scale where the next shekel pays best.

## 3. Creative testing framework (hook × angle × format matrix)
Creative is the #1 lever once targeting is broad and automated. Test **messages**, not pixels.

**The matrix** — vary three axes systematically:
- **Angle** (the strategic claim): pain/agitation, social proof, transformation, price/offer, authority/expertise, FOMO/urgency, founder story.
- **Hook** (first 3 seconds / first line): question, bold stat, pattern interrupt, problem callout, "POV", before/after. (Use `sc:ad-copywriting` for the lines.)
- **Format**: UGC video, talking-head, static carousel, motion graphic, product demo, collection/DPA, lead form. (Use `sc:image-gen-prompting` for static/concept visuals.)

**Cadence & rules:**
- Ship a **batch of 4–8 variants** per test, each isolating one variable so you learn *why* it won.
- Read winners on **CTR + hook-rate (3s view)** early, **CPA/ROAS** for the verdict. Need enough spend to reach significance (rule of thumb: ~3–5× target CPA spent before killing a creative).
- **Kill** creatives with frequency >2.5–3 and falling CTR (ad fatigue); **refresh** the top angle with new hooks rather than abandoning it.
- **Winners → scale** into the proven (70%) bucket; losers' *learnings* feed the next batch. Maintain a creative-iteration log.
- Modular production: shoot once, cut multiple hooks/CTAs/aspect ratios from the same footage.

## 4. KPIs per funnel stage (judge each stage by its own job)
Don't demand BOF metrics from TOF inventory.

| Stage | Primary KPI | Supporting / diagnostic |
|---|---|---|
| Awareness | CPM, reach, **3s/ThruPlay rate**, video-completion, brand-lift | unique reach, frequency |
| Consideration | **CTR, CPC**, cost per landing-page view, engagement rate, lead pool growth | view-rate, add-to-cart |
| Conversion | **CPA / ROAS / CVR**, cost per qualified lead | AOV, cart-to-purchase, new-customer CAC |
| Retention | Repeat-purchase rate, **LTV:CAC**, churn, email/SMS revenue | NPS, win-back rate |

North-star: **blended CAC vs LTV** and **MER (Marketing Efficiency Ratio = total revenue / total ad spend)** across all channels — platform-reported ROAS over-counts; MER is the honest scoreboard.

## 5. Measurement & incrementality (prove it, don't trust the dashboard)
Platform attribution is biased toward channels that show ads to people about to convert anyway (especially retargeting and brand search). Build a measurement stack — see the `ad-measurement-tracking` skill for tag/Events-API/server-side detail.

- **Tracking foundation**: GA4 + each platform's pixel **and server-side** (Meta CAPI, Google Enhanced Conversions, TikTok Events API). Deduplicate with consistent event IDs. UTM everything.
- **Three lenses, triangulated**:
  1. **MTA / platform attribution** — fast, granular, biased; use for in-platform optimization only.
  2. **Incrementality tests** — geo holdouts (lift studies), conversion-lift / brand-lift, PSA/ghost ads, on/off tests. Answer: "what happened that wouldn't have anyway?"
  3. **MMM (Media Mix Modeling)** — top-down regression on aggregate spend vs outcomes; privacy-durable, captures cross-channel synergy and diminishing returns. Increasingly the strategic allocator.
- **Workflow**: optimize daily with platform data → validate monthly/quarterly with incrementality → re-allocate budget with MMM. AI **scenario planning** (forecast incremental outcome of a budget split *before* spending) is the 2026 best practice.
- Watch **iOS/ATT + cookie deprecation + IL privacy** signal loss — lean on server-side + first-party data + modeled conversions.

## 6. Optimization workflow (cadence)
- **Daily**: pacing & anomalies (spend spikes, broken landing pages, disapprovals, zero-delivery ad sets). Don't touch bids/budgets mid-learning.
- **Weekly**: review by stage KPI; pause fatigued creative (freq/CTR); shift 10–20% of budget toward marginal winners; launch the next creative batch; check search-term/placement reports and add negatives/exclusions.
- **Bi-weekly/Monthly**: full funnel review — is each stage feeding the next? Rebalance funnel split; run/read an incrementality test; refresh audiences and offers.
- **Quarterly**: MMM re-allocation, channel add/drop decisions, LTV recalibration, seasonality plan for the next quarter (IL holidays — see below).

**Scaling rules:** scale winners ~20%/day max (more resets learning); prefer **horizontal** scaling (duplicate winner into new audiences/placements) over aggressive vertical budget jumps; raise tROAS/tCPA targets gradually. **Kill rules:** kill an ad set/creative once it has spent ~3–5× target CPA with zero/over-target results; kill a channel only after an incrementality read, not on last-click alone.

## 7. Common mistakes / pitfalls
- **All capture, no generation** — scaling search/PMax until queries saturate, then blaming "the algorithm."
- **Average-ROAS allocation** — over-funding brand search, starving the demand-gen that feeds it.
- **Judging TOF by CPA** — killing awareness because it didn't last-click-convert.
- **Double-counting retargeting** as incremental; it mostly harvests existing demand.
- **Creative roulette** — testing 30 random ads with no matrix, so you never learn *why* one won.
- **Resetting learning** — large daily budget/target swings that reset smart bidding.
- **Trusting platform ROAS** — each platform claims the same sale; only MER/incrementality is honest.
- **No server-side tracking** — losing 20–40% of signal post-iOS14/ATT, then optimizing on garbage.
- **One creative, one language** for a bilingual market (see below).

## 8. Israel / Hebrew market notes
- **Channel mix (IL reality):** Meta (Facebook + Instagram) and Google are the workhorses; **YouTube** very strong; **TikTok** growing fast with young audiences; **WhatsApp** is the dominant messaging layer — design click-to-WhatsApp ads and conversational flows. **LinkedIn** for B2B/hi-tech. **Taboola/Outbrain** (Israeli-founded) for native discovery. Local placements: **ynet, Walla, Mako, Globes/Calcalist** (B2B), and Israeli influencer/creator ecosystems.
- **Hebrew + RTL creative:** write copy natively in Hebrew (don't translate English literally — see `sc:ad-copywriting`); design **right-to-left** layouts, mirror logos/CTAs/arrows, ensure numerals and embedded English render correctly. Provide **both Hebrew and Russian/Arabic** variants for relevant segments.
- **Budgets in NIS (₪):** plan and report in shekels; CPMs/CPCs are typically lower than US but the market is small — saturation comes fast, so creative refresh and incrementality matter more.
- **Timing — Shabbat & holidays:** consumer activity drops Friday afternoon through Saturday night; **e-commerce delivery and many services pause on Shabbat** — adjust dayparting, pause/raise budgets accordingly, and set expectations in creative. Plan major bursts around **חגים**: Rosh Hashanah, Yom Kippur (near-total shutdown — go dark), Sukkot, Hanukkah, Purim, **Pesach** (huge retail + cleaning/home spend), Shavuot, and the **end-of-summer "back-to-school" (חזרה ללימודים)** and **Black Friday / סייבר מאנדיי** waves (now major in IL).
- **Local consumer behavior:** mobile-first, price-sensitive and comparison-driven (link to/own the comparison narrative), high trust in social proof and influencer endorsement, strong response to free shipping and installments (תשלומים / Bit, PayBox, Google/Apple Pay).
- **Privacy & compliance:** Israeli Privacy Protection Law + amendments — honor consent for tracking, be careful with customer-match uploads (hashed, consented data only). Regulated verticals (finance, supplements, gambling) face platform + local restrictions.

## Output — what to produce when this skill activates
Deliver a ready-to-execute **media plan**, not advice. Include:
1. **Funnel → channel → budget table** (NIS): each funnel stage, the channels assigned, monthly budget, the bid strategy (CBO/ABO/tCPA/tROAS), and the stage KPI + target.
2. **Campaign skeleton per channel** (campaign type → ad groups/sets → targeting/audiences → bid strategy → budget), reusing the relevant per-platform skill for specifics.
3. **Creative test plan**: a hook × angle × format matrix with the first batch of 4–8 variants and the win/kill criteria (delegate the actual copy to `sc:ad-copywriting`, visuals to `sc:image-gen-prompting`).
4. **Measurement plan**: tracking stack (pixels + server-side per channel), the KPIs/targets per stage, MER north-star, and the planned incrementality/MMM cadence (link to `ad-measurement-tracking`).
5. **30/60/90 optimization calendar** with scaling + kill rules and the **IL seasonality/Shabbat-aware** flighting overlay.
6. **Assumptions & risks** explicitly stated (margin, target CPA derivation, signal-loss caveats) so the plan is auditable.

Always state assumptions, plan in **₪/NIS**, and produce **Hebrew + RTL-ready** creative direction for the Israeli market.
