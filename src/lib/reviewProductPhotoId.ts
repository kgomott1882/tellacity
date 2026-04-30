import type { SupabaseClient } from "@supabase/supabase-js";

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

/**
 * Ensures product_photo_id belongs to the business and is publicly reviewable
 * (published + live). Returns null when omitted/invalid.
 */
export async function validatedProductPhotoIdForReview(
  supabase: SupabaseClient,
  businessId: string,
  raw: unknown
): Promise<string | null> {
  if (typeof raw !== "string") return null;
  const id = raw.trim();
  if (!id || !isUuid(id)) return null;

  const { data, error } = await supabase
    .from("business_photos")
    .select("id,business_id,status,is_live")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  if (String(data.business_id) !== businessId) return null;
  const status = String(data.status ?? "").toLowerCase();
  if (status !== "published") return null;
  if (data.is_live === false) return null;
  return id;
}
