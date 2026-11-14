import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const STARTER_AMOUNT_CENTS = 79900;

export async function GET() {
  const { user, response } = await requireUser();
  if (response) return response;

  const supabase = await createServerSupabase();
  const { data } = await supabase.from("platform_payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });

  return NextResponse.json({ payments: data || [] });
}

export async function POST() {
  const { user, response } = await requireUser();
  if (response) return response;

  const allowed = await rateLimit(`billing:create:${user!.id}`, user!.id, 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many upgrade attempts. Try again later." }, { status: 429 });
  }

  const supabase = await createServerSupabase();
  const reference = `IP-${crypto.randomUUID()}`;
  const { error } = await supabase.from("platform_payments").insert({
    user_id: user!.id,
    plan: "starter",
    amount_cents: STARTER_AMOUNT_CENTS,
    currency: "INR",
    reference,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: payment } = await supabase.from("platform_payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1);

  return NextResponse.json({ payment: payment?.[0] || null });
}
