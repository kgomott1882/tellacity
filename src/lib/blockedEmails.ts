import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { getAuthUserIdByEmail } from "@/lib/authAdminUsers";
import { getServerEnv } from "@/lib/serverEnv";

export const EMAIL_BLOCKED_ERROR_CODE = "email_blocked";
export const EMAIL_BLOCKED_MESSAGE =
  "This email address is blocked from using Tellacity. Contact support if you believe this is a mistake.";

export const GUEST_NAME_BLOCKED_ERROR_CODE = "guest_name_blocked";
export const GUEST_NAME_BLOCKED_MESSAGE =
  "This reviewer name is blocked from posting reviews on Tellacity.";

export function normalizeBlockEmail(email: string | null | undefined): string {
  return String(email ?? "")
    .trim()
    .toLowerCase();
}

export function normalizeBlockGuestName(name: string | null | undefined): string {
  return String(name ?? "")
    .trim()
    .toLowerCase();
}

export function isValidBlockEmail(email: string): boolean {
  return Boolean(email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
}

function createServiceAdmin(): SupabaseClient | null {
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    return createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

/** Quote a value for PostgREST filter strings (emails contain @ and .). */
function quotePostgrestValue(value: string): string {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** Service-role / admin client check against blocked_emails. */
export async function isEmailBlocked(
  email: string | null | undefined,
  client?: SupabaseClient,
): Promise<boolean> {
  const normalized = normalizeBlockEmail(email);
  if (!isValidBlockEmail(normalized)) return false;

  const supabase = client ?? createServiceAdmin();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("is_email_blocked", {
    p_email: normalized,
  });

  if (error) {
    // Fallback direct table read if RPC missing
    const { data: row } = await supabase
      .from("blocked_emails")
      .select("email")
      .eq("email", normalized)
      .maybeSingle();
    return Boolean(row?.email);
  }

  return data === true;
}

export function emailBlockedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: EMAIL_BLOCKED_MESSAGE,
      error_code: EMAIL_BLOCKED_ERROR_CODE,
    },
    { status: 403 },
  );
}

/** Returns a 403 NextResponse if blocked; otherwise null. */
export async function rejectIfEmailBlocked(
  email: string | null | undefined,
  client?: SupabaseClient,
): Promise<NextResponse | null> {
  if (await isEmailBlocked(email, client)) {
    return emailBlockedResponse();
  }
  return null;
}

export async function isGuestNameBlocked(
  name: string | null | undefined,
  client?: SupabaseClient,
): Promise<boolean> {
  const normalized = normalizeBlockGuestName(name);
  if (!normalized || normalized.length < 2) return false;

  const supabase = client ?? createServiceAdmin();
  if (!supabase) return false;

  const { data, error } = await supabase.rpc("is_guest_name_blocked", {
    p_name: normalized,
  });

  if (error) {
    const { data: row } = await supabase
      .from("blocked_guest_names")
      .select("guest_name")
      .eq("guest_name", normalized)
      .maybeSingle();
    return Boolean(row?.guest_name);
  }

  return data === true;
}

export function guestNameBlockedResponse(): NextResponse {
  return NextResponse.json(
    {
      error: GUEST_NAME_BLOCKED_MESSAGE,
      error_code: GUEST_NAME_BLOCKED_ERROR_CODE,
    },
    { status: 403 },
  );
}

export async function rejectIfGuestNameBlocked(
  name: string | null | undefined,
  client?: SupabaseClient,
): Promise<NextResponse | null> {
  if (await isGuestNameBlocked(name, client)) {
    return guestNameBlockedResponse();
  }
  return null;
}

