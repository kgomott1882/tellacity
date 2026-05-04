/**
 * Business-level reviews are not tied to a product photo (`business_photos.id`).
 * Item reviews always set `product_photo_id`.
 */
export function isGeneralBusinessReviewRow(row: {
  product_photo_id?: string | null;
}): boolean {
  const p = row.product_photo_id;
  if (p == null) return true;
  if (typeof p === "string" && p.trim() === "") return true;
  return false;
}
