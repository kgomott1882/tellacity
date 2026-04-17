import { createClient } from "@supabase/supabase-js";

import type { AdminUsersListRow } from "@/components/admin/AdminUsersListTable";

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

function mapProfileRows(rows: RawProfileRow[] | null | undefined): AdminUsersListRow[] {
  return (rows ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    display_name: row.display_name,
    role: row.role,
    is_admin: row.is_admin,
    created_at: row.created_at,
  }));
}

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

function utcDayBounds(date = new Date()): { startIso: string; endIso: string } {
  const startMs = Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  const endMs = startMs + 24 * 60 * 60 * 1000;
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(endMs).toISOString(),
  };
}

export async function getNewUsersTodayRows(): Promise<QueryResult> {
  const supabase = adminServiceClient();
  const { startIso, endIso } = utcDayBounds();
  const startMs = new Date(startIso).getTime();
  const endMs = new Date(endIso).getTime();

  const users: Array<{
    id: string;
    email: string | null;
    created_at: string | null;
    user_metadata?: Record<string, unknown> | null;
  }> = [];

  let page = 1;
  const perPage = 200;
  let keepPaging = true;
  while (keepPaging) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      return { data: [], error: error.message };
    }

    const batch = data?.users ?? [];
    if (batch.length === 0) break;

    for (const u of batch) {
      const createdMs = u.created_at ? new Date(u.created_at).getTime() : Number.NaN;
      if (Number.isNaN(createdMs)) continue;
      if (createdMs >= startMs && createdMs < endMs) {
        users.push({
          id: u.id,
          email: u.email ?? null,
          created_at: u.created_at ?? null,
          user_metadata:
            u.user_metadata && typeof u.user_metadata === "object" ? u.user_metadata : null,
        });
      }
    }

    // auth users are returned newest first; once we reach older users, we can stop.
    const lastCreated = batch[batch.length - 1]?.created_at;
    const lastCreatedMs = lastCreated ? new Date(lastCreated).getTime() : Number.NaN;
    if (Number.isNaN(lastCreatedMs) || lastCreatedMs < startMs) {
      keepPaging = false;
    } else {
      page += 1;
    }
  }

  if (users.length === 0) {
    return { data: [], error: null };
  }

  const ids = users.map((u) => u.id);
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, is_admin")
    .in("id", ids);

  if (profileError) {
    return { data: [], error: profileError.message };
  }

  const profileById = new Map(
    ((profileData ?? []) as Array<{
      id: string;
      email?: string | null;
      display_name?: string | null;
      role?: string | null;
      is_admin?: boolean | null;
    }>).map((p) => [p.id, p]),
  );

  const rows: AdminUsersListRow[] = users
    .map((u) => {
      const profile = profileById.get(u.id);
      const metadataName =
        (typeof u.user_metadata?.display_name === "string" &&
        u.user_metadata.display_name.trim()) ||
        (typeof u.user_metadata?.full_name === "string" &&
        u.user_metadata.full_name.trim()) ||
        null;

      return {
        id: u.id,
        email: profile?.email?.trim() || u.email?.trim() || null,
        display_name: profile?.display_name?.trim() || metadataName || null,
        role: profile?.role?.trim() || null,
        is_admin: profile?.is_admin ?? null,
        created_at: u.created_at ?? null,
      };
    })
    .sort((a, b) => {
      const ta = a.created_at ? new Date(a.created_at).getTime() : 0;
      const tb = b.created_at ? new Date(b.created_at).getTime() : 0;
      return tb - ta;
    });

  return { data: rows, error: null };
}

export async function getConsumerUserRows(): Promise<QueryResult> {
  const supabase = adminServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, is_admin, created_at")
    .eq("role", "consumer")
    .order("created_at", { ascending: false });

  return {
    data: mapProfileRows(data as RawProfileRow[]),
    error: error?.message ?? null,
  };
}

export async function getBusinessUserRows(): Promise<QueryResult> {
  const supabase = adminServiceClient();
  const [{ data: ownerRows, error: ownerError }, { data: memberRows, error: memberError }] =
    await Promise.all([
      supabase.from("businesses").select("owner_id").not("owner_id", "is", null),
      supabase.from("business_members").select("user_id").not("user_id", "is", null),
    ]);

  if (ownerError) {
    return { data: [], error: ownerError.message };
  }
  if (memberError) {
    return { data: [], error: memberError.message };
  }

  const ids = new Set<string>();
  for (const row of ownerRows ?? []) {
    const id = String(row.owner_id ?? "").trim();
    if (id) ids.add(id);
  }
  for (const row of memberRows ?? []) {
    const id = String(row.user_id ?? "").trim();
    if (id) ids.add(id);
  }

  if (ids.size === 0) {
    return { data: [], error: null };
  }

  const idList = Array.from(ids);
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, is_admin, created_at")
    .in("id", idList)
    .order("created_at", { ascending: false });

  return {
    data: mapProfileRows(data as RawProfileRow[]),
    error: error?.message ?? null,
  };
}
