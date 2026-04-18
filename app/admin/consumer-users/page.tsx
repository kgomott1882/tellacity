import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminUsersListTable from "@/components/admin/AdminUsersListTable";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { getConsumerUserRows } from "@/lib/adminUserLists";

export const dynamic = "force-dynamic";

export default async function AdminConsumerUsersPage() {
  await requireAdminSession();

  const { data, error } = await getConsumerUserRows();

  return (
    <div className="space-y-4">
      {error ? <AdminActionMessage type="error" text={error} /> : null}
      <AdminUsersListTable
        title="Consumer Users"
        rows={data}
        emptyMessage="No non-business profiles found."
      />
    </div>
  );
}
