import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";

export async function DELETE() {
  if (isDemoMode()) {
    demoStore.invoices = [];
    demoStore.clients = [];
    demoStore.reminders = [];
    const res = NextResponse.json({ ok: true });
    res.cookies.delete("demo_session");
    return res;
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  // Delete user data (RLS cascades handle related rows)
  await supabase.from("invoices").delete().eq("user_id", user!.id);
  await supabase.from("clients").delete().eq("user_id", user!.id);
  await supabase.from("profiles").delete().eq("id", user!.id);
  await supabase.auth.admin.deleteUser(user!.id).catch(() => {});

  const res = NextResponse.json({ ok: true });
  return res;
}