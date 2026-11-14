import Link from "next/link";

export const metadata = {
  title: "Features",
  description:
    "Reminder sequences, an AR aging dashboard, public pay pages, client records, and CSV import. The follow-up tools a freelancer actually uses.",
};

const groups = [
  {
    label: "Follow-up",
    items: [
      {
        t: "A five-step sequence",
        d: "A heads-up three days before the due date, a note on the day, then follow-ups at day three, seven, and fourteen. Every offset is editable.",
      },
      {
        t: "Tone per client",
        d: "Friendly, firm, or final. Set it once on the client record and every reminder to that client uses it.",
      },
      {
        t: "Stops on payment",
        d: "Mark the invoice paid and the remaining reminders cancel. Nothing sends to a client who has already paid.",
      },
      {
        t: "Manual send",
        d: "Write the next note yourself when the situation needs your own words. The sequence resumes on its schedule.",
      },
    ],
  },
  {
    label: "The money",
    items: [
      {
        t: "AR aging",
        d: "Current, 1–15, 16–30, 31–60, and 60+ days, with a total outstanding figure at the top of the dashboard.",
      },
      {
        t: "Client history",
        d: "Every invoice you have sent a client, with the amount, the due date, and what happened next.",
      },
      {
        t: "Multi-currency",
        d: "Invoice in USD, EUR, GBP, CAD, or AUD. Amounts are formatted in the currency you set on the invoice.",
      },
      {
        t: "Overdue at a glance",
        d: "Overdue totals and counts sit next to outstanding, so the number that needs attention is not buried.",
      },
    ],
  },
  {
    label: "The client side",
    items: [
      {
        t: "Public pay page",
        d: "One link per invoice. No account, no download. Your client sees the amount, the due date, the line items, and your payment instructions.",
      },
      {
        t: "Claim, then confirm",
        d: "The client can say they have paid. The invoice moves to claimed and reminders stop. Only you can mark it paid.",
      },
      {
        t: "Your payment method",
        d: "InvoicePilot does not process payments. Put your bank details or payment instructions in the invoice notes, and keep collecting the way you do now.",
      },
    ],
  },
  {
    label: "Your data",
    items: [
      {
        t: "CSV import",
        d: "Bring your existing invoices in one file. Map the columns once and the rows land in the dashboard.",
      },
      {
        t: "CSV export",
        d: "Take the whole book out whenever you want, formatted for a spreadsheet or your accountant.",
      },
      {
        t: "Delete the account",
        d: "Settings has a delete button. It removes the account and the data that belongs to it.",
      },
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div className="mx-auto w-full max-w-[1200px] px-6 md:px-10">
      <header className="border-b border-rule py-16 md:py-24">
        <div className="flex items-center gap-3">
          <span className="h-px w-7 bg-ink" aria-hidden="true" />
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">Features</p>
        </div>
        <h1 className="mt-6 max-w-[22ch] font-display text-[clamp(2.5rem,5.6vw,4.4rem)] leading-[0.95] tracking-[-0.02em]">
          Everything the follow-up needs. Nothing else.
        </h1>
        <div className="mt-8 grid gap-6 md:grid-cols-12">
          <p className="max-w-[48ch] text-[15px] leading-[1.7] text-muted md:col-span-6">
            InvoicePilot is not an invoicing tool and it is not a payment processor. It
            reads your invoices, sends the reminders, and shows you what is still owed.
          </p>
          <p className="max-w-[44ch] text-[13px] leading-relaxed text-muted md:col-span-5 md:col-start-8 md:self-end">
            If your invoicing already works, keep it. Add the invoices here and let the
            follow-up happen without you.
          </p>
        </div>
      </header>

      {groups.map((group) => (
        <section key={group.label} className="border-b border-rule py-14 md:py-16">
          <div className="grid gap-8 md:grid-cols-12 md:gap-10">
            <div className="md:col-span-3">
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                {group.label}
              </p>
            </div>
            <div className="grid gap-x-10 gap-y-8 md:col-span-9 md:grid-cols-2">
              {group.items.map((item) => (
                <div key={item.t} className="border-t border-rule pt-4">
                  <h2 className="text-[14px] font-medium text-ink">{item.t}</h2>
                  <p className="mt-2 max-w-[42ch] text-[13px] leading-relaxed text-muted">
                    {item.d}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}

      <section className="py-16 md:py-20">
        <div className="grid gap-8 md:grid-cols-12">
          <div className="md:col-span-5">
            <h2 className="font-display text-[clamp(1.9rem,3.6vw,2.75rem)] leading-[1] tracking-[-0.015em]">
              What it does not do
            </h2>
          </div>
          <ul className="md:col-span-6 md:col-start-7">
            {[
              "It does not create invoices for you. Add them by hand or import a CSV.",
              "It does not process payments or hold your money.",
              "It does not take a percentage of anything you collect.",
            ].map((line) => (
              <li
                key={line}
                className="border-t border-rule py-4 text-[13px] leading-relaxed text-muted last:border-b"
              >
                {line}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center bg-ink px-5 text-[13px] font-medium text-paper transition-colors hover:bg-ink-soft"
          >
            Start free
          </Link>
          <Link
            href="/pricing"
            className="text-[13px] text-ink underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
          >
            See pricing
          </Link>
        </div>
      </section>
    </div>
  );
}
