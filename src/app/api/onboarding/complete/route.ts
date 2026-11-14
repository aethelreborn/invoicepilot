import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function POST() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const allowed = await rateLimit("onboarding:complete", user!.id, 10, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ onboarding_completed_at: new Date().toISOString() })
    .eq("id", user!.id)
    .is("onboarding_completed_at", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