export type BlockedGuestNameRow = {
  guest_name: string;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

export async function listBlockedGuestNames(
  admin: SupabaseClient,
): Promise<{ rows: BlockedGuestNameRow[]; error: string | null }> {
  const { data, error } = await admin
    .from("blocked_guest_names")
    .select("guest_name, reason, notes, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return { rows: [], error: error.message };
  }
  return {
    rows: (Array.isArray(data) ? data : []) as BlockedGuestNameRow[],
    error: null,
  };
}

export type BlockGuestNameResult =
  | {
      ok: true;
      guestName: string;
      deletedReviews: number;
      deletedDrafts: number;
    }
  | { ok: false; error: string };

/**
 * Legacy guest-name purge (API only). Names are not unique — prefer email blocks.
 * Only deletes reviews that have no stored email, to avoid wiping unrelated people.
 */
export async function purgePublishedContentForGuestName(
  nameRaw: string,
): Promise<
  | { ok: true; guestName: string; deletedReviews: number; deletedDrafts: number }
  | { ok: false; error: string }
> {
  const guestName = normalizeBlockGuestName(nameRaw);
  if (!guestName || guestName.length < 2) {
    return { ok: false, error: "Enter a guest display name (at least 2 characters)." };
  }

  const admin = createServiceAdmin();
  if (!admin) {
    return { ok: false, error: "Server configuration missing." };
  }

  const { data: rpcData, error: rpcErr } = await admin.rpc(
    "purge_content_for_guest_name_service",
    { p_guest_name: guestName },
  );
  if (!rpcErr && rpcData && typeof rpcData === "object") {
    const row = rpcData as {
      ok?: boolean;
      error?: string;
      guest_name?: string;
      deleted_reviews?: number;
      deleted_drafts?: number;
    };
    if (row.ok === false) {
      return { ok: false, error: row.error ?? "Could not purge guest name content." };
    }
    return {
      ok: true,
      guestName: String(row.guest_name ?? guestName),
      deletedReviews: Number(row.deleted_reviews ?? 0),
      deletedDrafts: Number(row.deleted_drafts ?? 0),
    };
  }

  const { data: candidates, error: selErr } = await admin
    .from("reviews")
    .select("id, guest_email, author_email, email")
    .ilike("guest_name", guestName)
    .limit(5000);

  if (selErr) {
    return { ok: false, error: rpcErr?.message || selErr.message };
  }

  const ids = (candidates ?? [])
    .filter((r) => {
      const ge = String((r as { guest_email?: string | null }).guest_email ?? "")
        .trim()
        .toLowerCase();
      const ae = String((r as { author_email?: string | null }).author_email ?? "")
        .trim()
        .toLowerCase();
      const em = String((r as { email?: string | null }).email ?? "")
        .trim()
        .toLowerCase();
      return !ge && !ae && !em;
    })
    .map((r) => String((r as { id: string }).id));

  let deletedReviews = 0;
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { data: deleted, error } = await admin
      .from("reviews")
      .delete()
      .in("id", chunk)
      .select("id");
    if (error) return { ok: false, error: error.message };
    deletedReviews += Array.isArray(deleted) ? deleted.length : 0;
  }

  return { ok: true, guestName, deletedReviews, deletedDrafts: 0 };
}

export async function adminBlockGuestNameAndPurge(params: {
  guestName: string;
  reason?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}): Promise<BlockGuestNameResult> {
  const guestName = normalizeBlockGuestName(params.guestName);
  if (!guestName || guestName.length < 2) {
    return { ok: false, error: "Enter a guest display name (at least 2 characters)." };
  }

  const admin = createServiceAdmin();
  if (!admin) {
    return { ok: false, error: "Server configuration missing." };
  }

  // Blocklist only — purge once via purgePublishedContentForGuestName so counts are accurate.
  const { error: upsertErr } = await admin.from("blocked_guest_names").upsert(
    {
      guest_name: guestName,
      reason: params.reason?.trim() || null,
      created_by: params.createdBy || null,
      notes: params.notes?.trim() || null,
    },
    { onConflict: "guest_name" },
  );
  if (upsertErr) {
    // Try RPC that also inserts (may already purge — still run purge below for completeness)
    const { data, error } = await admin.rpc("admin_block_guest_name_service", {
      p_guest_name: guestName,
      p_reason: params.reason?.trim() || null,
      p_created_by: params.createdBy || null,
      p_notes: params.notes?.trim() || null,
    });
    if (error) {
      return { ok: false, error: upsertErr.message || error.message };
    }
    const row = data as { ok?: boolean; error?: string } | null;
    if (row && row.ok === false) {
      return { ok: false, error: row.error ?? "Could not block guest name." };
    }
  }

  const purged = await purgePublishedContentForGuestName(guestName);
  if (!purged.ok) {
    return { ok: false, error: purged.error };
  }

  return {
    ok: true,
    guestName: purged.guestName,
    deletedReviews: purged.deletedReviews,
    deletedDrafts: purged.deletedDrafts,
  };
}

