import { createAdminSupabase } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo";
import AdminNav from "@/components/admin/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  if (isDemoMode()) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10 md:px-10 md:py-12">
        <AdminNav />
        <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Operations</p>
        <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
          Freelancers
        </h1>
        <p className="mt-6 text-[12px] text-muted">Demo workspace.</p>
      </div>
    );
  }

  const admin = createAdminSupabase();
  const { data: users, error } = await admin
    .from("profiles")
    .select("id, email, business_name, role, plan, plan_renews_at, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1080px] px-6 py-10">
        <AdminNav />
        <p className="text-[12px] text-stamp">Could not load freelancers.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1080px] px-6 py-10 md:px-10 md:py-12">
      <AdminNav />
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Operations</p>
      <h1 className="mt-2 font-display text-[clamp(2rem,3.4vw,2.6rem)] leading-none tracking-[-0.02em]">
        Freelancers
      </h1>

      <section className="mt-8 border border-rule bg-card">
        <h2 className="border-b border-rule px-5 py-3 font-mono text-[9px] uppercase tracking-[0.18em] text-muted">Users</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-rule text-[10px] uppercase tracking-[0.12em] text-muted">
                <th className="px-5 py-3 font-normal">Email</th>
                <th className="px-5 py-3 font-normal">Business</th>
                <th className="px-5 py-3 font-normal">Role</th>
                <th className="px-5 py-3 font-normal">Plan</th>
                <th className="px-5 py-3 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {(users || []).map((u) => (
                <tr key={u.id} className="border-b border-rule last:border-b-0">
                  <td className="px-5 py-3 text-[12px] text-ink">{u.email}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{u.business_name}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{u.role}</td>
                  <td className="px-5 py-3 text-[12px] text-ink">{u.plan}</td>
                  <td className="px-5 py-3 text-[12px] text-ink-soft">{new Date(u.created_at).toLocaleDateString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
