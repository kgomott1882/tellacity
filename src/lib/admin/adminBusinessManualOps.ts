import type { SupabaseClient } from "@supabase/supabase-js";
import { getAuthUserIdByEmail } from "@/lib/authAdminUsers";
import { allocateUniqueBusinessSlug } from "@/lib/businessSlug";
import { normalizeWebsiteDomain } from "@/lib/normalizeWebsiteDomain";
import { getServerEnv } from "@/lib/serverEnv";
import { releaseTableEmailForNewUser } from "@/lib/signupIdentitySync";
import { validateSuggestCategory } from "@/lib/businessSuggestShared";

type AdminServiceRpc = {
  ok?: boolean;
  error?: string;
  business_id?: string;
  slug?: string;
};

async function rpcAdminUpsertOwnerProfile(
  admin: SupabaseClient,
  userId: string,
  email: string,
  displayName: string | null,
  businessName: string | null,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await admin.rpc("admin_upsert_owner_profile_service", {
    p_user_id: userId,
    p_email: email,
    p_owner_display_name: displayName,
    p_business_name: businessName,
  });
  if (error) return { ok: false, error: error.message };
  const row = data as AdminServiceRpc | null;
  if (!row?.ok) {
    return { ok: false, error: row?.error ?? "Could not save owner profile." };
  }
  return { ok: true };
}

async function rpcAdminInsertBusiness(
  admin: SupabaseClient,
  fields: AdminManualBusinessFields,
  slug: string,
): Promise<{ ok: true; businessId: string; slug: string } | { ok: false; error: string }> {
  const { data, error } = await admin.rpc("admin_insert_business_manual_service", {
    p_name: fields.name,
    p_slug: slug,
    p_website: fields.website,
    p_country_code: fields.countryCode,
    p_category_slug: fields.categorySlug,
    p_primary_group_slug: fields.primaryGroupSlug,
    p_address: fields.address,
    p_city: fields.city,
    p_phone: fields.phone,
    p_email: fields.publicEmail,
  });
  if (error) return { ok: false, error: error.message };
  const row = data as AdminServiceRpc | null;
  if (!row?.ok || !row.business_id) {
    const msg =
      row?.error === "duplicate_business"
        ? "A business with this website or slug already exists."
        : row?.error ?? "Could not create business.";
    return { ok: false, error: msg };
  }
  return { ok: true, businessId: String(row.business_id), slug: String(row.slug ?? slug) };
}

async function rpcAdminClaimBusiness(
  admin: SupabaseClient,
  businessId: string,
  ownerUserId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data, error } = await admin.rpc("admin_claim_business_service", {
    p_business_id: businessId,
    p_owner_user_id: ownerUserId,
  });
  if (error) return { ok: false, error: error.message };
  const row = data as AdminServiceRpc | null;
  if (!row?.ok) {
    const msg =
      row?.error === "already_claimed"
        ? "This business is already claimed by another user."
        : row?.error === "business_not_found"
          ? "Business not found."
          : row?.error ?? "Could not claim business.";
    return { ok: false, error: msg };
  }
  return { ok: true };
}

export type AdminManualBusinessFields = {
  name: string;
  website: string;
  countryCode: string;
  categorySlug: string;
  primaryGroupSlug: string;
  address?: string | null;
  city?: string | null;
  phone?: string | null;
  publicEmail?: string | null;
};

export type AdminManualOwnerFields = {
  email: string;
  firstName: string;
  lastName: string;
};

export type AdminManualCreateResult = {
  businessId: string;
  slug: string;
  ownerUserId: string;
  ownerCreated: boolean;
};

function trimOrNull(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t || null;
}

function splitOwnerName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}

export function parseAdminManualOwnerFields(body: Record<string, unknown>): AdminManualOwnerFields {
  const email = trimOrNull(body.ownerEmail ?? body.owner_email) ?? "";
  const firstName =
    trimOrNull(body.ownerFirstName ?? body.owner_first_name) ??
    splitOwnerName(String(body.ownerName ?? body.owner_name ?? "")).firstName;
  const lastName =
    trimOrNull(body.ownerLastName ?? body.owner_last_name) ??
    splitOwnerName(String(body.ownerName ?? body.owner_name ?? "")).lastName;

  return {
    email: email.toLowerCase(),
    firstName,
    lastName,
  };
}