export async function adminUnblockGuestName(
  nameRaw: string,
): Promise<{ ok: true; guestName: string } | { ok: false; error: string }> {
  const guestName = normalizeBlockGuestName(nameRaw);
  if (!guestName) {
    return { ok: false, error: "Enter a guest display name." };
  }

  const admin = createServiceAdmin();
  if (!admin) {
    return { ok: false, error: "Server configuration missing." };
  }

  const { data, error } = await admin.rpc("admin_unblock_guest_name_service", {
    p_guest_name: guestName,
  });

  if (error) {
    const { error: delErr } = await admin
      .from("blocked_guest_names")
      .delete()
      .eq("guest_name", guestName);
    if (delErr) return { ok: false, error: error.message };
    return { ok: true, guestName };
  }

  const row = data as { ok?: boolean; error?: string; guest_name?: string } | null;
  if (!row?.ok) {
    return { ok: false, error: row?.error ?? "Could not unblock guest name." };
  }

  return { ok: true, guestName: String(row.guest_name ?? guestName) };
}

export type BlockEmailResult =
  | {
      ok: true;
      email: string;
      deletedReviews: number;
      deletedDrafts: number;
      deletedOtps: number;
      authUsersBanned: number;
    }
  | { ok: false; error: string };

export type BlockedEmailRow = {
  email: string;
  reason: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  reviews_deleted_count?: number | null;
  last_purged_at?: string | null;
};

export async function recordBlockedEmailPurgeCounts(
  admin: SupabaseClient,
  email: string,
  deletedReviews: number,
  deletedDrafts: number,
  deletedOtps: number,
): Promise<number | null> {
  const { data, error } = await admin.rpc("record_blocked_email_purge_counts", {
    p_email: email,
    p_reviews_deleted: deletedReviews,
    p_drafts_deleted: deletedDrafts,
    p_otps_deleted: deletedOtps,
  });

  if (!error && data && typeof data === "object") {
    const row = data as { ok?: boolean; reviews_deleted_count?: number };
    if (row.ok !== false && typeof row.reviews_deleted_count === "number") {
      return row.reviews_deleted_count;
    }
  }

  // Fallback if RPC not deployed yet
  const { data: existing } = await admin
    .from("blocked_emails")
    .select("reviews_deleted_count")
    .eq("email", email)
    .maybeSingle();
  const prev = Number(
    (existing as { reviews_deleted_count?: number | null } | null)?.reviews_deleted_count ?? 0,
  );
  const next = prev + Math.max(0, deletedReviews);
  const { error: updErr } = await admin
    .from("blocked_emails")
    .update({
      reviews_deleted_count: next,
      last_purged_at: new Date().toISOString(),
    })
    .eq("email", email);
  if (updErr) {
    console.warn("[recordBlockedEmailPurgeCounts]", updErr.message || error?.message);
    return null;
  }
  return next;
}

export async function listBlockedEmails(
  admin: SupabaseClient,
): Promise<{ rows: BlockedEmailRow[]; error: string | null }> {
  const { data, error } = await admin
    .from("blocked_emails")
    .select(
      "email, reason, notes, created_by, created_at, reviews_deleted_count, last_purged_at",
    )
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    // Older schema without the new columns
    const fallback = await admin
      .from("blocked_emails")
      .select("email, reason, notes, created_by, created_at")
      .order("created_at", { ascending: false })
      .limit(500);
    if (fallback.error) {
      return { rows: [], error: fallback.error.message };
    }
    return {
      rows: (Array.isArray(fallback.data) ? fallback.data : []) as BlockedEmailRow[],
      error: null,
    };
  }
  return {
    rows: (Array.isArray(data) ? data : []) as BlockedEmailRow[],
    error: null,
  };
}

