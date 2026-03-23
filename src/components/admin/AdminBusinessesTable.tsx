"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import type { AdminBusinessRow } from "@/lib/admin";
import { COUNTRIES, adminCountryDisplay } from "@/lib/adminCountries";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const BUSINESS_STATUS_OPTIONS = [
  "active",
  "suspended",
  "under_review",
] as const;

type BusinessStatus = (typeof BUSINESS_STATUS_OPTIONS)[number];

function isBusinessStatus(value: string): value is BusinessStatus {
  return (BUSINESS_STATUS_OPTIONS as readonly string[]).includes(value);
}

function businessId(row: AdminBusinessRow): string {
  return String(row.business_id ?? row.id ?? "");
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
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
  return <span className={cls}>{status.trim() || "—"}</span>;
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

  const handleStatusUpdate = useCallback(
    async (
      businessId: string,
      newStatus?: string,
      newSubmissionStatus?: string
    ) => {
      console.log("Updating business:", {
        businessId,
        newStatus,
        newSubmissionStatus,
      });

      if (!businessId) {
        window.alert("Missing business ID");
        return;
      }

      const target_business_id = businessId;
      const statusTrimmed = newStatus?.trim() ?? "";
      const submissionTrimmed = newSubmissionStatus?.trim() ?? "";
      const wantsStatus = statusTrimmed.length > 0;
      const wantsSubmission = submissionTrimmed.length > 0;

      let rpcNewStatus: string | null = null;
      let rpcNewSubmission: string | null = null;

      if (wantsStatus) {
        const normalizedStatus = statusTrimmed.toLowerCase();
        if (!isBusinessStatus(normalizedStatus)) {
          console.error("Invalid status attempted:", newStatus);
          window.alert("Invalid status value");
          return;
        }
        rpcNewStatus = normalizedStatus;
        rpcNewSubmission = null;
      }

      if (wantsSubmission) {
        rpcNewSubmission = submissionTrimmed.toLowerCase();
        if (!wantsStatus) {
          rpcNewStatus = null;
        }
      }

      if (!wantsStatus && !wantsSubmission) {
        window.alert("Nothing to update");
        return;
      }

      setUpdatingId(businessId);
      try {
        const supabase = supabaseBrowser();

        const { data, error } = await supabase.rpc(
          "admin_update_business_status",
          {
            new_status: rpcNewStatus,
            new_submission_status: rpcNewSubmission,
            target_business_id,
          }
        );

        console.log("RPC response:", { data, error });

        if (error) {
          console.error("FULL Supabase error:", error);
          console.error("STRINGIFIED:", JSON.stringify(error, null, 2));

          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase PostgrestError shape varies
          const message =
            (error as any)?.message ||
            (error as any)?.details ||
            "Unknown error occurred";

          window.alert(message);
          return;
        }

        setListRefreshToken((t) => t + 1);
        router.refresh();
      } catch (err) {
        console.error("Unexpected error:", err);
        window.alert("Unexpected failure during update.");
      } finally {
        setUpdatingId(null);
      }
    },
    [router]
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
    setStatusFilter(v);
    setPage(1);
  };

  const handleSubmissionChange = (v: string) => {
    setSubmissionFilter(v);
    setPage(1);
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
            <select
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-800"
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
            >
              <option value="">All submissions</option>
              <option value="approved">Approved</option>
              <option value="under_review">Under review</option>
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
              <option value="50">50 per page</option>
              <option value="100">100 per page</option>
              <option value="1000">1000 per page</option>
            </select>
          </div>
        }
      >
        <div className="w-full">
          {!loading && rows.length === 0 && !listError ? (
            <div className="p-4">
              <AdminEmptyState message="No businesses match your filters." />
            </div>
          ) : (
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Business ID</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Website</th>
                  <th className="px-3 py-2 font-medium">Country</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Submission</th>
                  <th className="px-3 py-2 font-medium">Category</th>
                  <th className="px-3 py-2 font-medium">Created</th>
                  <th className="px-3 py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-sm text-neutral-500">
                      Loading…
                    </td>
                  </tr>
                ) : rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center text-sm text-neutral-500">
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
                      row.category?.trim() || row.category_slug?.trim() || "—";
                    const websiteRaw = row.website?.trim() || "";
                    const href = websiteHref(row.website);
                    const statusLabel = row.status?.trim() || "—";
                    const normalizedRowStatus =
                      row.status?.trim().toLowerCase() ?? "";
                    const isSuspended = normalizedRowStatus === "suspended";

                    return (
                      <tr key={id || `b-${i}`} className="bg-white align-top">
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
                            {row.name?.trim() || "—"}
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
                            "—"
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {adminCountryDisplay(countryCode)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {statusLabel === "—" ? (
                            "—"
                          ) : (
                            <StatusPill status={statusLabel} />
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {row.submission_status?.trim() || "—"}
                        </td>
                        <td
                          className="max-w-[120px] truncate px-3 py-2 text-neutral-700"
                          title={category}
                        >
                          {category}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                          {formatDate(row.created_at)}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex max-w-[320px] flex-wrap gap-1">
                            <button
                              type="button"
                              disabled={updatingId === id || deletingId === id}
                              onClick={() => handleStatusUpdate(id, "active")}
                              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
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
                              onClick={() => handleStatusUpdate(id, "suspended")}
                              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {updatingId === id ? "Updating..." : "Suspended"}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === id || deletingId === id}
                              onClick={() => handleStatusUpdate(id, "under_review")}
                              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {updatingId === id ? "Updating..." : "Under review"}
                            </button>
                            <button
                              type="button"
                              disabled={updatingId === id || deletingId === id}
                              onClick={() =>
                                handleStatusUpdate(id, undefined, "approved")
                              }
                              className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                            >
                              {updatingId === id ? "Updating..." : "Approved"}
                            </button>
                            <button
                              type="button"
                              disabled={deletingId === id || updatingId === id}
                              onClick={() => handleDelete(id)}
                              className="rounded border border-red-300 px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
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
