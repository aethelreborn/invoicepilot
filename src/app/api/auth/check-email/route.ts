import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { rateLimitByIp } from "@/lib/rate-limit";
import { checkEmailAddress } from "@/lib/disposable-email";

export const dynamic = "force-dynamic";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: NextRequest) {
  const allowed = await rateLimitByIp("auth:check", request.headers, 20, 3600);
  if (!allowed) {
    return NextResponse.json({ ok: false, reason: "Too many attempts. Try again later." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, reason: "Enter a valid email address." }, { status: 400 });
  }

  const result = await checkEmailAddress(parsed.data.email);
  if (!result.ok) {
    return NextResponse.json({ ok: false, reason: result.reason }, { status: 200 });
  }

  return NextResponse.json({ ok: true });
}