/**
 * Hard-delete every review attributable to this email:
 * guest_email / author_email / email columns, title/body mentions, and auth user_id.
 *
 * Uses SQL RPC first — unquoted PostgREST filters break on emails containing `@` / `.`
 * (e.g. body.ilike.%user@gmail.com% is parsed incorrectly → "Deleted 0").
 */
export async function purgePublishedContentForEmail(
  emailRaw: string,
): Promise<{
  ok: true;
  email: string;
  deletedReviews: number;
  deletedDrafts: number;
  deletedOtps: number;
  authUserId: string | null;
} | { ok: false; error: string }> {
  const email = normalizeBlockEmail(emailRaw);
  if (!isValidBlockEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const admin = createServiceAdmin();
  if (!admin) {
    return { ok: false, error: "Server configuration missing." };
  }

  let authUserId: string | null = null;
  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    authUserId = await getAuthUserIdByEmail(supabaseUrl, serviceRoleKey, email);
  } catch (e) {
    console.warn("[purgePublishedContentForEmail] auth lookup:", e);
  }

  const { data: rpcData, error: rpcErr } = await admin.rpc(
    "purge_content_for_email_service",
    { p_email: email },
  );

  if (!rpcErr && rpcData && typeof rpcData === "object") {
    const row = rpcData as {
      ok?: boolean;
      error?: string;
      email?: string;
      deleted_reviews?: number;
      deleted_drafts?: number;
      deleted_otps?: number;
    };
    if (row.ok === false) {
      return { ok: false, error: row.error ?? "Could not purge email content." };
    }

    let extraByUser = 0;
    if (authUserId) {
      const { data: deleted } = await admin
        .from("reviews")
        .delete()
        .eq("user_id", authUserId)
        .select("id");
      extraByUser = Array.isArray(deleted) ? deleted.length : 0;
    }

    return {
      ok: true,
      email: String(row.email ?? email),
      deletedReviews: Number(row.deleted_reviews ?? 0) + extraByUser,
      deletedDrafts: Number(row.deleted_drafts ?? 0),
      deletedOtps: Number(row.deleted_otps ?? 0),
      authUserId,
    };
  }

  console.warn(
    "[purgePublishedContentForEmail] RPC unavailable, using quoted PostgREST filters:",
    rpcErr?.message,
  );

  const reviewIds = new Set<string>();
  const collect = (rows: { id?: string }[] | null | undefined) => {
    for (const row of rows ?? []) {
      const id = String(row.id ?? "").trim();
      if (id) reviewIds.add(id);
    }
  };

  const q = quotePostgrestValue(email);
  const qPat = quotePostgrestValue(`%${email}%`);

  const { data: byCols, error: colErr } = await admin
    .from("reviews")
    .select("id")
    .or(`guest_email.ilike.${q},author_email.ilike.${q},email.ilike.${q}`)
    .limit(5000);
  if (colErr) {
    console.error("[purgePublishedContentForEmail] byCols:", colErr);
  }
  collect(byCols as { id?: string }[] | null);

  const { data: byText, error: textErr } = await admin
    .from("reviews")
    .select("id")
    .or(`title.ilike.${qPat},body.ilike.${qPat}`)
    .limit(5000);
  if (textErr) {
    console.error("[purgePublishedContentForEmail] byText:", textErr);
  }
  collect(byText as { id?: string }[] | null);

  if (authUserId) {
    const { data: byUser } = await admin
      .from("reviews")
      .select("id")
      .eq("user_id", authUserId)
      .limit(5000);
    collect(byUser as { id?: string }[] | null);
  }

  let deletedReviews = 0;
  const ids = Array.from(reviewIds);
  for (let i = 0; i < ids.length; i += 200) {
    const chunk = ids.slice(i, i + 200);
    const { data: deleted, error } = await admin
      .from("reviews")
      .delete()
      .in("id", chunk)
      .select("id");
    if (error) {
      console.error("[purgePublishedContentForEmail] delete reviews:", error);
      return { ok: false, error: error.message };
    }
    deletedReviews += Array.isArray(deleted) ? deleted.length : 0;
  }

  let deletedDrafts = 0;
  try {
    const { data: drafts } = await admin
      .from("review_drafts")
      .delete()
      .or(`email.ilike.${q},title.ilike.${qPat},body.ilike.${qPat}`)
      .select("id");
    deletedDrafts = Array.isArray(drafts) ? drafts.length : 0;
  } catch (e) {
    console.warn("[purgePublishedContentForEmail] drafts:", e);
  }

  let deletedOtps = 0;
  try {
    const { data: otps } = await admin
      .from("review_otps")
      .delete()
      .ilike("email", email)
      .select("id");
    deletedOtps = Array.isArray(otps) ? otps.length : 0;
  } catch (e) {
    console.warn("[purgePublishedContentForEmail] otps:", e);
  }

  return {
    ok: true,
    email,
    deletedReviews,
    deletedDrafts,
    deletedOtps,
    authUserId,
  };
}

