---
name: amazon-ads
description: "Pro playbook for Amazon Advertising — Sponsored Products, Sponsored Brands, Sponsored Display, and Amazon DSP. Covers campaign structure, keyword harvesting + match types + negatives, ACoS/TACoS/ROAS, bid adjustments by placement, product/ASIN targeting, and the ad-to-organic-rank flywheel. Use when planning or optimizing Amazon PPC for a brand or seller. Activate for: amazon ads, amazon ppc, sponsored products, sponsored brands, sponsored display, amazon dsp, ACoS, TACoS, ROAS, keyword harvesting, negative keywords, product targeting, ASIN targeting, bid adjustment, amazon flywheel, amazon advertising console, פרסום באמזון, אמזון פיפיסי, מודעות ממומנות אמזון, אקוס, ניהול קמפיינים אמזון, מילות מפתח אמזון, מילות מפתח שליליות, הצעת מחיר אמזון."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Amazon Ads — Pro Playbook

A practitioner's guide to running Amazon Advertising (Sponsored Products, Sponsored Brands, Sponsored Display, and DSP) for sellers and vendors. The mental model throughout: **paid ads buy sales velocity → velocity lifts organic rank → organic rank lowers your blended cost of selling.** Optimize the system, not the line item.

Authored fresh for SquadCoder. Terminology current to the Amazon Ads console / Amazon Ads API v3.

---

## 1. The three (four) ad products — when to use each

| Product | Inventory | Billing | Primary job |
|---|---|---|---|
| **Sponsored Products (SP)** | Search results + product detail pages | CPC | Workhorse. Drives 70–80% of most accounts' ad sales. Capture high-intent shoppers. |
| **Sponsored Brands (SB)** | Top-of-search banner, brand video, Store spotlight | CPC | Brand awareness + defend branded search. Requires **Brand Registry**. |
| **Sponsored Display (SD)** | On/off-Amazon, detail pages, audiences | CPC or **vCPM** | Retargeting, competitor-ASIN conquesting, audience prospecting. Requires Brand Registry. |
| **Amazon DSP** | Programmatic display/video/audio on & off Amazon | CPM | Full-funnel audience buying, awareness, advanced retargeting. Self-serve or managed; usually higher min spend. |

Start with SP. Add SB once you have a Store + 3+ ASINs. Add SD for retargeting + competitor defense. Graduate to DSP when you need reach/awareness or have a steady budget (often a managed minimum).

---

## 2. Account & campaign structure

Keep it **simple, granular, and reportable**. The dominant pattern:

**Single Keyword / Single Product-group Ad Groups (SKAG-lite).** One tight theme per ad group so bids and search-term reports are interpretable.

A clean SP architecture per product (or product family):

1. **Auto campaign (discovery).** One ad group, all 4 targeting groups on (close match, loose match, complements, substitutes). Job: mine search terms. Low-to-moderate bid.
2. **Manual Broad/Phrase campaign (research).** Harvested terms in broad + phrase. Job: keep finding variants.
3. **Manual Exact campaign (performance).** Proven converters in exact match. Job: efficiency + scale. Highest bids live here.
4. **Product Targeting / ASIN campaign.** Target competitor ASINs, your own (defense), and categories.
5. **Branded campaign.** Your own brand terms — cheap, high CR, defends against conquesting. Keep separate so branded sales don't flatter non-brand ACoS.

**Naming convention** (consistency makes bulk operations and reports sane):
`SP_[Product]_[Auto|Broad|Phrase|Exact|PT]_[MatchType]` e.g. `SP_KettleX_Exact_Manual`.

**One budget per intent**, not one giant campaign. Separate top performers so you can scale them without dragging up wasted spend.

---

## 3. Targeting & audiences

**Keyword targeting (SP, SB):** match types in order of control:
- **Exact** `[kettle]` — only that term + close variants (plural/typo/word order). Tightest control, best for proven winners.
- **Phrase** `"electric kettle"` — contains the phrase in order. Mid-control research.
- **Broad** `electric kettle` — any order + related terms; broadest reach, most waste. Use modified-broad mindset and watch search-term reports closely.

**Product (ASIN/category) targeting (SP, SB, SD):**
- **Individual ASINs** — conquest weaker competitors (worse rating, higher price, no Prime, fewer reviews) and defend your own detail pages.
- **Categories** with refinements (price range, star rating, Prime, brand) — broad placement on detail pages.

