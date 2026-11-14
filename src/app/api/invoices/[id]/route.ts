import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";

const updateSchema = z.object({
  client_name: z.string().min(1).optional(),
  client_email: z.string().email().nullable().optional().or(z.literal("")),
  title: z.string().nullable().optional(),
  status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "void"]).optional(),
  issue_date: z.string().optional(),
  due_date: z.string().optional(),
  currency: z.string().optional(),
  tax_cents: z.number().int().nonnegative().optional(),
  notes: z.string().nullable().optional(),
  line_items: z
    .array(
      z.object({
        description: z.string().min(1),
        quantity: z.number().positive(),
        unit_price_cents: z.number().int().nonnegative(),
      })
    )
    .optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemoMode()) {
    const inv = demoStore.invoices.find((i) => i.id === id);
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ invoice: inv });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { data, error } = await supabase
    .from("invoices")
    .select("*, invoice_line_items(*)")
    .eq("id", id)
    .eq("user_id", user!.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });
  return NextResponse.json({ invoice: data });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemoMode()) {
    const inv = demoStore.invoices.find((i) => i.id === id);
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    if (d.client_name !== undefined) inv.client_name = d.client_name;
    if (d.client_email !== undefined) inv.client_email = d.client_email || null;
    if (d.title !== undefined) inv.title = d.title;
    if (d.status !== undefined) {
      inv.status = d.status;
      if (d.status === "paid") inv.paid_at = new Date().toISOString();
    }
    if (d.issue_date !== undefined) inv.issue_date = d.issue_date;
    if (d.due_date !== undefined) inv.due_date = d.due_date;
    if (d.currency !== undefined) inv.currency = d.currency;
    if (d.tax_cents !== undefined) inv.tax_cents = d.tax_cents;
    if (d.notes !== undefined) inv.notes = d.notes;
    if (d.line_items) {
      const subtotal = d.line_items.reduce((s, li) => s + Math.round(li.quantity * li.unit_price_cents), 0);
      inv.subtotal_cents = subtotal;
      inv.total_cents = subtotal + inv.tax_cents;
      inv.invoice_line_items = d.line_items.map((li, i) => ({
        id: `li${Date.now()}${i}`,
        description: li.description,
        quantity: li.quantity,
        unit_price_cents: li.unit_price_cents,
        sort_order: i,
      }));
    }
    inv.updated_at = new Date().toISOString();
    return NextResponse.json({ invoice: inv });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const body = await request.json();
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;

  const update: Record<string, unknown> = {};
  if (d.client_name !== undefined) update.client_name = d.client_name;
  if (d.client_email !== undefined) update.client_email = d.client_email || null;
  if (d.title !== undefined) update.title = d.title;
  if (d.status !== undefined) {
    update.status = d.status;
    if (d.status === "paid") update.paid_at = new Date().toISOString();
  }
  if (d.issue_date !== undefined) update.issue_date = d.issue_date;
  if (d.due_date !== undefined) update.due_date = d.due_date;
  if (d.currency !== undefined) update.currency = d.currency;
  if (d.tax_cents !== undefined) update.tax_cents = d.tax_cents;
  if (d.notes !== undefined) update.notes = d.notes;

  if (d.line_items) {
    const subtotal = d.line_items.reduce(
      (sum, li) => sum + Math.round(li.quantity * li.unit_price_cents),
      0
    );
    update.subtotal_cents = subtotal;
    let taxValue: number;
    if (d.tax_cents !== undefined) {
      taxValue = d.tax_cents;
    } else {
      const { data: inv } = await supabase.from("invoices").select("tax_cents").eq("id", id).single();
      taxValue = inv?.tax_cents ?? 0;
    }
    update.total_cents = subtotal + taxValue;
    if (d.tax_cents !== undefined) update.tax_cents = d.tax_cents;
    // replace line items
    await supabase.from("invoice_line_items").delete().eq("invoice_id", id);
    const items = d.line_items.map((li, i) => ({
      invoice_id: id,
      description: li.description,
      quantity: li.quantity,
      unit_price_cents: li.unit_price_cents,
      sort_order: i,
    }));
    if (items.length) await supabase.from("invoice_line_items").insert(items);
  } else if (d.tax_cents !== undefined) {
    // recompute total with existing subtotal
    const { data: inv } = await supabase
      .from("invoices")
      .select("subtotal_cents")
      .eq("id", id)
      .single();
    if (inv) update.total_cents = inv.subtotal_cents + d.tax_cents;
  }

  const { data, error } = await supabase
    .from("invoices")
    .update(update)
    .eq("id", id)
    .eq("user_id", user!.id)
    .select("*, invoice_line_items(*)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ invoice: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemoMode()) {
    const idx = demoStore.invoices.findIndex((i) => i.id === id);
    if (idx !== -1) demoStore.invoices.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const { error } = await supabase
    .from("invoices")
    .delete()
    .eq("id", id)
    .eq("user_id", user!.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}