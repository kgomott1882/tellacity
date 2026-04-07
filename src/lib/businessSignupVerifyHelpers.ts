import type { SupabaseClient } from "@supabase/supabase-js";
import { normalizeBusinessDomain } from "@/lib/normalizeBusinessDomain";

export type ResolvedBizRow = {
  id: string;
  name: string | null;
  website: string | null;
  owner_id: string | null;
  is_claimed: boolean | null;
  status: string | null;
};

/** Active business whose normalized website matches `websiteDomain` (no duplicate creation). */
export async function findActiveBusinessByWebsiteDomain(
  admin: SupabaseClient,
  websiteDomain: string
): Promise<ResolvedBizRow | null> {
  if (!websiteDomain) return null;

  const { data: rows, error } = await admin
    .from("businesses")
    .select("id, name, website, owner_id, is_claimed, status")
    .eq("status", "active")
    .ilike("website", `%${websiteDomain}%`)
    .limit(40);

  if (error || !rows?.length) return null;

  for (const r of rows) {
    const row = r as ResolvedBizRow;
    if (normalizeBusinessDomain(String(row.website ?? "")) === websiteDomain) {
      return row;
    }
  }
  return null;
}

/**
 * Prefer validated selected listing id; otherwise match by website domain.
 */
export async function resolveBusinessForSignup(
  admin: SupabaseClient,
  selectedBusinessId: string | null,
  websiteDomain: string
): Promise<ResolvedBizRow | null> {
  if (selectedBusinessId) {
    const { data: b } = await admin
      .from("businesses")
      .select("id, name, website, owner_id, is_claimed, status")
      .eq("id", selectedBusinessId)
      .maybeSingle();

    if (b) {
      const row = b as ResolvedBizRow;
      const dbDomain = normalizeBusinessDomain(String(row.website ?? ""));
      if (dbDomain === websiteDomain && String(row.status ?? "").toLowerCase() === "active") {
        return row;
      }
    }
  }

  return findActiveBusinessByWebsiteDomain(admin, websiteDomain);
}

/** Caller should set this from how the Supabase client was constructed (service role key vs anon). */
export type BusinessOwnersClientRole = "service_role" | "anon" | "unknown";

export type EnsureBusinessOwnershipError = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  phase: "insert_on_conflict_do_nothing";
};

/**
 * Links the auth user to a business for the dashboard. Call only after domain OTP is verified and the
 * `businesses` row is activated / claimed (so the row is in its final owner state).
 *
 * Equivalent to:
 * `INSERT INTO business_owners (business_id, owner_user_id) VALUES (...) ON CONFLICT (business_id) DO NOTHING`
 * via PostgREST `ignoreDuplicates` (does not overwrite an existing owner for that business).
 */
export async function ensureBusinessOwnershipRow(
  admin: SupabaseClient,
  businessId: string,
  ownerUserId: string,
  _options?: { supabaseClientRole?: BusinessOwnersClientRole }
): Promise<{ ok: true } | { ok: false; error: EnsureBusinessOwnershipError }> {
  const row = { business_id: businessId, owner_user_id: ownerUserId };

  const { error } = await admin
    .from("business_owners")
    .upsert(row, { onConflict: "business_id", ignoreDuplicates: true });

  if (!error) {
    return { ok: true };
  }

  if (process.env.NODE_ENV === "development") {
    console.error("[ensureBusinessOwnershipRow]", error.message, error.code);
  }

  return {
    ok: false,
    error: {
      phase: "insert_on_conflict_do_nothing",
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    },
  };
}

export type AttachResult =
  | { ok: true }
  | { ok: false; kind: "already_claimed" }
  | { ok: false; kind: "db"; message: string; code?: string };

/**
 * Claim or align `businesses` row for this user (legacy / non-OTP flows).
 * Dashboard domain OTP finalizes via RPC `verify_domain_finish_business_claim` in `POST /api/business/verify-domain`.
 */
export async function attachUserToResolvedBusiness(
  admin: SupabaseClient,
  userId: string,
  resolved: ResolvedBizRow,
  phoneTrim: string
): Promise<AttachResult> {
  const ownerStr = resolved.owner_id != null ? String(resolved.owner_id) : "";

  if (ownerStr !== "" && ownerStr !== userId) {
    return { ok: false, kind: "already_claimed" };
  }

  if (!ownerStr && resolved.is_claimed === false) {
    const { data: claimResult, error: claimErr } = await admin
      .from("businesses")
      .update({ owner_id: userId, is_claimed: true })
      .eq("id", resolved.id)
      .is("owner_id", null)
      .eq("is_claimed", false)
      .select()
      .single();

    if (claimErr && claimErr.code !== "PGRST116") {
      return { ok: false, kind: "db", message: claimErr.message, code: claimErr.code };
    }
    if (!claimResult) return { ok: false, kind: "already_claimed" };
  } else if (!ownerStr) {
    const { data: assign, error: aerr } = await admin
      .from("businesses")
      .update({ owner_id: userId, is_claimed: true })
      .eq("id", resolved.id)
      .is("owner_id", null)
      .select()
      .single();

    if (aerr && aerr.code !== "PGRST116") {
      return { ok: false, kind: "db", message: aerr.message, code: aerr.code };
    }
    if (!assign) return { ok: false, kind: "already_claimed" };
  }

  if (phoneTrim) {
    await admin.from("businesses").update({ phone: phoneTrim }).eq("id", resolved.id);
  }

  return { ok: true };
}
