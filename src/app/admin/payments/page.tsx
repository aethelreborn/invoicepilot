import { createAdminSupabase } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { formatMoney } from "@/lib/currency";
import AdminNav from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  if (isDemoMode()) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10 md:px-10 md:py-12">
        <AdminNav />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Operations</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
          Payments
        </h1>
        <p className="mt-6 text-[12px] text-muted">Demo data only — no live payment records yet.</p>
      </div>
    );
  }

  const admin = createAdminSupabase();
  const { data: payments, error } = await admin
    .from("payments")
    .select("id, user_id, invoice_id, provider, amount_cents, currency, status, verification, created_at, paid_at, invoices!inner(number, status)")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10">
        <AdminNav />
        <p className="text-[12px] text-stamp">Could not load payments.</p>
      </div>
    );
  }

  const pending = (payments || []).filter((p) => p.status === "pending" || p.status === "created");

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 py-10 md:px-10 md:py-12">
      <AdminNav />
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Operations</p>
      <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
        Payments
      </h1>

      <section className="mt-8 border border-rule bg-card">
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">All payments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-normal">Payment</th>
                <th className="px-5 py-3 font-normal">Invoice</th>
                <th className="px-5 py-3 font-normal">Provider</th>
                <th className="px-5 py-3 font-normal">Amount</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Verification</th>
                <th className="px-5 py-3 font-normal">Date</th>
              </tr>
            </thead>
            <tbody>
              {(payments || []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-6 text-[12px] text-muted">No payments yet.</td>
                </tr>
              )}
              {(payments || []).map((p) => (
                <tr key={p.id} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-3 font-mono text-[10px] text-ink-soft">{p.id.slice(0, 8)}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{p.invoices ? (p.invoices as unknown as { number: string }).number : "—"}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{p.provider}</td>
                  <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-ink">{formatMoney(Number(p.amount_cents), p.currency)}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{p.status}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{p.verification}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{p.created_at ? new Date(p.created_at).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Pending settlement</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-normal">Invoice</th>
                <th className="px-5 py-3 font-normal">Amount</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-5 py-6 text-[12px] text-muted">Nothing pending.</td>
                </tr>
              )}
              {pending.map((p) => (
                <tr key={p.id} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-3 text-[12px] text-ink">{p.invoices ? (p.invoices as unknown as { number: string }).number : "—"}</td>
                  <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-ink">{formatMoney(Number(p.amount_cents), p.currency)}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{p.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
