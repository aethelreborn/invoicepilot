import { createServerSupabase } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import type { Invoice } from "@/lib/types";
import StatusBadge from "@/components/app/status-badge";
import { Th } from "@/components/app/table-head";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let list: Invoice[] = [];
  if (isDemoMode()) {
    list = [...demoStore.invoices] as Invoice[];
  } else {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: invoices } = await supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    list = (invoices || []) as Invoice[];
  }
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const open = list.filter((i) => i.status !== "paid" && i.status !== "void");
  const outstanding = open.reduce((s, i) => s + i.total_cents, 0);
  const overdueList = open.filter((i) => new Date(i.due_date) < now);
  const overdue = overdueList.reduce((s, i) => s + i.total_cents, 0);
  const paidThisMonth = list
    .filter((i) => i.status === "paid" && i.paid_at && new Date(i.paid_at) >= monthStart)
    .reduce((s, i) => s + i.total_cents, 0);

  const paidInvoices = list.filter((i) => i.status === "paid" && i.paid_at);
  const avgDays =
    paidInvoices.length > 0
      ? Math.round(
          paidInvoices.reduce((s, i) => s + (new Date(i.paid_at!).getTime() - new Date(i.issue_date).getTime()) / (1000 * 60 * 60 * 24), 0) /
            paidInvoices.length
        )
      : null;

  const recent = list.slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 md:px-10 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            Overview
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
            What is owed.
          </h1>
        </div>
        <Link
          href="/invoices/new"
          className="flex h-10 items-center bg-ink px-4 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft"
        >
          New invoice
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-px border border-rule bg-rule md:grid-cols-4">
        <Stat
          label="Outstanding"
          value={formatMoney(outstanding)}
          sub={`${open.length} open ${open.length === 1 ? "invoice" : "invoices"}`}
        />
        <Stat
          label="Overdue"
          value={formatMoney(overdue)}
          sub={`${overdueList.length} past due`}
          tone="text-stamp"
        />
        <Stat
          label="Paid this month"
          value={formatMoney(paidThisMonth)}
          sub="collected"
          tone="text-accent"
        />
        <Stat
          label="Avg. days to pay"
          value={avgDays === null ? "—" : `${avgDays}d`}
          sub={`${paidInvoices.length} paid`}
        />
      </div>

      <div className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[13px] font-medium text-ink">Recent invoices</h2>
          <Link
            href="/invoices"
            className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
          >
            View all
          </Link>
        </div>

        <div className="mt-3 border border-rule">
          {recent.length === 0 ? (
            <p className="p-10 text-center text-[13px] text-muted">
              No invoices yet.{" "}
              <Link href="/invoices/new" className="text-ink underline underline-offset-4">
                Create your first invoice
              </Link>
              .
            </p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-rule bg-paper-deep text-left">
                  <Th>Invoice</Th>
                  <Th className="hidden sm:table-cell">Client</Th>
                  <Th className="hidden sm:table-cell">Due</Th>
                  <Th align="right">Amount</Th>
                  <Th align="right">Status</Th>
                </tr>
              </thead>
              <tbody>
                {recent.map((inv) => (
                  <tr key={inv.id} className="border-b border-rule last:border-b-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/invoices/${inv.id}`}
                        className="font-mono text-[11px] tabular-nums text-ink hover:underline hover:underline-offset-4"
                      >
                        {inv.number}
                      </Link>
                    </td>
                    <td className="hidden px-4 py-3 text-[12px] text-ink-soft sm:table-cell">
                      {inv.client_name}
                    </td>
                    <td className="hidden px-4 py-3 font-mono text-[11px] tabular-nums text-muted sm:table-cell">
                      {new Date(inv.due_date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[11px] tabular-nums text-ink">
                      {formatMoney(inv.total_cents, inv.currency)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StatusBadge status={inv.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  tone = "text-ink",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: string;
}) {
  return (
    <div className="bg-card p-5">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className={`mt-3 font-mono text-[1.45rem] tabular-nums tracking-[-0.01em] ${tone}`}>
        {value}
      </p>
      <p className="mt-1 text-[11px] text-muted">{sub}</p>
    </div>
  );
}
