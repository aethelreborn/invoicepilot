import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminCheck = await requireAdmin();
  const response = adminCheck.response;
  if (response) return response;

  const allowed = await rateLimit(`admin:platform_payment:${id}`, adminCheck.userId, 30, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const admin = createAdminSupabase();
  const { data: payment, error } = await admin.from("platform_payments").select("*").eq("id", id).maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const approved = payment.status !== "paid";
  const { error: updateError } = await admin
    .from("platform_payments")
    .update({
      status: approved ? "paid" : "rejected",
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

  if (approved) {
    const nextPlan = "starter";
    const renewsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: profileError } = await admin
      .from("profiles")
      .update({ plan: nextPlan, plan_renews_at: renewsAt })
      .eq("id", payment.user_id);
    if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, approved });
}
