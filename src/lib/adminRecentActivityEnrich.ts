import type { SupabaseClient } from "@supabase/supabase-js";
import type { AdminRecentActivityItem } from "@/lib/admin";

function isBlankEmail(e: string | null | undefined): boolean {
  return e == null || String(e).trim() === "";
}

function isBlankBusinessName(s: string | null | undefined): boolean {
  const t = s == null ? "" : String(s).trim();
  return t === "" || t === "—";
}

/** Placeholder person labels we try to replace with real signup / profile data. */
function isPlaceholderPerson(s: string | null | undefined): boolean {
  const t = s == null ? "" : String(s).trim();
  return t === "" || t === "Guest" || t === "User" || t === "Business Owner";
}

function isBusinessRow(r: AdminRecentActivityItem): boolean {
  return r.item_type === "business" || r.title === "Business created";
}

/** Business-created rows: empty, em dash, or generic label — replace with real owner when possible. */
function needsBusinessOwnerPerson(r: AdminRecentActivityItem): boolean {
  if (!isBusinessRow(r)) return false;
  const t = (r.person_name ?? r.name ?? "").trim();
  return t === "" || t === "—" || t === "Business Owner";
}

function isUserRow(r: AdminRecentActivityItem): boolean {
  return r.item_type === "user" || r.title === "New user";
}

function personFromAuthMeta(meta: Record<string, unknown> | undefined): string {
  if (!meta) return "";
  const fn = typeof meta.signup_first_name === "string" ? meta.signup_first_name.trim() : "";
  const ln = typeof meta.signup_last_name === "string" ? meta.signup_last_name.trim() : "";
  const combined = [fn, ln].filter(Boolean).join(" ").trim();
  if (combined) return combined;
  const full =
    (typeof meta.full_name === "string" && meta.full_name.trim()) ||
    (typeof meta.display_name === "string" && meta.display_name.trim()) ||
    "";
  return full;
}