export function parseAdminManualBusinessFields(
  body: Record<string, unknown>,
): AdminManualBusinessFields | { error: string } {
  const name = trimOrNull(body.name) ?? "";
  const website = trimOrNull(body.website) ?? "";
  const countryCode = String(body.countryCode ?? body.country_code ?? "")
    .trim()
    .toUpperCase()
    .slice(0, 2);
  const categorySlug = trimOrNull(body.categorySlug ?? body.category_slug) ?? "";
  const primaryGroupSlug = trimOrNull(body.primaryGroupSlug ?? body.primary_group_slug) ?? "";

  if (!name || !website || countryCode.length !== 2 || !categorySlug || !primaryGroupSlug) {
    return {
      error:
        "Business name, website, country, primary group, and category are required.",
    };
  }

  const normalizedWebsite = normalizeWebsiteDomain(website);
  if (!normalizedWebsite) {
    return { error: "Enter a valid website." };
  }

  return {
    name,
    website: normalizedWebsite,
    countryCode,
    categorySlug,
    primaryGroupSlug,
    address: trimOrNull(body.address ?? body.street_address),
    city: trimOrNull(body.city),
    phone: trimOrNull(body.phone),
    publicEmail: trimOrNull(body.publicEmail ?? body.public_email)?.toLowerCase() ?? null,
  };
}

export function parseAdminManualOwnerRequired(
  owner: AdminManualOwnerFields,
): { ok: true } | { ok: false; error: string } {
  if (!owner.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(owner.email)) {
    return { ok: false, error: "A valid owner email is required." };
  }
  if (!owner.firstName.trim()) {
    return { ok: false, error: "Owner first name is required." };
  }
  return { ok: true };
}

async function enrichOwnerIdentity(
  admin: SupabaseClient,
  userId: string,
  owner: AdminManualOwnerFields,
  businessName: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const displayName = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();
  const emailNorm = owner.email.trim().toLowerCase();

  const { data: userData } = await admin.auth.admin.getUserById(userId);
  const existingMeta = (userData?.user?.user_metadata ?? {}) as Record<string, unknown>;

  await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...existingMeta,
      account_kind: "business",
      first_name: owner.firstName.trim(),
      last_name: owner.lastName.trim(),
      full_name: displayName || existingMeta.full_name,
      signup_company_name: businessName,
    },
  });

  return rpcAdminUpsertOwnerProfile(admin, userId, emailNorm, displayName || null, businessName);
}

export async function resolveOrCreateOwnerUser(
  admin: SupabaseClient,
  owner: AdminManualOwnerFields,
): Promise<{ ok: true; userId: string; created: boolean } | { ok: false; error: string }> {
  const emailNorm = owner.email.trim().toLowerCase();
  const { supabaseUrl, serviceRoleKey } = getServerEnv();

  let userId = await getAuthUserIdByEmail(supabaseUrl, serviceRoleKey, emailNorm);
  if (userId) {
    return { ok: true, userId, created: false };
  }

  const { data: created, error } = await admin.auth.admin.createUser({
    email: emailNorm,
    email_confirm: true,
    user_metadata: {
      account_kind: "business",
      first_name: owner.firstName.trim(),
      last_name: owner.lastName.trim(),
      full_name: [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim(),
    },
  });

  if (error || !created.user?.id) {
    return { ok: false, error: error?.message ?? "Could not create owner account." };
  }

  userId = created.user.id;
  const released = await releaseTableEmailForNewUser(admin, emailNorm, userId);
  if (!released.ok) {
    await admin.auth.admin.deleteUser(userId);
    return { ok: false, error: released.message };
  }

  return { ok: true, userId, created: true };
}

export async function adminClaimBusinessForUser(
  admin: SupabaseClient,
  businessId: string,
  ownerUserId: string,
  options?: { businessName?: string; owner?: AdminManualOwnerFields },
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: biz, error: fetchErr } = await admin
    .from("businesses")
    .select("id, name, owner_id, is_claimed")
    .eq("id", businessId)
    .maybeSingle();

  if (fetchErr) return { ok: false, error: fetchErr.message };
  if (!biz) return { ok: false, error: "Business not found." };

  const existingOwner =
    biz.owner_id != null ? String(biz.owner_id).trim() : "";
  if (existingOwner && existingOwner !== ownerUserId) {
    return { ok: false, error: "This business is already claimed by another user." };
  }

  const { data: boRow } = await admin
    .from("business_owners")
    .select("owner_user_id")
    .eq("business_id", businessId)
    .maybeSingle();

  const linkedOwner =
    boRow?.owner_user_id != null ? String(boRow.owner_user_id).trim() : "";
  if (linkedOwner && linkedOwner !== ownerUserId) {
    return { ok: false, error: "This business is already linked to another owner." };
  }

  if (options?.owner) {
    const profile = await enrichOwnerIdentity(
      admin,
      ownerUserId,
      options.owner,
      options.businessName ?? String(biz.name ?? "").trim(),
    );
    if (!profile.ok) {
      return profile;
    }
  } else {
    const profile = await rpcAdminUpsertOwnerProfile(
      admin,
      ownerUserId,
      `user_${ownerUserId.replace(/-/g, "")}@tellacity.auth`,
      null,
      options?.businessName ?? String(biz.name ?? "").trim(),
    );
    if (!profile.ok) {
      return profile;
    }
  }

  return rpcAdminClaimBusiness(admin, businessId, ownerUserId);
}

