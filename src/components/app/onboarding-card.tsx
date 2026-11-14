import Link from "next/link";
import { createServerSupabase } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";
import OnboardingCompleteButton from "@/components/app/onboarding-complete-button";

export default async function OnboardingCard() {
  if (isDemoMode()) return null;

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileRes, paymentRes, clientsRes, invoicesRes] = await Promise.all([
    supabase.from("profiles").select("business_name, onboarding_completed_at").eq("id", user.id).maybeSingle(),
    supabase.from("payment_settings").select("upi_vpa, bank_details, razorpay_key_id, stripe_publishable_key, youpi_base_url").eq("user_id", user.id).maybeSingle(),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("status", "void"),
  ]);

  const profile = profileRes.data;
  if (profile?.onboarding_completed_at) return null;

  const payment = paymentRes.data;
  const hasPaymentMethod = Boolean(
    payment && (payment.upi_vpa || payment.bank_details || payment.razorpay_key_id || payment.stripe_publishable_key || payment.youpi_base_url)
  );

  const steps = [
    { label: "Tell us about your business", detail: "Business name, invoice identity.", href: "/settings", done: Boolean(profile?.business_name) },
    { label: "Add how clients pay you", detail: "UPI VPA, bank details or a gateway.", href: "/settings", done: hasPaymentMethod },
    { label: "Add your first client", detail: "Name, email — saved for every future invoice.", href: "/clients", done: (clientsRes.count || 0) > 0 },
    { label: "Send your first invoice", detail: "Numbered automatically, payable by QR.", href: "/invoices/new", done: (invoicesRes.count || 0) > 0 },
  ];
  const doneCount = steps.filter((s) => s.done).length;
  const allDone = doneCount === steps.length;

  return (
    <section className="mt-6 border border-rule bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule px-5 py-3">
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
          Getting set up — {doneCount} of {steps.length}
        </p>
        <OnboardingCompleteButton allDone={allDone} />
      </div>
      <ol className="grid gap-px bg-rule sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.label} className="bg-card">
            <Link href={step.href} className="block h-full p-4 transition-colors hover:bg-paper-deep">
              <span className={`flex h-5 w-5 items-center justify-center border text-[11px] leading-none ${step.done ? "border-accent bg-accent text-paper" : "border-rule text-muted"}`}>
                {step.done ? "✓" : i + 1}
              </span>
              <span className="mt-2 block text-[12px] font-medium text-ink">{step.label}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-muted">{step.detail}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="border-t border-rule px-5 py-2 text-[11px] text-muted">
        Automated follow-ups (Friendly → Firm → Final) unlock on{" "}
        <Link href="/billing" className="text-ink underline underline-offset-2">
          Starter
        </Link>
        .
      </p>
    </section>
  );
}
