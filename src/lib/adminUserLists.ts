import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";

import type { AdminUsersListRow } from "@/components/admin/AdminUsersListTable";
import { isLikelyCustomBusinessDomainEmail } from "@/lib/consumerEmailDomains";

type QueryResult = {
  data: AdminUsersListRow[];
  error: string | null;
};

type RawProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  is_admin: boolean | null;
  created_at: string | null;
};

function adminServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Uses the caller's Supabase client (admin session JWT) so `admin_list_new_users_today` sees
 * `auth.uid()` and passes `is_current_user_admin()`. Service-role clients have no JWT and RPC fails.
 */
export async function getNewUsersTodayRows(supabase: SupabaseClient): Promise<QueryResult> {
  const { data, error } = await supabase.rpc("admin_list_new_users_today");
  if (error) {
    return { data: [], error: error.message };
  }

  type RpcRow = {
    kind?: string | null;
    id?: string | null;
    email?: string | null;
    display_name?: string | null;
    role?: string | null;
    is_admin?: boolean | null;
    created_at?: string | null;
  };

  const rows = ((data ?? []) as RpcRow[]).map((r) => {
    const kind = String(r.kind ?? "").trim();
    const role =
      kind === "first_review_email"
        ? "guest (first review email)"
        : (r.role?.trim() || "consumer");

    return {
      id: String(r.id ?? ""),
      email: r.email?.trim() || null,
      display_name: r.display_name?.trim() || null,
      role,
      is_admin: r.is_admin ?? null,
      created_at: r.created_at ?? null,
    };
  });

  return { data: rows.filter((x) => x.id), error: null };
}

/** Business bucket: workspace team member/owner, or auth email on a non-webmail domain. */
function isBusinessUserByTeamOrEmail(
  userId: string,
  authEmail: string | null | undefined,
  businessTeamIds: Set<string>
): boolean {
  if (businessTeamIds.has(userId)) return true;
  return isLikelyCustomBusinessDomainEmail(authEmail);
}

async function listAllAuthUsersForAdmin(supabase: SupabaseClient): Promise<{
  users: User[];
  error: string | null;
}> {
  const users: User[] = [];
  for (let page = 1; page <= 50; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      return { users: [], error: error.message };
    }
    const batch = data?.users ?? [];
    users.push(...batch);
    if (batch.length < 200) break;
  }
  return { users, error: null };
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
}

/** All auth users not in the business bucket (matches overview consumer_users). */
export async function getConsumerUserRows(): Promise<QueryResult> {
  const supabase = adminServiceClient();
  const [
    { data: ownerRows, error: ownerError },
    { data: memberRows, error: memberError },
    authRes,
  ] = await Promise.all([
    supabase.from("businesses").select("owner_id").not("owner_id", "is", null),
    supabase.from("business_members").select("user_id").not("user_id", "is", null),
    listAllAuthUsersForAdmin(supabase),
  ]);

  if (ownerError) {
    return { data: [], error: ownerError.message };
  }
  if (memberError) {
    return { data: [], error: memberError.message };
  }
  if (authRes.error) {
    return { data: [], error: authRes.error };
  }

  const businessTeamIds = new Set<string>();
  for (const row of ownerRows ?? []) {
    const id = String(row.owner_id ?? "").trim();
    if (id) businessTeamIds.add(id);
  }
  for (const row of memberRows ?? []) {
    const id = String(row.user_id ?? "").trim();
    if (id) businessTeamIds.add(id);
  }

  const consumers = authRes.users.filter((u) => !isBusinessUserByTeamOrEmail(u.id, u.email, businessTeamIds));
  const idList = consumers.map((u) => u.id).filter(Boolean);
  const profileById = new Map<string, RawProfileRow>();
  for (const part of chunk(idList, 150)) {
    if (part.length === 0) continue;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, is_admin, created_at")
      .in("id", part);
    if (error) {
      return { data: [], error: error.message };
    }
    for (const row of (data ?? []) as RawProfileRow[]) {
      profileById.set(String(row.id), row);
    }
  }

  const rows: AdminUsersListRow[] = [];
  for (const u of consumers) {
    const p = profileById.get(u.id);
    if (p) {
      rows.push({
        id: p.id,
        email: p.email ?? u.email ?? null,
        display_name: p.display_name,
        role: p.role,
        is_admin: p.is_admin,
        created_at: p.created_at ?? u.created_at ?? null,
      });
    } else {
      const meta = u.user_metadata as Record<string, unknown> | undefined;
      const metaName =
        typeof meta?.full_name === "string"
          ? meta.full_name.trim()
          : typeof meta?.name === "string"
            ? meta.name.trim()
            : null;
      rows.push({
        id: u.id,
        email: u.email ?? null,
        display_name: metaName,
        role: null,
        is_admin: null,
        created_at: u.created_at ?? null,
      });
    }
  }

  rows.sort((a, b) => {
    const ta = new Date(a.created_at ?? 0).getTime();
    const tb = new Date(b.created_at ?? 0).getTime();
    return tb - ta;
  });

  return { data: rows, error: null };
}

