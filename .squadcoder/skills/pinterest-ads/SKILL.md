---
name: pinterest-ads
description: "Pro Pinterest Ads playbook: campaign objectives, Shopping/catalog + Idea/Video/Standard Pins, keyword + interest + actalike + retargeting audiences, automatic vs manual bidding, the Pinterest tag + Conversions API (CAPI), high-intent/seasonal planning, and an optimization workflow with Israel/Hebrew-market notes. Use when planning, launching, structuring, troubleshooting, or scaling Pinterest advertising. Activate for: Pinterest Ads, Pinterest advertising, promoted pins, Pinterest catalog, Shopping ads, Idea Pin ads, Pinterest tag, Pinterest CAPI, actalike audience, Pinterest ROAS, פרסום בפינטרסט, מודעות פינטרסט, קמפיין פינטרסט, פינטרסט קטלוג, פיקסל פינטרסט, קהל דומה פינטרסט."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Pinterest Ads — Pro Playbook

Pinterest is a **high-intent visual discovery** platform: people come to plan and buy, not to socialize. Searches are forward-looking ("things I'm planning to do/buy"), so ads work best when treated like a hybrid of **search + shopping + visual social**. Plan for long consideration windows and strong seasonal demand curves.

This skill covers the **Pinterest Ads Manager** (ads.pinterest.com) and the **Pinterest Marketing API**. Use real platform terminology; do not invent feature names.

---

## 1. Account & campaign structure

Hierarchy: **Ad account → Campaign (objective + budget) → Ad group (targeting, bid, placement, schedule) → Ad (the Pin) → Pin/creative + catalog**.

### Campaign objectives (pick by funnel stage)
- **Awareness** — Brand awareness / video views. Billed CPM. Top of funnel, reach + impressions.
- **Consideration (Traffic)** — drive clicks to site. Billed CPC. Mid-funnel, the workhorse for content + product discovery.
- **Conversions** — optimize for a tracked event (Checkout, Add to cart, Signup, Lead). Requires the Pinterest tag/CAPI firing that event. Needs ~**50 conversions/week per ad group** to exit learning and stabilize.
- **Catalog sales (Shopping)** — dynamic product ads from an uploaded catalog/product feed; can be Conversions-optimized. Best ROAS engine for e-commerce.
- **Video views / App installs / Leads (Lead gen forms)** — specialized objectives where relevant.

> Some objectives (notably Catalog/Shopping) gate which ad formats and bid strategies are available — choose the objective first.

