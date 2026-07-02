import { getCountryName, cleanLocationField } from "@/lib/address";
import { normalizeCountryCode } from "@/lib/country";
import { formatBusinessTagLabel } from "@/lib/businessTags";

/** Countries where we submit tag hub URLs in the sitemap. */
export const TAG_SITEMAP_COUNTRIES = ["US", "GB", "CA", "AU"] as const;

/** Matches `TAG_INDEX_THRESHOLD` on `/tags/[tag_slug]`. */
export const TAG_HUB_INDEX_THRESHOLD = 3;

export function toPublicTagSlug(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export function buildTagBrowseHref(tagSlug: string, countryCode: string | null | undefined): string {
  const slug = toPublicTagSlug(tagSlug);
  if (!slug) return "/tags";
  const country = normalizeCountryCode(countryCode ?? "US");
  if (country === "US") {
    return `/tags/${encodeURIComponent(slug)}`;
  }
  return `/tags/${encodeURIComponent(slug)}?country=${encodeURIComponent(country)}`;
}

export function buildTagSitemapUrl(tagSlug: string, countryCode: string): string {
  const slug = toPublicTagSlug(tagSlug);
  const base = `https://tellacity.com/tags/${encodeURIComponent(slug)}`;
  const country = normalizeCountryCode(countryCode);
  if (country === "US") return base;
  return `${base}?country=${encodeURIComponent(country)}`;
}

export function buildCategoryBrowseHref(
  categorySlug: string,
  countryCode: string | null | undefined,
): string {
  const slug = categorySlug.trim().toLowerCase();
  if (!slug) return "/categories";
  const country = normalizeCountryCode(countryCode ?? "US");
  return `/categories/${encodeURIComponent(slug)}?country=${encodeURIComponent(country)}`;
}

export type BusinessProfileIntroInput = {
  name: string;
  city?: string | null;
  countryCode?: string | null;
  categoryLabel?: string | null;
  tagSlugs?: string[];
  reviewCount?: number;
};

/** Visible intro copy for `/b/[slug]`, unique per business from real directory fields. */
export function buildBusinessProfileIntro(input: BusinessProfileIntroInput): string {
  const name = String(input.name ?? "").trim();
  if (!name) return "";

  const city = cleanLocationField(input.city);
  const countryName = getCountryName(input.countryCode);
  const location =
    city && countryName ? `${city}, ${countryName}` : city || countryName || "";

  const category = String(input.categoryLabel ?? "").trim();
  const tagLabels = (input.tagSlugs ?? [])
    .map((t) => formatBusinessTagLabel(toPublicTagSlug(t)))
    .filter(Boolean)
    .slice(0, 3);
  const tagsPhrase =
    tagLabels.length > 0
      ? tagLabels.length === 1
        ? tagLabels[0]
        : `${tagLabels.slice(0, -1).join(", ")} and ${tagLabels[tagLabels.length - 1]}`
      : "";

  const reviewCount = Math.max(0, Number(input.reviewCount) || 0);

  if (reviewCount > 0) {
    const base = `Read verified customer reviews for ${name}`;
    const where = location ? ` in ${location}` : "";
    const categoryBit = category ? `, a ${category} business` : "";
    const tagsBit = tagsPhrase ? `. Customers often mention ${tagsPhrase}` : "";
    return `${base}${where}${categoryBit}${tagsBit}. Compare ratings, photos, and TrustScore on Tellacity.`;
  }

  const base = `Discover ${name}`;
  const where = location ? ` in ${location}` : "";
  const categoryBit = category ? `, listed under ${category}` : "";
  const tagsBit = tagsPhrase ? ` with topics including ${tagsPhrase}` : "";
  return `${base}${where}${categoryBit}${tagsBit}. Explore reviews and compare trusted businesses on Tellacity.`;
}

export function profileDisplayTags(
  tags: string[],
  primaryCategorySlug: string | null | undefined,
  max = 8,
): string[] {
  const primary = String(primaryCategorySlug ?? "")
    .trim()
    .toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const slug = toPublicTagSlug(raw);
    if (!slug || slug === primary || seen.has(slug)) continue;
    seen.add(slug);
    out.push(slug);
    if (out.length >= max) break;
  }
  return out;
}
