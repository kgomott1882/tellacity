import AdminCategoriesClient from "@/components/admin/AdminCategoriesClient";

export const dynamic = "force-dynamic";

export default function AdminCategoriesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-neutral-900">Categories</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Business counts per catalog category. Filter by country, group, or subcategory to plan seeding.
        </p>
      </div>
      <AdminCategoriesClient />
    </div>
  );
}
