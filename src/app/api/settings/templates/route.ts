import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { z } from "zod";
import { DEFAULT_TEMPLATES } from "@/lib/reminders";
import { loadTemplates } from "@/lib/email/templates-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { rateLimit } from "@/lib/rate-limit";
import type { ReminderTone } from "@/lib/types";

export const dynamic = "force-dynamic";

const toneNames: ReminderTone[] = ["friendly", "firm", "final"];

const templateShape = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().max(4000),
});

const schema = z.object({
  friendly: templateShape.optional(),
  firm: templateShape.optional(),
  final: templateShape.optional(),
});


export async function GET() {
  if (isDemoMode()) {
    const templates = { ...DEFAULT_TEMPLATES };
    for (const row of demoStore.templates) {
      templates[row.tone] = { subject: row.subject, body: row.body };
    }
    return NextResponse.json({ templates });
  }

  const { user, response } = await requireUser();
  if (response) return response;

  const templates = await loadTemplates(user!.id);
  return NextResponse.json({ templates });
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Check the template fields." }, { status: 400 });
  }

  if (isDemoMode()) {
    const updates: { tone: ReminderTone; subject: string; body: string }[] = [];
    for (const tone of toneNames) {
      const override = parsed.data[tone];
      if (override) updates.push({ tone, subject: override.subject, body: override.body });
    }
    for (const update of updates) {
      demoStore.templates = demoStore.templates.filter((t) => t.tone !== update.tone);
      demoStore.templates.push({ tone: update.tone, subject: update.subject, body: update.body });
    }
    const templates = { ...DEFAULT_TEMPLATES };
    for (const row of demoStore.templates) {
      templates[row.tone] = { subject: row.subject, body: row.body };
    }
    return NextResponse.json({ templates });
  }

  const { user, response } = await requireUser();
  if (response) return response;

  const allowed = await rateLimit("settings:templates", user!.id, 30, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many changes. Try again later." }, { status: 429 });
  }

  const admin = createAdminSupabase();
  const upserts = toneNames
    .map((tone) => ({ tone, ...parsed.data[tone] }))
    .filter((row) => Boolean(row.subject && row.body));

  for (const row of upserts) {
    const { error } = await admin.from("reminder_templates").upsert(
      {
        user_id: user!.id,
        tone: row.tone,
        subject: row.subject,
        body: row.body,
      },
      { onConflict: "user_id,tone" }
    );
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  const templates = await loadTemplates(user!.id);
  return NextResponse.json({ templates });
}
