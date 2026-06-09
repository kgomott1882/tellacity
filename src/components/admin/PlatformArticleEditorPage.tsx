"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import TellacityLoader from "@/components/common/TellacityLoader";
import ArticleDocumentEditor, {
  type ArticleDocumentEditorHandle,
} from "@/components/articles/editor/ArticleDocumentEditor";
import ArticleEditorStepper from "@/components/articles/editor/ArticleEditorStepper";
import ArticleFeaturedImageUpload from "@/components/articles/editor/ArticleFeaturedImageUpload";
import ArticleCaseStudyFields from "@/components/articles/editor/ArticleCaseStudyFields";
import ArticleLinkValidationBanner from "@/components/articles/editor/ArticleLinkValidationBanner";
import ArticleExternalLinkBlocker from "@/components/articles/editor/ArticleExternalLinkBlocker";
import ArticlePreviewModal from "@/components/articles/editor/ArticlePreviewModal";
import ArticleEditorGuidePanel from "@/components/articles/editor/ArticleEditorGuidePanel";
import { shouldShowEditorGuide } from "@/lib/articles/articleEditorGuide";
import { resolvePlatformArticleContent } from "@/lib/articles/articleContentConversion";
import {
  hasMoreThanParagraphContent,
  hasSeenArticlePreviewHint,
  markArticlePreviewHintSeen,
} from "@/lib/articles/articlePreviewHint";
import { compressImage } from "@/lib/imageCompression";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  adminApiGet,
  adminApiPost,
  adminApiPatch,
  adminApiDelete,
} from "@/lib/admin/platformArticleApi";
import { formatLastSaved } from "@/lib/articles/editorStats";
import {
  resolveEditorResumeStep,
  saveEditorProgress,
  editorStepLabel,
  clearEditorProgress,
} from "@/lib/articles/articleEditorProgress";
import { articleDisplayTitle } from "@/lib/articles/articleDisplay";
import type {
  ArticleContentDoc,
  ArticleContentType,
  ArticleFaqItem,
} from "@/lib/articles/types";
import { emptyArticleDoc } from "@/lib/articles/sanitize";
import {
  validateProposedArticleLink,
  validateArticleLinks,
} from "@/lib/articles/linkValidation";
import { adminPlatformArticleLinkInput } from "@/lib/platformArticles/linkValidation";
import type { PlatformArticleRow } from "@/lib/platformArticles/types";
import { Eye, Trash2 } from "lucide-react";

const UPLOAD_BUCKET = "article_media";
const STEPS = ["Setup", "Title", "Featured image", "Content", "Submit"] as const;
const AUTO_SAVE_MS = 30_000;

type Props = {
  articleId: string;
};

function statusBadge(articleStatus: string) {
  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
    published: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
    archived: { label: "Archived", className: "bg-slate-100 text-slate-700" },
  };
  const item = map[articleStatus] ?? {
    label: articleStatus.replace(/_/g, " "),
    className: "bg-gray-100 text-gray-700 capitalize",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}
    >
      {item.label}
    </span>
  );
}

function StepCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-white p-10 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.06)]">
      {children}
    </div>
  );
}

