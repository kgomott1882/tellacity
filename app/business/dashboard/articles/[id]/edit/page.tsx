"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import ArticleDocumentEditor, {
  type ArticleDocumentEditorHandle,
} from "@/components/articles/editor/ArticleDocumentEditor";
import ArticleEditorStepper from "@/components/articles/editor/ArticleEditorStepper";
import ArticleEditorStepNav from "@/components/articles/editor/ArticleEditorStepNav";
import ArticleFeaturedImageUpload from "@/components/articles/editor/ArticleFeaturedImageUpload";
import ArticleWriterSetupFields from "@/components/articles/editor/ArticleWriterSetupFields";
import ArticleCaseStudyFields from "@/components/articles/editor/ArticleCaseStudyFields";
import ArticleLinkValidationBanner from "@/components/articles/editor/ArticleLinkValidationBanner";
import ArticleExternalLinkBlocker from "@/components/articles/editor/ArticleExternalLinkBlocker";
import ArticlePreviewModal, {
  type ArticlePreviewBusiness,
  type ArticlePreviewMetrics,
} from "@/components/articles/editor/ArticlePreviewModal";
import ArticleSubmitUpgradeModal, {
  type ArticleSubmitBlockReason,
} from "@/components/articles/editor/ArticleSubmitUpgradeModal";
import ArticleEditorGuidePanel from "@/components/articles/editor/ArticleEditorGuidePanel";
import { shouldShowEditorGuide } from "@/lib/articles/articleEditorGuide";
import {
  hasMoreThanParagraphContent,
  hasSeenArticlePreviewHint,
  markArticlePreviewHintSeen,
} from "@/lib/articles/articlePreviewHint";
import { compressImage } from "@/lib/imageCompression";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import {
  uploadArticleFeaturedImageFile,
  uploadArticleWriterAvatarFile,
} from "@/lib/articles/clientFeaturedImage";
import {
  dashboardApiGet,
  dashboardApiPost,
  dashboardApiPatch,
  dashboardApiDelete,
} from "@/lib/dashboardApiFetch";
import { formatLastSaved } from "@/lib/articles/editorStats";
import {
  resolveEditorResumeStep,
  saveEditorProgress,
  EDITOR_CONTENT_STEP,
  EDITOR_STEP_LABELS,
  EDITOR_SUBMIT_STEP,
  EDITOR_WRITER_STEP,
  editorStepLabel,
  clearEditorProgress,
} from "@/lib/articles/articleEditorProgress";
import { articleDisplayTitle } from "@/lib/articles/articleDisplay";
import { useBusinessContext } from "../../../_context/BusinessContext";
import PageLoadingOverlay from "../../../_components/PageLoadingOverlay";
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
import { getExternalLinkLimitForPlan } from "@/lib/plans";
import { articleEditorReturnPath } from "@/lib/articleSubmitFlow";
import { Eye, Trash2 } from "lucide-react";

const UPLOAD_BUCKET = "article_media";
const STEPS = EDITOR_STEP_LABELS;
const AUTO_SAVE_MS = 30_000;

type ArticlePayload = {
  id: string;
  business_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: ArticleContentDoc;
  content_type: ArticleContentType;
  featured_image_url: string | null;
  status: string;
  client_industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  author_name: string | null;
  author_title: string | null;
  author_bio: string | null;
  author_avatar_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured_image_alt: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  key_takeaways: string[] | null;
  faq: ArticleFaqItem[] | null;
  tags: string[] | null;
  primary_keyword: string | null;
  target_audience: string | null;
  content_goal: string | null;
  rejection_reason: string | null;
  updated_at?: string;
};

type RevisionPayload = {
  id: string;
  status: string;
  version_number: number;
  title: string;
  excerpt: string | null;
  content: ArticleContentDoc;
  content_type: ArticleContentType;
  featured_image_url: string | null;
  client_industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  author_name: string | null;
  author_title: string | null;
  author_bio: string | null;
  author_avatar_url: string | null;
  meta_title: string | null;
  meta_description: string | null;
  featured_image_alt: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  key_takeaways: string[] | null;
  faq: ArticleFaqItem[] | null;
  tags: string[] | null;
  primary_keyword: string | null;
  target_audience: string | null;
  content_goal: string | null;
  rejection_reason: string | null;
  updated_at?: string;
};

