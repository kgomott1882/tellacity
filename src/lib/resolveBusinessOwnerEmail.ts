import type { SupabaseClient } from "@supabase/supabase-js";

function trimStr(v: unknown): string | null {
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}

type BusinessOwnerRow = {
  id?: string | null;
  name?: string | null;
  owner_id?: string | null;
  status?: string | null;
  submission_status?: string | null;
};

type BusinessOwnersRow = {
  owner_user_id?: string | null;
};

type BusinessProfileEmailRow = {
  email?: string | null;
};

export type ResolveOwnerEmailResult = {
  ownerUserId: string | null;
  email: string | null;
  businessName: string | null;
  status: string | null;
  submissionStatus: string | null;
};

/**
 * Best-effort: pick the registered owner email for a given business.
 * Order: business_profiles.email (by owner_id) → business_profiles by user_id → auth.users.email.
 */
export async function resolveOwnerEmail(
  admin: SupabaseClient,
  businessId: string,
): Promise<ResolveOwnerEmailResult> {
  const { data: bizRaw } = await admin
    .from("businesses")
    .select("id, name, owner_id, status, submission_status")
    .eq("id", businessId)
    .maybeSingle();

  const biz = bizRaw as BusinessOwnerRow | null;
  if (!biz) {
    return {
      ownerUserId: null,
      email: null,
      businessName: null,
      status: null,
      submissionStatus: null,
    };
  }

  const businessName = trimStr(biz.name);
  const status = trimStr(biz.status);
  const submissionStatus = trimStr(biz.submission_status);
  let ownerUserId: string | null =
    biz.owner_id != null ? String(biz.owner_id).trim() : null;

  if (!ownerUserId) {
    const { data: boRaw } = await admin
      .from("business_owners")
      .select("owner_user_id")
      .eq("business_id", businessId)
      .maybeSingle();
    const bo = boRaw as BusinessOwnersRow | null;
    const uid =
      bo?.owner_user_id != null ? String(bo.owner_user_id).trim() : "";
    ownerUserId = uid || null;
  }

  let email: string | null = null;

  if (ownerUserId) {
    const { data: bpRaw } = await admin
      .from("business_profiles")
      .select("email")
      .eq("id", ownerUserId)
      .maybeSingle();
    const bp = bpRaw as BusinessProfileEmailRow | null;
    const bpEmail =
      typeof bp?.email === "string" ? bp.email.trim().toLowerCase() : "";
    if (bpEmail.includes("@")) email = bpEmail;

    if (!email) {
      const { data: bp2Raw } = await admin
        .from("business_profiles")
        .select("email")
        .eq("user_id", ownerUserId)
        .maybeSingle();
      const bp2 = bp2Raw as BusinessProfileEmailRow | null;
      const bp2Email =
        typeof bp2?.email === "string" ? bp2.email.trim().toLowerCase() : "";
      if (bp2Email.includes("@")) email = bp2Email;
    }

    if (!email) {
      try {
        const { data: userRes } = await admin.auth.admin.getUserById(ownerUserId);
        const authEmail =
          typeof userRes?.user?.email === "string"
            ? userRes.user.email.trim().toLowerCase()
            : "";
        if (authEmail.includes("@")) email = authEmail;
      } catch (e) {
        console.warn("[resolveOwnerEmail] auth.admin.getUserById failed", e);
      }
    }
  }

  return { ownerUserId, email, businessName, status, submissionStatus };
}
