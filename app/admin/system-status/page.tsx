import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminStatCard from "@/components/admin/AdminStatCard";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { getServerEnv } from "@/lib/serverEnv";
import { createClient } from "@supabase/supabase-js";
import RunSystemChecksButton from "./RunSystemChecksButton";

export const dynamic = "force-dynamic";

type SystemCheckRow = {
  check_name: string;
  check_group: string | null;
  status: string;
  response_time_ms: number | null;
  message: string | null;
  created_at: string;
};

type SystemIncidentRow = {
  id: string;
  check_name: string;
  check_group: string | null;
  started_at: string;
  fail_count: number | null;
  last_error_message: string | null;
  first_error_message: string | null;
  status: string;
};

type TimelineCheckRow = {
  check_name: string;
  check_group: string | null;
  status: string;
  created_at: string;
  response_time_ms: number | null;
  message: string | null;
};

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

/** Compact timestamp for dense tables. */
function formatWhenShort(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function latestCheckPerName(rows: SystemCheckRow[]): SystemCheckRow[] {
  const map = new Map<string, SystemCheckRow>();
  for (const r of rows) {
    const name = String(r.check_name ?? "").trim();
    if (!name) continue;
    if (!map.has(name)) map.set(name, r);
  }
  return [...map.values()].sort((a, b) => {
    const ga = String(a.check_group ?? "").toLowerCase();
    const gb = String(b.check_group ?? "").toLowerCase();
    if (ga !== gb) return ga.localeCompare(gb);
    return String(a.check_name).localeCompare(String(b.check_name));
  });
}

function statusBadge(status: string, compact?: boolean) {
  const s = String(status ?? "").trim().toLowerCase();
  const cls = compact
    ? "rounded-md px-1.5 py-0.5 text-xs font-semibold leading-tight"
    : "rounded-md px-2 py-0.5 text-sm font-semibold";
  if (s === "ok") {
    return (
      <span className={`inline-flex bg-emerald-100 text-emerald-800 ${cls}`}>ok</span>
    );
  }
  if (s === "fail") {
    return (
      <span className={`inline-flex bg-red-100 text-red-800 ${cls}`}>fail</span>
    );
  }
  return (
    <span className={`inline-flex bg-amber-100 text-amber-900 ${cls}`}>{s || "-"}</span>
  );
}

function timelineDotTitle(row: TimelineCheckRow): string {
  const ts = formatWhen(row.created_at);
  const ms =
    row.response_time_ms != null && Number.isFinite(Number(row.response_time_ms))
      ? `${row.response_time_ms} ms`
      : "-";
  const msg = (row.message ?? "").trim() || "-";
  return `When: ${ts}\nResponse: ${ms}\nMessage: ${msg}`;
}

function timelineDotClass(status: string): string {
  const s = String(status ?? "").trim().toLowerCase();
  if (s === "ok") return "bg-emerald-500 ring-emerald-100 hover:bg-emerald-600";
  if (s === "fail") return "bg-red-500 ring-red-100 hover:bg-red-600";
  return "bg-amber-400 ring-amber-100 hover:bg-amber-500";
}

const TIMELINE_SLICE = 48;

/** Last N per check_name (newest first in DB slice), displayed oldest → newest (left → right). */
function groupChecksForTimeline(rows: TimelineCheckRow[]): {
  check_name: string;
  check_group: string | null;
  points: TimelineCheckRow[];
}[] {
  const map = new Map<string, TimelineCheckRow[]>();
  for (const r of rows) {
    const name = String(r.check_name ?? "").trim();
    if (!name) continue;
    if (!map.has(name)) map.set(name, []);
    map.get(name)!.push(r);
  }
  const out: { check_name: string; check_group: string | null; points: TimelineCheckRow[] }[] = [];
  for (const [check_name, list] of map) {
    list.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return tb - ta;
    });
    const newestSlice = list.slice(0, TIMELINE_SLICE);
    newestSlice.sort((a, b) => {
      const ta = new Date(a.created_at).getTime();
      const tb = new Date(b.created_at).getTime();
      return ta - tb;
    });
    const check_group = newestSlice[newestSlice.length - 1]?.check_group ?? list[0]?.check_group ?? null;
    out.push({ check_name, check_group, points: newestSlice });
  }
  return out.sort((a, b) => {
    const ga = String(a.check_group ?? "").toLowerCase();
    const gb = String(b.check_group ?? "").toLowerCase();
    if (ga !== gb) return ga.localeCompare(gb);
    return a.check_name.localeCompare(b.check_name);
  });
}