/**
 * Permanently block an email, purge its reviews/drafts/OTPs, and ban matching auth users.
 */
export async function adminBlockEmailAndPurge(params: {
  email: string;
  reason?: string | null;
  notes?: string | null;
  createdBy?: string | null;
}): Promise<BlockEmailResult> {
  const email = normalizeBlockEmail(params.email);
  if (!isValidBlockEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const admin = createServiceAdmin();
  if (!admin) {
    return { ok: false, error: "Server configuration missing." };
  }

  // Blocklist only — purge once below so deleted counts are accurate
  // (admin_block_email_service already purges, which previously made a second
  // purge report "Deleted 0" even when reviews were removed).
  const { error: upsertErr } = await admin.from("blocked_emails").upsert(
    {
      email,
      reason: params.reason?.trim() || null,
      created_by: params.createdBy || null,
      notes: params.notes?.trim() || null,
    },
    { onConflict: "email" },
  );

  if (upsertErr) {
    const { data, error } = await admin.rpc("admin_block_email_service", {
      p_email: email,
      p_reason: params.reason?.trim() || null,
      p_created_by: params.createdBy || null,
      p_notes: params.notes?.trim() || null,
    });
    if (error) {
      return { ok: false, error: upsertErr.message || error.message };
    }
    const row = data as { ok?: boolean; error?: string } | null;
    if (row && row.ok === false) {
      return { ok: false, error: row.error ?? "Could not block email." };
    }
  }

  const purged = await purgePublishedContentForEmail(email);
  if (!purged.ok) {
    return { ok: false, error: purged.error };
  }

  await recordBlockedEmailPurgeCounts(
    admin,
    purged.email,
    purged.deletedReviews,
    purged.deletedDrafts,
    purged.deletedOtps,
  );

  let authUsersBanned = 0;
  if (purged.authUserId) {
    try {
      const { error: banErr } = await admin.auth.admin.updateUserById(purged.authUserId, {
        ban_duration: "876000h",
      });
      if (!banErr) authUsersBanned = 1;
    } catch (e) {
      console.warn("[adminBlockEmailAndPurge] auth ban skipped:", e);
    }
  }

  return {
    ok: true,
    email: purged.email,
    deletedReviews: purged.deletedReviews,
    deletedDrafts: purged.deletedDrafts,
    deletedOtps: purged.deletedOtps,
    authUsersBanned,
  };
}

export async function adminUnblockEmail(
  emailRaw: string,
): Promise<{ ok: true; email: string } | { ok: false; error: string }> {
  const email = normalizeBlockEmail(emailRaw);
  if (!isValidBlockEmail(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const admin = createServiceAdmin();
  if (!admin) {
    return { ok: false, error: "Server configuration missing." };
  }

  const { data, error } = await admin.rpc("admin_unblock_email_service", {
    p_email: email,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = data as { ok?: boolean; error?: string; email?: string } | null;
  if (!row?.ok) {
    return { ok: false, error: row?.error ?? "Could not unblock email." };
  }

  try {
    const { supabaseUrl, serviceRoleKey } = getServerEnv();
    const userId = await getAuthUserIdByEmail(supabaseUrl, serviceRoleKey, email);
    if (userId) {
      await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
    }
  } catch (e) {
    console.warn("[adminUnblockEmail] auth unban skipped:", e);
  }

  return { ok: true, email: String(row.email ?? email) };
}
