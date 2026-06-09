import type { SupabaseClient } from "@supabase/supabase-js";

/** Owner, co-owner, or active member with can_write_articles. */
export async function canWriteArticles(
  db: SupabaseClient,
  userId: string,
  businessId: string
): Promise<boolean> {
  if (!userId || !businessId) return false;

  const { data: owned } = await db
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", userId)
    .maybeSingle();
  if (owned) return true;

  const { data: coOwner } = await db
    .from("business_owners")
    .select("business_id")
    .eq("business_id", businessId)
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (coOwner) return true;

  const { data: member } = await db
    .from("business_members")
    .select("role, can_write_articles")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle();

  if (!member) return false;
  if ((member as { role?: string }).role === "owner") return true;
  return (member as { can_write_articles?: boolean }).can_write_articles === true;
}

export async function requireArticleWriteAccess(
  db: SupabaseClient,
  userId: string,
  businessId: string
): Promise<{ ok: true } | { ok: false; message: string }> {
  const allowed = await canWriteArticles(db, userId, businessId);
  if (!allowed) {
    return {
      ok: false,
      message:
        "You do not have permission to write articles for this business.",
    };
  }
  return { ok: true };
}
