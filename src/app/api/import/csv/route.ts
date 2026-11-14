import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";

function parseCSV(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/^"|"$/g, ""));
  const sanitize = (v: string) => {
    const t = v.trim().replace(/^"|"$/g, "");
    // Prevent CSV formula injection
    if (/^[=+@\\t\\r-]/.test(t)) return "'" + t;
    return t;
  };
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = sanitize(cols[idx] || "");
    });
    rows.push(row);
  }
  return rows;
}

export async function POST(request: NextRequest) {
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const form = await request.formData();
  const file = form.get("file") as File | null;
  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const text = await file.text();
  const rows = parseCSV(text);
  if (rows.length === 0) return NextResponse.json({ error: "Empty CSV" }, { status: 400 });

  let imported = 0;
  const errors: string[] = [];

  for (const r of rows) {
    const clientName = r.client_name || r.client || "Unknown client";
    const total = parseFloat(r.total || r.amount || "0");
    const totalCents = Math.round(total * 100);
    const issueDate = r.issue_date || new Date().toISOString().slice(0, 10);
    const dueDate = r.due_date || issueDate;
    const status = (r.status || "sent").toLowerCase();

    const { data: invoice, error: invErr } = await supabase
      .from("invoices")
      .insert({
        user_id: user!.id,
        client_name: clientName,
        client_email: r.client_email || null,
        number: r.number || `IMP-${Date.now()}-${imported}`,
        status: ["draft", "sent", "paid", "overdue", "void"].includes(status) ? status : "sent",
        issue_date: issueDate,
        due_date: dueDate,
        currency: r.currency || "INR",
        subtotal_cents: totalCents,
        tax_cents: 0,
        total_cents: totalCents,
        notes: r.notes || null,
      })
      .select()
      .single();

    if (invErr) {
      errors.push(invErr.message);
      continue;
    }

    // create a single line item
    await supabase.from("invoice_line_items").insert({
      invoice_id: invoice.id,
      description: r.description || "Imported invoice",
      quantity: 1,
      unit_price_cents: totalCents,
      sort_order: 0,
    });

    imported++;
  }

  return NextResponse.json({ imported, errors });
}