import { createServerSupabase } from "@/lib/supabase/server";
import { formatMoney } from "@/lib/utils";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import InvoiceActions from "@/components/app/invoice-actions";
import StatusBadge from "@/components/app/status-badge";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let invoice: unknown = null;
  let reminders: { id: string; invoice_id: string; user_id: string; tone: string; channel: string; to_email: string | null; subject: string | null; body: string | null; sent_at: string }[] = [];
  if (isDemoMode()) {
    invoice = demoStore.invoices.find((i) => i.id === id) || null;
    reminders = demoStore.reminders.filter((r) => r.invoice_id === id).sort((a, b) => (b.sent_at > a.sent_at ? 1 : -1));
  } else {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data } = await supabase
      .from("invoices")
      .select("*, invoice_line_items(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();
    invoice = data;
    const { data: r } = await supabase
      .from("reminder_logs")
      .select("*")
      .eq("invoice_id", id)
      .order("sent_at", { ascending: false });
    reminders = r || [];
  }

  if (!invoice) notFound();
  const inv = invoice as Invoice & { invoice_line_items: { id: string; description: string; quantity: number; unit_price_cents: number }[] };
  const items = inv.invoice_line_items || [];

  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : "");

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 py-10 md:px-10 md:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href="/invoices"
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          ← Invoices
        </Link>
        <InvoiceActions invoice={inv} appUrl={appUrl} />
      </div>

      <article className="mt-6 border border-rule bg-card">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-rule px-6 py-6 md:px-8">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
              Invoice
            </p>
            <h1 className="mt-1 font-mono text-[1.35rem] tabular-nums tracking-[-0.01em] text-ink">
              {inv.number}
            </h1>
            {inv.title && <p className="mt-1 text-[12px] text-muted">{inv.title}</p>}
          </div>
          <div className="text-right">
            <StatusBadge status={inv.status} />
            <p className="mt-2 font-mono text-[10px] tabular-nums text-muted">
              Issued {new Date(inv.issue_date).toLocaleDateString()}
            </p>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-6 px-6 py-5 md:px-8">
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
              Due
            </p>
            <p className="mt-1.5 font-mono text-[13px] tabular-nums text-ink">
              {new Date(inv.due_date).toLocaleDateString()}
            </p>
            {inv.paid_at && (
              <p className="mt-0.5 font-mono text-[10px] tabular-nums text-accent">
                Paid {new Date(inv.paid_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-y border-rule bg-paper-deep text-left">
              <th className="px-6 py-2 font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted md:px-8">
                Description
              </th>
              <th className="px-2 py-2 text-right font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted">
                Qty
              </th>
              <th className="hidden px-2 py-2 text-right font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted sm:table-cell">
                Unit
              </th>
              <th className="px-6 py-2 text-right font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted md:px-8">
                Amount
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-rule last:border-b-0">
                <td className="px-6 py-3 text-[13px] text-ink md:px-8">{it.description}</td>
                <td className="px-2 py-3 text-right font-mono text-[11px] tabular-nums text-muted">
                  {it.quantity}
                </td>
                <td className="hidden px-2 py-3 text-right font-mono text-[11px] tabular-nums text-muted sm:table-cell">
                  {formatMoney(it.unit_price_cents, inv.currency)}
                </td>
                <td className="px-6 py-3 text-right font-mono text-[11px] tabular-nums text-ink md:px-8">
                  {formatMoney(Math.round(it.quantity * it.unit_price_cents), inv.currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex justify-end px-6 py-5 md:px-8">
          <div className="w-full max-w-[260px] space-y-1.5">
            <div className="flex justify-between text-[12px] text-muted">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">{formatMoney(inv.subtotal_cents, inv.currency)}</span>
            </div>
            <div className="flex justify-between text-[12px] text-muted">
              <span>Tax</span>
              <span className="font-mono tabular-nums">{formatMoney(inv.tax_cents, inv.currency)}</span>
            </div>
            <div className="flex items-baseline justify-between border-t border-rule pt-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">Total</span>
              <span className="font-mono text-[17px] tabular-nums text-ink">
                {formatMoney(inv.total_cents, inv.currency)}
              </span>
            </div>
          </div>
        </div>

        {inv.notes && (
          <div className="border-t border-rule px-6 py-5 md:px-8">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">Notes</p>
            <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-ink-soft">
              {inv.notes}
            </p>
          </div>
        )}

        <div className="border-t border-rule px-6 py-5 md:px-8">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">Pay link</p>
          <code className="mt-1.5 block break-all font-mono text-[11px] text-ink-soft">
            {appUrl}/pay/{inv.pay_token}
          </code>
        </div>
      </article>

      <section className="mt-8">
        <h2 className="text-[13px] font-medium text-ink">Reminder history</h2>
        {reminders.length === 0 ? (
          <p className="mt-3 border border-rule px-4 py-6 text-[12px] text-muted">
            Nothing sent yet. The sequence starts on its own schedule, or send a note
            manually above.
          </p>
        ) : (
          <ul className="mt-3 border border-rule">
            {reminders.map((r: { id: string; tone: string; channel: string; sent_at: string; to_email: string | null }) => (
              <li
                key={r.id}
                className="flex flex-wrap items-baseline justify-between gap-2 border-b border-rule px-4 py-3 last:border-b-0"
              >
                <span className="text-[12px] text-ink-soft">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink">
                    {r.tone}
                  </span>
                  <span className="text-muted"> · {r.channel} · {r.to_email || "manual"}</span>
                </span>
                <span className="font-mono text-[10px] tabular-nums text-muted">
                  {new Date(r.sent_at).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
