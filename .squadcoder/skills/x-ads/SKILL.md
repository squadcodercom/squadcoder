---
name: x-ads
description: "Pro playbook for planning, launching, and optimizing X (Twitter) Ads — campaign objectives (Reach, Engagements, Website Traffic/Clicks, App Installs/Re-engagement, Video Views, Pre-roll), keyword + follower-lookalike + interest + Tailored Audience targeting, Promoted Ads & Promoted Trends, bidding (auto/target/max), creative specs, the X Pixel & Conversion API, and brand-safety/timing. Use for building an X/Twitter ad campaign, setting up Promoted Tweets, follower-lookalike or keyword targeting, X Pixel/CAPI tracking, or optimizing CPC/CPM/CPR. Hebrew: קמפיין פרסום בטוויטר / X, מודעות ממומנות, פיקסל X, טירגוט מילות מפתח ועוקבים, אופטימיזציה של פרסום ב-X. Activate for: X Ads, Twitter Ads, Promoted Ads, Promoted Tweet, Promoted Trend, X Pixel, follower lookalike targeting, keyword targeting, X Ads Manager, Website Clicks campaign, פרסום בטוויטר, מודעות ממומנות ב-X, פיקסל טוויטר, טירגוט עוקבים, קמפיין X."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# X (Twitter) Ads — Pro Playbook

A practical, current playbook for running performance and brand campaigns on **X Ads Manager** (`ads.x.com`). X is a high-intent, real-time, conversation-driven channel: it wins for launches, news-jacking, B2B/tech, events, and culturally-timed pushes. It is weaker than Meta/Google for pure broad-reach DR at scale, so structure for **intent + timing**, not just audience size.

---

## 1. Account & campaign structure (hierarchy)

X uses a 3-level tree: **Campaign → Ad Group → Ad (Promoted post)**.

