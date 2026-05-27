import AdminBusinessesByCountryPanel from "@/components/admin/AdminBusinessesByCountryPanel";
import AdminCategoriesClient from "@/components/admin/AdminCategoriesClient";

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Categories</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Browse category groups as cards with business and review totals per subcategory. Use country, group,
          and subcategory filters above, the same filters apply to the grid and the detailed table below.
        </p>
      </div>
      <AdminBusinessesByCountryPanel />
      <AdminCategoriesClient />
    </div>
  );
}
