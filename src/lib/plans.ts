export const PLAN_IDS = ["free", "starter", "growth"] as const;
export type PlanId = (typeof PLAN_IDS)[number];
export type BillingInterval = "monthly" | "annual";

export type PlanFeature =
  | "automatedReminders"
  | "hostedCheckout"
  | "customTemplates"
  | "whiteLabel";

export interface PlanDefinition {
  label: string;
  tagline: string;
  monthlyCents: number;
  annualCents: number; // 2 months free against the monthly rate
  invoiceLimit: number; // Infinity = unlimited
  automatedReminders: boolean;
  hostedCheckout: boolean;
  customTemplates: boolean;
  whiteLabel: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    label: "Free",
    tagline: "The first three invoices, chased by hand.",
    monthlyCents: 0,
    annualCents: 0,
    invoiceLimit: 3,
    automatedReminders: false,
    hostedCheckout: false,
    customTemplates: false,
    whiteLabel: false,
  },
  starter: {
    label: "Starter",
    tagline: "Automation for the monthly chaser.",
    monthlyCents: 79900,
    annualCents: 799000,
    invoiceLimit: Infinity,
    automatedReminders: true,
    hostedCheckout: true,
    customTemplates: true,
    whiteLabel: false,
  },
  growth: {
    label: "Growth",
    tagline: "The whole AR desk, on your brand.",
    monthlyCents: 199900,
    annualCents: 1999000,
    invoiceLimit: Infinity,
    automatedReminders: true,
    hostedCheckout: true,
    customTemplates: true,
    whiteLabel: true,
  },
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && (PLAN_IDS as readonly string[]).includes(value);
}

// Anything the database has not heard of behaves like Free.
export function planDefinition(plan: string | null | undefined): PlanDefinition {
  return isPlanId(plan) ? PLANS[plan] : PLANS.free;
}

export function isPaidPlan(plan: string | null | undefined): boolean {
  return plan === "starter" || plan === "growth";
}

export function planAllows(plan: string | null | undefined, feature: PlanFeature): boolean {
  return planDefinition(plan)[feature];
}

export function invoiceLimitFor(plan: string | null | undefined): number {
  return planDefinition(plan).invoiceLimit;
}

export function checkoutAmountCents(plan: PlanId, interval: BillingInterval): number {
  const def = PLANS[plan];
  return interval === "annual" ? def.annualCents : def.monthlyCents;
}

export function renewalDaysFor(interval: BillingInterval): number {
  return interval === "annual" ? 365 : 30;
}

export function formatPrice(cents: number): string {
  return `₹${(cents / 100).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}
