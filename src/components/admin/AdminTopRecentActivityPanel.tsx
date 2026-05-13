import Link from "next/link";
import {
  Activity,
  LogIn,
  MessageSquareText,
  UserPlus,
  Zap,
} from "lucide-react";

import type {
  AdminTopRecentActivityKind,
  AdminTopRecentBusinessActivity,
} from "@/lib/adminTopRecentBusinessActivity";

const FLAG_BASE =
  "https://purecatamphetamine.github.io/country-flag-icons/3x2";

const DATE_LOCALE = "en-US" as const;

function flagUrlForCode(code: string): string | null {
  const upper = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) return null;
  return `${FLAG_BASE}/${upper}.svg`;
}

function formatRelativeAgo(iso: string | null | undefined): string {
  if (!iso) return "—";
  const from = new Date(iso);
  if (Number.isNaN(from.getTime())) return "—";
  const diffMs = Math.max(0, Date.now() - from.getTime());
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 8) return `${weeks}w ago`;
  return from.toLocaleDateString(DATE_LOCALE, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

type KindMeta = {
  label: string;
  badge: string;
  border: string;
  iconBg: string;
  iconColor: string;
  Icon: typeof Activity;
};

const KIND_META: Record<AdminTopRecentActivityKind, KindMeta> = {
  signup: {
    label: "Just signed up",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
    border: "border-emerald-200",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    Icon: UserPlus,
  },
  review: {
    label: "New review",
    badge: "bg-amber-50 text-amber-800 border-amber-200",
    border: "border-amber-200",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-800",
    Icon: MessageSquareText,
  },
  dashboard_login: {
    label: "Dashboard login",
    badge: "bg-sky-50 text-sky-700 border-sky-200",
    border: "border-sky-200",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
    Icon: LogIn,
  },
  dashboard: {
    label: "Dashboard activity",
    badge: "bg-violet-50 text-violet-700 border-violet-200",
    border: "border-violet-200",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
    Icon: Zap,
  },
};

function humanizeDashboardAction(action: string): string {
  if (!action) return "";
  return action.replace(/_/g, " ");
}

function activityDetail(row: AdminTopRecentBusinessActivity): string {
  switch (row.last_activity_kind) {
    case "review": {
      const rating = row.last_review_rating;
      if (rating != null) {
        return `${rating}★ review left by a customer`;
      }
      return "Customer left a new review";
    }
    case "dashboard_login":
      return "Owner just signed in to the dashboard";
    case "dashboard":
      return `Owner did ${humanizeDashboardAction(row.last_dashboard_action) || "dashboard activity"}`;
    case "signup":
    default:
      return "Business profile created";
  }
}

function getInitial(name: string): string {
  const trimmed = (name ?? "").trim();
  return (trimmed.charAt(0) || "B").toUpperCase();
}

export default function AdminTopRecentActivityPanel({
  rows,
  error,
}: {
  rows: AdminTopRecentBusinessActivity[];
  error: string | null;
}) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1FAF9E]/10">
            <Activity className="h-5 w-5 text-[#1FAF9E]" aria-hidden />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-neutral-900">
              Latest business activity
            </h2>
            <p className="text-xs text-neutral-500">
              Top 15 customer businesses by most recent signup, review, or
              dashboard action. Live on every page load.
            </p>
          </div>
        </div>
        <span className="text-xs text-neutral-500 tabular-nums">
          {rows.length} {rows.length === 1 ? "business" : "businesses"}
        </span>
      </div>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </p>
      ) : null}

      {rows.length === 0 && !error ? (
        <p className="mt-4 text-sm text-neutral-500">
          No recent business activity yet.
        </p>
      ) : (
        <ol className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((row, idx) => {
            const meta = KIND_META[row.last_activity_kind];
            const Icon = meta.Icon;
            const flag = flagUrlForCode(row.business_country_code);
            const detail = activityDetail(row);

            return (
              <li
                key={row.business_id}
                className={`relative flex flex-col rounded-lg border ${meta.border} bg-white p-3 transition hover:shadow-sm`}
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-semibold tabular-nums text-neutral-600">
                    {idx + 1}
                  </span>
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
                    {row.business_logo_url ? (
                      <img
                        src={row.business_logo_url}
                        alt={`${row.business_name} logo`}
                        className="h-full w-full object-contain"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <span className="text-sm font-semibold text-neutral-700">
                        {getInitial(row.business_name)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <Link
                        href={`/admin/businesses/${row.business_id}`}
                        className="truncate text-sm font-semibold text-neutral-900 hover:underline"
                        title={row.business_name}
                      >
                        {row.business_name}
                      </Link>
                      {flag ? (
                        <img
                          src={flag}
                          alt={`${row.business_country_code} flag`}
                          className="h-3 w-5 shrink-0 rounded-[2px] object-cover ring-1 ring-neutral-200"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-neutral-500">
                      {row.owner_display_name}
                      {row.owner_email &&
                      row.owner_email !== row.owner_display_name ? (
                        <span className="text-neutral-400">
                          {" "}
                          · {row.owner_email}
                        </span>
                      ) : null}
                    </p>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${meta.badge}`}
                  >
                    <span
                      className={`flex h-4 w-4 items-center justify-center rounded-full ${meta.iconBg}`}
                    >
                      <Icon
                        className={`h-2.5 w-2.5 ${meta.iconColor}`}
                        aria-hidden
                      />
                    </span>
                    {meta.label}
                  </span>
                  <span
                    className="text-[11px] tabular-nums text-neutral-500"
                    title={row.last_activity_at ?? ""}
                  >
                    {formatRelativeAgo(row.last_activity_at)}
                  </span>
                </div>

                <p className="mt-1 truncate text-xs text-neutral-600">
                  {detail}
                </p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
