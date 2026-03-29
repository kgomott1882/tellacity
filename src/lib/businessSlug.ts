import type { SupabaseClient } from "@supabase/supabase-js";

const PLACEHOLDER_TOKENS = new Set([
  "unknown",
  "[unknown]",
  "null",
  "n/a",
  "na",
  "tbd",
]);

/**
 * Multi-word suffixes removed from the end of the business name before slugifying
 * (longest phrase first). Keeps slugs name-only without trailing country/region text.
 */
const GEO_PHRASES_DESC: string[] = [
  "united states of america",
  "united kingdom",
  "united states",
  "new zealand",
  "south africa",
  "south korea",
  "north korea",
  "hong kong",
  "great britain",
  "northern ireland",
  "costa rica",
  "puerto rico",
  "czech republic",
  "dominican republic",
  "saudi arabia",
  "sri lanka",
  "el salvador",
  "bosnia and herzegovina",
  "trinidad and tobago",
  "papua new guinea",
].sort((a, b) => b.split(" ").length - a.split(" ").length);

function normalizeToken(token: string): string {
  return token.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function stripTrailingGeoPhrases(tokens: string[]): string[] {
  if (tokens.length === 0) return tokens;
  let t = [...tokens];
  let changed = true;
  while (changed && t.length > 0) {
    changed = false;
    const lw = t.map(normalizeToken);
    for (const phrase of GEO_PHRASES_DESC) {
      const pl = phrase.split(/\s+/).map((p) => p.replace(/[^a-z0-9]/g, ""));
      if (pl.length > t.length || pl.some((p) => !p)) continue;
      const tail = lw.slice(-pl.length);
      if (tail.every((w, i) => w.length > 0 && w === pl[i])) {
        t = t.slice(0, -pl.length);
        changed = true;
        break;
      }
    }
  }
  return t;
}

/**
 * SEO slug from business name only: lowercase, hyphens, a-z0-9, collapsed hyphens, trimmed.
 * Does not append city, country, or opaque IDs.
 */
export function businessNameToSlug(name: string): string {
  const raw = typeof name === "string" ? name.trim() : "";
  if (!raw) return "";

  let tokens = raw.split(/\s+/).filter(Boolean);
  tokens = tokens.filter((tok) => {
    const key = tok.toLowerCase().replace(/[\[\]]/g, "");
    return !PLACEHOLDER_TOKENS.has(key);
  });
  tokens = stripTrailingGeoPhrases(tokens);

  const parts = tokens
    .map((tok) => normalizeToken(tok))
    .filter((w) => w.length > 0);

  const slug = parts.join("-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return slug;
}

/**
 * Cleans a URL path slug for fallback lookup: removes placeholder segments (e.g. `unknown`)
 * and trailing geo segments (same multi-word tails as name slugification, hyphen-delimited).
 */
export function cleanSlugForRedirect(rawSlug: string): string {
  const s = typeof rawSlug === "string" ? rawSlug.trim().toLowerCase() : "";
  if (!s) return "";

  let parts = s.split("-").filter((p) => p.length > 0);
  parts = parts.filter((p) => {
    const key = p.replace(/[\[\]]/g, "");
    return !PLACEHOLDER_TOKENS.has(key);
  });
  parts = stripTrailingGeoPhrases(parts);

  return parts
    .map((p) => normalizeToken(p))
    .filter((w) => w.length > 0)
    .join("-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Reserves a unique `businesses.slug`: base from {@link businessNameToSlug}, then
 * `base-1`, `base-2`, … if needed. No random / user-id suffixes.
 * When updating an existing row, pass `excludeBusinessId` so its current slug does not count as a conflict.
 */
export async function allocateUniqueBusinessSlug(
  supabase: SupabaseClient,
  businessName: string,
  excludeBusinessId?: string
): Promise<string> {
  let base = businessNameToSlug(businessName);
  if (!base) base = "business";

  let candidate = base;
  let counter = 0;
  for (;;) {
    const { data } = await supabase
      .from("businesses")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();

    if (!data || (excludeBusinessId && data.id === excludeBusinessId)) {
      return candidate;
    }

    counter += 1;
    candidate = `${base}-${counter}`;
    if (counter > 10_000) {
      throw new Error("Could not allocate a unique business slug");
    }
  }
}
