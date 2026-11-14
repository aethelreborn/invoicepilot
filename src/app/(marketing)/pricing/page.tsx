import Link from "next/link";

export const metadata = {
  title: "Pricing",
  description:
    "Free for three invoices. Starter at seven hundred ninety-nine rupees a month or Growth at one thousand nine hundred ninety-nine — unlimited invoices, automated follow-up, hosted checkout. No transaction fees. Annual billing brings two months free.",
};

const plans = [
  {
    name: "Free",
    price: "₹0",
    period: "forever",
    line: "For the first invoices, chased by hand.",
    features: [
      "3 invoices",
      "Manual reminders",
      "Public pay pages",
      "AR aging dashboard",
      "Client records",
      "CSV import and export",
    ],
    cta: "Start free",
    dark: false,
  },
  {
    name: "Starter",
    price: "₹799",
    period: "per month",
    line: "For freelancers who send invoices every month.",
    features: [
      "Unlimited invoices",
      "Automated reminder sequence",
      "Custom reminder templates",
      "Hosted checkout (Razorpay, Stripe, YouPI)",
      "Annual billing at two months free",
    ],
    cta: "Start free",
    dark: true,
  },
  {
    name: "Growth",
    price: "₹1,999",
    period: "per month",
    line: "For the whole receivables desk, on your brand.",
    features: [
      "Everything in Starter",
      "White-label pay pages — your clients never see InvoicePilot",
      "Founder-led setup on your first invoice run",
      "Annual billing at two months free",
    ],
    cta: "Start free",
    dark: false,
  },
];

const rows: { label: string; free: string; starter: string; growth: string }[] = [
  { label: "Invoices", free: "3", starter: "Unlimited", growth: "Unlimited" },
  { label: "Reminders", free: "Manual", starter: "Automated sequence", growth: "Automated + custom templates" },
  { label: "Hosted checkout (Razorpay, Stripe, YouPI)", free: "—", starter: "Included", growth: "Included" },
  { label: "Public pay pages", free: "Included", starter: "Included", growth: "Included" },
  { label: "Brand on pay page", free: "InvoicePilot", starter: "InvoicePilot", growth: "Yours only" },
  { label: "Custom reminder templates", free: "—", starter: "Included", growth: "Included" },
  { label: "Client payment claims + OTP", free: "Included", starter: "Included", growth: "Included" },
  { label: "AR aging dashboard", free: "Included", starter: "Included", growth: "Included" },
  { label: "Client records", free: "Included", starter: "Included", growth: "Included" },
  { label: "CSV import & export", free: "Included", starter: "Included", growth: "Included" },
  { label: "Annual billing", free: "—", starter: "2 months free", growth: "2 months free" },
  { label: "Email support", free: "—", starter: "Included", growth: "Included" },
  { label: "Transaction fees", free: "0%", starter: "0%", growth: "0%" },
];

