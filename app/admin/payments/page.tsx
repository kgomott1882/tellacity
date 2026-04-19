import Link from "next/link";

import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminTableShell from "@/components/admin/AdminTableShell";
import { requireAdminSession } from "@/components/admin/RequireAdmin";
import {
  formatMinorAsMajor,
  getAdminPaymentsDashboard,
  type AdminPaymentsDashboard,
} from "@/lib/adminPayments";

export const dynamic = "force-dynamic";

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums text-neutral-900">{value}</p>
    </div>
  );
}

function RevenueSidebar({
  monthLabel,
  totalsByCurrencyMinor,
  successCountThisMonth,
  paidBusinessCountThisMonth,
  activePaidSubscriptionCount,
  renewalsEndingWithin14dCount,
  upgradesToPaidThisMonth,
  downgradesToFreeThisMonth,
  webhookNonSuccessThisMonth,
}: AdminPaymentsDashboard) {
  const currencyLines = Object.entries(totalsByCurrencyMinor);
  return (
    <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
      <div className="rounded-xl border border-neutral-200 bg-neutral-50/80 p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-neutral-900">Revenue performance</h2>
        <p className="mt-1 text-xs text-neutral-500">
          Month <span className="font-medium text-neutral-700">{monthLabel}</span>
        </p>
        <div className="mt-4 grid grid-cols-1 gap-2">
          <Metric label="Successful charges (count)" value={successCountThisMonth} />
          <Metric label="Workspaces billed (distinct)" value={paidBusinessCountThisMonth} />
          <Metric label="Active paid subscriptions" value={activePaidSubscriptionCount} />
          <Metric label="Renewals ending ≤14d" value={renewalsEndingWithin14dCount} />
          <Metric label="Upgrades to paid (plan moves)" value={upgradesToPaidThisMonth.length} />
          <Metric label="Downgrades to free (plan moves)" value={downgradesToFreeThisMonth.length} />
          {webhookNonSuccessThisMonth != null ? (
            <Metric
              label="Paystack webhooks ≠ success"
              value={webhookNonSuccessThisMonth}
            />
          ) : null}
        </div>
        <div className="mt-4 border-t border-neutral-200 pt-3">
          <p className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">Gross (ledger)</p>
          {currencyLines.length === 0 ? (
            <p className="mt-1 text-xs text-neutral-500">No successful charges in period.</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm font-medium text-neutral-800">
              {currencyLines.map(([cur, minor]) => (
                <li key={cur} className="tabular-nums">
                  {formatMinorAsMajor(cur, minor)}
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-neutral-500">
          Successful charges come from <code className="rounded bg-white px-1">billing_transactions</code> with status{" "}
          <code className="rounded bg-white px-1">success</code>. Workspaces with an active paid plan but no successful
          charge this month may be on <strong>annual</strong> billing, <strong>dashboard</strong> grants, or renewal
          later in the month.
        </p>
      </div>
    </aside>
  );
}

export default async function AdminPaymentsPage() {
  await requireAdminSession();
  const d = await getAdminPaymentsDashboard();

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-8">
        <div>
          <h1 className="text-lg font-semibold text-neutral-900">Payments</h1>
          <p className="mt-1 max-w-3xl text-sm text-neutral-600">
            Provider ledger and subscription signals for the <strong>current UTC month</strong>. Use this to see who
            paid, who has no successful charge logged this month, and plan movement for conversion/churn hints.
          </p>
        </div>

        {d.warnings.length > 0 ? (
          <div className="space-y-2">
            {d.warnings.map((w) => (
              <AdminActionMessage key={w} type="error" text={w} />
            ))}
          </div>
        ) : null}

        <AdminTableShell title={`Billing ledger this month (${d.transactionsThisMonth.length} rows)`}>
          {d.transactionsThisMonth.length === 0 ? (
            <div className="p-4 text-sm text-neutral-600">No billing_transactions in this UTC month.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Business</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {d.transactionsThisMonth.map((row) => (
                    <tr key={`${row.reference}-${row.created_at}`} className="bg-white">
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <span className="font-medium text-neutral-900">
                          {row.business_name?.trim() || "—"}
                        </span>
                        <div className="text-xs text-neutral-500">{row.business_id}</div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-800">{row.plan_code}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums text-neutral-800">
                        {formatMinorAsMajor(row.currency, row.amount_minor)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-700">{row.status}</td>
                      <td className="max-w-[200px] truncate px-3 py-2 font-mono text-xs text-neutral-600" title={row.reference}>
                        {row.reference}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminTableShell>

        <AdminTableShell
          title={`Paid workspaces — no successful charge this month (${d.paidActiveNoSuccessTxThisMonth.length} shown)`}
        >
          {d.paidActiveNoSuccessTxThisMonth.length === 0 ? (
            <div className="p-4 text-sm text-neutral-600">
              Every active paid subscription has at least one successful transaction this month, or there are no paid
              subscriptions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">Business</th>
                    <th className="px-3 py-2">Plan</th>
                    <th className="px-3 py-2">Provider</th>
                    <th className="px-3 py-2">Period end</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {d.paidActiveNoSuccessTxThisMonth.map((row) => (
                    <tr key={row.business_id} className="bg-white">
                      <td className="px-3 py-2">
                        <Link
                          href={`/admin/businesses/${row.business_id}`}
                          className="font-medium text-[#1FAF9E] hover:underline"
                        >
                          {row.business_name?.trim() || row.business_id}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2">{row.plan_code}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">{row.provider ?? "—"}</td>
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {row.current_period_end ? new Date(row.current_period_end).toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminTableShell>

        <AdminTableShell title="Paystack webhook events (non–charge.success, sample)">
          {d.webhookNonSuccessSample.length === 0 ? (
            <div className="p-4 text-sm text-neutral-600">
              No rows returned. If the <code className="rounded bg-neutral-100 px-1">paystack_webhook_events</code> table
              or <code className="rounded bg-neutral-100 px-1">created_at</code> column is missing, apply the latest
              Supabase migrations; otherwise there were no non-success events this UTC month.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="px-3 py-2">When</th>
                    <th className="px-3 py-2">Event</th>
                    <th className="px-3 py-2">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {d.webhookNonSuccessSample.map((row, i) => (
                    <tr key={`${row.reference ?? "ref"}-${i}`} className="bg-white">
                      <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                        {row.created_at ? new Date(row.created_at).toLocaleString() : "—"}
                      </td>
                      <td className="px-3 py-2 font-medium text-neutral-900">{row.event}</td>
                      <td className="max-w-[240px] truncate px-3 py-2 font-mono text-xs text-neutral-600" title={row.reference ?? ""}>
                        {row.reference?.trim() || "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AdminTableShell>

        <div className="grid gap-6 lg:grid-cols-2">
          <AdminTableShell title="Upgrades to paid (subscription_changes)">
            {d.upgradesToPaidThisMonth.length === 0 ? (
              <div className="p-4 text-sm text-neutral-600">None this month.</div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Business</th>
                      <th className="px-3 py-2">Plans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {d.upgradesToPaidThisMonth.map((row) => (
                      <tr key={`${row.business_id}-${row.changed_at}`} className="bg-white">
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                          {new Date(row.changed_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/admin/businesses/${row.business_id}`}
                            className="font-medium text-[#1FAF9E] hover:underline"
                          >
                            {row.business_name?.trim() || row.business_id}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-700">
                          {row.old_plan ?? "—"} → {row.new_plan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminTableShell>

          <AdminTableShell title="Downgrades to free (subscription_changes)">
            {d.downgradesToFreeThisMonth.length === 0 ? (
              <div className="p-4 text-sm text-neutral-600">None this month.</div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="sticky top-0 border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                    <tr>
                      <th className="px-3 py-2">When</th>
                      <th className="px-3 py-2">Business</th>
                      <th className="px-3 py-2">Plans</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {d.downgradesToFreeThisMonth.map((row) => (
                      <tr key={`${row.business_id}-${row.changed_at}-down`} className="bg-white">
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                          {new Date(row.changed_at).toLocaleString()}
                        </td>
                        <td className="px-3 py-2">
                          <Link
                            href={`/admin/businesses/${row.business_id}`}
                            className="font-medium text-[#1FAF9E] hover:underline"
                          >
                            {row.business_name?.trim() || row.business_id}
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-xs text-neutral-700">
                          {row.old_plan ?? "—"} → {row.new_plan}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </AdminTableShell>
        </div>
      </div>

      <div className="w-full shrink-0 lg:w-80">
        <RevenueSidebar {...d} />
      </div>
    </div>
  );
}
