import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AdminRecentActivityItem } from "@/lib/admin";
import type { AdminUserSource } from "@/components/admin/AdminUsersListTable";

/** Same provider inference logic as adminUserLists.inferUserSource, kept local to avoid coupling. */
function inferSourceFromUser(user: User | null | undefined): AdminUserSource {
  if (!user) return "other";
  const meta = (user.app_metadata ?? {}) as Record<string, unknown>;
  const metaProvidersRaw = meta.providers;
  const metaProviderRaw = meta.provider;
  const providers = new Set<string>();
  if (Array.isArray(metaProvidersRaw)) {
    for (const p of metaProvidersRaw) {
      if (typeof p === "string" && p.trim()) {
        providers.add(p.trim().toLowerCase());
      }
    }
  }
  if (typeof metaProviderRaw === "string" && metaProviderRaw.trim()) {
    providers.add(metaProviderRaw.trim().toLowerCase());
  }
  const identities = (user as unknown as { identities?: Array<{ provider?: string | null }> }).identities;
  if (Array.isArray(identities)) {
    for (const i of identities) {
      const p = i?.provider;
      if (typeof p === "string" && p.trim()) {
        providers.add(p.trim().toLowerCase());
      }
    }
  }
  if (providers.has("google")) return "google";
  if (providers.has("email")) return "email";
  if (providers.size === 0) return "seeded";
  return "other";
}

function isUserRow(r: AdminRecentActivityItem): boolean {
  return r.item_type === "user" || r.title === "New user";
}

function isBusinessRow(r: AdminRecentActivityItem): boolean {
  return (
    r.item_type === "business" ||
    r.item_type === "business_claim" ||
    r.title === "Business created" ||
    r.title === "Business claimed"
  );
}

function isReviewRow(r: AdminRecentActivityItem): boolean {
  return r.item_type === "review" || r.title === "Review submitted";
}

type ReviewLite = {
  id: string;
  user_id: string | null;
  consumer_id: string | null;
  guest_email: string | null;
};

type BusinessOwnerLookup = {
  id?: string | null;
  owner_id?: string | null;
};

type BusinessOwnersLookup = {
  business_id?: string | null;
  owner_user_id?: string | null;
};

type ReviewLookup = {
  id?: string | null;
  user_id?: string | null;
  consumer_id?: string | null;
  guest_email?: string | null;
};

/**
 * Adds `source` (google | email | seeded | first_review | other) to each row
 * in the admin recent-activity feed. Service-role admin client required.
 */
export async function attachActivitySource(
  admin: SupabaseClient,
  rows: AdminRecentActivityItem[]
): Promise<AdminRecentActivityItem[]> {
  if (rows.length === 0) return rows;

  const userIds = new Set<string>();
  const businessIds = new Set<string>();
  const reviewIds = new Set<string>();

  for (const r of rows) {
    const id =
      r.item_id != null && String(r.item_id).trim() !== ""
        ? String(r.item_id).trim()
        : "";
    if (!id) continue;
    if (isUserRow(r)) userIds.add(id);
    else if (isBusinessRow(r)) businessIds.add(id);
    else if (isReviewRow(r)) reviewIds.add(id);
  }

  const ownerIdByBusinessId = new Map<string, string>();
  if (businessIds.size > 0) {
    const { data: bizData } = await admin
      .from("businesses")
      .select("id, owner_id")
      .in("id", [...businessIds]);
    for (const b of (bizData ?? []) as BusinessOwnerLookup[]) {
      const id = b.id != null ? String(b.id).trim() : "";
      const oid = b.owner_id != null ? String(b.owner_id).trim() : "";
      if (id && oid) ownerIdByBusinessId.set(id, oid);
    }

    const stillMissing = [...businessIds].filter((id) => !ownerIdByBusinessId.has(id));
    if (stillMissing.length > 0) {
      const { data: boData } = await admin
        .from("business_owners")
        .select("business_id, owner_user_id")
        .in("business_id", stillMissing);
      for (const r of (boData ?? []) as BusinessOwnersLookup[]) {
        const bid = r.business_id != null ? String(r.business_id).trim() : "";
        const uid = r.owner_user_id != null ? String(r.owner_user_id).trim() : "";
        if (bid && uid) ownerIdByBusinessId.set(bid, uid);
      }
    }
  }

  const reviewById = new Map<string, ReviewLite>();
  if (reviewIds.size > 0) {
    const { data: revData } = await admin
      .from("reviews")
      .select("id, user_id, consumer_id, guest_email")
      .in("id", [...reviewIds]);
    for (const r of (revData ?? []) as ReviewLookup[]) {
      const id = r.id != null ? String(r.id).trim() : "";
      if (!id) continue;
      const uid = r.user_id != null ? String(r.user_id).trim() : null;
      const cid = r.consumer_id != null ? String(r.consumer_id).trim() : null;
      const ge = typeof r.guest_email === "string" ? r.guest_email.trim() : null;
      reviewById.set(id, {
        id,
        user_id: uid || null,
        consumer_id: cid || null,
        guest_email: ge && ge.length > 0 ? ge : null,
      });
    }
  }

  // Aggregate every auth user we need to look up (users + business owners + reviewer accounts)
  const allAuthIds = new Set<string>([...userIds]);
  for (const oid of ownerIdByBusinessId.values()) allAuthIds.add(oid);
  for (const rev of reviewById.values()) {
    if (rev.user_id) allAuthIds.add(rev.user_id);
    else if (rev.consumer_id) allAuthIds.add(rev.consumer_id);
  }

  const sourceByAuthId = new Map<string, AdminUserSource>();
  await Promise.all(
    [...allAuthIds].map(async (uid) => {
      try {
        const { data } = await admin.auth.admin.getUserById(uid);
        sourceByAuthId.set(uid, inferSourceFromUser(data?.user ?? null));
      } catch (e) {
        console.warn("[attachActivitySource] getUserById failed", uid, e);
        sourceByAuthId.set(uid, "other");
      }
    })
  );

  return rows.map((r) => {
    const id =
      r.item_id != null && String(r.item_id).trim() !== ""
        ? String(r.item_id).trim()
        : "";
    if (!id) return { ...r, source: "other" as const };

    if (isUserRow(r)) {
      return { ...r, source: sourceByAuthId.get(id) ?? "other" };
    }
    if (isBusinessRow(r)) {
      const oid = ownerIdByBusinessId.get(id);
      const src: AdminUserSource = oid
        ? sourceByAuthId.get(oid) ?? "other"
        : "seeded";
      return { ...r, source: src };
    }
    if (isReviewRow(r)) {
      const rev = reviewById.get(id);
      if (!rev) return { ...r, source: "other" as const };
      if (rev.user_id) {
        return { ...r, source: sourceByAuthId.get(rev.user_id) ?? "other" };
      }
      if (rev.consumer_id) {
        return { ...r, source: sourceByAuthId.get(rev.consumer_id) ?? "other" };
      }
      if (rev.guest_email) {
        return { ...r, source: "first_review" as const };
      }
      return { ...r, source: "other" as const };
    }
    return r;
  });
}