export default function PlatformArticleEditorPage({ articleId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<ArticleDocumentEditorHandle>(null);
  const uploadUserIdRef = useRef<string | null>(null);

  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [slug, setSlug] = useState("");

  const [contentType, setContentType] = useState<ArticleContentType>("article");
  const [title, setTitle] = useState("");
  const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(null);
  const [content, setContent] = useState<ArticleContentDoc>(emptyArticleDoc());
  const [clientIndustry, setClientIndustry] = useState("");
  const [challenge, setChallenge] = useState("");
  const [solution, setSolution] = useState("");
  const [results, setResults] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [authorBio, setAuthorBio] = useState("");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState<string | null>(null);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [featuredImageWidth, setFeaturedImageWidth] = useState<number | null>(null);
  const [featuredImageHeight, setFeaturedImageHeight] = useState<number | null>(null);
  const [keyTakeaways, setKeyTakeaways] = useState<string[]>([]);
  const [faq, setFaq] = useState<ArticleFaqItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [contentGoal, setContentGoal] = useState("");
  const [status, setStatus] = useState("draft");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHintDismissed, setPreviewHintDismissed] = useState(false);
  const [showWritingGuide, setShowWritingGuide] = useState(false);
  const [guideAutoCollapsed, setGuideAutoCollapsed] = useState(false);

  const isDirtyRef = useRef(false);
  const loadedRef = useRef(false);
  const guideInitializedRef = useRef(false);

  const isArchived = status === "archived";
  const editable = !isArchived;

  const linkValidation = useMemo(
    () =>
      validateArticleLinks(
        adminPlatformArticleLinkInput({
          content,
          caseStudyFields: {
            clientIndustry,
            challenge,
            solution,
            results,
          },
          businessWebsite: undefined,
        }),
      ),
    [content, clientIndustry, challenge, solution, results],
  );

  const linkValidationBlocked = !linkValidation.ok;
  const externalLinkLimitReached =
    linkValidation.externalLinkCount >= linkValidation.maxExternalLinks && linkValidation.ok;

  const validateLinkInsert = useCallback(
    (href: string, options?: { replacingHref?: string }) =>
      validateProposedArticleLink(
        href,
        adminPlatformArticleLinkInput({
          content,
          caseStudyFields: {
            clientIndustry,
            challenge,
            solution,
            results,
          },
          businessWebsite: undefined,
        }),
        { replacingHref: options?.replacingHref },
      ),
    [content, clientIndustry, challenge, solution, results],
  );

  const markDirty = useCallback(() => {
    if (loadedRef.current) isDirtyRef.current = true;
  }, []);

  const collapseGuideForEditing = useCallback(() => {
    setGuideAutoCollapsed(true);
  }, []);

  const syncWritingGuideVisibility = useCallback(
    (type: ArticleContentType) => {
      if (!articleId || !loadedRef.current) return;
      const visible = shouldShowEditorGuide({
        articleId,
        status,
        contentType: type,
        fromCreate: false,
        title,
        featuredImageUrl,
        content,
        authorName,
        clientIndustry,
        challenge,
        solution,
        results,
      });
      setShowWritingGuide(visible);
    },
    [
      articleId,
      status,
      title,
      featuredImageUrl,
      content,
      authorName,
      clientIndustry,
      challenge,
      solution,
      results,
    ],
  );

  const openPreview = useCallback(() => {
    if (articleId) {
      markArticlePreviewHintSeen(articleId);
      setPreviewHintDismissed(true);
    }
    setPreviewOpen(true);
  }, [articleId]);

  useEffect(() => {
    if (!articleId) return;
    setPreviewHintDismissed(hasSeenArticlePreviewHint(articleId));
  }, [articleId]);

  const showPreviewHint = useMemo(
    () =>
      !loading &&
      !previewHintDismissed &&
      hasMoreThanParagraphContent(content),
    [loading, previewHintDismissed, content],
  );

  const goToStep = useCallback(
    (index: number) => {
      setStep(index);
      setMaxStepReached((prev) => {
        const next = Math.max(prev, index);
        if (articleId && loadedRef.current) {
          saveEditorProgress(articleId, index, next);
        }
        return next;
      });
    },
    [articleId],
  );

  const load = useCallback(async () => {
    if (!articleId) return;
    setLoading(true);
    setError(null);
    loadedRef.current = false;
    isDirtyRef.current = false;
    try {
      const sb = supabaseBrowser();
      const { data: userData } = await sb.auth.getUser();
      uploadUserIdRef.current = userData.user?.id ?? null;

      const articleRes = await adminApiGet<{ article?: PlatformArticleRow }>(
        `/api/admin/platform-articles/${encodeURIComponent(articleId)}`,
      );
      const article = articleRes?.article;
      if (!article) throw new Error("Article not found");

      setStatus(article.status);
      setSlug(article.slug);
      setContentType((article.content_type ?? "article") as ArticleContentType);
      setTitle(article.title ?? "");
      setFeaturedImageUrl(article.featured_image_url);
      setContent(
        resolvePlatformArticleContent(article.content, article.body_html),
      );
      setClientIndustry(article.client_industry ?? "");
      setChallenge(article.challenge ?? "");
      setSolution(article.solution ?? "");
      setResults(article.results ?? "");
      setAuthorName(article.author_name ?? "");
      setAuthorTitle(article.author_title ?? "");
      setAuthorBio(article.author_bio ?? "");
      setAuthorAvatarUrl(article.author_avatar_url ?? null);
      setMetaTitle(article.meta_title ?? "");
      setMetaDescription(article.meta_description ?? "");
      setFeaturedImageAlt(article.featured_image_alt ?? "");
      setFeaturedImageWidth(article.featured_image_width ?? null);
      setFeaturedImageHeight(article.featured_image_height ?? null);
      setKeyTakeaways(Array.isArray(article.key_takeaways) ? article.key_takeaways : []);
      setFaq(Array.isArray(article.faq) ? article.faq : []);
      setTags(Array.isArray(article.tags) ? article.tags : []);
      setPrimaryKeyword(article.primary_keyword ?? "");
      setTargetAudience(article.target_audience ?? "");
      setContentGoal(article.content_goal ?? "");
      setLastSavedAt(article.updated_at ? new Date(article.updated_at) : null);

      const resume = resolveEditorResumeStep(articleId, {
        title: article.title,
        featuredImageUrl: article.featured_image_url,
        content: resolvePlatformArticleContent(article.content, article.body_html),
      });
      setStep(resume.step);
      setMaxStepReached(resume.maxStepReached);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load article");
    } finally {
      setLoading(false);
      loadedRef.current = true;
    }
  }, [articleId]);

  useEffect(() => {
    guideInitializedRef.current = false;
    setShowWritingGuide(false);
    setGuideAutoCollapsed(false);
  }, [articleId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (loading || !articleId || !loadedRef.current || guideInitializedRef.current) return;
    guideInitializedRef.current = true;

    const fromCreate = searchParams.get("guide") === "1";
    const visible = shouldShowEditorGuide({
      articleId,
      status,
      contentType,
      fromCreate,
      title,
      featuredImageUrl,
      content,
      authorName,
      clientIndustry,
      challenge,
      solution,
      results,
    });
    setShowWritingGuide(visible);

    if (fromCreate) {
      router.replace(`/admin/blogs-and-articles/${encodeURIComponent(articleId)}/edit`);
    }
  }, [
    loading,
    articleId,
    status,
    title,
    featuredImageUrl,
    contentType,
    content,
    authorName,
    clientIndustry,
    challenge,
    solution,
    results,
    searchParams,
    router,
  ]);

  useEffect(() => {
    if (!articleId || !loadedRef.current) return;
    saveEditorProgress(articleId, step, maxStepReached);
  }, [articleId, step, maxStepReached]);

  useEffect(() => {
    if (!linkValidationBlocked || step === 3) return;
    goToStep(3);
  }, [linkValidationBlocked, step, goToStep]);

  const handleStepClick = useCallback(
    (index: number) => {
      if (linkValidationBlocked && index !== 3) return;
      goToStep(index);
    },
    [goToStep, linkValidationBlocked],
  );

  const buildPatchBody = useCallback(
    () => ({
      title,
      contentType,
      content,
      featuredImageUrl,
      featuredImageAlt,
      featuredImageWidth,
      featuredImageHeight,
      clientIndustry,
      challenge,
      solution,
      results,
      authorName,
      authorTitle,
      authorBio,
      authorAvatarUrl,
      metaTitle,
      metaDescription,
      keyTakeaways,
      faq,
      tags,
      primaryKeyword,
      targetAudience,
      contentGoal,
    }),
    [
      title,
      contentType,
      content,
      featuredImageUrl,
      featuredImageAlt,
      featuredImageWidth,
      featuredImageHeight,
      clientIndustry,
      challenge,
      solution,
      results,
      authorName,
      authorTitle,
      authorBio,
      authorAvatarUrl,
      metaTitle,
      metaDescription,
      keyTakeaways,
      faq,
      tags,
      primaryKeyword,
      targetAudience,
      contentGoal,
    ],
  );

  const saveDraft = useCallback(
    async (auto = false) => {
      if (!articleId || !editable) return false;
      if (auto && !isDirtyRef.current) return true;
      if (!linkValidation.ok) {
        if (!auto) {
          setError(linkValidation.issues[0]?.message ?? "Fix link issues before saving.");
        }
        return false;
      }
      setSaving(true);
      if (!auto) setError(null);
      try {
        await adminApiPatch(
          `/api/admin/platform-articles/${encodeURIComponent(articleId)}`,
          buildPatchBody(),
        );
        isDirtyRef.current = false;
        const now = new Date();
        setLastSavedAt(now);
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 5000);
        return true;
      } catch (e: unknown) {
        if (!auto) {
          setError(e instanceof Error ? e.message : "Save failed");
        }
        return false;
      } finally {
        setSaving(false);
      }
    },
    [articleId, editable, buildPatchBody, linkValidation],
  );

  useEffect(() => {
    if (!editable) return;
    const timer = window.setInterval(() => {
      if (isDirtyRef.current && !saving && !submitting && linkValidation.ok) {
        void saveDraft(true);
      }
    }, AUTO_SAVE_MS);
    return () => window.clearInterval(timer);
  }, [editable, saveDraft, saving, submitting, linkValidation.ok]);

  const uploadFeatured = async (file: File) => {
    const userId = uploadUserIdRef.current;
    if (!userId) return;
    markDirty();
    const sb = supabaseBrowser();
    const compressed = await compressImage(file, { maxDimension: 1600, quality: 0.85 });
    const ext = compressed.type.includes("webp") ? "webp" : "jpg";
    const path = `platform/${userId}/featured/${articleId}-${Date.now()}.${ext}`;
    const { error: upErr } = await sb.storage.from(UPLOAD_BUCKET).upload(path, compressed, {
      upsert: false,
      contentType: compressed.type,
    });
    if (upErr) throw new Error(upErr.message);
    const { data } = sb.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
    const url = data.publicUrl;
    setFeaturedImageUrl(url);
    await adminApiPost(`/api/admin/platform-articles/${encodeURIComponent(articleId)}/images`, {
      url,
      storagePath: path,
      kind: "featured",
    });
  };

  const uploadInlineImage = (file?: File) => {
    const processFile = async (selected: File) => {
      const userId = uploadUserIdRef.current;
      if (!userId) return;
      try {
        markDirty();
        const sb = supabaseBrowser();
        const compressed = await compressImage(selected, {
          maxDimension: 1400,
          quality: 0.85,
        });
        const ext = compressed.type.includes("webp") ? "webp" : "jpg";
        const path = `platform/${userId}/inline/${articleId}-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from(UPLOAD_BUCKET).upload(path, compressed, {
          upsert: false,
          contentType: compressed.type,
        });
        if (upErr) throw new Error(upErr.message);
        const { data } = sb.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
        const url = data.publicUrl;
        await adminApiPost(`/api/admin/platform-articles/${encodeURIComponent(articleId)}/images`, {
          url,
          storagePath: path,
          kind: "inline",
        });
        editorRef.current?.insertImage(url);
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Image upload failed");
      }
    };

    if (file) {
      void processFile(file);
      return;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const selected = input.files?.[0];
      if (selected) void processFile(selected);
    };
    input.click();
  };

  const submitForReview = async () => {
    if (!articleId) return;
    if (!linkValidation.ok) {
      setError(linkValidation.issues[0]?.message ?? "Fix link issues before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await adminApiPatch(
        `/api/admin/platform-articles/${encodeURIComponent(articleId)}`,
        { ...buildPatchBody(), status: "published" },
      );
      isDirtyRef.current = false;
      setStatus("published");
      router.push("/admin/blogs-and-articles");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitClick = () => {
    if (!linkValidation.ok) {
      setError(linkValidation.issues[0]?.message ?? "Fix link issues before submitting.");
      return;
    }
    void submitForReview();
  };

  const deleteArticle = async () => {
    if (!articleId || !editable) return;

    setDeleting(true);
    setError(null);
    try {
      await adminApiDelete(`/api/admin/platform-articles/${encodeURIComponent(articleId)}`);
      clearEditorProgress(articleId);
      setDeleteConfirmOpen(false);
      router.push("/admin/blogs-and-articles");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const saveStatusText = saving
    ? "Saving…"
    : justSaved
      ? "Saved just now"
      : lastSavedAt
        ? `Last saved at ${formatLastSaved(lastSavedAt)}`
        : null;

  if (!articleId) {
    return <TellacityLoader />;
  }

  const submitDisabled =
    submitting || saving || deleting || !editable || !linkValidation.ok;

  const liveHref =
    status === "published" && slug
      ? `/articles/${encodeURIComponent(slug)}`
      : null;

  return (
    <div
      className={`flex h-full min-h-0 flex-col overflow-hidden bg-[#F5F4F0] ${
        linkValidationBlocked ? "opacity-95" : ""
      }`}
    >
      {loading && <TellacityLoader />}

      <header className="z-10 shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-5 lg:px-6">
          <Link
            href="/admin/blogs-and-articles"
            className="shrink-0 text-xs font-medium text-gray-500 transition-colors hover:text-[#1FAF9E]"
          >
            ← Back
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                {loading ? "Edit article" : articleDisplayTitle(title)}
              </h1>
              {statusBadge(status)}
            </div>
            {!loading ? (
              <p className="truncate text-xs text-gray-500">
                {editorStepLabel(step)}
                {saveStatusText ? ` · ${saveStatusText}` : null}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
            {liveHref ? (
              <Link
                href={liveHref}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50 sm:px-4 sm:py-2 sm:text-sm"
              >
                View live →
              </Link>
            ) : null}
            <span
              className={`inline-flex rounded-lg ${
                showPreviewHint ? "animate-article-preview-egg-flash" : ""
              }`}
            >
              <button
                type="button"
                onClick={openPreview}
                disabled={loading}
                title={
                  showPreviewHint
                    ? "Preview how your article looks — click here"
                    : "Preview article"
                }
                className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
              >
                <Eye className="h-4 w-4" aria-hidden />
                Preview
              </button>
            </span>
            {editable ? (
              <>
                <button
                  type="button"
                  onClick={() => setDeleteConfirmOpen(true)}
                  disabled={deleting || saving || submitting}
                  title="Delete article"
                  aria-label="Delete article"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => void saveDraft()}
                  disabled={saving || submitting || deleting || !linkValidation.ok}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                >
                  Save draft
                </button>
                <button
                  type="button"
                  disabled={submitDisabled}
                  onClick={handleSubmitClick}
                  className="rounded-lg bg-[#1FAF9E] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#189786] disabled:cursor-not-allowed disabled:opacity-50 sm:px-4 sm:py-2 sm:text-sm"
                >
                  {submitting ? "Submitting…" : "Submit"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {isArchived ? (
          <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 sm:px-5">
            This article is archived and not visible publicly. Restore it from the Blogs and Articles
            list to publish again.
          </p>
        ) : null}

      </header>

      <div className="flex min-h-0 flex-1">
        <div
          className={`min-w-0 flex-1 ${
            step === 3
              ? "flex min-h-0 flex-col overflow-hidden px-3 py-3 sm:px-5 lg:px-6"
              : "overflow-y-auto px-4 py-6 sm:px-6 lg:px-8"
          }`}
        >
        {error ? (
          <div className="mx-auto mb-4 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {!loading && editable ? (
          <div className={`mx-auto mb-4 ${step === 3 ? "max-w-none" : "max-w-3xl"}`}>
            <ArticleLinkValidationBanner result={linkValidation} compact={step === 3} />
          </div>
        ) : null}

        <div
          className={`mx-auto ${
            step === 3 ? "flex min-h-0 w-full max-w-none flex-1 flex-col" : "max-w-3xl"
          }`}
        >
          {!loading && editable && showWritingGuide ? (
            <ArticleEditorGuidePanel
              articleId={articleId}
              contentType={contentType}
              autoCollapsed={guideAutoCollapsed}
            />
          ) : null}

          {step === 0 && (
            <StepCard>
              <h2 className="text-lg font-semibold text-gray-900">Article setup</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose your content type and tell readers who wrote this piece before you start
                writing.
              </p>

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700">Content type</p>
                <div className="mt-3 space-y-3">
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-[#1FAF9E]/40 hover:bg-[#1FAF9E]/5">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={contentType === "article"}
                      onChange={() => {
                        setContentType("article");
                        markDirty();
                        syncWritingGuideVisibility("article");
                      }}
                      disabled={!editable}
                    />
                    <span>
                      <span className="font-semibold text-gray-900">Blog</span>
                      <span className="mt-0.5 block text-sm text-gray-500">
                        Blog posts, guides and updates
                      </span>
                    </span>
                  </label>
                  <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 p-4 transition-colors hover:border-[#1FAF9E]/40 hover:bg-[#1FAF9E]/5">
                    <input
                      type="radio"
                      className="mt-1"
                      checked={contentType === "case_study"}
                      onChange={() => {
                        setContentType("case_study");
                        markDirty();
                        syncWritingGuideVisibility("case_study");
                      }}
                      disabled={!editable}
                    />
                    <span>
                      <span className="font-semibold text-gray-900">Case Study</span>
                      <span className="mt-0.5 block text-sm text-gray-500">
                        A before-and-after client story with real results
                      </span>
                    </span>
                  </label>
                </div>
              </div>

              <div className="mt-8 border-t border-gray-100 pt-8">
                <h3 className="text-sm font-semibold text-gray-900">Writer</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Readers like to know who wrote the article. Add a name and role for the byline on
                  your published page.
                </p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="author-name" className="block text-sm font-medium text-gray-700">
                      Writer name
                    </label>
                    <input
                      id="author-name"
                      value={authorName}
                      onChange={(e) => {
                        setAuthorName(e.target.value);
                        markDirty();
                      }}
                      disabled={!editable}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                      placeholder="John Smith"
                    />
                  </div>
                  <div>
                    <label htmlFor="author-title" className="block text-sm font-medium text-gray-700">
                      Occupation
                    </label>
                    <input
                      id="author-title"
                      value={authorTitle}
                      onChange={(e) => {
                        setAuthorTitle(e.target.value);
                        markDirty();
                      }}
                      disabled={!editable}
                      className="mt-1.5 w-full rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                      placeholder="Marketing Director"
                    />
                  </div>
                </div>
              </div>
            </StepCard>
          )}

          {step === 1 && (
            <StepCard>
              <label className="block text-sm font-semibold text-gray-900" htmlFor="title">
                Title
              </label>
              <p className="mt-1 text-sm text-gray-500">
                A clear, descriptive title helps readers find your article.
              </p>
              <input
                id="title"
                value={title}
                onFocus={collapseGuideForEditing}
                onChange={(e) => {
                  setTitle(e.target.value);
                  markDirty();
                  collapseGuideForEditing();
                }}
                disabled={!editable}
                className="mt-4 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                placeholder="How we improved customer trust"
              />
            </StepCard>
          )}

          {step === 2 && (
            <StepCard>
              <h2 className="text-sm font-semibold text-gray-900">Featured image</h2>
              <div className="mt-4">
                <ArticleFeaturedImageUpload
                  imageUrl={featuredImageUrl}
                  disabled={!editable}
                  onUpload={uploadFeatured}
                  onRemove={() => {
                    setFeaturedImageUrl(null);
                    markDirty();
                  }}
                />
              </div>
            </StepCard>
          )}

          {step === 3 && (
            <div
              className={`relative flex min-h-0 flex-1 flex-col ${
                linkValidationBlocked ? "grayscale-[0.35]" : ""
              }`}
            >
              {linkValidationBlocked ? (
                <ArticleExternalLinkBlocker
                  externalLinkCount={linkValidation.externalLinkCount}
                  maxExternalLinks={linkValidation.maxExternalLinks}
                  message={linkValidation.issues[0]?.message}
                />
              ) : null}
              <ArticleDocumentEditor
                fillViewport
                ref={editorRef}
                value={content}
                onChange={(doc) => {
                  setContent(doc);
                  markDirty();
                  collapseGuideForEditing();
                }}
                onEditorFocus={collapseGuideForEditing}
                onInsertImage={editable ? () => uploadInlineImage() : undefined}
                onInsertImageFile={editable ? (f) => uploadInlineImage(f) : undefined}
                disabled={!editable}
                validateLinkInsert={validateLinkInsert}
                externalLinkLimitReached={externalLinkLimitReached}
                caseStudyFields={
                  contentType === "case_study" ? (
                    <ArticleCaseStudyFields
                      clientIndustry={clientIndustry}
                      challenge={challenge}
                      solution={solution}
                      results={results}
                      onClientIndustry={(v) => {
                        setClientIndustry(v);
                        markDirty();
                        collapseGuideForEditing();
                      }}
                      onChallenge={(v) => {
                        setChallenge(v);
                        markDirty();
                        collapseGuideForEditing();
                      }}
                      onSolution={(v) => {
                        setSolution(v);
                        markDirty();
                        collapseGuideForEditing();
                      }}
                      onResults={(v) => {
                        setResults(v);
                        markDirty();
                        collapseGuideForEditing();
                      }}
                      disabled={!editable}
                    />
                  ) : undefined
                }
              />
            </div>
          )}

          {step === 4 && (
            <StepCard>
              <h2 className="text-lg font-semibold text-gray-900">Ready to submit?</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                Submitting publishes your article on the public Articles hub. You can keep editing
                after it is live — use Save draft to store changes without publishing.
              </p>
              <p className="mt-4 text-sm text-gray-600">
                Use <strong>Submit</strong> in the header when you are ready.
              </p>
            </StepCard>
          )}

          {step !== 3 ? (
            <div className="mt-8 flex justify-between pb-8">
            <button
              type="button"
              disabled={step === 0 || linkValidationBlocked}
              onClick={() => handleStepClick(Math.max(0, step - 1))}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-white/80 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={step >= STEPS.length - 1 || linkValidationBlocked}
              onClick={() => handleStepClick(Math.min(STEPS.length - 1, step + 1))}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-[#1FAF9E] transition-colors hover:bg-white/80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
            </div>
          ) : null}
        </div>
        </div>

        <aside className="w-14 shrink-0 border-l border-gray-200 bg-[#FAFAF8] sm:w-44 lg:w-52">
          <ArticleEditorStepper
            variant="vertical"
            steps={STEPS}
            currentStep={step}
            maxReachableStep={linkValidationBlocked ? 3 : maxStepReached}
            onStepClick={handleStepClick}
          />
        </aside>
      </div>

      {deleteConfirmOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4">
          <div
            className="w-full max-w-[340px] rounded-lg bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-editor-article-title"
          >
            <h3 id="delete-editor-article-title" className="text-sm font-semibold text-gray-900">
              Delete article?
            </h3>
            <p className="mt-3 text-sm text-gray-600">
              Are you sure you want to delete{" "}
              <span className="font-medium text-gray-900">{articleDisplayTitle(title)}</span>? This
              cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                disabled={deleting}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void deleteArticle()}
                disabled={deleting}
                className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <ArticlePreviewModal
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        title={title}
        contentType={contentType}
        content={content}
        featuredImageUrl={featuredImageUrl}
        clientIndustry={clientIndustry}
        challenge={challenge}
        solution={solution}
        results={results}
        authorName={authorName}
        authorTitle={authorTitle}
        business={null}
        metrics={null}
        loadingBusiness={false}
      />
    </div>
  );
}
