---
name: tiktok-ads
description: "Pro TikTok Ads playbook for planning, launching, and scaling TikTok campaigns: account/campaign structure, Spark Ads (boost organic), Smart Performance Campaign (SPC), TikTok Pixel + Events API (server-side), creative-first native UGC, 3-second hooks, custom & lookalike audiences, Creative Center research, bidding/budget strategy, and Israel/Hebrew market notes. Use when building TikTok ad campaigns, ad creative briefs, or measurement plans. Activate for: TikTok Ads, TikTok ads manager, TikTok campaign, Spark Ads, Smart Performance Campaign, SPC, TikTok Pixel, Events API, TikTok creative, UGC ad, hook, TikTok lookalike, TikTok targeting, Creative Center, פרסום בטיקטוק, מודעות טיקטוק, קמפיין טיקטוק, ספארק אדס, פיקסל טיקטוק, יוזרים דומים, קריאייטיב טיקטוק, וידאו פרסומת."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# TikTok Ads — Performance Playbook

A pro operator's guide to planning, launching, measuring, and scaling on **TikTok Ads Manager** (`ads.tiktok.com`). TikTok is a **creative-first auction**: the algorithm finds the buyer if the creative earns attention. Structure and bidding matter, but **creative is ~70% of performance**. Optimize creative volume and the first 3 seconds before you over-engineer the account.

> Adapted independently for SquadCoder. Portable across Claude Code, Codex, and opencode. Verify current limits in TikTok Ads Manager + the TikTok Business Help Center before committing budget — minimums, beta features (SPC, GMV Max), and policy change frequently.

---

## 1. Account & campaign structure

Hierarchy: **Account → Campaign → Ad Group → Ad**. Mirrors Meta (Campaign / Ad Set / Ad).

**Campaign objectives** (set at campaign level — drives optimization + available placements):
- **Reach** — max unique users (CPM buy, awareness).
- **Video Views** — cheap views / 6s-views (top-funnel, build retargeting pools).
- **Traffic** — clicks/landing-page-views to site or app.
- **Community Interaction** — follows + profile visits (grow the organic account).
- **Lead Generation** — Instant Forms (native lead form) or website leads.
- **Website Conversions** — Pixel/Events-API conversion events (the workhorse for e-com/lead-gen).
- **Product Sales (Catalog / Shop)** — Video Shopping Ads, Product Shopping Ads, LIVE Shopping; **GMV Max** auto-optimizes Shop sales.
- **App Promotion** — installs + in-app events (AEO/VBO via MMP — AppsFlyer/Adjust/Singular).

**Account structure rules of thumb:**
- **Consolidate.** TikTok's smart delivery needs **~50 optimization events per ad group per week** to exit Learning. Fewer, bigger ad groups learn faster than many tiny ones.
- **Don't over-segment audiences.** Broad + strong creative usually beats narrow interest stacks. Start broad, let signal do the work.
- **One clear objective per campaign.** Don't mix awareness + conversion intent in one campaign.
- **Naming convention** so reporting is sane, e.g. `[Objective]_[Audience]_[Geo]_[Date]` → `CONV_Broad_IL_2026-06`.
- **Test → Scale split:** a "testing" campaign (many creatives, small budgets) feeding winners into a "scaling" campaign (CBO-style, proven creative).

---

## 2. Targeting & audiences

**Built-in targeting:** Geography, language, gender, age (13–17 / 18–24 / 25–34 / 35–44 / 45–54 / 55+), **Interests** (declared affinity), **Behaviors** (recent video interactions, creator interactions, hashtag engagement — TikTok-native and powerful), device, OS, connection, **spending power**.

**Smart Targeting / Audience auto-expansion** — let TikTok expand beyond your set targeting when it finds converters. **Recommended default** for conversion campaigns; combine with broad age/geo and let creative qualify.

**Custom Audiences** (1st-party):
- **Customer File** — hashed email/phone upload (match-rate varies; great for exclusions + lookalike seeds).
- **Engagement** — people who watched your videos (e.g. 2s/6s/100%/clicked) or engaged your TikTok content/profile.
- **Website Traffic** — Pixel-based (all visitors, viewed-content, add-to-cart, purchasers) with time windows.
- **App Activity** — via MMP.
- **Lead Generation** — opened/submitted your Instant Form.
- **Shop Activity** — TikTok Shop interactions/buyers.

