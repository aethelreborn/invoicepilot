import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { isDemoMode } from "@/lib/demo";
import { demoStore } from "@/lib/demo-store";
import { createServerSupabase } from "@/lib/supabase/server";
import AppNav from "@/components/app/app-nav";
import { Mark } from "@/components/marketing/wordmark";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  let businessName: string | null = null;
  let email: string | null = null;

  if (isDemoMode()) {
    const cookieStore = await cookies();
    const session = cookieStore.get("demo_session");
    if (!session) redirect("/login");
    businessName = demoStore.profile.business_name;
    email = demoStore.profile.email;
  } else {
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) redirect("/login");
    const { data: profile } = await supabase
      .from("profiles")
      .select("business_name, email")
      .eq("id", user.id)
      .single();
    businessName = profile?.business_name ?? null;
    email = profile?.email ?? user.email ?? null;
  }

  return (
    <div className="flex min-h-screen bg-paper text-ink">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-rule bg-paper-deep/30 md:flex">
        <div className="border-b border-rule px-5 py-5">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]"
          >
            <Mark className="h-[18px] w-[18px] text-ink" />
            InvoicePilot
          </Link>
          <p className="mt-1 truncate font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
            {businessName || email}
          </p>
        </div>
        <AppNav />
        <div className="border-t border-rule p-4">
          <form action="/auth/signout" method="post">
            <button className="text-[12px] text-muted transition-colors hover:text-ink">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="md:hidden">
          <div className="flex items-center justify-between border-b border-rule px-4 py-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em]"
            >
              <Mark className="h-[18px] w-[18px] text-ink" />
              InvoicePilot
            </Link>
            <form action="/auth/signout" method="post">
              <button className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted">
                Sign out
              </button>
            </form>
          </div>
          <AppNav variant="bar" />
        </div>

        {isDemoMode() && (
          <div className="border-b border-rule bg-paper-deep px-4 py-2 text-center font-mono text-[9px] uppercase tracking-[0.12em] text-muted">
            Demo mode · data resets on restart
            <span className="hidden sm:inline"> · connect Supabase for persistence</span>
          </div>
        )}

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
