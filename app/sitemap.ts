export const dynamic = "force-static";

import { MetadataRoute } from "next";
import { createClient } from "@/utils/supabase/server";
import { SUPPORTED_COUNTRY_CODES, countryPathSegment } from "@/lib/seoCountries";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://tellacity.com";
const EXCLUDED_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/business/verify/",
  "/dashboard",
  "/business/dashboard",
  "/auth",
  "/api",
  "/business-sitemaps/",
] as const;

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;

  const clean = slug.trim().toLowerCase();

  return /^[a-z0-9-]+$/.test(clean);
}

function isBlockedPath(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname.includes("&") || pathname.includes("/S")) return true;
  if (EXCLUDED_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.some((seg) => /^[A-Z]+$/.test(seg))) return true;
  if (segments.some((seg) => !/^[a-z0-9-]+$/.test(seg))) return true;

  return false;
}

function toSitemapEntry(path: string, now: Date, changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"], priority: number) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (isBlockedPath(normalizedPath)) return null;

  return {
    url: `${BASE_URL}${normalizedPath}`,
    lastModified: now,
    changeFrequency,
    priority,
  } satisfies MetadataRoute.Sitemap[number];
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages: Array<MetadataRoute.Sitemap[number] | null> = [
    toSitemapEntry("/", now, "daily", 1),
    toSitemapEntry("/categories", now, "daily", 0.8),
    toSitemapEntry("/best", now, "daily", 0.9),
    toSitemapEntry("/top-rated", now, "daily", 0.9),
    toSitemapEntry("/for-business", now, "weekly", 0.8),
    toSitemapEntry("/blog", now, "weekly", 0.6),
    toSitemapEntry("/about", now, "monthly", 0.5),
    toSitemapEntry("/contact", now, "monthly", 0.5),
    toSitemapEntry("/privacy-policy", now, "yearly", 0.3),
    toSitemapEntry("/terms-of-service", now, "yearly", 0.3),
    toSitemapEntry("/companies", now, "daily", 0.8),
  ];

  for (const code of SUPPORTED_COUNTRY_CODES) {
    const segment = countryPathSegment(code)?.trim().toLowerCase();
    if (!segment || !isValidSlug(segment)) continue;
    pages.push(toSitemapEntry(`/companies/${segment}`, now, "daily", 0.7));
  }

  const supabase = createClient();

  const { data: groups } = await supabase
    .from("category_groups")
    .select("group_slug, slug")
    .order("name", { ascending: true });

  const groupSlugs = (Array.isArray(groups) ? groups : []) as { group_slug?: string | null; slug?: string | null }[];
  for (const g of groupSlugs) {
    const slug = (g.group_slug ?? g.slug ?? "").trim().toLowerCase();
    if (!isValidSlug(slug)) continue;
    pages.push(toSitemapEntry(`/best/${slug}`, now, "weekly", 0.8));
  }

  const { data: categories } = await supabase
    .from("categories")
    .select("slug")
    .order("name", { ascending: true });

  const categorySlugs = (Array.isArray(categories) ? categories : []) as { slug: string | null }[];
  for (const c of categorySlugs) {
    const slug = (c.slug ?? "").trim().toLowerCase();
    if (!isValidSlug(slug)) continue;
    pages.push(toSitemapEntry(`/best/${slug}`, now, "weekly", 0.8));
  }

  return pages.filter((entry): entry is MetadataRoute.Sitemap[number] => Boolean(entry));
}
