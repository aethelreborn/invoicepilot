import { ReactNode } from "react";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/admin-guard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const adminCheck = await requireAdmin();
  const response = adminCheck.response;
  if (response) redirect("/login");
  return <>{children}</>;
}
