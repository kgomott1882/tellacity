import type { PostgrestError, SupabaseClient } from "@supabase/supabase-js";

function stripUndefined<T extends Record<string, unknown>>(row: T): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    if (v !== undefined) out[k] = v;
  }
  return out;
}

function isOptionalTableOrColumnError(err: PostgrestError): boolean {
  const msg = (err.message ?? "").toLowerCase();
  if (err.code === "PGRST205" || err.code === "PGRST204") return true;
  if (msg.includes("schema cache") && msg.includes("column")) return true;
  if (msg.includes("could not find") && msg.includes("column")) return true;
  if (msg.includes("relation") && msg.includes("does not exist")) return true;
  return false;
}

function isProfilesUpsertSkippableError(err: PostgrestError): boolean {
  if (isOptionalTableOrColumnError(err)) return true;
  if (err.code === "23502") return true;
  return false;
}

/**
 * Stale `profiles` rows with the same email block signup (unique indexes).
 */
export async function releaseTableEmailForNewUser(
  admin: SupabaseClient,
  emailNorm: string,
  newUserId: string
): Promise<{ ok: true } | { ok: false; message: string; code?: string }> {
  const { data: rows, error: listErr } = await admin.from("profiles").select("id").eq("email", emailNorm);

  if (listErr) {
    if (isOptionalTableOrColumnError(listErr)) return { ok: true };
    if (isProfilesUpsertSkippableError(listErr)) return { ok: true };
    return { ok: false, message: listErr.message, code: listErr.code };
  }

  for (const row of rows ?? []) {
    const rid = String((row as { id?: string }).id ?? "");
    if (!rid || rid === newUserId) continue;

    const { error: delErr } = await admin.from("profiles").delete().eq("id", rid);
    if (!delErr) continue;

    const tempEmail = `${emailNorm}.released.${Date.now()}.${rid.replace(/-/g, "").slice(0, 12)}`;
    const { error: upErr } = await admin.from("profiles").update({ email: tempEmail }).eq("id", rid);
    if (upErr) {
      return { ok: false, message: upErr.message, code: upErr.code };
    }
  }

  return { ok: true };
}

export function formatSignupProfileErrorForClient(err: PostgrestError | null): string {
  if (!err) return "Could not save your profile. Please try again.";
  const msg = (err.message ?? "").toLowerCase();
  if (msg.includes("duplicate") || err.code === "23505") {
    return "This email is still tied to an old profile. Try again, or use a different address.";
  }
  return "Could not save your profile. Please try again.";
}

/** Consumer `profiles` row only — signup does not touch business_profiles or businesses. */
export type SignupProfileSyncPayload = {
  userId: string;
  emailNorm: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
};

export async function ensureProfilesShellRow(
  admin: SupabaseClient,
  userId: string,
  emailNorm: string
): Promise<{ ok: true } | { ok: false; error: PostgrestError }> {
  const minimal = { id: userId, email: emailNorm };

  let { error } = await admin.from("profiles").upsert(minimal, { onConflict: "id" });
  if (!error) return { ok: true };
  if (error.code === "23505") return { ok: false, error };

  if (isOptionalTableOrColumnError(error) || isProfilesUpsertSkippableError(error)) {
    console.warn("[signup] profiles shell skipped (no table/column):", error.message);
    return { ok: true };
  }

  const ins = await admin.from("profiles").insert(minimal);
  if (!ins.error) return { ok: true };
  if (ins.error.code === "23505") return { ok: false, error: ins.error };
  if (isOptionalTableOrColumnError(ins.error) || isProfilesUpsertSkippableError(ins.error)) {
    console.warn("[signup] profiles shell skipped:", ins.error.message);
    return { ok: true };
  }

  return { ok: false, error: ins.error };
}

async function enrichProfilesAfterSignup(admin: SupabaseClient, p: SignupProfileSyncPayload): Promise<void> {
  const fn = p.firstName.trim();
  const ln = p.lastName.trim();
  const full = `${fn} ${ln}`.trim();
  const phone = typeof p.phone === "string" && p.phone.trim() ? p.phone.trim() : undefined;

  const profilePatches: Record<string, unknown>[] = [
    stripUndefined({ first_name: fn, last_name: ln, full_name: full }),
    stripUndefined({ first_name: fn, last_name: ln }),
    ...(phone ? [stripUndefined({ phone })] : []),
  ];

  for (const patch of profilePatches) {
    if (Object.keys(patch).length === 0) continue;
    const { error } = await admin.from("profiles").update(patch).eq("id", p.userId);
    if (error) {
      console.warn("[signup] profiles enrich patch:", error.message);
    }
  }
}

/**
 * After `auth.admin.createUser`: release stale profile emails → profiles shell → optional name/phone patches.
 * Does not write `business_profiles`, `businesses`, or `business_owners`.
 */
export async function syncSignupIdentityAfterAuthUserCreated(
  admin: SupabaseClient,
  p: SignupProfileSyncPayload
): Promise<{ ok: true } | { ok: false; error: PostgrestError | null }> {
  const { error: delProfilesErr } = await admin.from("profiles").delete().eq("id", p.userId);
  if (delProfilesErr && !isProfilesUpsertSkippableError(delProfilesErr)) {
    return { ok: false, error: delProfilesErr };
  }

  const relPr = await releaseTableEmailForNewUser(admin, p.emailNorm, p.userId);
  if (!relPr.ok) {
    return { ok: false, error: { message: relPr.message, code: relPr.code } as PostgrestError };
  }

  const shell = await ensureProfilesShellRow(admin, p.userId, p.emailNorm);
  if (!shell.ok) return { ok: false, error: shell.error };

  await enrichProfilesAfterSignup(admin, p);

  return { ok: true };
}

/** Rollback `profiles` only during signup failure (before `auth.admin.deleteUser`). */
export async function cleanupSignupUserRows(admin: SupabaseClient, userId: string): Promise<void> {
  const { error } = await admin.from("profiles").delete().eq("id", userId);
  if (error && !isProfilesUpsertSkippableError(error)) {
    console.warn("[signup] profiles cleanup:", error.message);
  }
}

export async function isAuthEmailAlreadyRegistered(
  supabaseUrl: string,
  serviceRoleKey: string,
  emailNorm: string
): Promise<boolean> {
  let page = 1;
  const perPage = 200;

  for (let safety = 0; safety < 100; safety++) {
    const res = await fetch(
      `${supabaseUrl.replace(/\/+$/, "")}/auth/v1/admin/users?page=${page}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        cache: "no-store",
      }
    );

    if (!res.ok) return false;

    const json = (await res.json()) as { users?: { email?: string | null }[] };
    const users = json.users ?? [];

    if (users.some((u) => (u.email ?? "").trim().toLowerCase() === emailNorm)) {
      return true;
    }

    if (users.length < perPage) return false;
    page += 1;
  }

  return false;
}
