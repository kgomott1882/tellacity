"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import AdminArticleModerationPreview, {
  type AdminArticlePreviewData,
} from "./AdminArticleModerationPreview";
import { articleDisplayTitle } from "@/lib/articles/articleDisplay";
import {
  ARTICLE_REJECTION_CUSTOM_ID,
  ARTICLE_REJECTION_REASON_PRESETS,
  articleRejectionReasonPreview,
  resolveArticleRejectionReason,
} from "@/lib/articles/articleRejectionReasons";
import type { ArticleContentDoc } from "@/lib/articles/types";

type QueueArticle = AdminArticlePreviewData & {
  id: string;
  slug: string;
  submitted_at: string | null;
  businessName: string | null;
  businessSlug: string | null;
  revisionId?: string | null;
  isRevisionUpdate?: boolean;
  liveTitle?: string | null;
  versionNumber?: number | null;
};

function emptyDoc(): ArticleContentDoc {
  return { type: "doc", content: [] };
}

export default function ArticlesModerationQueue() {
  const [articles, setArticles] = useState<QueueArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [expandedPreviewId, setExpandedPreviewId] = useState<string | null>(null);
  const [selectedReasonId, setSelectedReasonId] = useState<Record<string, string>>({});
  const [customReasonText, setCustomReasonText] = useState<Record<string, string>>({});
  const [adminCommentText, setAdminCommentText] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/articles", { cache: "no-store" });
      const body = (await res.json()) as { articles?: QueueArticle[]; error?: string };
      if (!res.ok) throw new Error(body.error ?? "Failed to load queue");
      const rows = body.articles ?? [];
      setArticles(rows);
      setExpandedPreviewId((prev) => {
        if (prev && rows.some((row) => row.id === prev)) return prev;
        return rows[0]?.id ?? null;
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const moderate = async (
    id: string,
    action: "approve" | "reject",
    reason?: string,
    revisionId?: string | null,
  ) => {
    setBusyId(revisionId ?? id);
    try {
      const res = await fetch(`/api/admin/articles/${encodeURIComponent(id)}/moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason: reason ?? null, revisionId: revisionId ?? null }),
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(body.error ?? "Moderation failed");
      await load();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Moderation failed");
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-neutral-600">Loading queue…</p>;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
        {error}
      </div>
    );
  }

  if (articles.length === 0) {
    return (
      <p className="text-sm text-neutral-600">
        Nothing is waiting on admin review. The sidebar notification clears when the queue is empty.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {articles.map((a) => {
        const displayTitle = articleDisplayTitle(a.title);
        const previewOpen = expandedPreviewId === (a.revisionId ?? a.id);
        const busyKey = a.revisionId ?? a.id;
        const reasonId = selectedReasonId[busyKey] ?? "";
        const isCustom = reasonId === ARTICLE_REJECTION_CUSTOM_ID;
        const adminNotes = adminCommentText[busyKey] ?? "";
        const reasonPreview = reasonId
          ? articleRejectionReasonPreview(
              reasonId,
              isCustom ? customReasonText[busyKey] : undefined,
              adminNotes,
            )
          : null;

        return (
          <article
            key={a.revisionId ? `rev-${a.revisionId}` : a.id}
            className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 sm:p-5"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                {a.isRevisionUpdate ? (
                  <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-amber-900">
                    Updated version · v{a.versionNumber ?? "?"}
                  </span>
                ) : null}
                <h2 className="text-base font-semibold text-neutral-900">{displayTitle}</h2>
                {a.isRevisionUpdate && a.liveTitle ? (
                  <p className="mt-1 text-sm text-neutral-600">
                    Live title: {articleDisplayTitle(a.liveTitle)}
                  </p>
                ) : null}
                <p className="mt-1 text-sm text-neutral-600">
                  {a.businessName ?? "Unknown business"} ·{" "}
                  {a.content_type === "case_study" ? "Case study" : "Article"}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  Submitted {a.submitted_at ? new Date(a.submitted_at).toLocaleString() : "-"}
                </p>
                {a.businessSlug ? (
                  <Link
                    href={`/b/${encodeURIComponent(a.businessSlug)}/articles`}
                    className="mt-2 inline-block text-xs font-medium text-[#1FAF9E] hover:underline"
                    target="_blank"
                  >
                    Business archive
                  </Link>
                ) : null}
              </div>
              {a.featured_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.featured_image_url}
                  alt=""
                  className="h-28 w-full max-w-xs shrink-0 rounded-lg object-cover"
                />
              ) : null}
            </div>

            <div className="mt-4">
              <button
                type="button"
                onClick={() => setExpandedPreviewId(previewOpen ? null : (a.revisionId ?? a.id))}
                className="rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm font-semibold text-neutral-800 hover:bg-neutral-50"
              >
                {previewOpen ? "Hide full preview" : "Preview full article"}
              </button>
            </div>

            {previewOpen ? (
              <div className="mt-4">
                <AdminArticleModerationPreview
                  article={{
                    title: a.title,
                    content_type: a.content_type,
                    featured_image_url: a.featured_image_url,
                    content: a.content ?? emptyDoc(),
                    client_industry: a.client_industry,
                    challenge: a.challenge,
                    solution: a.solution,
                    results: a.results,
                  }}
                />
              </div>
            ) : null}

            <div className="mt-4 space-y-3 border-t border-neutral-200 pt-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busyId === busyKey}
                  onClick={() => void moderate(a.id, "approve", undefined, a.revisionId)}
                  className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {a.isRevisionUpdate ? "Approve changes" : "Approve"}
                </button>
                <select
                  value={reasonId}
                  onChange={(e) =>
                    setSelectedReasonId((prev) => ({ ...prev, [busyKey]: e.target.value }))
                  }
                  className="min-w-[14rem] rounded-md border border-neutral-300 px-2 py-2 text-sm"
                >
                  <option value="" disabled>
                    Reject reason…
                  </option>
                  {ARTICLE_REJECTION_REASON_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={busyId === busyKey}
                  onClick={() => {
                    if (!reasonId) {
                      alert("Select a rejection reason.");
                      return;
                    }
                    const reason = resolveArticleRejectionReason(
                      reasonId,
                      customReasonText[busyKey],
                      adminCommentText[busyKey],
                    );
                    if (!reason) {
                      alert(
                        isCustom
                          ? "Enter a custom rejection reason."
                          : "Select a valid rejection reason.",
                      );
                      return;
                    }
                    void moderate(a.id, "reject", reason, a.revisionId);
                  }}
                  className="rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {a.isRevisionUpdate ? "Reject changes" : "Reject"}
                </button>
              </div>

              {reasonId ? (
                <div className="space-y-3">
                  {isCustom ? (
                    <label className="block">
                      <span className="text-xs font-medium text-neutral-700">
                        Rejection message
                      </span>
                      <textarea
                        value={customReasonText[busyKey] ?? ""}
                        onChange={(e) =>
                          setCustomReasonText((prev) => ({ ...prev, [busyKey]: e.target.value }))
                        }
                        rows={4}
                        placeholder="Describe the issue and what the business should fix. Guidelines link is appended automatically."
                        className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                      />
                    </label>
                  ) : null}
                  <label className="block">
                    <span className="text-xs font-medium text-neutral-700">
                      Additional comments for the business{" "}
                      <span className="font-normal text-neutral-500">(optional)</span>
                    </span>
                    <textarea
                      value={adminNotes}
                      onChange={(e) =>
                        setAdminCommentText((prev) => ({ ...prev, [busyKey]: e.target.value }))
                      }
                      rows={3}
                      placeholder="Add specific feedback, examples, or edits the business should make before resubmitting."
                      className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm"
                    />
                  </label>
                  {reasonPreview ? (
                    <div className="rounded-lg border border-red-100 bg-red-50/80 p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800">
                        Message sent to business
                      </p>
                      <p className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-red-950">
                        {reasonPreview}
                      </p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
