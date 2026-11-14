export const CURRENCIES = [
  { code: "INR", label: "Indian rupee (₹)", locale: "en-IN" },
  { code: "USD", label: "US dollar ($)", locale: "en-US" },
  { code: "EUR", label: "Euro (€)", locale: "de-DE" },
  { code: "GBP", label: "Pound sterling (£)", locale: "en-GB" },
  { code: "AED", label: "UAE dirham (د.إ)", locale: "en-AE" },
  { code: "SGD", label: "Singapore dollar (S$)", locale: "en-SG" },
  { code: "AUD", label: "Australian dollar (A$)", locale: "en-AU" },
  { code: "CAD", label: "Canadian dollar (C$)", locale: "en-CA" },
  { code: "NZD", label: "New Zealand dollar (NZ$)", locale: "en-NZ" },
] as const;

export type CurrencyCode = (typeof CURRENCIES)[number]["code"];

const localeByCurrency = new Map<string, string>(
  CURRENCIES.map((currency) => [currency.code, currency.locale])
);

export function currencyLocale(code: string) {
  return localeByCurrency.get(code.toUpperCase()) || "en-US";
}

export function isSupportedCurrency(code: string) {
  return localeByCurrency.has(code.toUpperCase());
}

// All supported currencies have two decimal places, so one minor unit is 1/100.
export function formatMoney(cents: number, currency = "INR") {
  const code = currency.toUpperCase();
  return new Intl.NumberFormat(currencyLocale(code), {
    style: "currency",
    currency: code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function minorUnitsToDecimalString(cents: number) {
  return (cents / 100).toFixed(2);
}
