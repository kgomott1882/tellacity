import { revalidatePath } from "next/cache";

/**
 * Bust ISR cache for a public business profile after claim / edit / new review.
 */
export function revalidateBusinessProfileBySlug(
  slug: string | null | undefined,
): void {
  const s = String(slug ?? "").trim().toLowerCase();
  if (!s) return;
  try {
    revalidatePath(`/b/${s}`);
  } catch (e) {
    console.warn("[revalidateBusinessProfileBySlug]", s, e);
  }
}

export async function revalidateBusinessProfileById(
  admin: {
    from: (table: string) => any;
  },
  businessId: string | null | undefined,
): Promise<void> {
  const id = String(businessId ?? "").trim();
  if (!id) return;
  try {
    const { data } = await admin
      .from("businesses")
      .select("slug")
      .eq("id", id)
      .maybeSingle();
    revalidateBusinessProfileBySlug(
      data && typeof data === "object"
        ? (data as { slug?: string | null }).slug
        : null,
    );
  } catch (e) {
    console.warn("[revalidateBusinessProfileById]", id, e);
  }
}