**Lookalike Audiences** — seed from any custom audience; pick **Narrow / Balanced / Broad** reach. Seed quality > seed size: a 1k-purchaser seed beats 100k pageviews. **Best lookalike seeds:** purchasers > add-to-cart > high-value/LTV customer list > engaged viewers.

**Retargeting ladders:** video viewers (3s/6s) → website viewed-content → add-to-cart (no purchase) → cart-abandon 7/14/30d. Use shorter windows for high-intent, looser creative for cold.

**Exclusions:** always exclude existing purchasers from prospecting; exclude recent converters from retargeting. Use Customer File for suppression.

---

## 3. Bidding & budget strategy

**Bid strategies** (choose at ad group level):
- **Lowest Cost / Maximum Delivery** — no bid cap; get the most results for the budget. **Default starting point.** Best for finding the efficient frontier and during Learning.
- **Cost Cap** — target an average CPA; TikTok keeps avg cost near your cap while maximizing volume. Use once you know a viable CPA and need predictable economics. Set the cap **slightly above** your true target so delivery doesn't choke.
- **Bid Cap** — hard max bid per action. Advanced/manual control; risks under-delivery. Use rarely.
- **Value Optimization (VBO) / Highest Value / Target ROAS** — optimize toward conversion *value* (revenue), not just count. Requires value passed in Pixel/Events-API `value` + `currency`. Use for e-com with variable order values once you have stable purchase volume.

**Budget — CBO vs ABO equivalent:**
- **Campaign Budget Optimization (CBO)** — budget at the **campaign** level, TikTok distributes across ad groups to best performers. Use for **scaling** proven setups.
- **Ad-group budget (ABO equivalent)** — budget set per **ad group**. Use for **testing** so each variant gets guaranteed spend and a fair read.

**Pacing & minimums (verify current):** campaign min often ~ daily $50; ad-group daily min commonly ~ $20 (≈ NIS). Use **Standard** (even) pacing for stable CPAs; **Accelerated** only for time-boxed pushes.

**Scaling rules:**
- Scale budget **+20–30% every 2–3 days** on winners — big jumps re-trigger Learning.
- Or **horizontal scale**: duplicate winners into new ad groups / new audiences / fresh creative.
- Keep ad groups out of frequent edits — every meaningful change resets the **~50-events-per-week** Learning Phase.

---

## 4. Smart Performance Campaign (SPC) & GMV Max

**Smart Performance Campaign (SPC)** — TikTok's fully automated, AI-driven campaign type (the Advantage+/PMax equivalent). You provide **creative assets + objective + budget + country**; TikTok automates targeting, bidding, placement, and optimization.
- **Use when:** you have **multiple strong creatives** and want the algorithm to run delivery; great for scaling proven creative and for lean teams.
- **Feed it creative volume** — SPC is creative-hungry; 5–15+ assets perform best.
- **Limited manual levers** — you mostly control budget + creative + target CPA/ROAS. Don't fight it with tiny edits; refresh creative instead.
- **GMV Max** (TikTok Shop) — auto-optimizes for Shop GMV across video/LIVE/product placements; set a target ROAS and feed it creative + catalog.

**When NOT to use SPC:** brand-new pixel with no conversion history, or when you need granular audience/placement control for a test. Start with a standard Website Conversions campaign to seed signal, then graduate winners to SPC.

---

## 5. Creative — the lever that wins (UGC-native, first 3 seconds)

> **"Don't make ads, make TikToks."** Polished, branded TV-style spots underperform native, raw, creator-style content.

