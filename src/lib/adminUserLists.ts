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

export async function getNewUsersTodayRows(): Promise<QueryResult> {
  const supabase = adminServiceClient();
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

export async function getConsumerUserRows(): Promise<QueryResult> {
  const supabase = adminServiceClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, display_name, role, is_admin, created_at")
    .neq("role", "business")
    .not("is_admin", "eq", true)
    .not("email", "ilike", "%@tellacity.auth")
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