export default function PricingPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
      <header className="border-b border-rule py-16 md:py-24">
        <div className="flex items-center gap-3">
          <span className="h-px w-7 bg-ink" aria-hidden="true" />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Pricing</p>
        </div>
        <h1 className="mt-6 max-w-[20ch] font-display text-[clamp(2.5rem,5.6vw,4.4rem)] leading-[0.95] tracking-[-0.02em]">
          Three plans. One flat price.
        </h1>
        <p className="mt-6 max-w-[52ch] text-[15px] leading-[1.7] text-muted">
          You keep every cent you collect. InvoicePilot charges for the software and takes
          nothing from the invoices themselves.
        </p>
      </header>

      <section className="grid gap-5 py-14 sm:grid-cols-2 lg:grid-cols-3 md:py-16">
        {plans.map((p) => (
          <div
            key={p.name}
            className={`flex flex-col p-7 md:p-9 ${
              p.dark ? "bg-ink text-paper" : "border border-rule bg-card"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h2 className={`text-[14px] font-medium ${p.dark ? "text-paper" : "text-ink"}`}>
                {p.name}
              </h2>
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.16em] ${
                  p.dark ? "text-paper/60" : "text-muted"
                }`}
              >
                {p.period}
              </span>
            </div>

            <p
              className={`mt-6 font-display text-[3.75rem] leading-none tracking-[-0.02em] ${
                p.dark ? "text-paper" : "text-ink"
              }`}
            >
              {p.price}
            </p>
            <p className={`mt-2 text-[12px] ${p.dark ? "text-paper/60" : "text-muted"}`}>
              {p.line}
            </p>

            <ul className={`mt-8 border-t ${p.dark ? "border-[#3a382f]" : "border-rule"}`}>
              {p.features.map((f) => (
                <li
                  key={f}
                  className={`border-b py-2.5 text-[12px] ${
                    p.dark ? "border-[#3a382f] text-paper/85" : "border-rule text-ink-soft"
                  }`}
                >
                  {f}
                </li>
              ))}
            </ul>

            <div className="flex-1" />

            <Link
              href="/signup"
              className={`mt-8 flex h-10 items-center justify-center text-[12px] font-medium transition-colors ${
                p.dark
                  ? "bg-paper text-ink hover:bg-white"
                  : "border border-ink text-ink hover:bg-ink hover:text-paper"
              }`}
            >
              {p.cta}
            </Link>
          </div>
        ))}
      </section>

      <p className="border-t border-rule py-4 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
        Annual billing: ₹7,990 Starter · ₹19,990 Growth — two months free. No transaction fees on any plan.
      </p>

      <section className="border-t border-rule py-14 md:py-16">
        <h2 className="font-display text-[clamp(1.8rem,3.4vw,2.5rem)] leading-[1] tracking-[-0.015em]">
          Plan by plan
        </h2>

        <div className="mt-8 hidden border border-rule md:block">
          <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-rule bg-paper-deep">
            <span className="px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              Included
            </span>
            <span className="border-l border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              Free
            </span>
            <span className="border-l border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              Starter
            </span>
            <span className="border-l border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
              Growth
            </span>
          </div>
          {rows.map((r) => (
            <div
              key={r.label}
              className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-rule text-[12px] last:border-b-0 even:bg-card"
            >
              <span className="px-5 py-3 text-ink-soft">{r.label}</span>
              <span className="border-l border-rule px-5 py-3 text-muted">{r.free}</span>
              <span className="border-l border-rule px-5 py-3 text-ink">{r.starter}</span>
              <span className="border-l border-rule px-5 py-3 text-ink">{r.growth}</span>
            </div>
          ))}
        </div>

        <div className="mt-8 border border-rule md:hidden">
          <div className="grid grid-cols-3 border-b border-rule bg-paper-deep">
            <span className="px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Free
            </span>
            <span className="border-l border-rule px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Starter
            </span>
            <span className="border-l border-rule px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Growth
            </span>
          </div>
          {rows.map((r) => (
            <div key={r.label} className="border-b border-rule last:border-b-0">
              <p className="bg-paper-deep px-4 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                {r.label}
              </p>
              <div className="grid grid-cols-3">
                <div className="px-3 py-2.5 text-[11px] text-ink-soft">{r.free}</div>
                <div className="border-l border-rule px-3 py-2.5 text-[11px] text-ink">
                  {r.starter}
                </div>
                <div className="border-l border-rule px-3 py-2.5 text-[11px] text-ink">
                  {r.growth}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-rule py-14 md:py-16">
        <div className="grid gap-8 md:grid-cols-12">
          <h2 className="font-display text-[clamp(1.7rem,3vw,2.25rem)] leading-[1.05] tracking-[-0.015em] md:col-span-4">
            Billing questions
          </h2>
          <div className="md:col-span-7 md:col-start-6">
            {[
              {
                q: "Is there a contract?",
                a: "No. Starter and Growth are month to month. You can cancel at any time — paid plans lapse back to Free when they renew.",
              },
              {
                q: "Do you take a percentage?",
                a: "No. There are no transaction fees on either plan. You collect through your own payment method.",
              },
              {
                q: "Can I change plans later?",
                a: "Yes. Start on Free, and move to Starter or Growth when three invoices is no longer enough. Upgrades take effect once the platform verifies your UTR.",
              },
            ].map((f) => (
              <details key={f.q} className="group border-t border-rule last:border-b">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-4 text-[13px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <span className="shrink-0 font-mono text-[16px] font-normal leading-none text-muted transition-transform duration-200 group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="max-w-[58ch] pb-4 text-[12px] leading-relaxed text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center bg-ink px-5 text-[13px] font-medium text-paper transition-colors hover:bg-ink-soft"
          >
            Start free
          </Link>
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            Prices in INR - no card for the free plan
          </p>
        </div>
      </section>
    </div>
  );
}
