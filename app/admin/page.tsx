import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  getAdminOverviewStats,
  getAdminRecentActivity,
  type AdminRecentActivityItem,
} from "@/lib/admin";
import { enrichAdminRecentActivity } from "@/lib/adminRecentActivityEnrich";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const RECENT_ACTIVITY_PAGE_SIZE = 15;

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

function activityTypeLabel(itemType: string | null | undefined): string {
  const t = String(itemType ?? "").trim().toLowerCase();
  if (t === "review") return "Review submitted";
  if (t === "user") return "User signed up";
  if (t === "business") return "Business created";
  return t ? t : "—";
}

function activityPersonCell(row: AdminRecentActivityItem): string {
  const raw = (row.person_name ?? row.name ?? "").trim();
  if (raw) return raw;
  if (row.item_type === "review") return "Guest";
  return "—";
}

function activityBusinessCell(row: AdminRecentActivityItem): string {
  const sub = row.subtitle != null ? String(row.subtitle).trim() : "";
  if (sub && sub !== "—") return sub;
  return "—";
}

function parseActivityPage(raw: string | undefined): number {
  const n = Number.parseInt(String(raw ?? "").trim(), 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

export default async function AdminOverviewPage(props: {
  searchParams?: Promise<{ activityPage?: string }>;
}) {
  const searchParams = props.searchParams ? await props.searchParams : {};
  const activityPage = parseActivityPage(searchParams.activityPage);
  const activityOffset = (activityPage - 1) * RECENT_ACTIVITY_PAGE_SIZE;

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
    getAdminRecentActivity(
      supabase,
      RECENT_ACTIVITY_PAGE_SIZE + 1,
      activityOffset
    ),
  ]);

  const recentActivityError = activityRes.error;
  let rawActivity = activityRes.data ?? [];
  const hasOlderActivity = rawActivity.length > RECENT_ACTIVITY_PAGE_SIZE;
  if (hasOlderActivity) {
    rawActivity = rawActivity.slice(0, RECENT_ACTIVITY_PAGE_SIZE);
  }
  let activity = rawActivity;
  if (!recentActivityError && activity.length > 0) {
    activity = await enrichAdminRecentActivity(adminSupabase, activity);
  }
  const hasNewerPage = activityPage > 1;

  const [
    { data: businessOwners },
    { data: businessMembers },
    authUsersPage,
  ] = await Promise.all([
    adminSupabase.from("businesses").select("owner_id").not("owner_id", "is", null),
    adminSupabase.from("business_members").select("user_id").not("user_id", "is", null),
    adminSupabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
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

  /** Matches Auth dashboard user count (GoTrue `listUsers` pagination total). Falls back to RPC. */
  let totalUsersFromAuth = num(s?.total_users);
  if (!authUsersPage.error && authUsersPage.data) {
    const t = authUsersPage.data.total;
    if (typeof t === "number" && !Number.isNaN(t)) {
      totalUsersFromAuth = t;
    }
  }

  return (
    <div className="space-y-8">
      {statsRes.error ? (
        <p className="text-sm text-red-600">Overview stats: {statsRes.error}</p>
      ) : null}
      {recentActivityError ? (
        <p className="text-sm text-red-600">Recent activity: {recentActivityError}</p>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard title="Total users" value={totalUsersFromAuth} />
        <AdminStatCard title="Total businesses" value={num(s?.total_businesses)} />
        <AdminStatCard title="Total reviews" value={num(s?.total_reviews)} />
        <AdminStatCard title="New users today" value={num(s?.new_users_today)} />
        <AdminStatCard title="Reviews today" value={num(s?.reviews_today)} />
        <AdminStatCard title="Pending businesses" value={num(s?.pending_businesses)} />
        <AdminStatCard title="Business users" value={businessUsersCount} />
        <AdminStatCard title="Consumer users" value={num(s?.consumer_users)} />
      </div>

      <AdminTableShell title="Recent Activity">
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
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">Business</th>
                <th className="px-4 py-2 font-medium">Email</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {activity.map((row, i) => {
                const key = `${row.item_type}-${row.created_at}-${i}`;
                return (
                  <tr key={key} className="bg-white">
                    <td className="whitespace-nowrap px-4 py-2 text-neutral-600">
                      {formatWhen(row.created_at)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-neutral-900">
                      <span className="font-medium">
                        {activityTypeLabel(row.item_type)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{activityPersonCell(row)}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">{activityBusinessCell(row)}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">
                        {row.email != null && String(row.email).trim() !== ""
                          ? String(row.email).trim()
                          : "—"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!recentActivityError && (activity.length > 0 || activityPage > 1) ? (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 bg-neutral-50/80 px-4 py-3 text-sm">
            <span className="text-neutral-600">
              Page {activityPage}
              {activity.length > 0
                ? ` · ${RECENT_ACTIVITY_PAGE_SIZE} per page`
                : ""}
            </span>
            <div className="flex gap-2">
              {hasNewerPage ? (
                <Link
                  href={
                    activityPage <= 2
                      ? "/admin"
                      : `/admin?activityPage=${activityPage - 1}`
                  }
                  className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
                >
                  Previous
                </Link>
              ) : (
                <span
                  className="cursor-not-allowed rounded-md border border-neutral-100 bg-neutral-100 px-3 py-1.5 font-medium text-neutral-400"
                  aria-disabled="true"
                >
                  Previous
                </span>
              )}
              {hasOlderActivity ? (
                <Link
                  href={`/admin?activityPage=${activityPage + 1}`}
                  className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 font-medium text-neutral-800 shadow-sm transition hover:bg-neutral-50"
                >
                  Next
                </Link>
              ) : (
                <span
                  className="cursor-not-allowed rounded-md border border-neutral-100 bg-neutral-100 px-3 py-1.5 font-medium text-neutral-400"
                  aria-disabled="true"
                >
                  Next
                </span>
              )}
            </div>
          </div>
        ) : null}
      </AdminTableShell>
    </div>
  );
}
