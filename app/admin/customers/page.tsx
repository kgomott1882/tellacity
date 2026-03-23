import Link from "next/link";

import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";

export const dynamic = "force-dynamic";

type CustomerBusinessRow = {
  id: string;
  name: string | null;
  website: string | null;
  status: string | null;
  created_at: string | null;
  owner_id: string | null;
  review_count: number | null;
  plan_code: string | null;
  profiles:
    | {
        email?: string | null;
        display_name?: string | null;
      }
    | Array<{
        email?: string | null;
        display_name?: string | null;
      }>
    | null;
};

export default async function AdminCustomerBusinessesPage() {
  const { supabase } = await requireAdminSession();

  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      website,
      status,
      created_at,
      owner_id,
      review_count,
      plan_code,
      profiles!businesses_owner_id_fkey (
        email,
        display_name
      )
    `)
    .not("owner_id", "is", null)
    .order("created_at", { ascending: false });

  const listError = error?.message ?? null;
  const rows = (Array.isArray(data) ? data : []) as CustomerBusinessRow[];
  const customers = rows.map((b) => {
    const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
    return {
      id: b.id,
      name: b.name,
      website: b.website,
      status: b.status,
      created_at: b.created_at,
      review_count: b.review_count,
      plan_code: b.plan_code,
      owner_email: profile?.email ?? "—",
      owner_name: profile?.display_name?.trim() || profile?.email || "—",
    };
  });

  return (
    <div className="space-y-4">
      {listError ? <AdminActionMessage type="error" text={listError} /> : null}

      <AdminTableShell
        title={`Customer Businesses (${customers?.length || 0})`}
      >
        <div className="w-full">
          <div className="border-b border-neutral-100 bg-white px-4 py-2.5">
            <input
              placeholder="Search business or owner..."
              className="w-full max-w-sm rounded border px-3 py-2"
            />
          </div>
          {customers.length === 0 ? (
            <div className="p-4">
              <AdminEmptyState message="No customer businesses yet" />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Business</th>
                  <th className="px-3 py-2 font-medium">Owner</th>
                  <th className="px-3 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 font-medium">Reviews</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((c) => {
                  return (
                    <tr key={c.id} className="bg-white align-top">
                      <td className="px-3 py-2">
                        <div className="font-medium">{c.name || "—"}</div>
                        <div className="text-sm text-gray-500">{c.website || "—"}</div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium">{c.owner_name}</div>
                        <div className="text-sm text-gray-500">{c.owner_email}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 capitalize">
                        {c.plan_code || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        {c.review_count ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                          {c.status || "—"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/businesses/${c.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Manage
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </AdminTableShell>
    </div>
  );
}
