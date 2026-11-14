import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/app-url";

export default function robots(): MetadataRoute.Robots {
  const base = siteUrl();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/dashboard", "/invoices", "/clients", "/settings", "/pay/", "/api/"] },
    ...(base ? { sitemap: `${base}/sitemap.xml` } : {}),
  };
}