export async function getBusinessUserRows(): Promise<QueryResult> {
  const supabase = adminServiceClient();
  const [
    { data: ownerRows, error: ownerError },
    { data: memberRows, error: memberError },
    authRes,
  ] = await Promise.all([
    supabase.from("businesses").select("owner_id").not("owner_id", "is", null),
    supabase.from("business_members").select("user_id").not("user_id", "is", null),
    listAllAuthUsersForAdmin(supabase),
  ]);

  if (ownerError) {
    return { data: [], error: ownerError.message };
  }
  if (memberError) {
    return { data: [], error: memberError.message };
  }
  if (authRes.error) {
    return { data: [], error: authRes.error };
  }

  const businessTeamIds = new Set<string>();
  for (const row of ownerRows ?? []) {
    const id = String(row.owner_id ?? "").trim();
    if (id) businessTeamIds.add(id);
  }
  for (const row of memberRows ?? []) {
    const id = String(row.user_id ?? "").trim();
    if (id) businessTeamIds.add(id);
  }

  const ids = new Set<string>(businessTeamIds);
  const authById = new Map<string, User>();
  for (const u of authRes.users) {
    authById.set(u.id, u);
    if (isLikelyCustomBusinessDomainEmail(u.email)) ids.add(u.id);
  }

  if (ids.size === 0) {
    return { data: [], error: null };
  }

  const idList = Array.from(ids);
  const profileById = new Map<string, RawProfileRow>();
  for (const part of chunk(idList, 150)) {
    if (part.length === 0) continue;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, display_name, role, is_admin, created_at")
      .in("id", part);
    if (error) {
      return { data: [], error: error.message };
    }
    for (const row of (data ?? []) as RawProfileRow[]) {
      profileById.set(String(row.id), row);
    }
  }

  const rows: AdminUsersListRow[] = [];
  for (const id of idList) {
    const p = profileById.get(id);
    const u = authById.get(id);
    if (p) {
      rows.push({
        id: p.id,
        email: p.email,
        display_name: p.display_name,
        role: p.role,
        is_admin: p.is_admin,
        created_at: p.created_at ?? u?.created_at ?? null,
      });
    } else if (u) {
      const meta = u.user_metadata as Record<string, unknown> | undefined;
      const metaName =
        typeof meta?.full_name === "string"
          ? meta.full_name.trim()
          : typeof meta?.name === "string"
            ? meta.name.trim()
            : null;
      rows.push({
        id: u.id,
        email: u.email ?? null,
        display_name: metaName,
        role: businessTeamIds.has(id) ? null : "custom-domain email",
        is_admin: false,
        created_at: u.created_at ?? null,
      });
    }
  }

  rows.sort((a, b) => {
    const ta = new Date(a.created_at ?? 0).getTime();
    const tb = new Date(b.created_at ?? 0).getTime();
    return tb - ta;
  });

  return { data: rows, error: null };
}