**Sponsored Display audiences:**
- **Views remarketing** — shoppers who viewed your (or similar) products in the last 30/60/90 days. Highest-ROI SD tactic.
- **Purchases remarketing** — repeat/consumable cross-sell.
- **Amazon audiences** — In-Market, Lifestyle, Interests, Life-events (prospecting).
- **Product/category contextual** — show on specific detail pages.

**DSP audiences:** 1st-party (pixel/ASIN view + purchase), Amazon behavioral segments, lookalikes, advertiser-uploaded (hashed) audiences via clean room (AMC), and **Amazon Marketing Cloud** custom audiences for advanced overlap/path analysis.

**1st-party data:** use Brand Registry + AMC to build remarketing pools, suppress recent purchasers, and build lookalikes off your converters.

---

## 4. Bidding & budget strategy

**SP bid strategies (campaign-level):**
- **Dynamic bids – down only** — Amazon lowers bid when a conversion is unlikely. Safe default for new/efficiency campaigns.
- **Dynamic bids – up and down** — Amazon raises up to +100% (top of search) when conversion is likely. Use on proven performers to win high-converting placements.
- **Fixed bids** — uses your exact bid; best for pure data-gathering / impression share tests.

**Placement (bid-by-placement) adjustments** — multiply bids by placement, +0% to +900%:
- **Top of search (first page)** — usually the highest-CR placement; the lever you scale first.
- **Rest of search**.
- **Product pages** (detail pages).

Workflow: pull the **Placement report**, find which placement converts best per campaign, then set Top-of-Search and Product-pages modifiers accordingly. Combine "up and down" + a Top-of-Search modifier to dominate page-1 for winners.

**SD bidding:** CPC for clicks/conversions, or **vCPM** when the goal is reach/awareness. Optimize for "conversions," "clicks," or "viewable impressions."

**DSP:** CPM-based; optimize to a target ROAS / CPA or reach goal; use supply across Amazon O&O + 3rd-party exchanges.

**Budgets — CBO vs ABO equivalent.** Amazon is mostly **ABO** (budget set per campaign). There is no Meta-style CBO; the closest tools are:
- **Portfolios** — group campaigns under a shared budget cap and date range for roll-up control.
- **Budget Rules** — schedule increases for events (Prime Day, BFCM, holidays) or rule-based increases when performance beats a threshold.
- **Rule-based / scheduled bidding** to defend budget pacing.

Pacing: top campaigns should not run out of budget before evening. If a campaign hits its cap by mid-afternoon and ACoS is healthy, **raise the budget** — you're leaving sales on the table.

---

## 5. Creative specs & best practices

**Sponsored Products** — uses your existing detail-page listing. "Creative" = the **listing itself**: main image on white, 6+ images, A+ Content, ≥4-star rating, competitive price, in-stock. A weak listing makes ads expensive; **fix the listing before scaling spend.**

**Sponsored Brands** formats:
- **Product Collection** — logo + custom headline + 3 products → lands on Store or custom landing page.
- **Store Spotlight** — showcase subpages of your Store.
- **Brand Video** — autoplay video in search results. Specs: **1080p (1920×1080 or 16:9), 6–45s (≤30s ideal), ≤500MB, .mp4/.mov**, product in first 1–2s, captions on (sound-off viewing), end on a clear product/CTA frame.
- **Logo**: ≥400×400px PNG/JPG on a non-white/transparent background.
- **Headline**: ≤50 chars, benefit-led, no claims you can't prove, no price/"#1 best seller" violations.

**Sponsored Display** — auto-generated creative (your image + headline + logo) or custom image. Lifestyle image + tight headline outperform plain product shots for prospecting.

**Hooks that work on Amazon:** lead with the differentiator a shopper scans for — Prime/fast shipping, star rating, price, a concrete benefit ("dishwasher-safe," "12-hour battery"). Amazon shoppers are bottom-funnel and skeptical — proof > hype.

---

## 6. Conversion tracking & measurement

Amazon attributes most on-platform sales automatically (no pixel needed for SP/SB/SD selling your own ASINs) using **14-day attribution** (SP/SD; SB top-of-search). Key surfaces:

