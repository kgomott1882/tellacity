"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type AdminActionPreset =
  | ""
  | "activate"
  | "suspended"
  | "under_review"
  | "approved";

const ADMIN_ACTION_PRESET_VALUES: Record<
  Exclude<AdminActionPreset, "">,
  { status: string; submission: string }
> = {
  activate: { status: "active", submission: "approved" },
  suspended: { status: "suspended", submission: "suspended" },
  under_review: { status: "under_review", submission: "under_review" },
  approved: { status: "active", submission: "approved" },
};

const BULK_ACTION_LABEL: Record<keyof typeof ADMIN_ACTION_PRESET_VALUES, string> =
  {
    activate: "Activate",
    suspended: "Suspended",
    under_review: "Under review",
    approved: "Approved",
  };

import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import type { AdminBusinessRow } from "@/lib/admin";
import { COUNTRIES, adminCountryDisplay } from "@/lib/adminCountries";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS,
  type AdminBusinessSuspensionReasonKey,
} from "@/lib/adminBusinessSuspensionReasons";

function businessId(row: AdminBusinessRow): string {
  return String(row.business_id ?? row.id ?? "");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString();
}

function websiteHref(raw: string | null | undefined): string | null {
  const w = raw?.trim();
  if (!w) return null;
  if (/^https?:\/\//i.test(w)) return w;
  return `https://${w.replace(/^www\./i, "")}`;
}

function truncateBusinessId(id: string): string {
  return id.slice(0, 8);
}

function sourceLabel(source: unknown): string {
  if (typeof source !== "string") return "-";
  const normalized = source.trim().toLowerCase();
  if (normalized === "seeded") return "Seeded";
  if (normalized === "user_suggested") return "Suggested";
  if (normalized === "owner_signup") return "Owner Signup";
  return "-";
}

function parseRpcCount(data: unknown): number {
  if (data == null) return 0;
  if (typeof data === "number" && !Number.isNaN(data)) return data;
  if (typeof data === "string") {
    const n = parseInt(data, 10);
    return Number.isNaN(n) ? 0 : n;
  }
  if (Array.isArray(data) && data.length > 0) {
    return parseRpcCount(data[0]);
  }
  return 0;
}

function StatusPill({ status }: { status: string }) {
  const s = status.trim().toLowerCase();
  let cls =
    "inline-flex rounded-full border px-2 py-0.5 text-xs font-medium capitalize";
  if (s === "active") {
    cls += " border-emerald-200 bg-emerald-50 text-emerald-800";
  } else if (s === "suspended") {
    cls += " border-amber-200 bg-amber-50 text-amber-900";
  } else if (s === "under_review") {
    cls += " border-sky-200 bg-sky-50 text-sky-900";
  } else {
    cls += " border-neutral-200 bg-neutral-100 text-neutral-700";
  }
  return <span className={cls}>{status.trim() || "-"}</span>;
}

type CategoryOption = { slug: string; name: string };

export default function AdminBusinessesTable() {
  const router = useRouter();
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [submissionFilter, setSubmissionFilter] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [limit, setLimit] = useState(50);
  const [page, setPage] = useState(1);

  const [rows, setRows] = useState<AdminBusinessRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [listRefreshToken, setListRefreshToken] = useState(0);

  const [adminActionPreset, setAdminActionPreset] = useState<AdminActionPreset>("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const headerSelectRef = useRef<HTMLInputElement>(null);

  type SuspendModalState =
    | { mode: "single"; businessId: string; businessName: string }
    | { mode: "bulk"; businessIds: string[] }
    | null;
  const [suspendModal, setSuspendModal] = useState<SuspendModalState>(null);
  const [suspendReasonKey, setSuspendReasonKey] =
    useState<AdminBusinessSuspensionReasonKey>("general");
  const [suspendCustomNote, setSuspendCustomNote] = useState("");
  const [suspending, setSuspending] = useState(false);

  const openSuspendModalSingle = useCallback(
    (id: string, name: string) => {
      setSuspendReasonKey("general");
      setSuspendCustomNote("");
      setSuspendModal({ mode: "single", businessId: id, businessName: name });
    },
    []
  );

  const openSuspendModalBulk = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setSuspendReasonKey("general");
    setSuspendCustomNote("");
    setSuspendModal({ mode: "bulk", businessIds: ids });
  }, []);

  const closeSuspendModal = useCallback(() => {
    if (suspending) return;
    setSuspendModal(null);
  }, [suspending]);

  const handleConfirmSuspendWithNotice = useCallback(async () => {
    if (!suspendModal) return;
    const ids =
      suspendModal.mode === "single"
        ? [suspendModal.businessId]
        : suspendModal.businessIds;
    if (ids.length === 0) return;

    setSuspending(true);
    let failedCount = 0;
    const warnings: string[] = [];
    try {
      for (const businessId of ids) {
        try {
          const res = await fetch("/api/admin/businesses/suspend-with-notice", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              businessId,
              reasonKey: suspendReasonKey,
              customNote: suspendCustomNote.trim() || undefined,
            }),
          });
          const data = (await res.json().catch(() => ({}))) as {
            ok?: boolean;
            error?: string;
            warning?: string | null;
            recipient?: string | null;
          };
          if (!res.ok) {
            failedCount += 1;
            console.error("[admin suspend-with-notice]", res.status, data);
          } else if (data.warning) {
            warnings.push(data.warning);
          }
        } catch (err) {
          failedCount += 1;
          console.error("[admin suspend-with-notice] fetch", err);
        }
      }

      if (failedCount > 0) {
        window.alert(`${failedCount} suspension(s) failed. Others may have succeeded.`);
      } else if (warnings.length > 0) {
        window.alert(warnings.slice(0, 3).join("\n\n"));
      }

      setSuspendModal(null);
      setSelectedIds(new Set());
      setListRefreshToken((t) => t + 1);
      router.refresh();
    } finally {
      setSuspending(false);
    }
  }, [router, suspendCustomNote, suspendModal, suspendReasonKey]);

  const handleApproveWithNotice = useCallback(
    async (businessId: string) => {
      if (!businessId) {
        window.alert("Missing business ID");
        return;
      }
      setUpdatingId(businessId);
      try {
        const res = await fetch("/api/admin/businesses/approve-with-notice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ businessId }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          warning?: string | null;
          notified?: boolean;
          wasSuspended?: boolean;
        };
        if (!res.ok) {
          console.error("Failed to approve business", res.status, data);
          window.alert(data.error ?? "Failed to approve business");
          return;
        }
        if (data.warning) {
          window.alert(data.warning);
        }
        setListRefreshToken((t) => t + 1);
        router.refresh();
      } catch (err) {
        console.error(err);
        window.alert("Unexpected failure during approval.");
      } finally {
        setUpdatingId(null);
      }
    },
    [router]
  );

  const handleStatusUpdate = useCallback(
    async (
      businessId: string,
      newStatus?: string,
      newSubmissionStatus?: string
    ) => {
      if (!businessId) {
        window.alert("Missing business ID");
        return;
      }

      setUpdatingId(businessId);
      try {
        const res = await fetch("/api/admin/update-business-status", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            businessId,
            newStatus: newStatus ?? null,
            newSubmissionStatus: newSubmissionStatus ?? null,
          }),
        });

        if (!res.ok) {
          const data = (await res.json().catch(() => ({}))) as { error?: string };
          console.error("Failed to update business", res.status, data);
          window.alert(data.error ?? "Failed to update business");
          return;
        }

        setListRefreshToken((t) => t + 1);
        router.refresh();
      } catch (err) {
        console.error(err);
        window.alert("Unexpected failure during update.");
      } finally {
        setUpdatingId(null);
      }
    },
    [router]
  );

  const runBulkPreset = useCallback(
    async (preset: keyof typeof ADMIN_ACTION_PRESET_VALUES) => {
      const ids = [...selectedIds];
      if (ids.length === 0) return;
      const { status, submission } = ADMIN_ACTION_PRESET_VALUES[preset];
      const confirmed = window.confirm(
        `Apply “${BULK_ACTION_LABEL[preset]}” to ${ids.length} business(es)?`
      );
      if (!confirmed) return;

      setBulkUpdating(true);
      let failed = 0;
      const warnings: string[] = [];
      try {
        for (const businessId of ids) {
          if (preset === "activate" || preset === "approved") {
            try {
              const res = await fetch(
                "/api/admin/businesses/approve-with-notice",
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  credentials: "include",
                  body: JSON.stringify({ businessId }),
                }
              );
              const data = (await res.json().catch(() => ({}))) as {
                ok?: boolean;
                error?: string;
                warning?: string | null;
              };
              if (!res.ok) failed += 1;
              else if (data.warning) warnings.push(data.warning);
            } catch (err) {
              failed += 1;
              console.error("[bulk approve-with-notice]", err);
            }
            continue;
          }

          const res = await fetch("/api/admin/update-business-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              businessId,
              newStatus: status,
              newSubmissionStatus: submission,
            }),
          });
          if (!res.ok) failed += 1;
        }
        if (failed > 0) {
          window.alert(`${failed} update(s) failed. Others may have succeeded.`);
        } else if (warnings.length > 0) {
          window.alert(warnings.slice(0, 3).join("\n\n"));
        }
        setSelectedIds(new Set());
        setListRefreshToken((t) => t + 1);
        router.refresh();
      } finally {
        setBulkUpdating(false);
      }
    },
    [router, selectedIds]
  );

  const handleDelete = useCallback(
    async (businessId: string) => {
      const confirmed = window.confirm(
        "Are you sure you want to delete this business? This action cannot be undone."
      );
      if (!confirmed) return;

      setDeletingId(businessId);
      try {
        const supabase = supabaseBrowser();
        const { error } = await supabase.rpc("admin_delete_business", {
          target_business_id: businessId,
        });

        if (error) {
          console.error("Delete error:", error);
          window.alert(error.message);
          return;
        }

        setListRefreshToken((t) => t + 1);
        router.refresh();
      } catch (err) {
        console.error("Unexpected error:", err);
        window.alert("Something went wrong while deleting.");
      } finally {
        setDeletingId(null);
      }
    },
    [router]
  );

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const prevDebouncedRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (
      prevDebouncedRef.current !== undefined &&
      prevDebouncedRef.current !== debouncedSearch
    ) {
      setPage(1);
    }
    prevDebouncedRef.current = debouncedSearch;
  }, [debouncedSearch]);

  useEffect(() => {
    let cancelled = false;

    async function loadCategories() {
      const supabase = supabaseBrowser();
      const { data, error } = await supabase.rpc("admin_list_category_filter_options");
      if (cancelled || error) return;
      const list = Array.isArray(data) ? (data as CategoryOption[]) : [];
      setCategoryOptions(
        list.filter(
          (row) => typeof row.slug === "string" && row.slug.trim() !== ""
        )
      );
    }

    void loadCategories();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [
    debouncedSearch,
    statusFilter,
    submissionFilter,
    countryFilter,
    categoryFilter,
  ]);

  const visibleIds = useMemo(
    () => rows.map((r) => businessId(r)).filter((id) => id.length > 0),
    [rows]
  );
  const selectedOnPage = visibleIds.filter((id) => selectedIds.has(id)).length;
  const allOnPageSelected =
    visibleIds.length > 0 && selectedOnPage === visibleIds.length;
  const someOnPageSelected =
    selectedOnPage > 0 && selectedOnPage < visibleIds.length;

  useEffect(() => {
    const el = headerSelectRef.current;
    if (el) el.indeterminate = someOnPageSelected;
  }, [someOnPageSelected]);

  const toggleSelectRow = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectPage = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const all = allOnPageSelected;
      for (const id of visibleIds) {
        if (all) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, [allOnPageSelected, visibleIds]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setListError(null);
      const supabase = supabaseBrowser();
      const search_term = debouncedSearch.length > 0 ? debouncedSearch : null;
      const status_filter = statusFilter.length > 0 ? statusFilter : null;
      const submission_filter = submissionFilter.length > 0 ? submissionFilter : null;
      const country_filter = countryFilter.length > 0 ? countryFilter : null;
      const category_filter = categoryFilter.length > 0 ? categoryFilter : null;
      const offset_count = (page - 1) * limit;

      try {
        const [listRes, countRes] = await Promise.all([
          supabase.rpc("admin_list_businesses_v2", {
            search_term,
            status_filter,
            submission_filter,
            country_filter,
            category_filter,
            limit_count: limit,
            offset_count,
          }),
          supabase.rpc("admin_count_businesses_v2", {
            search_term,
            status_filter,
            submission_filter,
            country_filter,
            category_filter,
          }),
        ]);

        if (cancelled) return;

        if (listRes.error) {
          setListError(listRes.error.message);
          setRows([]);
          setTotalCount(0);
        } else {
          const list = (Array.isArray(listRes.data) ? listRes.data : []) as AdminBusinessRow[];
          setRows(list);
          if (countRes.error) {
            setListError(countRes.error.message);
            setTotalCount((page - 1) * limit + list.length);
          } else {
            setTotalCount(parseRpcCount(countRes.data));
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    debouncedSearch,
    statusFilter,
    submissionFilter,
    countryFilter,
    categoryFilter,
    limit,
    page,
    listRefreshToken,
  ]);

  const startIdx = totalCount === 0 ? 0 : (page - 1) * limit + 1;
  const endIdx = Math.min(page * limit, totalCount);
  const canPrev = page > 1;
  const canNext = page * limit < totalCount;

  const handleStatusChange = (v: string) => {
    setAdminActionPreset("");
    setStatusFilter(v);
    setPage(1);
  };

  const handleSubmissionChange = (v: string) => {
    setAdminActionPreset("");
    setSubmissionFilter(v);
    setPage(1);
  };

  const handleAdminActionPresetChange = (v: string) => {
    if (v === "") {
      setAdminActionPreset("");
      setStatusFilter("");
      setSubmissionFilter("");
      setPage(1);
      return;
    }
    const preset = v as keyof typeof ADMIN_ACTION_PRESET_VALUES;
    setAdminActionPreset(v as AdminActionPreset);
    setPage(1);
    const pair = ADMIN_ACTION_PRESET_VALUES[preset];
    setStatusFilter(pair.status);
    setSubmissionFilter(pair.submission);
  };

  const handleCountryChange = (v: string) => {
    setCountryFilter(v);
    setPage(1);
  };

  const handleCategoryChange = (v: string) => {
    setCategoryFilter(v);
    setPage(1);
  };

  const handleLimitChange = (v: number) => {
    setLimit(v);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {listError ? <AdminActionMessage type="error" text={listError} /> : null}

      {suspendModal ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-suspend-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !suspending) {
              setSuspendModal(null);
            }
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2
              id="admin-suspend-modal-title"
              className="text-lg font-semibold text-neutral-900"
            >
              Suspend business &amp; notify owner
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              {suspendModal.mode === "single" ? (
                <>
                  This will suspend{" "}
                  <span className="font-medium text-neutral-900">
                    {suspendModal.businessName}
                  </span>{" "}
                  and email the registered owner explaining the reason you select
                  below.
                </>
              ) : (
                <>
                  This will suspend{" "}
                  <span className="font-medium text-neutral-900">
                    {suspendModal.businessIds.length} business(es)
                  </span>{" "}
                  and email each registered owner with the reason you select below.
                </>
              )}
            </p>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Reason
            </label>
            <select
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              value={suspendReasonKey}
              disabled={suspending}
              onChange={(e) =>
                setSuspendReasonKey(
                  e.target.value as AdminBusinessSuspensionReasonKey
                )
              }
            >
              {ADMIN_BUSINESS_SUSPENSION_REASON_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Additional details (optional)
            </label>
            <textarea
              className="mt-1 min-h-[100px] w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              placeholder="Optional extra context for the owner (shown in the email if provided)."
              maxLength={2000}
              value={suspendCustomNote}
              disabled={suspending}
              onChange={(e) => setSuspendCustomNote(e.target.value)}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Up to 2,000 characters. Leave blank if the preset reason is enough.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={suspending}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                onClick={closeSuspendModal}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={suspending}
                className="rounded-md bg-[#124541] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3834] disabled:opacity-50"
                onClick={() => void handleConfirmSuspendWithNotice()}
              >
                {suspending ? "Suspending…" : "Suspend & send notice"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <AdminTableShell
        title="Businesses"
        controls={
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              placeholder="Search by name or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="min-w-[180px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800 placeholder:text-neutral-400"
            />
            <div className="flex flex-col gap-0.5">
              <label className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                Admin action (filter)
              </label>
              <select
                value={adminActionPreset}
                onChange={(e) => handleAdminActionPresetChange(e.target.value)}
                className="min-w-[200px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
              >
                <option value="">All actions</option>
                <option value="activate">Activate</option>
                <option value="suspended">Suspended</option>
                <option value="under_review">Under review</option>
                <option value="approved">Approved</option>
              </select>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
              title="Status column filter"
            >
              <option value="">All statuses</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="under_review">Under review</option>
            </select>
            <select
              value={submissionFilter}
              onChange={(e) => handleSubmissionChange(e.target.value)}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
              title="Submission column filter"
            >
              <option value="">All submissions</option>
              <option value="pending">Pending</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under review</option>
              <option value="approved">Approved</option>
              <option value="suspended">Suspended</option>
            </select>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="admin-biz-country-filter"
                className="whitespace-nowrap text-xs text-neutral-500"
              >
                Country
              </label>
              <select
                id="admin-biz-country-filter"
                value={countryFilter}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-sm text-neutral-800"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.code === "ALL" ? "" : c.code}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <label
                htmlFor="admin-biz-category-filter"
                className="whitespace-nowrap text-xs text-neutral-500"
              >
                Category
              </label>
              <select
                id="admin-biz-category-filter"
                value={categoryFilter}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="min-w-[140px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
              >
                <option value="">All categories</option>
                {categoryOptions.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name?.trim() || c.slug}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={String(limit)}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
            >
              <option value="10">10 per page</option>
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="1000">1000 per page</option>
            </select>
          </div>
        }
      >
        <div className="w-full">
          {selectedIds.size > 0 ? (
            <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg border border-[#1FAF9E]/25 bg-[#1FAF9E]/8 px-3 py-2.5 text-xs">
              <span className="font-semibold text-neutral-800">
                {selectedIds.size} selected
              </span>
              <span className="text-neutral-500">Bulk:</span>
              {bulkUpdating ? (
                <span className="text-neutral-600">Applying updates…</span>
              ) : null}
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => void runBulkPreset("activate")}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
              >
                Activate
              </button>
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => openSuspendModalBulk([...selectedIds])}
                className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
              >
                Suspended
              </button>
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => void runBulkPreset("under_review")}
                className="rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
              >
                Under review
              </button>
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => void runBulkPreset("approved")}
                className="rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
              >
                Approved
              </button>
              <button
                type="button"
                disabled={bulkUpdating}
                onClick={() => setSelectedIds(new Set())}
                className="ml-1 rounded-md px-2 py-1 font-medium text-neutral-600 hover:text-neutral-900"
              >
                Clear
              </button>
            </div>
          ) : null}
          {!loading && rows.length === 0 && !listError ? (
            <div className="p-4">
              <AdminEmptyState message="No businesses match your filters." />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                <tr>
                  <th className="w-10 px-2 py-2 font-medium">
                    <input
                      ref={headerSelectRef}
                      type="checkbox"
                      className="h-4 w-4 rounded border-neutral-300 text-[#1FAF9E] focus:ring-[#1FAF9E]"
                      checked={allOnPageSelected && visibleIds.length > 0}
                      disabled={loading || bulkUpdating || visibleIds.length === 0}
                      onChange={toggleSelectPage}
                      aria-label="Select all businesses on this page"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium">Business ID</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Website</th>
                  <th className="px-3 py-2 font-medium">Country</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Submission</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Source</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-sm text-neutral-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-sm text-neutral-500">
                      Unable to load businesses.
                    </td>
                  </tr>
                ) : (
                  rows.map((row, i) => {
                    const id = businessId(row);
                    if (!id) return null;
                    const countryCode =
                      row.country_code?.trim() || row.country?.trim() || "";
                    const category =
                      row.category?.trim() || row.category_slug?.trim() || "-";
                    const websiteRaw = row.website?.trim() || "";
                    const href = websiteHref(row.website);
                    const statusLabel = row.status?.trim() || "-";
                    const normalizedRowStatus =
                      row.status?.trim().toLowerCase() ?? "";
                    const isSuspended = normalizedRowStatus === "suspended";

                    return (
                      <tr
                        key={id || `b-${i}`}
                        className="bg-white align-top"
                        aria-selected={selectedIds.has(id)}
                      >
                        <td className="px-2 py-2 align-middle">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-neutral-300 text-[#1FAF9E] focus:ring-[#1FAF9E]"
                            checked={selectedIds.has(id)}
                            disabled={loading || bulkUpdating}
                            onChange={() => toggleSelectRow(id)}
                            aria-label={`Select ${row.name?.trim() || id}`}
                          />
                        </td>
                        <td
                          className="max-w-[100px] truncate px-3 py-2 font-mono text-xs text-neutral-700"
                          title={id}
                        >
                          {truncateBusinessId(id)}
                        </td>
                        <td className="max-w-[160px] px-3 py-2 font-medium text-neutral-900">
                          <Link
                            href={`/admin/businesses/${id}`}
                            className="text-black hover:underline"
                          >
                            {row.name?.trim() || "-"}
                          </Link>
                        </td>
                        <td
                          className="max-w-[160px] truncate px-3 py-2 text-neutral-700"
                          title={websiteRaw}
                        >
                          {href ? (
                            <a
                              href={href}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#1FAF9E] hover:underline"
                            >
                              {websiteRaw || href}
                            </a>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {adminCountryDisplay(countryCode)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {statusLabel === "-" ? (
                            "-"
                          ) : (
                            <StatusPill status={statusLabel} />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {row.submission_status?.trim() || "-"}
                        </td>
                        <td
                          className="max-w-[120px] truncate px-3 py-2 text-neutral-700"
                          title={category}
                        >
                          {category}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          <span className="rounded bg-gray-100 px-2 py-1 text-xs">
                            {sourceLabel(row.source)}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex max-w-[320px] flex-wrap gap-1">
                            <button
                              type="button"
                              disabled={updatingId === id || deletingId === id}
                              onClick={() => handleApproveWithNotice(id)}
                              className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                            >
                              {updatingId === id
                                ? "Updating..."
                                : isSuspended
                                  ? "Unsuspend"
                                  : "Activate"}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === id || deletingId === id}
                              onClick={() =>
                                openSuspendModalSingle(id, row.name?.trim() || id)
                              }
                              className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-50"
                            >
                              {updatingId === id ? "Updating..." : "Suspended"}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === id || deletingId === id}
                              onClick={() =>
                                handleStatusUpdate(id, "under_review", "under_review")
                              }
                              className="rounded-md border border-sky-200 bg-sky-50 px-2 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-100 disabled:opacity-50"
                            >
                              {updatingId === id ? "Updating..." : "Under review"}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === id || deletingId === id}
                              onClick={() => handleApproveWithNotice(id)}
                              className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-semibold text-teal-800 hover:bg-teal-100 disabled:opacity-50"
                            >
                              {updatingId === id ? "Updating..." : "Approved"}
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === id || updatingId === id}
                              onClick={() => handleDelete(id)}
                              className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              {deletingId === id ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          <div className="flex flex-col gap-3 border-t border-neutral-100 bg-neutral-50/80 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-neutral-600">
              Showing {startIdx}–{endIdx} of {totalCount}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={!canPrev || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={!canNext || loading}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </AdminTableShell>
    </div>
  );
}
