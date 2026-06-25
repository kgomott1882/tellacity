"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, MoreVertical, Plus, Trash2 } from "lucide-react";
import { dashboardApiGet, dashboardApiPost, dashboardApiDelete } from "@/lib/dashboardApiFetch";
import { useBusinessContext } from "../_context/BusinessContext";
import PageLoadingOverlay from "../_components/PageLoadingOverlay";
import PlanStatusBanner from "@/components/dashboard/PlanStatusBanner";
import { normalizePlanCodeToKey } from "@/lib/plans";
import type { ArticleContentType, ArticleStatus } from "@/lib/articles/types";
import { articleDisplayTitle } from "@/lib/articles/articleDisplay";
import { enrichStoredArticleRejectionReason } from "@/lib/articles/articleRejectionReasons";
import { editorStepLabel, loadEditorProgress, clearEditorProgress } from "@/lib/articles/articleEditorProgress";

type ArticleRevisionSummary = {
  id: string;
  status: string;
  version_number: number;
  submitted_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
  featured_image_url?: string | null;
};

type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  content_type: string;
  featured_image_url: string | null;
  status: ArticleStatus;
  published_at: string | null;
  submitted_at: string | null;
  archived_at: string | null;
  rejection_reason: string | null;
  updated_at: string;
  active_revision?: ArticleRevisionSummary | null;
};

type UsagePayload = {
  used: number;
  limit: number;
  remaining: number;
  plan?: string;
  upgradeCta?: string;
};

const TABS: { key: ArticleStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "draft", label: "Draft blogs & case studies" },
  { key: "pending_review", label: "Pending blogs & case studies" },
  { key: "published", label: "Published blogs & case studies" },
  { key: "rejected", label: "Rejected" },
  { key: "archived", label: "Archived blogs & case studies" },
];

function contentTypeLabel(contentType: string): string {
  return contentType === "case_study" ? "Case study" : "Blog";
}

