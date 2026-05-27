"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type QueuePhoto = {
  id: string;
  business_id: string;
  url: string;
  section: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
  moderation_status: string | null;
  is_live: boolean | null;
  expiresAt: string | null;
  hoursUntilExpiry: number | null;
  isOverdue: boolean;
};

type QueueGroup = {
  businessId: string;
  businessName: string | null;
  businessSlug: string | null;
  ownerId: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  expiringCount: number;
  overdueCount: number;
  earliestExpiresAt: string | null;
  photos: QueuePhoto[];
};

type QueueResponse = {
  expiringCount: number;
  overdueCount: number;
  businessCount: number;
  retentionDays: number;
  warningDays: number;
  groups: QueueGroup[];
};

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleString();
}

function formatRelativeHours(hours: number | null): string {
  if (hours == null || !Number.isFinite(hours)) return "-";
  if (hours <= 0) {
    const overdueHrs = Math.abs(hours);
    if (overdueHrs >= 24) {
      const days = Math.floor(overdueHrs / 24);
      return `${days}d overdue`;
    }
    return `${Math.floor(overdueHrs)}h overdue`;
  }
  if (hours >= 24) {
    const days = Math.floor(hours / 24);
    return `${days}d left`;
  }
  return `${Math.floor(hours)}h left`;
}

