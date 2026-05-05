import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminDeleteUserButton from "@/components/admin/AdminDeleteUserButton";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { getAdminUsers, type AdminUserRow } from "@/lib/admin";
import {
  adminSetUserAdminAction,
  adminSetUserBusinessAction,
  adminSetUserConsumerAction,
  adminSuspendUserAction,
  adminUnsuspendUserAction,
} from "../actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ e?: string; q?: string; role?: string }>;
};

function userId(row: AdminUserRow): string {
  return String(row.user_id ?? row.id ?? "");
}

function displayName(row: AdminUserRow): string {
  const n = row.display_name ?? row.full_name ?? row.name;
  if (n && String(n).trim()) return String(n);
  return "-";
}

function email(row: AdminUserRow): string {
  return row.email?.trim() || "-";
}

function role(row: AdminUserRow): string {
  return row.role?.trim() || "-";
}

function isAdmin(row: AdminUserRow): boolean {
  return row.is_admin === true;
}

function suspended(row: AdminUserRow): boolean {
  return row.suspended === true || row.is_suspended === true;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function ActionBtn({
  label,
  formAction,
}: {
  label: string;
  formAction: () => Promise<void>;
}) {
  return (
    <form action={formAction}>
      <button
        type="submit"
        className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
      >
        {label}
      </button>
    </form>
  );
}

export default async function AdminUsersPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const err = searchParams.e;
  const searchTerm = searchParams.q?.trim() || "";
  const roleFilterRaw = searchParams.role?.trim().toLowerCase() || "";
  const roleFilter =
    roleFilterRaw === "consumer" || roleFilterRaw === "business" || roleFilterRaw === "admin"
      ? roleFilterRaw
      : "";

  const { supabase } = await requireAdminSession("/admin/users");
  const { data: users, error: listError } = await getAdminUsers(supabase, {
    searchTerm: searchTerm || null,
    roleFilter: roleFilter || null,
    limitCount: 500,
    offsetCount: 0,
  });

  return (
    <div className="space-y-4">
      {err ? <AdminActionMessage type="error" text={err} /> : null}
      {listError ? <AdminActionMessage type="error" text={listError} /> : null}

      <AdminTableShell
        title={`All Users (${users.length})`}
        controls={
          <form method="get" className="flex flex-wrap items-center gap-2">
            <input
              name="q"
              type="search"
              defaultValue={searchTerm}
              placeholder="Search name or email"
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700"
            />
            <select
              name="role"
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-700"
              defaultValue={roleFilter}
            >
              <option value="">All roles</option>
              <option value="consumer">Consumer</option>
              <option value="business">Business</option>
              <option value="admin">Admin</option>
            </select>
            <button
              type="submit"
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Apply
            </button>
            <a
              href="/admin/users"
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
            >
              Reset
            </a>
          </form>
        }
      >
        {users.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message="No users returned from admin_list_users." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Email</th>
                <th className="px-3 py-2 font-medium">Role</th>
                <th className="px-3 py-2 font-medium">Admin</th>
                <th className="px-3 py-2 font-medium">Suspended</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((row, i) => {
                const id = userId(row);
                if (!id) return null;
                const r = role(row);
                return (
                  <tr
                    key={id || `u-${i}`}
                    className={`align-top ${suspended(row) ? "bg-red-50/40" : "bg-white"}`}
                  >
                    <td className="px-3 py-2 font-medium text-neutral-900">
                      {displayName(row)}
                    </td>
                    <td className="max-w-[200px] truncate px-3 py-2 text-neutral-700" title={email(row)}>
                      {email(row)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-neutral-700">{r}</td>
                    <td className="px-3 py-2 text-neutral-700">{isAdmin(row) ? "Yes" : "No"}</td>
                    <td className="px-3 py-2">
                      {suspended(row) ? (
                        <span className="inline-flex items-center rounded-full border border-red-200 bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Suspended
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                      {formatDate(row.created_at)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex max-w-[280px] flex-wrap gap-1">
                        <ActionBtn
                          label="Consumer"
                          formAction={adminSetUserConsumerAction.bind(null, id)}
                        />
                        <ActionBtn
                          label="Business"
                          formAction={adminSetUserBusinessAction.bind(null, id)}
                        />
                        <ActionBtn
                          label="Admin"
                          formAction={adminSetUserAdminAction.bind(null, id, r === "-" ? "consumer" : r)}
                        />
                        {suspended(row) ? (
                          <ActionBtn
                            label="Unsuspend"
                            formAction={adminUnsuspendUserAction.bind(null, id)}
                          />
                        ) : (
                          <ActionBtn
                            label="Suspend"
                            formAction={adminSuspendUserAction.bind(null, id)}
                          />
                        )}
                        <AdminDeleteUserButton userId={id} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminTableShell>
    </div>
  );
}
