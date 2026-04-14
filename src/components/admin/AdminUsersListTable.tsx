import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";

export type AdminUsersListRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  is_admin: boolean | null;
  created_at: string | null;
};

type AdminUsersListTableProps = {
  title: string;
  rows: AdminUsersListRow[];
  emptyMessage: string;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "-";
  const dt = new Date(iso);
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleString();
}

function displayName(row: AdminUsersListRow): string {
  const name = row.display_name?.trim();
  if (name) return name;
  return row.email?.trim() || "-";
}

export default function AdminUsersListTable({
  title,
  rows,
  emptyMessage,
}: AdminUsersListTableProps) {
  return (
    <AdminTableShell title={`${title} (${rows.length})`}>
      {rows.length === 0 ? (
        <div className="p-4">
          <AdminEmptyState message={emptyMessage} />
        </div>
      ) : (
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
            <tr>
              <th className="px-3 py-2 font-medium">Name</th>
              <th className="px-3 py-2 font-medium">Email</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Admin</th>
              <th className="px-3 py-2 font-medium">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {rows.map((row) => (
              <tr key={row.id} className="bg-white align-top">
                <td className="px-3 py-2 font-medium text-neutral-900">
                  {displayName(row)}
                </td>
                <td className="max-w-[260px] truncate px-3 py-2 text-neutral-700" title={row.email ?? "-"}>
                  {row.email?.trim() || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.role?.trim() || "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                  {row.is_admin ? "Yes" : "No"}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                  {formatWhen(row.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </AdminTableShell>
  );
}