**Formats & specs:**
- **In-Feed Video** — **9:16 vertical**, full-screen. Recommended **1080×1920**, ~21–34s sweet spot (supports up to longer). Safe zones: keep text/logos out of the right-side icon rail and bottom caption/CTA area (≈ keep key content within central ~1080×1340).
- **Spark Ads** — boost an **organic TikTok post** (yours or a creator's, with their authorization code) as an ad. Keeps likes/comments/shares/follows on the original post → social proof + you grow the real account. **Highest-trust format; default for UGC and creator whitelisting.**
- **Video Shopping Ads / Product Shopping Ads** — shoppable, pull from catalog (TikTok Shop).
- **Carousel / Image** (where eligible), **Collection**, **Playable** (apps/games), **TopView / Pulse / Branded Mission / Branded Effect** (reservation/brand buys).
- **Interactive add-ons** — Display Card, Gift Code Sticker, Voting Sticker, Countdown — lift CTR.

**Native creative norms:**
- **Hook in the first 3 seconds** — pattern-interrupt, bold on-screen text, motion, or a stated payoff. ~63% of decisive attention is in the opening. Lead with the problem/result, not the brand.
- **Sound-on by design** — trending audio, voiceover, captions/subtitles (most watch with sound but always caption for accessibility + Hebrew RTL legibility).
- **Creator/UGC look** — handheld, talking-head, real settings, authentic delivery. Use Spark Ads + creator whitelisting (TikTok Creator Marketplace / TTCM).
- **Hook variety in testing** — same body, 3–5 different opening hooks; the hook is usually what moves CPA.
- **Clear single CTA** — verbal + on-screen + the ad CTA button.
- **Refresh cadence** — TikTok creative **fatigues fast** (often 1–2 weeks at scale, watch frequency + CTR decay). Always have new creative queued. **Volume of creative beats perfection of one.**

**Research with Creative Center** (`ads.tiktok.com/business/creativecenter`, free, no login): **Top Ads** library (filter by region=Israel/industry/objective, sort by CTR/reach), **Trends** (hashtags, songs, creators), **Keyword Insights**, **TikTok Audio Library**, and the **Symphony** AI tools. Mine it for hooks, trending sounds, and proven structures before each creative sprint.

---

## 6. Conversion tracking & measurement

**TikTok Pixel (browser/base code)** — fires standard events from the website: `ViewContent`, `ClickButton`, `AddToCart`, `InitiateCheckout`, `AddPaymentInfo`, `CompletePayment`/`Purchase`, `CompleteRegistration`, `SubmitForm`, `Search`, `Subscribe`. Install via **TikTok Events Manager**; recommended through **Google Tag Manager** or a partner (Shopify, WooCommerce). Set up **Advanced Matching** (hashed email/phone) for better attribution.

**Events API (server-side)** — send events directly from your server to TikTok. **Strongly recommended alongside the Pixel** — restores signal lost to iOS/ATT, ad blockers, and cookie limits; improves match quality and lowers reported CPA. Implement **event deduplication** (`event_id` shared between Pixel + server) so a conversion isn't double-counted. Pass `value` + `currency` (ILS) for ROAS/VBO. Use TikTok's **Events API for Web** or a partner connector.

**Setup checklist:**
- One Pixel per website/property; map your **key event** (the conversion you optimize for).
- Verify with **TikTok Pixel Helper** (Chrome extension) + Events Manager test/diagnostics.
- Mobile apps → connect an **MMP** (AppsFlyer/Adjust/Singular) for SKAdNetwork/installs/in-app events.
- **Attribution window** — set click/view windows in Events Manager (e.g. 7-day click / 1-day view is a common default; align with your reporting).
- Configure **Web Events / event priority** ranking for ATT-limited iOS users.

---

## 7. Optimization workflow (cadence)

**Golden rule: do NOT touch ad groups in Learning Phase.** Give each new ad group **3–5 days and ~50 conversions** before judging. Edits restart Learning.

**Daily (5 min):**
- Spend pacing on track? Any ad group not delivering (bid/cap too tight, audience too small)?
- Catastrophic outliers only — pause anything with high spend + zero results past a clear threshold (e.g. ≥ 2–3× target CPA with no conversion).
- Check policy/disapprovals.

**Every 2–3 days:**
- Rank ad groups & ads by **CPA / ROAS**. Kill clear losers, scale clear winners **+20–30%**.
- Watch **CTR, CVR, CPM, frequency** trends, not single days.
- Hook-level read: which opening 3s drove the lowest CPA?

**Weekly:**
- **Creative refresh** — launch 3–5 new concepts/hooks; retire fatigued creative (CTR decay, frequency climb).
- Audience review — promote winning lookalike/interest sets; expand seeds.
- Move proven creative/audiences from Test campaign → Scale (CBO/SPC).
- Reconcile TikTok-reported conversions vs. ground truth (GA4 / backend / MMP); trust blended last.

**Scaling sequence:** prove CPA on Lowest Cost → switch to **Cost Cap** for predictability → vertical scale (+20–30% steps) **and** horizontal scale (duplicate winners, new audiences, fresh hooks) → graduate to **SPC / CBO**.

**Kill rules (example, tune to your CPA):** pause an **ad** at ≥ 2× target CPA with statistically meaningful spend and 0–1 conversions; pause an **ad group** if CPA stays > target after exiting Learning with a fair sample; pause a **creative** when CTR drops > ~30% from its peak and frequency > ~2.

---

## 8. Common mistakes / pitfalls

- **Judging too early / editing in Learning** — kills delivery and wastes the sample. Wait for ~50 events.
- **Too few, too narrow ad groups** — never accumulate enough events to optimize. Consolidate.
- **Reusing Meta/YouTube creative** — 16:9, polished, logo-first spots flop. Make native vertical TikToks.
- **Weak hook** — no payoff in 3s = scroll. Most failures are hook failures, not targeting failures.
- **No creative pipeline** — one "great" ad fatigues in days; you need a queue.
- **Pixel only, no Events API** — under-reported conversions → algorithm starves and you scale blind.
- **No event dedup** — Pixel + server double-counting inflates results.
- **Over-restricting with bid/cost caps too low** — chokes delivery; start Lowest Cost.
- **Ignoring comments** — TikTok is social; engage/moderate, and seed FAQ answers (huge trust signal, free).
- **Sound off / no captions** — loses the medium's core and Hebrew accessibility.

---

## 9. Israel / Hebrew market notes

- **Language & RTL creative:** write Hebrew copy and on-screen text **right-to-left**; keep Hebrew captions out of the right-side UI rail and bottom CTA strip. Test that Hebrew renders correctly (no mirrored Latin/numerals; numbers/prices stay LTR within RTL text). Hebrew + a clear hook in the first 3s.
- **Currency & budgets:** budget in **NIS (₪/ILS)**; set Pixel/Events-API `currency: "ILS"` so ROAS/VBO is correct. Watch minimums in shekels.
- **Targeting Israel:** geo = Israel; language Hebrew **and** consider Russian/Arabic/English segments for relevant audiences. Spending-power + behavior signals work well locally.
- **Timing — Shabbat & holidays:** Israeli consumer activity dips Friday afternoon → Saturday evening for many audiences; e-commerce delivery/CS is paused. Use **dayparting / scheduling** to favor Sun–Thu and Saturday night; plan launches and big spend around **chagim** (Rosh Hashanah, Sukkot, Pesach, Yom Ha'atzmaut) and local sale moments. Consider kosher/Shabbat-observant nuance in messaging where relevant.
- **Creators & trends:** use Creative Center filtered to **Israel** for local Top Ads, trending Hebrew hashtags/sounds, and local creators; Israeli TikTok humor/trends differ from US — localize, don't translate.
- **Privacy:** comply with Israeli Privacy Protection Law expectations + give clear consent for Pixel/Events-API tracking; honor opt-outs and hash PII before Customer File uploads.

---

## Output (when this skill activates)

Produce a ready-to-launch TikTok plan:
1. **Campaign skeleton** — objective + structure (Test vs Scale), CBO/ABO choice, bid strategy, daily budget in **NIS**, and Learning-Phase expectations.
2. **Targeting plan** — geo/language/age, broad-vs-interest call, 2–3 custom audiences + 1–2 lookalike seeds, and exclusions.
3. **3 creative variants** — native vertical UGC concepts, each with a distinct **first-3-second hook**, on-screen text, suggested trending sound, CTA, and Spark Ads vs standard recommendation (Hebrew + RTL where the audience is Israeli).
4. **Measurement plan** — Pixel + **Events API** events, the optimized key event, dedup via `event_id`, `value`/`currency: ILS`, attribution window, and verification steps.
5. **Optimization & scaling rules** — what to check on what cadence, kill thresholds, and the scale ladder (Lowest Cost → Cost Cap → SPC/GMV Max).

Flag anything that needs the user's real numbers (target CPA/ROAS, AOV, budget) or live account/policy checks rather than guessing.
