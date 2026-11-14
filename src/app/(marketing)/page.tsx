"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import type { ReactNode } from "react";
import HeroStack from "@/components/marketing/hero-stack";
import FormulaStream from "@/components/originkit/ui/formula-stream";
import ShapeMosaic from "@/components/originkit/ui/shape-mosaic";
import {
  AgingTable,
  DashboardMockup,
  InvoiceMockup,
  PayMockup,
} from "@/components/marketing/mockups";

const faqItems = [
  {
    q: "Do I need to switch invoicing tools?",
    a: "No. Add invoices by hand, import a CSV, or paste a payment link from the tool you already use. InvoicePilot handles follow-up only.",
  },
  {
    q: "Does it take a cut of the payment?",
    a: "No. You collect through whatever method you already accept. InvoicePilot charges a flat monthly price and nothing per invoice.",
  },
  {
    q: "Can my client mark an invoice paid?",
    a: "They can claim it. The invoice moves to claimed and the reminder sequence stops. Only you can mark it paid.",
  },
  {
    q: "What happens after the final notice?",
    a: "The sequence ends. The invoice stays on the dashboard as overdue until you mark it paid, void it, or start a new sequence.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes. Three invoices, manual reminders, and the full dashboard, with no card required.",
  },
];

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

const ease = [0.22, 1, 0.36, 1] as const;

function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      data-reveal=""
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.55, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-7 bg-ink" aria-hidden="true" />
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        {children}
      </p>
    </div>
  );
}

function LedgerGrid() {
  return (
    <div
      className="pointer-events-none absolute inset-y-0 left-1/2 right-0 hidden border-l border-rule lg:block"
      aria-hidden="true"
    >
      <svg className="h-full w-full opacity-60">
        <defs>
          <pattern id="ledger-lines" width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0H0v64" fill="none" stroke="#d3cdbe" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#ledger-lines)" />
      </svg>
    </div>
  );
}

