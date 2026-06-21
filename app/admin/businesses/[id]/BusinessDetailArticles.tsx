"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AdminArticleModerationPreview from "../../articles/AdminArticleModerationPreview";
import {
  articleDisplayTitle,
  formatArticlePublishedDate,
} from "@/lib/articles/articleDisplay";
import type { ArticleContentDoc, ArticleStatus } from "@/lib/articles/types";
import {
  ARTICLE_REJECTION_CUSTOM_ID,
  ARTICLE_REJECTION_REASON_PRESETS,
  articleRejectionReasonPreview,
  enrichStoredArticleRejectionReason,
  resolveArticleRejectionReason,
} from "@/lib/articles/articleRejectionReasons";

export type AdminArticleRow = {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  content_type: string;
  status: ArticleStatus;
  excerpt: string | null;
  featured_image_url: string | null;
  submitted_at: string | null;
  published_at: string | null;
  archived_at: string | null;
  status_before_archive: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  content: ArticleContentDoc;
  client_industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
};

type InitialData = {
  businessId: string;
  businessName: string | null;
  businessSlug: string | null;
  ownerEmail: string | null;
  ownerName: string | null;
  articles: AdminArticleRow[];
};

const REJECT_REASONS = ARTICLE_REJECTION_REASON_PRESETS;