type UsagePayload = {
  used: number;
  limit: number;
  remaining: number;
  canSubmit?: boolean;
  requiresPlanUpgrade?: boolean;
  upgradeCta?: string;
  plan?: string;
};

function statusBadge(articleStatus: string, revisionStatus: string | null) {
  if (articleStatus === "published" && revisionStatus === "pending_review") {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
        Pending review (updated version)
      </span>
    );
  }
  if (articleStatus === "published" && revisionStatus === "draft") {
    return (
      <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
        Published · editing update
      </span>
    );
  }
  if (articleStatus === "published" && revisionStatus === "rejected") {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-800">
        Update rejected
      </span>
    );
  }

  const map: Record<string, { label: string; className: string }> = {
    draft: { label: "Draft", className: "bg-gray-100 text-gray-700" },
    pending_review: { label: "Pending Review", className: "bg-amber-100 text-amber-900" },
    published: { label: "Published", className: "bg-emerald-100 text-emerald-800" },
    rejected: { label: "Rejected", className: "bg-red-100 text-red-800" },
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

export default function ArticleEditorPage() {
  const params = useParams<{ id: string }>();
  const articleId = params?.id ?? "";
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBusiness } = useBusinessContext();
  const selectedBusinessId = selectedBusiness?.id ?? "";
  const [articleOwnerBusinessId, setArticleOwnerBusinessId] = useState<string | null>(null);
  const [articleReady, setArticleReady] = useState(false);
  const businessId = articleOwnerBusinessId ?? selectedBusinessId;
  const editorRef = useRef<ArticleDocumentEditorHandle>(null);

  const [step, setStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [publishedDeleteNoticeOpen, setPublishedDeleteNoticeOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] =
    useState<ArticleSubmitBlockReason>("plan");
  const [error, setError] = useState<string | null>(null);
  const [usage, setUsage] = useState<UsagePayload | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [justSaved, setJustSaved] = useState(false);

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
  const [revisionStatus, setRevisionStatus] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewHintDismissed, setPreviewHintDismissed] = useState(false);
  const [previewBusiness, setPreviewBusiness] = useState<ArticlePreviewBusiness | null>(null);
  const [previewMetrics, setPreviewMetrics] = useState<ArticlePreviewMetrics | null>(null);
  const [previewBusinessLoading, setPreviewBusinessLoading] = useState(false);
  const [showWritingGuide, setShowWritingGuide] = useState(false);
  const [guideAutoCollapsed, setGuideAutoCollapsed] = useState(false);

  const isDirtyRef = useRef(false);
  const loadedRef = useRef(false);
  const guideInitializedRef = useRef(false);
  const uploadContextRef = useRef<{ businessId: string; articleId: string } | null>(null);

  const isArchived = status === "archived";
  const revisionMode = status === "published";
  const titleLocked = revisionMode;
  const editable =
    articleReady &&
    !isArchived &&
    (status === "draft" ||
      status === "rejected" ||
      (revisionMode && (revisionStatus === "draft" || revisionStatus === "rejected")));
  const thumbnailEditable = editable;
  const revisionPending = revisionMode && revisionStatus === "pending_review";
  const deleteBlocked = status === "published";

  const maxExternalLinks = useMemo(
    () => getExternalLinkLimitForPlan(usage?.plan ?? selectedBusiness?.plan),
    [usage?.plan, selectedBusiness?.plan],
  );

  const linkValidation = useMemo(
    () =>
      validateArticleLinks({
        content,
        caseStudyFields: {
          clientIndustry,
          challenge,
          solution,
          results,
        },
        businessWebsite: selectedBusiness?.website,
        maxExternalLinks,
      }),
    [
      content,
      clientIndustry,
      challenge,
      solution,
      results,
      selectedBusiness?.website,
      maxExternalLinks,
    ],
  );

  const linkValidationBlocked = !linkValidation.ok;
  const externalLinkLimitReached =
    linkValidation.externalLinkCount >= linkValidation.maxExternalLinks && linkValidation.ok;

  const validateLinkInsert = useCallback(
    (href: string, options?: { replacingHref?: string }) =>
      validateProposedArticleLink(
        href,
        {
          content,
          caseStudyFields: {
            clientIndustry,
            challenge,
            solution,
            results,
          },
          businessWebsite: selectedBusiness?.website,
          maxExternalLinks,
        },
        { replacingHref: options?.replacingHref },
      ),
    [
      content,
      clientIndustry,
      challenge,
      solution,
      results,
      selectedBusiness?.website,
      maxExternalLinks,
    ],
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

  const loadPreviewBusiness = useCallback(async () => {
    if (!businessId || !articleId) return;
    setPreviewBusinessLoading(true);
    try {
      const res = await dashboardApiGet<{
        business?: ArticlePreviewBusiness;
        metrics?: ArticlePreviewMetrics;
      }>(
        `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}/preview-data`,
      );
      if (res?.business) setPreviewBusiness(res.business);
      if (res?.metrics) setPreviewMetrics(res.metrics);
    } catch {
      setPreviewBusiness(null);
      setPreviewMetrics(null);
    } finally {
      setPreviewBusinessLoading(false);
    }
  }, [businessId, articleId]);

  const openPreview = useCallback(() => {
    if (articleId) {
      markArticlePreviewHintSeen(articleId);
      setPreviewHintDismissed(true);
    }
    setPreviewOpen(true);
    if (!previewBusiness && !previewBusinessLoading) {
      void loadPreviewBusiness();
    }
  }, [articleId, loadPreviewBusiness, previewBusiness, previewBusinessLoading]);

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
    if (!selectedBusinessId || !articleId) return;
    setLoading(true);
    setError(null);
    setArticleReady(false);
    setArticleOwnerBusinessId(null);
    uploadContextRef.current = null;
    loadedRef.current = false;
    isDirtyRef.current = false;
    try {
      const [articleRes, usageRes] = await Promise.all([
        dashboardApiGet<{ article?: ArticlePayload; revision?: RevisionPayload | null }>(
          `/api/business/${encodeURIComponent(selectedBusinessId)}/articles/${encodeURIComponent(articleId)}`,
        ),
        dashboardApiGet<UsagePayload>(
          `/api/business/${encodeURIComponent(selectedBusinessId)}/articles/usage`,
        ),
      ]);
      let article = articleRes?.article;
      if (!article) throw new Error("Blog or case study not found");

      const ownerBusinessId = article.business_id || selectedBusinessId;
      setArticleOwnerBusinessId(ownerBusinessId);
      uploadContextRef.current = { businessId: ownerBusinessId, articleId };

      let revision = articleRes?.revision ?? null;
      if (article.status === "published" && !revision) {
        const beginRes = await dashboardApiPost<{
          revision?: RevisionPayload;
        }>(
          `/api/business/${encodeURIComponent(ownerBusinessId)}/articles/${encodeURIComponent(articleId)}/revision/begin`,
          {},
        );
        revision = beginRes?.revision ?? null;
      }

      setUsage(usageRes);
      setStatus(article.status);

      const source =
        article.status === "published" && revision ? revision : article;

      setContentType((source.content_type ?? article.content_type) as ArticleContentType);
      setTitle(source.title ?? article.title ?? "");
      setFeaturedImageUrl(source.featured_image_url ?? article.featured_image_url);
      setContent(source.content ?? article.content ?? emptyArticleDoc());
      setClientIndustry(source.client_industry ?? article.client_industry ?? "");
      setChallenge(source.challenge ?? article.challenge ?? "");
      setSolution(source.solution ?? article.solution ?? "");
      setResults(source.results ?? article.results ?? "");
      setAuthorName(source.author_name ?? article.author_name ?? "");
      setAuthorTitle(source.author_title ?? article.author_title ?? "");
      setAuthorBio(source.author_bio ?? article.author_bio ?? "");
      setAuthorAvatarUrl(source.author_avatar_url ?? article.author_avatar_url ?? null);
      setMetaTitle(source.meta_title ?? article.meta_title ?? "");
      setMetaDescription(source.meta_description ?? article.meta_description ?? "");
      setFeaturedImageAlt(source.featured_image_alt ?? article.featured_image_alt ?? "");
      setFeaturedImageWidth(
        source.featured_image_width ?? article.featured_image_width ?? null,
      );
      setFeaturedImageHeight(
        source.featured_image_height ?? article.featured_image_height ?? null,
      );
      setKeyTakeaways(
        Array.isArray(source.key_takeaways ?? article.key_takeaways)
          ? (source.key_takeaways ?? article.key_takeaways) ?? []
          : [],
      );
      setFaq(
        Array.isArray(source.faq ?? article.faq) ? (source.faq ?? article.faq) ?? [] : [],
      );
      setTags(Array.isArray(source.tags ?? article.tags) ? (source.tags ?? article.tags) ?? [] : []);
      setPrimaryKeyword(source.primary_keyword ?? article.primary_keyword ?? "");
      setTargetAudience(source.target_audience ?? article.target_audience ?? "");
      setContentGoal(source.content_goal ?? article.content_goal ?? "");
      setRevisionStatus(
        article.status === "published" ? (revision?.status ?? null) : null,
      );
      setLastSavedAt(
        source.updated_at ? new Date(source.updated_at) : null,
      );

      const resume = resolveEditorResumeStep(articleId, {
        title: source.title ?? article.title,
        featuredImageUrl: source.featured_image_url ?? article.featured_image_url,
        content: source.content ?? article.content,
      });
      setStep(resume.step);
      setMaxStepReached(resume.maxStepReached);
      setArticleReady(true);
      loadedRef.current = true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load blog or case study");
      setArticleReady(false);
      uploadContextRef.current = null;
      loadedRef.current = false;
    } finally {
      setLoading(false);
    }
  }, [selectedBusinessId, articleId]);

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
      router.replace(`/business/dashboard/articles/${encodeURIComponent(articleId)}/edit`);
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
    if (!linkValidationBlocked || step === EDITOR_CONTENT_STEP) return;
    goToStep(EDITOR_CONTENT_STEP);
  }, [linkValidationBlocked, step, goToStep]);

  const handleStepClick = useCallback(
    (index: number) => {
      if (linkValidationBlocked && index !== EDITOR_CONTENT_STEP) return;
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
      if (!businessId || !articleId || !editable) return false;
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
        const patchUrl = revisionMode
          ? `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}/revision`
          : `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}`;
        await dashboardApiPatch(patchUrl, buildPatchBody());
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
    [businessId, articleId, editable, buildPatchBody, linkValidation, revisionMode],
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

  const resolveUploadContext = () => {
    const ctx = uploadContextRef.current;
    if (!articleReady || !ctx?.businessId || !ctx.articleId) {
      throw new Error("Article is still loading — please try again in a moment.");
    }
    return ctx;
  };

  const uploadAuthorAvatar = async (file: File) => {
    const ctx = resolveUploadContext();
    try {
      const url = await uploadArticleWriterAvatarFile(ctx.businessId, ctx.articleId, file);
      setAuthorAvatarUrl(url);
      markDirty();
    } catch (e: unknown) {
      throw e instanceof Error ? e : new Error("Avatar upload failed");
    }
  };

  const uploadFeatured = async (file: File) => {
    const ctx = resolveUploadContext();
    if (revisionMode && !editable) {
      throw new Error("Wait for review on your current update before changing the thumbnail.");
    }
    try {
      const url = await uploadArticleFeaturedImageFile(ctx.businessId, ctx.articleId, file);
      setFeaturedImageUrl(url);
      markDirty();

      if (revisionMode && editable) {
        await dashboardApiPatch(
          `/api/business/${encodeURIComponent(ctx.businessId)}/articles/${encodeURIComponent(ctx.articleId)}/revision`,
          { ...buildPatchBody(), featuredImageUrl: url },
        );
        isDirtyRef.current = false;
        const now = new Date();
        setLastSavedAt(now);
        setJustSaved(true);
        window.setTimeout(() => setJustSaved(false), 5000);
      }
    } catch (e: unknown) {
      throw e instanceof Error ? e : new Error("Image upload failed");
    }
  };

  const uploadInlineImage = (file?: File) => {
    const processFile = async (selected: File) => {
      let ctx: { businessId: string; articleId: string };
      try {
        ctx = resolveUploadContext();
      } catch (e: unknown) {
        alert(e instanceof Error ? e.message : "Article is still loading");
        return;
      }
      try {
        markDirty();
        const sb = supabaseBrowser();
        const compressed = await compressImage(selected, {
          maxDimension: 1400,
          quality: 0.85,
        });
        const ext = compressed.type.includes("webp") ? "webp" : "jpg";
        const path = `${ctx.businessId}/inline/${ctx.articleId}-${Date.now()}.${ext}`;
        const { error: upErr } = await sb.storage.from(UPLOAD_BUCKET).upload(path, compressed, {
          upsert: false,
          contentType: compressed.type,
        });
        if (upErr) throw new Error(upErr.message);
        const { data } = sb.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
        const url = data.publicUrl;
        await dashboardApiPost(
          `/api/business/${encodeURIComponent(ctx.businessId)}/articles/${encodeURIComponent(ctx.articleId)}/images`,
          {
            url,
            storagePath: path,
            kind: "inline",
          },
        );
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
    if (!businessId || !articleId) return;
    if (!linkValidation.ok) {
      setError(linkValidation.issues[0]?.message ?? "Fix link issues before submitting.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await dashboardApiPatch(
        revisionMode
          ? `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}/revision`
          : `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}`,
        buildPatchBody(),
      );
      isDirtyRef.current = false;
      if (revisionMode) {
        await dashboardApiPost(
          `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}/revision/submit`,
          {},
        );
      } else {
        await dashboardApiPost(
          `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}/submit`,
          {},
        );
      }
      router.push("/business/dashboard/articles");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Submit failed";
      if (
        msg.includes("Grow plan") ||
        msg.includes("Article submissions require") ||
        msg.toLowerCase().includes("limit")
      ) {
        setUpgradeModalReason(
          (usage?.limit ?? 0) <= 0 ? "plan" : "quota",
        );
        setUpgradeModalOpen(true);
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const openSubmitUpgradeModal = (reason: ArticleSubmitBlockReason) => {
    setUpgradeModalReason(reason);
    setUpgradeModalOpen(true);
  };

  const handleSubmitClick = () => {
    if (!linkValidation.ok) {
      setError(linkValidation.issues[0]?.message ?? "Fix link issues before submitting.");
      return;
    }
    if (step < EDITOR_WRITER_STEP) {
      goToStep(EDITOR_WRITER_STEP);
      return;
    }
    if (step === EDITOR_WRITER_STEP) {
      goToStep(EDITOR_SUBMIT_STEP);
      return;
    }
    if (loading || !usage) {
      setError("Still loading your plan details — please try Submit again in a moment.");
      return;
    }
    if (revisionMode) {
      void submitForReview();
      return;
    }
    if (usage.canSubmit) {
      void submitForReview();
      return;
    }
    openSubmitUpgradeModal(
      usage.requiresPlanUpgrade || usage.plan === "free" ? "plan" : "quota",
    );
  };

  const articleReturnPath = articleEditorReturnPath(articleId);

  const deleteArticle = async () => {
    if (!businessId || !articleId || !editable || deleteBlocked) return;

    setDeleting(true);
    setError(null);
    try {
      await dashboardApiDelete(
        `/api/business/${encodeURIComponent(businessId)}/articles/${encodeURIComponent(articleId)}`,
      );
      clearEditorProgress(articleId);
      setDeleteConfirmOpen(false);
      router.push("/business/dashboard/articles");
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

  if (!businessId || !articleId) {
    return <PageLoadingOverlay />;
  }

  const hasSubmitCredits =
    (usage?.limit ?? 0) > 0 && (usage?.remaining ?? 0) > 0;
  const submitDisabled =
    submitting || saving || deleting || !editable || !linkValidation.ok || revisionPending;

  return (
    <div
      className={`-mx-4 -my-6 flex flex-col bg-[#F5F4F0] lg:-mx-10 lg:-my-8 ${
        step === EDITOR_CONTENT_STEP
          ? "h-[calc(100vh-4rem)] min-h-0"
          : "min-h-[calc(100vh-4rem)]"
      } ${linkValidationBlocked ? "opacity-95" : ""}`}
    >
      {loading && <PageLoadingOverlay />}

      <header className="sticky top-0 z-30 shrink-0 border-b border-gray-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2 sm:px-5 lg:px-6">
          <Link
            href="/business/dashboard/articles"
            className="shrink-0 text-xs font-medium text-gray-500 transition-colors hover:text-[#1FAF9E]"
          >
            ← Back
          </Link>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-sm font-semibold text-gray-900 sm:text-base">
                {loading ? "Edit article" : articleDisplayTitle(title)}
              </h1>
              {statusBadge(status, revisionStatus)}
            </div>
            {!loading ? (
              <p className="truncate text-xs text-gray-500">
                {editorStepLabel(step)}
                {saveStatusText ? ` · ${saveStatusText}` : null}
              </p>
            ) : null}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
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
                  onClick={() => {
                    if (deleteBlocked) {
                      setPublishedDeleteNoticeOpen(true);
                      return;
                    }
                    setDeleteConfirmOpen(true);
                  }}
                  disabled={deleting || saving || submitting}
                  title={
                    deleteBlocked
                      ? "Published articles cannot be deleted"
                      : "Delete article"
                  }
                  aria-label={
                    deleteBlocked
                      ? "Delete article (not available for published articles)"
                      : "Delete article"
                  }
                  aria-disabled={deleteBlocked}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-200 text-red-600 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                    deleteBlocked
                      ? "cursor-not-allowed opacity-40 hover:bg-transparent"
                      : "hover:bg-red-50"
                  }`}
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
                  {submitting
                    ? "Submitting…"
                    : revisionMode
                      ? "Submit update"
                      : "Submit"}
                </button>
              </>
            ) : null}
          </div>
        </div>

        {isArchived ? (
          <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 sm:px-5">
            This article is archived and not visible publicly. Restore it from the Articles dashboard
            to publish again.
          </p>
        ) : null}

        {revisionPending ? (
          <p className="border-t border-amber-100 bg-amber-50 px-3 py-2 text-xs text-amber-900 sm:px-5">
            Your updated version is awaiting review. The last approved version stays live on your
            profile until an admin approves your changes.
          </p>
        ) : revisionMode && editable ? (
          <p className="border-t border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-900 sm:px-5">
            You are editing a draft update. The live article stays unchanged until your changes are
            approved.
          </p>
        ) : null}

      </header>

      <div className="flex min-h-0 flex-1">
        <div
          className={`min-w-0 flex-1 ${
            step === EDITOR_CONTENT_STEP
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
          <div
            className={`mx-auto mb-4 ${step === EDITOR_CONTENT_STEP ? "max-w-none" : "max-w-3xl"}`}
          >
            <ArticleLinkValidationBanner
              result={linkValidation}
              compact={step === EDITOR_CONTENT_STEP}
            />
          </div>
        ) : null}

        <div
          className={`mx-auto ${
            step === EDITOR_CONTENT_STEP ? "flex min-h-0 w-full max-w-none flex-1 flex-col" : "max-w-3xl"
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
                Choose your content type before you start writing. You can add the writer byline on
                the Writer step before submitting.
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

            </StepCard>
          )}

          {step === 1 && (
            <StepCard>
              <label className="block text-sm font-semibold text-gray-900" htmlFor="title">
                Title
              </label>
              <p className="mt-1 text-sm text-gray-500">
                {titleLocked
                  ? "The title is locked after publishing. You can still update the featured image."
                  : "A clear, descriptive title helps readers find your article."}
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
                disabled={!editable || titleLocked}
                className={`mt-4 w-full rounded-lg border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20 ${
                  titleLocked ? "cursor-not-allowed bg-gray-50" : "bg-white"
                }`}
                placeholder="How we improved customer trust"
              />
            </StepCard>
          )}

          {step === 2 && (
            <StepCard>
              <h2 className="text-sm font-semibold text-gray-900">Featured image</h2>
              {revisionMode ? (
                <p className="mt-2 text-sm text-amber-900/90">
                  Thumbnail changes are saved to your draft update. The live public image stays
                  unchanged until an admin approves your submitted version.
                </p>
              ) : null}
              <div className="mt-4">
                <ArticleFeaturedImageUpload
                  imageUrl={featuredImageUrl}
                  disabled={!thumbnailEditable}
                  onUpload={uploadFeatured}
                  onRemove={() => {
                    setFeaturedImageUrl(null);
                    markDirty();
                  }}
                />
              </div>
            </StepCard>
          )}

          {step === EDITOR_CONTENT_STEP && (
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

          {step === EDITOR_WRITER_STEP && (
            <StepCard>
              <ArticleWriterSetupFields
                authorName={authorName}
                authorTitle={authorTitle}
                authorAvatarUrl={authorAvatarUrl}
                disabled={!editable}
                onAuthorNameChange={(v) => {
                  setAuthorName(v);
                  markDirty();
                }}
                onAuthorTitleChange={(v) => {
                  setAuthorTitle(v);
                  markDirty();
                }}
                onUploadAvatar={uploadAuthorAvatar}
                onRemoveAvatar={() => {
                  setAuthorAvatarUrl(null);
                  markDirty();
                }}
              />
            </StepCard>
          )}

          {step === EDITOR_SUBMIT_STEP && (
            <StepCard>
              <h2 className="text-lg font-semibold text-gray-900">
                {revisionMode ? "Ready to submit your update?" : "Ready to submit?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {revisionMode ? (
                  <>
                    Submitting sends your updated version for review. Your current live article
                    stays public until an admin approves the changes. Revisions do not use a monthly
                    submission credit.
                  </>
                ) : (
                  <>
                    Submitting sends your blog or case study to Tellacity for review. One credit is
                    used when you submit; credits are returned if we reject it.
                  </>
                )}
              </p>
              {!revisionMode && !hasSubmitCredits && (usage?.limit ?? 0) > 0 ? (
                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                  No submission credits remaining this month. Click Submit to upgrade for more.
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  disabled={submitDisabled}
                  onClick={handleSubmitClick}
                  className="rounded-lg bg-[#1FAF9E] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#189786] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting
                    ? "Submitting…"
                    : revisionMode
                      ? "Submit update"
                      : "Submit for review"}
                </button>
                {!revisionMode && hasSubmitCredits ? (
                  <p className="text-sm text-gray-500">
                    {(usage?.remaining ?? 0) === 1
                      ? "1 submission credit remaining this month."
                      : `${usage?.remaining ?? 0} submission credits remaining this month.`}
                  </p>
                ) : null}
              </div>
            </StepCard>
          )}

          <ArticleEditorStepNav
            step={step}
            stepCount={STEPS.length}
            linkValidationBlocked={linkValidationBlocked}
            pinned={step === EDITOR_CONTENT_STEP}
            onPrevious={() => handleStepClick(Math.max(0, step - 1))}
            onNext={() => handleStepClick(Math.min(STEPS.length - 1, step + 1))}
          />
        </div>
        </div>

        <aside className="w-14 shrink-0 border-l border-gray-200 bg-[#FAFAF8] sm:w-44 lg:w-52">
          <ArticleEditorStepper
            variant="vertical"
            steps={STEPS}
            currentStep={step}
            maxReachableStep={linkValidationBlocked ? EDITOR_CONTENT_STEP : maxStepReached}
            onStepClick={handleStepClick}
          />
        </aside>
      </div>

      {publishedDeleteNoticeOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/20 p-4">
          <div
            className="w-full max-w-sm rounded-lg bg-white p-5 shadow-lg"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="published-delete-notice-title"
          >
            <h3
              id="published-delete-notice-title"
              className="text-sm font-semibold text-gray-900"
            >
              Cannot delete published article
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Published articles cannot be deleted. To remove this article from your public profile,
              archive it from the Articles dashboard instead.
            </p>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setPublishedDeleteNoticeOpen(false)}
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
        authorAvatarUrl={authorAvatarUrl}
        business={previewBusiness}
        metrics={previewMetrics}
        loadingBusiness={previewBusinessLoading}
      />

      <ArticleSubmitUpgradeModal
        open={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        reason={upgradeModalReason}
        usage={usage}
        articleReturnPath={articleReturnPath}
      />
    </div>
  );
}
