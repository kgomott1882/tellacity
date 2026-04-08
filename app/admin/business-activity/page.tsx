import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import {
  activityActionLabel,
  activityImportance,
  activitySortRank,
  isNoiseActionType,
} from "@/lib/adminActivityFeed";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{
    action_type?: string;
    range?: string;
    business_id?: string;
    page?: string;
  }>;
};

type ActivityLogRow = Record<string, unknown>;

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function startDateForRange(range: string): string | null {
  const now = Date.now();
  if (range === "24h") return new Date(now - 24 * 60 * 60 * 1000).toISOString();
  if (range === "7d") return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  if (range === "30d") return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  return null;
}

function normalizeRange(raw: string | undefined): "all" | "24h" | "7d" | "30d" {
  if (raw === "24h" || raw === "7d" || raw === "30d") return raw;
  return "all";
}

function normalizeActionType(raw: string | undefined): string {
  return raw?.trim() || "";
}

function normalizeBusinessId(raw: string | undefined): string {
  return raw?.trim() || "";
}

function normalizePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function metadataPreview(row: ActivityLogRow): string {
  const raw =
    row.metadata ?? row.meta ?? row.payload ?? row.details ?? row.context ?? row.extra;
  if (raw == null || raw === "") return "—";
  try {
    const s = typeof raw === "string" ? raw : JSON.stringify(raw);
    const t = s.replace(/\s+/g, " ").trim();
    return t.length > 120 ? `${t.slice(0, 117)}…` : t;
  } catch {
    return "—";
  }
}

function userLabel(row: ActivityLogRow): string {
  const uid = row.user_id ?? row.actor_id ?? row.profile_id ?? null;
  if (uid == null || uid === "") return "system";
  return String(uid);
}

function createdAt(row: ActivityLogRow): string | null {
  const v = row.created_at;
  return typeof v === "string" ? v : v != null ? String(v) : null;
}

function businessIdFromLog(row: ActivityLogRow): string | null {
  const v = row.business_id;
  if (v == null || v === "") return null;
  return String(v);
}

