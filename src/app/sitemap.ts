import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/app-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  if (!base) return [];
  return [
    { url: `${base}/`, lastModified: new Date() },
    { url: `${base}/features`, lastModified: new Date() },
    { url: `${base}/pricing`, lastModified: new Date() },
    { url: `${base}/login`, lastModified: new Date() },
    { url: `${base}/signup`, lastModified: new Date() },
  ];
}
