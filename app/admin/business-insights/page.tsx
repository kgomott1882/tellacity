import Link from "next/link";

import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { COUNTRIES } from "@/lib/adminCountries";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    plan?: string;
    activity?: string;
    country?: string;
  }>;
};

type InsightRow = {
  /** View uses business_id in SQL; some clients expose id — we normalize to `id`. */
  id: string;
  name: string | null;
  plan: string | null;
  country_code: string | null;
  total_invites: number | null;
  total_reviews: number | null;
  last_activity: string | null;
  last_invite: string | null;
  last_review: string | null;
};

const PLANS = ["free", "grow", "premium", "elite"] as const;

type ActivityFilter = "all" | "active" | "at_risk" | "dead";

function normalizePlan(raw: string | undefined): (typeof PLANS)[number] | "" {
  const v = raw?.trim().toLowerCase();
  if (v === "free" || v === "grow" || v === "premium" || v === "elite") return v;
  return "";
}

function normalizeActivity(raw: string | undefined): ActivityFilter {
  const v = raw?.trim().toLowerCase();
  if (v === "active" || v === "at_risk" || v === "dead") return v;
  return "all";
}

function normalizeCountry(raw: string | undefined): string {
  return raw?.trim().toUpperCase() || "";
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function daysBetween(now: number, iso: string | null | undefined): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  return (now - t) / (24 * 60 * 60 * 1000);
}

function activityStatusFromLastActivity(
  lastActivity: string | null,
  now: number
): "Active" | "At Risk" | "Dead" {
  const days = daysBetween(now, lastActivity);
  if (days == null) return "Dead";
  if (days < 3) return "Active";
  if (days <= 14) return "At Risk";
  return "Dead";
}

function matchesActivityFilter(
  row: InsightRow,
  filter: ActivityFilter,
  now: number
): boolean {
  if (filter === "all") return true;
  const status = activityStatusFromLastActivity(row.last_activity, now);
  if (filter === "active") return status === "Active";
  if (filter === "at_risk") return status === "At Risk";
  if (filter === "dead") return status === "Dead";
  return true;
}

function conversionRate(reviews: number, invites: number): string {
  if (invites <= 0) return "—";
  return `${((reviews / invites) * 100).toFixed(1)}%`;
}

export default async function AdminBusinessInsightsPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const planFilter = normalizePlan(searchParams.plan);
  const activityFilter = normalizeActivity(searchParams.activity);
  const countryFilter = normalizeCountry(searchParams.country);

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

  let q = adminSupabase
    .from("admin_business_insights")
    .select("*")
    .order("last_activity", { ascending: false, nullsFirst: false })
    .limit(400);

  if (planFilter) {
    q = q.eq("plan", planFilter);
  }
  if (countryFilter) {
    q = q.eq("country_code", countryFilter);
  }

  const { data, error } = await q;

  console.log("INSIGHTS DATA:", data);

  const now = Date.now();
  const rawRows = (Array.isArray(data) ? data : []) as Record<string, unknown>[];

  const mapped: InsightRow[] = rawRows.map((r) => {
    const id = String(r.id ?? r.business_id ?? "").trim();
    return {
      id,
      name: (r.name as string | null) ?? null,
      plan: (r.plan as string | null) ?? null,
      country_code: (r.country_code as string | null) ?? null,
      total_invites: typeof r.total_invites === "number" ? r.total_invites : Number(r.total_invites ?? 0),
      total_reviews: typeof r.total_reviews === "number" ? r.total_reviews : Number(r.total_reviews ?? 0),
      last_activity: (r.last_activity as string | null) ?? null,
      last_invite: (r.last_invite as string | null) ?? null,
      last_review: (r.last_review as string | null) ?? null,
    };
  });

  const afterActivity = mapped.filter((row) => matchesActivityFilter(row, activityFilter, now));
  const filtered = afterActivity.slice(0, 100);

  const hasFilters =
    Boolean(planFilter || countryFilter) || activityFilter !== "all";
  const emptyMessage =
    filtered.length === 0 && (mapped.length > 0 || hasFilters)
      ? "No businesses match your filters."
      : "No businesses found.";

  return (
    <div className="space-y-4">
      {error ? <AdminActionMessage type="error" text={error.message} /> : null}

      <AdminTableShell
        title="Business Insights"
        controls={
          <form method="get" className="flex flex-wrap items-center gap-2">
            <select
              name="plan"
              defaultValue={planFilter}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
            >
              <option value="">All plans</option>
              {PLANS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>

            <select
              name="activity"
              defaultValue={activityFilter}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
            >
              <option value="all">All activity</option>
              <option value="active">Active (under 3 days)</option>
              <option value="at_risk">At risk (3–14 days)</option>
              <option value="dead">Dead (over 14 days)</option>
            </select>

            <select
              name="country"
              defaultValue={countryFilter}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code === "ALL" ? "" : c.code}>
                  {c.label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Apply
            </button>
          </form>
        }
      >
        {filtered.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message={emptyMessage} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Business Name</th>
                  <th className="px-3 py-2 font-medium">Plan</th>
                  <th className="px-3 py-2 font-medium">Total Invites</th>
                  <th className="px-3 py-2 font-medium">Total Reviews</th>
                  <th className="px-3 py-2 font-medium">Conversion</th>
                  <th className="px-3 py-2 font-medium">Activity</th>
                  <th className="px-3 py-2 font-medium">Last Activity</th>
                  <th className="px-3 py-2 font-medium">Last Invite</th>
                  <th className="px-3 py-2 font-medium">Last Review</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map((row) => {
                  const invites = row.total_invites ?? 0;
                  const reviews = row.total_reviews ?? 0;
                  const status = activityStatusFromLastActivity(row.last_activity, now);
                  const statusCls =
                    status === "Active"
                      ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                      : status === "At Risk"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-neutral-200 bg-neutral-100 text-neutral-700";

                  return (
                    <tr key={row.id} className="bg-white align-top">
                      <td className="max-w-[200px] truncate px-3 py-2 font-medium text-neutral-900" title={row.name ?? "—"}>
                        {row.name?.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                        {row.plan?.trim() || "—"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-700">{invites}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-700">{reviews}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                        {conversionRate(reviews, invites)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${statusCls}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {formatDate(row.last_activity)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {formatDate(row.last_invite)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {formatDate(row.last_review)}
                      </td>
                      <td className="px-3 py-2">
                        <div className="flex flex-col gap-1 sm:flex-row sm:flex-wrap">
                          <Link
                            href={`/admin/businesses/${row.id}`}
                            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-center text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                          >
                            View Business
                          </Link>
                          <Link
                            href="/admin/reviews"
                            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-center text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                          >
                            View Reviews
                          </Link>
                          <Link
                            href="/business/dashboard/get-reviews/overview"
                            className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-center text-xs font-medium text-neutral-800 hover:bg-neutral-50"
                          >
                            View Invites
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableShell>
    </div>
  );
}
