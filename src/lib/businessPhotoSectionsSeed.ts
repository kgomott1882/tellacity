import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanKey } from "@/lib/plans";

/** Default built-ins seeded for Free plans (full grid on the public profile). */
const FULL_BUILTIN_SECTIONS = [
  { slug: "gallery", title: "Gallery", sort_order: 10 },
  { slug: "team", title: "Team", sort_order: 20 },
  { slug: "workspace", title: "Workspace", sort_order: 30 },
  { slug: "products", title: "Products", sort_order: 40 },
  { slug: "services", title: "Services", sort_order: 50 },
  { slug: "fleet-logistics", title: "Fleet & Logistics", sort_order: 60 },
] as const;

async function insertGalleryIfMissing(db: SupabaseClient, businessId: string): Promise<void> {
  const { data: row, error: selErr } = await db
    .from("business_photo_sections")
    .select("slug")
    .eq("business_id", businessId)
    .eq("slug", "gallery")
    .maybeSingle();
  if (selErr) {
    console.error("[insertGalleryIfMissing] select", selErr);
    return;
  }
  if (row) return;
  const { error } = await db.from("business_photo_sections").insert({
    business_id: businessId,
    slug: "gallery",
    title: "Gallery",
    is_builtin: true,
    is_enabled: true,
    sort_order: 10,
  });
  if (error) console.error("[insertGalleryIfMissing] insert", error);
}

/**
 * Gallery must exist before moving photos into `section = 'gallery'`.
 */
export async function ensureGallerySectionExists(
  db: SupabaseClient,
  businessId: string
): Promise<void> {
  await insertGalleryIfMissing(db, businessId);
}

/**
 * Ensures `business_photo_sections` rows exist for dashboard + uploads.
 * - **Free**: inserts every missing built-in (owner cannot permanently remove them).
 * - **Paid**: only ensures `gallery` exists — the default bucket for photos and
 *   for reassignment when another section is deleted.
 */
export async function seedMissingBusinessPhotoSections(
  db: SupabaseClient,
  businessId: string,
  planKey: PlanKey
): Promise<void> {
  if (planKey !== "free") {
    await insertGalleryIfMissing(db, businessId);
    return;
  }

  const { data: existing, error: selErr } = await db
    .from("business_photo_sections")
    .select("slug")
    .eq("business_id", businessId);
  if (selErr) {
    console.error("[seedMissingBusinessPhotoSections] select", selErr);
    return;
  }

  const have = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
  const missing = FULL_BUILTIN_SECTIONS.filter((b) => !have.has(b.slug)).map((b) => ({
    business_id: businessId,
    slug: b.slug,
    title: b.title,
    is_builtin: true,
    is_enabled: true,
    sort_order: b.sort_order,
  }));
  if (missing.length === 0) return;
  const { error } = await db.from("business_photo_sections").insert(missing);
  if (error) console.error("[seedMissingBusinessPhotoSections] insert", error);
}
