---
name: ad-measurement-tracking
description: "Cross-platform ad measurement and conversion tracking playbook — GA4 events/conversions, UTM taxonomy, pixels vs server-side (Meta CAPI, Google Enhanced Conversions, TikTok Events API, Conversions API Gateway), Consent Mode v2, EU/Israel privacy, iOS ATT/SKAN, attribution models, and cross-platform deduplication. The measurement backbone every platform ad skill references. Activate for: conversion tracking, GA4 events, measurement setup, pixel setup, server-side tracking, CAPI, Conversions API, Events API, Enhanced Conversions, UTM tagging, attribution, deduplication, event match quality, Consent Mode, GTM, server-side GTM, iOS ATT, SKAN, מדידה, מעקב המרות, פיקסל, טראקינג, GA4, אטריביוציה, תיוג UTM, מצב הסכמה, מעקב צד שרת."
license: MIT
metadata:
  author: squadcoder
  version: "1.0.0"
---

# Ad Measurement & Conversion Tracking (Cross-Platform)

The measurement layer is the foundation under every paid channel. If tracking is wrong, every bid
strategy, budget decision, and creative test downstream is wrong too. This skill is the shared
backbone the platform skills (Meta, Google, TikTok, etc.) reference for "how do we count a
conversion and feed it back to the algorithm."

**Golden rule:** measure once, define events consistently across all platforms, send server-side
where possible, dedupe so you never double-count, and respect consent. Get this right *before*
scaling spend.

---

## 1. Measurement architecture (the mental model)

Three layers, in this order:

1. **Source of truth** — GA4 (+ optionally a warehouse/BigQuery export) and your backend/CRM. This
   is where *business* conversions live, immune to any single ad platform's self-attribution.
2. **Ad-platform signal layer** — each platform's pixel + server-side API (Meta Pixel + CAPI,
   Google tag + Enhanced Conversions, TikTok Pixel + Events API). These feed the *bidding
   algorithms*. They will over-report because every platform claims credit.
3. **Tag delivery layer** — Google Tag Manager (web container) and ideally **server-side GTM**
   (sGTM) as a single first-party endpoint that fans out to all platforms. This is where consent,
   hashing, and deduplication are enforced once.

Decision order for any new conversion: define the event → fire client-side (pixel) → mirror
server-side (CAPI/Events API/server-side GTM) with a shared `event_id` → verify dedup → confirm in
GA4 + platform Events Manager.

---

## 2. GA4 events & conversions

GA4 is event-based — everything is an event with parameters. Structure:

- **Automatically collected**: `page_view`, `session_start`, `first_visit`, `scroll`,
  `click` (outbound), `file_download`, `video_*` (Enhanced Measurement — turn on in the data stream).
- **Recommended events** — use Google's reserved names so GA4/Ads can interpret them:
  `view_item`, `add_to_cart`, `begin_checkout`, `add_payment_info`, `purchase`,
  `generate_lead`, `sign_up`, `login`, `search`. Don't invent names where a recommended one exists.
- **`purchase` requires** `currency` + `value` + `transaction_id` (dedupe key) + `items[]`.
- **Custom events** — only for genuinely custom actions; register **custom dimensions/metrics** for
  any parameter you want to report on (GA4 ignores unregistered params in reports).

**Mark events as Key Events** (formerly "conversions") in GA4 Admin → Events. Key Events imported
into Google Ads become the conversion actions you bid toward. One canonical `purchase`/`generate_lead`,
not five near-duplicates.

