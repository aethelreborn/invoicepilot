import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { DEFAULT_TEMPLATES, type ReminderTemplate } from "@/lib/reminders";
import type { ReminderTone } from "@/lib/types";

export type TemplateMap = Record<ReminderTone, ReminderTemplate>;

const TONES: ReminderTone[] = ["friendly", "firm", "final"];

export async function loadTemplates(userId: string): Promise<TemplateMap> {
  const merged: TemplateMap = {
    friendly: { ...DEFAULT_TEMPLATES.friendly },
    firm: { ...DEFAULT_TEMPLATES.firm },
    final: { ...DEFAULT_TEMPLATES.final },
  };

  if (isDemoMode()) {
    for (const row of demoStore.templates) {
      merged[row.tone] = { subject: row.subject, body: row.body };
    }
    return merged;
  }

  const admin = createAdminSupabase();
  const { data } = await admin
    .from("reminder_templates")
    .select("tone, subject, body")
    .eq("user_id", userId);

  for (const row of data || []) {
    const tone = row.tone as ReminderTone;
    if (TONES.includes(tone)) {
      merged[tone] = { subject: row.subject, body: row.body };
    }
  }

  return merged;
}
