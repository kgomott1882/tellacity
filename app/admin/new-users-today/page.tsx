import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminUsersListTable from "@/components/admin/AdminUsersListTable";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { getNewUsersTodayRows } from "@/lib/adminUserLists";

export const dynamic = "force-dynamic";

export default async function AdminNewUsersTodayPage() {
  await requireAdminSession();

  const { data, error } = await getNewUsersTodayRows();

  return (
    <div className="space-y-4">
      {error ? <AdminActionMessage type="error" text={error} /> : null}
      <AdminUsersListTable
        title="New Users Today"
        rows={data}
        emptyMessage="No new users found for the current UTC date."
      />
    </div>
  );
}
