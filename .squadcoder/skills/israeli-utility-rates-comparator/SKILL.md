---
name: israeli-utility-rates-comparator
description: Compare electricity providers, water tariffs, cooking-gas (LPG) rates, cellular plans, fiber internet packages, and arnona (municipal property tax) across Israeli municipalities and utility companies. Use when a user needs to understand IEC tariff structures, calculate solar panel ROI, compare tiered water pricing, pick a cheap cellular plan, switch to fiber internet, or evaluate arnona differences between cities. Covers electricity market deregulation, independent power producers, Mekorot water pricing, cellular operators and MVNOs, fiber-optic infrastructure, and municipal rate variations. Do NOT use for commercial/industrial utility contracts at scale, or utility infrastructure investment analysis.
license: MIT
allowed-tools: Bash(python:*) WebFetch
---

# Israeli Utility & Telecom Rates Comparator

## Instructions

### Step 1: Identify Which Utility to Compare

Determine which utility cost the user wants to analyze. Israeli household utilities and recurring service costs include:

**Electricity (חשמל):**
- Israel Electric Corporation (IEC / חברת החשמל) owns transmission, distribution, and meter reading
- The household supply market is open: by end-2025 roughly 280,000 households had moved to private suppliers and the count keeps climbing
- Tariffs are set by the Electricity Authority (רשות החשמל)
- Time-of-use (TOU) pricing available for smart-meter customers (about 1M meters / ~30% of households as of 2026)

**Water (מים):**
- Mekorot (מקורות) is the national water company supplying bulk water
- Municipal water corporations (taagidei mayim) handle local distribution
- Tiered pricing: ascending block tariff system where price per cubic meter increases with consumption

