import Link from "next/link";

import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import { formatMinorAsMajor } from "@/lib/adminPayments";
import {
  getAdminTrialsDashboard,
  type AdminTrialOutcome,
  type AdminTrialRow,
} from "@/lib/adminTrials";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams: Promise<{ tab?: string; page?: string }>;
};

function normalizeTab(raw: string | undefined): AdminTrialOutcome {
  const v = raw?.trim().toLowerCase();
  if (v === "expired" || v === "converted") return v;
  return "active";
}

function normalizePage(raw: string | undefined): number {
  const n = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(n) || n < 1) return 1;
  return n;
}

function formatWhen(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-900">
        {value}
      </p>
    </div>
  );
}

function OutcomeBadge({ outcome }: { outcome: AdminTrialOutcome }) {
  const cls =
    outcome === "active"
      ? "border-teal-200 bg-teal-50 text-teal-900"
      : outcome === "converted"
        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
        : "border-neutral-200 bg-neutral-100 text-neutral-700";
  const label =
    outcome === "active"
      ? "On trial"
      : outcome === "converted"
        ? "Converted"
        : "Expired";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${cls}`}
    >
      {label}
    </span>
  );
}

function DaysCell({ row }: { row: AdminTrialRow }) {
  if (row.outcome !== "active") return <span className="text-neutral-400">—</span>;
  const days = row.days_remaining;
  if (days == null) {
    return <span className="text-amber-700">Ended</span>;
  }
  const cls =
    days <= 3
      ? "font-semibold text-red-700"
      : days <= 7
        ? "font-medium text-amber-800"
        : "text-neutral-800";
  return <span className={cls}>{days} day{days === 1 ? "" : "s"}</span>;
}

function Pagination({
  tab,
  currentPage,
  totalPages,
  totalRows,
  pageSize,
}: {
  tab: AdminTrialOutcome;
  currentPage: number;
  totalPages: number;
  totalRows: number;
  pageSize: number;
}) {
  if (totalRows === 0) return null;
  const pageStart = (currentPage - 1) * pageSize;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const params = (page: number) =>
    `?${new URLSearchParams({ tab, page: String(page) }).toString()}`;

  return (
    <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-3 py-3 text-xs text-neutral-600">
      <span>
        Showing {pageStart + 1}–{Math.min(pageStart + pageSize, totalRows)} of{" "}
        {totalRows}
      </span>
      <div className="flex items-center gap-2">
        <Link
          href={params(Math.max(1, currentPage - 1))}
          aria-disabled={!hasPrev}
          className={`rounded-md border px-2 py-1 font-medium ${
            hasPrev
              ? "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
              : "pointer-events-none border-neutral-100 bg-neutral-50 text-neutral-300"
          }`}
        >
          Previous
        </Link>
        <span className="tabular-nums">
          Page {currentPage} of {totalPages}
        </span>
        <Link
          href={params(Math.min(totalPages, currentPage + 1))}
          aria-disabled={!hasNext}
          className={`rounded-md border px-2 py-1 font-medium ${
            hasNext
              ? "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
              : "pointer-events-none border-neutral-100 bg-neutral-50 text-neutral-300"
          }`}
        >
          Next
        </Link>
      </div>
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
        active
          ? "border-neutral-800 bg-neutral-900 text-white"
          : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
      }`}
    >
      {label} ({count})
    </Link>
  );
}

