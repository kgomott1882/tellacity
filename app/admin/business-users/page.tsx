import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminUsersListTable from "@/components/admin/AdminUsersListTable";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { getBusinessUserRows } from "@/lib/adminUserLists";

export const dynamic = "force-dynamic";

export default async function AdminBusinessUsersPage() {
  await requireAdminSession();

  const { data, error } = await getBusinessUserRows();

  return (
    <div className="space-y-4">
      {error ? <AdminActionMessage type="error" text={error} /> : null}
      <AdminUsersListTable
        title="Business Users"
        rows={data}
        emptyMessage="No business users found."
      />
    </div>
  );
}
