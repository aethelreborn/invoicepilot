import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabase } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo";

export async function requireAdmin() {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const session = cookieStore.get("demo_session");
    if (!session) {
      return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
    }
    return { ok: true as const, response: null, userId: "demo-user-1" };
  }

  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { ok: true as const, response: null, userId: user.id };
}