function formatDate(iso: string | null) {
  if (!iso) return "-";
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function statusClass(status: ArticleStatus): string {
  const map: Record<string, string> = {
    draft: "bg-gray-100 text-gray-700",
    pending_review: "bg-amber-100 text-amber-900",
    published: "bg-emerald-100 text-emerald-800",
    rejected: "bg-red-100 text-red-800",
    archived: "bg-slate-100 text-slate-700",
  };
  return map[status] ?? "bg-gray-100 text-gray-700";
}

function listStatusDisplay(article: ArticleListItem): { label: string; className: string } {
  const rev = article.active_revision;
  if (article.status === "published" && rev?.status === "pending_review") {
    return {
      label: "Pending review (update)",
      className: "bg-amber-100 text-amber-900",
    };
  }
  if (article.status === "published" && rev?.status === "draft") {
    return {
      label: "Published · draft update",
      className: "bg-emerald-100 text-emerald-800",
    };
  }
  if (article.status === "published" && rev?.status === "rejected") {
    return {
      label: "Published · update rejected",
      className: "bg-red-100 text-red-800",
    };
  }
  return {
    label: article.status.replace(/_/g, " "),
    className: statusClass(article.status),
  };
}

function rejectionReasonForArticle(article: ArticleListItem): string | null {
  const rev = article.active_revision;
  if (article.status === "published" && rev?.status === "rejected") {
    return rev.rejection_reason?.trim() || null;
  }
  if (article.status === "rejected") {
    return article.rejection_reason?.trim() || null;
  }
  return null;
}

function ArticleStatusBadge({ article }: { article: ArticleListItem }) {
  const [reasonOpen, setReasonOpen] = useState(false);
  const display = listStatusDisplay(article);
  const rejectionReason = rejectionReasonForArticle(article);
  const displayRejectionReason = enrichStoredArticleRejectionReason(rejectionReason);
  const displayTitle = articleDisplayTitle(article.title);
  const isRejectedUpdate =
    article.status === "published" && article.active_revision?.status === "rejected";
  const isRejected =
    article.status === "rejected" ||
    (article.status === "published" && article.active_revision?.status === "rejected");

  useEffect(() => {
    if (!reasonOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setReasonOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reasonOpen]);

  if (!isRejected) {
    return (
      <span
        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${display.className}`}
      >
        {display.label}
      </span>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setReasonOpen(true)}
        title="View rejection reasons"
        className="inline-flex flex-col items-start gap-0.5 text-left transition-opacity hover:opacity-90"
      >
        <span
          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${display.className}`}
        >
          {display.label}
        </span>
        <span className="text-[10px] font-medium text-red-700 underline decoration-red-700/40 underline-offset-2">
          view reasons
        </span>
      </button>

      {reasonOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close rejection reason"
            onClick={() => setReasonOpen(false)}
          />
          <div
            className="relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rejection-reason-title"
          >
            <h3 id="rejection-reason-title" className="text-sm font-semibold text-gray-900">
              {isRejectedUpdate ? "Update rejected" : "Article rejected"}
            </h3>
            <p className="mt-1 text-xs text-gray-500">{displayTitle}</p>
            <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-800">
                Reason from review
              </p>
              <p className="mt-2 max-h-64 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-red-950">
                {displayRejectionReason ||
                  "No detailed reason was recorded. Check your email for feedback from Tellacity, or contact support if you need clarification."}
              </p>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              {isRejectedUpdate
                ? "Your live article is unchanged. Edit the draft update to address this feedback, then submit again."
                : "Edit your draft to address this feedback, then submit again for review."}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setReasonOpen(false)}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
              <Link
                href={`/business/dashboard/articles/${encodeURIComponent(article.id)}/edit`}
                onClick={() => setReasonOpen(false)}
                className="rounded-md bg-[#1FAF9E] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#189786]"
              >
                Edit article
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function ArticleThumbnail({
  src,
  title,
}: {
  src: string | null;
  title: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        className="h-14 w-[4.5rem] shrink-0 rounded-lg border border-gray-200 object-cover bg-gray-100"
      />
    );
  }
  return (
    <div className="flex h-14 w-[4.5rem] shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 text-gray-400">
      <FileText className="h-5 w-5" aria-hidden />
      <span className="sr-only">No thumbnail for {title}</span>
    </div>
  );
}

function PublishedArticleThumbnail({
  article,
  title,
}: {
  article: ArticleListItem;
  title: string;
}) {
  const rev = article.active_revision;
  const pendingImageChange =
    Boolean(rev) &&
    ["draft", "pending_review", "rejected"].includes(String(rev?.status ?? "")) &&
    (rev?.featured_image_url ?? null) !== (article.featured_image_url ?? null);

  return (
    <div className="relative shrink-0" title={pendingImageChange ? "Live thumbnail, update pending admin approval" : undefined}>
      <ArticleThumbnail src={article.featured_image_url} title={title} />
      {pendingImageChange ? (
        <span
          className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white"
          aria-hidden
        />
      ) : null}
    </div>
  );
}

function EditActionLink({ article }: { article: ArticleListItem }) {
  const [resumeStep, setResumeStep] = useState<number | null>(null);

  useEffect(() => {
    const progress = loadEditorProgress(article.id);
    setResumeStep(progress?.step ?? null);
  }, [article.id]);

  const href = `/business/dashboard/articles/${encodeURIComponent(article.id)}/edit`;
  const label =
    article.status === "draft" || article.status === "rejected"
      ? resumeStep != null && resumeStep > 0
        ? "Continue"
        : "Edit"
      : article.status === "published"
        ? "Edit"
        : "Edit";
  const title =
    article.status === "published"
      ? "Edit published article (changes require re-review)"
      : resumeStep != null
        ? `Continue from ${editorStepLabel(resumeStep)}`
        : "Edit draft";

  return (
    <Link
      href={href}
      title={title}
      className="inline-flex min-w-[4.5rem] justify-end font-semibold text-[#1FAF9E] hover:underline"
    >
      {label}
    </Link>
  );
}

function ArchiveArticleModal({
  article,
  open,
  onClose,
  onArchived,
}: {
  article: ArticleListItem;
  open: boolean;
  onClose: () => void;
  onArchived: () => void;
}) {
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? "";
  const [archiving, setArchiving] = useState(false);
  const displayTitle = articleDisplayTitle(article.title);

  const handleArchive = async () => {
    if (!businessId) return;
    setArchiving(true);
    try {
      await dashboardApiPost(
        `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(article.id)}/archive`,
        {},
      );
      onClose();
      onArchived();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Could not archive article");
    } finally {
      setArchiving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={() => !archiving && onClose()}
      />
      <div
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-article-title"
      >
        <h3 id="archive-article-title" className="text-lg font-semibold text-gray-900">
          Archive article
        </h3>
        <p className="mt-3 text-sm text-gray-600">
          This will remove{" "}
          <span className="font-medium text-gray-900">{displayTitle}</span> from public view.
        </p>
        <p className="mt-2 text-sm text-gray-600">
          The article will be moved to Archived articles and can be restored later.
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={archiving}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleArchive()}
            disabled={archiving}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900 disabled:opacity-50"
          >
            {archiving ? "Archiving…" : "Archive article"}
          </button>
        </div>
      </div>
    </div>
  );
}

function PublishedArticleMenu({
  article,
  onArchiveClick,
}: {
  article: ArticleListItem;
  onArchiveClick: () => void;
}) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const editHref = `/business/dashboard/articles/${encodeURIComponent(article.id)}/edit`;
  const publicHref = `/articles/${encodeURIComponent(article.slug)}`;

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;

    const updatePosition = () => {
      const button = buttonRef.current;
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const menuWidth = 160;
      const menuHeight = 132;
      const gap = 4;
      const spaceBelow = window.innerHeight - rect.bottom;
      const openUp = spaceBelow < menuHeight + gap;
      const top = openUp ? rect.top - menuHeight - gap : rect.bottom + gap;
      const left = Math.min(
        Math.max(8, rect.right - menuWidth),
        window.innerWidth - menuWidth - 8,
      );
      setMenuPos({ top, left });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onClick = () => setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("click", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("click", onClick);
    };
  }, [open]);

  useEffect(() => {
    if (!open) setMenuPos(null);
  }, [open]);

  const menu =
    open && menuPos
      ? createPortal(
          <div
            className="fixed z-[300] min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg"
            style={{ top: menuPos.top, left: menuPos.left }}
            role="menu"
            onClick={(e) => e.stopPropagation()}
          >
            <Link
              href={editHref}
              role="menuitem"
              className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              Edit
            </Link>
            <Link
              href={publicHref}
              target="_blank"
              role="menuitem"
              className="block px-3 py-2 text-sm text-gray-800 hover:bg-gray-50"
              onClick={() => setOpen(false)}
            >
              View
            </Link>
            <button
              type="button"
              role="menuitem"
              className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-50"
              onClick={() => {
                setOpen(false);
                onArchiveClick();
              }}
            >
              Archive article
            </button>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-800"
        aria-label="More actions"
        aria-expanded={open}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {menu}
    </>
  );
}

function RestoreArticleButton({
  articleId,
  onRestored,
}: {
  articleId: string;
  onRestored: () => void;
}) {
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? "";
  const [restoring, setRestoring] = useState(false);

  const handleRestore = async () => {
    if (!businessId) return;
    setRestoring(true);
    try {
      await dashboardApiPost(
        `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}/restore`,
        {},
      );
      onRestored();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Could not restore article");
    } finally {
      setRestoring(false);
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleRestore()}
      disabled={restoring}
      className="font-semibold text-[#1FAF9E] hover:underline disabled:opacity-50"
    >
      {restoring ? "Restoring…" : "Restore"}
    </button>
  );
}

function DeleteArticleButton({
  articleId,
  title,
  onDeleted,
}: {
  articleId: string;
  title: string;
  onDeleted: () => void;
}) {
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? "";
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const displayTitle = articleDisplayTitle(title);

  const handleDelete = async () => {
    if (!businessId) return;
    setDeleting(true);
    try {
      await dashboardApiDelete(
        `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}`,
      );
      clearEditorProgress(articleId);
      setConfirmOpen(false);
      onDeleted();
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : "Could not delete article");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={deleting}
        title={`Delete ${displayTitle}`}
        aria-label={`Delete ${displayTitle}`}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {confirmOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <div
            className="w-full max-w-[340px] rounded-lg bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-article-title"
          >
            <h3 id="delete-article-title" className="text-sm font-semibold text-gray-900">
              Delete article?
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">{displayTitle}</span>? This cannot be
              undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleting}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function contentTypeFromParam(value: string | null): ArticleContentType | null {
  if (value === "article" || value === "case_study") return value;
  return null;
}

export default function ArticlesDashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentTypeFilter = contentTypeFromParam(searchParams.get("type"));
  const { selectedBusiness, bumpNavRefresh } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? "";
  const normalizedPlan = normalizePlanCodeToKey(selectedBusiness?.plan);

  const [tab, setTab] = useState<ArticleStatus | "all">("all");
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [archiveTarget, setArchiveTarget] = useState<ArticleListItem | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const statusQuery = tab !== "all" ? `?status=${encodeURIComponent(tab)}` : "";
      const [listRes, usageRes] = await Promise.all([
        dashboardApiGet<{ articles?: ArticleListItem[] }>(
          `/api/business/${encodeURIComponent(businessId)}/articles${statusQuery}`,
        ),
        dashboardApiGet<UsagePayload>(
          `/api/business/${encodeURIComponent(businessId)}/articles/usage`,
        ),
      ]);
      setArticles(listRes?.articles ?? []);
      setUsage(usageRes);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load blogs & case studies");
    } finally {
      setLoading(false);
    }
  }, [businessId, tab]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!contentTypeFilter) return articles;
    return articles.filter((a) => a.content_type === contentTypeFilter);
  }, [articles, contentTypeFilter]);

  const pageTitle =
    contentTypeFilter === "article"
      ? "Blogs"
      : contentTypeFilter === "case_study"
        ? "Case studies"
        : "Blogs and case studies";

  const canSubmit = (usage?.limit ?? 0) > 0 && (usage?.remaining ?? 0) > 0;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createContentType, setCreateContentType] = useState<ArticleContentType>("article");
  const [creating, setCreating] = useState(false);

  const openCreateModal = () => {
    setCreateContentType(contentTypeFilter === "case_study" ? "case_study" : "article");
    setCreateModalOpen(true);
  };

  const handleCreate = async (contentType: ArticleContentType) => {
    if (!businessId || creating) return;
    try {
      sessionStorage.setItem("tc_articles_writing", "1");
      window.dispatchEvent(new Event("tellacity-articles-writing-start"));
    } catch {
      /* ignore */
    }
    setCreating(true);
    try {
      const res = await dashboardApiPost<{ article?: { id: string } }>(
        `/api/business/${encodeURIComponent(businessId)}/articles`,
        {
          title: "",
          contentType,
        },
      );
      const id = res?.article?.id;
      if (!id) throw new Error("Create failed");
      setCreateModalOpen(false);
      router.push(
        `/business/dashboard/articles/${encodeURIComponent(id)}/edit?guide=1`,
      );
    } catch (e: unknown) {
      try {
        sessionStorage.removeItem("tc_articles_writing");
        window.dispatchEvent(new Event("tellacity-articles-writing-end"));
      } catch {
        /* ignore */
      }
      alert(e instanceof Error ? e.message : "Could not create blog or case study");
    } finally {
      setCreating(false);
    }
  };

  if (!businessId) {
    return <PageLoadingOverlay />;
  }

  return (
    <div className="relative min-h-[40vh]">
      {loading ? <PageLoadingOverlay /> : null}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create blogs and case studies for your Tellacity profile. Content is reviewed before it
            goes live on the public Articles section.{" "}
            <Link href="/business-guidelines" className="font-medium text-[#1FAF9E] hover:underline">
              Read content guidelines
            </Link>
            .
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 rounded-full bg-[#1FAF9E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#189786]"
        >
          <Plus className="h-4 w-4" />
          Create blog and case study
        </button>
      </div>

      <PlanStatusBanner
        plan={normalizedPlan}
        businessId={businessId}
        trialEligible={selectedBusiness?.trialEligible === true}
        subscriptionStatus={selectedBusiness?.subscriptionStatus}
        trialEndsAt={selectedBusiness?.trialEndsAt}
        onTrialStarted={bumpNavRefresh}
      />

      {usage ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Used this month
            </div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">
              {usage.used} / {usage.limit}
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Remaining credits
            </div>
            <div className="mt-1 text-2xl font-semibold text-gray-900">{usage.remaining}</div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-4">
            <div className="text-xs font-medium uppercase tracking-wide text-gray-500">Plan</div>
            <div className="mt-1 text-lg font-semibold capitalize text-gray-900">
              {usage.plan ?? "free"}
            </div>
            {!canSubmit && (usage.limit ?? 0) > 0 ? (
              <p className="mt-2 text-sm text-amber-800">
                Monthly limit reached.{" "}
                <Link href="/business/dashboard/pricing" className="font-medium underline">
                  Upgrade for more
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              tab === t.key
                ? "bg-[#0E4E45] text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-600">No blogs or case studies in this view yet.</p>
          <button
            type="button"
            onClick={openCreateModal}
            className="mt-4 text-sm font-semibold text-[#1FAF9E] hover:underline"
          >
            Create your first blog and case study
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-visible rounded-xl border border-gray-200 bg-white">
          <table className="min-w-full divide-y divide-gray-100 text-sm">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase tracking-wide text-gray-500">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="hidden px-4 py-3 sm:table-cell">Type</th>
                <th className="px-4 py-3">Status</th>
                <th className="hidden px-4 py-3 md:table-cell">
                  {tab === "archived" ? "Archived" : "Updated"}
                </th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((a) => {
                const displayTitle = articleDisplayTitle(a.title);
                const editHref = `/business/dashboard/articles/${encodeURIComponent(a.id)}/edit`;

                return (
                  <tr key={a.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      {a.status === "published" ? (
                        <div className="flex items-center gap-3">
                          <PublishedArticleThumbnail article={a} title={displayTitle} />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900">{displayTitle}</p>
                            <p className="mt-0.5 text-xs text-gray-500 sm:hidden">
                              {contentTypeLabel(a.content_type)} ·{" "}
                              {formatDate(a.updated_at)}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <Link
                          href={editHref}
                          className="flex items-center gap-3 rounded-lg transition-colors hover:opacity-90"
                        >
                          <ArticleThumbnail
                            src={a.featured_image_url}
                            title={displayTitle}
                          />
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-gray-900 group-hover:text-[#0E4E45]">
                              {displayTitle}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 sm:hidden">
                              {contentTypeLabel(a.content_type)} ·{" "}
                              {formatDate(a.updated_at)}
                            </p>
                          </div>
                        </Link>
                      )}
                    </td>
                    <td className="hidden px-4 py-3 text-gray-600 sm:table-cell">
                      {contentTypeLabel(a.content_type)}
                    </td>
                    <td className="px-4 py-3">
                      <ArticleStatusBadge article={a} />
                    </td>
                    <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                      {tab === "archived"
                        ? formatDate(a.archived_at)
                        : formatDate(a.updated_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {a.status === "published" ? (
                          <>
                            <EditActionLink article={a} />
                            <Link
                              href={`/articles/${encodeURIComponent(a.slug)}`}
                              className="font-semibold text-[#1FAF9E] hover:underline"
                              target="_blank"
                            >
                              View
                            </Link>
                            <PublishedArticleMenu
                              article={a}
                              onArchiveClick={() => setArchiveTarget(a)}
                            />
                          </>
                        ) : a.status === "archived" ? (
                          <>
                            <RestoreArticleButton
                              articleId={a.id}
                              onRestored={() => void load()}
                            />
                            <Link
                              href={`/business/dashboard/articles/${encodeURIComponent(a.id)}/edit`}
                              className="ml-2 font-semibold text-gray-600 hover:underline"
                            >
                              View
                            </Link>
                          </>
                        ) : (
                          <>
                            <EditActionLink article={a} />
                            {a.status === "draft" || a.status === "rejected" ? (
                              <DeleteArticleButton
                                articleId={a.id}
                                title={a.title}
                                onDeleted={() => {
                                  setArticles((prev) => prev.filter((row) => row.id !== a.id));
                                }}
                              />
                            ) : null}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {createModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={() => !creating && setCreateModalOpen(false)}
          />
          <div
            className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-article-title"
          >
            <h2 id="create-article-title" className="text-lg font-semibold text-gray-900">
              What would you like to create?
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose a content type. You can adjust details in the editor before you submit.
            </p>

            <div className="mt-5 space-y-3">
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-[#1FAF9E]/40 hover:bg-[#1FAF9E]/5 has-[:checked]:border-[#1FAF9E] has-[:checked]:bg-[#1FAF9E]/5">
                <input
                  type="radio"
                  name="create-content-type"
                  className="mt-1"
                  checked={createContentType === "article"}
                  onChange={() => setCreateContentType("article")}
                  disabled={creating}
                />
                <span>
                  <span className="font-semibold text-gray-900">Blog</span>
                  <span className="mt-0.5 block text-sm text-gray-500">
                    Blog posts, guides, updates, and thought leadership
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-[#1FAF9E]/40 hover:bg-[#1FAF9E]/5 has-[:checked]:border-[#1FAF9E] has-[:checked]:bg-[#1FAF9E]/5">
                <input
                  type="radio"
                  name="create-content-type"
                  className="mt-1"
                  checked={createContentType === "case_study"}
                  onChange={() => setCreateContentType("case_study")}
                  disabled={creating}
                />
                <span>
                  <span className="font-semibold text-gray-900">Case study</span>
                  <span className="mt-0.5 block text-sm text-gray-500">
                    Client challenge, approach, and measurable results
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setCreateModalOpen(false)}
                disabled={creating}
                className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleCreate(createContentType)}
                disabled={creating}
                className="rounded-lg bg-[#1FAF9E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#189786] disabled:opacity-50"
              >
                {creating ? "Creating…" : "Continue"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {archiveTarget ? (
        <ArchiveArticleModal
          article={archiveTarget}
          open
          onClose={() => setArchiveTarget(null)}
          onArchived={() => {
            setArchiveTarget(null);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
