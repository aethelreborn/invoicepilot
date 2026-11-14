import { NextResponse } from "next/server";
import { isDemoMode } from "@/lib/demo";

export async function POST() {
  if (!isDemoMode()) {
    return NextResponse.json({ error: "Not in demo mode" }, { status: 400 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set("demo_session", "1", { path: "/", httpOnly: true, sameSite: "lax" });
  return res;
}