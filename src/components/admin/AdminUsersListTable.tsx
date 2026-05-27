import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";

export type AdminUserSource =
  | "google"
  | "email"
  | "seeded"
  | "first_review"
  | "other"
  | null;

export type AdminUsersListRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  is_admin: boolean | null;
  created_at: string | null;
  source?: AdminUserSource;
};

function sourcePillClass(source: AdminUserSource): string {
  const base =
    "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold whitespace-nowrap";
  switch (source) {
    case "google":
      return `${base} border-rose-200 bg-rose-50 text-rose-800`;
    case "email":
      return `${base} border-sky-200 bg-sky-50 text-sky-800`;
    case "seeded":
      return `${base} border-amber-200 bg-amber-50 text-amber-900`;
    case "first_review":
      return `${base} border-violet-200 bg-violet-50 text-violet-800`;
    default:
      return `${base} border-neutral-200 bg-neutral-100 text-neutral-700`;
  }
}

function sourceLabel(source: AdminUserSource): string {
  switch (source) {
    case "google":
      return "Google Auth";
    case "email":
      return "Email signup";
    case "seeded":
      return "Seeded";
    case "first_review":
      return "First review email";
    case "other":
      return "Other";
    default:
      return "-";
  }
}

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
              <th className="px-3 py-2 font-medium">Source</th>
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
                  {row.is_admin ? "Yes" : row.is_admin === false ? "No" : "-"}
                </td>
                <td className="whitespace-nowrap px-3 py-2">
                  {row.source ? (
                    <span className={sourcePillClass(row.source)}>
                      {sourceLabel(row.source)}
                    </span>
                  ) : (
                    <span className="text-neutral-400">-</span>
                  )}
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