- **Amazon Attribution** — tracks **off-Amazon** traffic (Google/Meta/email/influencers) driving Amazon sales; gives clicks, detail-page views, add-to-carts, purchases. Essential for measuring external traffic's Amazon impact.
- **Brand Referral Bonus** — bonus (≈10% avg) on sales you drive from off-Amazon via Attribution tags. Always tag external traffic.
- **Amazon Marketing Cloud (AMC)** — privacy-safe clean room for cross-product, cross-touch path analysis, new-to-brand, frequency, and custom audiences. The serious measurement layer.
- **Sponsored Ads reports** — Search Term, Targeting, Placement, Advertised/Purchased Product, Budget, Campaign reports (via console or Ads API v3 / bulk operations).
- **New-to-Brand (NTB)** metrics on SB/SD/DSP — % of orders from customers new to your brand in the trailing 12 months. The north star for awareness spend.

**Core metrics:**
- **ACoS** = Ad Spend ÷ Ad Sales. Lower = more efficient *within ads*.
- **ROAS** = Ad Sales ÷ Ad Spend = 1 ÷ ACoS.
- **TACoS** = Ad Spend ÷ **Total** Sales (ads + organic). The strategic number: **falling TACoS while sales grow** means ads are lifting organic — the flywheel is working. Rising TACoS means you're buying sales you'd have gotten organically (or organic is slipping).
- **Break-even ACoS** = your contribution margin %. Spending above it on a launch is intentional investment; spending above it at steady state is a leak.
- Watch CTR, CVR, CPC, impression share, and NTB alongside ACoS — ACoS alone hides bad CVR or thin impression share.

---

## 7. Keyword harvesting workflow

This is the engine of SP. Run it on a weekly cadence:

1. **Mine.** Pull the **Search Term Report** from Auto + Broad/Phrase campaigns (last 14–30 days).
2. **Promote (harvest).** Any search term with **≥1–2 orders** and ACoS at/below target → add as **Exact** in the performance campaign with a deliberate bid.
3. **Negate to prevent overlap.** Add that newly-harvested term as a **negative exact** in the Auto/source campaign so the two campaigns don't bid against each other (de-duplication). Now the term is "graduated."
4. **Prune waste.** Any term with **high spend, many clicks, zero orders** (e.g., >2× target-CPA in spend, 0 conversions) → **negative exact**. Vague/irrelevant terms → **negative phrase**.
5. **Bid-tune.** Raise bids on harvested winners toward Top-of-Search; lower bids on high-ACoS-but-converting terms instead of killing them outright.

