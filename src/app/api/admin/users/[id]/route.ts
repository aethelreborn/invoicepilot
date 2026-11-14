import { NextResponse, type NextRequest } from "next/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({ confirm: z.literal("DELETE") });

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const adminCheck = await requireAdmin();
  const response = adminCheck.response;
  if (response) return response;

  const allowed = await rateLimit(`admin:user_delete:${id}`, adminCheck.userId, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Send confirm: DELETE." }, { status: 400 });
  }

  const admin = createAdminSupabase();
  const { data: target, error: targetError } = await admin
    .from("profiles")
    .select("id, email, role")
    .eq("id", id)
    .maybeSingle();

  if (targetError) return NextResponse.json({ error: targetError.message }, { status: 500 });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.id === adminCheck.userId) {
    return NextResponse.json({ error: "You cannot delete your own admin account." }, { status: 400 });
  }
  if (target.role === "admin") {
    return NextResponse.json({ error: "Admin accounts cannot be deleted from here." }, { status: 400 });
  }

  // Money rows survive the account so the subscription ledger stays intact.
  const { error: unlinkError } = await admin
    .from("platform_payments")
    .update({ user_id: null })
    .eq("user_id", id);
  if (unlinkError) {
    return NextResponse.json({ error: `Could not preserve payment records: ${unlinkError.message}` }, { status: 500 });
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(id);
  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  const { error: auditError } = await admin.from("audit_log").insert({
    actor_id: adminCheck.userId,
    action: "admin.user.deleted",
    target_type: "user",
    target_id: id,
    metadata: { email: target.email },
  });
  if (auditError) console.error("audit insert failed after user delete", auditError.message);

  return NextResponse.json({ ok: true });
}