GA4 hygiene: enable BigQuery export (free daily) on day one for raw-data backfill; set sensible
data retention (14 months for explorations); use **measurement_id + api_secret** for the
**Measurement Protocol** to send server-side events that join the same session (must include the
client's `client_id`, and `session_id` to attribute to the live session).

---

## 3. UTM taxonomy (lowercase, consistent, documented)

Inconsistent UTMs are the #1 cause of messy attribution. Lock a spec and enforce it with a builder
sheet — never hand-type.

| Param | Rule | Example |
|---|---|---|
| `utm_source` | the platform | `facebook`, `google`, `tiktok`, `instagram`, `newsletter` |
| `utm_medium` | the channel type | `cpc`, `paid_social`, `email`, `display`, `affiliate` |
| `utm_campaign` | your campaign id/name | `2026_q2_summer_sale_il` |
| `utm_content` | the specific ad/creative | `video_a_hook1`, `carousel_red` |
| `utm_term` | keyword (search) | `{keyword}` via ValueTrack |

Rules: **all lowercase**, no spaces (use `_`), no PII, no diacritics. Use platform **auto-tagging**
where it exists (Google Ads `gclid`, Microsoft `msclkid`, Meta/TikTok `click_id`) *in addition to*
UTMs — auto-tagging drives the platform's own attribution; UTMs feed GA4. Keep Google Ads
**auto-tagging ON** and **don't** also manually tag Google Ads URLs (it can break `gclid`).
Maintain a single naming convention doc so `facebook` never coexists with `Facebook`/`FB`/`fb`.

---

## 4. Client-side pixels vs server-side (the core of modern tracking)

Browser pixels are increasingly blocked (ITP/ETP, ad blockers, no third-party cookies, iOS).
Server-side sends the event from *your* server/sGTM directly to the platform's API — more reliable,
better match rates, first-party context. **Run both** and dedupe; don't pick one.

- **Meta**: Meta Pixel (browser) **+ Conversions API (CAPI)** (server). Dedupe on a shared
  **`event_id`** + matching `event_name`. Maximize **Event Match Quality (EMQ)** by sending hashed
  customer info (`em`, `ph`, `fn`, `ln`, `external_id`) plus `fbp`/`fbc` cookies and client IP/UA.
  Aim for EMQ ≥ 6–7.
- **Google**: the Google tag (gtag/GTM) **+ Enhanced Conversions** (hashed email/phone passed with
  the conversion) and/or the **Google Ads API** for offline conversion import (upload `gclid` +
  conversion from CRM for true closed-loop on leads/sales). Enhanced Conversions recovers
  conversions lost to cookie/consent gaps.
- **TikTok**: TikTok Pixel **+ Events API (EAPI)**. Dedupe with `event_id`. Send hashed
  `email`/`phone_number`/`external_id` and `ttclid`/`ttp` to lift match quality.
- **Server-side GTM (sGTM)** — the recommended hub: one first-party endpoint receives the event and
  fans it out to GA4, Meta CAPI, Google Ads, TikTok EAPI, etc. Centralizes hashing, consent
  enforcement, IP handling, and the shared `event_id`. Host it on a **first-party subdomain**
  (e.g. `gtm.yourdomain.co.il`) so cookies are first-party and survive ITP.
- **Conversions API Gateway** — Meta's self-hosted CAPI option (cloud appliance) for teams without a
  dev/sGTM setup; good when you can't build sGTM but want server events.

**Always hash PII** (SHA-256, lowercased/trimmed, E.164 phone) **before it leaves your server**.
Never send raw email/phone to any ad platform.

---

## 5. Deduplication across the stack

Double-counting inflates reported conversions and corrupts bidding. Dedup at two levels:

1. **Within a platform (pixel ↔ server)** — send the *same* `event_id` (Meta/TikTok) on both the
   browser and the server event with the same `event_name`. The platform keeps one. For GA4
   Measurement Protocol mirroring, reuse the same `client_id`/`session_id` and a stable
   `transaction_id`.
2. **Across platforms / vs GA4** — `transaction_id` is the universal dedupe key for purchases.
   Never let two systems both count the same order. In GA4, duplicate `purchase` with the same
   `transaction_id` in a session is auto-deduped — so the id must be the *real, stable* order id.

Cross-platform *attribution* will never sum to 100% — each platform self-attributes. Treat
platform-reported conversions as *bidding signals*, and GA4/CRM as the *truth* for ROAS reporting.

---

## 6. Consent Mode v2 & privacy (EU + Israel)

**Consent Mode v2 is mandatory** for serving European users via Google Ads/GA4 remarketing and for
Meta/EU data use. It passes consent state to tags so they adapt behavior:

- Four signals: `ad_storage`, `analytics_storage` (v1) + `ad_user_data`, `ad_personalization` (v2).
- **Set defaults to `denied` BEFORE any tag fires** (default consent), then update to `granted`
  when the user accepts in a certified CMP (Cookiebot, Usercentrics, OneTrust, etc.).
- **Basic** mode = tags blocked until consent. **Advanced** mode = tags load, send cookieless
  *signals* on denial, and Google **models** the gap (conversion modeling) — preferred for ad
  performance. Configure in your CMP/GTM.
- Meta has its own consent gating via the CMP + limited data use flags for EEA.

**Israel specifics:** Israel's Privacy Protection (Amendment 13) regime (in force Aug 2025) sharply
raised enforcement, broadened "data subject" rights, and increased penalties — treat opt-in consent,
data minimization, and a clear privacy policy as required, not optional. Many Israeli sites serve EU
visitors too, so EU GDPR + Consent Mode v2 apply regardless. Practical defaults for IL: deploy a
certified CMP, default consent to `denied`, hash all PII, document a DPO/contact, and don't ship
remarketing audiences without consent. Be conservative — fines and class-action exposure are real.

---

## 7. iOS ATT & SKAN (the signal-loss reality)

- **ATT (App Tracking Transparency)** — on iOS, apps must prompt for permission before accessing the
  IDFA. Most users decline, so deterministic cross-app/web attribution for those users is gone.
- **SKAN (SKAdNetwork) / AdAttributionKit** — Apple's privacy-preserving attribution: delayed,
  aggregated, **conversion-value**-based postbacks, no user-level data. For **app-install
  campaigns** you optimize on a **conversion value schema** (CV mapping) and accept coarse, delayed
  data. Meta's **Aggregated Event Measurement (AEM)** and Google's modeling fill web-side gaps.
- **Web impact**: shorter cookie lifetimes (ITP caps client-set cookies ~7 days, ~24h in some
  cases). This is *the* reason server-side + first-party sGTM + Enhanced Conversions/CAPI matter —
  they restore signal the browser loses.
- **Prioritize/configure** your top events (Meta: 8 web events per domain via the verified domain +
  Aggregated Event Measurement; rank by business value). Verify your domain.

---

## 8. Attribution models

- **GA4 default = data-driven attribution (DDA)** across Google channels; last-click available.
  Lookback windows configurable (default 90 days acquisition / 30 conversion).
- **Platform self-attribution** — Meta default **7-day click / 1-day view**; Google Ads uses
  data-driven across the Google stack. These differ from GA4 *by design* — don't expect them to match.
- **Reporting stance**: use **GA4/CRM** (or a warehouse model) as the cross-channel source of truth
  for ROAS and budget allocation; use each platform's in-platform numbers only to drive that
  platform's bidding. For higher rigor, layer **incrementality testing** (geo lift, conversion lift
  studies, holdouts) and/or **MMM** (media mix modeling) — these answer "did the ad *cause* the
  sale," which attribution cannot.