export default async function AdminSystemStatusPage() {
  await requireAdminSession();

  const { supabaseUrl, serviceRoleKey } = getServerEnv();
  const adminDb = createClient<any>(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });

  const [checksRes, incidentsRes, timelineRes] = await Promise.all([
    adminDb
      .from("system_checks")
      .select("check_name, check_group, status, response_time_ms, message, created_at")
      .order("created_at", { ascending: false })
      .limit(2000),
    adminDb
      .from("system_incidents")
      .select(
        "id, check_name, check_group, started_at, fail_count, last_error_message, first_error_message, status",
      )
      .eq("status", "ongoing")
      .order("started_at", { ascending: false }),
    adminDb
      .from("system_checks")
      .select("check_name, check_group, status, created_at, response_time_ms, message")
      .order("created_at", { ascending: false })
      .limit(2500),
  ]);

  const checksError = checksRes.error?.message ?? null;
  const incidentsError = incidentsRes.error?.message ?? null;
  const rawChecks = (checksRes.data ?? []) as SystemCheckRow[];
  const latestChecks = latestCheckPerName(rawChecks);
  const incidents = (incidentsRes.data ?? []) as SystemIncidentRow[];
  const timelineError = timelineRes.error?.message ?? null;
  const timelines = groupChecksForTimeline((timelineRes.data ?? []) as TimelineCheckRow[]);
  const timelinePointsByCheckName = new Map(
    timelines.map((t) => [t.check_name, t.points] as const),
  );

  const totalChecks = latestChecks.length;
  const healthy = latestChecks.filter((r) => String(r.status).toLowerCase() === "ok").length;
  const failing = latestChecks.filter((r) => String(r.status).toLowerCase() === "fail").length;
  const activeIncidents = incidents.length;

  const allHealthy = failing === 0 && totalChecks > 0;

  return (
    <div className="space-y-6">
      <div
        className={`rounded-lg border px-4 py-3 text-sm ${
          totalChecks === 0
            ? "border-neutral-200 bg-neutral-50 text-neutral-700"
            : allHealthy
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-900"
        }`}
        role="status"
      >
        {totalChecks === 0 ? (
          <span>No checks recorded yet. Use “Run all checks now” to seed history.</span>
        ) : allHealthy ? (
          <span className="font-medium">All monitored flows passed on the latest run.</span>
        ) : (
          <span className="font-medium">
            {failing} of {totalChecks} checks failing on the latest run, see the list below.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-semibold tracking-tight text-neutral-900">System status</h1>
          <p className="mt-1 text-sm leading-snug text-neutral-600">
            Latest result per check, with run history (older left, newer right).
          </p>
        </div>
        <div className="shrink-0 sm:pt-0.5">
          <RunSystemChecksButton />
        </div>
      </div>

      {checksError ? (
        <p className="text-sm text-red-600">Could not load system_checks: {checksError}</p>
      ) : null}
      {incidentsError ? (
        <p className="text-sm text-red-600">Could not load system_incidents: {incidentsError}</p>
      ) : null}

      <div>
        <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 sm:text-sm">
          Summary
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <AdminStatCard compact title="Total checks" value={totalChecks} />
          <AdminStatCard compact title="Healthy" value={healthy} />
          <AdminStatCard compact title="Failing" value={failing} />
          <AdminStatCard compact title="Active incidents" value={activeIncidents} />
        </div>
        <p className="mt-2 text-sm text-neutral-500">
          <span className="font-medium text-emerald-700">Green</span> = ok ·{" "}
          <span className="font-medium text-red-700">Red</span> = fail ·{" "}
          <span className="font-medium text-amber-800">Yellow</span> = warning (reserved)
        </p>
      </div>

      <AdminTableShell title="Check status & history">
        {latestChecks.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message="No system_checks yet." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-0 text-left text-sm text-neutral-800 lg:min-w-[720px]">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-600">
                <tr>
                  <th className="px-3 py-2 font-medium">Group</th>
                  <th className="px-3 py-2 font-medium">Check</th>
                  <th className="px-3 py-2 font-medium">Latest</th>
                  <th className="min-w-[160px] px-3 py-2 font-medium">Message</th>
                  <th className="whitespace-nowrap px-3 py-2 font-medium">Last run</th>
                  <th className="min-w-[220px] px-3 py-2 font-medium">
                    History{" "}
                    <span className="block font-normal normal-case text-neutral-500 sm:inline sm:pl-1">
                      (older ← newer)
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {latestChecks.map((row) => {
                  const points = timelinePointsByCheckName.get(row.check_name) ?? [];
                  return (
                    <tr key={row.check_name} className="bg-white align-top">
                      <td className="whitespace-nowrap px-3 py-2 text-xs text-neutral-600">
                        {row.check_group?.trim() ? row.check_group : "-"}
                      </td>
                      <td className="max-w-[min(42vw,280px)] px-3 py-2 font-mono text-xs font-medium leading-snug text-neutral-900 lg:max-w-[320px]">
                        <span className="break-all">{row.check_name}</span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">
                        <div className="flex flex-col items-start gap-1">
                          {statusBadge(row.status, true)}
                          <span className="tabular-nums text-xs text-neutral-500">
                            {row.response_time_ms != null ? `${row.response_time_ms} ms` : "-"}
                          </span>
                        </div>
                      </td>
                      <td className="max-w-[min(40vw,380px)] px-3 py-2 text-sm leading-snug text-neutral-700">
                        <span className="line-clamp-2" title={row.message ?? ""}>
                          {row.message?.trim() ? row.message : "-"}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-xs tabular-nums text-neutral-600">
                        <span title={formatWhen(row.created_at)}>{formatWhenShort(row.created_at)}</span>
                      </td>
                      <td className="px-3 py-2">
                        {points.length === 0 ? (
                          <span className="text-xs text-neutral-400">-</span>
                        ) : (
                          <div className="flex flex-col gap-1">
                            <div className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                              Last {points.length}
                            </div>
                            <div
                              className="flex min-h-[22px] max-w-xl items-center gap-0.5 overflow-x-auto pb-0.5"
                              role="list"
                              aria-label={`Last ${points.length} runs for ${row.check_name}`}
                            >
                              {points.map((p, i) => (
                                <span
                                  key={`${p.created_at}-${i}`}
                                  role="listitem"
                                  title={timelineDotTitle(p)}
                                  className={`inline-block h-3 w-0.5 shrink-0 cursor-default rounded-sm ring-1 ring-offset-0 ring-offset-white ${timelineDotClass(
                                    p.status,
                                  )}`}
                                />
                              ))}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </AdminTableShell>

      <AdminTableShell title="Ongoing incidents">
        {incidents.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message="No ongoing incidents." />
          </div>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-semibold uppercase tracking-wide text-neutral-600">
              <tr>
                <th className="px-3 py-2 font-medium">Check</th>
                <th className="px-3 py-2 font-medium">Started</th>
                <th className="px-3 py-2 font-medium">Fail count</th>
                <th className="px-3 py-2 font-medium">Last error</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {incidents.map((inc) => (
                <tr key={inc.id} className="bg-white">
                  <td className="px-3 py-2 font-mono text-xs font-medium text-neutral-900">
                    {inc.check_name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-xs text-neutral-600">
                    {formatWhenShort(inc.started_at)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-sm text-neutral-800">
                    {inc.fail_count != null ? inc.fail_count : "-"}
                  </td>
                  <td className="max-w-lg px-3 py-2 text-sm text-neutral-800">
                    <span className="line-clamp-2" title={inc.last_error_message ?? ""}>
                      {inc.last_error_message?.trim() ? inc.last_error_message : "-"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </AdminTableShell>

      {timelineError ? (
        <p className="text-xs text-red-600">Could not load check history slice: {timelineError}</p>
      ) : null}
    </div>
  );
}
