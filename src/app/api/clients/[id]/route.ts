import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  company: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, user, response } = await requireUser();
  if (response) return response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const update: Record<string, unknown> = {};
  if (d.name !== undefined) update.name = d.name;
  if (d.email !== undefined) update.email = d.email || null;
  if (d.company !== undefined) update.company = d.company || null;
  if (d.phone !== undefined) update.phone = d.phone || null;
  if (d.notes !== undefined) update.notes = d.notes || null;

  const { data, error } = await supabase
    .from("clients")
    .update(update)
    .eq("id", id)
    .eq("user_id", user!.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (isDemoMode()) {
    const idx = demoStore.clients.findIndex((c) => c.id === id);
    if (idx !== -1) demoStore.clients.splice(idx, 1);
    return NextResponse.json({ ok: true });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;
  const { error } = await supabase.from("clients").delete().eq("id", id).eq("user_id", user!.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}