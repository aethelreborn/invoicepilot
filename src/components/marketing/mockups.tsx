import type { ReactNode } from "react";

const statusTone: Record<string, string> = {
  overdue: "border-stamp text-stamp",
  sent: "border-rule text-ink-soft",
  viewed: "border-rule text-muted",
  claimed: "border-ink text-ink",
  paid: "border-accent text-accent",
  draft: "border-rule text-muted",
};

function StatusTag({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${
        statusTone[status] ?? "border-rule text-muted"
      }`}
    >
      {status}
    </span>
  );
}

export function Frame({
  label,
  right = "invoicepilot.app",
  children,
  className = "",
}: {
  label: string;
  right?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`border border-rule bg-card ${className}`}>
      <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          {label}
        </span>
        <span className="font-mono text-[9px] text-muted">{right}</span>
      </div>
      {children}
    </div>
  );
}

export function DashboardMockup() {
  return (
    <Frame label="Invoices · All">
      <div className="flex items-center justify-between border-b border-rule px-5 py-3">
        <div className="flex items-center gap-4">
          <span className="text-[13px] font-medium">Invoices</span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:inline">
            Clients
          </span>
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-muted sm:inline">
            Settings
          </span>
        </div>
        <span className="bg-ink px-2.5 py-1 text-[11px] font-medium text-paper">
          New invoice
        </span>
      </div>

      <div className="grid grid-cols-3 divide-x divide-rule border-b border-rule">
        <Stat label="Outstanding" value="₹42,800.00" />
        <Stat label="Overdue" value="₹12,000.00" tone="stamp" />
        <Stat label="Paid this month" value="₹9,400.00" tone="accent" />
      </div>

      <div className="overflow-hidden">
        <div className="mx-auto grid grid-cols-[1.5fr_0.9fr_0.7fr] gap-3 border-b border-rule bg-paper-deep px-5 py-2 font-mono text-[8px] uppercase tracking-[0.16em] text-muted sm:grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.7fr]">
          <span>Invoice</span>
          <span className="hidden sm:block">Client</span>
          <span className="hidden sm:block">Due</span>
          <span className="text-right">Amount</span>
          <span className="text-right">Status</span>
        </div>
        {[
          {
            n: "INV-202611-1001",
            c: "Harbor & Pine",
            d: "3 Nov",
            a: "₹12,000.00",
            s: "overdue",
          },
          {
            n: "INV-202611-1002",
            c: "Kestrel Labs",
            d: "28 Nov",
            a: "₹30,800.00",
            s: "sent",
          },
          {
            n: "INV-202610-1003",
            c: "Harbor & Pine",
            d: "15 Oct",
            a: "₹9,400.00",
            s: "paid",
          },
        ].map((row, i) => (
          <div
            key={row.n}
            className={`grid grid-cols-[1.5fr_0.9fr_0.7fr] items-center gap-3 px-5 py-3 text-[11px] sm:grid-cols-[1.4fr_1fr_0.7fr_0.9fr_0.7fr] ${
              i > 0 ? "border-t border-rule" : ""
            }`}
          >
            <span className="font-mono tabular-nums text-ink">{row.n}</span>
            <span className="hidden truncate text-muted sm:block">{row.c}</span>
            <span className="hidden font-mono tabular-nums text-muted sm:block">{row.d}</span>
            <span className="text-right font-mono tabular-nums text-ink">{row.a}</span>
            <span className="flex justify-end">
              <StatusTag status={row.s} />
            </span>
          </div>
        ))}
      </div>
    </Frame>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "stamp" | "accent";
}) {
  const color =
    tone === "stamp" ? "text-stamp" : tone === "accent" ? "text-accent" : "text-ink";
  return (
    <div className="px-5 py-4">
      <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className={`mt-1.5 font-mono text-[17px] tabular-nums ${color}`}>{value}</p>
    </div>
  );
}

export function InvoiceMockup() {
  const steps = [
    { day: "T−3", label: "Friendly heads-up", state: "sent", when: "31 Oct" },
    { day: "T0", label: "Due today", state: "sent", when: "3 Nov" },
    { day: "T+3", label: "First follow-up", state: "sent", when: "6 Nov" },
    { day: "T+7", label: "Second follow-up", state: "queued", when: "in 2 days" },
    { day: "T+14", label: "Final notice", state: "waiting", when: "—" },
  ];

  return (
    <Frame label="Invoice · INV-202611-1001" right="overdue">
      <div className="grid gap-0 md:grid-cols-[1.25fr_1fr]">
        <div className="border-b border-rule p-5 md:border-b-0 md:border-r">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                Billed to
              </p>
              <p className="mt-1 text-[13px] font-medium">Harbor & Pine</p>
              <p className="text-[10px] text-muted">billing@harborandpine.com</p>
            </div>
            <StatusTag status="overdue" />
          </div>

          <div className="mt-5 space-y-2 border-t border-rule pt-4 text-[11px]">
            <div className="flex justify-between text-muted">
              <span>Website redesign</span>
              <span className="font-mono tabular-nums">1 × ₹12,000.00</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">₹12,000.00</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Tax</span>
              <span className="font-mono tabular-nums">₹0.00</span>
            </div>
            <div className="flex justify-between border-t border-rule pt-2 text-[12px] font-medium text-ink">
              <span>Total</span>
              <span className="font-mono tabular-nums">₹12,000.00</span>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <span className="bg-ink px-2.5 py-1 text-[10px] font-medium text-paper">
              Send reminder
            </span>
            <span className="border border-rule px-2.5 py-1 text-[10px] font-medium text-ink-soft">
              Mark paid
            </span>
            <span className="border border-rule px-2.5 py-1 text-[10px] font-medium text-ink-soft">
              Copy pay link
            </span>
          </div>
        </div>

        <div className="p-5">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
            Follow-ups
          </p>
          <ol className="mt-3 space-y-3">
            {steps.map((s) => (
              <li key={s.day} className="flex items-start gap-2.5">
                <span
                  className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${
                    s.state === "sent"
                      ? "bg-ink"
                      : s.state === "queued"
                        ? "border border-ink bg-transparent"
                        : "border border-rule bg-transparent"
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      className={`truncate text-[10px] ${
                        s.state === "waiting" ? "text-muted" : "text-ink-soft"
                      }`}
                    >
                      {s.label}
                    </span>
                    <span className="shrink-0 font-mono text-[9px] text-muted">{s.day}</span>
                  </div>
                  <p className="mt-0.5 font-mono text-[8px] uppercase tracking-[0.1em] text-muted">
                    {s.state === "sent" ? `sent ${s.when}` : s.state === "queued" ? `queued · ${s.when}` : "not scheduled"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-rule pt-3 text-[9px] leading-relaxed text-muted">
            The sequence pauses the moment the invoice is marked paid.
          </p>
        </div>
      </div>
    </Frame>
  );
}

export function PayMockup() {
  return (
    <Frame label="Pay page · public link" right="no login required">
      <div className="bg-paper-deep p-5 sm:p-7">
        <div className="mx-auto max-w-[330px] border border-rule bg-card p-5 doc-shadow">
          <div className="flex items-start justify-between border-b border-rule pb-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                Invoice
              </p>
              <p className="mt-1 font-mono text-[11px] tabular-nums">INV-202611-1001</p>
            </div>
            <StatusTag status="overdue" />
          </div>

          <div className="py-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
              Amount due
            </p>
            <p className="mt-1 font-mono text-[26px] tabular-nums text-ink">₹12,000.00</p>
            <p className="mt-1 text-[10px] text-muted">Website redesign · due 3 Nov 2026</p>
          </div>

          <div className="space-y-2 border-t border-rule pt-4">
            <div className="bg-ink px-3 py-2 text-center text-[11px] font-medium text-paper">
              {"I've paid this invoice"}
            </div>
          </div>

          <p className="mt-4 border-t border-rule pt-3 text-[9px] leading-relaxed text-muted">
            Payment instructions sit in the invoice notes. A claim notifies the freelancer;
            only they can mark the invoice paid.
          </p>
        </div>
      </div>
    </Frame>
  );
}

export function AgingTable() {
  const rows = [
    { label: "Current", value: "₹30,800.00", pct: 72 },
    { label: "1–15 days", value: "₹12,000.00", pct: 28 },
    { label: "16–30 days", value: "₹0.00", pct: 0 },
    { label: "31–60 days", value: "₹0.00", pct: 0 },
    { label: "60+ days", value: "₹0.00", pct: 0 },
  ];
  return (
    <div className="border border-rule bg-card">
      <div className="flex items-center justify-between border-b border-rule px-4 py-2.5">
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          AR aging
        </span>
        <span className="font-mono text-[9px] text-muted">as of today</span>
      </div>
      <div className="px-4 py-4">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[76px_1fr_78px] items-center gap-3 py-2">
            <span className="text-[10px] text-muted">{r.label}</span>
            <span className="h-[6px] w-full bg-paper-deep">
              <span
                className="block h-full bg-ink"
                style={{ width: `${r.pct}%` }}
              />
            </span>
            <span className="text-right font-mono text-[10px] tabular-nums text-ink">
              {r.value}
            </span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between border-t border-rule px-4 py-2.5">
        <span className="text-[10px] text-muted">Total outstanding</span>
        <span className="font-mono text-[11px] tabular-nums text-ink">₹42,800.00</span>
      </div>
    </div>
  );
}
