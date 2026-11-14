import { NextResponse, type NextRequest } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, response } = await requireUser();
  if (response) return response;

  const allowed = await rateLimit(`billing:utr:${id}`, user!.id, 60, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const utr = typeof body?.utr === "string" ? body.utr.trim().toUpperCase() : null;
  if (!utr) {
    return NextResponse.json({ error: "UTR is required." }, { status: 400 });
  }

  const supabase = await createServerSupabase();
  const { data: payment, error } = await supabase.from("platform_payments").select("*").eq("id", id).eq("user_id", user!.id).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (payment.status !== "pending") {
    return NextResponse.json({ error: "This subscription is already resolved." }, { status: 409 });
  }

  const { error: updateError } = await supabase
    .from("platform_payments")
    .update({ status: "submitted", utr, submitted_at: new Date().toISOString() })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
