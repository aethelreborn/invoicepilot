import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { isPaidPlan, renewalDaysFor } from "@/lib/plans";

export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["free", "starter", "growth"]),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminCheck = await requireAdmin();
  const response = adminCheck.response;
  if (response) return response;

  const allowed = await rateLimit(`admin:user_plan:${id}`, adminCheck.userId, 30, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Plan must be free, starter or growth." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { error } = await admin
    .from("profiles")
    .update({
      plan: parsed.data.plan,
      plan_renews_at: isPaidPlan(parsed.data.plan) ? new Date(Date.now() + renewalDaysFor("monthly") * 24 * 60 * 60 * 1000).toISOString() : null,
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: audit } = await admin
    .from("audit_log")
    .insert({
      actor_id: adminCheck.userId,
      action: "admin.plan.updated",
      target_type: "user",
      target_id: id,
      metadata: { plan: parsed.data.plan },
    })
    .select("id")
    .single();

  void audit;

  return NextResponse.json({ ok: true });
}
