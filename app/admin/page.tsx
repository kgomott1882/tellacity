import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { getAdminOverviewStats, getAdminRecentActivity } from "@/lib/admin";
import { enrichAdminRecentActivity } from "@/lib/adminRecentActivityEnrich";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdminSession();

  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

  const [statsRes, activityRes] = await Promise.all([
    getAdminOverviewStats(supabase),
    getAdminRecentActivity(supabase, 60),
  ]);

  const recentActivityError = activityRes.error;
  const activityRaw = activityRes.data ?? [];
  const activity =
    activityRaw.length > 0
      ? await enrichAdminRecentActivity(adminSupabase, activityRaw)
      : activityRaw;

  const [{ data: businessOwners }, { data: businessMembers }] = await Promise.all([
    adminSupabase.from("businesses").select("owner_id").not("owner_id", "is", null),
    adminSupabase.from("business_members").select("user_id").not("user_id", "is", null),
  ]);

  const businessUserIds = new Set<string>();
  for (const row of businessOwners ?? []) {
    const id = String(row.owner_id ?? "").trim();
    if (id) businessUserIds.add(id);
  }
  for (const row of businessMembers ?? []) {
    const id = String(row.user_id ?? "").trim();
    if (id) businessUserIds.add(id);
  }
  const businessUsersCount = businessUserIds.size;

  const s = statsRes.data;

  return (
    <div className="space-y-8">
      {statsRes.error ? (
        <p className="text-sm text-red-600">Overview stats: {statsRes.error}</p>
      ) : null}
      {recentActivityError ? (
        <p className="text-sm text-red-600">Recent activity: {recentActivityError}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total users" value={num(s?.total_users)} />
        <AdminStatCard title="Total businesses" value={num(s?.total_businesses)} />
        <AdminStatCard title="Total reviews" value={num(s?.total_reviews)} />
        <AdminStatCard title="New users today" value={num(s?.new_users_today)} />
        <AdminStatCard title="Reviews today" value={num(s?.reviews_today)} />
        <AdminStatCard title="Pending businesses" value={num(s?.pending_businesses)} />
        <AdminStatCard title="Unverified reviews" value={num(s?.unverified_reviews)} />
        <AdminStatCard title="Business users" value={businessUsersCount} />
        <AdminStatCard title="Consumer users" value={num(s?.consumer_users)} />
      </div>

      <AdminTableShell title="Recent activity">
        {activity.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message="No recent activity returned." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Type</th>
                <th className="px-4 py-2 font-medium">Business</th>
                <th className="px-4 py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {activity.map((item, i) => {
                const key = `${item.item_type}-${item.item_id}-${item.created_at}-${i}`;
                return (
                  <tr key={key} className="bg-white">
                    <td className="whitespace-nowrap px-4 py-2 text-neutral-600">
                      {formatWhen(item.created_at)}
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{item.title}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{item.subtitle}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{item.email ?? "—"}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </AdminTableShell>
    </div>
  );
}
