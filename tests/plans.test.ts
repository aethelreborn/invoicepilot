import { describe, expect, it } from "vitest";
import {
  PLANS,
  checkoutAmountCents,
  formatPrice,
  invoiceLimitFor,
  isPaidPlan,
  planAllows,
  planDefinition,
  renewalDaysFor,
} from "@/lib/plans";

describe("plan definitions", () => {
  it("annual price is two months free against the monthly rate", () => {
    for (const plan of [PLANS.starter, PLANS.growth]) {
      expect(plan.annualCents).toBe(plan.monthlyCents * 10);
    }
  });

  it("free plan has a finite invoice limit, paid plans do not", () => {
    expect(invoiceLimitFor("free")).toBe(3);
    expect(invoiceLimitFor("starter")).toBe(Infinity);
    expect(invoiceLimitFor("growth")).toBe(Infinity);
  });

  it("unknown plans behave like Free", () => {
    expect(planDefinition("enterprise-ish")).toBe(PLANS.free);
    expect(planDefinition(null)).toBe(PLANS.free);
    expect(planAllows("enterprise-ish", "automatedReminders")).toBe(false);
    expect(planAllows(undefined, "hostedCheckout")).toBe(false);
  });

  it("gates the paid features", () => {
    expect(planAllows("free", "automatedReminders")).toBe(false);
    expect(planAllows("free", "hostedCheckout")).toBe(false);
    expect(planAllows("free", "customTemplates")).toBe(false);
    expect(planAllows("free", "whiteLabel")).toBe(false);

    expect(planAllows("starter", "automatedReminders")).toBe(true);
    expect(planAllows("starter", "hostedCheckout")).toBe(true);
    expect(planAllows("starter", "customTemplates")).toBe(true);
    expect(planAllows("starter", "whiteLabel")).toBe(false);

    expect(planAllows("growth", "whiteLabel")).toBe(true);
  });

  it("checkout amounts match the published prices", () => {
    expect(checkoutAmountCents("starter", "monthly")).toBe(79900);
    expect(checkoutAmountCents("starter", "annual")).toBe(799000);
    expect(checkoutAmountCents("growth", "monthly")).toBe(199900);
    expect(checkoutAmountCents("growth", "annual")).toBe(1999000);
  });

  it("renewal periods differ for annual", () => {
    expect(renewalDaysFor("monthly")).toBe(30);
    expect(renewalDaysFor("annual")).toBe(365);
  });

  it("isPaidPlan only accepts the two paid tiers", () => {
    expect(isPaidPlan("free")).toBe(false);
    expect(isPaidPlan("starter")).toBe(true);
    expect(isPaidPlan("growth")).toBe(true);
  });

  it("formatPrice renders whole rupees", () => {
    expect(formatPrice(79900)).toBe("₹799");
    expect(formatPrice(199900)).toBe("₹1,999");
  });
});