function Arrow() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path d="M0 5h12M8.5 1.5 12 5l-3.5 3.5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="bg-paper text-ink">
        {/* ── Hero ─────────────────────────────────────────────── */}
        <section className="relative overflow-hidden border-b border-rule">
          <LedgerGrid />
          <div className="relative mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-12 px-6 pb-14 pt-14 md:px-10 md:pb-20 md:pt-20 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-6">
              <motion.div
                data-reveal=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, ease }}
              >
                <Eyebrow>Invoice follow-up for freelancers</Eyebrow>
              </motion.div>

              <motion.h1
                data-reveal=""
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.05, ease }}
                className="mt-6 font-display text-[clamp(2.85rem,6.6vw,5rem)] leading-[0.94] tracking-[-0.02em]"
              >
                Get paid without
                <br />
                the <em className="italic">awkward</em> part.
              </motion.h1>

              <motion.p
                data-reveal=""
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.12, ease }}
                className="mt-6 max-w-[46ch] text-[15px] leading-[1.65] text-muted md:text-base"
              >
                InvoicePilot sends the reminders you keep putting off: a heads-up three
                days before the due date, firmer notes after it, and a final notice at
                day fourteen. The sequence stops the moment the invoice is marked paid.
              </motion.p>

              <motion.div
                data-reveal=""
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.19, ease }}
                className="mt-8 flex flex-wrap items-center gap-3"
              >
                <Link
                  href="/signup"
                  className="group inline-flex h-11 items-center gap-2.5 bg-ink px-5 text-[13px] font-medium text-paper transition-colors hover:bg-ink-soft"
                >
                  Start free
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <Arrow />
                  </span>
                </Link>
                <Link
                  href="#sequence"
                  className="inline-flex h-11 items-center border border-rule px-5 text-[13px] font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
                >
                  See the sequence
                </Link>
              </motion.div>

              <motion.p
                data-reveal=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.28 }}
                className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted"
              >
                Free plan · 3 invoices · no card
              </motion.p>
            </div>

            <motion.div
              data-reveal=""
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1, ease }}
              className="lg:col-span-6 lg:-mr-6 xl:-mr-10"
            >
              <HeroStack />
            </motion.div>
          </div>

          {/* Ledger strip: facts, not slogans */}
          <div className="relative mx-auto w-full max-w-[1200px] px-6 md:px-10">
            <div className="grid grid-cols-3 border-t border-rule">
              {[
                { k: "5", v: "follow-ups in the default sequence" },
                { k: "0%", v: "transaction fees on every plan" },
                { k: "3", v: "invoices free, no card needed" },
              ].map((s, i) => (
                <div
                  key={s.k}
                  className={`py-5 pr-4 ${i > 0 ? "border-l border-rule pl-4 md:pl-8" : ""}`}
                >
                  <p className="font-mono text-[22px] tabular-nums text-ink md:text-[26px]">
                    {s.k}
                  </p>
                  <p className="mt-1 max-w-[22ch] text-[10px] leading-snug text-muted md:text-[11px]">
                    {s.v}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <FormulaStream />

        {/* ── The sequence ─────────────────────────────────────── */}
        <section id="sequence" className="scroll-mt-[62px] bg-ink text-paper">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-10 md:py-20">
            <div className="grid gap-8 md:grid-cols-12 md:gap-10">
              <div className="md:col-span-5">
                <div className="flex items-center gap-3">
                  <span className="h-px w-7 bg-paper/60" aria-hidden="true" />
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-paper/60">
                    The default sequence
                  </p>
                </div>
                <h2 className="mt-5 font-display text-[clamp(2rem,4vw,3.25rem)] leading-[0.98] tracking-[-0.015em]">
                  Five notes,
                  <br />
                  then it stops.
                </h2>
              </div>
              <div className="md:col-span-6 md:col-start-7 md:self-end">
                <p className="max-w-[44ch] text-[13px] leading-relaxed text-paper/70">
                  Every offset is editable, and the tone is set per client. Nothing sends
                  twice. Nothing sends once the invoice is paid.
                </p>
              </div>
            </div>

            <div className="mt-12 grid grid-cols-2 border-t border-[#3a382f] md:grid-cols-5">
              {[
                { day: "T−3", label: "Friendly heads-up", tone: "friendly" },
                { day: "T0", label: "Due today", tone: "friendly" },
                { day: "T+3", label: "First follow-up", tone: "firm" },
                { day: "T+7", label: "Second follow-up", tone: "firm" },
                { day: "T+14", label: "Final notice", tone: "final" },
              ].map((s, i) => (
                <div
                  key={s.day}
                  className={`group border-b border-[#3a382f] px-1 py-6 md:border-b-0 md:px-5 ${
                    i > 0 ? "md:border-l md:border-[#3a382f]" : ""
                  } ${i % 2 === 1 ? "border-l border-[#3a382f] pl-4 md:pl-5" : ""}`}
                >
                  <p className="font-mono text-[11px] tabular-nums tracking-[0.08em] text-paper/65">
                    {s.day}
                  </p>
                  <p className="mt-3 text-[13px] font-medium leading-snug text-paper">
                    {s.label}
                  </p>
                  <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/60">
                    {s.tone}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── The gap ──────────────────────────────────────────── */}
        <section className="border-b border-rule">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
            <div className="grid gap-12 md:grid-cols-12 md:gap-10">
              <Reveal className="md:col-span-6">
                <Eyebrow>Why invoices go stale</Eyebrow>
                <h2 className="mt-6 max-w-[18ch] font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] tracking-[-0.015em]">
                  The invoice is not the problem. The silence after it is.
                </h2>
                <p className="mt-6 max-w-[52ch] text-[15px] leading-[1.7] text-muted">
                  The work is finished. The invoice sits in an inbox under twelve other
                  emails. A polite nudge usually moves it, and most freelancers send that
                  nudge two weeks late, or not at all, because writing it feels like asking
                  for a favour.
                </p>
                <p className="mt-4 max-w-[52ch] text-[15px] leading-[1.7] text-muted">
                  InvoicePilot writes it for you, in the tone you chose, on the day you
                  chose. You keep the relationship. The software keeps the calendar.
                </p>
              </Reveal>

              <Reveal className="md:col-span-6 md:pl-6" delay={0.08}>
                <AgingTable />
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                  Aging buckets from the dashboard · demo amounts
                </p>
              </Reveal>
            </div>
          </div>
        </section>

        {/* ── Product ──────────────────────────────────────────── */}
        <section id="product" className="scroll-mt-[62px] border-b border-rule">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
            <Reveal>
              <Eyebrow>Inside the product</Eyebrow>
              <div className="mt-6 grid gap-6 md:grid-cols-12">
                <h2 className="font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] tracking-[-0.015em] md:col-span-7">
                  Three screens. That is the whole product.
                </h2>
                <p className="max-w-[38ch] self-end text-[13px] leading-relaxed text-muted md:col-span-4 md:col-start-9">
                  Invoices, the trail behind each one, and a page your client can open.
                </p>
              </div>
            </Reveal>

            <div className="mt-16 space-y-16 md:space-y-24">
              <ProductRow
                index="01"
                title="What is still owed, in one place."
                body="Outstanding, overdue, and paid this month sit above the invoice list. Aging runs from current to 60+ days, so a late invoice stops being a surprise."
                facts={[
                  "Aging buckets from current to 60+ days",
                  "Client and invoice history on one screen",
                  "CSV export for your accountant",
                ]}
                mockup={<DashboardMockup />}
              />

              <ProductRow
                index="02"
                title="Every invoice carries its own reminder trail."
                body="Open an invoice and you see which note went out, when the next one is due, and what the client has seen. Stop the sequence with one click."
                facts={[
                  "Editable offsets and per-client tone",
                  "Queued, sent, and skipped states",
                  "Manual send when you want to write it yourself",
                ]}
                mockup={<InvoiceMockup />}
                flip
              />

              <ProductRow
                index="03"
                title="A page your client can open without an account."
                body="Your client sees the amount, the due date, your payment instructions, and one button to say they have paid. You confirm it. Their word does not flip the invoice to paid."
                facts={[
                  "No login and no app install",
                  "A claim, then your confirmation",
                  "Payment instructions live in the invoice notes",
                ]}
                mockup={<PayMockup />}
              />
            </div>
          </div>
        </section>

        {/* ── Feature index ────────────────────────────────────── */}
        <section className="border-b border-rule bg-paper-deep/50">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
            <Reveal>
              <Eyebrow>What is included</Eyebrow>
              <h2 className="mt-6 max-w-[24ch] font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] tracking-[-0.015em]">
                The parts that matter, and nothing else.
              </h2>
            </Reveal>

            <div className="mt-12 grid gap-x-12 md:grid-cols-2">
              {[
                {
                  t: "Reminder sequence",
                  d: "Five offsets from friendly to final. The sequence stops once the invoice is paid.",
                },
                {
                  t: "Any invoicing tool",
                  d: "Add invoices by hand, import a CSV, or put your payment instructions in the notes.",
                },
                {
                  t: "AR aging",
                  d: "Current, 1–15, 16–30, 31–60, and 60+ days, totalled across clients.",
                },
                {
                  t: "Client records",
                  d: "Contact, company, notes, and every invoice that client has been sent.",
                },
                {
                  t: "CSV import and export",
                  d: "Bring your book over in one file. Take it back whenever you want.",
                },
                {
                  t: "Account controls",
                  d: "Export your data or delete the account from settings. No support ticket.",
                },
              ].map((f, i) => (
                <Reveal key={f.t} delay={i * 0.03}>
                  <div className="group flex gap-4 border-t border-rule py-6 md:gap-8">
                    <span className="w-6 shrink-0 pt-1 font-mono text-[10px] tabular-nums text-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="text-[14px] font-medium text-ink">{f.t}</h3>
                      <p className="mt-1.5 max-w-[42ch] text-[13px] leading-relaxed text-muted">
                        {f.d}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ─────────────────────────────────────── */}
        <section className="border-b border-rule">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
            <Reveal>
              <Eyebrow>Setup</Eyebrow>
              <h2 className="mt-6 font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] tracking-[-0.015em]">
                Ten minutes, once.
              </h2>
            </Reveal>

            <div className="mt-14 grid gap-10 md:grid-cols-3 md:gap-8">
              {[
                {
                  n: "01",
                  t: "Add the invoice",
                  d: "Client, amount, due date. Or drop in a CSV of everything you have already sent.",
                },
                {
                  n: "02",
                  t: "Keep the default sequence",
                  d: "Five offsets, friendly to final. Change the days or the tone for any client.",
                },
                {
                  n: "03",
                  t: "Let it run",
                  d: "Reminders leave on schedule. The sequence stops when the invoice is marked paid, and the dashboard shows what is left.",
                },
              ].map((s, i) => (
                <Reveal key={s.n} delay={i * 0.06}>
                  <div className="border-t border-ink pt-5">
                    <p className="font-display text-[3.25rem] leading-none tracking-[-0.02em] text-ink">
                      {s.n}
                    </p>
                    <h3 className="mt-5 text-[15px] font-medium text-ink">{s.t}</h3>
                    <p className="mt-2 max-w-[34ch] text-[13px] leading-relaxed text-muted">
                      {s.d}
                    </p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ──────────────────────────────────────────── */}
        <section id="pricing" className="scroll-mt-[62px] border-b border-rule">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <Eyebrow>Pricing</Eyebrow>
                  <h2 className="mt-6 max-w-[20ch] font-display text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.98] tracking-[-0.015em]">
                    One flat price. No cut of your invoices.
                  </h2>
                </div>
                <Link
                  href="/pricing"
                  className="group inline-flex items-center gap-2 text-[13px] text-ink underline decoration-rule underline-offset-4 transition-colors hover:decoration-ink"
                >
                  Compare plans
                  <Arrow />
                </Link>
              </div>
              <p className="mt-5 max-w-[54ch] text-[14px] leading-relaxed text-muted">
                Free covers three invoices. Starter is ₹799 a month, Growth ₹1,999 — unlimited
                invoices, automated sending, hosted checkout. Annual billing takes two months off.
              </p>
            </Reveal>

            <div className="mt-12 grid gap-5 md:grid-cols-2">
              <Reveal>
                <div className="flex h-full flex-col border border-rule bg-card p-7 md:p-9">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[14px] font-medium text-ink">Free</h3>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                      Forever
                    </span>
                  </div>
                  <p className="mt-6 font-display text-[3.5rem] leading-none tracking-[-0.02em]">
                    ₹0
                  </p>
                  <p className="mt-2 text-[12px] text-muted">Three invoices, paid by hand.</p>
                  <ul className="mt-7 border-t border-rule">
                    {[
                      "3 invoices",
                      "Manual reminders",
                      "Public pay pages",
                      "AR dashboard",
                    ].map((f) => (
                      <li
                        key={f}
                        className="border-b border-rule py-2.5 text-[12px] text-ink-soft"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex-1" />
                  <Link
                    href="/signup"
                    className="mt-7 flex h-10 items-center justify-center border border-ink text-[12px] font-medium text-ink transition-colors hover:bg-ink hover:text-paper"
                  >
                    Start free
                  </Link>
                </div>
              </Reveal>

              <Reveal delay={0.06}>
                <div className="flex h-full flex-col bg-ink p-7 text-paper md:p-9">
                  <div className="flex items-baseline justify-between">
                    <h3 className="text-[14px] font-medium">Starter</h3>
                    <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-paper/60">
                      Most useful
                    </span>
                  </div>
                  <p className="mt-6 font-display text-[3.5rem] leading-none tracking-[-0.02em]">
                    ₹799
                    <span className="font-sans text-[11px] font-normal tracking-normal text-paper/50">
                      {" "}
                      / month
                    </span>
                  </p>
                  <p className="mt-2 text-[12px] text-paper/60">Unlimited invoices, sent for you.</p>
                  <ul className="mt-7 border-t border-[#3a382f]">
                    {[
                      "Unlimited invoices",
                      "Automated reminder sequence",
                      "CSV import and export",
                      "Client records",
                      "Email support",
                    ].map((f) => (
                      <li
                        key={f}
                        className="border-b border-[#3a382f] py-2.5 text-[12px] text-paper/85"
                      >
                        {f}
                      </li>
                    ))}
                  </ul>
                  <div className="flex-1" />
                  <Link
                    href="/signup"
                    className="mt-7 flex h-10 items-center justify-center bg-paper text-[12px] font-medium text-ink transition-colors hover:bg-white"
                  >
                    Start with Starter
                  </Link>
                </div>
              </Reveal>
            </div>

            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
              Prices in INR - cancel any time - no transaction fees on any plan
            </p>
          </div>
        </section>

        {/* ── Trust ────────────────────────────────────────────── */}
        <section className="border-b border-rule bg-paper-deep/50">
          <div className="mx-auto w-full max-w-[1200px] px-6 py-12 md:px-10">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { t: "Row-level security", d: "Every table is scoped to your account." },
                { t: "Export any time", d: "Your invoices leave as a CSV, not a screenshot." },
                { t: "Delete from settings", d: "One button removes the account and its data." },
                { t: "No card to start", d: "The free plan does not ask for payment details." },
              ].map((t, i) => (
                <Reveal key={t.t} delay={i * 0.04}>
                  <div className="border-l border-rule pl-4">
                    <p className="text-[12px] font-medium text-ink">{t.t}</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-muted">{t.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section className="border-b border-rule">
          <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-20 md:grid-cols-12 md:px-10 md:py-24">
            <Reveal className="md:col-span-4">
              <Eyebrow>Questions</Eyebrow>
              <h2 className="mt-6 font-display text-[clamp(1.9rem,3.4vw,2.75rem)] leading-[1] tracking-[-0.015em]">
                Questions,
                <br />
                answered plainly.
              </h2>
            </Reveal>

            <div className="md:col-span-8">
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }}
              />
              {faqItems.map((f) => (
                <details key={f.q} className="group border-t border-rule last:border-b">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[14px] font-medium text-ink [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span className="shrink-0 font-mono text-[16px] font-normal leading-none text-muted transition-transform duration-200 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-[62ch] pb-5 pr-8 text-[13px] leading-relaxed text-muted">
                    {f.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ── Close ────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-ink text-paper">
          <ShapeMosaic
            style={{ position: "absolute", inset: 0, minWidth: 0, minHeight: 0 }}
            ink="#7d7970"
            lit="#d3cdbe"
            cell={34}
            reach={22}
            turn={28}
          />
          <div className="relative mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-24">
            <div className="grid gap-8 md:grid-cols-12 md:items-end">
              <Reveal className="md:col-span-8">
                <h2 className="max-w-[22ch] font-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[0.98] tracking-[-0.015em]">
                  Send the invoice. We will write the follow-up.
                </h2>
              </Reveal>
              <Reveal className="md:col-span-4 md:justify-self-end" delay={0.08}>
                <Link
                  href="/signup"
                  className="group inline-flex h-12 items-center gap-3 bg-paper px-6 text-[13px] font-medium text-ink transition-colors hover:bg-white"
                >
                  Start free
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">
                    <Arrow />
                  </span>
                </Link>
                <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.14em] text-paper/60">
                  Free plan · 3 invoices · no card
                </p>
              </Reveal>
            </div>
          </div>
        </section>
      </div>
    </MotionConfig>
  );
}

function ProductRow({
  index,
  title,
  body,
  facts,
  mockup,
  flip = false,
}: {
  index: string;
  title: string;
  body: string;
  facts: string[];
  mockup: ReactNode;
  flip?: boolean;
}) {
  return (
    <div className="grid items-center gap-8 md:grid-cols-12 md:gap-10">
      <Reveal className={`md:col-span-4 ${flip ? "md:order-2 md:col-start-9" : ""}`}>
        <p className="font-mono text-[10px] tabular-nums tracking-[0.16em] text-muted">
          {index}
        </p>
        <h3 className="mt-4 font-display text-[clamp(1.7rem,2.8vw,2.3rem)] leading-[1.02] tracking-[-0.015em]">
          {title}
        </h3>
        <p className="mt-4 max-w-[38ch] text-[13px] leading-relaxed text-muted">{body}</p>
        <ul className="mt-6 border-t border-rule">
          {facts.map((f) => (
            <li key={f} className="border-b border-rule py-2 text-[11px] text-ink-soft">
              {f}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal className={`md:col-span-7 ${flip ? "md:order-1 md:col-start-1" : "md:col-start-6"}`} delay={0.08}>
        {mockup}
      </Reveal>
    </div>
  );
}
