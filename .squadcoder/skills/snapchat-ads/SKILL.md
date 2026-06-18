---
name: snapchat-ads
description: "Expert playbook for planning, launching, and scaling Snapchat Ads — campaign objectives, ad groups, Snap Pixel + CAPI conversion tracking, Audience Match / Lookalikes, AR Lenses & Filters, vertical full-screen video creative, and bid/budget strategy. Use when building or optimizing Snapchat advertising, Gen-Z reach campaigns, or Snap creative. Activate for: snapchat ads, snap ads manager, snapchat campaign, snap pixel, snapchat CAPI, AR lens ad, snap lens, sponsored filter, vertical video ad, gen z advertising, lookalike audience snapchat, target cost bidding, swipe up, פרסום בסנאפצ'אט, מודעות סנאפצ'אט, קמפיין סנאפ, סנאפ פיקסל, עדשת AR, פרסום לדור Z, וידאו אנכי, מודעת סנאפצ'אט."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Snapchat Ads — Pro Playbook

A practical, current playbook for running performance and brand campaigns in **Snapchat Ads Manager**. Snapchat is a vertical, full-screen, sound-on, camera-native platform skewing **Gen Z and younger Millennials** (~13–34 is the core, with a huge 18–24 base). Creative is consumed in fast, swipe-driven bursts — the platform rewards native, authentic, fast-hook content over polished "TV" ads.

Use this when the user asks to plan, build, audit, or scale Snapchat advertising, write Snap creative, set up Snap Pixel / Conversions API, build audiences, or design AR Lens/Filter campaigns.

---

## 1. Account & Campaign Structure

Hierarchy: **Ad Account → Campaign → Ad Squad (ad set) → Ad**. (Snap calls the ad-set level an **"Ad Squad."**)

**Objective is chosen at the campaign level.** Pick by funnel stage:

- **Awareness & Engagement**
  - *Awareness* — maximize reach/impressions; brand lift.
  - *Promote Places* — drive local foot traffic.
- **Traffic** — clicks/swipe-ups to a site or app.
- **Engagement** — video views, lens/filter engagement, story opens.
- **Leads** — on-Snap **Lead Generation** (instant forms) or off-platform lead conversions.
- **App Promotion** — installs and in-app events (via MMP/SDK: AppsFlyer, Adjust, Singular, Branch, Kochava).
- **Sales / Conversions** — website purchases & funnel events via **Snap Pixel**; or **Catalog Sales** (Dynamic Ads) from a product feed.

**Structure principles**
- **One objective per campaign.** Don't mix prospecting and retargeting in the same campaign.
- **Ad Squad = one audience + placement + optimization goal + bid.** Keep squads tightly themed so the algorithm learns cleanly.
- **Don't over-fragment.** Too many tiny squads splits the data and starves the learning phase. Consolidate audiences where overlap is high; use **broad** targeting and let Snap's optimization find buyers.
- **Catalog / Dynamic Ads** for ecommerce with many SKUs — retarget viewers and prospect with product feeds instead of hand-built static ads.

---

## 2. Targeting & Audiences

Set targeting at the **Ad Squad** level.

**Demographics & context**
- Age, gender, languages, locations (country/region/city/radius around a pin), device (iOS/Android, OS version, connection type, carrier).
- **Predefined audiences:** *Lifestyle Categories* (interests Snap infers from behavior), *Shopping/Visitor* segments, and *Snap Lifestyle Categories* (SLCs).

**First-party — Snap Audience Match (Customer List)**
- Upload hashed emails, phone numbers, or mobile ad IDs (MAIDs) to build a **Customer List** audience. Use for retention, exclusions, and as a **Lookalike** seed.

**Engagement & pixel audiences**
- **Snap Pixel Custom Audiences:** site visitors, viewers of specific pages, add-to-cart, purchasers (with lookback windows).
- **Engagement audiences:** people who watched your video, opened your Story, swiped, or engaged with a **Lens/Filter**.
- **App activity audiences:** installers, event-takers (via the MMP).

