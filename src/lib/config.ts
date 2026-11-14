export const FREE_INVOICE_LIMIT = 3;

export const STARTER_PRICE_CENTS = 79900;
export const STARTER_PRICE_CURRENCY = "INR";

export const PLAN_LABELS = {
  free: "Free",
  starter: "Starter",
} as const;

// Kept in the environment, not in source: a personal VPA in a public repository
// is a privacy leak and invites spam.
export const platformUpiId = () => process.env.PLATFORM_UPI_ID || "";
export const platformUpiName = () => process.env.PLATFORM_UPI_NAME || "InvoicePilot";