const FILTER_OPTIONS: ReadonlyArray<{
  key: "all" | ArticleStatus;
  label: string;
}> = [
  { key: "all", label: "All" },
  { key: "pending_review", label: "Pending review" },
  { key: "published", label: "Published" },
  { key: "draft", label: "Draft" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived" },
];

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function statusPillClass(status: ArticleStatus): string {
  const base =
    "inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize";
  if (status === "published") return `${base} border-emerald-200 bg-emerald-50 text-emerald-800`;
  if (status === "pending_review") return `${base} border-amber-200 bg-amber-50 text-amber-900`;
  if (status === "rejected") return `${base} border-rose-200 bg-rose-50 text-rose-800`;
  if (status === "archived") return `${base} border-slate-300 bg-slate-100 text-slate-700`;
  return `${base} border-slate-200 bg-slate-100 text-slate-700`;
}

function emptyDoc(): ArticleContentDoc {
  return { type: "doc", content: [] };
}

export default function BusinessDetailArticles({ initial }: { initial: InitialData }) {
  const [articles, setArticles] = useState<AdminArticleRow[]>(initial.articles);
  const [filter, setFilter] = useState<"all" | ArticleStatus>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(
    null,
  );
  const [previewArticle, setPreviewArticle] = useState<AdminArticleRow | null>(null);
  const [rejectingArticle, setRejectingArticle] = useState<AdminArticleRow | null>(null);
  const [rejectReasonPreset, setRejectReasonPreset] = useState<string>(
    ARTICLE_REJECTION_REASON_PRESETS[0].id,
  );
  const [rejectReasonCustom, setRejectReasonCustom] = useState("");
  const [rejectAdminNotes, setRejectAdminNotes] = useState("");
  const [deletingArticle, setDeletingArticle] = useState<AdminArticleRow | null>(null);

  const reload = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/admin/businesses/${encodeURIComponent(initial.businessId)}/articles`,
        { credentials: "same-origin", cache: "no-store" },
      );
      if (!res.ok) return;
      const data = (await res.json()) as { articles?: AdminArticleRow[] };
      setArticles(Array.isArray(data.articles) ? data.articles : []);
    } catch {
      /* swallow */
    }
  }, [initial.businessId]);

  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 5000);
    return () => window.clearTimeout(t);
  }, [message]);

  const filtered = useMemo(() => {
    if (filter === "all") return articles;
    return articles.filter((a) => a.status === filter);
  }, [articles, filter]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {
      pending_review: 0,
      published: 0,
      draft: 0,
      rejected: 0,
      archived: 0,
    };
    for (const a of articles) {
      c[a.status] = (c[a.status] ?? 0) + 1;
    }
    return c;
  }, [articles]);

  const moderate = useCallback(
    async (article: AdminArticleRow, action: "approve" | "reject", reason?: string) => {
      setBusyId(article.id);
      setMessage(null);
      try {
        const res = await fetch(`/api/admin/articles/${encodeURIComponent(article.id)}/moderate`, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action, reason: reason ?? null }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          emailStatus?: string;
        };
        if (!res.ok) {
          setMessage({ type: "error", text: data.error ?? "Moderation failed" });
          return;
        }

        let suffix = "";
        if (action === "reject") {
          if (data.emailStatus === "sent") suffix = " Owner notified by email.";
          else if (data.emailStatus === "no_owner_email") suffix = " No owner email on file.";
        }
        setMessage({
          type: "success",
          text:
            action === "approve"
              ? "Article approved and published."
              : `Article rejected and removed from public view.${suffix}`,
        });
        await reload();
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Moderation failed",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  const restoreArticle = useCallback(
    async (article: AdminArticleRow) => {
      setBusyId(article.id);
      setMessage(null);
      try {
        const res = await fetch(`/api/admin/articles/${encodeURIComponent(article.id)}/restore`, {
          method: "POST",
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setMessage({ type: "error", text: data.error ?? "Restore failed" });
          return;
        }
        setMessage({ type: "success", text: "Article restored." });
        await reload();
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Restore failed",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  const deleteArticle = useCallback(
    async (article: AdminArticleRow) => {
      setBusyId(article.id);
      setMessage(null);
      try {
        const res = await fetch(`/api/admin/articles/${encodeURIComponent(article.id)}`, {
          method: "DELETE",
          credentials: "same-origin",
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setMessage({ type: "error", text: data.error ?? "Delete failed" });
          return;
        }
        setMessage({ type: "success", text: "Article permanently deleted." });
        setArticles((prev) => prev.filter((row) => row.id !== article.id));
        await reload();
      } catch (e) {
        setMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Delete failed",
        });
      } finally {
        setBusyId(null);
      }
    },
    [reload],
  );

  const confirmReject = async () => {
    if (!rejectingArticle) return;
    const reason = resolveArticleRejectionReason(
      rejectReasonPreset,
      rejectReasonCustom,
      rejectAdminNotes,
    );
    if (!reason) {
      setMessage({ type: "error", text: "Please enter a rejection reason." });
      return;
    }
    const target = rejectingArticle;
    setRejectingArticle(null);
    await moderate(target, "reject", reason);
  };

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-col gap-2 border-b border-neutral-100 pb-3">
        <p className="text-sm text-neutral-600">
          All blogs and case studies for{" "}
          <span className="font-medium text-neutral-900">
            {initial.businessName?.trim() || "this business"}
          </span>
          . You can reject published articles if a guideline violation was missed, or delete any
          article permanently.
        </p>
        {initial.ownerEmail ? (
          <p className="text-xs text-neutral-500">
            Owner:{" "}
            <span className="font-medium text-neutral-800">
              {initial.ownerName || initial.ownerEmail}
            </span>{" "}
            ({initial.ownerEmail})
          </p>
        ) : (
          <p className="text-xs text-amber-700">
            No claimed owner, rejection emails will be skipped.
          </p>
        )}
        <Link
          href="/admin/articles"
          className="text-xs font-semibold text-[#1FAF9E] hover:underline"
        >
          Open global review queue →
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {FILTER_OPTIONS.map((opt) => {
          const c = opt.key === "all" ? articles.length : (counts[opt.key] ?? 0);
          const active = filter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${
                active
                  ? "border-neutral-900 bg-neutral-900 text-white"
                  : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
              }`}
            >
              <span>{opt.label}</span>
              <span
                className={`rounded-full px-1.5 text-[10px] font-semibold ${
                  active ? "bg-white/20 text-white" : "bg-neutral-100 text-neutral-700"
                }`}
              >
                {c}
              </span>
            </button>
          );
        })}
      </div>

      {message ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {filtered.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-200 bg-neutral-50 py-10 text-center text-sm text-neutral-500">
          No articles match this filter.
        </div>
      ) : (
        <ul className="space-y-4">
          {filtered.map((a) => {
            const busy = busyId === a.id;
            const displayTitle = articleDisplayTitle(a.title);
            const canApprove = a.status === "pending_review";
            const canReject = a.status === "pending_review" || a.status === "published";

            return (
              <li
                key={a.id}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-4 p-4 lg:flex-row lg:items-start">
                  {a.featured_image_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={a.featured_image_url}
                      alt=""
                      className="h-24 w-full max-w-[10rem] shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-full max-w-[10rem] shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#E8F7F5] to-[#F5F3EF] text-xs text-neutral-500">
                      No image
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-neutral-900">{displayTitle}</h3>
                      <span className={statusPillClass(a.status)}>
                        {a.status.replace("_", " ")}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {a.content_type === "case_study" ? "Case study" : "Article"}
                      </span>
                    </div>
                    {a.excerpt ? (
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-600">{a.excerpt}</p>
                    ) : null}
                    <dl className="mt-2 grid gap-1 text-xs text-neutral-500 sm:grid-cols-2">
                      <div>
                        <span className="font-medium text-neutral-700">Updated:</span>{" "}
                        {formatDateTime(a.updated_at)}
                      </div>
                      {a.submitted_at ? (
                        <div>
                          <span className="font-medium text-neutral-700">Submitted:</span>{" "}
                          {formatDateTime(a.submitted_at)}
                        </div>
                      ) : null}
                      {a.published_at ? (
                        <div>
                          <span className="font-medium text-neutral-700">Published:</span>{" "}
                          {formatArticlePublishedDate(a.published_at)}
                        </div>
                      ) : null}
                      {a.archived_at ? (
                        <div>
                          <span className="font-medium text-neutral-700">Archived:</span>{" "}
                          {formatDateTime(a.archived_at)}
                        </div>
                      ) : null}
                    </dl>
                    {a.rejection_reason ? (
                      <div className="mt-2 max-h-32 overflow-y-auto whitespace-pre-wrap text-[11px] leading-snug text-rose-800">
                        <span className="font-semibold">Rejection reason:</span>{" "}
                        {enrichStoredArticleRejectionReason(a.rejection_reason)}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 bg-neutral-50/80 px-4 py-3">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setPreviewArticle(a)}
                    className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
                  >
                    Preview full article
                  </button>
                  {a.status === "published" ? (
                    <Link
                      href={`/articles/${encodeURIComponent(a.slug)}`}
                      target="_blank"
                      className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-[#1FAF9E] hover:bg-neutral-50"
                    >
                      View public page
                    </Link>
                  ) : null}
                  {initial.businessSlug ? (
                    <Link
                      href={`/b/${encodeURIComponent(initial.businessSlug)}/articles`}
                      target="_blank"
                      className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
                    >
                      Business archive
                    </Link>
                  ) : null}
                  {canApprove ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void moderate(a, "approve")}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      {busy ? "…" : "Approve"}
                    </button>
                  ) : null}
                  {canReject ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => {
                        setRejectingArticle(a);
                        setRejectReasonPreset(ARTICLE_REJECTION_REASON_PRESETS[0].id);
                        setRejectReasonCustom("");
                        setRejectAdminNotes("");
                      }}
                      className="rounded-md border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-800 hover:bg-rose-100 disabled:opacity-50"
                    >
                      {a.status === "published" ? "Reject / unpublish" : "Reject"}
                    </button>
                  ) : null}
                  {a.status === "archived" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void restoreArticle(a)}
                      className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:bg-emerald-100 disabled:opacity-50"
                    >
                      {busy ? "…" : "Restore"}
                    </button>
                  ) : null}
                  {a.status === "archived" ? (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setDeletingArticle(a)}
                      className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                    >
                      Delete permanently
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {previewArticle ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-3">
              <h4 className="text-sm font-semibold text-neutral-900">
                {articleDisplayTitle(previewArticle.title)}
              </h4>
              <button
                type="button"
                onClick={() => setPreviewArticle(null)}
                className="rounded-md px-2 py-1 text-sm text-neutral-600 hover:bg-neutral-100"
              >
                Close
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              <AdminArticleModerationPreview
                article={{
                  title: previewArticle.title,
                  content_type: previewArticle.content_type,
                  featured_image_url: previewArticle.featured_image_url,
                  content: previewArticle.content ?? emptyDoc(),
                  client_industry: previewArticle.client_industry,
                  challenge: previewArticle.challenge,
                  solution: previewArticle.solution,
                  results: previewArticle.results,
                }}
              />
            </div>
          </div>
        </div>
      ) : null}

      {rejectingArticle ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-5 shadow-xl">
            <h4 className="text-sm font-semibold text-neutral-900">
              Reject {articleDisplayTitle(rejectingArticle.title)}?
            </h4>
            <p className="mt-2 text-sm text-neutral-600">
              {rejectingArticle.status === "published"
                ? "This unpublishes the article immediately. The business is notified by email with the full reason below. Monthly credit is not returned for articles already published."
                : "This rejects the submission and returns the business's monthly credit. The business receives the full reason below by email and in their dashboard."}
            </p>
            <label className="mt-4 block text-xs font-medium text-neutral-700">
              Reason category
              <select
                value={rejectReasonPreset}
                onChange={(e) => setRejectReasonPreset(e.target.value)}
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
              >
                {REJECT_REASONS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </label>
            {rejectReasonPreset === ARTICLE_REJECTION_CUSTOM_ID ? (
              <label className="mt-3 block text-xs font-medium text-neutral-700">
                Rejection message
                <textarea
                  value={rejectReasonCustom}
                  onChange={(e) => setRejectReasonCustom(e.target.value)}
                  rows={5}
                  className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
                  placeholder="Describe the issue and what the business should fix…"
                />
              </label>
            ) : null}
            <label className="mt-3 block text-xs font-medium text-neutral-700">
              Additional comments for the business{" "}
              <span className="font-normal text-neutral-500">(optional)</span>
              <textarea
                value={rejectAdminNotes}
                onChange={(e) => setRejectAdminNotes(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-md border border-neutral-300 px-2 py-2 text-sm"
                placeholder="Add specific feedback, examples, or edits the business should make before resubmitting."
              />
            </label>
            {articleRejectionReasonPreview(
              rejectReasonPreset,
              rejectReasonPreset === ARTICLE_REJECTION_CUSTOM_ID ? rejectReasonCustom : undefined,
              rejectAdminNotes,
            ) ? (
              <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-800">
                  Message sent to business
                </p>
                <p className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-red-950">
                  {articleRejectionReasonPreview(
                    rejectReasonPreset,
                    rejectReasonPreset === ARTICLE_REJECTION_CUSTOM_ID
                      ? rejectReasonCustom
                      : undefined,
                    rejectAdminNotes,
                  )}
                </p>
              </div>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectingArticle(null);
                  setRejectAdminNotes("");
                }}
                className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void confirmReject()}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
              >
                Reject article
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {deletingArticle ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
            <h4 className="text-sm font-semibold text-neutral-900">Delete article?</h4>
            <p className="mt-2 text-sm text-neutral-600">
              Permanently delete archived article{" "}
              <span className="font-medium">{articleDisplayTitle(deletingArticle.title)}</span>?
              Moderation history will be removed. This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingArticle(null)}
                className="rounded-md bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const target = deletingArticle;
                  setDeletingArticle(null);
                  void deleteArticle(target);
                }}
                className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
              >
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
