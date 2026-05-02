import type { SupabaseClient } from "@supabase/supabase-js";
import type { PlanKey } from "@/lib/plans";

/** Active built-ins shown by default in dashboard/public profile. */
const BUILTIN_SECTIONS = [
  { slug: "gallery", title: "Gallery", sort_order: 10 },
  { slug: "products", title: "Products", sort_order: 20 },
  { slug: "services", title: "Other", sort_order: 30 },
] as const;

/** Legacy built-ins we no longer expose by default. */
const LEGACY_BUILTIN_SLUGS = ["team", "workspace", "fleet-logistics"] as const;

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

async function removeLegacyBuiltInSections(
  db: SupabaseClient,
  businessId: string
): Promise<void> {
  await insertGalleryIfMissing(db, businessId);

  const { data: rows, error: selErr } = await db
    .from("business_photo_sections")
    .select("id, slug, is_builtin")
    .eq("business_id", businessId)
    .in("slug", [...LEGACY_BUILTIN_SLUGS]);
  if (selErr) {
    console.error("[removeLegacyBuiltInSections] select", selErr);
    return;
  }

  const sectionIdsToDelete = (rows ?? [])
    .filter((r: { is_builtin?: boolean | null }) => r.is_builtin === true)
    .map((r: { id: string }) => r.id);
  if (sectionIdsToDelete.length === 0) return;

  const { error: moveErr } = await db
    .from("business_photos")
    .update({ section: "gallery" })
    .eq("business_id", businessId)
    .in("section", [...LEGACY_BUILTIN_SLUGS]);
  if (moveErr) {
    console.error("[removeLegacyBuiltInSections] move photos", moveErr);
    return;
  }

  const { error: delErr } = await db
    .from("business_photo_sections")
    .delete()
    .eq("business_id", businessId)
    .in("id", sectionIdsToDelete);
  if (delErr) console.error("[removeLegacyBuiltInSections] delete", delErr);
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
  await removeLegacyBuiltInSections(db, businessId);

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
  const missing = BUILTIN_SECTIONS.filter((b) => !have.has(b.slug)).map((b) => ({
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
