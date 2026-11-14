import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/api";
import { rateLimit } from "@/lib/rate-limit";
import { checkoutAmountCents, renewalDaysFor, isPlanId, type BillingInterval } from "@/lib/plans";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  plan: z.enum(["starter", "growth"]).default("starter"),
  interval: z.enum(["monthly", "annual"]).default("monthly"),
});

export async function GET() {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const [{ data: payments }, { data: profile }] = await Promise.all([
    supabase.from("platform_payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }),
    supabase.from("profiles").select("plan, plan_renews_at").eq("id", user!.id).maybeSingle(),
  ]);

  return NextResponse.json({ payments: payments || [], profile: profile || null });
}

export async function POST(request: NextRequest) {
  const { user, supabase, response } = await requireUser();
  if (response) return response;

  const allowed = await rateLimit(`billing:create:${user!.id}`, user!.id, 5, 3600);
  if (!allowed) {
    return NextResponse.json({ error: "Too many upgrade attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body ?? {});
  if (!parsed.success || !isPlanId(parsed.data.plan)) {
    return NextResponse.json({ error: "Unknown plan." }, { status: 400 });
  }
  const plan = parsed.data.plan;
  const interval: BillingInterval = parsed.data.interval;

  const reference = `IP-${crypto.randomUUID()}`;
  const { error } = await supabase.from("platform_payments").insert({
    user_id: user!.id,
    plan,
    interval,
    amount_cents: checkoutAmountCents(plan, interval),
    currency: "INR",
    reference,
    status: "pending",
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: list } = await supabase.from("platform_payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(1);

  return NextResponse.json({ payment: list?.[0] || null, renewalDays: renewalDaysFor(interval) });
}