export async function adminCreateBusiness(
  admin: SupabaseClient,
  fields: AdminManualBusinessFields,
  options?: { claimForUserId?: string; owner?: AdminManualOwnerFields },
): Promise<
  | { ok: true; businessId: string; slug: string }
  | { ok: false; error: string }
> {
  const categoryCheck = await validateSuggestCategory(
    admin,
    fields.categorySlug,
    fields.primaryGroupSlug,
  );
  if (!categoryCheck.ok) {
    return { ok: false, error: categoryCheck.message };
  }

  const { data: dupRows } = await admin
    .from("businesses")
    .select("id, website")
    .eq("status", "active")
    .ilike("website", `%${fields.website}%`)
    .limit(20);

  const duplicate = (dupRows ?? []).some(
    (r) => normalizeWebsiteDomain(String((r as { website?: string }).website ?? "")) === fields.website,
  );
  if (duplicate) {
    return { ok: false, error: "A business with this website already exists." };
  }

  const slug = await allocateUniqueBusinessSlug(admin, fields.name);
  const claimUserId = options?.claimForUserId?.trim() || null;

  const inserted = await rpcAdminInsertBusiness(admin, fields, slug);
  if (!inserted.ok) {
    return inserted;
  }

  if (claimUserId) {
    const claim = await adminClaimBusinessForUser(admin, inserted.businessId, claimUserId, {
      businessName: fields.name,
      owner: options?.owner,
    });
    if (!claim.ok) {
      await admin.from("businesses").delete().eq("id", inserted.businessId);
      return { ok: false, error: claim.error };
    }
  }

  return { ok: true, businessId: inserted.businessId, slug: inserted.slug };
}

export async function adminCreateAndClaimBusiness(
  admin: SupabaseClient,
  fields: AdminManualBusinessFields,
  owner: AdminManualOwnerFields,
): Promise<
  | { ok: true; result: AdminManualCreateResult }
  | { ok: false; error: string }
> {
  const ownerResolved = await resolveOrCreateOwnerUser(admin, owner);
  if (!ownerResolved.ok) {
    return { ok: false, error: ownerResolved.error };
  }

  const identity = await enrichOwnerIdentity(admin, ownerResolved.userId, owner, fields.name);
  if (!identity.ok) {
    return { ok: false, error: identity.error };
  }

  const created = await adminCreateBusiness(admin, fields, {
    claimForUserId: ownerResolved.userId,
    owner,
  });
  if (!created.ok) {
    return { ok: false, error: created.error };
  }

  return {
    ok: true,
    result: {
      businessId: created.businessId,
      slug: created.slug,
      ownerUserId: ownerResolved.userId,
      ownerCreated: ownerResolved.created,
    },
  };
}
