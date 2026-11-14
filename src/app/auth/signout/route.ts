import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";
import { appOrigin } from "@/lib/app-url";

export async function POST(request: Request) {
  const res = NextResponse.redirect(new URL("/login", appOrigin(request)));
  if (isDemoMode()) {
    res.cookies.delete("demo_session");
  } else {
    const supabase = await createServerSupabase();
    await supabase.auth.signOut();
  }
  return res;
}