---

## 9. Optimization & QA workflow

**Before launch (must pass):**
1. Tag fires on the right trigger (GTM Preview + Tag Assistant); GA4 DebugView shows the event with
   correct params (`value`, `currency`, `transaction_id`, `items`).
2. Meta Events Manager **Test Events** shows pixel **and** server events with matching `event_id`
   (status: "Deduplicated"). TikTok Events Manager Test Event likewise.
3. Enhanced Conversions / CAPI diagnostics green; EMQ measured (target ≥ 6).
4. Consent Mode: with consent denied, confirm tags send only modeled/cookieless signals; with
   granted, full tags fire.
5. UTMs resolve correctly in GA4 Traffic acquisition; no `(not set)` / `(direct)` leakage on paid.

**Ongoing cadence:**
- **Daily**: spot-check that conversions are still recording (a deploy can silently break a tag);
  watch for sudden drops in conversion volume = tracking break, not performance.
- **Weekly**: reconcile platform-reported conversions vs GA4 vs backend; investigate large
  divergences; check EMQ/match quality and Consent Mode coverage; review `(not set)` sources.
- **Monthly**: audit the full tag map, dedup health, consent rates, and attribution windows; prune
  dead tags; confirm SKAN/AEM event priorities still match business priorities.

**Kill/fix rules:** if a conversion count diverges >25% week-over-week with no campaign change →
assume a tracking break and audit before touching bids. Never change bid strategy on a day with a
known tracking outage.