### Structure rules of thumb
- **CBO equivalent:** Pinterest uses **campaign-level "Daily" or "Lifetime" budget**; budget can sit at campaign level (auto-distributed across ad groups, similar to Meta CBO) or you set per-ad-group budgets (ABO-style). For most accounts start with **2–4 ad groups per campaign**, each a clean targeting theme (don't fragment spend).
- **One audience idea per ad group** (keyword cluster, interest set, retargeting segment, or actalike) so you can read performance and budget cleanly.
- **Separate prospecting from retargeting** into different campaigns — different bids, creative, and frequency needs.
- Keep **5–8+ Pins per ad group** so Pinterest can optimize creative; refresh regularly (Pins fatigue slower than Meta but still decay).

---

## 2. Ad formats & creative specs

| Format | Use | Spec |
|---|---|---|
| **Standard Pin** | Single image, the default | 2:3 ratio (1000×1500px ideal), JPG/PNG ≤ 32MB |
| **Standard Video / Max-width Video** | Motion, demos, brand | 2:3, 9:16 or 1:1; ≤ 15MB rec, 4s–15min (6–15s sweet spot); .mp4/.mov |
| **Idea Pin (ads)** | Multi-page story, native feel, saves | Up to 20 pages, 9:16 full-screen vertical, video/image mix |
| **Shopping / Product Pins** | Dynamic catalog products | Pulled from product feed; price/availability auto-synced |
| **Collections** | 1 hero + 3+ secondary product tiles (mobile) | Hero 1:1 or 2:3; lifestyle hero + product grid |
| **Carousel** | 2–5 swipeable images | 2:3 or 1:1 per card |
| **Quiz / Showcase (interactive)** | Engagement, product match | Per current Ads Manager availability |

### Creative best practices
- **Vertical 2:3 is the rule.** Anything wider gets cropped or under-served. Idea Pins/video → full-screen **9:16**.
- **Text overlay**: bake a clear value prop into the top third of the image; Pinterest feeds are skimmed fast. Keep on-image text legible at thumbnail size.
- **Lifestyle > product-on-white.** Show the product *in use / styled in a scene*. "Inspiration" outperforms "catalog."
- **Branding early**: logo/brand in first 1–2s of video; assume sound-off (add captions/subtitles).
- **Title + description matter for ranking** — they feed keyword relevance. Write descriptive, keyword-rich copy (not clickbait); include the search terms a planner would use.
- **Strong, specific hooks**: "5 ways to…", "How to…", seasonal/occasion framing ("Hanukkah gift ideas"), price/offer where relevant.
- **CTA**: clear next step; product Pins should deep-link to the exact PDP.

---

## 3. Targeting & audiences

Pinterest targeting is **layered** (combine within an ad group), and uniquely supports **keywords**:

1. **Keywords** — bid on search terms (broad-match style). Pinterest is search-driven; keyword targeting captures high-intent discovery. Use 20–40 tightly-themed keywords per ad group; mine the **search bar autocomplete** and **Pinterest Trends** for real query language. Add **negative keywords** to block waste.
2. **Interests** — Pinterest's taxonomy of ~hundreds of interest categories (Home decor, Beauty, Travel, Food & drink, Weddings…). Broad reach; pair with keywords for prospecting.
3. **Audiences (1st-party & modeled):**
   - **Visitor / retargeting** — built from the **Pinterest tag** (site visitors, viewers of a category, cart abandoners). Highest ROAS layer.
   - **Customer list** — upload hashed emails/MAIDs (Customer Match). Min ~100 matched; great for retargeting + seed for actalikes.
   - **Engagement** — people who engaged with your Pins/profile (saves, clicks, closeups). Pinterest-specific warm audience.
   - **Actalike (Pinterest's lookalike)** — modeled from any seed audience (customers, visitors, engagers). Choose reach 1–10% (tighter = more similar). Use 3–5% as a starting prospecting layer.
4. **Demographics** — age, gender, location, language, device. **Expanded targeting** lets Pinterest broaden beyond your set audience to find converters.
5. **Placement** — Browse (home feed), Search, or both. Search placement = highest intent; Browse = scale/discovery.

**Prospecting recipe:** keywords + interests + (optional) actalike, expanded targeting ON.
**Retargeting recipe:** Pinterest-tag visitor segments + customer list + engagement, expanded targeting OFF.

---

## 4. Bidding & budget strategy

### Bid strategies
- **Automatic bid** (default, recommended to start) — Pinterest sets bids to get the most results at your budget. Best for learning phase and most advertisers. Control spend via budget, not bid.
- **Custom / manual bid** — you cap the max CPC/CPM/CPA. Use only once you know your viable CPA/ROAS and need to defend margins or push volume at a target.
- **Target CPA / target ROAS-style controls** appear on Conversion/Catalog objectives in some markets — set a realistic target ~10–20% above your true tolerance at first, then tighten.

### Budget & pacing
- **Daily budget** (steady pacing) for always-on; **Lifetime budget** for fixed-window seasonal pushes (e.g., a holiday flight) — lifetime auto-paces against the schedule.
- Give each Conversion ad group **enough budget to reach ~50 conversions/week**; if your CPA is ₪40 and you want 50 conv/wk, that's ~₪2,000/wk minimum to learn cleanly. If you can't fund that, optimize for a **mid-funnel event** (Add to cart, Lead) with more volume, then move down.
- **Don't change budget >20–30%/day** during learning — it resets pacing. Scale gradually.
- Pinterest **billing** is CPC/CPM/CPV depending on objective; conversions are reported via tag/CAPI attribution, not billed per-conversion.

---

## 5. Conversion tracking & measurement

**Two complementary signals — run BOTH for resilient measurement post-iOS/ATT:**

1. **Pinterest tag (browser pixel)** — base code + event codes on the site. Standard events: **PageVisit, ViewCategory, Search, AddToCart, Checkout, Signup, Lead, WatchVideo, Custom**. Pass `event_id` for dedup and partner params (value, currency, order_id, product ids).
2. **Conversions API (CAPI)** — server-side event delivery (direct, or via partners like Shopify, GTM server, Tealium, Segment, Zapier). Sends hashed user data (email, IP, user agent, click id) for matching that survives ad-blockers/cookie loss. **Deduplicate** browser + server events with a shared **`event_id`**.
3. **Enhanced match / hashed PII** — improves attribution; always SHA-256 hash emails/phones client- or server-side.
4. **Attribution windows** — Pinterest default ~**30-day click / 60-day engagement / 1-day view** (configurable). Pinterest's value is *assisted/upper-funnel* — judge it on **incremental** and view-through/assisted, not just last-click, or you'll under-credit it. Use **Conversion Insights** and lift studies where available.
5. **Catalog feed** — for Shopping: upload a product feed (Google/Shopify/CSV/XML) with required fields (id, title, description, link, image_link, price, availability, product_type). Keep it fresh (price/stock) to avoid disapprovals and wasted spend.

**Verify before launch:** install the **Pinterest Tag Helper** Chrome extension (or check Events Manager) and confirm PageVisit + your key conversion event fire with correct value/currency.

---

## 6. Optimization workflow (the operating cadence)

**Learning phase (first ~7 days / until ~50 conv/wk):** do NOT touch bids/budget/targeting. Let it stabilize. Watch only for *zero delivery* or *broken tracking*.

**Daily (5 min):**
- Delivery healthy? (spend pacing, no "limited"/disapproved status)
- Tag/CAPI still firing? (Events Manager event count not cratering)
- Any creative or feed disapproval to fix

**2–3×/week:**
- By **ad group**: CPA / ROAS vs target. Pause or cut budget on losers that have had ≥ ~50–100 clicks or ~₪150–300 spend with no/expensive conversions.
- By **Pin**: pause low CTR + low save-rate creatives; shift budget to winners. Keep ≥3 active Pins per group.
- By **keyword/interest**: add **negatives** for irrelevant queries; expand winning keyword themes into new tightly-themed ad groups.

**Weekly:**
- Refresh/iterate creative on fatiguing groups (CTR decay, rising CPM/frequency).
- Review **placement** split (Search vs Browse) — reallocate to the cheaper-converting one.
- Check **attribution windows / Conversion Insights** for assisted conversions before judging value.

### Scaling rules (when an ad group is winning at/under target CPA for 3–5+ days)
- **Vertical:** raise budget **+20–30% every 2–3 days** (not in one jump).
- **Horizontal:** duplicate the winner into new actalike %s, new keyword clusters, or new interests; widen actalike reach (3%→5%→10%).
- Promote the best organic Pins (high save rate) into ads — they're pre-validated.

### Kill rules
- Ad group: spent ~2–3× target CPA with **0 conversions** → pause.
- Pin: CTR well below account avg AND save rate near zero after ~1,000 impressions → pause.
- Keyword: spend with clicks but no conversions and clearly off-intent → negative/remove.

---

## 7. High-intent & seasonal planning behavior

Pinterest's superpower is **early intent**: users plan **6–12 weeks ahead** (weddings, holidays, back-to-school, home reno, travel).
- **Front-load seasonal campaigns** — start spending **~45–60 days before** the peak (the audience is already searching). E.g., for a December holiday, ramp from mid-October.
- Use **Pinterest Trends** (trends.pinterest.com) to validate demand timing and surface real query language by region/season.
- Build **evergreen prospecting** (always-on keywords/interests) + **seasonal bursts** (lifetime-budget flights) on top.
- Capture intent → **retarget aggressively** as the season's purchase window opens (the consideration cycle is long; visitors don't buy on first touch).

---

## 8. Common mistakes & pitfalls

- **Horizontal/wide creative** — gets cropped/under-delivered. Always 2:3 (or 9:16 for video/Idea).
- **Judging by last-click only** — under-credits Pinterest's assist/discovery value; use 30-day click + assisted/Conversion Insights.
- **Touching settings during learning** — resets pacing; be patient.
- **Optimizing for Checkout with too little budget** — can't hit 50 conv/wk → stuck in learning. Optimize a mid-funnel event instead.
- **Stale catalog feed** — price/stock mismatches cause disapprovals and wasted spend; sync daily.
- **No CAPI** — browser-only tracking loses 20–40% of conversions post-ATT/ad-blockers; always add server-side with event_id dedup.
- **One Pin per ad group** — starves creative optimization; ship 5–8.
- **Ignoring keywords** — treating Pinterest like Meta (interests only) and missing its search intent.
- **No negatives** — broad keywords drain budget on irrelevant queries.
- **Skipping Tag Helper verification** — launching with a mis-fired or missing event = blind optimization.

---

## 9. Israel / Hebrew market notes

- **Audience reality:** Pinterest penetration in Israel is **smaller than Meta/Google**; it skews to **home, design, weddings, food, fashion, beauty, crafts, parenting, travel** — strongest for **e-commerce, D2C, design/home, events, and visual lifestyle brands**, weaker for B2B/local services. Set volume expectations accordingly and treat it as a discovery/assist channel.
- **Language & creative:** much of Israeli Pinterest browses in **English**, but **Hebrew creative + Hebrew keyword targeting** wins local relevance and trust. Ship **bilingual creative variants** (Hebrew + English) and split-test.
- **RTL creative:** design Hebrew Pins **right-to-left** — text alignment, reading order, and the visual hierarchy/CTA should flow RTL; logo/price placement mirrored. Don't just translate an LTR layout.
- **Hebrew keyword nuances:** Hebrew search has **inflections, gender forms, plene vs defective spelling (כתיב מלא/חסר), and English loanwords**. Include common spelling variants and the English term users actually type (e.g., both "שמלת כלה" and "wedding dress"). Mine the Pinterest search bar in Hebrew for real query forms.
- **Budgets in NIS (₪):** Pinterest bills in your account currency (set ILS where supported, else USD). Size learning budgets in ₪ as above (e.g., ~₪2,000/wk to learn a checkout event at ₪40 CPA).
- **Timing — Shabbat & chagim:** Israeli engagement and conversions dip Friday afternoon → Saturday night (Shabbat). Plan **dayparting/pacing around Shabbat**, and **front-load Jewish-calendar seasons** (Rosh Hashanah, Sukkot, Hanukkah, Passover, Tu B'Av "Israeli Valentine's", back-to-school in Elul/September) — Pinterest's 6–12-week intent lead time fits the chag-planning behavior perfectly.
- **Kosher / cultural fit:** for food/lifestyle, flag **kosher** where relevant and respect modesty norms in fashion/beauty creative for relevant audiences.
- **Privacy expectations:** Israel's Privacy Protection Law + EU-adequacy expectations mean **consent for the Pinterest tag/CAPI** (cookie/consent banner, hashed PII) is expected — wire consent mode and honor opt-outs.

---

## Output (what to produce when this skill activates)

When the user asks for a Pinterest Ads plan, produce a ready-to-launch skeleton:

1. **Campaign skeleton** — objective(s) mapped to funnel (e.g., Catalog/Conversions for purchases + Consideration for discovery), budget type (daily vs lifetime), and a recommended NIS budget that can reach ~50 conv/wk on the chosen event.
2. **Ad group structure** — 2–4 ad groups, each with one clean theme: keyword cluster (20–40 themed keywords + negatives), interests, audience layer (retargeting / customer list / actalike %), placement (Search/Browse), bid strategy (start Automatic), and schedule (Shabbat/chag-aware).
3. **Targeting plan** — prospecting vs retargeting split; actalike seed + reach %; expanded targeting on/off per group.
4. **3 creative variants** — 2:3 (and a 9:16 video/Idea), each with a Hebrew-RTL + English version, a hook, keyword-rich title/description, and a clear CTA/deep-link.
5. **Tracking plan** — Pinterest tag events to fire (PageVisit + key conversion), CAPI/server-side setup, event_id dedup, hashed PII/enhanced match, attribution window, and (for Shopping) the product feed checklist.
6. **Optimization & scaling plan** — learning-phase rules, the daily/weekly checklist, scaling +20–30% cadence, and kill rules, with seasonal front-loading dates tied to the relevant Jewish-calendar peak.

Always confirm tracking is verified (Tag Helper / Events Manager) **before** recommending spend increases.