type ProfileNameRow = {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

function personFromProfileRow(p: ProfileNameRow | undefined): string {
  if (!p) return "";
  const full = typeof p.full_name === "string" ? p.full_name.trim() : "";
  if (full) return full;
  const fn = typeof p.first_name === "string" ? p.first_name.trim() : "";
  const ln = typeof p.last_name === "string" ? p.last_name.trim() : "";
  const combined = [fn, ln].filter(Boolean).join(" ").trim();
  return combined;
}

/**
 * Fills gaps when `admin_get_recent_activity` returns null email / empty business name
 * or placeholder person names. Uses service-role reads + Auth Admin API.
 */
export async function enrichAdminRecentActivity(
  admin: SupabaseClient,
  rows: AdminRecentActivityItem[]
): Promise<AdminRecentActivityItem[]> {
  if (rows.length === 0) return rows;

  const out = rows.map((r) => ({ ...r }));

  const businessIdsNeedingEmail = new Set<string>();
  const businessIdsNeedingPerson = new Set<string>();
  const userIdsNeedingMeta = new Set<string>();

  for (const r of out) {
    const id =
      r.item_id != null && String(r.item_id).trim() !== ""
        ? String(r.item_id).trim()
        : null;
    if (!id) continue;
    if (isBusinessRow(r) && isBlankEmail(r.email)) {
      businessIdsNeedingEmail.add(id);
    }
    if (isBusinessRow(r) && needsBusinessOwnerPerson(r)) {
      businessIdsNeedingPerson.add(id);
    }
    if (isUserRow(r)) {
      if (isBlankBusinessName(r.subtitle) || isPlaceholderPerson(r.person_name ?? r.name)) {
        userIdsNeedingMeta.add(id);
      }
    }
  }

  const bizIds = [
    ...new Set<string>([...businessIdsNeedingEmail, ...businessIdsNeedingPerson]),
  ];
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

    const ownerUserIdByBusinessId = new Map<string, string>();
    const { data: boRows, error: boErr } = await admin
      .from("business_owners")
      .select("business_id, owner_user_id")
      .in("business_id", bizIds);

    if (!boErr) {
      for (const row of boRows ?? []) {
        const bid = String(row.business_id ?? "");
        const uid = row.owner_user_id != null ? String(row.owner_user_id) : "";
        if (bid && uid) ownerUserIdByBusinessId.set(bid, uid);
      }
    }

    const resolveOwnerUserId = (businessId: string): string | null => {
      const b = businessesById.get(businessId);
      if (b?.owner_id) return b.owner_id;
      return ownerUserIdByBusinessId.get(businessId) ?? null;
    };

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
      const uid = resolveOwnerUserId(id);
      if (uid) ownerIds.add(uid);
    }

    type OwnerInfo = { email: string; personFromAuth: string };
    const ownerInfoById = new Map<string, OwnerInfo>();
    await Promise.all(
      [...ownerIds].map(async (oid) => {
        try {
          const { data, error } = await admin.auth.admin.getUserById(oid);
          if (error || !data?.user) return;
          const meta = data.user.user_metadata as Record<string, unknown> | undefined;
          const personFromAuth = personFromAuthMeta(meta);
          const email = typeof data.user.email === "string" ? data.user.email.trim() : "";
          ownerInfoById.set(oid, { email, personFromAuth });
        } catch {
          /* ignore */
        }
      })
    );

    const profileByOwnerId = new Map<string, ProfileNameRow>();
    if (ownerIds.size > 0) {
      const { data: profData, error: profErr } = await admin
        .from("profiles")
        .select("id, full_name, first_name, last_name")
        .in("id", [...ownerIds]);

      if (!profErr) {
        for (const row of profData ?? []) {
          const id = String(row.id ?? "");
          if (id) profileByOwnerId.set(id, row);
        }
      }
    }

    const resolveOwnerDisplayPerson = (ownerUid: string): string => {
      const prof = personFromProfileRow(profileByOwnerId.get(ownerUid));
      if (prof) return prof;
      const auth = ownerInfoById.get(ownerUid);
      if (auth?.personFromAuth) return auth.personFromAuth;
      const em = auth?.email ?? "";
      if (em.includes("@")) {
        const local = em.split("@")[0]?.trim() ?? "";
        if (local) return local;
      }
      return "";
    };

    const resolveBusinessEmail = (businessId: string): string | null => {
      const uid = resolveOwnerUserId(businessId);
      if (uid) {
        const oe = ownerInfoById.get(uid)?.email;
        if (oe) return oe;
      }
      const b = businessesById.get(businessId);
      if (b?.email?.trim()) return b.email.trim();
      return verifyEmailByBizId.get(businessId) ?? null;
    };

    for (let i = 0; i < out.length; i++) {
      const r = out[i]!;
      const bid =
        r.item_id != null && String(r.item_id).trim() !== ""
          ? String(r.item_id).trim()
          : null;
      if (!bid || !isBusinessRow(r)) continue;

      let next = { ...r };

      if (isBlankEmail(next.email)) {
        const resolved = resolveBusinessEmail(bid);
        if (resolved) next = { ...next, email: resolved };
      }

      if (needsBusinessOwnerPerson(next)) {
        const uid = resolveOwnerUserId(bid);
        if (uid) {
          const resolvedPerson = resolveOwnerDisplayPerson(uid);
          if (resolvedPerson) {
            next = { ...next, person_name: resolvedPerson, name: resolvedPerson };
          }
        }
      }

      out[i] = next;
    }
  }

  const userIds = [...userIdsNeedingMeta];
  if (userIds.length > 0) {
    const bpByUserId = new Map<string, { business_name: string }>();
    const { data: bpRows, error: bpErr } = await admin
      .from("business_profiles")
      .select("id, business_name")
      .in("id", userIds);

    if (!bpErr) {
      for (const row of bpRows ?? []) {
        const id = String(row.id ?? "");
        const n = typeof row.business_name === "string" ? row.business_name.trim() : "";
        if (id && n) bpByUserId.set(id, { business_name: n });
      }
    }

    const authMetaByUserId = new Map<
      string,
      { company: string; person: string; email: string }
    >();

    await Promise.all(
      userIds.map(async (uid) => {
        try {
          const { data, error } = await admin.auth.admin.getUserById(uid);
          if (error || !data?.user) return;
          const meta = data.user.user_metadata as Record<string, unknown> | undefined;
          const company =
            (typeof meta?.signup_company_name === "string" && meta.signup_company_name.trim()) ||
            (typeof meta?.company_name === "string" && meta.company_name.trim()) ||
            "";
          const person = personFromAuthMeta(meta);
          const email = typeof data.user.email === "string" ? data.user.email.trim() : "";
          authMetaByUserId.set(uid, { company, person, email });
        } catch {
          /* ignore */
        }
      })
    );

    for (let i = 0; i < out.length; i++) {
      const r = out[i]!;
      const uid =
        r.item_id != null && String(r.item_id).trim() !== ""
          ? String(r.item_id).trim()
          : null;
      if (!uid || !isUserRow(r)) continue;

      const bp = bpByUserId.get(uid);
      const auth = authMetaByUserId.get(uid);
      let next = { ...r };

      if (isBlankBusinessName(next.subtitle)) {
        const companyName = bp?.business_name ?? auth?.company ?? "";
        if (companyName) {
          next = { ...next, subtitle: companyName };
        }
      }

      if (isPlaceholderPerson(next.person_name ?? next.name)) {
        const fromAuth = auth?.person ?? "";
        const local = auth?.email?.includes("@")
          ? auth.email.split("@")[0]?.trim() ?? ""
          : "";
        const resolved = fromAuth || local;
        if (resolved) {
          next = { ...next, person_name: resolved, name: resolved };
        }
      }

      out[i] = next;
    }
  }

  return out;
}
