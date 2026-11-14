"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Invoice } from "@/lib/types";

export default function InvoiceActions({ invoice, appUrl }: { invoice: Invoice; appUrl: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [manual, setManual] = useState<{ subject: string; body: string; to: string | null } | null>(null);

  const payUrl = `${appUrl}/pay/${invoice.pay_token}`;

  async function sendReminder(tone?: string) {
    setLoading(true);
    setMsg(null);
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoice_id: invoice.id, tone }),
    });
    const d = await res.json();
    setLoading(false);
    if (!res.ok) {
      setMsg("Failed to send reminder");
      return;
    }
    if (d.sent) {
      setMsg("Reminder sent by email.");
    } else {
      setManual({ subject: d.subject, body: d.body, to: d.to });
      setMsg(
        d.reason === "no_api_key"
          ? "Email is not configured — copy the reminder below."
          : `Not sent (${d.reason}). Copy below.`
      );
    }
    router.refresh();
  }

  async function markPaid() {
    setLoading(true);
    await fetch(`/api/invoices/${invoice.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "paid" }),
    });
    setLoading(false);
    router.refresh();
  }

  async function deleteInvoice() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setLoading(true);
    await fetch(`/api/invoices/${invoice.id}`, { method: "DELETE" });
    router.push("/invoices");
  }

  function copyLink() {
    navigator.clipboard.writeText(payUrl);
    setMsg("Pay link copied.");
  }

  const btn =
    "flex h-9 items-center border border-rule px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-40";

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex flex-wrap justify-end gap-2">
        <button onClick={copyLink} className={btn}>
          Copy pay link
        </button>
        {invoice.status !== "paid" && (
          <>
            <button onClick={() => sendReminder("friendly")} disabled={loading} className={btn}>
              Send reminder
            </button>
            <button
              onClick={markPaid}
              disabled={loading}
              className="flex h-9 items-center border border-accent bg-accent px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-paper transition-colors hover:bg-ink hover:border-ink disabled:opacity-40"
            >
              Mark paid
            </button>
          </>
        )}
        <button
          onClick={deleteInvoice}
          disabled={loading}
          className="flex h-9 items-center px-2 font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-stamp disabled:opacity-40"
        >
          Delete
        </button>
      </div>

      {msg && <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-muted">{msg}</p>}

      {manual && (
        <div className="mt-1 w-full max-w-[460px] border border-rule bg-card p-4 text-left">
          <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-muted">To</p>
          <p className="mt-0.5 text-[12px] text-ink-soft">{manual.to || "(no client email)"}</p>
          <p className="mt-3 font-mono text-[8px] uppercase tracking-[0.16em] text-muted">Subject</p>
          <p className="mt-0.5 text-[12px] text-ink-soft">{manual.subject}</p>
          <pre className="mt-3 whitespace-pre-wrap border-t border-rule pt-3 font-sans text-[12px] leading-relaxed text-ink-soft">
            {manual.body}
          </pre>
          <button
            onClick={() =>
              navigator.clipboard.writeText(`Subject: ${manual.subject}\n\n${manual.body}`)
            }
            className="mt-3 border-b border-ink pb-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
