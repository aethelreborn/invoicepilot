import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";

const schema = z.object({
  business_name: z.string().nullable().optional(),
  business_email: z.string().email().nullable().optional().or(z.literal("")),
  currency: z.string().optional(),
  reminder_tone: z.enum(["friendly", "firm", "final"]).optional(),
});

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ profile: demoStore.profile });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user!.id).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}

export async function PATCH(request: NextRequest) {
  if (isDemoMode()) {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;
    if (d.business_name !== undefined) demoStore.profile.business_name = d.business_name;
    if (d.business_email !== undefined) demoStore.profile.business_email = d.business_email || null;
    if (d.currency !== undefined) demoStore.profile.currency = d.currency;
    if (d.reminder_tone !== undefined) demoStore.profile.reminder_tone = d.reminder_tone;
    demoStore.profile.updated_at = new Date().toISOString();
    return NextResponse.json({ profile: demoStore.profile });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;
  const body = await request.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  const d = parsed.data;
  const update: Record<string, unknown> = {};
  if (d.business_name !== undefined) update.business_name = d.business_name;
  if (d.business_email !== undefined) update.business_email = d.business_email || null;
  if (d.currency !== undefined) update.currency = d.currency;
  if (d.reminder_tone !== undefined) update.reminder_tone = d.reminder_tone;

  const { data, error } = await supabase
    .from("profiles")
    .update(update)
    .eq("id", user!.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}