#!/usr/bin/env python3
"""
Rough refund estimator for Israeli salaried employees.

Given total taxable salary, total tax withheld (sum of field 042 across all
Form 106 documents for the year), and detected refund triggers, produce a
ballpark estimate range. NOT a binding calculation. The Tax Authority's
real review may differ once supporting documents are evaluated.

Usage:
    python estimate_refund.py --year 2026 --salary 282000 --withheld 47200 \
        --points 2.75 --miluim-days 0 --donations 0 --yishuv-pct 0

Defaults reflect 2026 figures published by Kol-Zchut as of 2026-05-12.
For prior tax years, pass --year and the script will pick the matching
brackets it knows about. Years it does not know about fall back to 2026
brackets with a warning.
"""
from __future__ import annotations
import argparse
import sys
from dataclasses import dataclass

# 2026 monthly tax brackets per Kol-Zchut "מדרגות מס הכנסה".
# Top employment bracket per Section 121 ITO is 47%. Mas yesafim (Section 121B)
# is a separate 3% surtax modeled in surtax() below — do NOT bake it into the
# bracket table or it double-counts for high earners.
BRACKETS_2026_MONTHLY = [
    (7010, 0.10),
    (10060, 0.14),
    (19000, 0.20),
    (25100, 0.31),
    (46690, 0.35),
    (float("inf"), 0.47),
]
SURTAX_ANNUAL_THRESHOLD_2026 = 721560
SURTAX_RATE_2026 = 0.03

CREDIT_POINT_VALUE_ANNUAL_2026 = 2904
SECTION_46_MIN_2026 = 207
SECTION_46_CREDIT_RATE = 0.35
SECTION_46_CEILING_2026 = 10354816


@dataclass
class RefundEstimate:
    tax_due_estimate: float
    tax_withheld: float
    refund_low: float
    refund_high: float
    notes: list[str]


def annual_tax_under_brackets(taxable_annual: float, brackets_monthly: list[tuple[float, float]]) -> float:
    """Tax due assuming bracket thresholds are MONTHLY (Israeli convention).

    Convert brackets to annual by multiplying thresholds by 12 and apply.
    """
    remaining = max(taxable_annual, 0.0)
    tax = 0.0
    prev_threshold_annual = 0.0
    for monthly_threshold, rate in brackets_monthly:
        annual_threshold = monthly_threshold * 12 if monthly_threshold != float("inf") else float("inf")
        slice_width = max(0.0, annual_threshold - prev_threshold_annual)
        slice_used = min(remaining, slice_width)
        tax += slice_used * rate
        remaining -= slice_used
        prev_threshold_annual = annual_threshold
        if remaining <= 0:
            break
    return tax


def surtax(taxable_annual: float, year: int) -> float:
    # Section 121B ITO — mas yesafim 3% on annual income above 721,560 ₪.
    # Applies on top of the regular 47% top bracket for very high earners.
    if year >= 2026 and taxable_annual > SURTAX_ANNUAL_THRESHOLD_2026:
        return (taxable_annual - SURTAX_ANNUAL_THRESHOLD_2026) * SURTAX_RATE_2026
    return 0.0


