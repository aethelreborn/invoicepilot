import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore, genId } from "@/lib/demo-store";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email().nullable().optional().or(z.literal("")),
  company: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ clients: [...demoStore.clients].sort((a, b) => a.name.localeCompare(b.name)) });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .eq("user_id", user!.id)
    .order("name", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ clients: data });
}

export async function POST(request: NextRequest) {
  if (isDemoMode()) {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    const c = {
      id: genId("c"),
      user_id: "demo-user-1",
      name: d.name,
      email: d.email || null,
      company: d.company || null,
      phone: d.phone || null,
      notes: d.notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    demoStore.clients.push(c);
    return NextResponse.json({ client: c }, { status: 201 });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const { data, error } = await supabase
    .from("clients")
    .insert({
      user_id: user!.id,
      name: d.name,
      email: d.email || null,
      company: d.company || null,
      phone: d.phone || null,
      notes: d.notes || null,
    })
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ client: data }, { status: 201 });
}