**Negative match types:**
- **Negative exact** — block one exact term (graduated terms, proven losers).
- **Negative phrase** — block a whole theme (e.g., negate `free` to kill freebie-seekers).
- **Negative product targeting** — exclude specific ASINs/brands that waste clicks.
Maintain a shared **negative keyword list** at the account level for universal junk (competitor brand names you can't convert, irrelevant uses, profanity, "cheap/free/used").

---

## 8. Optimization workflow & cadence

**Daily (5 min):** check budget-capped campaigns (raise budget on healthy ones), out-of-stock ASINs (pause their ads — you pay for clicks you can't fulfill), and any anomaly spikes.

**Weekly (the core loop):**
1. Run the **harvest workflow** (Section 7).
2. **Bid adjustments** — review by target: ACoS above target → cut bid 10–20%; below target with good impression share headroom → raise bid 10–15%. Move in steps, not lurches.
3. **Placement report** → set/adjust Top-of-Search & Product-pages modifiers.
4. **Search-term negatives** — prune the week's waste.
5. **Pause** keywords/targets with high clicks (≥10–15) and 0 orders.

**Bi-weekly / monthly:**
- Campaign-level budget reallocation (shift to lowest-ACoS, highest-volume campaigns).
- Day-parting review (if dashboards/rules support it).
- New product/competitor targeting tests; SB creative/headline A/B; SD audience tests.

**Scaling rules (do these when ACoS is comfortably below break-even):**
- Raise budget on capped, profitable campaigns first (cheapest growth).
- Increase bids on Exact winners + add Top-of-Search modifier to own page-1.
- Expand match types and add adjacent harvested keywords.
- Layer SD view-remarketing + SB to compound.

**Kill rules (cut waste fast):**
- Search term: spend ≥ 2× target CPA with 0 orders → negative.
- Keyword/target: ≥15 clicks, 0 orders → pause.
- Campaign: 30 days, ACoS ≫ break-even, no organic-rank benefit → restructure or pause.
- Any ad on an out-of-stock or suppressed (poor) listing → pause until fixed.

---

## 9. The flywheel — ads ↔ organic rank

Amazon ranks products largely on **sales velocity + conversion rate + relevance**. Ads inject velocity:

1. Ads drive clicks + sales for a keyword.
2. Sales velocity + CVR on that keyword **lift organic rank** for it.
3. Higher organic rank earns free clicks/sales → CVR rises further.
4. You can now **lower ad bids** on that keyword (you rank organically) and redeploy budget to the next term.
5. **TACoS trends down** as organic share grows — the proof the flywheel is turning.

Practical implications:
- On **launch**, accept high ACoS to buy rank (it's customer-acquisition / ranking investment, not waste).
- Track **organic rank** per target keyword alongside ad metrics; harvest ad budget off keywords once you own organic page-1.
- Never let a hero ASIN go out of stock — it resets velocity and tanks rank (rebuilding rank costs far more than the lost margin).
- Protect the listing (price, reviews, images, A+) — ads amplify whatever CVR the listing already has.

---

## 10. Common mistakes / pitfalls

- **Scaling spend on a weak listing** — fix images/price/reviews/A+ first; ads can't fix a bad detail page.
- **Auto + Manual cannibalization** — forgetting to negate harvested terms in the source campaign → bidding against yourself.
- **Optimizing to ACoS only** — ignoring TACoS, NTB, and organic rank; cutting "high-ACoS" launch spend that was actually buying rank.
- **Branded + non-branded in one campaign** — branded's cheap conversions mask non-brand inefficiency.
- **Bid lurches** — ±50% overnight changes destabilize learning; move in 10–20% steps.
- **Ignoring placement data** — leaving Top-of-Search at 0% when it's your best-converting slot.
- **Too few negatives** — letting irrelevant search terms bleed budget for weeks.
- **Letting capped campaigns starve** — profitable campaigns out of budget by noon = lost sales.
- **Running ads on OOS / suppressed ASINs** — paying for clicks that can't convert.
- **Set-and-forget** — Amazon auctions and competitors shift weekly; this is a maintained system.

---

## 11. Israel / Hebrew market notes

- **No local Amazon marketplace.** Israeli sellers/brands typically advertise on **Amazon.com (US)**, sometimes **.de / .co.uk / .ae**. Pick the marketplace by where the customer + fulfillment live; targeting, currency (USD/EUR/GBP/AED), and tax differ per marketplace.
- **Budgets in NIS → marketplace currency.** Plan in ₪ but the console bills in the marketplace currency; account for ~ILS↔USD FX and card FX fees when setting CPCs and daily caps.
- **Hebrew listings/creative only where the marketplace language supports it** (e.g., a Hebrew-capable storefront/region). On .com, ads and listings are **English** — write English keywords/copy; don't transliterate Hebrew. Use Hebrew only when targeting a marketplace/audience that reads it, and ensure **RTL-correct creative** (logo placement, text alignment, video captions) for any Hebrew SB video.
- **Timing — Shabbat & Jewish calendar.** If targeting Israeli buyers on a region that serves them, expect lower activity Fri evening–Sat; budget rules should lean into **מוצ"ש** (Saturday-night) and Sunday (a workday in Israel). For US-targeted campaigns, pace to **US time zones**, not Israel's.
- **Local seasonality** for Israel-facing demand: align budget-rule lifts to local peaks (Rosh Hashanah, Passover, holiday gifting) plus the big Amazon events (Prime Day, BFCM, Cyber Monday).
- **Privacy expectations** — Israeli customers and GDPR-adjacent EU marketplaces expect data minimization; for AMC/Attribution audience uploads use only properly consented, hashed 1st-party data.

---

## Output — what to produce when this skill activates

When asked to plan or optimize Amazon Ads, produce:

1. **Campaign skeleton** — the SP structure (Auto + Broad/Phrase + Exact + Product-Targeting + Branded), naming convention, suggested daily budgets, and bid strategy per campaign; note SB/SD/DSP additions if relevant.
2. **Targeting plan** — seed keyword list grouped by match type, competitor/own ASINs to target, negatives to pre-load, and any SD/DSP audiences.
3. **3 creative variants** — for SB: 3 headlines (≤50 chars) + recommended format (Collection/Video/Spotlight); for SP: 3 listing-improvement actions (image/A+/price/review levers).
4. **Tracking & targets plan** — break-even ACoS (from margin), target ACoS by campaign stage (launch vs steady), TACoS goal, the reports to pull, Amazon Attribution tags for any off-Amazon traffic, and whether AMC/NTB applies.
5. **Optimization cadence** — the weekly harvest + bid + placement + negative loop, with explicit scale and kill thresholds.

Always confirm **real ASINs** (never invent them), the **marketplace**, **margin/break-even**, and **launch vs steady-state** before recommending bids or budgets.