- **Campaign** = objective + total/daily budget + start/end + funding source.
- **Ad Group** = audience, placements, bid, schedule, optimization preference. (This is X's equivalent of Meta's ad set / Google's ad group.)
- **Ad** = the Promoted post(s) served. Multiple ads per group A/B test automatically against the objective.

**Objectives (pick by funnel stage):**

| Funnel | Objective | Optimizes for | Use when |
|---|---|---|---|
| Awareness | **Reach** | Max unique users (CPM) | New brand, launch, max eyeballs |
| Awareness | **Video Views** | 6s/2s/15s views | Video brand story |
| Awareness | **Pre-roll Views** | Views before X creator video | Align with content verticals (Amplify) |
| Consideration | **Engagements** | Likes/reposts/replies (CPE) | Build social proof, conversation |
| Consideration | **Followers** | New followers | Grow owned audience |
| Conversion | **Website Traffic / Clicks** | Link clicks / landing-page visits | Send to site, blog, store |
| Conversion | **Website Conversions** | Pixel/CAPI events (purchase, lead) | DR with tracking installed — the money objective |
| App | **App Installs** | Installs (MACT/SDK) | Mobile app growth |
| App | **App Re-engagement** | Opens/in-app actions | Win-back / retention |

**Structure rules of thumb:**
- One objective per campaign; don't mix awareness and conversion budgets.
- ABO-style control: set budgets at the **ad-group** level to force spend across audiences while testing; consolidate winners later. X has no true CBO — manage pacing per ad group.
- Start with **3–5 ad groups** max per campaign (one variable each: audience type, placement, or bid) so signal isn't fragmented. X needs ~50 conversions/week per optimization to learn well; don't over-split.
- Separate **prospecting** and **retargeting** campaigns so reporting and bids stay clean.

---

## 2. Targeting & audiences

X's edge is **intent and context** signals. Layer them deliberately — broad targeting + good creative often beats over-narrow stacking.

**Audience types:**
- **Keyword targeting** — target users by words in their recent posts/searches/engagement. *Phrase, exact, and broad* match. This is X's signature lever: catch real-time intent ("looking for", competitor names, event hashtags, problem language). Separate **search keywords** (high intent) from **timeline keywords** (contextual).
- **Follower look-alikes** — target users who *resemble the followers of handles you name*. Pick 10–25 highly relevant handles: competitors, niche media, influencers, complementary brands. This is X's "lookalike" — handle-based, not pixel-based.
- **Interests** — 25 broad categories + sub-interests. Use as a broadening layer, not a precision tool.
- **Conversation topics / Events** — target people engaging with specific topics or live events (sports finals, conferences, holidays). Strong for timely pushes.
- **Movies & TV shows**, **device/OS/carrier**, **geo** (country → region → city → postal), **language**, **gender**, **age**.
- **Tailored Audiences (1st-party)** — your data:
  - *List uploads* — emails / phone / X user IDs / mobile ad IDs (hashed). Min ~500 matched.
  - *Website (pixel) audiences* — site visitors / event-based segments from the X Pixel.
  - *Engagement audiences* — people who engaged with your posts/videos/account.
  - *App activity* — installers/openers.
- **Lookalikes from Tailored Audiences** — expand seed lists/pixel segments (where available in market).

**Targeting strategy:**
- Prospecting cold: ONE primary signal per ad group (keyword **or** follower-lookalike **or** interest) so you learn which lever works. Avoid stacking that shrinks reach below ~50k.
- Always build **retargeting** ad groups: site visitors (X Pixel), video viewers (25/50/75%), profile/post engagers, cart abandoners.
- Exclude converters and existing customers from prospecting via Tailored Audience exclusions.
- Use **follower-lookalikes of competitors** + **competitor-name keywords** as a reliable cold-start combo for challenger brands.

---

## 3. Bidding & budget strategy

**Bid strategies (set per ad group):**
- **Autobid (Automatic)** — X maximizes results for your budget. *Default for launch and learning* — fastest to exit the learning phase and find true market cost. Best for reach/efficiency.
- **Target cost** — maintain an **average** cost per result around your target (results may run above/below). Use once you know a viable CPA/CPR and want stable, scalable average cost. (Availability varies by objective.)
- **Maximum bid** — hard ceiling per result; you never pay above it. Best for **strict cost control** and competitive auctions, but caps delivery if set too low. Use after you have benchmark data.

**Playbook:** launch on **Autobid** → read the real CPR after ~3–5 days / ~50 results → move scalable winners to **Target cost** (stability) or **Maximum bid** (protect margin). Don't start on max bid blind — you'll under-deliver and never learn the market price.

**Budget & pacing:**
- Set a **daily** budget (and optional total cap). X paces across the day by default; **Standard** pacing recommended. Accelerated/dayparting only for time-boxed pushes (event, sale, breaking moment).
- Budget floor for learning: enough for ~50 results/week per ad group. If you can't afford that across N ad groups, consolidate.
- Scale winners **+20–30% every 2–3 days**, not in big jumps (resets learning). Scale by raising budget on proven groups before duplicating.
- **Billing events** differ by objective: CPM (reach/video), CPE (engagements), CPC/CPLC (clicks/traffic), CPAC/CPI (app). Optimize toward the event you actually care about and let X bill on it.

---

## 4. Creative — specs & best practices

**Promoted post formats:**
- **Single image** — 1.91:1 or 1:1 (square performs in-feed). Recommended **1200×1200** (square) or **1200×628** (landscape). PNG/JPEG, ≤5MB. Min 600×600.
- **Carousel** — 2–6 swipeable image/video cards, 1:1 or 1.91:1, each with its own URL/CTA.
- **Video** — 16:9, 1:1 (best for feed), or 9:16 (vertical/mobile). **MP4/MOV, ≤2:20 (140s); 15s or less wins.** ≤1GB; 1080p; **hook in the first 1–2 seconds**; design **sound-off** with captions/text overlay; 16:9 or 1:1 recommended for most placements.
- **Image/Video App Card, Website Card** — large media + headline + CTA button (Install / Shop / Learn more) above the fold.
- **Carousel/Collection, Amplify Pre-roll, Amplify Sponsorships, Takeover (Timeline Takeover / Trend Takeover)** — premium/managed reach buys.
- **Promoted Trends / Trend Takeover** — your hashtag in the Trends list (mass-reach, managed buy, launch-day moments).
- **Vertical Video Ads** — full-screen 9:16 in the immersive video feed.

**Copy & hook best practices:**
- Post text: **lead with the hook**; X feed is fast. ~50–100 chars of body lands best; you have up to 280.
- 1 clear CTA per ad; use the **CTA button** on cards rather than a raw link in text.
- 1–2 relevant hashtags max — more reads as spam. Branded hashtag for Trends.
- Native voice wins: ads that read like a real post (not a banner) outperform. Test reply-bait, bold claims, lists, and "quote-tweet"-style hooks.
- Always pair an image/video with link cards — link previews without media underperform.
- Run **3–5 creative variants per ad group** (different hook/visual), let the objective pick the winner, refresh every 7–14 days to fight fatigue.

---

## 5. Conversion tracking & measurement (X Pixel + Conversion API)

You **cannot** run a Website Conversions objective or build site audiences without tracking. Install both client- and server-side for resilience to cookie/ITP loss.

- **X Pixel (Universal Website Tag)** — one base pixel across the site; fire **events** for key actions: `PageView`, `ContentView`, `Search`, `AddToCart`, `InitiateCheckout`, **`Purchase`** (with value + currency), `SignUp`, `Lead`, `Download`. Add via GTM or hardcode. Define **Conversion Events** in Ads Manager and pick the **primary** event each campaign optimizes to.
- **Conversion API (CAPI)** — server-side events to dedupe/recover signal lost client-side. Match keys: email/phone (hashed), IP, user-agent, click ID (`twclid`). **Always send `twclid`** captured from the landing URL for accurate click-through attribution. Dedupe pixel + CAPI with a shared `event_id`.
- **MACT / MMP** — for apps, connect a Mobile App Conversion Tracking partner (AppsFlyer, Adjust, Branch, Singular) for installs/in-app events.
- **Attribution** — set the window (e.g. 1-day view / up to 14–30-day click depending on objective) consistent with your buying. X under-reports vs platforms with longer windows; reconcile against GA4/server data.
- **Define key events before launch**: a campaign with no primary conversion event optimizes blind. Pass purchase **value** to enable value-based reporting and ROAS.

---

## 6. Optimization workflow (cadence)

**Daily (first 3–5 days = learning, don't panic-edit):**
- Check delivery: is the ad group spending? If not → bid too low (raise/auto), audience too narrow (broaden), or creative rejected (check policy).
- Watch for disapprovals / policy flags; fix and resubmit.

**Every 2–3 days:**
- Compare ad groups on **CPR / CPA / CTR / CVR**. Pause ad groups >30–40% above target CPR with enough spend (≥ ~2–3× target CPR spent and no conversion = kill).
- Within winners, **pause the bottom creatives**, scale the top. Keep ≥2 live for stability.

**Weekly:**
- Scale winners +20–30%; duplicate proven audiences into new keyword/lookalike seeds.
- Refresh fatiguing creative (frequency climbing, CTR falling). Rotate hooks.
- Move stable performers Autobid → Target cost; protect margins with Max bid where auctions are hot.
- Negative-keyword / exclusion hygiene: exclude irrelevant keyword matches and converters.

**Scaling rules:** raise budget gradually, broaden (add interests/lookalikes) before you narrow, and expand winning **keywords/handles** into fresh ad groups rather than overloading one.

**Kill rules:** no conversions after ~2–3× target CPA spent → pause. CTR < ~0.5–1% on a traffic objective with healthy reach → creative problem, not audience. Frequency high + CPR rising → fatigue, refresh.

---

## 7. Common mistakes / pitfalls

- **Editing during the learning phase** — resets it. Let ad groups stabilize ~50 results first.
- **Over-stacking targeting** (keyword + interest + lookalike + geo) until reach is tiny → no learning, high CPR. One primary signal per group.
- **Starting on Max bid** set too low → zero delivery, false "X doesn't work" conclusion.
- **Running Website Conversions with no/incomplete pixel** → optimizing to a phantom event.
- **Link-only posts with no media** → low CTR; always use a Website Card or media.
- **Too many hashtags / link in text instead of a card** → spammy, weaker CTR.
- **Ignoring `twclid`/CAPI** → under-attribution makes good campaigns look dead.
- **No retargeting layer** → wasting all the intent traffic you paid to create.
- **Set-and-forget creative** → fast fatigue on a real-time feed; refresh on a 1–2 week cadence.

---

## 8. Israel / Hebrew market notes

- **Language & RTL creative:** target **Hebrew** (and Arabic / Russian / English for relevant segments). Hebrew ad copy must read cleanly RTL — punctuation and any LTR tokens (brand names, URLs, prices) must not break direction. Keep the hook front-loaded in Hebrew; bidi-mixed lines (Hebrew + English product name) need testing in-feed.
- **Currency & budgets:** budget in **₪ (NIS)**; X bills in the account currency. Israeli CPMs/CPCs typically run lower than US but with smaller reach — keep daily budgets modest (e.g. ₪50–300/day per ad group to start) and consolidate so learning completes.
- **Local consumer behavior:** X usage in Israel skews news, tech, politics, finance, and live-event chatter — strong for B2B/tech, fintech, real-time/news-driven offers; weaker for broad mass-consumer DR (Meta/Google often cheaper there). Hebrew **keyword targeting** + **follower-lookalikes of Israeli media/influencer handles** is the highest-leverage cold-start combo.
- **Timing — Shabbat & holidays:** Israeli engagement drops Friday afternoon → Saturday night (Shabbat) and around חגים (Rosh Hashanah, Yom Kippur, Sukkot, Pesach). Use **dayparting** to pull or reduce spend Fri PM–Sat, ramp Sun–Thu (the local work week). For kosher/observant audiences, avoid Shabbat-time delivery entirely. Plan launches/Trends around **Sunday–Thursday** prime hours (evening, local time).
- **Local commerce nuance:** call out NIS pricing, free/fast shipping in Israel, Hebrew support, and local payment norms in creative. Reference local events/holidays for timely hooks.
- **Privacy expectations:** Israeli users are privacy-aware; ensure 1st-party data uploads comply with Israeli Privacy Protection Law and that consent exists for Tailored Audience email/phone lists. Disclose tracking where required.

---

## Output (when this skill activates)

Produce a ready-to-execute **X Ads plan**:
1. **Campaign skeleton** — objective(s) chosen + why, budget/pacing, and the Campaign → Ad Group → Ad tree (3–5 ad groups, one variable each).
2. **Targeting plan** — per ad group: the primary signal (keyword list / follower-lookalike handles / interests / Tailored Audience) + exclusions, with a separate **retargeting** group.
3. **Bidding & budget** — recommended bid strategy per group (Autobid → Target/Max path), starting daily budget in ₪, and scaling/kill thresholds.
4. **3 creative variants** — distinct hooks, format/spec (image 1200×1200 / video ≤15s 1:1 or 9:16), Hebrew + English copy where relevant, CTA button, and the Website/App Card setup.
5. **Tracking plan** — X Pixel base + named conversion events (with the primary event), CAPI/`twclid` recommendation, and the attribution window.
6. **Optimization & timing calendar** — what to check on what cadence, plus an Israel-aware schedule (Sun–Thu ramp, Shabbat/חג dayparting).

State assumptions explicitly when budget, market, or tracking status is unknown, and flag anything requiring the live X Ads Manager UI or API.
