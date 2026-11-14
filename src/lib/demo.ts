export function isDemoMode() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  if (!url) return true;
  if (url.includes("placeholder") || url.includes("your-project") || url.includes("your-project.supabase.co")) return true;
  return false;
}

export const DEMO_USER = {
  id: "demo-user-1",
  email: "demo@invoicepilot.app",
  business_name: "Demo Studio",
};