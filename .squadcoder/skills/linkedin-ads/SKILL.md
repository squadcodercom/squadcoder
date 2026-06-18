---
name: linkedin-ads
description: "Expert B2B playbook for LinkedIn Ads (Campaign Manager): account/campaign structure, objectives, Sponsored Content / Message / Conversation / Lead Gen Forms / Document & Thought-Leader ads, Matched Audiences + ABM company lists, demographic targeting (job title/function/seniority/skills/company), Insight Tag + CAPI conversion tracking, bidding (Maximum Delivery / Cost Cap / Manual), budget pacing, and a high-CPM optimization workflow. Use for B2B lead gen, demand gen, ABM, SaaS, enterprise, recruiting, and event campaigns. Activate for: LinkedIn Ads, LinkedIn Campaign Manager, Sponsored Content, Lead Gen Forms, Matched Audiences, ABM, B2B ads, Insight Tag, cost cap bidding, CPL, לינקדאין, פרסום בלינקדאין, קמפיין B2B, לידים, פרסום ממומן, מודעות לינקדאין, פרסום לעסקים."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# LinkedIn Ads — B2B Playbook

LinkedIn is the highest-intent B2B channel and also the most expensive: CPMs commonly run ₪80–₪300+ and CPCs ₪18–₪60+, with CPLs of ₪150–₪700 normal for mid-market and far higher for enterprise. The strategy is **not** to fight the high cost — it is to make every expensive impression land on the *exact* decision-maker with a message that converts. Precision targeting + strong offers + tight measurement beats broad reach every time.

When this skill is active, think like a B2B performance marketer who lives in **Campaign Manager**, not a social-media generalist.

---

## 1. Account & campaign structure

LinkedIn's hierarchy: **Ad Account → Campaign Group → Campaign → Ad**. Budgets and most settings live at the **campaign** level; the Campaign Group is an organizational/scheduling/budget-ceiling wrapper (you can set a group-level total budget + run dates).

**Recommended structure** — organize Campaign Groups by **funnel stage** so you can read the funnel at a glance:
- `TOFU – Awareness/Engagement` (thought leadership, video, brand)
- `MOFU – Lead Gen / Demand Gen` (gated content, webinars, Lead Gen Forms)
- `BOFU – Conversion / ABM` (demo, trial, pricing, retargeting, named accounts)

Inside each group, split **campaigns by a single variable** so optimization stays clean: one audience *or* one objective *or* one creative theme per campaign. Never mix "Marketing" + "Engineering" + "Finance" personas in one campaign — they need different copy and will skew delivery to the cheapest segment.

**Objectives** (chosen per campaign, they unlock different ad formats & optimization goals):
- **Awareness** → Brand Awareness (impressions).
- **Consideration** → Website Visits, Engagement, Video Views.
- **Conversions** → **Lead Generation** (in-platform Lead Gen Forms), Website Conversions, Job Applicants.
For B2B lead gen, **Lead Generation** and **Website Conversions** are the workhorses. Use **Website Visits** only for warming/retargeting fuel, not as the primary KPI.

**Audience size rule of thumb:** keep most campaigns in the **50,000–400,000** range. Below ~20k–50k LinkedIn warns "audience too narrow" and delivery starves; multi-million audiences burn budget on the wrong people. For tight ABM lists, expect small audiences — pair them with manual/cost-cap bidding.

---

## 2. Targeting & audiences

LinkedIn's edge is **self-reported professional data**. Build the audience from **attributes** and layer **Matched Audiences**.

**Core demographic attributes** (combine with AND/OR + Exclusions):
- **Company:** Company Name, Industry, Company Size, Company Growth Rate, Company Category (e.g. Fortune lists), Connections.
- **Job:** **Job Title**, **Job Function**, **Seniority** (Entry → Owner/Partner/CXO), Years of Experience.
- **Skills**, Member Groups, Member Interests, Member Traits (e.g. open to education).
- **Education:** Degrees, Fields of Study, Schools.
- **Demographics/Geo:** Location (permanent vs recently-in), Age/Gender (inferred — use sparingly).

