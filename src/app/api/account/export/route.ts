import { NextResponse } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({
      profile: demoStore.profile,
      clients: demoStore.clients,
      invoices: demoStore.invoices,
      reminders: demoStore.reminders,
      exported_at: new Date().toISOString(),
    });
  }
  const { supabase, user, response } = await requireUser();
  if (response) return response;

  const [profile, clients, invoices] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user!.id).single(),
    supabase.from("clients").select("*").eq("user_id", user!.id),
    supabase.from("invoices").select("*, invoice_line_items(*)").eq("user_id", user!.id),
  ]);

  return NextResponse.json({
    profile: profile.data,
    clients: clients.data,
    invoices: invoices.data,
    exported_at: new Date().toISOString(),
  });
}