import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore, genId } from "@/lib/demo-store";
import { z } from "zod";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().positive(),
  unit_price_cents: z.number().int().nonnegative(),
});

const createSchema = z.object({
  client_id: z.string().uuid().nullable().optional(),
  client_name: z.string().min(1),
  client_email: z.string().email().nullable().optional().or(z.literal("")),
  title: z.string().nullable().optional(),
  issue_date: z.string(),
  due_date: z.string(),
  currency: z.string().default("INR"),
  tax_cents: z.number().int().nonnegative().default(0),
  notes: z.string().nullable().optional(),
  status: z.enum(["draft", "sent"]).default("draft"),
  line_items: z.array(lineItemSchema).min(1),
});

function genInvoiceNumber() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${y}${m}-${rand}`;
}

export async function GET() {
  if (isDemoMode()) {
    const list = [...demoStore.invoices].sort((a, b) => (b.created_at > a.created_at ? 1 : -1));
    return NextResponse.json({ invoices: list });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_line_items(*)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoices: data });
}

export async function POST(request: NextRequest) {
  if (isDemoMode()) {
    const body = await request.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    const subtotal = d.line_items.reduce((s, li) => s + Math.round(li.quantity * li.unit_price_cents), 0);
    const total = subtotal + d.tax_cents;
    const id = genId("inv");
    const inv = {
      id,
      user_id: "demo-user-1",
      client_id: d.client_id || null,
      client_name: d.client_name,
      client_email: d.client_email || null,
      number: `INV-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}-${Math.floor(Math.random() * 9000) + 1000}`,
      title: d.title || null,
      status: d.status,
      issue_date: d.issue_date,
      due_date: d.due_date,
      currency: d.currency,
      subtotal_cents: subtotal,
      tax_cents: d.tax_cents,
      total_cents: total,
      notes: d.notes || null,
      pay_token: `demo-token-${id}`,
      reminder_count: 0,
      last_reminder_at: null,
      paid_at: null,
      viewed_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      invoice_line_items: d.line_items.map((li, i) => ({
        id: genId("li"),
        description: li.description,
        quantity: li.quantity,
        unit_price_cents: li.unit_price_cents,
        sort_order: i,
      })),
    };
    demoStore.invoices.unshift(inv as never);
    return NextResponse.json({ invoice: inv }, { status: 201 });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const d = parsed.data;

  const subtotal = d.line_items.reduce(
    (sum, li) => sum + Math.round(li.quantity * li.unit_price_cents),
    0
  );
  const total = subtotal + d.tax_cents;

  const { data: invoice, error: invErr } = await supabase
    .from("invoices")
    .insert({
      user_id: user!.id,
      client_id: d.client_id || null,
      client_name: d.client_name,
      client_email: d.client_email || null,
      number: genInvoiceNumber(),
      title: d.title || null,
      status: d.status,
      issue_date: d.issue_date,
      due_date: d.due_date,
      currency: d.currency,
      subtotal_cents: subtotal,
      tax_cents: d.tax_cents,
      total_cents: total,
      notes: d.notes || null,
    })
    .select()
    .single();

  if (invErr) {
    if (invErr.message?.includes("free_plan_invoice_limit")) {
      return NextResponse.json(
        { error: "Free includes 3 invoices. Upgrade on the Billing page to add unlimited invoices.", code: "plan_limit" },
        { status: 402 }
      );
    }
    return NextResponse.json({ error: invErr.message }, { status: 500 });
  }

  const items = d.line_items.map((li, i) => ({
    invoice_id: invoice.id,
    description: li.description,
    quantity: li.quantity,
    unit_price_cents: li.unit_price_cents,
    sort_order: i,
  }));

  const { error: liErr } = await supabase.from("invoice_line_items").insert(items);
  if (liErr) return NextResponse.json({ error: liErr.message }, { status: 500 });

  return NextResponse.json({ invoice }, { status: 201 });
}