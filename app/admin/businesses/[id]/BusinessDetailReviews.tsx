"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  adminDeleteReviewAction,
  adminMarkReviewRiskReviewedAction,
  adminUpdateReviewVisibilityAction,
} from "../../actions";
import AdminActionMessage from "@/components/admin/AdminActionMessage";
import AdminEmptyState from "@/components/admin/AdminEmptyState";
import AdminRiskBadge from "@/components/admin/AdminRiskBadge";
import { parseReviewRiskReasons } from "@/lib/reviews/riskScoring";

export type AdminBusinessDetailReviewRow = {
  id: string;
  rating: number | null;
  title: string | null;
  body: string | null;
  guest_name: string | null;
  guest_email: string | null;
  author_email: string | null;
  created_at: string | null;
  risk_score: number | null;
  risk_status: string | null;
  is_flagged: boolean | null;
  moderation_reason: string | null;
  visibility: string | null;
  invite_id: string | null;
  status: string | null;
};

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString();
}

function reviewerLabel(row: AdminBusinessDetailReviewRow): string {
  const email =
    row.guest_email?.trim() ||
    row.author_email?.trim() ||
    row.guest_name?.trim();
  return email || "Anonymous";
}

function visibilityLabel(v: string | null | undefined): string {
  const s = v?.trim();
  if (s === "hidden") return "Hidden everywhere";
  if (s === "landing_hidden") return "Hidden on landing";
  return "Visible";
}

type Props = {
  businessId: string;
  reviews: AdminBusinessDetailReviewRow[];
};

export default function BusinessDetailReviews({ businessId, reviews }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState(reviews);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function runAction(
    reviewId: string,
    fn: () => Promise<{ ok: boolean; error?: string }>,
    onSuccess?: () => void,
  ) {
    setPendingId(reviewId);
    setError(null);
    try {
      const res = await fn();
      if (!res.ok) {
        setError(res.error ?? "Action failed");
        return;
      }
      onSuccess?.();
      router.refresh();
    } finally {
      setPendingId(null);
    }
  }

  if (rows.length === 0) {
    return <AdminEmptyState message="No reviews for this business yet." />;
  }

  return (
    <div className="space-y-4">
      {error ? <AdminActionMessage type="error" text={error} /> : null}
      <p className="text-sm text-neutral-600">
        Fraud risk scores and moderation actions for each review on this business.
      </p>
      <div className="space-y-4">
        {rows.map((row) => {
          const reasons = parseReviewRiskReasons(row.moderation_reason);
          const busy = pendingId === row.id;
          const visibility = row.visibility?.trim() || "visible";

          return (
            <article
              key={row.id}
              className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-900">
                      {reviewerLabel(row)}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {formatDate(row.created_at)}
                    </span>
                    {row.rating != null ? (
                      <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-900">
                        {row.rating}★
                      </span>
                    ) : null}
                    {row.is_flagged ? (
                      <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-800">
                        Flagged
                      </span>
                    ) : null}
                  </div>
                  {row.title?.trim() ? (
                    <h4 className="mt-1 text-sm font-medium text-neutral-800">
                      {row.title.trim()}
                    </h4>
                  ) : null}
                  {row.body?.trim() ? (
                    <p className="mt-2 text-sm text-neutral-700 whitespace-pre-wrap">
                      {row.body.trim()}
                    </p>
                  ) : null}
                </div>
                <div className="text-right">
                  <AdminRiskBadge
                    status={row.risk_status}
                    score={row.risk_score}
                  />
                  {typeof row.risk_score === "number" ? (
                    <p className="mt-1 text-[10px] text-neutral-500">
                      Score: {row.risk_score}/100
                    </p>
                  ) : null}
                </div>
              </div>

              {reasons.length > 0 ? (
                <div className="mt-3 rounded-md border border-amber-100 bg-amber-50/60 p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-amber-900">
                    Risk signals
                  </p>
                  <ul className="mt-1 list-inside list-disc text-xs text-amber-950">
                    {reasons.map((reason) => (
                      <li key={reason}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
                <span className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  Visibility: {visibilityLabel(visibility)}
                </span>
                {row.invite_id ? (
                  <span className="text-[10px] text-neutral-500">
                    Invite flow
                  </span>
                ) : (
                  <span className="text-[10px] text-neutral-500">
                    Direct submission
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {row.is_flagged ? (
                  <button
                    type="button"
                    disabled={busy}
                    className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50"
                    onClick={() =>
                      void runAction(row.id, () =>
                        adminMarkReviewRiskReviewedAction(row.id),
                      ).then(() => {
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, is_flagged: false } : r,
                          ),
                        );
                      })
                    }
                  >
                    Mark as reviewed
                  </button>
                ) : null}
                <select
                  disabled={busy}
                  className="rounded-md border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-800"
                  value={visibility}
                  onChange={(e) => {
                    const next = e.target.value as
                      | "visible"
                      | "hidden"
                      | "landing_hidden";
                    void runAction(
                      row.id,
                      () => adminUpdateReviewVisibilityAction(row.id, next),
                      () => {
                        setRows((prev) =>
                          prev.map((r) =>
                            r.id === row.id ? { ...r, visibility: next } : r,
                          ),
                        );
                      },
                    );
                  }}
                >
                  <option value="visible">Visible</option>
                  <option value="landing_hidden">Hide on landing</option>
                  <option value="hidden">Hide everywhere</option>
                </select>
                <button
                  type="button"
                  disabled={busy}
                  className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-900 hover:bg-red-100 disabled:opacity-50"
                  onClick={() => {
                    if (
                      !window.confirm(
                        "Permanently delete this review? This cannot be undone.",
                      )
                    ) {
                      return;
                    }
                    void runAction(
                      row.id,
                      () => adminDeleteReviewAction(row.id),
                      () => {
                        setRows((prev) => prev.filter((r) => r.id !== row.id));
                      },
                    );
                  }}
                >
                  Delete
                </button>
              </div>
            </article>
          );
        })}
      </div>
      <input type="hidden" name="business_id" value={businessId} />
    </div>
  );
}
