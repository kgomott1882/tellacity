import type { MetadataRoute } from "next";
import type { SupabaseClient } from "@supabase/supabase-js";
import { mergeTagsForDisplay } from "@/lib/businessTags";
import {
  buildTagSitemapUrl,
  TAG_HUB_INDEX_THRESHOLD,
  TAG_SITEMAP_COUNTRIES,
  toPublicTagSlug,
} from "@/lib/businessProfileSeo";
import { normalizeCountryCode } from "@/lib/country";

const PAGE_SIZE = 1000;

/**
 * Tag hub URLs for sitemap: only tags with enough listings in US/GB/CA/AU.
 * Aligns with `/tags/[tag_slug]` indexability (>= 3 businesses per country).
 */
export async function buildTagHubSitemapEntries(
  supabase: SupabaseClient,
): Promise<MetadataRoute.Sitemap> {
  const allowedCountries = new Set<string>(TAG_SITEMAP_COUNTRIES);
  const counts = new Map<string, number>();

  let offset = 0;
  while (true) {
    const { data, error } = await supabase
      .from("businesses")
      .select("country_code, tags, secondary_category_slugs, category_slug")
      .eq("status", "active")
      .range(offset, offset + PAGE_SIZE - 1);

    if (error || !data?.length) break;

    for (const row of data as Array<{
      country_code?: string | null;
      tags?: unknown;
      secondary_category_slugs?: unknown;
      category_slug?: string | null;
    }>) {
      const country = normalizeCountryCode(row.country_code);
      if (!allowedCountries.has(country)) continue;

      const tags = mergeTagsForDisplay(
        row.tags,
        row.secondary_category_slugs,
        row.category_slug,
      );
      const seen = new Set<string>();
      for (const tag of tags) {
        const slug = toPublicTagSlug(tag);
        if (!slug || seen.has(slug)) continue;
        seen.add(slug);
        const key = `${country}|${slug}`;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }

    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  const entries: MetadataRoute.Sitemap = [];
  for (const [key, count] of counts) {
    if (count < TAG_HUB_INDEX_THRESHOLD) continue;
    const pipe = key.indexOf("|");
    if (pipe <= 0) continue;
    const country = key.slice(0, pipe);
    const slug = key.slice(pipe + 1);
    entries.push({
      url: buildTagSitemapUrl(slug, country),
      lastModified: new Date(),
    });
  }

  return entries.sort((a, b) => a.url.localeCompare(b.url));
}
