import { minorUnitsToDecimalString } from "@/lib/currency";

type UpiArgs = {
  vpa: string;
  name: string | null;
  amountCents: number;
  currency: string;
  note: string;
};

/**
 * Builds a UPI intent URI that any Indian UPI app can open. Returns null for
 * currencies UPI cannot settle.
 */
export function buildUpiUri({ vpa, name, amountCents, currency, note }: UpiArgs) {
  if (currency.toUpperCase() !== "INR") return null;

  const params = [
    ["pa", vpa],
    ["pn", name || vpa],
    ["am", minorUnitsToDecimalString(amountCents)],
    ["cu", "INR"],
    ["tn", note.slice(0, 50)],
  ]
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return `upi://pay?${params}`;
}
