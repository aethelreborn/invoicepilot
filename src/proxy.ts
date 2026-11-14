import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { isDemoMode } from "@/lib/demo";

// Simple in-memory rate limiter (per edge instance)
const rateLimitMap = new Map<string, { count: number; reset: number }>();
function rateLimit(ip: string, limit = 60, windowMs = 60000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.reset) {
    rateLimitMap.set(ip, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count++;
  if (entry.count > limit) return false;
  return true;
}

export async function proxy(request: NextRequest) {
  // Rate limit API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!rateLimit(ip)) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json", "Retry-After": "60" },
      });
    }
  }

  if (isDemoMode()) {
    const path = request.nextUrl.pathname;
    const isAppRoute = path.startsWith("/dashboard") ||
      path.startsWith("/invoices") ||
      path.startsWith("/clients") ||
      path.startsWith("/settings");
    const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");
    const hasSession = request.cookies.get("demo_session")?.value === "1";

    if (isAppRoute && !hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirect", path);
      return NextResponse.redirect(url);
    }
    if (isAuthRoute && hasSession) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  let user = null;
  try {
    const res = await supabase.auth.getUser();
    user = res.data?.user ?? null;
  } catch {
    // Network/env issue: allow request through; pages handle auth themselves.
    return supabaseResponse;
  }

  const path = request.nextUrl.pathname;
  const isAppRoute = path.startsWith("/dashboard") ||
    path.startsWith("/invoices") ||
    path.startsWith("/clients") ||
    path.startsWith("/settings");
  const isAuthRoute = path.startsWith("/login") || path.startsWith("/signup");

  if (isAppRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  if (isAuthRoute && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|pay|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};