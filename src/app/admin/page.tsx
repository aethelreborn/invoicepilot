import { createAdminSupabase } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/currency";
import AdminNav from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (isDemoMode()) {
    const userCount = 1;
    const invoiceCount = demoStore.invoices.length;
    const paidCents = demoStore.invoices.reduce((sum, i) => sum + (i.status === "paid" ? i.total_cents : 0), 0);
    const pendingPayments = demoStore.invoices.filter((i) => i.status === "claimed").length;

    return (
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10 md:px-10 md:py-12">
        <AdminNav />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Operations</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
          Admin
        </h1>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <Stat label="Freelancers" value={String(userCount)} />
          <Stat label="Invoices sent" value={String(invoiceCount)} />
          <Stat label="Collected (demo)" value={formatMoney(paidCents, "INR")} />
          <Stat label="Claims pending" value={String(pendingPayments)} />
        </div>
      </div>
    );
  }

  const admin = createAdminSupabase();
  const { data: users, error: usersError } = await admin
    .from("profiles")
    .select("id, email, business_name, role, plan, plan_renews_at, created_at, currency, locale")
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: payments, error: paymentsError } = await admin
    .from("payments")
    .select("id, user_id, invoice_id, provider, amount_cents, currency, status, verification, created_at, paid_at, invoices!inner(number, status)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: platformPayments, error: platformError } = await admin
    .from("platform_payments")
    .select("id, user_id, plan, amount_cents, currency, reference, status, utr, created_at, reviewed_at")
    .order("created_at", { ascending: false })
    .limit(100);

  if (usersError || paymentsError || platformError) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10">
        <p className="text-[12px] text-stamp">Could not load admin data.</p>
      </div>
    );
  }

  const pendingPayments = (payments || []).filter((p) => p.status === "pending" || p.status === "created");
  const paidTotal = (payments || [])
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + Number(p.amount_cents || 0), 0);

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 py-10 md:px-10 md:py-12">
      <AdminNav />
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Operations</p>
      <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
        Admin
      </h1>

      <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Freelancers" value={String((users || []).length)} />
        <Stat label="Invoices" value={String((payments || []).length)} />
        <Stat label="Collected" value={formatMoney(paidTotal, "INR")} />
        <Stat label="Pending claims" value={String(pendingPayments.length)} />
      </div>

      <section className="mt-10 border border-rule bg-card">
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Freelancers</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-normal">Email</th>
                <th className="px-5 py-3 font-normal">Business</th>
                <th className="px-5 py-3 font-normal">Plan</th>
                <th className="px-5 py-3 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u) => (
                <tr key={u.id} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-3 text-[12px] text-ink">{u.email}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{u.business_name}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{u.plan}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Payments awaiting settlement</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-normal">Invoice</th>
                <th className="px-5 py-3 font-normal">Freelancer</th>
                <th className="px-5 py-3 font-normal">Amount</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Verification</th>
              </tr>
            </thead>
            <tbody>
              {pendingPayments.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-[12px] text-muted">No payments awaiting settlement.</td>
                </tr>
              )}
              {pendingPayments.map((p) => (
                <tr key={p.id} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-3 text-[12px] text-ink">{p.invoices ? (p.invoices as unknown as { number: string }).number : "—"}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{p.user_id}</td>
                  <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-ink">{formatMoney(Number(p.amount_cents), p.currency)}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{p.status}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{p.verification}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Platform subscriptions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-normal">Freelancer</th>
                <th className="px-5 py-3 font-normal">Plan</th>
                <th className="px-5 py-3 font-normal">Amount</th>
                <th className="px-5 py-3 font-normal">Reference</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {(platformPayments || []).map((p) => (
                <tr key={p.id} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-3 text-[12px] text-ink">{p.user_id}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{p.plan}</td>
                  <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-ink">{formatMoney(Number(p.amount_cents), p.currency)}</td>
                  <td className="px-5 py-3 font-mono text-[10px] text-ink-soft">{p.reference}</td>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-rule bg-card px-5 py-4">
      <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">{label}</p>
      <p className="mt-2 font-mono text-[1.4rem] tabular-nums text-ink">{value}</p>
    </div>
  );
}
