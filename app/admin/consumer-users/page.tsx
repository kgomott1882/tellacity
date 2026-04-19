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
      <p className="max-w-3xl text-sm text-neutral-600">
        Everyone in <code className="rounded bg-neutral-100 px-1 text-xs">auth.users</code> who is not in the{" "}
        <strong>Business users</strong> bucket (workspace team or custom-domain auth email), matching the Consumer count on
        Overview.
      </p>
      <AdminUsersListTable
        title="Consumer users"
        rows={data}
        emptyMessage="No consumer accounts found."
      />
    </div>
  );
}
