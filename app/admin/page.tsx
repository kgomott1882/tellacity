import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  getAdminOverviewStats,
  getAdminRecentActivity,
  type AdminRecentActivityItem,
} from "@/lib/admin";
import { getAdminPaymentsDashboard } from "@/lib/adminPayments";
import { enrichAdminRecentActivity } from "@/lib/adminRecentActivityEnrich";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const RECENT_ACTIVITY_PAGE_SIZE = 25;

export const dynamic = "force-dynamic";

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))) return Number(v);
  return 0;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function activityTypeLabel(itemType: string | null | undefined): string {
  const t = String(itemType ?? "").trim().toLowerCase();
  if (t === "review") return "Review submitted";
  if (t === "user") return "User signed up";
  if (t === "business_claim") return "Business claimed";
  if (t === "business") return "Business created";
  return t ? t : "-";
}

function activityPersonCell(row: AdminRecentActivityItem): string {
  const raw = (row.person_name ?? row.name ?? "").trim();
  if (raw) return raw;
  if (row.item_type === "review") return "Guest";
  return "-";
}

function activityBusinessCell(row: AdminRecentActivityItem): string {
  const sub = row.subtitle != null ? String(row.subtitle).trim() : "";
  if (sub && sub !== "-") return sub;
  return "-";
}

const ACTIVITY_REGION_NAMES: Intl.DisplayNames | null =
  typeof Intl !== "undefined" && typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null;

/** Country of the reviewed / created business (`businesses.country_code`); "—" when not applicable. */
function activityCountryCell(row: AdminRecentActivityItem): string {
  const raw = row.country_code != null ? String(row.country_code).trim() : "";
  if (!raw) return "—";
  const upper = raw.toUpperCase();
  try {
    if (ACTIVITY_REGION_NAMES && (upper.length === 2 || upper.length === 3)) {
      const label = ACTIVITY_REGION_NAMES.of(upper);
      if (label) return label;
    }
  } catch {
    /* invalid region codes */
  }
  return upper;
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

  const [statsRes, activityRes, paymentsSnapshot, customerCountRes] = await Promise.all([
    getAdminOverviewStats(supabase),
    getAdminRecentActivity(
      supabase,
      RECENT_ACTIVITY_PAGE_SIZE + 1,
      activityOffset
    ),
    getAdminPaymentsDashboard(),
    adminSupabase
      .from("businesses")
      .select("id", { count: "exact", head: true })
      .not("owner_id", "is", null),
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

  const s = statsRes.data;
  const customerBusinessCount =
    typeof customerCountRes.count === "number" && !Number.isNaN(customerCountRes.count)
      ? customerCountRes.count
      : null;

  return (
    <div className="space-y-8">
      {statsRes.error ? (
        <p className="text-sm text-red-600">Overview stats: {statsRes.error}</p>
      ) : null}
      {recentActivityError ? (
        <p className="text-sm text-red-600">Recent activity: {recentActivityError}</p>
      ) : null}

      {/** Exactly two rows: 5 columns × 2 rows for 10 cards */}
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        <AdminStatCard compact title="All users" value={num(s?.total_users)} />
        <AdminStatCard compact title="Total businesses" value={num(s?.total_businesses)} />
        <AdminStatCard compact title="Total reviews" value={num(s?.total_reviews)} />
        <AdminStatCard
          compact
          title="New users today"
          value={num(s?.new_users_today)}
          href="/admin/new-users-today"
        />
        <AdminStatCard compact title="Reviews today" value={num(s?.reviews_today)} />
        <AdminStatCard compact title="Pending businesses" value={num(s?.pending_businesses)} />
        <AdminStatCard
          compact
          title="Business users"
          value={num(s?.business_users)}
          href="/admin/business-users"
        />
        <AdminStatCard
          compact
          title="Consumer users"
          value={num(s?.consumer_users)}
          href="/admin/consumer-users"
        />
        <AdminStatCard
          compact
          title="Business Customers"
          value={customerBusinessCount != null ? customerBusinessCount : "—"}
          href="/admin/customers"
        />
        <AdminStatCard
          compact
          title="Payments"
          value={paymentsSnapshot.successCountThisMonth}
          href="/admin/payments"
        />
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
                <th className="px-4 py-2 font-medium">Country</th>
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
                    <td className="max-w-[140px] truncate px-4 py-2 text-neutral-700" title={activityCountryCell(row)}>
                      <span className="font-medium">{activityCountryCell(row)}</span>
                    </td>
                    <td className="px-4 py-2 text-neutral-900">
                      <span className="font-medium">
                        {row.email != null && String(row.email).trim() !== ""
                          ? String(row.email).trim()
                          : "-"}
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
