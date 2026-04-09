"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import {
  adminDeleteReviewAction,
  adminUpdateReviewFlagAction,
  adminUpdateReviewVisibilityAction,
} from "../../../app/admin/actions";
import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminTableShell from "@/components/admin/AdminTableShell";
import {
  ADMIN_REVIEWS_PAGE_SIZE,
  adminReviewIsFlagged,
  adminReviewVisibility,
  applyAdminReviewsListFilter,
  type AdminReviewListFilter,
  type AdminReviewRow,
} from "@/lib/admin";

function reviewId(row: AdminReviewRow): string {
  return String(row.review_id ?? row.id ?? "");
}

function bodyPreview(row: AdminReviewRow): string {
  const raw = row.body_preview ?? row.body;
  if (!raw) return "—";
  const s = String(raw).replace(/\s+/g, " ").trim();
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

function formatDate(date: string) {
  const d = new Date(date);
  return (
    d.getFullYear() +
    "/" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "/" +
    String(d.getDate()).padStart(2, "0")
  );
}

/** Row shape for handlers / buttons (stable id, visibility, is_flagged). */
type AdminReviewTableRow = AdminReviewRow & {
  id: string;
  visibility: "visible" | "hidden";
  is_flagged: boolean;
};

function normalizeReview(row: AdminReviewRow): AdminReviewTableRow | null {
  const id = reviewId(row);
  if (!id) return null;
  return {
    ...row,
    id,
    visibility: adminReviewVisibility(row),
    is_flagged: adminReviewIsFlagged(row),
  };
}

function normalizeReviews(rows: AdminReviewRow[]): AdminReviewTableRow[] {
  return rows.map(normalizeReview).filter((r): r is AdminReviewTableRow => r != null);
}

/** Apply RPC-confirmed visibility; re-apply list filter so rows drop out of Flagged/Hidden tabs. */
function mergeVisibilityIntoRows(
  prev: AdminReviewTableRow[],
  listFilter: AdminReviewListFilter,
  reviewId: string,
  nextVisibility: "visible" | "hidden"
): AdminReviewTableRow[] {
  const updated = prev.map((r) =>
    r.id === reviewId ? { ...r, visibility: nextVisibility } : r
  );
  if (listFilter === "all") return updated;
  return normalizeReviews(
    applyAdminReviewsListFilter(updated as AdminReviewRow[], listFilter).slice(
      0,
      ADMIN_REVIEWS_PAGE_SIZE
    )
  );
}

function mergeFlagIntoRows(
  prev: AdminReviewTableRow[],
  listFilter: AdminReviewListFilter,
  reviewId: string,
  nextFlagged: boolean
): AdminReviewTableRow[] {
  const updated = prev.map((r) =>
    r.id === reviewId ? { ...r, is_flagged: nextFlagged } : r
  );
  if (listFilter === "all") return updated;
  return normalizeReviews(
    applyAdminReviewsListFilter(updated as AdminReviewRow[], listFilter).slice(
      0,
      ADMIN_REVIEWS_PAGE_SIZE
    )
  );
}

function adminReviewsListUrl(filter: AdminReviewListFilter, page: number): string {
  const p = new URLSearchParams();
  p.set("filter", filter);
  if (page > 1) p.set("page", String(page));
  return `/admin/reviews?${p.toString()}`;
}

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  totalRows: number;
  pageSize: number;
};

type Props = {
  listFilter: AdminReviewListFilter;
  initialReviews: AdminReviewRow[];
  initialListError: string | null;
  urlError: string | undefined;
  pagination: PaginationProps;
};

