import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminCustomersTable from "@/components/admin/AdminCustomersTable";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import AdminTopRecentActivityPanel from "@/components/admin/AdminTopRecentActivityPanel";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  emptyAdminCustomerMetrics,
  loadAdminCustomerMetricsMap,
} from "@/lib/adminCustomerMetrics";
import { loadPublishedReviewCountByBusinessIdMap } from "@/lib/adminPublishedReviewCounts";
import { loadAdminTopRecentBusinessActivity } from "@/lib/adminTopRecentBusinessActivity";

export const dynamic = "force-dynamic";

type CustomerBusinessRow = {
  id: string;
  name: string | null;
  website: string | null;
  status: string | null;
  created_at: string | null;
  owner_id: string | null;
  review_count: number | null;
  subscriptions?:
    | {
        plan_code?: string | null;
      }
    | Array<{
        plan_code?: string | null;
      }>
    | null;
  profiles:
    | {
        email?: string | null;
        display_name?: string | null;
      }
    | Array<{
        email?: string | null;
        display_name?: string | null;
      }>
    | null;
};

export default async function AdminCustomerBusinessesPage() {
  const { supabase } = await requireAdminSession();

  const { data, error } = await supabase
    .from("businesses")
    .select(`
      id,
      name,
      website,
      status,
      created_at,
      owner_id,
      review_count,
      subscriptions (
        plan_code
      ),
      profiles!businesses_owner_id_fkey (
        email,
        display_name
      )
    `)
    .not("owner_id", "is", null)
    .order("created_at", { ascending: false });

  const listError = error?.message ?? null;
  const rawRows = (Array.isArray(data) ? data : []) as CustomerBusinessRow[];

  const publishedReviewByBusiness = await loadPublishedReviewCountByBusinessIdMap(
    supabase,
    rawRows.map((b) => b.id),
  );

  const customers = rawRows.map((b) => {
    const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles;
    const subscription = Array.isArray(b.subscriptions)
      ? b.subscriptions[0]
      : b.subscriptions;
    const planCode = subscription?.plan_code?.trim() || "free";
    const reviewCount =
      publishedReviewByBusiness.get(b.id) ??
      (Number(b.review_count) || 0);
    return {
      id: b.id,
      name: b.name,
      website: b.website,
      status: b.status,
      created_at: b.created_at,
      review_count: reviewCount,
      plan_code: planCode,
      owner_email: profile?.email ?? "-",
      owner_name: profile?.display_name?.trim() || profile?.email || "-",
    };
  });

  const [metricsMap, topRecent] = await Promise.all([
    loadAdminCustomerMetricsMap(
      rawRows.map((b) => ({
        id: b.id,
        owner_id: b.owner_id,
        created_at: b.created_at,
      })),
    ),
    loadAdminTopRecentBusinessActivity(supabase, 15),
  ]);

  const tableRows = customers.map((c) => ({
    ...c,
    metrics: metricsMap.get(c.id) ?? emptyAdminCustomerMetrics(),
  }));

  return (
    <div className="space-y-4">
      {listError ? <AdminActionMessage type="error" text={listError} /> : null}

      <AdminTopRecentActivityPanel
        rows={topRecent.rows}
        error={topRecent.error}
      />

      <AdminTableShell
        title={`Business Customers (${customers?.length || 0})`}
      >
        <div className="w-full">
          {customers.length === 0 ? (
            <div className="p-4">
              <AdminEmptyState message="No customer businesses yet" />
            </div>
          ) : (
            <AdminCustomersTable rows={tableRows} />
          )}
        </div>
      </AdminTableShell>
    </div>
  );
}
