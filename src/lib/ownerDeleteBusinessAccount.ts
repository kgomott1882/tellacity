import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";

type OwnerDeleteRpcRow = {
  ok?: boolean;
  error?: string;
  deleted_business_ids?: string[];
};

export type OwnerDeleteBusinessAccountResult =
  | { ok: true; deletedBusinessIds: string[] }
  | { ok: false; error: string };

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

export async function ownerDeleteBusinessAccount(
  ownerUserId: string,
): Promise<OwnerDeleteBusinessAccountResult> {
  const trimmed = ownerUserId.trim();
  if (!trimmed) {
    return { ok: false, error: "Missing user id." };
  }

  const admin = createServiceAdmin();
  if (!admin) {
    return { ok: false, error: "Server configuration missing." };
  }

  const { data, error } = await admin.rpc("owner_delete_business_account_service", {
    p_owner_user_id: trimmed,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  const row = (data ?? null) as OwnerDeleteRpcRow | null;
  if (!row?.ok) {
    return { ok: false, error: row?.error ?? "Could not delete account data." };
  }

  const { error: authDeleteError } = await admin.auth.admin.deleteUser(trimmed);
  if (authDeleteError) {
    return {
      ok: false,
      error: authDeleteError.message ?? "Account data removed but sign-in could not be deleted.",
    };
  }

  const deletedBusinessIds = Array.isArray(row.deleted_business_ids)
    ? row.deleted_business_ids.map((id) => String(id))
    : [];

  return { ok: true, deletedBusinessIds };
}
