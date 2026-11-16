import { createServerSupabase } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import { notFound } from "next/navigation";
import PayActions, { type PublicPaymentInfo } from "@/components/app/pay-actions";
import StatusBadge from "@/components/app/status-badge";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

type PublicLineItem = {
  id: string;
  description: string;
  quantity: number;
  unit_price_cents: number;
};

type PublicInvoicePayload = {
  invoice: Invoice;
  line_items: PublicLineItem[];
  business_name: string | null;
  business_email: string | null;
  payment: PublicPaymentInfo | null;
};

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let invoice: (Invoice & { invoice_line_items: PublicLineItem[] }) | null = null;
  let fromName = "Your service provider";
  let payload: PublicInvoicePayload | null = null;
  let demoPayment: PublicPaymentInfo | null = null;
  if (isDemoMode()) {
    const found = demoStore.invoices.find((i) => i.pay_token === token) || null;
    if (found) {
      if (found.status === "sent") {
        found.status = "viewed";
        found.viewed_at = new Date().toISOString();
      }
      invoice = found;
      fromName = demoStore.profile.business_name || fromName;
      const ps = demoStore.paymentSettings;
      demoPayment = {
        provider: ps.provider,
        upi_vpa: ps.upi_vpa,
        upi_name: ps.upi_name,
        bank_details: ps.bank_details,
        has_checkout: ["razorpay", "stripe", "youpi"].includes(ps.provider),
      };
    }
  } else {
    const supabase = await createServerSupabase();
    const { data } = await supabase.rpc("get_public_invoice", { p_token: token });
    payload = data as PublicInvoicePayload | null;
    if (payload) {
      if (payload.invoice.status === "sent" && !payload.invoice.viewed_at) {
        await supabase.rpc("mark_public_invoice_viewed", { p_token: token });
        payload.invoice.status = "viewed";
      }
      invoice = { ...payload.invoice, invoice_line_items: payload.line_items };
      fromName = payload.business_name || fromName;
    }
  }
  if (!invoice) notFound();
  const inv = invoice;

  let whiteLabel = false;
  if (isDemoMode()) {
    whiteLabel = (demoStore.profile as { plan?: string }).plan === "growth";
  } else if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminSupabase();
    const { data: owner } = await admin.from("invoices").select("user_id").eq("pay_token", token).maybeSingle();
    if (owner?.user_id) {
      const { data: ownerProfile } = await admin.from("profiles").select("plan").eq("id", owner.user_id).maybeSingle();
      whiteLabel = ownerProfile?.plan === "growth";
    }
  }

  const items = inv.invoice_line_items || [];
  const payment: PublicPaymentInfo | null = payload?.payment || demoPayment;
  const maskEmail = (value: string | null) => {
    if (!value) return null;
    const [local, domain] = value.split("@");
    if (!domain) return "you";
    return `${local.slice(0, 1)}***@${domain}`;
  };
  const clientEmailMasked = maskEmail(inv.client_email);

  return (
    <div className="flex min-h-screen items-start justify-center bg-paper px-4 py-10 text-ink md:items-center md:py-16">
      <div className="w-full max-w-[640px]">
        <div className="flex items-baseline justify-between border-b border-rule pb-3">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-muted">
            Invoice from
          </p>
          <p className="text-[13px] font-medium text-ink">{fromName}</p>
        </div>

        <article className="mt-6 border border-rule bg-card">
          <header className="flex flex-wrap items-start justify-between gap-4 border-b border-rule px-6 py-6">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
                Invoice
              </p>
              <h1 className="mt-1 font-mono text-[1.35rem] tabular-nums tracking-[-0.01em]">
                {inv.number}
              </h1>
              {inv.title && <p className="mt-1 text-[12px] text-muted">{inv.title}</p>}
            </div>
            <div className="text-right">
              <StatusBadge status={inv.status} />
              <p className="mt-2 font-mono text-[10px] tabular-nums text-muted">
                Due {new Date(inv.due_date).toLocaleDateString()}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-6 border-b border-rule px-6 py-5">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                Bill to
              </p>
              <p className="mt-1.5 text-[13px] font-medium text-ink">{inv.client_name}</p>
              {inv.client_email && (
                <p className="mt-0.5 text-[12px] text-muted">{inv.client_email}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                {inv.status === "paid" ? "Amount paid" : "Amount due"}
              </p>
              <p className="mt-1.5 font-mono text-[1.05rem] tabular-nums text-ink">
                {formatMoney(inv.total_cents, inv.currency)}
              </p>
            </div>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-rule bg-paper-deep text-left">
                <th className="px-6 py-2 font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted">
                  Description
                </th>
                <th className="px-2 py-2 text-right font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted">
                  Qty
                </th>
                <th className="px-6 py-2 text-right font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="border-b border-rule last:border-b-0">
                  <td className="px-6 py-3 text-[13px] text-ink">{it.description}</td>
                  <td className="px-2 py-3 text-right font-mono text-[11px] tabular-nums text-muted">
                    {it.quantity}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-[11px] tabular-nums text-ink">
                    {formatMoney(Math.round(it.quantity * it.unit_price_cents), inv.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end border-t border-rule px-6 py-5">
            <div className="w-full max-w-[260px] space-y-1.5">
              <div className="flex justify-between text-[12px] text-muted">
                <span>Subtotal</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(inv.subtotal_cents, inv.currency)}
                </span>
              </div>
              <div className="flex justify-between text-[12px] text-muted">
                <span>Tax</span>
                <span className="font-mono tabular-nums">
                  {formatMoney(inv.tax_cents, inv.currency)}
                </span>
              </div>
              <div className="flex items-baseline justify-between border-t border-rule pt-2">
                <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                  Total
                </span>
                <span className="font-mono text-[17px] tabular-nums text-ink">
                  {formatMoney(inv.total_cents, inv.currency)}
                </span>
              </div>
            </div>
          </div>

          {inv.notes && (
            <div className="border-t border-rule px-6 py-5">
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
                Notes
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-soft">
                {inv.notes}
              </p>
            </div>
          )}

          <div className="border-t border-rule px-6 py-5">
            <PayActions
              token={token}
              status={inv.status}
              payment={payment}
              amountCents={inv.total_cents}
              currency={inv.currency}
              clientEmailMasked={clientEmailMasked}
            />
          </div>
        </article>

        {!whiteLabel && (
          <p className="mt-4 text-center font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            Sent with InvoicePilot
          </p>
        )}
      </div>
    </div>
  );
}
