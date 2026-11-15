import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return NextResponse.json({ authenticated: false }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, email, plan")
    .eq("id", user!.id)
    .maybeSingle();

  return NextResponse.json({
    authenticated: true,
    email: profile?.email || user!.email || null,
    name: profile?.business_name || null,
    plan: profile?.plan || "free",
  });
}
