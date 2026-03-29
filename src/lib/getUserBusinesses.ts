import { createClient } from "@/lib/supabase/client";

export type UserBusinessRow = {
  id: string;
  name: string;
  slug: string | null;
  website: string | null;
  plan?: string | null;
};

function formatSupabaseError(err: unknown): string | null {
  if (err == null) return null;
  if (typeof err !== "object") return String(err);
  const e = err as Record<string, unknown>;
  const code = typeof e.code === "string" ? e.code : "";
  const message = typeof e.message === "string" ? e.message : "";
  if (!code && !message) return null;
  return [code, message].filter(Boolean).join(" ");
}

function collectFromOwnerLinks(
  rows: { businesses: UserBusinessRow | UserBusinessRow[] | null }[]
): UserBusinessRow[] {
  const out: UserBusinessRow[] = [];
  for (const row of rows) {
    const b = row.businesses;
    if (!b) continue;
    if (Array.isArray(b)) {
      for (const x of b) {
        if (x?.id) out.push(x);
      }
    } else if (b.id) {
      out.push(b);
    }
  }
  return out;
}

/**
 * Businesses the user owns: `business_owners` join **and** `businesses.owner_id` (OTP / legacy can set
 * owner without a `business_owners` row). Results are merged by `id`.
 */
export async function getUserBusinesses(userId: string): Promise<UserBusinessRow[]> {
  const supabase = createClient();

  const [ownersRes, directRes] = await Promise.all([
    supabase
      .from("business_owners")
      .select(
        `
      business_id,
      businesses (
        id,
        name,
        slug,
        website,
        plan
      )
    `
      )
      .eq("owner_user_id", userId),
    supabase
      .from("businesses")
      .select("id, name, slug, website, plan")
      .eq("owner_id", userId),
  ]);

  if (ownersRes.error) {
    const s = formatSupabaseError(ownersRes.error);
    if (s) console.warn("[getUserBusinesses] business_owners:", s);
  }
  if (directRes.error) {
    const s = formatSupabaseError(directRes.error);
    if (s) console.warn("[getUserBusinesses] businesses.owner_id:", s);
  }

  const fromLinks = collectFromOwnerLinks(
    (ownersRes.data ?? []) as { businesses: UserBusinessRow | UserBusinessRow[] | null }[]
  );

  const byId = new Map<string, UserBusinessRow>();
  for (const b of fromLinks) {
    byId.set(b.id, b);
  }

  const directRows = (directRes.data ?? []) as UserBusinessRow[];
  for (const b of directRows) {
    if (!b?.id) continue;
    if (!byId.has(b.id)) {
      byId.set(b.id, b);
    }
  }

  return Array.from(byId.values());
}
