import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  getAdminOverviewStats,
  getAdminRecentActivity,
  type AdminActivityRow,
} from "@/lib/admin";

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}

function activityLabel(row: AdminActivityRow): string {
  if (row.description && String(row.description).trim()) return String(row.description);
  if (row.message && String(row.message).trim()) return String(row.message);
  if (row.summary && String(row.summary).trim()) return String(row.summary);
  if (row.event_type && String(row.event_type).trim()) return String(row.event_type);
  return "Event";
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

export default async function AdminOverviewPage() {
  const { supabase } = await requireAdminSession();

  const [statsRes, activityRes] = await Promise.all([
    getAdminOverviewStats(supabase),
    getAdminRecentActivity(supabase, 20),
  ]);

  const s = statsRes.data;

  return (
    <div className="space-y-8">
      {statsRes.error ? (
        <p className="text-sm text-red-600">Overview stats: {statsRes.error}</p>
      ) : null}
      {activityRes.error ? (
        <p className="text-sm text-red-600">Recent activity: {activityRes.error}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total users" value={num(s?.total_users)} />
        <AdminStatCard title="Total businesses" value={num(s?.total_businesses)} />
        <AdminStatCard title="Total reviews" value={num(s?.total_reviews)} />
        <AdminStatCard title="New users today" value={num(s?.new_users_today)} />
        <AdminStatCard title="Reviews today" value={num(s?.reviews_today)} />
        <AdminStatCard title="Pending businesses" value={num(s?.pending_businesses)} />
        <AdminStatCard title="Unverified reviews" value={num(s?.unverified_reviews)} />
        <AdminStatCard title="Business users" value={num(s?.business_users)} />
        <AdminStatCard title="Consumer users" value={num(s?.consumer_users)} />
      </div>

      <AdminTableShell title="Recent activity">
        {activityRes.data.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message="No recent activity returned." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-4 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {activityRes.data.map((row, i) => {
                const key = row.id ?? `activity-${i}`;
                return (
                  <tr key={key} className="bg-white">
                    <td className="whitespace-nowrap px-4 py-2 text-neutral-600">
                      {formatWhen(row.created_at)}
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{activityLabel(row)}</span>
                      {row.actor_email ? (
                        <span className="mt-0.5 block text-xs text-neutral-500">
                          {row.actor_email}
                        </span>
                      ) : null}
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
