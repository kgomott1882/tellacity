import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminBusinessesTable from "@/components/admin/AdminBusinessesTable";
import AdminManualBusinessLauncher from "@/components/admin/AdminManualBusinessLauncher";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ e?: string }>;
};

export default async function AdminBusinessesPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const err = searchParams.e;

  return (
    <div className="space-y-4">
      {err ? <AdminActionMessage type="error" text={err} /> : null}
      <div className="flex justify-end">
        <AdminManualBusinessLauncher />
      </div>
      <AdminBusinessesTable />
    </div>
  );
}
