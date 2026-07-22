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
import {
  ADMIN_REVIEW_WARNING_REASON_OPTIONS,
  type AdminReviewWarningReasonKey,
} from "@/lib/adminReviewWarningReasons";

function reviewId(row: AdminReviewRow): string {
  return String(row.review_id ?? row.id ?? "");
}

function bodyPreview(row: AdminReviewRow): string {
  const raw = row.body_preview ?? row.body;
  if (!raw) return "-";
  const s = String(raw).replace(/\s+/g, " ").trim();
  return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

function formatDateTime(date: string) {
  const d = new Date(date);
  return (
    d.getFullYear() +
    "/" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "/" +
    String(d.getDate()).padStart(2, "0") +
    " " +
    String(d.getHours()).padStart(2, "0") +
    ":" +
    String(d.getMinutes()).padStart(2, "0")
  );
}

/** Row shape for handlers / buttons (stable id, visibility, is_flagged). */
type AdminReviewTableRow = AdminReviewRow & {
  id: string;
  visibility: "visible" | "hidden" | "landing_hidden";
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
  nextVisibility: "visible" | "hidden" | "landing_hidden"
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

function formatVisibilityLabel(visibility: AdminReviewTableRow["visibility"]): string {
  if (visibility === "hidden") return "hidden everywhere";
  if (visibility === "landing_hidden") return "hidden on landing";
  return "visible";
}

/** Wrap + select styling so non-default moderation states scan clearly in the Actions column. */
function visibilityControlWrapClass(visibility: AdminReviewTableRow["visibility"]): string {
  if (visibility === "hidden") {
    return "rounded-md border border-red-200 bg-red-50/80 p-1.5 ring-1 ring-red-100";
  }
  if (visibility === "landing_hidden") {
    return "rounded-md border border-amber-200 bg-amber-50/80 p-1.5 ring-1 ring-amber-100";
  }
  return "rounded-md border border-emerald-100 bg-emerald-50/40 p-1.5 ring-1 ring-emerald-50";
}

function visibilitySelectClass(visibility: AdminReviewTableRow["visibility"]): string {
  const base =
    "h-8 w-full max-w-[220px] rounded-md px-2 text-xs font-semibold shadow-sm focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50";
  if (visibility === "hidden") {
    return `${base} border border-red-300 bg-white text-red-950 focus:border-red-400 focus:ring-red-200`;
  }
  if (visibility === "landing_hidden") {
    return `${base} border border-amber-300 bg-white text-amber-950 focus:border-amber-400 focus:ring-amber-200`;
  }
  return `${base} border border-emerald-200 bg-white text-emerald-950 focus:border-emerald-400 focus:ring-emerald-200`;
}

function visibilityLabelClass(visibility: AdminReviewTableRow["visibility"]): string {
  const base = "text-[10px] font-bold uppercase tracking-wide";
  if (visibility === "hidden") return `${base} text-red-800`;
  if (visibility === "landing_hidden") return `${base} text-amber-900`;
  return `${base} text-emerald-900`;
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
  const [warningModalReview, setWarningModalReview] = useState<AdminReviewTableRow | null>(null);
  const [warningReasonKey, setWarningReasonKey] =
    useState<AdminReviewWarningReasonKey>("general");
  const [warningCustomNote, setWarningCustomNote] = useState("");

  /** Ensures useEffect runs when moderation fields change even if the array reference is reused. */
  const initialReviewsServerSignature = initialReviews
    .map(
      (r) =>
        `${reviewId(r)}:${String(r.visibility ?? "").trim()}:${r.is_flagged === true ? "1" : "0"}:${r.prior_guidelines_warning === true ? "1" : "0"}`
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

  useEffect(() => {
    if (!warningModalReview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pendingActionKey?.endsWith(":warn")) return;
      setWarningModalReview(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [warningModalReview, pendingActionKey]);

  const openWarningModal = (review: AdminReviewTableRow) => {
    const email = review.reviewer_email?.trim();
    if (!email || email === "-") {
      alert("No reviewer email on file for this review.");
      return;
    }
    setWarningReasonKey("general");
    setWarningCustomNote("");
    setWarningModalReview(review);
  };

  const handleBlockEmail = async (review: AdminReviewTableRow) => {
    const email = review.reviewer_email?.trim();
    if (!email || email === "-") {
      alert("No reviewer email on file for this review.");
      return;
    }
    const ok = window.confirm(
      `Permanently block ${email}?\n\nThis deletes ALL reviews from this email across Tellacity and blocks them from writing reviews or creating/claiming businesses.`,
    );
    if (!ok) return;
    const key = `${review.id}:block`;
    setPendingActionKey(key);
    try {
      const res = await fetch("/api/admin/blocked-emails", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          reason: "Blocked from admin reviews (spam/abuse)",
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        deletedReviews?: number;
      };
      if (!res.ok) {
        alert(data.error || "Failed to block email.");
        return;
      }
      alert(
        `Blocked ${email}. Deleted ${data.deletedReviews ?? 0} review(s).`,
      );
      await router.refresh();
    } catch {
      alert("Failed to block email.");
    } finally {
      setPendingActionKey(null);
    }
  };

  const handleSetVisibility = async (
    review: AdminReviewTableRow,
    newStatus: AdminReviewTableRow["visibility"]
  ) => {
    console.log("[AdminReviews] visibility click", review.id, review.visibility, newStatus);
    const key = `${review.id}:visibility`;
    setPendingActionKey(key);
    try {
      const result = await adminUpdateReviewVisibilityAction(review.id, newStatus);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      const nextVis = result.nextVisibility;
      if (
        nextVis === "visible" ||
        nextVis === "hidden" ||
        nextVis === "landing_hidden"
      ) {
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

  const handleConfirmWarningSend = async () => {
    if (!warningModalReview) return;
    const email = warningModalReview.reviewer_email?.trim();
    if (!email || email === "-") return;

    const reviewIdSending = warningModalReview.id;
    const key = `${reviewIdSending}:warn`;
    setPendingActionKey(key);
    try {
      const res = await fetch("/api/admin/reviews/send-guidelines-warning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId: reviewIdSending,
          reasonKey: warningReasonKey,
          customNote: warningCustomNote.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        recipient?: string;
        warning?: string;
      };
      if (!res.ok) {
        alert(data.error || "Failed to send email.");
        return;
      }
      const recipientFinal = data.recipient ?? email;
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewIdSending
            ? { ...r, is_flagged: true, prior_guidelines_warning: true }
            : r
        )
      );
      setWarningModalReview(null);
      if (data.warning) {
        alert(`${data.warning}\n\nGuidelines warning sent to ${recipientFinal}.`);
      } else {
        alert(`Guidelines warning sent to ${recipientFinal}.`);
      }
      await router.refresh();
    } catch {
      alert("Failed to send email.");
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

      {warningModalReview ? (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-warning-modal-title"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !pendingActionKey?.endsWith(":warn")) {
              setWarningModalReview(null);
            }
          }}
        >
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5 shadow-xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <h2 id="admin-warning-modal-title" className="text-lg font-semibold text-neutral-900">
              Send guidelines warning
            </h2>
            <p className="mt-1 text-sm text-neutral-600">
              No-reply email to{" "}
              <span className="font-medium text-neutral-900">
                {warningModalReview.reviewer_email?.trim() || "-"}
              </span>
              . They will see your selected reason and any note below.
            </p>
            {warningModalReview.prior_guidelines_warning ? (
              <div
                className="mt-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-950"
                role="status"
              >
                You already sent a guidelines warning for this review. You can send another if you
                need to.
              </div>
            ) : null}

            <label className="mt-4 block text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Reason
            </label>
            <select
              className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm text-neutral-900 focus:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-200"
              value={warningReasonKey}
              disabled={pendingActionKey?.endsWith(":warn")}
              onChange={(e) =>
                setWarningReasonKey(e.target.value as AdminReviewWarningReasonKey)
              }
            >
              {ADMIN_REVIEW_WARNING_REASON_OPTIONS.map((opt) => (
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
              placeholder="Optional extra context for the reviewer (shown in the email if provided)."
              maxLength={2000}
              value={warningCustomNote}
              disabled={pendingActionKey?.endsWith(":warn")}
              onChange={(e) => setWarningCustomNote(e.target.value)}
            />
            <p className="mt-1 text-xs text-neutral-500">
              Up to 2,000 characters. Leave blank if the preset reason is enough.
            </p>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={pendingActionKey?.endsWith(":warn")}
                className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                onClick={() => setWarningModalReview(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pendingActionKey?.endsWith(":warn")}
                className="rounded-md bg-[#124541] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3834] disabled:opacity-50"
                onClick={() => void handleConfirmWarningSend()}
              >
                {pendingActionKey?.endsWith(":warn") ? "Sending…" : "Send warning email"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
                    const warnPending = pendingActionKey === `${review.id}:warn`;
                    const delPending = pendingActionKey === `${review.id}:delete`;
                    const blockPending = pendingActionKey === `${review.id}:block`;
                    const rowBusy =
                      visPending || flagPending || warnPending || delPending || blockPending;
                    return (
                      <tr key={review.id || `r-${i}`} className="bg-white align-top">
                        <td className="max-w-[140px] px-3 py-2 font-medium text-neutral-900">
                          {review.business_slug?.trim() ? (
                            <Link
                              href={`/b/${review.business_slug.trim()}`}
                              className="text-teal-700 underline-offset-2 hover:underline"
                            >
                              {review.business_name?.trim() || review.business_slug.trim()}
                            </Link>
                          ) : (
                            review.business_name?.trim() || "-"
                          )}
                        </td>
                        <td
                          className="max-w-[220px] truncate px-3 py-2 text-neutral-700"
                          title={review.reviewer_email ?? ""}
                        >
                          {review.reviewer_email?.trim() || "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {review.rating != null ? String(review.rating) : "-"}
                        </td>
                        <td
                          className="max-w-[160px] truncate px-3 py-2 text-neutral-700"
                          title={review.title ?? ""}
                        >
                          {review.title?.trim() || "-"}
                        </td>
                        <td className="max-w-[240px] px-3 py-2 text-neutral-600">{bodyPreview(review)}</td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {review.verification_status?.trim() || "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {review.status?.trim() || "-"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {formatVisibilityLabel(review.visibility)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-700">
                          {review.is_flagged ? "Yes" : "No"}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2 text-neutral-600">
                          {review.created_at &&
                          !Number.isNaN(new Date(review.created_at).getTime())
                            ? formatDateTime(review.created_at)
                            : "-"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex max-w-[280px] flex-wrap items-center gap-1">
                            <div
                              className={`flex min-w-[200px] flex-col gap-0.5 ${visibilityControlWrapClass(
                                review.visibility
                              )}`}
                            >
                              <label
                                className={visibilityLabelClass(review.visibility)}
                                htmlFor={`review-vis-${review.id}`}
                              >
                                Public visibility
                              </label>
                              <select
                                id={`review-vis-${review.id}`}
                                disabled={rowBusy}
                                className={visibilitySelectClass(review.visibility)}
                                value={review.visibility}
                                onChange={(e) => {
                                  const next = e.target.value as AdminReviewTableRow["visibility"];
                                  if (next === review.visibility) return;
                                  void handleSetVisibility(review, next);
                                }}
                              >
                                <option value="visible">Visible everywhere</option>
                                <option value="landing_hidden">Hidden from landing only</option>
                                <option value="hidden">Hidden everywhere</option>
                              </select>
                              {visPending ? (
                                <span className="text-[10px] text-neutral-500">Updating…</span>
                              ) : null}
                            </div>
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
                              title="Email reviewer a guidelines notice (no-reply)"
                              onClick={() => openWarningModal(review)}
                              className="rounded-md border border-sky-600 bg-white px-2 py-1 text-xs font-semibold text-sky-900 hover:bg-sky-50 disabled:opacity-50"
                            >
                              {warnPending ? "…" : "Warning"}
                            </button>
                            <button
                              type="button"
                              disabled={rowBusy}
                              title="Permanently block this email and delete all their reviews"
                              onClick={() => void handleBlockEmail(review)}
                              className="rounded-md border border-red-700 bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                            >
                              {blockPending ? "…" : "Block email"}
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
