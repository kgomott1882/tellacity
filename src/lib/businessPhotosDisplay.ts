export type BusinessPhotoPublic = {
  id: string;
  url: string;
  section: string;
  /** Lower values first within a section when using {@link applyBusinessPhotosOrdering}. */
  sort_order?: number | null;
  created_at?: string | null;
  is_cover?: boolean | null;
};

/** Prefer `is_cover === true`; otherwise first photo in list order. */
export function pickProfileBannerPhoto(photos: BusinessPhotoPublic[]): BusinessPhotoPublic | null {
  if (!photos.length) return null;
  const cover = photos.find((p) => p.is_cover === true);
  return cover ?? photos[0] ?? null;
}

/** Remove the banner photo so it is not duplicated in section grids. */
export function photosExcludingBanner(
  photos: BusinessPhotoPublic[],
  banner: BusinessPhotoPublic | null
): BusinessPhotoPublic[] {
  if (!banner) return photos;
  return photos.filter((p) => p.id !== banner.id);
}

export const BUSINESS_PHOTO_SECTION_ORDER = [
  "team",
  "workspace",
  "products",
  "services",
  "fleet-logistics",
  "gallery",
] as const;

export type BusinessPhotoSectionKey = (typeof BUSINESS_PHOTO_SECTION_ORDER)[number];

const BUILTIN_SECTION_LABEL: Record<BusinessPhotoSectionKey, string> = {
  team: "Team",
  workspace: "Workspace",
  products: "Products",
  services: "Services",
  "fleet-logistics": "Fleet & Logistics",
  gallery: "Gallery",
};

const BUILTIN_SECTION_SET = new Set<string>(BUSINESS_PHOTO_SECTION_ORDER);

export function normalizeBusinessPhotoSection(raw: string | null | undefined): BusinessPhotoSectionKey {
  const s = String(raw ?? "").trim().toLowerCase();
  if (BUILTIN_SECTION_SET.has(s)) return s as BusinessPhotoSectionKey;
  return "gallery";
}

/** One section entry used to render the public business profile. */
export type BusinessPhotoSectionConfig = {
  slug: string;
  title: string;
  is_enabled?: boolean | null;
  sort_order?: number | null;
};

/**
 * Buckets by UI section order. Preserves each photo’s index order from `photos` within its bucket
 * (pass arrays ordered with `applyBusinessPhotosOrdering` from `@/lib/businessPhotosQuery`).
 */
export function groupBusinessPhotosBySection(
  photos: BusinessPhotoPublic[]
): { key: BusinessPhotoSectionKey; title: string; photos: BusinessPhotoPublic[] }[] {
  const buckets = new Map<BusinessPhotoSectionKey, BusinessPhotoPublic[]>();
  for (const k of BUSINESS_PHOTO_SECTION_ORDER) {
    buckets.set(k, []);
  }
  for (const p of photos) {
    const key = normalizeBusinessPhotoSection(p.section);
    buckets.get(key)!.push(p);
  }
  return BUSINESS_PHOTO_SECTION_ORDER.filter((k) => (buckets.get(k)?.length ?? 0) > 0).map((key) => ({
    key,
    title: BUILTIN_SECTION_LABEL[key],
    photos: buckets.get(key) ?? [],
  }));
}

/**
 * Same bucketing as {@link groupBusinessPhotosBySection}, but always returns all five sections.
 * Within each section, photo order matches iteration order over `photos` (use query ordering from
 * `applyBusinessPhotosOrdering`).
 */
export function getBusinessPhotoSectionsOrdered(
  photos: BusinessPhotoPublic[]
): { key: BusinessPhotoSectionKey; title: string; photos: BusinessPhotoPublic[] }[] {
  const buckets = new Map<BusinessPhotoSectionKey, BusinessPhotoPublic[]>();
  for (const k of BUSINESS_PHOTO_SECTION_ORDER) {
    buckets.set(k, []);
  }
  for (const p of photos) {
    const key = normalizeBusinessPhotoSection(p.section);
    buckets.get(key)!.push(p);
  }
  return BUSINESS_PHOTO_SECTION_ORDER.map((key) => ({
    key,
    title: BUILTIN_SECTION_LABEL[key],
    photos: buckets.get(key) ?? [],
  }));
}

export type GroupBusinessPhotosOptions = {
  /**
   * When true, sections with no photos are still returned (so the public page
   * can render placeholder copy that nudges the owner to upgrade / add more
   * photos). Defaults to false for backwards compatibility.
   */
  keepEmpty?: boolean;
};

/**
 * Bucket photos using a per-business section config (supports custom titles + enable toggles).
 * - Sections with `is_enabled === false` are omitted.
 * - Photos whose `section` doesn't match any configured section fall back to `gallery`.
 * - By default, empty sections are filtered out. Pass `{ keepEmpty: true }` to keep them
 *   (used by the public profile to surface empty categories as "no photos yet" teasers).
 */
export function groupBusinessPhotosWithConfig(
  photos: BusinessPhotoPublic[],
  sections: BusinessPhotoSectionConfig[],
  options: GroupBusinessPhotosOptions = {}
): { key: string; title: string; photos: BusinessPhotoPublic[] }[] {
  const enabled = sections.filter((s) => s.is_enabled !== false);
  const bySlug = new Map<string, BusinessPhotoSectionConfig>();
  for (const s of enabled) bySlug.set(s.slug, s);

  const buckets = new Map<string, BusinessPhotoPublic[]>();
  for (const s of enabled) buckets.set(s.slug, []);

  for (const p of photos) {
    const raw = String(p.section ?? "").toLowerCase().trim();
    if (buckets.has(raw)) {
      buckets.get(raw)!.push(p);
    } else if (buckets.has("gallery")) {
      buckets.get("gallery")!.push(p);
    }
    // else: no gallery either — drop the photo (shouldn't happen with built-ins seeded).
  }

  const sortedSlugs = [...enabled]
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((s) => s.slug);

  const grouped = sortedSlugs.map((slug) => {
    const cfg = bySlug.get(slug)!;
    const items = buckets.get(slug) ?? [];
    return { key: slug, title: cfg.title, photos: items };
  });

  return options.keepEmpty ? grouped : grouped.filter((s) => s.photos.length > 0);
}
