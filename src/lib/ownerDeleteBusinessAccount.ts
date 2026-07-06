import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getServerEnv } from "@/lib/serverEnv";
import { sendBusinessAccountClosedEmail } from "@/lib/sendBusinessAccountClosedEmail";

type OwnerDeleteRpcRow = {
  ok?: boolean;
  error?: string;
  deleted_business_ids?: string[];
};

export type OwnerDeleteBusinessAccountParams = {
  ownerUserId: string;
  email: string;
  ownerName?: string;
};

export type OwnerDeleteBusinessAccountResult =
  | { ok: true; deletedBusinessIds: string[]; confirmationEmailSent: boolean }
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

async function fetchOwnedBusinessNames(
  admin: SupabaseClient,
  ownerUserId: string,
): Promise<string[]> {
  const { data: byOwnerId } = await admin
    .from("businesses")
    .select("name")
    .eq("owner_id", ownerUserId);

  const { data: ownerLinks } = await admin
    .from("business_owners")
    .select("business_id")
    .eq("owner_user_id", ownerUserId);

  const linkedIds = (ownerLinks ?? [])
    .map((row) => String((row as { business_id?: string }).business_id ?? "").trim())
    .filter(Boolean);

  let byLink: { name: string | null }[] = [];
  if (linkedIds.length > 0) {
    const { data } = await admin.from("businesses").select("name").in("id", linkedIds);
    byLink = (data ?? []) as { name: string | null }[];
  }

  const names = new Set<string>();
  for (const row of [...(byOwnerId ?? []), ...byLink]) {
    const name = String((row as { name?: string | null }).name ?? "").trim();
    if (name) names.add(name);
  }
  return Array.from(names);
}

export async function ownerDeleteBusinessAccount(
  params: OwnerDeleteBusinessAccountParams,
): Promise<OwnerDeleteBusinessAccountResult> {
  const trimmed = params.ownerUserId.trim();
  const email = params.email.trim().toLowerCase();
  if (!trimmed) {
    return { ok: false, error: "Missing user id." };
  }
  if (!email) {
    return { ok: false, error: "Missing account email." };
  }

  const admin = createServiceAdmin();
  if (!admin) {
    return { ok: false, error: "Server configuration missing." };
  }

  const businessNames = await fetchOwnedBusinessNames(admin, trimmed);

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

  const emailResult = await sendBusinessAccountClosedEmail({
    to: email,
    ownerName: params.ownerName,
    businessNames,
  });
  if (!emailResult.ok) {
    console.error("[ownerDeleteBusinessAccount] confirmation email:", emailResult.error);
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

  return {
    ok: true,
    deletedBusinessIds,
    confirmationEmailSent: emailResult.ok,
  };
}