**Targeting best practices:**
- **Prefer Job Function + Seniority over Job Title.** Titles are inconsistent and miss synonyms; Function+Seniority (e.g. *Function = Engineering/IT* AND *Seniority = Director, VP, CXO*) captures the buying committee more completely. Use Job Title only for very specific roles.
- **Always use Exclusions** to clean delivery: exclude irrelevant seniorities (Entry/Intern), competitors (by Company Name), current customers, and unwanted functions.
- **Turn OFF "Audience Expansion"** and **review the "LinkedIn Audience Network" (LAN)** toggle. LAN extends ads to 3rd-party apps cheaply but with much lower quality — start OFF for lead gen, test separately if you need scale.

**Matched Audiences (1st-party + retargeting + ABM):**
- **Contact list upload** — email lists (customers, MQLs, event registrants) for targeting or suppression. Higher match rate with work emails.
- **Company list upload (ABM)** — upload up to ~300k account names/domains. This is the backbone of **Account-Based Marketing**; target named accounts and layer persona attributes on top.
- **Website retargeting** (via Insight Tag) — visitors of specific URLs/segments.
- **Engagement retargeting** — people who engaged with: a Single Image/Video ad, your **Lead Gen Form** (opened/submitted), Company Page, or **Event**. This is gold for cheap MOFU/BOFU pools.
- **Lookalike audiences** — LinkedIn can expand a source list/segment into a similar audience (note: classic Lookalikes were sunset in some markets; **Predictive Audiences**, built from a conversion/Lead Gen source list via AI, is the current expansion tool — use it for prospecting at scale).

**Always build retargeting + suppression first.** Day one: install the Insight Tag, create website + engagement segments, and upload a customer-suppression list so you never pay to re-acquire existing clients.

---

## 3. Bidding & budget strategy

LinkedIn bid strategies (per campaign):
- **Maximum Delivery (automated)** — LinkedIn spends the full budget for the most results; no bid control. Best when you want volume and have a healthy budget and audience. Can overpay early.
- **Cost Cap** — set a target cost per result (per lead/click/conversion); LinkedIn keeps the *average* near your cap while maximizing volume. **Default recommendation for lead gen** — gives control without manual babysitting.
- **Manual Bidding** — you set the bid per click/impression. Use for **tight ABM/small audiences** where you must win the auction for a finite pool, or to deliberately pace spend. Watch for "your bid is below the range" warnings.

**Budgeting:**
- Minimum **daily budget ~₪40+ per campaign** (LinkedIn enforces a floor; plan higher). For meaningful learning, give a campaign at least **~10× your target CPL per day**.
- **Pacing/learning:** new campaigns spend faster and noisier for the first **~3–5 days / ~15–20 conversions** — do NOT judge or kill in the first 48h. Avoid edits during learning (each major edit can re-trigger it).
- **CBO equivalent:** LinkedIn budgets at the **campaign** level (closest to ABO). The **Campaign Group total budget** acts as a spend ceiling across child campaigns — use it to cap a test or a quarter.
- Start a new account/audience on **Maximum Delivery** to gather data, then graduate winners to **Cost Cap** with a target derived from real CPL.

---

## 4. Ad formats, creative specs & best practices

| Format | Where it shows | Use for |
|---|---|---|
| **Single Image (Sponsored Content)** | Feed | Workhorse; gated content, demos, offers |
| **Video Ads** | Feed | Awareness, explainer, social proof |
| **Carousel** | Feed | Multi-point value, mini case studies |
| **Document Ads** | Feed | **Gated PDFs/decks** — high-intent lead gen, pairs with Lead Gen Form |
| **Thought Leader Ads** | Feed | Boost a *person's* post (founder/exec) — highest trust/engagement |
| **Conversation / Message Ads** | Inbox | Direct, event invites, demo offers (use sparingly — fatigues fast) |
| **Text & Spotlight (Dynamic) Ads** | Right rail / desktop | Cheap reach, personalized retargeting |
| **Event Ads** | Feed | Webinar/event registrations |

