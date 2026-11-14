"use client";

import { useEffect, useState } from "react";
import type { Client } from "@/lib/types";

const label =
  "mb-1.5 block font-mono text-[9px] uppercase tracking-[0.16em] text-muted";
const field =
  "w-full border border-rule bg-card px-3 py-2 text-[13px] text-ink outline-none transition-colors placeholder:text-muted/50 focus:border-ink";

export default function ClientsManager() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [saving, setSaving] = useState(false);

  async function load() {
    const res = await fetch("/api/clients");
    const d = await res.json();
    setClients(d.clients || []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;
    (async () => {
      const res = await fetch("/api/clients");
      const d = await res.json();
      if (active) {
        setClients(d.clients || []);
        setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  async function addClient(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email: email || null, company: company || null }),
    });
    setSaving(false);
    setName("");
    setEmail("");
    setCompany("");
    setShowForm(false);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this client?")) return;
    await fetch(`/api/clients/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-10 md:px-10 md:py-12">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-rule pb-6">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">
            {loading
              ? "—"
              : `${clients.length} ${clients.length === 1 ? "client" : "clients"}`}
          </p>
          <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
            Clients
          </h1>
        </div>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="flex h-10 items-center bg-ink px-4 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft"
        >
          {showForm ? "Close" : "Add client"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={addClient}
          className="mt-6 grid grid-cols-1 items-end gap-4 border border-rule bg-card p-5 md:grid-cols-4"
        >
          <div>
            <label htmlFor="c-name" className={label}>
              Name *
            </label>
            <input
              id="c-name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="c-email" className={label}>
              Email
            </label>
            <input
              id="c-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>
          <div>
            <label htmlFor="c-company" className={label}>
              Company
            </label>
            <input
              id="c-company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className={field}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex h-[38px] items-center justify-center bg-ink px-4 text-[12px] font-medium text-paper transition-colors hover:bg-ink-soft disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save client"}
          </button>
        </form>
      )}

      <div className="mt-6 border border-rule">
        {loading ? (
          <p className="p-10 text-center font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            Loading…
          </p>
        ) : clients.length === 0 ? (
          <p className="p-10 text-center text-[13px] text-muted">
            No clients yet. Add one to reuse their details on invoices.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-rule bg-paper-deep text-left">
                <th className="px-4 py-2 font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted">
                  Name
                </th>
                <th className="hidden px-4 py-2 font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted sm:table-cell">
                  Company
                </th>
                <th className="hidden px-4 py-2 font-mono text-[8px] font-normal uppercase tracking-[0.16em] text-muted sm:table-cell">
                  Email
                </th>
                <th className="px-4 py-2" />
              </tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-rule last:border-b-0 hover:bg-card">
                  <td className="px-4 py-3 text-[12px] font-medium text-ink">{c.name}</td>
                  <td className="hidden px-4 py-3 text-[12px] text-ink-soft sm:table-cell">
                    {c.company || "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-[12px] text-muted sm:table-cell">
                    {c.email || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => remove(c.id)}
                      className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted transition-colors hover:text-stamp"
                    >
                      Delete
                    </button>
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