def estimate(
    year: int,
    salary_annual: float,
    withheld_annual: float,
    points: float,
    miluim_points_bonus: float,
    donations_annual: float,
    yishuv_pct: float,
) -> RefundEstimate:
    notes: list[str] = []
    if year != 2026:
        notes.append(
            f"Year {year}: estimator is using the 2026 bracket table. "
            "For prior tax years, verify the brackets for that year before relying on this number."
        )

    gross_tax = annual_tax_under_brackets(salary_annual, BRACKETS_2026_MONTHLY)
    gross_tax += surtax(salary_annual, year)

    total_points = points + miluim_points_bonus
    credit_value = total_points * CREDIT_POINT_VALUE_ANNUAL_2026

    donation_credit = 0.0
    if donations_annual >= SECTION_46_MIN_2026:
        eligible = min(donations_annual, SECTION_46_CEILING_2026, salary_annual * 0.30)
        donation_credit = eligible * SECTION_46_CREDIT_RATE

    yishuv_credit = 0.0
    if yishuv_pct > 0:
        yishuv_credit = max(0.0, gross_tax - credit_value - donation_credit) * (yishuv_pct / 100.0)
        notes.append(
            "Yishuv mezakeh credit applied as a flat percentage on tax after points and donations. "
            "Real calculation may cap at the annual NIS ceiling for that locality."
        )

    tax_due_estimate = max(0.0, gross_tax - credit_value - donation_credit - yishuv_credit)
    refund = withheld_annual - tax_due_estimate

    # Present as a +/- 10% range to convey uncertainty.
    band = abs(refund) * 0.10
    refund_low = refund - band
    refund_high = refund + band

    if refund < 0:
        notes.append("Estimate is NEGATIVE: the user appears to OWE additional tax, not be owed a refund.")
    elif refund < 200:
        notes.append("Refund under 200 ₪. Worth confirming, but the Tax Authority sometimes does not process tiny refunds quickly.")

    notes.append(
        "This is an estimate based on aggregate annual figures and standard brackets. "
        "The Tax Authority's calculation uses month-by-month withholding histories that "
        "this estimator does not see, and may differ."
    )

    return RefundEstimate(
        tax_due_estimate=tax_due_estimate,
        tax_withheld=withheld_annual,
        refund_low=refund_low,
        refund_high=refund_high,
        notes=notes,
    )


def main() -> int:
    parser = argparse.ArgumentParser(description="Estimate Israeli employee tax refund.")
    parser.add_argument("--year", type=int, default=2026, help="Tax year (default 2026).")
    parser.add_argument("--salary", type=float, required=True, help="Annual taxable salary in NIS (sum across all employers).")
    parser.add_argument("--withheld", type=float, required=True, help="Total tax withheld in NIS (sum of field 042 across all Form 106 documents).")
    parser.add_argument("--points", type=float, default=2.25, help="Base credit points for the year (default 2.25 = Israeli resident male; female resident gets 2.75; add child/oleh/single-parent/Section 39B miluim points separately).")
    parser.add_argument("--miluim-days", type=int, default=0, help="Reserve duty days served in the prior tax year.")
    parser.add_argument("--donations", type=float, default=0.0, help="Total Section 46 donations in NIS.")
    parser.add_argument("--yishuv-pct", type=float, default=0.0, help="Yishuv mezakeh percentage (0 if not a resident of an eligible locality).")
    args = parser.parse_args()

    miluim_bonus = 0.0
    days = args.miluim_days
    if days >= 50:
        miluim_bonus = 1.0 + max(0, (days - 50) // 5) * 0.25
        miluim_bonus = min(miluim_bonus, 4.0)
    elif days >= 40:
        miluim_bonus = 0.75
    elif days >= 30:
        miluim_bonus = 0.5

    result = estimate(
        year=args.year,
        salary_annual=args.salary,
        withheld_annual=args.withheld,
        points=args.points,
        miluim_points_bonus=miluim_bonus,
        donations_annual=args.donations,
        yishuv_pct=args.yishuv_pct,
    )

    print(f"Year: {args.year}")
    print(f"Annual salary: {args.salary:,.0f} ₪")
    print(f"Tax withheld (sum of field 042): {args.withheld:,.0f} ₪")
    print(f"Tax due estimate: {result.tax_due_estimate:,.0f} ₪")
    print(f"Estimated refund range: {result.refund_low:,.0f} - {result.refund_high:,.0f} ₪")
    if miluim_bonus > 0:
        print(f"Reserve duty bonus applied: {miluim_bonus} points = {miluim_bonus * CREDIT_POINT_VALUE_ANNUAL_2026:,.0f} ₪")
    print("\nNotes:")
    for n in result.notes:
        print(f"- {n}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
