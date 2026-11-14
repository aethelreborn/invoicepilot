"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Client } from "@/lib/types";

interface LineItem {
  description: string;
  quantity: number;
  unit_price: string;
}

const label =
  "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted";
const field =
  "w-full border border-rule bg-card px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-ink";

export default function NewInvoicePage() {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [clientId, setClientId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [title, setTitle] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [currency, setCurrency] = useState("INR");
  const [tax, setTax] = useState("0");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"draft" | "sent">("sent");
  const [items, setItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unit_price: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/clients")
      .then((r) => r.json())
      .then((d) => setClients(d.clients || []));
  }, []);

  function onClientChange(id: string) {
    setClientId(id);
    const c = clients.find((x) => x.id === id);
    if (c) {
      setClientName(c.name);
      setClientEmail(c.email || "");
    }
  }

  function updateItem(i: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { description: "", quantity: 1, unit_price: "" }]);
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  const subtotalCents = items.reduce((s, it) => {
    const price = parseFloat(it.unit_price || "0");
    return s + Math.round(it.quantity * price * 100);
  }, 0);
  const taxCents = Math.round(parseFloat(tax || "0") * 100);
  const totalCents = subtotalCents + taxCents;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!clientName.trim()) {
      setError("Client name is required");
      return;
    }
    if (items.some((it) => !it.description.trim())) {
      setError("All line items need a description");
      return;
    }
    setSaving(true);
    const payload = {
      client_id: clientId || null,
      client_name: clientName.trim(),
      client_email: clientEmail.trim() || null,
      title: title.trim() || null,
      issue_date: issueDate,
      due_date: dueDate,
      currency,
      tax_cents: taxCents,
      notes: notes.trim() || null,
      status,
      line_items: items.map((it) => ({
        description: it.description.trim(),
        quantity: it.quantity,
        unit_price_cents: Math.round(parseFloat(it.unit_price || "0") * 100),
      })),
    };
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setError(d.error ? JSON.stringify(d.error) : "Failed to create invoice");
      return;
    }
    const d = await res.json();
    router.push(`/invoices/${d.invoice.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-[860px] px-6 py-10 md:px-10 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            New
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
            Write an invoice.
          </h1>
        </div>
        <Link
          href="/invoices"
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-ink"
        >
          ← Invoices
        </Link>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <Section title="Client">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="existing" className={label}>
                Existing client
              </label>
              <select
                id="existing"
                value={clientId}
                onChange={(e) => onClientChange(e.target.value)}
                className={field}
              >
                <option value="">— New / manual —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="clientName" className={label}>
                Client name *
              </label>
              <input
                id="clientName"
                required
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="clientEmail" className={label}>
                Client email
              </label>
              <input
                id="clientEmail"
                type="email"
                value={clientEmail}
                onChange={(e) => setClientEmail(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="title" className={label}>
                Title / reference
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={field}
                placeholder="Website redesign"
              />
            </div>
          </div>
        </Section>

        <Section title="Details">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div>
              <label htmlFor="issueDate" className={label}>
                Issued
              </label>
              <input
                id="issueDate"
                type="date"
                value={issueDate}
                onChange={(e) => setIssueDate(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="dueDate" className={label}>
                Due
              </label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className={field}
              />
            </div>
            <div>
              <label htmlFor="currency" className={label}>
                Currency
              </label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={field}
              >
                <option>INR</option>
                <option>USD</option>
                <option>EUR</option>
                <option>GBP</option>
                <option>AED</option>
                <option>SGD</option>
                <option>AUD</option>
                <option>CAD</option>
                <option>NZD</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className={label}>
                On save
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "draft" | "sent")}
                className={field}
              >
                <option value="draft">Keep as draft</option>
                <option value="sent">Mark as sent</option>
              </select>
            </div>
          </div>
        </Section>

        <Section title="Line items">
          <div className="space-y-2">
            <div className="hidden grid-cols-12 gap-2 md:grid">
              <p className={`col-span-6 ${label}`}>Description</p>
              <p className={`col-span-2 ${label}`}>Qty</p>
              <p className={`col-span-3 ${label}`}>Unit price</p>
              <span className="col-span-1" />
            </div>
            {items.map((it, i) => (
              <div key={i} className="grid grid-cols-12 items-center gap-2">
                <div className="col-span-12 md:col-span-6">
                  <input
                    value={it.description}
                    onChange={(e) => updateItem(i, { description: e.target.value })}
                    className={field}
                    placeholder="Design work"
                    aria-label={`Line ${i + 1} description`}
                  />
                </div>
                <div className="col-span-4 md:col-span-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={it.quantity}
                    onChange={(e) => updateItem(i, { quantity: parseFloat(e.target.value) || 1 })}
                    className={`${field} text-right tabular-nums`}
                    aria-label={`Line ${i + 1} quantity`}
                  />
                </div>
                <div className="col-span-6 md:col-span-3">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={it.unit_price}
                    onChange={(e) => updateItem(i, { unit_price: e.target.value })}
                    className={`${field} text-right tabular-nums`}
                    placeholder="0.00"
                    aria-label={`Line ${i + 1} unit price`}
                  />
                </div>
                <div className="col-span-2 flex justify-end md:col-span-1">
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="px-2 py-2 text-[15px] leading-none text-muted transition-colors hover:text-stamp"
                      aria-label={`Remove line ${i + 1}`}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-3 border-b border-rule pb-0.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            + Add line item
          </button>

          <div className="mt-6 ml-auto max-w-[280px] space-y-2 border-t border-rule pt-4">
            <div className="flex justify-between text-[12px] text-muted">
              <span>Subtotal</span>
              <span className="font-mono tabular-nums">
                {currency} {(subtotalCents / 100).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between text-[12px] text-muted">
              <label htmlFor="tax">Tax</label>
              <input
                id="tax"
                type="number"
                min="0"
                step="0.01"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
                className="w-24 border border-rule bg-card px-2 py-1 text-right font-mono text-[11px] tabular-nums text-ink outline-none focus:border-ink"
              />
            </div>
            <div className="flex items-baseline justify-between border-t border-rule pt-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
                Total
              </span>
              <span className="font-mono text-[16px] tabular-nums text-ink">
                {currency} {(totalCents / 100).toFixed(2)}
              </span>
            </div>
          </div>
        </Section>

        <Section title="Notes">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className={field}
            placeholder="Payment terms, thank you note, bank details."
          />
        </Section>

        {error && (
          <p className="border-l-2 border-stamp bg-stamp/[0.04] px-3 py-2 text-[12px] text-stamp">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3 border-t border-rule pt-6">
          <Link
            href="/invoices"
            className="flex h-10 items-center border border-rule px-4 text-[12px] text-ink-soft transition-colors hover:border-ink hover:text-ink"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex h-10 items-center bg-ink px-5 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            {saving ? "Saving…" : "Create invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-rule bg-card p-5 md:p-6">
      <h2 className="mb-4 border-b border-rule pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
        {title}
      </h2>
      {children}
    </section>
  );
}