export default function AdminReviewsClient({
  listFilter,
  initialReviews,
  initialListError,
  urlError,
  pagination,
}: Props) {
  const router = useRouter();
  const [reviews, setReviews] = useState<AdminReviewTableRow[]>(() =>
    normalizeReviews(initialReviews)
  );
  const [listError, setListError] = useState<string | null>(initialListError);
  const [pendingActionKey, setPendingActionKey] = useState<string | null>(null);

  /** Ensures useEffect runs when moderation fields change even if the array reference is reused. */
  const initialReviewsServerSignature = initialReviews
    .map(
      (r) =>
        `${reviewId(r)}:${String(r.visibility ?? "").trim()}:${r.is_flagged === true ? "1" : "0"}`
    )
    .join("|");

  useEffect(() => {
    setReviews(normalizeReviews(initialReviews));
    const first = initialReviews[0];
    console.log("[AdminReviews] sync from server props", {
      length: initialReviews.length,
      first: first
        ? { visibility: first.visibility, is_flagged: first.is_flagged }
        : null,
    });
  }, [initialReviews, initialReviewsServerSignature]);

  useEffect(() => {
    setListError(initialListError);
  }, [initialListError]);

  const handleToggleVisibility = async (review: AdminReviewTableRow) => {
    console.log("[AdminReviews] hide/show click", review.id, review.visibility);
    const newStatus = review.visibility === "visible" ? "hidden" : "visible";
    const key = `${review.id}:visibility`;
    setPendingActionKey(key);
    try {
      const result = await adminUpdateReviewVisibilityAction(review.id, newStatus);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      const nextVis = result.nextVisibility;
      if (nextVis === "visible" || nextVis === "hidden") {
        setReviews((prev) => mergeVisibilityIntoRows(prev, listFilter, result.reviewId, nextVis));
      }
      await router.refresh();
    } finally {
      setPendingActionKey(null);
    }
  };

  const handleToggleFlag = async (review: AdminReviewTableRow) => {
    console.log("[AdminReviews] flag click", review.id, review.is_flagged);
    const newFlag = !review.is_flagged;
    const key = `${review.id}:flag`;
    setPendingActionKey(key);
    try {
      const result = await adminUpdateReviewFlagAction(review.id, newFlag);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      const nextFlag = result.nextFlagged;
      if (typeof nextFlag === "boolean") {
        setReviews((prev) => mergeFlagIntoRows(prev, listFilter, result.reviewId, nextFlag));
      }
      await router.refresh();
    } finally {
      setPendingActionKey(null);
    }
  };

  const handleDelete = async (review: AdminReviewTableRow) => {
    if (
      !confirm(
        "Permanently delete this review? Replies and votes tied to it will be removed. This cannot be undone."
      )
    ) {
      return;
    }
    const key = `${review.id}:delete`;
    setPendingActionKey(key);
    try {
      const result = await adminDeleteReviewAction(review.id);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      if (result.deleted) {
        setReviews((prev) => prev.filter((r) => r.id !== result.reviewId));
      }
      await router.refresh();
    } finally {
      setPendingActionKey(null);
    }
  };

  const filterLinkClass = (key: AdminReviewListFilter) =>
    `rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
      listFilter === key
        ? "bg-neutral-900 text-white"
        : "border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
    }`;

  const { currentPage, totalPages, totalRows, pageSize } = pagination;
  const pageStart = (currentPage - 1) * pageSize;
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-4">
      {urlError ? <AdminActionMessage type="error" text={urlError} /> : null}
      {listError ? <AdminActionMessage type="error" text={listError} /> : null}

      <AdminTableShell
        title="Reviews"
        controls={
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-neutral-500">Filter:</span>
            <Link href="/admin/reviews?filter=all" className={filterLinkClass("all")}>
              All
            </Link>
            <Link href="/admin/reviews?filter=flagged" className={filterLinkClass("flagged")}>
              Flagged
            </Link>
            <Link href="/admin/reviews?filter=hidden" className={filterLinkClass("hidden")}>
              Hidden
            </Link>
          </div>
        }
      >
        {reviews.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState message="No reviews match this filter." />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-neutral-100 bg-neutral-50 text-xs font-medium uppercase text-neutral-500">
                  <tr>
                    <th className="px-3 py-2 font-medium">Business</th>
                    <th className="px-3 py-2 font-medium">Email</th>
                    <th className="px-3 py-2 font-medium">Rating</th>
                    <th className="px-3 py-2 font-medium">Title</th>
                    <th className="px-3 py-2 font-medium">Body preview</th>
                    <th className="px-3 py-2 font-medium">Verification</th>
                    <th className="px-3 py-2 font-medium">Publication</th>
                    <th className="px-3 py-2 font-medium">Visibility</th>
                    <th className="px-3 py-2 font-medium">Flagged</th>
                    <th className="px-3 py-2 font-medium">Created</th>
                    <th className="px-3 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {reviews.map((review, i) => {
                    const visPending = pendingActionKey === `${review.id}:visibility`;
                    const flagPending = pendingActionKey === `${review.id}:flag`;
                    const delPending = pendingActionKey === `${review.id}:delete`;
                    const rowBusy = visPending || flagPending || delPending;
                    return (
                      <tr key={review.id || `r-${i}`} className="bg-white align-top">
                        <td className="max-w-[140px] px-3 py-2 font-medium text-neutral-900">
                          {review.business_name?.trim() || "—"}
                        </td>
                        <td
                          className="max-w-[220px] truncate px-3 py-2 text-neutral-700"
                          title={review.reviewer_email ?? ""}
                        >
                          {review.reviewer_email?.trim() || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {review.rating != null ? String(review.rating) : "—"}
                        </td>
                        <td
                          className="max-w-[160px] truncate px-3 py-2 text-neutral-700"
                          title={review.title ?? ""}
                        >
                          {review.title?.trim() || "—"}
                        </td>
                        <td className="max-w-[240px] px-3 py-2 text-neutral-600">{bodyPreview(review)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {review.verification_status?.trim() || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {review.status?.trim() || "—"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">{review.visibility}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {review.is_flagged ? "Yes" : "No"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                          {review.created_at &&
                          !Number.isNaN(new Date(review.created_at).getTime())
                            ? formatDate(review.created_at)
                            : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex max-w-[280px] flex-wrap gap-1">
                            <button
                              type="button"
                              disabled={rowBusy}
                              onClick={() => void handleToggleVisibility(review)}
                              className={
                                review.visibility === "visible"
                                  ? "rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
                                  : "rounded-md border border-emerald-600 bg-emerald-600 px-2 py-1 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              }
                            >
                              {visPending ? "…" : review.visibility === "visible" ? "Hide" : "Show Review"}
                            </button>
                            <button
                              type="button"
                              disabled={rowBusy}
                              onClick={() => void handleToggleFlag(review)}
                              className={
                                review.is_flagged
                                  ? "rounded-md border border-amber-600 bg-white px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-50 disabled:opacity-50"
                                  : "rounded-md bg-amber-500 px-2 py-1 text-xs font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
                              }
                            >
                              {flagPending ? "…" : review.is_flagged ? "Unflag" : "Flag"}
                            </button>
                            <button
                              type="button"
                              disabled={rowBusy}
                              title="Delete review permanently"
                              aria-label="Delete review"
                              onClick={() => void handleDelete(review)}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-red-200 bg-white text-red-700 hover:bg-red-50 disabled:opacity-50"
                            >
                              {delPending ? (
                                <span className="text-xs font-semibold">…</span>
                              ) : (
                                <Trash2 className="h-4 w-4" aria-hidden />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {totalRows > 0 ? (
              <div className="flex items-center justify-between gap-3 border-t border-neutral-100 px-3 py-3 text-xs text-neutral-600">
                <span>
                  Showing {pageStart + 1}-{Math.min(pageStart + pageSize, totalRows)} of {totalRows}
                </span>
                <div className="flex items-center gap-2">
                  <Link
                    href={adminReviewsListUrl(listFilter, Math.max(1, currentPage - 1))}
                    aria-disabled={!hasPrev}
                    className={`rounded-md border px-2 py-1 font-medium ${
                      hasPrev
                        ? "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                        : "pointer-events-none border-neutral-100 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    Previous
                  </Link>
                  <span>
                    Page {currentPage} of {totalPages}
                  </span>
                  <Link
                    href={adminReviewsListUrl(listFilter, currentPage + 1)}
                    aria-disabled={!hasNext}
                    className={`rounded-md border px-2 py-1 font-medium ${
                      hasNext
                        ? "border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
                        : "pointer-events-none border-neutral-100 bg-neutral-50 text-neutral-400"
                    }`}
                  >
                    Next
                  </Link>
                </div>
              </div>
            ) : null}
          </>
        )}
      </AdminTableShell>
    </div>
  );
}