**Creative specs (current):**
- **Single image:** 1200×627 (1.91:1 landscape) or **1200×1200 (1:1)** — square wins more feed real estate on mobile. JPG/PNG, < 5MB.
- **Intro text:** keep the hook in the first **~150 characters** (truncates with "…see more"). Headline ~70 chars, ~200 to be safe.
- **Video:** 1:1 or 4:5 vertical, **≤ 15–30s** for paid, captions baked in (most watch muted), MP4.
- **Document Ads:** PDF up to 300 pages / 100MB; first page is the hook/cover.

**Copy best practices:**
- Lead with the **buyer's pain or a quantified outcome**, not your product name. "Cut SOC-2 prep from 6 months to 6 weeks" beats "Introducing Acme Compliance Suite."
- One clear CTA. Match the CTA button to the offer (Download / Register / Request Demo).
- Use **social proof** (logos, "trusted by X teams", a stat) — B2B buyers are risk-averse.
- Run **3–5 creative variants per campaign**; refresh every **2–4 weeks** — LinkedIn creative fatigues fast (frequency climbs because audiences are small).
- **Lead Gen Forms:** keep fields ≤ 3–5; rely on LinkedIn's pre-fill from profile (huge conversion lift vs landing pages). Always add a custom checkbox/consent + a thank-you with a real next step. Sync leads to the CRM (native CRM/Zapier/CSV) — leads expire in Campaign Manager after 90 days.

---

## 5. Conversion tracking & measurement

- **Insight Tag** — LinkedIn's base pixel. Install site-wide (tag manager or hard-coded) once. Powers website retargeting, demographics reporting, and conversion tracking. Verify it fires (LinkedIn Insight Tag Helper / "Active" status in Campaign Manager).
- **Conversions API (CAPI)** — **server-side** conversions to recover signal lost to cookie/ITP/consent blocking and to send offline conversions (e.g. an SQL/closed-won from the CRM). Strongly recommended alongside the Insight Tag — match quality improves attribution and Cost Cap bidding.
- **Conversion definitions** — create events (Lead, Sign-up, Demo Request, Purchase, Download) with value + attribution window. Mark which is the **primary** optimization conversion per campaign; LinkedIn optimizes to it.
- **Lead Gen Form leads** are tracked natively (no pixel needed) — but still push them to the CRM to measure pipeline/revenue, not just lead count.
- **Attribution:** LinkedIn defaults to view-through + click windows (e.g. 30-day click / 7-day view, configurable). B2B journeys are long and multi-touch — don't expect last-click parity with Google. Validate with CRM-side source tracking + UTMs on every URL.
- **North-star metrics:** optimize to **CPL → cost per MQL/SQL → pipeline → CAC**, not CTR. A higher CTR that produces junk leads is a loss.

---

## 6. Optimization workflow (cadence & rules)

