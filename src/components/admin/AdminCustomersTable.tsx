"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import type { AdminCustomerMetrics } from "@/lib/adminCustomerMetrics";

export type AdminCustomerRow = {
  id: string;
  name: string | null;
  website: string | null;
  status: string | null;
  created_at: string | null;
  review_count: number | null;
  plan_code: string;
  owner_email: string;
  owner_name: string;
  metrics: AdminCustomerMetrics;
};

/** Fixed locale so SSR and browser produce identical strings (avoids hydration mismatch). */
const DATE_LOCALE = "en-US" as const;

function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(DATE_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatRelativeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const from = new Date(iso);
  if (Number.isNaN(from.getTime())) return "—";
  const diffMs = Math.max(0, Date.now() - from.getTime());
  const h = Math.floor(diffMs / (60 * 60 * 1000));
  if (h < 48) return `${h}h ago`;
  const days = Math.floor(h / 24);
  return `${days}d ago`;
}

export default function AdminCustomersTable({ rows }: { rows: AdminCustomerRow[] }) {
  const [q, setQ] = useState("");
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((r) => {
      const hay = [
        r.name,
        r.website,
        r.owner_email,
        r.owner_name,
        r.plan_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(needle);
    });
  }, [rows, q]);

  return (
    <div className="w-full">
      <div className="border-b border-neutral-100 bg-white px-4 py-2.5">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search business or owner..."
          className="w-full max-w-sm rounded border px-3 py-2"
          aria-label="Filter customers"
        />
        <p className="mt-2 max-w-4xl text-xs text-neutral-500">
          Activity matches the business dashboard bell: owner logins, page views, widget usage, and
          review invite sends (monthly cap). There is no session timer — “Events 7d” is the count of
          owner dashboard actions logged in the last 7 days. Reviews counts published, visible
          reviews (same as the public profile), not the cached column on businesses.
        </p>
      </div>
      {filtered.length === 0 ? (
        <div className="p-4 text-sm text-neutral-600">No rows match your search.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] text-left text-sm">
            <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Business</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Plan</th>
                <th className="px-3 py-2 font-medium">Reviews</th>
                <th className="px-3 py-2 font-medium">Logins</th>
                <th className="px-3 py-2 font-medium">Last active</th>
                <th className="px-3 py-2 font-medium">Events 7d</th>
                <th className="px-3 py-2 font-medium">Widgets</th>
                <th className="px-3 py-2 font-medium">Invites (mo)</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Created</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map((c) => {
                const m = c.metrics;
                const widgetLabel = m.widgetUsed
                  ? m.widgetGeneratedCount > 0
                    ? `Widget generated (${m.widgetGeneratedCount})`
                    : m.emailWidgetSignals > 0
                      ? "Email widget activity"
                      : "Widget activity"
                  : "No widget activity";
                return (
                  <tr
                    key={c.id}
                    className="bg-white align-top"
                    aria-selected={selectedRowId === c.id}
                    onClick={(event) => {
                      const target = event.target as HTMLElement | null;
                      if (target?.closest("a,button,input,select,textarea,label")) return;
                      setSelectedRowId((prev) => (prev === c.id ? null : c.id));
                    }}
                  >
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.name || "—"}</div>
                      <div className="text-xs text-gray-500">{c.website || "—"}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{c.owner_name}</div>
                      <div className="text-xs text-gray-500">{c.owner_email}</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 capitalize">
                      {c.plan_code || "free"}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{c.review_count ?? 0}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                      <span className="font-medium text-neutral-900">{m.logins24h}</span>
                      <span className="text-neutral-400"> / </span>
                      <span>{m.logins7d}</span>
                      <div className="text-xs text-neutral-500">24h · 7d</div>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                      {formatShortDate(m.lastOwnerActivityAt)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                      {m.dashboardEvents7d}
                    </td>
                    <td className="px-3 py-2 text-neutral-700">
                      <div>{widgetLabel}</div>
                    </td>
                    <td className="min-w-[200px] px-3 py-2 text-neutral-800">
                      <div>
                        {m.invitesSentThisMonth}/{m.inviteLimit}{" "}
                        <span className="text-neutral-500">
                          ({m.invitesRemaining} left)
                        </span>
                      </div>
                      <div className="text-xs text-neutral-500">
                        Last send: {m.lastInviteSentAt ? formatRelativeAgo(m.lastInviteSentAt) : "—"}
                      </div>
                      {m.quiet48h ? (
                        <div className="mt-0.5 text-xs font-medium text-amber-700">
                          No invite ~48h+
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">
                      <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-700">
                        {c.status || "—"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                      {c.created_at ? formatShortDate(c.created_at) : "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/admin/businesses/${c.id}`}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
