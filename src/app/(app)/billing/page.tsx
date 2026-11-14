import { createServerSupabase } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { formatMoney } from "@/lib/currency";
import { platformUpiId } from "@/lib/config";
import BillingClient from "@/components/app/billing-client";

export const dynamic = "force-dynamic";

async function BillingHistory() {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("platform_payments").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  const payments = data || [];
  if (payments.length === 0) {
    return <p className="mt-3 text-[12px] text-muted">No subscription payments yet.</p>;
  }
  return (
    <ul className="mt-3 space-y-2">
      {payments.map((p) => (
        <li key={p.id} className="flex items-center justify-between border-b border-rule pb-2 text-[12px] last:border-b-0">
          <span className="font-mono text-[10px] text-ink-soft">{p.reference}</span>
          <span className="font-mono text-[10px] text-ink">{p.status}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function BillingPage() {
  if (isDemoMode()) {
    const plan = demoStore.profile.plan || "free";
    const used = demoStore.invoices.filter((i) => i.status !== "void").length;

    return (
      <div className="mx-auto w-full max-w-[860px] px-6 py-10 md:px-10 md:py-12">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Workspace</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
          Billing
        </h1>
        <section className="mt-8 border border-rule bg-card p-5 md:p-6">
          <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Current plan</h2>
          <p className="mt-3 text-[13px] text-ink-soft">
            Plan: <span className="text-ink">{plan}</span>
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">
            Free invoices used: <span className="text-ink">{used}</span> of 3
          </p>
        </section>
        <section className="mt-6 border border-rule bg-card p-5 md:p-6">
          <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Upgrade</h2>
          <p className="mt-3 text-[13px] text-ink-soft">Starter — unlimited invoices, automated reminders, multiple payment providers.</p>
          <BillingClient />
        </section>
        <section className="mt-6 border border-rule bg-card p-5 md:p-6">
          <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">History</h2>
          <BillingHistory />
        </section>
      </div>
    );
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
    : { data: null };

  const plan = profile?.plan || "free";
  const usedCount = user
    ? await supabase.from("invoices").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "void")
    : { count: 0 };

  return (
    <div className="mx-auto w-full max-w-[860px] px-6 py-10 md:px-10 md:py-12">
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Workspace</p>
      <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
        Billing
      </h1>

      <section className="mt-8 border border-rule bg-card p-5 md:p-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Current plan</h2>
        <p className="mt-3 text-[13px] text-ink-soft">
          Plan: <span className="text-ink">{plan}</span>
        </p>
        <p className="mt-1 text-[13px] text-ink-soft">
          Invoices on Free: <span className="text-ink">{usedCount.count || 0}</span> of 3
        </p>
      </section>

      <section className="mt-6 border border-rule bg-card p-5 md:p-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Upgrade</h2>
        <p className="mt-3 text-[13px] text-ink-soft">
          Starter — unlimited invoices, automated reminders, multiple payment providers. Collected via UPI to the platform account.
        </p>
        <p className="mt-2 font-mono text-[11px] text-ink-soft">
          {formatMoney(79900, "INR")} / month · UPI ID {platformUpiId() || "not configured"}
        </p>
        <BillingClient />
      </section>

      <section className="mt-6 border border-rule bg-card p-5 md:p-6">
        <h2 className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">History</h2>
        <BillingHistory />
      </section>
    </div>
  );
}
