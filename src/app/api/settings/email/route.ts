import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { encryptSecret } from "@/lib/crypto";
import { rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const schema = z.object({
  resend_api_key: z.string().trim().max(500).nullable().optional(),
  from_name: z.string().trim().max(120).nullable().optional(),
  from_email: z.string().trim().email().max(200).nullable().optional().or(z.literal("")),
  reply_to: z.string().trim().email().max(200).nullable().optional().or(z.literal("")),
});

function summary(settings: Record<string, unknown>) {
  return {
    has_key: Boolean(settings.resend_api_key_enc ?? settings.resend_api_key),
    from_name: settings.from_name ?? null,
    from_email: settings.from_email ?? null,
    reply_to: settings.reply_to ?? null,
  };
}

export async function GET() {
  if (isDemoMode()) {
    return NextResponse.json({ settings: summary(demoStore.emailSettings) });
  }

  const { user, response } = await requireUser();
  if (response) return response;

  const admin = createAdminSupabase();
  const { data, error } = await admin
    .from("email_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ settings: data ? summary(data) : null });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Check the email fields." }, { status: 400 });
  }

  const data = parsed.data;

  if (data.resend_api_key && !data.resend_api_key.startsWith("re_")) {
    return NextResponse.json(
      { error: "Resend API keys start with re_." },
      { status: 400 }
    );
  }

  if (isDemoMode()) {
    const target = demoStore.emailSettings;
    if (data.resend_api_key) target.resend_api_key = data.resend_api_key;
    if (data.from_name !== undefined) target.from_name = data.from_name || null;
    if (data.from_email !== undefined) target.from_email = data.from_email || null;
    if (data.reply_to !== undefined) target.reply_to = data.reply_to || null;
    return NextResponse.json({ settings: summary(target) });
  }

  const { user, response } = await requireUser();
  if (response) return response;

  const allowed = await rateLimit("settings:email", user!.id, 20, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many changes. Try again later." }, { status: 429 });
  }

  const admin = createAdminSupabase();
  const update: Record<string, unknown> = { user_id: user!.id };

  if (data.from_name !== undefined) update.from_name = data.from_name || null;
  if (data.from_email !== undefined) update.from_email = data.from_email || null;
  if (data.reply_to !== undefined) update.reply_to = data.reply_to || null;

  if (data.resend_api_key) {
    try {
      update.resend_api_key_enc = await encryptSecret(data.resend_api_key);
    } catch (error) {
      console.error("secret encryption failed", (error as Error).message);
      return NextResponse.json(
        { error: "Server encryption is not configured. Set SECRETS_KEY." },
        { status: 500 }
      );
    }
  }

  const { error } = await admin
    .from("email_settings")
    .upsert(update, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: saved } = await admin
    .from("email_settings")
    .select("*")
    .eq("user_id", user!.id)
    .maybeSingle();

  return NextResponse.json({ settings: saved ? summary(saved) : null });
}
