/**
 * Recursively pull human-readable tag strings from jsonb / Google-style shapes
 * (arrays of strings, arrays of { displayName }, JSON strings, comma lists).
 */
function extractStringsDeep(value: unknown, depth: number): string[] {
  if (depth > 10 || value == null) return [];

  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    if (
      (t.startsWith("[") && t.endsWith("]")) ||
      (t.startsWith("{") && t.endsWith("}"))
    ) {
      try {
        return extractStringsDeep(JSON.parse(t) as unknown, depth + 1);
      } catch {
        /* not JSON */
      }
    }
    if (t.includes(",") && !t.includes('"')) {
      return t
        .split(",")
        .flatMap((s) => extractStringsDeep(s.trim(), depth + 1));
    }
    return [t];
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return [];
  }

  if (Array.isArray(value)) {
    return value.flatMap((item) => extractStringsDeep(item, depth + 1));
  }

  if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    const preferredKeys = [
      "displayName",
      "longText",
      "text",
      "name",
      "title",
      "label",
      "localizedDisplayName",
      "shortText",
    ];
    for (const k of preferredKeys) {
      const s = o[k];
      if (typeof s === "string" && s.trim()) {
        return [s.trim()];
      }
    }
    if (Array.isArray(o.types)) {
      return extractStringsDeep(o.types, depth + 1);
    }
    return Object.values(o).flatMap((v) => extractStringsDeep(v, depth + 1));
  }

  return [];
}

/**
 * Primary category chip — soft brand tint, never black.
 */
export const BUSINESS_CATEGORY_PILL_CLASSNAME =
  "inline-flex max-w-full items-center truncate rounded-full border border-[#1FAF9E]/25 bg-[#E8F7F5] px-2 py-0.5 text-[10px] font-medium leading-tight text-[#0E4A42]";

export function businessCategoryPillClassName(): string {
  return BUSINESS_CATEGORY_PILL_CLASSNAME;
}

/**
 * Keyword tags: small pills, light backgrounds, readable muted text (no black fills).
 */
export const BUSINESS_TAG_PILL_CLASSNAMES = [
  "inline-flex max-w-full items-center truncate rounded-full border border-slate-200/90 bg-slate-100 px-2 py-0.5 text-[10px] font-medium leading-tight text-slate-700",
  "inline-flex max-w-full items-center truncate rounded-full border border-neutral-200/90 bg-neutral-100 px-2 py-0.5 text-[10px] font-medium leading-tight text-neutral-700",
  "inline-flex max-w-full items-center truncate rounded-full border border-zinc-200/90 bg-zinc-100 px-2 py-0.5 text-[10px] font-medium leading-tight text-zinc-700",
  "inline-flex max-w-full items-center truncate rounded-full border border-stone-200/90 bg-stone-100 px-2 py-0.5 text-[10px] font-medium leading-tight text-stone-700",
  "inline-flex max-w-full items-center truncate rounded-full border border-gray-200/90 bg-gray-100 px-2 py-0.5 text-[10px] font-medium leading-tight text-gray-700",
] as const;

export function businessTagPillClassName(index: number): string {
  return BUSINESS_TAG_PILL_CLASSNAMES[
    index % BUSINESS_TAG_PILL_CLASSNAMES.length
  ]!;
}

/** Category / tag directory: compact tab-style navigation pills. */
export const CATEGORY_DIRECTORY_TAB_LINK_CLASS =
  "inline-flex max-w-full items-center truncate rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[10px] font-medium leading-tight text-gray-700 transition-colors hover:border-[#1FAF9E] hover:bg-[#F8FFFE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40";

export const CATEGORY_DIRECTORY_TAB_ACTIVE_CLASS =
  "inline-flex max-w-full items-center truncate rounded-full border border-[#1FAF9E] bg-[#E8F7F5] px-2 py-0.5 text-[10px] font-semibold leading-tight text-[#0E4A42]";

export function formatBusinessTagLabel(tagSlug: string): string {
  return tagSlug
    .trim()
    .replace(/[-_]+/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Slug-style secondary categories when `tags` is empty (deduped, lowercased). */
export function tagsFromSecondarySlugs(
  secondary: unknown,
  primarySlug: string | null | undefined,
): string[] {
  if (!Array.isArray(secondary)) return [];
  const p = (primarySlug ?? "").trim().toLowerCase();
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of secondary) {
    const t = typeof item === "string" ? item.trim().toLowerCase() : "";
    if (!t || t === p || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
  }
  return out;
}

/** Prefer explicit tags; if none, use secondary category slugs as keyword chips. */
export function mergeTagsForDisplay(
  tags: unknown,
  secondary: unknown,
  primarySlug: string | null | undefined,
): string[] {
  const fromTags = normalizeBusinessTags(tags);
  if (fromTags.length > 0) return fromTags;
  return tagsFromSecondarySlugs(secondary, primarySlug);
}

export function normalizeBusinessTags(tags: unknown): string[] {
  if (tags == null) return [];

  const raw = extractStringsDeep(tags, 0);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const t of raw) {
    const k = t.trim().toLowerCase();
    if (!k || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
  }
  return out;
}