export default function PhotoExpiryQueue() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<QueueResponse | null>(null);
  const [busyBusinessId, setBusyBusinessId] = useState<string | null>(null);
  const [sweepBusy, setSweepBusy] = useState(false);
  const [flash, setFlash] = useState<
    { type: "success" | "error"; text: string } | null
  >(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/photo-expiry", {
        cache: "no-store",
        credentials: "same-origin",
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const body = (await res.json()) as QueueResponse;
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load queue");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  useEffect(() => {
    if (!flash) return;
    const t = window.setTimeout(() => setFlash(null), 4500);
    return () => window.clearTimeout(t);
  }, [flash]);

  const groups = data?.groups ?? [];
  const expiringCount = data?.expiringCount ?? 0;
  const overdueCount = data?.overdueCount ?? 0;
  const businessCount = data?.businessCount ?? 0;
  const retentionDays = data?.retentionDays ?? 30;

  const sortedGroups = useMemo(
    () =>
      [...groups].sort((a, b) => {
        const aKey = a.earliestExpiresAt ?? "";
        const bKey = b.earliestExpiresAt ?? "";
        return aKey.localeCompare(bKey);
      }),
    [groups]
  );

  const notifyBusiness = useCallback(
    async (group: QueueGroup) => {
      if (!group.ownerEmail) {
        setFlash({
          type: "error",
          text: "No owner email on file, reminder skipped.",
        });
        return;
      }
      setBusyBusinessId(group.businessId);
      setFlash(null);
      try {
        const res = await fetch("/api/admin/photo-expiry/notify", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId: group.businessId }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          emailStatus?: string;
          expiringCount?: number;
        };
        if (!res.ok) {
          setFlash({
            type: "error",
            text: body.error ?? `Reminder failed (${res.status})`,
          });
          return;
        }
        const count = body.expiringCount ?? group.expiringCount;
        setFlash({
          type: "success",
          text: `Reminder sent to ${group.ownerEmail}, ${count} photo${
            count === 1 ? "" : "s"
          } flagged.`,
        });
        void load(true);
      } catch (e) {
        setFlash({
          type: "error",
          text: e instanceof Error ? e.message : "Reminder failed",
        });
      } finally {
        setBusyBusinessId(null);
      }
    },
    [load]
  );

  const runSweep = useCallback(
    async (dryRun: boolean) => {
      if (!dryRun) {
        const confirmed = window.confirm(
          `Permanently delete every free-plan photo that is already past ${retentionDays} days old? This cannot be undone.`
        );
        if (!confirmed) return;
      }
      setSweepBusy(true);
      setFlash(null);
      try {
        const res = await fetch("/api/admin/photo-expiry/delete-expired", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dryRun }),
        });
        const body = (await res.json().catch(() => ({}))) as {
          error?: string;
          deleted?: number;
          eligible?: number;
          storageFailed?: number;
        };
        if (!res.ok) {
          setFlash({
            type: "error",
            text: body.error ?? `Sweep failed (${res.status})`,
          });
          return;
        }
        if (dryRun) {
          setFlash({
            type: "success",
            text: `Dry run, ${body.eligible ?? 0} photo${
              (body.eligible ?? 0) === 1 ? "" : "s"
            } would be deleted.`,
          });
        } else {
          const storageSuffix = body.storageFailed
            ? `, ${body.storageFailed} storage cleanup${
                body.storageFailed === 1 ? "" : "s"
              } failed (logged)`
            : "";
          setFlash({
            type: "success",
            text: `Deleted ${body.deleted ?? 0} photo${
              (body.deleted ?? 0) === 1 ? "" : "s"
            }${storageSuffix}.`,
          });
        }
        void load(true);
      } catch (e) {
        setFlash({
          type: "error",
          text: e instanceof Error ? e.message : "Sweep failed",
        });
      } finally {
        setSweepBusy(false);
      }
    },
    [load, retentionDays]
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-800">
          {expiringCount} expiring in 24h
        </span>
        {overdueCount > 0 ? (
          <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800">
            {overdueCount} overdue
          </span>
        ) : null}
        <span className="text-xs text-neutral-500">
          {businessCount} business{businessCount === 1 ? "" : "es"} on the free
          plan with photos past the {retentionDays - 1}-day mark
        </span>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void runSweep(true)}
            disabled={sweepBusy || loading}
            className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {sweepBusy ? "Running…" : "Dry-run sweep"}
          </button>
          <button
            type="button"
            onClick={() => void runSweep(false)}
            disabled={sweepBusy || loading || overdueCount === 0}
            title={
              overdueCount === 0
                ? "Nothing is past the 30-day mark yet"
                : `Delete ${overdueCount} overdue photo${overdueCount === 1 ? "" : "s"}`
            }
            className="inline-flex items-center rounded-md border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {sweepBusy ? "Deleting…" : "Delete overdue"}
          </button>
          <button
            type="button"
            onClick={() => void load(false)}
            disabled={loading}
            className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {flash ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            flash.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
          role="status"
          aria-live="polite"
        >
          {flash.text}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {loading && sortedGroups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center text-sm text-neutral-500">
          Loading queue…
        </div>
      ) : null}

      {!loading && sortedGroups.length === 0 && !error ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center text-sm text-neutral-600">
          <p className="font-medium text-neutral-800">All clear.</p>
          <p className="mt-1 text-xs text-neutral-500">
            No free-plan photos are within the {retentionDays - 1}-day warning
            window or past the {retentionDays}-day cutoff.
          </p>
        </div>
      ) : null}

      {sortedGroups.length > 0 ? (
        <ul className="space-y-6">
          {sortedGroups.map((group) => {
            const rowBusy = busyBusinessId === group.businessId;
            const hasExpiring = group.expiringCount > 0;
            const hasOverdue = group.overdueCount > 0;
            return (
              <li
                key={group.businessId}
                className="rounded-xl border border-neutral-200 bg-white"
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/businesses/${group.businessId}`}
                        className="truncate text-sm font-semibold text-neutral-900 hover:underline"
                      >
                        {group.businessName?.trim() || "Untitled business"}
                      </Link>
                      {hasExpiring ? (
                        <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
                          {group.expiringCount} expiring
                        </span>
                      ) : null}
                      {hasOverdue ? (
                        <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-800">
                          {group.overdueCount} overdue
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-xs text-neutral-500">
                      {group.ownerEmail ? (
                        <>
                          Owner:{" "}
                          <span className="font-medium text-neutral-700">
                            {group.ownerName || group.ownerEmail}
                          </span>{" "}
                          ({group.ownerEmail})
                        </>
                      ) : (
                        <span className="text-amber-700">
                          No claimed owner, reminder emails will be skipped.
                        </span>
                      )}
                    </p>
                    {group.earliestExpiresAt ? (
                      <p className="mt-0.5 text-[11px] text-neutral-500">
                        Earliest cutoff: {formatDateTime(group.earliestExpiresAt)}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={
                        rowBusy ||
                        !group.ownerEmail ||
                        !hasExpiring
                      }
                      onClick={() => void notifyBusiness(group)}
                      title={
                        !group.ownerEmail
                          ? "No owner email on file"
                          : !hasExpiring
                            ? "Only overdue photos, nothing left in the warning window"
                            : `Send reminder email to ${group.ownerEmail}`
                      }
                      className="inline-flex items-center rounded-md border border-[#1FAF9E]/40 bg-[#E6F9F6] px-3 py-1.5 text-xs font-semibold text-[#0F766E] hover:bg-[#D1F3EE] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {rowBusy ? "Sending…" : "Send reminder email"}
                    </button>
                    {group.businessSlug ? (
                      <Link
                        href={`/b/${group.businessSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                      >
                        View public page ↗
                      </Link>
                    ) : null}
                    <Link
                      href={`/admin/businesses/${group.businessId}`}
                      className="inline-flex items-center rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      Open business
                    </Link>
                  </div>
                </div>

                <ul className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {group.photos.map((p) => (
                    <li
                      key={p.id}
                      className="flex flex-col overflow-hidden rounded-lg border border-neutral-200"
                    >
                      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.url}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                        <span
                          className={`pointer-events-none absolute left-2 top-2 inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                            p.isOverdue
                              ? "border border-rose-200 bg-rose-50 text-rose-800"
                              : "border border-orange-200 bg-orange-50 text-orange-800"
                          }`}
                        >
                          {formatRelativeHours(p.hoursUntilExpiry)}
                        </span>
                        {p.is_live ? (
                          <span className="pointer-events-none absolute right-2 top-2 inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800">
                            Live
                          </span>
                        ) : null}
                      </div>
                      <div className="flex flex-1 flex-col gap-1 p-3 text-xs text-neutral-500">
                        <div>
                          <span className="font-medium text-neutral-700">
                            Uploaded:
                          </span>{" "}
                          {formatDateTime(p.created_at)}
                        </div>
                        <div>
                          <span className="font-medium text-neutral-700">
                            Removes at:
                          </span>{" "}
                          {formatDateTime(p.expiresAt)}
                        </div>
                        <div>
                          <span className="font-medium text-neutral-700">
                            Section:
                          </span>{" "}
                          {p.section || "gallery"}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