**Cooking Gas (גז בישול / גפ"מ) and Natural Gas (גז טבעי):**
- Most households still use LPG cooking-gas balloons (12kg) or centralized building tanks
- Natural gas infrastructure expanding via Energean (Karish/Athena) pipelines, mostly in newer buildings
- LPG tariffs published by the Energy Ministry per locality

**Cellular and Internet (סלולר ואינטרנט):**
- Cellular market opened to MVNOs in 2012 (Hot Mobile, Golan Telecom, Rami Levy Mobile, 019, Home Cellular and others); unlimited plans dropped to single-digit-to-low-double-digit shekels
- Internet has split into infrastructure (Bezeq, HOT, IBC/Unlimited fiber, partner-built fiber) and content/ISP (Bezeq Beinleumi, Cellcom, Partner, 013, 014/Cellact, Triple-C, Hot-Net), most consumers buy as a single bill ("שוק סיטונאי") today

**Arnona (ארנונה):**
- Municipal property tax charged by local authorities
- Rates vary dramatically between municipalities
- Based on property size (sqm), zone, and usage type (residential/commercial)

### Step 2: Electricity Comparison

**Understanding IEC tariff structure:**

The Electricity Authority publishes official tariffs at pua.gov.il. IEC tariffs for residential customers include:

**Standard tariff (tariff achid):**
- Single rate per kWh for all hours
- Simplest billing structure
- Suitable for low-medium consumption households

**Time-of-use tariff (tariff TOZ / תעריף תעו"ז):**
- Requires a smart meter (moné chokhéakh)
- Two tiers since April 2023: peak (shia / שיא) and off-peak (shefel / שפל). The former shoulder (geva / גבע) tier was eliminated. Older docs may still describe a 3-tier structure.
- Summer (Jun-Sep) weekday peak: 17:00-23:00; off-peak: all other hours including weekends and Shabbat
- Winter (Dec-Feb) weekday peak: typically 17:00-22:00 plus a morning band 06:00-08:00; off-peak the rest of the day
- 2026 indicative rates (incl. 18% VAT): off-peak ~52.83 agorot/kWh; summer peak ~168.95 agorot/kWh
- Can save 15-25% for households that shift consumption to off-peak hours
- Tariffs reset quarterly via Electricity Authority decisions, so verify current numbers at pua.gov.il before quoting

**Monthly fixed charges:**
- Connection fee (agrat chibbur) regardless of consumption
- Distribution fee
- Public broadcasting fee (agrat shidrur)
- For apartments: a share of common-area electricity (chashmal klali) for stairwells, elevators, and lobby lighting, billed via the va'ad bayit (building committee) and separate from the IEC bill. New tenants are often surprised by this line item.

To compare electricity costs:
1. Obtain the user's recent electricity bills (at least 3 months, preferably 12 for seasonal patterns)
2. Note current monthly consumption in kWh
3. Check if they have a smart meter (required for TOU pricing)
4. If no smart meter, check eligibility and installation process with IEC (iec.co.il)

**Independent electricity producers (residential market):**

The residential electricity market is open to private suppliers. As of end-2025, approximately 280,000 households had switched to alternate suppliers, with typical discounts of 5-21% off the IEC tariff for the generation portion. Active residential suppliers in 2026 include:
- **Cellcom Energy**, **Partner**, **Bezeq**, **HOT Energy** (telecom-bundled offers)
- **Pazgas Electricity**, **Amisragas**, **Electra Power** (energy and gas group offers)
- **OPC Energy**, **Dalia Energy**, **Enlight Renewable Energy** (independent generators, historically large-customer focused, also signing residential customers)

**Critical: switching does NOT replace the full bill.** Independent suppliers compete only on the **generation** (ייצור) component, which is roughly 60-70% of the bill. The household continues to pay IEC for distribution (חלוקה), transmission (הולכה), the public broadcasting fee, and meter charges. The supplier discount applies only to the energy portion.

**Cooling-off period:** Under the Consumer Protection Law (חוק הגנת הצרכן), residential customers have a 14-day right to cancel after signing with an alternate supplier. Always read the cancellation clauses before signing, and keep a copy of the contract. The Energy Ministry is also working to shorten the supplier-switching window from 14 days to 7 days during 2026.

**Discounts on the electricity bill (separate from supplier choice):**
- **Seniors with income supplement (השלמת הכנסה):** 50% discount on consumption up to 400 kWh/month (or 800 kWh per bi-monthly bill). The Energy Minister is advancing a plan to deepen this to 65% for old-age + income-supplement, old-age-disability, and Holocaust survivors, verify status at gov.il before quoting 65% as fact.
- **Holocaust survivors (ניצולי שואה):** 50% discount on up to 400 kWh/month
- **Disabled (נכים) with high disability percentage:** discount tiers per Bituach Leumi recognition
- The discount is applied automatically once Bituach Leumi shares eligibility with IEC; nothing to file each month, but verify the discount line appears on your bill.

### Step 3: Calculate Solar Panel ROI

Solar panels (panelim sola'riyyim) are increasingly popular in Israel due to high solar irradiance.

**Net metering program:**
- Install solar panels on your roof or property
- Excess electricity is fed back to the IEC grid
- Your electricity meter runs backward when producing
- You pay only for net consumption (consumption minus production)
- System size limited to your annual consumption level

**ROI calculation factors:**
1. **System cost**: in 2026, typically 3,500-4,000 ILS per kWp turnkey installed. Common residential sizes: 3 kW ~11,000-13,000 ILS; 5 kW ~18,000-22,000 ILS; 10 kW ~38,000-48,000 ILS basic, up to ~75,000 ILS for premium panels or battery-paired systems.
2. **Annual production**: Israel averages 1,500-1,800 kWh per installed kWp (Negev gets ~1,800, north gets ~1,400-1,500, central ~1,600)
3. **Current electricity cost**: multiply production by the current IEC tariff (Jan 2026 standard residential ~0.6432 ILS/kWh inc. 18% VAT)
4. **Annual savings**: production in kWh multiplied by tariff rate (savings on offset consumption) plus the export tariff (~0.48 ILS/kWh for residential under the long-standing 25-year hesder, with a newer two-track proposal at ~0.60 ILS/kWh for the first 5 years then ~0.38 ILS/kWh for installations up to 30 kW) for excess production fed to the grid. Confirm the exact track on the installer's quote.
5. **Payback period**: system cost divided by annual savings (typically 4-7 years in Israel, faster in the south)
6. **System lifetime**: 25+ years with gradual degradation (~0.5% per year)
7. **Maintenance**: minimal, panel cleaning 1-2 times per year
8. **Connection approval**: net metering (decision 1573) is still active, with a newer urban premium of +6 agorot/kWh and updated tracks under decisions 45-46 for installations >100 kW. Confirm which model the installer is quoting.

**Steps to evaluate solar:**
1. Check roof orientation (south-facing is optimal in Israel)
2. Assess shading from nearby buildings or structures
3. Contact 3+ solar installers for quotes (comparison sites: Solar Edge, SolarTech Israel)
4. Verify municipal approval requirements (heter bniya for roof modifications)
5. Apply to IEC for net metering connection
6. Calculate ROI using the factors above

### Step 4: Water Tariff Comparison

Israeli residential water uses an ascending block tariff (tiered pricing):

**Tier 1 (consumption up to basic allocation):**
- Lower rate per cubic meter (m3)
- Basic allocation: approximately 3.5 m3 per person per month (varies by household size)
- Calculated based on registered residents at the address (nefashot)

**Tier 2 (consumption above basic allocation):**
- Higher rate per cubic meter
- Approximately 84% more expensive than Tier 1 (Jan 2026: Tier 1 ~8.508 ILS/m³ inc. VAT vs Tier 2 ~15.623 ILS/m³ inc. VAT, both include sewage)
- Applies to all consumption beyond the basic allocation

**Important factors:**
- **Nefashot registration**: register all household members at your water corporation to maximize Tier 1 allocation. Unregistered members mean a lower threshold before Tier 2 kicks in. Registration is forward-looking; back-credit is generally limited to the current billing period.
- **Garden/pool allocation**: additional allocation available for documented garden irrigation or swimming pool
- **Sewage charge (biuv)**: in most municipalities sewage is bundled into the regulated per-m³ water tariff (the 8.508 / 15.623 ILS/m³ figures already include sewer). Where the local authority bills sewer separately, the standalone sewer rate is ~4.39 ILS/m³ on a volume basis (typically 70-90% of metered water).
- **Confirmed-leak credit**: water corporations grant a partial credit (often 50-100%) for documented hidden leaks under תקנות תאגידי מים וביוב. Requires a plumber certificate filed within 60 days of detection.

**Municipal water corporations (examples):**
- **Mei Avivim** (Tel Aviv)
- **Hagihon** (Jerusalem)
- **Mei Haifa** (Haifa)
- **Mei Raanana** (Raanana)
- **Mekorot** directly (some smaller localities)

Each corporation may add slightly different surcharges for infrastructure and maintenance. Compare by checking:
1. Base water rate per m3 (Tier 1 and Tier 2)
2. Sewage rate
3. Fixed monthly/bi-monthly charge
4. Infrastructure development levy (where applicable)

To compare costs:
1. Obtain recent water bills (hagbanah)
2. Note household size (nefashot registered)
3. Calculate average monthly consumption in cubic meters
4. Check which tier most consumption falls into
5. Compare total cost including all surcharges

### Step 5: Natural Gas and Cooking Gas Comparison

**Cooking gas balloons (balonei gaz):**
- Standard 12 kg balloon
- Prices regulated by the Ministry of Energy (misrad ha'energia)
- Maximum price published monthly at gov.il
- Delivery fee varies by supplier
- Compare local suppliers: Supergas, Pazgas, Amerigas
- Typical household uses 1 balloon every 1-3 months

**Natural gas (gaz tiv'i) home connection:**
- Available in newer residential buildings connected to the national gas grid
- Significantly cheaper per unit of energy than cooking gas balloons
- Monthly fixed connection fee plus usage-based charges
- Main infrastructure operators: Energean Israel (formerly Delek Drilling) for supply, local distribution companies for last-mile delivery

**Comparison factors:**
| Factor | Gas Balloon | Natural Gas |
|--------|-------------|-------------|
| Cost per cooking hour | Higher | Lower (40-60% savings) |
| Monthly fixed fee | None | Yes (connection charge) |
| Delivery reliability | Depends on supplier | Continuous supply |
| Safety | Requires periodic inspection | Built-in safety systems |
| Environmental impact | Higher emissions | Lower emissions |
| Availability | Everywhere | Limited areas |

To determine if switching to natural gas is worthwhile:
1. Check if your building has natural gas infrastructure (common in buildings built after 2010)
2. Calculate current cooking gas annual cost
3. Get a natural gas connection quote (installation + monthly fees)
4. Calculate break-even point (typically 2-4 years if infrastructure exists)

### Step 6: Cellular and Internet Comparison

The Israeli telecom market is one of the cheapest in the developed world after a decade of post-2012 MVNO entry and a fiber-optic rollout that finished covering most of the country between 2022 and 2025. Most households can save 50-200 ILS/month by switching providers, but the comparison has to look at the **total** bill (line + roaming + add-ons) and at lock-in / introductory pricing carefully.

**Cellular providers (2026):**

| Provider | Type | Typical unlimited plan (NIS/month) |
|----------|------|-------------------------------------|
| Cellcom, Partner, Pelephone | MNO (owns network) | 30-60 (premium) |
| HOT Mobile | MNO | 25-40 |
| Rami Levy Mobile | MVNO on Pelephone | ~20 (unlimited calls + 50GB+ data) |
| Golan Telecom | MVNO | ~30 (unlimited calls + SMS + 50GB+ data) |
| 019 Mobile | MVNO/operator | 10-40 depending on tier (e.g., Bundle Ten ~10 NIS/month for 100MB) |
| Home Cellular | MVNO | ~20-30 |
| Bezeq International Mobile, We4G, YouPhone | Smaller players | 20-40 |

The cheapest plans cluster around **20-30 NIS/month for unlimited domestic calls + 50GB+ data**, with no setup fee and no real contract (cancel anytime, "תוכנית ללא התחייבות"). Premium plans (60-100 NIS) typically include 5G priority, international minutes, roaming bundles, content perks. Most "unlimited" data plans actually fair-use throttle after 50-100GB but it rarely matters for normal use.

**Cellular gotchas:**
- **Introductory price escalates.** Many "מבצע" plans are X NIS for 12 months then jump 50-100% afterward. Read the תקנון carefully, set a calendar reminder, and switch again before the price hike.
- **Bundled vs unbundled.** Telecom companies push "triple play" (cellular + TV + internet) packages with discounts; the discount usually vanishes if you cancel one of the three.
- **Number portability is free and fast**, switching takes ~1 day, no fees, no forms. The new supplier handles it.
- **eSIM is supported** by all MNOs and most MVNOs; useful for second lines (e.g., a cheap data plan for hotspot use).

**Home internet (2026):**

Israel's home internet has separate "infrastructure" (תשתית) and "ISP/content" (ספק / שירותי אינטרנט) layers. Since the wholesale-market reform, most households buy a **bundled** package where one company bills for both (called "שוק סיטונאי" or "חבילת ספק ותשתית").

| Infrastructure operator | Coverage | Notes |
|--------------------------|----------|-------|
| Bezeq (BFiber) | National | Fiber-to-the-home rolled out 2021-2025 |
| HOT | National (especially central + Haifa) | Cable + fiber |
| IBC / Unlimited | ~260 localities | FTTH, symmetric speeds 100Mbps-5Gbps |
| Cellcom + Partner self-built fiber | Selected cities | Independent fiber rollouts |

| Speed tier | Typical 2026 bundled price (NIS/month) |
|------------|-----------------------------------------|
| 100Mbps | 70-90 |
| 300Mbps | 90-110 |
| 600Mbps | 100-130 |
| 1Gbps | 120-160 (lowest from HOT-Net ~99 NIS, BFiber ~149 NIS) |
| 2.5-5Gbps | 180-300+ |

**Internet gotchas:**
- **Two bills vs one.** Older households still have separate "infrastructure" bills (Bezeq Bzona / HOT) and "ISP" bills (Bezeq Beinleumi, Cellcom, Partner, 013/Netvision, 014, 018 Xfone, Triple-C, Rimon). Consolidating to a wholesale-market bundle ("ספק יחיד") usually drops the price 20-40 NIS/month.
- **ADSL on copper is being phased out.** If you still have ADSL, you almost certainly qualify for fiber at the same address, check at the four infra operators' coverage pages.
- **Promotional period.** Same pattern as cellular: cheap for 12 months, then bumps up. Switching back to a different ISP at month 12 is the usual play and is free with no router replacement if you own a fiber-compatible ONT.
- **Router rental.** Some ISPs charge 10-20 NIS/month for a router; bring your own or buy outright to skip that line.

**Triple-play bundle (חבילה משולשת):**
- Telecom companies often bundle cellular + internet + TV (Yes / HOT Box / Cellcom TV / Partner TV / Sting TV / Free TV) for a 20-40% discount vs buying separately
- Bundle math is only worth it if you actually want TV; otherwise unbundling and using HOT Net / Bezeq fiber + a cheap cellular MVNO + a streaming service (Netflix / Disney+ / Sting / Yes+) is almost always cheaper

**How to comparison-shop:**
1. **Pull last 3 months of bills** for cellular, internet, TV to see actual usage (data per line, peak speed observed, TV channels you watch)
2. **Run an Israeli comparator**: kamaze.co.il, kamazeole.co.il, israeliphoneplans.com, mishtalemli.co.il, or the Ministry of Communications official comparator at gov.il
3. **Get 2-3 quotes** by phone; tell each company you're shopping and ask for "מחיר שמירת לקוח" (retention price), usually 15-30% lower than the published price
4. **Time the switch**: cellular portability is free; internet may have a 1-2 week overlap so schedule installation before cancellation
5. **For new immigrants or those without Hebrew**: israeliphoneplans.com and No Fryers blog publish English-language guides that explain plan structure and oleh-specific tips

### Step 7: Arnona Comparison Between Cities

Arnona (municipal property tax) is the largest recurring utility-like cost for Israeli households. Rates vary dramatically between municipalities.

**How arnona is calculated:**
- Rate per square meter per month (shekel l'meter ravu'a l'hodesh)
- Different rates for different zones within the same municipality
- Different rates for residential vs. commercial properties
- Discounts available for eligible populations (olim chadashim, elderly, low income, disabled)

**Arnona rates in major cities (residential, approximate):**

| City | Rate per sqm/month (ILS) | 80 sqm monthly | 100 sqm monthly |
|------|--------------------------|-----------------|------------------|
| Tel Aviv | High range | ~550-700 | ~700-880 |
| Jerusalem | Medium-high | ~450-600 | ~570-750 |
| Haifa | Medium | ~380-500 | ~480-630 |
| Beer Sheva | Lower | ~280-380 | ~350-480 |
| Raanana | High | ~500-650 | ~630-810 |
| Netanya | Medium | ~350-480 | ~440-600 |
| Rishon LeZion | Medium-high | ~400-550 | ~500-690 |
| Petah Tikva | Medium | ~380-500 | ~480-630 |

Note: Rates vary by zone within each city and change annually. Always verify current rates at the municipality website.

**How to check your arnona rate:**
1. Visit your municipality's website (iriya / moatza mekomit)
2. Look for "arnona" section or "tashlumim" (payments)
3. Find the tariff table (tav tariffim) for your zone
4. Calculate based on your property size and classification

**Arnona discounts (hanashot):**
- New immigrants (olim): up to 90% discount on the first 100 sqm for 12 months out of the 24 months following aliyah registration (single benefit, not yearly). Olim recognized by Bituach Leumi for disability or sicud benefits get up to 80% with no time limit. See kolzchut.org.il/he/הנחה_בארנונה_לעולים_חדשים for the exact rules.
- Senior citizens (women 62 / men 67, the official retirement age): 30% discount if income is below the average wage; up to 100% if also receiving income supplement (השלמת הכנסה) from Bituach Leumi.
- Low income (hakhnasot nemukhot): significant discounts on a sliding scale, apply through the municipal welfare department
- Disabled (nekhim): discounts based on disability percentage; 80% for 90%+ disability
- National service / IDF veterans: various discounts, including bereaved families
- Students: some municipalities offer student discounts
- Single-person household: some municipalities offer discounts

**Discount stacking rule:** Only one discount tier applies per property at a time, per תקנות הסדרים במשק המדינה (הנחה מארנונה), תשנ"ג-1993. A household qualifying for both senior and low-income discounts receives the larger of the two, not the sum. Apply for whichever gives the highest reduction.

**Filing an arnona objection (hassagah):** If you believe the bill is wrong (incorrect property size, wrong zone classification, missing discount, balcony charged at full rate), there is a formal escalation path:
1. **Hassagah**, file a written objection with the municipal arnona manager within **90 days** of receiving the bill. Cite the specific calculation error and attach evidence (measurement, classification documents, photos of enclosed vs open balcony).
2. **Response**, the municipality must respond within 60 days. Silence after 60 days is treated as deemed-rejection and the clock for the next step starts.
3. **Appeal to ועדת ערר**, if rejected, you have **30 days** to appeal to the local arnona objection committee (ועדת ערר לארנונה).
4. **Administrative court**, if the ועדת ערר ruling is against you, escalate to בית משפט לעניינים מנהליים within 45 days of the decision.

For IEC and water-corporation billing disputes (not arnona), the small-claims court (בית משפט לתביעות קטנות, 38,500 ILS cap in 2026) is often a faster path.

### Step 8: Tips for Reducing Utility Bills

**Electricity:**
1. Switch to TOU tariff if you have or can get a smart meter
2. Run washing machine, dryer, and dishwasher during off-peak hours (nights, Shabbat)
3. Install LED lighting throughout the home
4. Set AC to 24-25 degrees Celsius (not lower)
5. Use ceiling fans alongside AC to distribute cool air
6. Consider solar water heater (dud shemesh) maintenance for optimal hot water heating
7. Unplug devices on standby (saves 5-10% on electricity)

**Water:**
1. Register all household members for nefashot allocation
2. Fix leaking faucets and toilets promptly (a leaking toilet can waste 200+ liters per day)
3. Install low-flow showerheads and faucet aerators
4. Use dual-flush toilet mechanisms
5. Water garden during evening hours to reduce evaporation

**Arnona:**
1. Verify your property size in municipal records matches actual measured size
2. Apply for all eligible discounts
3. Pay annual lump sum for a discount (some municipalities offer 1-2% for annual payment)
4. Report any changes in household composition that may qualify for discounts
5. If you run a business from home, verify you're not being overcharged with commercial rates for your entire property

**Cellular & Internet:**
1. Compare your current plan against MVNOs (Rami Levy Mobile, Golan, 019), most users overpay 30-60 NIS/month
2. Call retention before switching: ask for "מחיר שמירת לקוח", saves 15-30% with no provider change
3. Set a calendar reminder for the end of the introductory period (usually month 12) and re-shop or re-negotiate
4. Unbundle the triple play if you don't use the TV: a cheap fiber + MVNO + streaming combo is almost always cheaper
5. Port your number for free, there are no fees, no forms, and it usually takes one business day
6. Drop the router rental, own your ONT/router, save 10-20 NIS/month

### Step 9: Smart Meter Adoption and Monitoring

**Smart meters (monéi chokhéakh):**
- IEC has installed approximately 1 million smart meters as of 2026 (~30% of households); the announced target is **3.7 million smart meters by end-2028**, prioritizing high-consumption households and dense urban areas
- Allow real-time consumption monitoring
- Enable TOU pricing and accurate readings for private suppliers (the supplier needs interval data, not a monthly estimate)
- Check eligibility at iec.co.il, call **103** (also reachable as 055-7000103 for SMS / WhatsApp), or use the IEC app
- Self-paid expedited installation (~260 ILS) is available where IEC has not yet deployed in the area, with typical wait of 2-12 weeks

**Monitoring tools:**
- IEC app (available on iOS and Android): view real-time consumption, billing history, and payment options
- Home energy monitors: third-party devices that clip onto your electrical panel
- Solar system monitors: SolarEdge, Enphase apps for solar panel owners

**Benefits of smart meters:**
- See exactly when you consume the most electricity
- Identify energy-wasting appliances
- Optimize consumption patterns for TOU savings
- Receive alerts for unusual consumption (potential leaks or faulty appliances)

## Examples

### Example 1: Family Evaluating Solar Panels

User says: "We live in a house in Modi'in, pay about 800 ILS per month for electricity, and want to know if solar panels are worth it."

Actions:
1. Calculate approximate monthly consumption: 800 ILS / ~0.6432 ILS per kWh (Jan 2026 standard residential tariff inc. 18% VAT) = ~1,244 kWh per month
2. Determine system size needed: 1,244 * 12 / 1,600 (kWh per kWp in central Israel) = ~9.3 kWp; round to a 9-10 kWp system
3. Estimate system cost: 9.5 kWp * ~3,800 ILS per kWp = ~36,000 ILS turnkey (mid-range 2026 pricing; basic systems start lower, premium and battery-paired go higher)
4. Calculate annual savings: 800 * 12 = 9,600 ILS per year (assumes consumption matches production timing; net metering covers the timing gap)
5. Payback period: 36,000 / 9,600 = ~3.75 years
6. 25-year total savings: (9,600 * 25) - 36,000 = ~204,000 ILS (not accounting for panel degradation ~0.5%/year and tariff changes)
7. Check roof suitability: Modi'in gets good solar irradiance, verify south-facing roof availability and shading
8. Recommend getting 3 installer quotes; confirm whether the quote uses the legacy net-metering hesder (decision 1573, ~0.48 ILS/kWh export) or the newer two-track proposal (~0.60 ILS/kWh for first 5 years then ~0.38 ILS/kWh for installations up to 30 kW). The export tariff is lower than the consumption rate either way, so self-consumption beats export.
9. Check with the municipality for any heter bniya requirements for roof modifications

Result: User receives a detailed ROI analysis showing that solar panels would pay for themselves in approximately 4 years with total savings exceeding 200,000 ILS over the system lifetime, making it a strong investment.

### Example 2: Comparing Utility Costs Between Cities for Relocation

User says: "I'm deciding between moving to Beer Sheva or Haifa. What's the difference in utility costs for a 100 sqm apartment, family of 4?"

Actions:
1. Compare arnona rates:
   - Beer Sheva: approximately 350-480 ILS/month for 100 sqm residential
   - Haifa: approximately 480-630 ILS/month for 100 sqm residential
   - Difference: approximately 130-150 ILS/month in favor of Beer Sheva
2. Compare water costs:
   - Both cities use tiered pricing, rates similar at the national level
   - Check specific water corporation surcharges (Mei Haifa vs. Beer Sheva water corp)
   - Family of 4: approximately 14 m3/month Tier 1 allocation
3. Compare electricity:
   - IEC rates are national (same everywhere)
   - Beer Sheva: higher AC costs in summer (desert climate), but better solar potential
   - Haifa: more moderate climate, lower summer cooling costs
4. Compare gas: similar pricing nationally, both cities have balloon gas and some natural gas
5. Calculate total annual utility difference:
   - Arnona savings in Beer Sheva: ~1,560-1,800 ILS/year
   - Electricity may be slightly higher in Beer Sheva due to cooling
   - Net annual savings in Beer Sheva: ~1,000-1,500 ILS/year on utilities
6. Note: Beer Sheva has significantly lower housing costs which compounds the savings

Result: User receives a side-by-side comparison showing that Beer Sheva is approximately 1,000-1,500 ILS per year cheaper on utilities (mainly arnona), plus significantly cheaper housing, while Haifa offers more moderate climate with lower cooling costs.

### Example 3: Optimizing Electricity Bill with Smart Meter

User says: "I just got a smart meter installed. My bill is 600 ILS/month. How can I reduce it?"

Actions:
1. Recommend switching from standard tariff to TOU (time-of-use) tariff
2. Analyze typical household consumption patterns:
   - Identify high-consumption appliances: AC, water heater (if electric), dryer, oven
   - Estimate what percentage of consumption can shift to off-peak hours
3. Create an optimization plan:
   - Run washing machine and dryer after 23:00 or on Shabbat (off-peak)
   - Use dishwasher timer for off-peak operation
   - Pre-cool home before peak hours in summer
   - Switch electric water heater timer to heat during off-peak (if applicable)
4. Calculate potential savings:
   - If 40% of consumption shifts from peak to off-peak: savings of approximately 15-20%
   - 600 * 0.17 = ~100 ILS/month potential savings
5. Recommend IEC app for monitoring real-time consumption
6. Suggest additional measures: LED bulbs, AC at 24-25 degrees, unplug standby devices

Result: User receives a practical action plan for shifting consumption to off-peak hours, with estimated monthly savings of 80-120 ILS, plus an ongoing monitoring strategy using the IEC app.

## Gotchas
- Israel Electric Corporation rates reset quarterly via Electricity Authority decisions; the Jan 2026 update added +1.5% over 2025. Agents may use outdated rates from a previous quarter. Always verify the current tariff at pua.gov.il before quoting per-kWh numbers.
- The TOU (tariff TOZ / תעו"ז) schedule has only two tiers since April 2023: peak (שיא) and off-peak (שפל). The former שלב הגבע (shoulder) tier was eliminated. Agents trained on older docs may still describe a 3-tier structure with a middle band.
- Switching to an alternate electricity supplier (Cellcom Energy, Pazgas, OPC, etc.) only discounts the generation component, which is roughly 60-70% of the bill. The household still pays IEC for distribution, transmission, the public broadcasting fee, and meter charges. Agents may incorrectly imply the entire bill changes.
- Water Tier 1 covers up to 3.5 m³ per registered nefesh per month at the lower rate; consumption above goes to Tier 2 (~84% higher in Jan 2026: 8.508 vs 15.623 ILS/m³ inc. VAT). Sewage is bundled into the regulated per-m³ tariff in most municipalities, NOT a separate percentage surcharge as some older guides describe.
- Israeli utility bills include 18% VAT (raised from 17% on 1 Jan 2025; the 2026 increase to 19% was rejected by the cabinet in Dec 2025). Be explicit about whether quoted prices include or exclude VAT, especially when comparing alternate-supplier offers, since some advertise the pre-VAT generation rate.
- The Olim Hadashim arnona discount is 90% on up to 100 sqm for 12 months out of the 24 months following aliyah registration, NOT yearly. Agents may incorrectly describe it as multi-year (e.g., "90% first year, 10% years 2-5"). Disabled olim recognized by Bituach Leumi get up to 80% indefinitely under a separate provision.
- The IEC customer-service number is **103** (also 055-7000103 for SMS/WhatsApp). The legacy `*2730` short code is no longer in use; agents that emit it will send users to a dead number.
- **Solar export tariff.** The legacy net-metering surplus tariff (decision 1573) for residential rooftop is ~0.48 ILS/kWh fixed for 25 years. The 2025 two-track proposal would pay ~0.60 ILS/kWh for the first 5 years then ~0.38 ILS/kWh (installations up to 30 kW, higher band for the first 15 kW only). Older docs sometimes quote ~0.21 ILS/kWh, that figure is not the current residential rate. Always quote the contract's actual hesder line.
- **Cellular and internet "promo expiry".** Most plans advertise a low introductory price (often X NIS for 12 months) that doubles or more after the promo period. Agents that quote the intro price as the "real" monthly cost will mislead the user. Always check the תקנון for "מחיר לאחר תום תקופת המבצע".
- **Number portability is free, fast, and no-paperwork.** Suggesting users "cancel first then sign up new" is wrong, they should sign with the new provider, who handles portability in ~1 business day. Cancelling first creates a service gap.

## Reference Links

| Source | URL | What to Check |
|--------|-----|---------------|
| Electricity Authority (PUA) | https://www.gov.il/he/departments/electricity_authority | Current half-yearly electricity tariffs, TOU schedules, regulatory updates |
| 2026 tariff book (official PDF) | https://www.gov.il/BlobFolder/generalpage/tarriffbook/he/Files_netunei_hasmal_sefer_tariff_01_2026.pdf | Full Jan 2026 tariff tables, all categories |
| Israel Electric Corporation | https://www.iec.co.il | Residential tariff plans, smart meter rollout, consumption monitoring |
| IEC TOU low-voltage tariffs | https://www.iec.co.il/content/tariffs/contentpages/taozb-namuch | Current peak/off-peak schedules for residential customers |
| Water Authority | https://www.gov.il/he/departments/water_authority | Tiered water rates, household allocation, municipal corporations |
| Water tariff book (Jan 2026) | https://www.gov.il/he/pages/rates_general1 | Full water + sewage tariff tables and updates |
| Natural Gas Authority | https://www.gov.il/he/departments/natural_gas_authority | Consumer gas pricing, supplier list, connection rules |
| LPG cooking gas comparator (Energy Ministry) | https://migdal-webpages.energy-apps.org/gpmCalculator | Compare LPG cooking-gas tariffs by locality and supplier |
| Ministry of Communications | https://www.gov.il/he/departments/ministry_of_communications | Cellular and internet regulation, complaints, supplier list |
| Kolzchut, senior electricity discount | https://www.kolzchut.org.il/he/הנחה_בחשבון_חשמל_למקבלי_קצבת_זיקנה_עם_השלמת_הכנסה | 50% (proposed 65%) discount up to 400 kWh/month for seniors + income supplement |
| Arnona property tax rates | https://www.gov.il/he/service/arnona-payment | Municipal arnona tariffs and discount eligibility |
| Kolzchut, olim arnona discount | https://www.kolzchut.org.il/he/הנחה_בארנונה_לעולים_חדשים | Exact eligibility window (12 months out of 24), 100 sqm cap, special-needs olim rules |
| Kolzchut, senior arnona discount | https://www.kolzchut.org.il/he/הנחה_בארנונה_לאזרחים_ותיקים | Senior age threshold (women 62 / men 67), income tests, discount tiers |

## Troubleshooting

### Error: "My electricity bill seems much higher than expected for my consumption level"

Cause: Several factors can cause unexpectedly high bills: billing estimate rather than actual meter reading (hashavon based on ha'aracha instead of kri'a), a faulty meter, electric water heater (dud hashmal) running inefficiently, or an AC unit consuming more than expected due to poor insulation or maintenance. Some households also don't realize they're being billed for common area electricity in apartment buildings (hashmal klalit).

Solution: Check if the bill shows an actual reading (kri'at moné) or an estimate (ha'aracha). If estimated, request an actual reading from IEC. Compare the meter reading on your bill with the physical meter. If consumption seems genuinely high, check for: electric water heater on during peak hours (dud hashmal timer), AC filters that need cleaning (dirty filters increase consumption by 15-20%), old refrigerator (replacing a 15+ year old unit saves ~30%), and phantom loads from devices on standby. Install the IEC app to monitor real-time consumption and identify spikes.

### Error: "Water bill shows consumption much higher than our actual usage"

Cause: The most common cause is an internal leak, often in a toilet that runs continuously (difficult to notice) or an underground pipe leak. Other causes include: meter reading error, unregistered nefashot (household members) putting more consumption into the expensive Tier 2, or building-wide meter issues in shared buildings.

Solution: Check for toilet leaks by adding food coloring to the tank and waiting 15 minutes without flushing; if color appears in the bowl, there's a leak. Check your most recent bill for nefashot count and verify all family members are registered with your water corporation. Read your water meter before bed and again in the morning without using any water; if the reading changed, you have a leak. Contact your water corporation to request a meter accuracy test (they are required to provide this). If a hidden leak is confirmed, you may be eligible for a bill adjustment (ha'aracha mechudeshét) for the leaked water.

### Error: "I can't find the TOU (time-of-use) tariff option for my account"

Cause: TOU pricing requires a smart meter (moné chokhéakh), which not all households have yet. IEC is rolling out smart meters gradually, and some areas haven't been covered yet. Additionally, some older electrical panel configurations may need upgrades to support smart meter installation.

Solution: Call IEC customer service at **103** (or send SMS / WhatsApp to 055-7000103) or check iec.co.il to verify if your area is eligible for smart meter installation. If eligible, request installation (free of charge from IEC). Installation typically takes 2-4 weeks from request. Once installed, contact IEC to switch your tariff plan from standard to TOU. Note that TOU is only beneficial if you can shift significant consumption to off-peak hours; if your consumption is already mostly during off-peak times (work from home at night, Shabbat observer), the savings will be greater. If you can't shift consumption, the standard tariff may actually be cheaper since TOU peak rates are higher than the standard flat rate.

### Error: "Arnona rate on my bill doesn't match the published municipal tariff"

Cause: Arnona calculations can be confusing because the published rate per sqm may not include additions like special area surcharges (tosefet ezor), stairwell charges (misparim klalit), shared area allocations, or adjustments for semi-enclosed spaces (mirpesot, mamadim) that are measured at partial rates. Some municipalities also have different rates for different floors or building ages.

Solution: Request a detailed arnona calculation breakdown (pirutt chishuv arnona) from your municipality's arnona department. Verify the property size they have on file matches your actual measured area (sometimes construction records have errors). Check if enclosed balconies (mirpeset sugéret) are being charged at full rate or partial rate (typically 60-75% of full rate for semi-enclosed spaces). The mamad (safe room) is usually charged at full rate if it's a standard room but verify this. If you believe there's an error, file a formal objection (hassaga) within 90 days of receiving the bill. You can also request a municipal surveyor to re-measure your property.

### Error: "My cellular bill jumped after the promo period and I want out"

Cause: Most Israeli cellular plans advertise a low introductory price (e.g., 19 NIS/month) for 12 or 24 months, then automatically escalate to the standard rate (often 50-100% higher) once the promo expires. The תקנון discloses this but most customers miss it.

Solution: You can switch providers at any time, there is **no fixed term and no cancellation fee** for "תוכנית ללא התחייבות" (no-commitment plans, which is most of the market). Sign up with a new provider (Rami Levy, Golan, 019, or a retention deal with your current MNO) and they will handle number portability automatically in about one business day. Do NOT cancel your current line first, sign the new one first and let portability handle the transfer to avoid a service gap. If you signed an "התחייבות" (commitment) plan, check the early-exit fee, but even with the fee, switching is often cheaper than continuing at the post-promo price.

### Error: "I have separate Bezeq + ISP bills and want to consolidate to a single fiber bill"

Cause: Many households still have the legacy split-bill model: one bill from the infrastructure operator (Bezeq for copper/fiber, HOT for cable) and a second bill from the ISP / "ספק" (Bezeq Beinleumi, Cellcom, Partner, 013/Netvision, 014, 018 Xfone, Triple-C, Rimon). This was the only option before the wholesale-market reform; today most consumers can collapse it into a single bill.

Solution: Pick a wholesale-market bundle from any of the four infrastructure operators (Bezeq BFiber, HOT, IBC/Unlimited, Cellcom/Partner-built fiber) or from an ISP that resells over wholesale ("שוק סיטונאי"). The new provider takes care of cancellation with the old infrastructure and old ISP, swaps the ONT/router (you may keep your own if compatible), and starts billing as a single line. Expected price drop: 20-40 NIS/month. If your address still has only ADSL on copper, check the fiber coverage maps, fiber coverage in 2026 reaches >90% of Israeli households and the upgrade is typically free for a new contract.
