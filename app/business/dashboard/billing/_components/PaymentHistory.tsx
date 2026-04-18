"use client";

import type { BillingOverviewHistoryRow } from "@/lib/billingOverview";

function formatBillingDate(iso: string): string {
  const t = new Date(iso);
  if (!Number.isFinite(t.getTime())) return "—";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(t);
}

function formatAmount(amountMinor: number | null, currency: string | null): string {
  if (amountMinor == null || !Number.isFinite(amountMinor)) return "—";
  const normalizedCurrency = (currency ?? "").trim().toUpperCase();
  const amountMajor = amountMinor / 100;
  if (!normalizedCurrency) return amountMajor.toFixed(2);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: normalizedCurrency,
    }).format(amountMajor);
  } catch {
    return `${amountMajor.toFixed(2)} ${normalizedCurrency}`;
  }
}

export default function PaymentHistory({
  rows,
  loading,
  errorMessage,
}: {
  rows: BillingOverviewHistoryRow[];
  loading: boolean;
  errorMessage: string | null;
}) {
  return (
    <section aria-labelledby="payment-history-heading" className="space-y-3">
      <h2 id="payment-history-heading" className="text-lg font-semibold text-[#0E0E0E]">
        Payment history
      </h2>
      <p className="text-sm text-gray-500">
        Recent billing activity for this workspace.
      </p>

      {loading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          Loading history…
        </div>
      ) : errorMessage ? (
        <div
          className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-800"
          role="status"
        >
          {errorMessage}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-8 text-center text-sm text-gray-600">
          No payments yet.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/90 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => (
                <tr key={`${row.date}-${row.reference ?? "na"}-${row.plan}-${i}`}>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                    {formatBillingDate(row.date)}
                  </td>
                  <td className="px-4 py-3 text-gray-900">{row.plan}</td>
                  <td className="max-w-[240px] truncate px-4 py-3 font-mono text-xs text-gray-700">
                    {row.reference ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-gray-900">
                    {formatAmount(row.amount, row.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 capitalize text-gray-800">
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
