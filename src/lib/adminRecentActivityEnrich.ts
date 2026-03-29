import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminRecentActivityItem } from "@/lib/admin";

function isBlankEmail(e: string | null | undefined): boolean {
  return e == null || String(e).trim() === "";
}

function isBlankBusinessName(s: string | null | undefined): boolean {
  const t = s == null ? "" : String(s).trim();
  return t === "" || t === "—";
}

function isBusinessRow(r: AdminRecentActivityItem): boolean {
  return r.item_type === "business" || r.title === "Business created";
}

function isUserRow(r: AdminRecentActivityItem): boolean {
  return r.item_type === "user" || r.title === "New user";
}

/**
 * Fills gaps when `admin_get_recent_activity` returns null email / empty business name
 * (stale RPC, RLS, or rows created before DB backfills). Uses service-role reads + Auth Admin API.
 */
export async function enrichAdminRecentActivity(
  admin: SupabaseClient,
  rows: AdminRecentActivityItem[]
): Promise<AdminRecentActivityItem[]> {
  if (rows.length === 0) return rows;

  const out = rows.map((r) => ({ ...r }));

  const businessIdsNeedingEmail = new Set<string>();
  const userIdsNeedingCompany = new Set<string>();

  for (const r of out) {
    if (isBusinessRow(r) && isBlankEmail(r.email)) {
      businessIdsNeedingEmail.add(r.item_id);
    }
    if (isUserRow(r) && isBlankBusinessName(r.subtitle)) {
      userIdsNeedingCompany.add(r.item_id);
    }
  }

  const bizIds = [...businessIdsNeedingEmail];
  type BizRow = { id: string; owner_id: string | null; email: string | null };
  const businessesById = new Map<string, BizRow>();

  if (bizIds.length > 0) {
    const { data: bizData, error: bizErr } = await admin
      .from("businesses")
      .select("id, owner_id, email")
      .in("id", bizIds);

    if (!bizErr) {
      for (const b of bizData ?? []) {
        businessesById.set(String(b.id), {
          id: String(b.id),
          owner_id: b.owner_id != null ? String(b.owner_id) : null,
          email: typeof b.email === "string" ? b.email : null,
        });
      }
    }

    const verifyEmailByBizId = new Map<string, string>();
    const { data: verData, error: verErr } = await admin
      .from("business_domain_verifications")
      .select("business_id, email, consumed_at")
      .in("business_id", bizIds)
      .not("consumed_at", "is", null);

    if (!verErr && verData?.length) {
      const best = new Map<string, { email: string; t: number }>();
      for (const v of verData) {
        const bid = String(v.business_id ?? "");
        const em = typeof v.email === "string" ? v.email.trim() : "";
        if (!bid || !em) continue;
        const t = new Date(String(v.consumed_at ?? 0)).getTime();
        const prev = best.get(bid);
        if (!prev || t > prev.t) best.set(bid, { email: em, t });
      }
      for (const [bid, { email }] of best) {
        verifyEmailByBizId.set(bid, email);
      }
    }

    const ownerIds = new Set<string>();
    for (const id of bizIds) {
      const b = businessesById.get(id);
      if (b?.owner_id) ownerIds.add(b.owner_id);
    }

    const ownerEmailById = new Map<string, string>();
    await Promise.all(
      [...ownerIds].map(async (oid) => {
        try {
          const { data, error } = await admin.auth.admin.getUserById(oid);
          if (!error && data?.user?.email?.trim()) {
            ownerEmailById.set(oid, data.user.email.trim());
          }
        } catch {
          /* ignore */
        }
      })
    );

    const resolveBusinessEmail = (businessId: string): string | null => {
      const b = businessesById.get(businessId);
      if (b?.owner_id) {
        const oe = ownerEmailById.get(b.owner_id);
        if (oe) return oe;
      }
      if (b?.email?.trim()) return b.email.trim();
      return verifyEmailByBizId.get(businessId) ?? null;
    };

    for (let i = 0; i < out.length; i++) {
      const r = out[i]!;
      if (isBusinessRow(r) && isBlankEmail(r.email)) {
        const resolved = resolveBusinessEmail(r.item_id);
        if (resolved) {
          out[i] = { ...r, email: resolved };
        }
      }
    }
  }

  const userIds = [...userIdsNeedingCompany];
  if (userIds.length > 0) {
    const bpNameByUserId = new Map<string, string>();
    const { data: bpRows, error: bpErr } = await admin
      .from("business_profiles")
      .select("id, business_name")
      .in("id", userIds);

    if (!bpErr) {
      for (const row of bpRows ?? []) {
        const id = String(row.id ?? "");
        const n = typeof row.business_name === "string" ? row.business_name.trim() : "";
        if (id && n) bpNameByUserId.set(id, n);
      }
    }

    const metaCompanyByUserId = new Map<string, string>();
    await Promise.all(
      userIds.map(async (uid) => {
        if (bpNameByUserId.has(uid)) return;
        try {
          const { data, error } = await admin.auth.admin.getUserById(uid);
          if (error || !data?.user) return;
          const meta = data.user.user_metadata as Record<string, unknown> | undefined;
          const c =
            (typeof meta?.signup_company_name === "string" && meta.signup_company_name.trim()) ||
            (typeof meta?.company_name === "string" && meta.company_name.trim()) ||
            "";
          if (c) metaCompanyByUserId.set(uid, c);
        } catch {
          /* ignore */
        }
      })
    );

    for (let i = 0; i < out.length; i++) {
      const r = out[i]!;
      if (isUserRow(r) && isBlankBusinessName(r.subtitle)) {
        const name = bpNameByUserId.get(r.item_id) ?? metaCompanyByUserId.get(r.item_id);
        if (name) {
          out[i] = { ...r, subtitle: name };
        }
      }
    }
  }

  return out;
}