---

## 10. Common mistakes / pitfalls

- Counting the same conversion twice (pixel + server with no shared `event_id`; or two GTM tags).
- Sending raw (unhashed) email/phone to a platform — privacy violation and rejected/poor match.
- Hard-coding `value`/`currency` instead of reading the real cart value → garbage ROAS, broken
  value-based bidding.
- Manually tagging Google Ads URLs with UTMs *and* leaving auto-tagging on → `gclid` conflicts.
- Mixing case/spelling in UTMs (`Facebook` vs `facebook`) → fragmented channel reports.
- Treating one platform's self-attributed numbers as truth and summing across platforms.
- Shipping remarketing tags without Consent Mode / a CMP in EU/IL → compliance exposure.
- Forgetting `transaction_id` on `purchase` → no dedupe, inflated revenue.
- Letting a site deploy ship without re-testing tags (most breaks are silent).
- Optimizing on a tiny, noisy custom conversion instead of a high-volume canonical event.

---

## 11. Israel / Hebrew market notes

- **Currency**: report and pass `value` in **ILS/NIS** (`currency: "ILS"`); keep one currency per
  property to avoid value-based-bidding confusion. Watch VAT inclusion consistency.
- **Privacy**: Amendment 13 + EU spillover → default-deny consent, certified CMP, hashed PII, clear
  Hebrew privacy policy. Don't ship audiences without consent.
- **Hebrew/RTL**: UTMs and event params stay **ASCII/lowercase English** even on Hebrew sites
  (analytics tooling chokes on RTL/Hebrew in params); keep human-readable Hebrew only in campaign
  *display* names, not in the `utm_*` machine values.
- **Timing/seasonality**: model conversion windows around **Shabbat** (Fri afternoon → Sat night,
  lower e-comm activity for many audiences, higher for others), Jewish holidays, and post-Shabbat
  (Motzei Shabbat) traffic spikes — relevant when judging "tracking break vs natural dip."
- **Local stack**: many IL merchants use local payment/checkout providers — confirm the `purchase`
  event fires reliably on *their* thank-you page/webhook, not just a generic SPA route.

---

## Output (what to produce when this skill activates)

When asked to set up or audit measurement, produce:

1. **Event map** — table of business actions → GA4 recommended event name → required params
   (`value`/`currency`/`transaction_id`/`items`) → which platforms it maps to → Key Event? (yes/no).
2. **UTM spec** — the locked taxonomy + 3 example tagged URLs for the current campaign, all lowercase.
3. **Tracking architecture** — client pixel + server-side plan per platform (Meta CAPI, Google
   Enhanced Conversions/offline import, TikTok EAPI), the shared `event_id`/`transaction_id` dedup
   keys, and whether sGTM / CAPI Gateway is recommended.
4. **Consent & privacy plan** — Consent Mode v2 defaults, CMP choice, PII-hashing note, IL/EU
   compliance callouts.
5. **QA checklist** — the pre-launch verification steps (DebugView, Test Events, dedup status, EMQ)
   tailored to this site/account.

Keep it concrete and ready to implement; flag any privacy/consent risk explicitly.