**Daily (first 5 days = learning — observe, don't tinker):**
- Confirm delivery (spend pacing, impressions). Fix anything *blocked* (disapproved ad, payment, audience too narrow).

**Every 2–3 days, once out of learning:**
1. **Demographics report** — the most important LinkedIn lever. Break delivery down by **Company, Job Title, Seniority, Function, Industry**. Find where budget goes vs where conversions come from. **Exclude** companies/titles spending money with zero conversions; consider splitting out winners into their own campaign.
2. **Frequency** — if > ~5–6 and CTR is dropping, rotate creative.
3. **Creative** — pause variants below account-average CTR after enough impressions (~a few thousand); double down on winners.
4. **CPL vs target** — if Cost Cap is starving delivery, raise the cap ~10–15%; if overspending on weak leads, lower it.

**Weekly:**
- Pause campaigns/ads that are clearly losing (kill rule below). Reallocate budget to winners.
- Check lead **quality** with sales/CRM, not just volume — adjust targeting upstream.

**Scaling rules:**
- Scale **budget +20–30% every 3–4 days** on a winner — bigger jumps reset learning and spike CPL.
- Scale **horizontally** (new audiences/lookalikes/geos in new campaigns) more than vertically — small LinkedIn audiences saturate (frequency rises) before vertical budget scaling pays off.

**Kill rules (after the learning phase + enough data):**
- Spend ≥ ~2–3× target CPL with **0 conversions** → pause/restructure.
- CPL > 2× target with no improving trend over a week → pause.
- Frequency high + CTR collapsing + no fresh creative → pause and rebuild creative.

---

## 7. Common mistakes / pitfalls

- **Targeting too broad or too narrow** — mixing personas, or going under ~20k–50k so delivery starves.
- **Leaving Audience Expansion / LinkedIn Audience Network ON** for lead gen by default — silently degrades quality.
- **Targeting by Job Title only** — misses the buying committee; use Function + Seniority.
- **No Insight Tag / no CAPI / no CRM sync** — you can't optimize what you can't measure; lead *count* ≠ pipeline.
- **Judging/editing during the learning phase** — resets optimization and spikes cost.
- **Sending traffic cold to a long landing page** — Lead Gen Forms convert far better; reserve landing pages for high-intent/BOFU.
- **Set-and-forget creative** — frequency fatigue is brutal on small B2B audiences.
- **No suppression of existing customers/competitors** — paying premium CPMs to reach the wrong list.
- **Optimizing to CTR/CPC instead of CPL/pipeline.**

---

## 8. Israel / Hebrew market notes (B2B)

- **Audience size:** Israel is a small market — many attribute combinations drop below the 50k floor fast. **Widen geo (DACH/EU/US for export-focused SaaS), broaden Function+Seniority, or run ABM company lists** instead of narrow attribute stacks. Most Israeli B2B/SaaS targets buyers **abroad** — target by buyer geography, not by where the company is HQ'd.
- **Language of the ad vs audience:** if targeting Israeli professionals, **Hebrew creative** often lifts engagement, but many Israeli professionals also operate in English on LinkedIn; **test Hebrew vs English**. For international targeting, write in the buyer's language (usually English). Note Campaign Manager's "Profile Language" targeting is coarse — don't over-rely on it.
- **RTL creative:** design Hebrew ad images **right-to-left** — logo/CTA placement, reading order, and text alignment must be RTL. Mixed Hebrew+Latin (brand names, product names, URLs) needs careful bidi handling so digits/Latin don't flip. Keep the hook in the first ~150 chars *in Hebrew word order*.
- **Budgets/currency:** Campaign Manager bills in the account currency — Israeli accounts typically **USD or ILS**; plan CPLs in **NIS (₪)** internally and account for VAT and FX when reporting CAC. The daily-budget floor applies in account currency.
- **Timing / Shabbat & holidays:** B2B engagement on LinkedIn in Israel concentrates **Sun–Thu** (the Israeli work week). Expect a drop **Friday afternoon → Saturday (Shabbat)**; consider **dayparting via scheduling** to avoid wasting weekend spend, and avoid launching tests right before Jewish holidays (Rosh Hashanah, Yom Kippur, Sukkot, Passover) when B2B activity dips. Sunday is a workday — don't pause it.
- **Privacy/consent:** Israel's Privacy Protection Law and growing GDPR-style expectations mean clear consent on Lead Gen Forms (Hebrew consent text) and a real privacy-policy link; honor opt-outs and keep suppression lists clean.

---

## Output

When this skill activates, produce a **ready-to-launch LinkedIn Ads plan**:
1. **Campaign skeleton** — Campaign Group(s) by funnel stage → campaigns with chosen **objective**, **optimization goal**, **bid strategy** (Cost Cap target / Max Delivery / Manual), and **daily/total budget in ₪**.
2. **Targeting spec per campaign** — attribute stack (Function + Seniority + Company/Industry filters), **Matched/ABM/retargeting** audiences, explicit **exclusions**, estimated audience size, and Audience Expansion/LAN set OFF unless justified.
3. **3 creative variants** — format (Single Image / Document / Thought Leader / Video), intro hook (first 150 chars), headline, CTA, and Lead Gen Form fields — with Hebrew/RTL versions when the audience is Israeli.
4. **Tracking plan** — Insight Tag + CAPI status, conversion events with the primary one flagged, UTMs, CRM sync, and the KPIs to watch (CPL → MQL → pipeline).
5. **First-2-weeks optimization checklist** — learning-phase guardrails, demographics-report review cadence, scaling and kill rules.

Be concrete with real Campaign Manager terminology, real bid-strategy names, and NIS budget figures. Flag any assumption (audience size, currency, geo) the user should confirm.
