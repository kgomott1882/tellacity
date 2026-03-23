import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminBusinessesTable from "@/components/admin/AdminBusinessesTable";

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
      <AdminBusinessesTable />
    </div>
  );
}
