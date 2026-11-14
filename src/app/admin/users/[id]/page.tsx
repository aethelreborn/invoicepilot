import { createAdminSupabase } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/currency";
import AdminNav from "@/components/admin/admin-nav";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (isDemoMode()) {
    const user = demoStore.profile;
    return (
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10 md:px-10 md:py-12">
        <AdminNav />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Operations</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
          Freelancer
        </h1>
        <p className="mt-6 text-[12px] text-muted">
          Demo workspace for {user.email}.
        </p>
        <Link href="/admin/users" className="mt-6 inline-block font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft underline underline-offset-2">
          Back to freelancers
        </Link>
      </div>
    );
  }

  const admin = createAdminSupabase();
  const { data: user, error } = await admin
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !user) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10">
        <AdminNav />
        <p className="text-[12px] text-stamp">User not found.</p>
      </div>
    );
  }

  const { data: invoices } = await admin
    .from("invoices")
    .select("id, number, status, total_cents, currency, created_at, paid_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: payments } = await admin
    .from("payments")
    .select("id, provider, amount_cents, currency, status, verification, created_at, paid_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: platformPayments } = await admin
    .from("platform_payments")
    .select("id, plan, amount_cents, currency, reference, status, created_at, reviewed_at")
    .eq("user_id", id)
    .order("created_at", { ascending: false });

  const latestPlatformPayment = platformPayments?.[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 py-10 md:px-10 md:py-12">
      <AdminNav />
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Operations</p>
      <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
        {user.business_name || user.email}
      </h1>

      <section className="mt-8 border border-rule bg-card p-5 md:p-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Profile</h2>
        <div className="mt-3 grid gap-2 text-[12px] text-ink-soft md:grid-cols-2">
          <p>Email: <span className="text-ink">{user.email}</span></p>
          <p>Role: <span className="text-ink">{user.role}</span></p>
          <p>Plan: <span className="text-ink">{user.plan}</span></p>
          <p>Plan renews: <span className="text-ink">{user.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString("en-IN") : "—"}</span></p>
        </div>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Invoices</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-normal">Number</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Amount</th>
                <th className="px-5 py-3 font-normal">Paid</th>
              </tr>
            </thead>
            <tbody>
              {(invoices || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-[12px] text-muted">No invoices yet.</td>
                </tr>
              )}
              {(invoices || []).map((inv) => (
                <tr key={inv.id} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-3 font-mono text-[10px] text-ink">{inv.number}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{inv.status}</td>
                  <td className="px-5 py-3 font-mono text-[11px] tabular-nums text-ink">{formatMoney(Number(inv.total_cents), inv.currency)}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString("en-IN") : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-6 border border-rule bg-card">
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Payments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-normal">Provider</th>
                <th className="px-5 py-3 font-normal">Amount</th>
                <th className="px-5 py-3 font-normal">Status</th>
                <th className="px-5 py-3 font-normal">Verification</th>
              </tr>
            </thead>
            <tbody>
              {(payments || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-6 text-[12px] text-muted">No payments yet.</td>
                </tr>
              )}
              {(payments || []).map((p) => (
                <tr key={p.id} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-3 text-[12px] text-ink">{p.provider}</td>
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
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Platform subscription</h2>
        <div className="p-5 md:p-6">
          <p className="text-[12px] text-ink-soft">Plan: <span className="text-ink">{user.plan}</span></p>
          <p className="mt-2 text-[12px] text-ink-soft">Started: <span className="text-ink">{user.plan_renews_at ? new Date(user.plan_renews_at).toLocaleDateString("en-IN") : "—"}</span></p>
          {latestPlatformPayment && (
            <p className="mt-2 text-[12px] text-ink-soft">Reference: <span className="text-ink">{latestPlatformPayment.reference}</span></p>
          )}
        </div>
      </section>
    </div>
  );
}
