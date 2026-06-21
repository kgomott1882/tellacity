import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Whether the user owns this business (not a team member).
 * Owner = `businesses.owner_id === userId` OR `business_owners.owner_user_id === userId`.
 */
export async function isBusinessOwner(
  supabase: SupabaseClient,
  userId: string,
  businessId: string,
): Promise<boolean> {
  const trimmedUser = userId?.trim();
  const trimmedBiz = businessId?.trim();
  if (!trimmedUser || !trimmedBiz) return false;

  const { data: owned } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", trimmedBiz)
    .eq("owner_id", trimmedUser)
    .maybeSingle();

  if (owned) return true;

  const { data: link, error } = await supabase
    .from("business_owners")
    .select("business_id")
    .eq("business_id", trimmedBiz)
    .eq("owner_user_id", trimmedUser)
    .maybeSingle();

  if (error && error.code !== "PGRST205") return false;
  return !!link;
}

/**
 * Business IDs from `businessIds` where `userId` is an owner.
 * Uses one `businesses` lookup plus one `business_owners` query (no N+1).
 */
export async function getBusinessIdsOwnedByUser(
  supabase: SupabaseClient,
  userId: string,
  businessIds: string[],
): Promise<Set<string>> {
  const trimmedUser = userId?.trim();
  const ids = [
    ...new Set(businessIds.map((id) => id?.trim()).filter((id): id is string => Boolean(id))),
  ];
  const owned = new Set<string>();
  if (!trimmedUser || ids.length === 0) return owned;

  const { data: businessRows, error: businessErr } = await supabase
    .from("businesses")
    .select("id, owner_id")
    .in("id", ids);

  if (businessErr) throw businessErr;

  for (const row of businessRows ?? []) {
    const id = row.id != null ? String(row.id).trim() : "";
    const ownerId = row.owner_id != null ? String(row.owner_id).trim() : "";
    if (id && ownerId === trimmedUser) {
      owned.add(id);
    }
  }

  const remaining = ids.filter((id) => !owned.has(id));
  if (remaining.length === 0) return owned;

  const { data: ownerLinks, error: linkErr } = await supabase
    .from("business_owners")
    .select("business_id")
    .in("business_id", remaining)
    .eq("owner_user_id", trimmedUser);

  if (linkErr) throw linkErr;

  for (const row of ownerLinks ?? []) {
    const id = row.business_id != null ? String(row.business_id).trim() : "";
    if (id) owned.add(id);
  }

  return owned;
}