export default async function AdminBusinessActivityPage(props: PageProps) {
  const PAGE_SIZE = 20;
  const searchParams = await props.searchParams;
  const selectedRange = normalizeRange(searchParams.range);
  const selectedActionType = normalizeActionType(searchParams.action_type);
  const selectedBusinessId = normalizeBusinessId(searchParams.business_id);
  const requestedPage = normalizePage(searchParams.page);
  const createdAfter = startDateForRange(selectedRange);

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

  let logsQuery = adminSupabase
    .from("business_activity_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(400);

  if (selectedActionType) {
    logsQuery = logsQuery.eq("action_type", selectedActionType);
  }
  if (createdAfter) {
    logsQuery = logsQuery.gte("created_at", createdAfter);
  }
  if (selectedBusinessId) {
    logsQuery = logsQuery.eq("business_id", selectedBusinessId);
  }

  const [{ data: logsData, error: logsError }, { data: filterData, error: filterError }] =
    await Promise.all([
      logsQuery,
      adminSupabase
        .from("business_activity_logs")
        .select("action_type")
        .not("action_type", "is", null)
        .order("action_type", { ascending: true })
        .limit(400),
    ]);

  const actionOptions = Array.from(
    new Set(
      (filterData ?? [])
        .map((r) => r.action_type?.trim() || "")
        .filter((v): v is string => v.length > 0 && !isNoiseActionType(v))
    )
  );

  const rawLogs = (Array.isArray(logsData) ? logsData : []) as ActivityLogRow[];
  const withoutNoise = rawLogs.filter((row) => {
    const at =
      typeof row.action_type === "string"
        ? row.action_type
        : row.action_type != null
          ? String(row.action_type)
          : "";
    return !isNoiseActionType(at);
  });

  let logs: ActivityLogRow[];
  if (selectedActionType) {
    logs = withoutNoise;
  } else {
    logs = [...withoutNoise].sort((a, b) => {
      const aa =
        typeof a.action_type === "string"
          ? a.action_type
          : a.action_type != null
            ? String(a.action_type)
            : "";
      const bb =
        typeof b.action_type === "string"
          ? b.action_type
          : b.action_type != null
            ? String(b.action_type)
            : "";
      const rk = activitySortRank(aa) - activitySortRank(bb);
      if (rk !== 0) return rk;
      const ta = new Date(createdAt(a) ?? 0).getTime();
      const tb = new Date(createdAt(b) ?? 0).getTime();
      return tb - ta;
    });
  }
  const totalLogs = logs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / PAGE_SIZE));
  const currentPage = Math.min(requestedPage, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageLogs = logs.slice(pageStart, pageStart + PAGE_SIZE);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const businessIds = [
    ...new Set(
      pageLogs.map(businessIdFromLog).filter((id): id is string => id != null && id !== "")
    ),
  ];

  let nameByBusinessId = new Map<string, string>();
  if (businessIds.length > 0) {
    const { data: bizRows, error: bizError } = await adminSupabase
      .from("businesses")
      .select("id,name")
      .in("id", businessIds);

    if (bizError) {
      console.error("admin activity feed: businesses lookup", bizError);
    }
    if (bizRows && bizRows.length > 0) {
      nameByBusinessId = new Map(
        bizRows.map((b) => [String(b.id), (b.name as string | null)?.trim() || "—"])
      );
    }
  }

  const listError = logsError?.message ?? filterError?.message ?? null;
  const emptyMessage =
    "No activity yet — events will appear once businesses start using the dashboard.";

  return (
    <div className="space-y-4">
      {listError ? <AdminActionMessage type="error" text={listError} /> : null}

      <AdminTableShell
        title="Activity Feed"
        controls={
          <form method="get" className="flex flex-wrap items-center gap-2">
            <select
              name="action_type"
              defaultValue={selectedActionType}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
            >
              <option value="">All actions</option>
              {actionOptions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>

            <select
              name="range"
              defaultValue={selectedRange}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
            >
              <option value="all">All time</option>
              <option value="24h">Last 24h</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>

            <input
              type="search"
              name="business_id"
              placeholder="Business ID (optional)"
              defaultValue={selectedBusinessId}
              className="min-w-[200px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800 placeholder:text-neutral-400"
            />

            <button
              type="submit"
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50"
            >
              Apply
            </button>
          </form>
        }
      >
        {pageLogs.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message={emptyMessage} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                <tr>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Time</th>
                  <th className="px-3 py-2 font-medium">Business Name</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Impact</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Event</th>
                  <th className="min-w-[140px] px-3 py-2 font-medium">Metadata</th>
                  <th className="px-3 py-2 font-medium">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pageLogs.map((row, idx) => {
                  const bid = businessIdFromLog(row);
                  const name = bid ? (nameByBusinessId.get(bid) ?? "—") : "—";
                  const actionRaw =
                    typeof row.action_type === "string"
                      ? row.action_type
                      : row.action_type != null
                        ? String(row.action_type)
                        : "";
                  const actionLabel = activityActionLabel(actionRaw);
                  const imp = activityImportance(actionRaw);
                  const impactCls =
                    imp === "high"
                      ? "border-rose-200 bg-rose-50 text-rose-900"
                      : imp === "medium"
                        ? "border-amber-200 bg-amber-50 text-amber-900"
                        : "border-neutral-200 bg-neutral-100 text-neutral-600";
                  const impactLabel =
                    imp === "high" ? "High" : imp === "medium" ? "Medium" : "Low";
                  const meta = metadataPreview(row);
                  const user = userLabel(row);
                  const time = createdAt(row);
                  const rowKey =
                    typeof row.id === "string" || typeof row.id === "number"
                      ? String(row.id)
                      : `${time ?? "t"}-${idx}`;

                  return (
                    <tr key={rowKey} className="border-l-2 border-l-neutral-200 bg-white align-top">
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {formatTime(time)}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2 font-medium text-neutral-900" title={name}>
                        {name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span
                          className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${impactCls}`}
                        >
                          {impactLabel}
                        </span>
                      </td>
                      <td
                        className="max-w-[min(18rem,40vw)] px-3 py-2 text-neutral-800"
                        title={actionRaw || undefined}
                      >
                        {actionLabel}
                      </td>
                      <td className="max-w-[min(28rem,50vw)] px-3 py-2 font-mono text-xs text-neutral-600" title={meta}>
                        {meta}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2 font-mono text-xs text-neutral-700" title={user}>
                        {user}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-3 py-3 text-xs text-neutral-600">
              <span>
                Showing {pageStart + 1}-{Math.min(pageStart + PAGE_SIZE, totalLogs)} of {totalLogs}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={`?${new URLSearchParams({
                    action_type: selectedActionType,
                    range: selectedRange,
                    business_id: selectedBusinessId,
                    page: String(Math.max(1, currentPage - 1)),
                  }).toString()}`}
                  aria-disabled={!hasPrev}
                  className={`rounded-md border px-2 py-1 font-medium ${
                    hasPrev
                      ? "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                      : "pointer-events-none border-neutral-100 bg-neutral-50 text-neutral-400"
                  }`}
                >
                  Previous
                </a>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <a
                  href={`?${new URLSearchParams({
                    action_type: selectedActionType,
                    range: selectedRange,
                    business_id: selectedBusinessId,
                    page: String(currentPage + 1),
                  }).toString()}`}
                  aria-disabled={!hasNext}
                  className={`rounded-md border px-2 py-1 font-medium ${
                    hasNext
                      ? "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                      : "pointer-events-none border-neutral-100 bg-neutral-50 text-neutral-400"
                  }`}
                >
                  Next
                </a>
              </div>
            </div>
          </div>
        )}
      </AdminTableShell>
    </div>
  );
}