**Lookalikes (Snap's "similar audiences")**
- Build from any seed (Customer List, pixel, engagement). Choose a balance:
  - **Similarity** — tightest match, smallest reach (best for high-intent retention/value seeds).
  - **Balance** — default trade-off.
  - **Reach** — widest, lowest similarity (best for scaling once smaller LALs work).
- Seed quality > seed size. A 1k–5k high-value purchaser seed beats a 100k "all visitors" seed.

**Retargeting & exclusions**
- Standard funnel: video-viewers / lens-engagers → site visitors / ATC → cart abandoners → exclude recent purchasers.
- **Always exclude converters** from prospecting squads to avoid paying to re-acquire existing customers.

> **Tip:** Snap audiences skew younger, so don't import a desktop-era "35–55 affluent" persona wholesale. Validate against actual Snap age curves.

---

## 3. Bidding & Budget Strategy

**Budget level**
- **Campaign budget (CBO-equivalent):** Snap's *Campaign Budget* / **lifetime spend cap** distributes spend across ad squads automatically — use when you want Snap to allocate to the best squad.
- **Ad Squad budget (ABO-equivalent):** daily or lifetime budget per squad — use when you want guaranteed spend on specific audiences/tests.

**Bid strategies (choose per ad squad's optimization goal)**
- **Auto-Bid** — Snap sets the bid to spend the budget and get the most results. **Start here** for new squads / cold accounts; it gathers data fastest. (No CPA guarantee.)
- **Target Cost (tCPA)** — set the average cost-per-action you'll accept; Snap keeps CPA near that target. **Switch to this once you have ~50 conversions** and know your profitable CPA ceiling. Best for stable, efficient scaling.
- **Max Bid (bid cap)** — hard ceiling on what you'll pay per action. Use for strict efficiency control / protecting margins; can limit delivery if set too low.
- **Target Cost per Mille (tCPM)** — newer, for **impression/awareness** objectives; keeps CPM near a target. Use for reach campaigns where you care about cost-per-1000, not per-action.

**Smart Campaign Solutions** (Snap's automation suite): **Smart Bidding** (target-CPA automation), **Smart Budget** (auto-reallocation across squads), and **Smart Ads** (automated creative optimization). Good defaults for advertisers who want hands-off pacing.

**Optimization goal (the event the algorithm chases)** — set to the deepest event you reliably get **~50 conversions/week** on. If purchases are too sparse, optimize for a mid-funnel proxy (ATC, lead, install) until volume supports purchase optimization.

**Attribution window:** Snap's default is **28-day swipe / 1-day view (28/1)**. Tighter windows (7/0, 1/1) report more conservatively. Keep windows **consistent** when comparing across periods, and reconcile against your own analytics/MMP — don't read Snap-reported conversions in isolation.

**Pacing:** keep **daily budget ≥ ~20× your target CPA** so the squad can exit the learning phase. Avoid edits that reset learning (budget jumps >20%, changing the optimization goal/bid) while a squad is still learning.

---

## 4. Creative Specs & Best Practices

Snapchat is **vertical, full-screen, sound-on, and fast**. Design for a thumb that's already moving.

**Core formats**
- **Single Image / Single Video (Snap Ad):** the workhorse — full-screen **9:16** video, **3–5s sweet spot, up to 180s** (but front-load everything). Add an attachment (website/app/AR/long-form video) for the swipe-up.
- **Collection Ad:** hero video/image + a row of 4 tappable product tiles — strong for ecommerce.
- **Story Ad:** a branded tile in Discover that opens a 3–20 Snap sequence.
- **Dynamic / Catalog Ads:** auto-generated from a product feed for retargeting and prospecting.
- **Commercials:** non-skippable (up to 6s) premium video in curated content — reach/awareness.
- **AR experiences:** **Sponsored AR Lenses** (face/world AR the user plays with) and **Sponsored Filters** (geo/national overlays). Lenses drive deep engagement and average ~20s+ of play; great for brand and product try-on (makeup, eyewear, footwear, packaged goods).

**Specs (verify current specs in Snap's Creative spec sheet before final delivery)**
- Aspect ratio **9:16**, resolution **1080×1920**, full-bleed.
- Keep critical content/logos in the **safe zone** (avoid top ~150px and bottom ~340px where UI sits).
- File: **.mp4/.mov** video, **.jpg/.png** image; keep under format size limits.
- Brand name ≤ 25 chars, headline ≤ 34 chars.

**Creative norms that win on Snap**
- **Hook in <2 seconds.** State the product/offer or a pattern-break immediately.
- **Sound-on by design** — most Snap content is watched with audio; use music/VO, but stay legible with captions.
- **Native, not produced.** UGC, selfie-style, creator-led, phone-shot content outperforms glossy brand films. Make it look like a Snap, not a TV spot.
- **Show the product fast**, repeat the brand early, and end with a clear CTA ("Swipe up," "Shop now," "Get offer").
- **Vertical motion & fast cuts** hold attention; static or letterboxed (black bars) creative kills performance.
- **Test 3–5 creatives per squad**; refresh every **1–2 weeks** to fight creative fatigue (Snap audiences burn through creative fast).
- **AR Lens:** make the interaction the value — try-on, transform, game. Pair with a clear unlock CTA.

---

## 5. Conversion Tracking & Measurement

**Snap Pixel (web)**
- One pixel per domain; fire **standard events**: `PAGE_VIEW`, `VIEW_CONTENT`, `ADD_CART`, `START_CHECKOUT`, `ADD_BILLING`, `PURCHASE` (with `price`, `currency`, `item_ids`, `transaction_id`), plus `SIGN_UP`, `SEARCH`, `SUBSCRIBE`, `AD_CLICK`/`AD_VIEW` as relevant.
- Install via Snap's pixel snippet, **GTM** template, or a platform app (Shopify, WooCommerce, etc.). Pass `transaction_id` for **deduplication** with CAPI.

**Conversions API (CAPI) — server-side**
- Send events **server-to-server** to recover signal lost to iOS ATT, ad blockers, and ITP. **Run Pixel + CAPI together** and deduplicate on a shared `event_id`/`transaction_id`.
- Pass hashed match keys (email, phone, IP, user agent, click ID `sc_click_id`/`ScCid`) to improve match rates. Higher match quality → better optimization and reporting.

**App (MMP / SDK)**
- Use **AppsFlyer, Adjust, Singular, Branch, or Kochava** for installs and in-app events; map post-install events to Snap optimization goals. For iOS, configure **SKAdNetwork** and Snap's SKAN value mapping.

**Measurement & lift**
- For brand: **Snap Brand Lift / Foot Traffic Insight** and **Conversion Lift** studies (incrementality), not just last-click.
- Reconcile Snap-reported numbers against your analytics/MMP; expect over-reporting vs. a strict last-click model. Use **MMM or geo-lift** for incrementality at scale.

---

## 6. Optimization Workflow (cadence-based)

**Daily**
1. Check **spend & pacing** — is each squad spending? Under-delivery usually means bid too low, audience too narrow, or creative disapproved.
2. Scan **CPA / ROAS / CPM** vs. target. Don't react to a single day — look at the trailing 3–7 days.
3. Confirm **no creative/policy rejections** and the pixel/CAPI is still firing.

**Every 2–3 days**
4. **Don't touch a squad still in learning** (until ~50 optimization events). Premature edits reset learning.
5. Once out of learning, **scale winners**: raise budget **~20% at a time** (bigger jumps reset learning), or **duplicate** the winning squad to scale via volume.
6. **Kill rules:** pause a creative once it has spent **~1.5–2× your target CPA with zero conversions**, or its CTR/swipe-up rate falls well below the squad average. Pause squads that can't hit CPA after a fair test window.

**Weekly**
7. **Creative refresh** — introduce 2–3 new variants; retire fatigued ones (rising CPM/frequency, falling swipe rate). Snap creative fatigues fast.
8. **Audience review** — check overlap, frequency, and saturation; expand Lookalikes (Balance → Reach) once tight ones are profitable; refresh exclusions (remove recent purchasers).
9. **Bid migration** — move proven Auto-Bid squads to **Target Cost** once CPA is known and stable.
10. **Funnel check** — pixel match quality, event volume, attribution-window consistency, CAPI dedup health.

**Scaling rules of thumb**
- Scale **budget on the winner** before adding new squads; widen audience (Reach LAL, broader age) before raising bids.
- When CPA creeps up as you scale, the bottleneck is usually **creative**, not bid — ship new hooks.

---

## 7. Common Mistakes & Pitfalls

- **Repurposing horizontal/landscape video** with black bars — instant performance killer. Always native **9:16**.
- **Treating Snap like Meta** — older personas, slow intros, and over-produced ads underperform; Snap rewards fast, UGC-style, sound-on creative.
- **Over-segmenting audiences** into many tiny squads — starves learning. Consolidate; go broad and let optimization work.
- **Optimizing for a too-deep event with too little volume** — if purchases are sparse, optimize a mid-funnel proxy first.
- **No CAPI** — relying on browser pixel alone loses a large share of signal post-ATT; always deploy server-side too.
- **Editing squads mid-learning** (budget/bid/goal changes) — resets the learning phase and wastes spend.
- **Letting creative fatigue** — flat or rising CPM/frequency with falling swipe rate means refresh now.
- **Ignoring frequency caps** for awareness — over-serving the same Snapchatters burns budget and brand goodwill.
- **Forgetting to exclude existing customers** from prospecting.
- **Setting Max Bid too low** — strangles delivery; if a squad won't spend, loosen the cap or use Auto-Bid.

---

## 8. Israel / Hebrew Market Notes

- **Language & RTL creative:** Hebrew captions/overlays must be **right-to-left**; verify text isn't clipped, mirrored, or pushed into Snap's UI safe zones. Keep CTAs short ("החלק למעלה", "קנו עכשיו", "קבלו הטבה"). Mixed Hebrew + English/Latin brand names need careful bidi handling so digits and brand tokens don't reverse.
- **Localized, sound-on VO** in Hebrew beats subtitled English for Israeli Gen Z; keep slang current and natural, not "translated."
- **Budgets in NIS (₪):** plan and report in shekels; account for ~17% VAT on media when modeling true CAC. Set your **Target Cost in ₪** with the same care as USD — don't paste in foreign benchmarks blindly.
- **Local timing — Shabbat & holidays:** engagement and conversions shift around **Friday afternoon → Saturday night (Shabbat)** and Jewish holidays (Rosh Hashanah, Yom Kippur, Sukkot, Passover, etc.). Use **dayparting / scheduling** so spend doesn't waste during low-intent windows, and lean into pre-Shabbat shopping and motzei-Shabbat (Saturday-night) surges. For **kosher/observant** audiences, align creative timing and messaging accordingly.
- **Consumer behavior:** Israel is highly mobile-first with fast adoption among teens/young adults — Snap reach is strong, but cross-check against WhatsApp/Instagram/TikTok competition for the same eyeballs. Local commerce expects **fast delivery and Bit/credit payment norms**; reflect that in the offer.
- **Privacy expectations:** Israeli users are increasingly privacy-aware (and the **Privacy Protection Law** applies); be clean on consent for Pixel/CAPI, honor ATT, and avoid over-aggressive retargeting that feels invasive.
- **Geo & dialect:** target by city/region (Tel Aviv, Jerusalem, Haifa, Be'er Sheva) where relevant; remember Hebrew keyword/spelling variants (with/without niqqud, ktiv male) when naming and tagging.

---

## Output

When this skill activates, produce a ready-to-launch plan, not vague advice:

1. **Campaign skeleton** — recommended objective, campaign→ad-squad structure, budget level (Campaign vs. Ad Squad) with a starting daily budget (in ₪ if Israel), bid strategy (Auto-Bid → Target Cost path), optimization goal, and attribution window.
2. **Targeting plan** — 2–4 ad squads with concrete audiences (1st-party Customer List, Pixel/engagement custom audiences, Lookalike tier), demographics, geo, and exclusions.
3. **3 creative variants** — for each: format (Single Video / Collection / AR Lens), a **<2s hook line**, on-screen text, sound/VO direction, and CTA — all **9:16, sound-on, native**, Hebrew + RTL where targeting Israel.
4. **Tracking plan** — Snap Pixel events to fire (with parameters), CAPI/server-side setup and dedup key, MMP for app, and which lift/measurement study to run.
5. **Optimization & scaling rules** — the kill rules, the learning-phase guardrails, the ~20% budget-step scaling, and the creative-refresh cadence to follow after launch.

Always flag when an assumption (CPA target, AOV, audience size, budget) is missing and ask for it before committing numbers.
