import { createServerSupabase } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import type { Invoice } from "@/lib/types";
import StatusBadge from "@/components/app/status-badge";
import { Th } from "@/components/app/table-head";

const STATUSES = ["all", "draft", "sent", "viewed", "claimed", "overdue", "paid"] as const;

export const dynamic = "force-dynamic";

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const sp = await searchParams;
  const filter = sp.status || "all";
  let list: Invoice[] = [];
  if (isDemoMode()) {
    let all = [...demoStore.invoices] as Invoice[];
    if (filter !== "all") all = all.filter((i) => i.status === filter);
    list = all.sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
  } else {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    let q = supabase
      .from("invoices")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter);
    const { data } = await q;
    list = (data || []) as Invoice[];
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 md:px-10 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            {list.length} {list.length === 1 ? "invoice" : "invoices"}
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
            Invoices
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href="/api/import/csv"
            className="flex h-10 items-center border border-rule px-4 text-[12px] font-medium text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            Import CSV
          </Link>
          <Link
            href="/invoices/new"
            className="flex h-10 items-center bg-ink px-4 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft"
          >
            New invoice
          </Link>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/invoices" : `/invoices?status=${s}`}
            className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors ${
              filter === s
                ? "border-ink bg-ink text-paper"
                : "border-rule text-muted hover:border-ink hover:text-ink"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="mt-5 border border-rule">
        {list.length === 0 ? (
          <p className="p-10 text-center text-[13px] text-muted">
            {filter === "all" ? (
              <>
                No invoices yet.{" "}
                <Link href="/invoices/new" className="text-ink underline underline-offset-4">
                  Create your first invoice
                </Link>
                .
              </>
            ) : (
              <>No invoices with this status.</>
            )}
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule bg-paper-deep text-left">
                <Th>Invoice</Th>
                <Th className="hidden sm:table-cell">Client</Th>
                <Th className="hidden md:table-cell">Issued</Th>
                <Th className="hidden sm:table-cell">Due</Th>
                <Th align="right">Amount</Th>
                <Th align="right">Status</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((inv) => (
                <tr key={inv.id} className="border-b border-rule last:border-b-0 hover:bg-card">
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
                  <td className="hidden px-4 py-3 font-mono text-[11px] tabular-nums text-muted md:table-cell">
                    {new Date(inv.issue_date).toLocaleDateString()}
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
  );
}