export default async function AdminTrialsPage(props: PageProps) {
  await requireAdminSession();
  const searchParams = await props.searchParams;
  const tab = normalizeTab(searchParams.tab);
  const page = normalizePage(searchParams.page);
  const d = await getAdminTrialsDashboard({ tab, page });

  const tabTitle =
    tab === "active"
      ? "Active 14-day Grow trials"
      : tab === "expired"
        ? "Trials ended (no payment)"
        : "Converted to paid";

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-6">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Grow trials</h1>
          <p className="mt-1 max-w-3xl text-sm text-neutral-600">
            Track 14-day reverse trials on the Grow plan. Active trials show days
            remaining; ended trials stay listed under <strong>Expired</strong> or{" "}
            <strong>Converted</strong> when a successful charge is recorded.
          </p>
        </div>

        {d.warnings.length > 0 ? (
          <div className="space-y-2">
            {d.warnings.map((w) => (
              <AdminActionMessage key={w} type="error" text={w} />
            ))}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <TabLink
            href="?tab=active&page=1"
            active={tab === "active"}
            label="Active"
            count={d.activeCount}
          />
          <TabLink
            href="?tab=expired&page=1"
            active={tab === "expired"}
            label="Expired"
            count={d.expiredCount}
          />
          <TabLink
            href="?tab=converted&page=1"
            active={tab === "converted"}
            label="Converted"
            count={d.convertedCount}
          />
        </div>

        <AdminTableShell title={`${tabTitle} (${d.totalRows} total)`}>
          {d.rows.length === 0 ? (
            <AdminEmptyState
              message={
                tab === "active"
                  ? "No businesses are currently on a Grow trial."
                  : tab === "expired"
                    ? "No expired trials recorded yet."
                    : "No trial-to-paid conversions recorded yet."
              }
            />
          ) : (
            <>
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Business</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Started</th>
                    {tab === "active" ? (
                      <>
                        <th className="px-3 py-2">Ends</th>
                        <th className="px-3 py-2">Days left</th>
                      </>
                    ) : null}
                    {tab === "converted" ? (
                      <>
                        <th className="px-3 py-2">Converted</th>
                        <th className="px-3 py-2">Plan</th>
                        <th className="px-3 py-2">Amount</th>
                      </>
                    ) : null}
                    {tab === "expired" ? (
                      <th className="px-3 py-2">Ended</th>
                    ) : null}
                    <th className="px-3 py-2">Current plan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {d.rows.map((row) => (
                    <tr key={`${row.outcome}-${row.business_id}`} className="bg-white">
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/businesses/${row.business_id}`}
                          className="font-medium text-neutral-900 hover:underline"
                        >
                          {row.business_name?.trim() || "—"}
                        </Link>
                        <div className="text-xs text-neutral-500">
                          {row.business_id}
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <OutcomeBadge outcome={row.outcome} />
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {formatWhen(row.trial_started_at)}
                      </td>
                      {tab === "active" ? (
                        <>
                          <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                            {formatWhen(row.trial_ends_at)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2">
                            <DaysCell row={row} />
                          </td>
                        </>
                      ) : null}
                      {tab === "converted" ? (
                        <>
                          <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                            {formatWhen(row.converted_at)}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-neutral-800">
                            {row.converted_plan ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 tabular-nums text-neutral-800">
                            {row.converted_amount_minor != null &&
                            row.converted_currency
                              ? formatMinorAsMajor(
                                  row.converted_currency,
                                  row.converted_amount_minor,
                                )
                              : "—"}
                          </td>
                        </>
                      ) : null}
                      {tab === "expired" ? (
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                          {formatWhen(row.trial_ends_at)}
                        </td>
                      ) : null}
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                        {row.current_plan?.trim() || "—"}
                        {row.subscription_status ? (
                          <span className="ml-1 text-xs text-neutral-400">
                            ({row.subscription_status})
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination
                tab={tab}
                currentPage={d.currentPage}
                totalPages={d.totalPages}
                totalRows={d.totalRows}
                pageSize={d.pageSize}
              />
            </>
          )}
        </AdminTableShell>
      </div>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:w-72 lg:shrink-0 lg:self-start">
        <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-neutral-900">Trial summary</h2>
          <div className="mt-4 grid grid-cols-1 gap-2">
            <Metric label="Active trials" value={d.activeCount} />
            <Metric label="Ending ≤3 days" value={d.endingWithin3Days} />
            <Metric label="Ending ≤7 days" value={d.endingWithin7Days} />
            <Metric label="Started this month (UTC)" value={d.startedThisMonth} />
            <Metric label="Expired (no payment)" value={d.expiredCount} />
            <Metric label="Converted to paid" value={d.convertedCount} />
          </div>
          <p className="mt-4 text-xs leading-relaxed text-neutral-500">
            Trials are stored on <code className="rounded bg-white px-1">subscriptions</code>{" "}
            with <code className="rounded bg-white px-1">status=trialing</code> and{" "}
            <code className="rounded bg-white px-1">provider_sub_id=trial:…</code>.
            Conversions are detected from successful{" "}
            <code className="rounded bg-white px-1">billing_transactions</code> after a{" "}
            <code className="rounded bg-white px-1">free → grow</code> plan move.
          </p>
        </div>
      </aside>
    </div>
  );
}
