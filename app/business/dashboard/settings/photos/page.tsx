"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Eye,
  GripVertical,
  Lock,
  Pencil,
  Plus,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import PageLoadingOverlay from "../../_components/PageLoadingOverlay";
import {
  getPhotoLimitForPlan,
  normalizePlanCodeToKey,
  PLAN_PHOTO_LIMITS,
  type PlanKey,
} from "@/lib/plans";
import { applyBusinessPhotosOrdering } from "@/lib/businessPhotosQuery";
import { countPhotosHiddenOnPublicProfile } from "@/lib/businessPhotosPublicCap";
import { openUpgradeFlow } from "@/lib/upgradeFlow";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";
import {
  evaluateFreePlanExclusiveUpload,
  isFreePlanExclusiveUploadResponse,
  isPhotoLimitResponse,
} from "@/lib/photoUploadFreeLimit";
import { compressImage } from "@/lib/imageCompression";
import PhotoLimitModal from "@/components/business/PhotoLimitModal";
import {
  GrowUnlockButton,
  GrowUnlockLink,
} from "@/components/dashboard/GrowUnlockCta";
import { useGrowUnlockCta } from "@/hooks/useGrowUnlockCta";
import WriteReviewItemContent from "@/components/reviews/WriteReviewItemContent";

const UPLOAD_BUCKET = "business_media";
const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Bulk delete / bulk publish selection cap (checkboxes in drafts grid). */
const MAX_BULK_DRAFT_SELECTION = 5;

const BUILTIN_SECTION_HINTS: Record<string, string> = {
  gallery: "Your main image strip on your public profile.",
  products: "What you sell at a glance.",
  services: "How you help customers.",
};

const ACTIVE_BUILTIN_SECTION_SLUGS = new Set(["gallery", "products", "services"]);
const LEGACY_BUILTIN_SECTION_SLUGS = new Set(["team", "workspace", "fleet-logistics"]);

/** Brand asset(s) for the Gallery section “Preview Example” modal (`public/brand`). */
const GALLERY_EXAMPLE_IMAGE_PATHS = [
  "/brand/Gallery%20Photos.png",
] as const;

/** Brand asset(s) for the Products section “Preview Example” modal (`public/brand`). */
const PRODUCTS_EXAMPLE_IMAGE_PATHS = [
  "/brand/Products%20Photos.png",
] as const;

/** Built-in `services` row: legacy DB title "Services" displays as "Other". */
function normalizePhotoSectionTitle(slug: string, title: string): string {
  const s = slug.trim().toLowerCase();
  if (s === "services" && title.trim() === "Services") return "Other";
  return title;
}

type ModerationStatus = "pending" | "approved" | "rejected" | "flagged";

type PhotoRow = {
  id: string;
  url: string;
  section: string;
  sort_order: number;
  is_cover: boolean;
  status: "draft" | "published";
  published_at: string | null;
  created_at: string | null;
  moderation_status: ModerationStatus;
  moderation_reason: string | null;
  is_suspected_collage: boolean;
  upload_batch_id: string | null;
  upload_batch_label: string | null;
  preview_zoom: number;
  preview_x: number;
  preview_y: number;
  preview_frame: "landscape" | "portrait";
  product_name: string | null;
  product_description: string | null;
  product_price: number | null;
  product_currency: string;
  product_redirect_url: string | null;
};

/** In-progress edits for the label shown on the public profile (name + reviews only). */
type ProductDraft = {
  name: string;
};

type SectionRow = {
  id: string;
  slug: string;
  title: string;
  is_enabled: boolean;
  is_builtin: boolean;
  sort_order: number;
};

export default function BusinessPhotosSettingsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { selectedBusiness, bumpNavRefresh } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;
  const planKey: PlanKey = normalizePlanCodeToKey(selectedBusiness?.plan ?? null);

  const growUnlock = useGrowUnlockCta({
    businessId,
    currentPlan: planKey,
    trialEligible: selectedBusiness?.trialEligible === true,
    subscriptionStatus: selectedBusiness?.subscriptionStatus,
    onTrialStarted: bumpNavRefresh,
    paidDestination: {
      type: "action",
      run: () => openUpgradeFlow("upload_limit"),
    },
  });

  const [loading, setLoading] = useState(!!businessId);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSectionBusy, setAddingSectionBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  /** Floating toast after publish, link to public profile (all plans). */
  const [publishProfileToast, setPublishProfileToast] = useState<{
    count: number;
  } | null>(null);
  const [photoBusyId, setPhotoBusyId] = useState<string | null>(null);
  const [uploadingSlug, setUploadingSlug] = useState<string | null>(null);
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  /** Latest upload run (multi- or single-file); "Save batch" assigns `upload_batch_label` in that section. */
  const [pendingBatchMeta, setPendingBatchMeta] = useState<{
    batchId: string;
    sectionSlug: string;
  } | null>(null);
  const [batchLabelBusy, setBatchLabelBusy] = useState(false);
  /** Draft IDs in the current section chosen for bulk delete (checkboxes). */
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [bulkDeleteBusy, setBulkDeleteBusy] = useState(false);
  /** Brief "Copied" feedback after copying product photo UUID for reviews. */
  const [copiedProductPhotoId, setCopiedProductPhotoId] = useState<string | null>(null);

  const copyProductPhotoReviewId = useCallback(async (photoId: string) => {
    try {
      await navigator.clipboard.writeText(photoId);
      setCopiedProductPhotoId(photoId);
      window.setTimeout(() => {
        setCopiedProductPhotoId((cur) => (cur === photoId ? null : cur));
      }, 2200);
    } catch {
      setMessage({ type: "error", text: "Could not copy to clipboard." });
    }
  }, []);

  // Pending visibility changes per section, set when the user flips a
  // section's Public/Hidden toggle but has not yet pressed Save. Keyed by
  // section.id. The on-disk `is_enabled` stays untouched until the user
  // confirms. Mirrors the draft/publish pattern we use elsewhere so people
  // can explore without accidentally hiding a section from their public
  // profile mid-thought.
  const [pendingSectionEnabled, setPendingSectionEnabled] = useState<
    Record<string, boolean>
  >({});
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  /** Editable display name for built-in `services` section (slug fixed; title in DB). */
  const [servicesTitleDraftById, setServicesTitleDraftById] = useState<
    Record<string, string>
  >({});
  const [savingServicesTitleId, setSavingServicesTitleId] = useState<string | null>(
    null
  );
  const [galleryExampleOpen, setGalleryExampleOpen] = useState(false);
  const [galleryExampleIndex, setGalleryExampleIndex] = useState(0);
  const [productsExampleOpen, setProductsExampleOpen] = useState(false);
  const [productsExampleIndex, setProductsExampleIndex] = useState(0);
  /** Draft product tile: modal showing approximate published appearance. */
  const [draftLivePreviewPhotoId, setDraftLivePreviewPhotoId] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const normalizePhotoSectionSlug = (raw: string | null | undefined): string => {
    const normalized = String(raw ?? "gallery").trim().toLowerCase() || "gallery";
    if (LEGACY_BUILTIN_SECTION_SLUGS.has(normalized)) return "gallery";
    return normalized;
  };

  const loadAll = useCallback(async () => {
    if (!businessId) return;
    const sb = supabaseBrowser();

    const getPhotos = async () => {
      const primary = await applyBusinessPhotosOrdering(
        sb
          .from("business_photos")
          .select(
            "id, url, section, is_cover, sort_order, status, published_at, created_at, moderation_status, moderation_reason, is_suspected_collage, upload_batch_id, upload_batch_label, preview_zoom, preview_x, preview_y, preview_frame, product_name, product_description, product_price, product_currency, product_redirect_url"
          )
          .eq("business_id", businessId)
      );
      if (!primary.error) return primary;
      // Backward-compat fallback if preview_* columns are not yet migrated.
      const fallback = await applyBusinessPhotosOrdering(
        sb
          .from("business_photos")
          .select(
            "id, url, section, is_cover, sort_order, status, published_at, created_at, moderation_status, moderation_reason, is_suspected_collage, upload_batch_id, upload_batch_label"
          )
          .eq("business_id", businessId)
      );
      return fallback;
    };

    const [photosRes, sectionsRes] = await Promise.all([
      getPhotos(),
      sb
        .from("business_photo_sections")
        .select("id, slug, title, is_enabled, is_builtin, sort_order")
        .eq("business_id", businessId)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true }),
    ]);

    const photoRows = (photosRes.data ?? []) as Array<{
      id: string;
      url: string;
      section?: string | null;
      sort_order?: number | null;
      is_cover?: boolean | null;
      status?: string | null;
      published_at?: string | null;
      created_at?: string | null;
      moderation_status?: string | null;
      moderation_reason?: string | null;
      is_suspected_collage?: boolean | null;
      upload_batch_id?: string | null;
      upload_batch_label?: string | null;
      preview_zoom?: number | null;
      preview_x?: number | null;
      preview_y?: number | null;
      preview_frame?: string | null;
      product_name?: string | null;
      product_description?: string | null;
      product_price?: number | null;
      product_currency?: string | null;
      product_redirect_url?: string | null;
    }>;
    setPhotos(
      photoRows
        .filter((r) => r.id && r.url)
        .map((r) => {
          const rawMod = String(r.moderation_status ?? "pending").toLowerCase();
          const modStatus: ModerationStatus =
            rawMod === "approved" || rawMod === "rejected" || rawMod === "flagged"
              ? (rawMod as ModerationStatus)
              : "pending";
          return {
            id: r.id,
            url: r.url,
            section: normalizePhotoSectionSlug(r.section),
            sort_order:
              typeof r.sort_order === "number" ? r.sort_order : Number(r.sort_order) || 0,
            is_cover: r.is_cover === true,
            status: r.status === "published" ? "published" : "draft",
            published_at: r.published_at ?? null,
            created_at: r.created_at ?? null,
            moderation_status: modStatus,
            moderation_reason: r.moderation_reason ? String(r.moderation_reason) : null,
            is_suspected_collage: r.is_suspected_collage === true,
            upload_batch_id: r.upload_batch_id ? String(r.upload_batch_id) : null,
            upload_batch_label: r.upload_batch_label ? String(r.upload_batch_label) : null,
            preview_zoom: Math.max(1, Math.min(2.5, Number(r.preview_zoom) || 1)),
            preview_x: Math.max(0, Math.min(100, Number(r.preview_x) || 50)),
            preview_y: Math.max(0, Math.min(100, Number(r.preview_y) || 50)),
            preview_frame:
              String(r.preview_frame ?? "landscape").toLowerCase() === "portrait"
                ? "portrait"
                : "landscape",
            product_name: r.product_name ? String(r.product_name) : null,
            product_description: r.product_description ? String(r.product_description) : null,
            product_price:
              typeof r.product_price === "number"
                ? r.product_price
                : Number(r.product_price) || null,
            product_currency:
              typeof r.product_currency === "string" && r.product_currency.trim()
                ? r.product_currency.trim().toUpperCase().slice(0, 3)
                : "USD",
            product_redirect_url:
              typeof r.product_redirect_url === "string" && r.product_redirect_url.trim()
                ? r.product_redirect_url.trim().slice(0, 2000)
                : null,
          };
        })
    );

    const sectionRows = (sectionsRes.data ?? []) as Array<{
      id: string;
      slug: string;
      title: string;
      is_enabled?: boolean;
      is_builtin?: boolean;
      sort_order?: number;
    }>;
    let mappedSections = sectionRows.map((r) => {
      const slug = String(r.slug).trim().toLowerCase();
      return {
        id: String(r.id),
        slug,
        title: normalizePhotoSectionTitle(slug, String(r.title)),
        is_enabled: r.is_enabled !== false,
        is_builtin: r.is_builtin === true,
        sort_order: typeof r.sort_order === "number" ? r.sort_order : 0,
      };
    });

    // Hide retired built-ins from the dashboard UI. Only Gallery/Products/Other
    // (slug `services`) remain built-in; custom paid sections continue to show.
    mappedSections = mappedSections.filter((section) => {
      if (section.is_builtin) {
        return ACTIVE_BUILTIN_SECTION_SLUGS.has(section.slug);
      }
      return !LEGACY_BUILTIN_SECTION_SLUGS.has(section.slug);
    });

    // If no sections exist yet, ask the API which seeds built-ins server-side.
    if (mappedSections.length === 0) {
      try {
        const res = await fetch(
          `/api/business/${encodeURIComponent(businessId)}/photos/sections`,
          { credentials: "same-origin" }
        );
        if (res.ok) {
          const data = (await res.json().catch(() => null)) as {
            sections?: SectionRow[];
          } | null;
          if (data?.sections) {
            mappedSections = data.sections.map((row) => {
              const slug = String(row.slug).trim().toLowerCase();
              return {
                ...row,
                slug,
                title: normalizePhotoSectionTitle(slug, String(row.title)),
              };
            });
          }
        }
      } catch {
        /* ignore */
      }
    }
    setSections(mappedSections);
  }, [businessId]);

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      await loadAll();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, loadAll]);

  useEffect(() => {
    if (!galleryExampleOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGalleryExampleOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryExampleOpen]);

  useEffect(() => {
    if (!productsExampleOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProductsExampleOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [productsExampleOpen]);

  useEffect(() => {
    if (!draftLivePreviewPhotoId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setDraftLivePreviewPhotoId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [draftLivePreviewPhotoId]);

  useEffect(() => {
    if (!publishProfileToast) return;
    const t = window.setTimeout(() => setPublishProfileToast(null), 12_000);
    return () => window.clearTimeout(t);
  }, [publishProfileToast]);

  useEffect(() => {
    const v = (searchParams.get("upgrade_success") ?? "").trim().toLowerCase();
    if (v !== "1" && v !== "true" && v !== "yes") return;
    setShowUpgradeSuccess(true);
    setMessage(null);
    bumpNavRefresh();
    const next = new URLSearchParams(searchParams.toString());
    next.delete("upgrade_success");
    next.delete("plan");
    const qs = next.toString();
    router.replace(
      qs.length > 0 ? `/business/dashboard/settings/photos?${qs}` : "/business/dashboard/settings/photos",
      { scroll: false }
    );
  }, [searchParams, router, bumpNavRefresh]);

  useEffect(() => {
    if (!showUpgradeSuccess || !businessId || planKey !== "free") return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 22;
    const tick = async () => {
      if (cancelled || attempts >= maxAttempts) return;
      attempts += 1;
      try {
        const res = await fetch(
          `/api/billing/plan?businessId=${encodeURIComponent(businessId)}`,
          { credentials: "same-origin" }
        );
        const data = (await res.json().catch(() => ({}))) as { plan?: string };
        const nextKey = normalizePlanCodeToKey(
          typeof data.plan === "string" ? data.plan : null
        );
        if (!cancelled && res.ok && nextKey !== "free") {
          bumpNavRefresh();
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled && attempts < maxAttempts) {
        window.setTimeout(tick, 420);
      }
    };
    void tick();
    return () => {
      cancelled = true;
    };
  }, [showUpgradeSuccess, businessId, planKey, bumpNavRefresh]);

  useEffect(() => {
    if (!showUpgradeSuccess) return;
    const t = window.setTimeout(() => {
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 280);
    return () => window.clearTimeout(t);
  }, [showUpgradeSuccess]);

  const photoTotalCount = photos.length;
  const publishedPhotos = useMemo(() => photos.filter((p) => p.status === "published"), [photos]);
  const draftPhotos = useMemo(() => photos.filter((p) => p.status === "draft"), [photos]);

  /** Distinct saved upload batches per section (Save batch → labeled `upload_batch_id`s). */
  const savedBatchCountBySectionSlug = useMemo(() => {
    const bySlug = new Map<string, Set<string>>();
    for (const p of photos) {
      if (!p.upload_batch_id || !p.upload_batch_label) continue;
      if (!bySlug.has(p.section)) bySlug.set(p.section, new Set());
      bySlug.get(p.section)!.add(p.upload_batch_id);
    }
    const counts = new Map<string, number>();
    for (const [slug, ids] of bySlug) counts.set(slug, ids.size);
    return counts;
  }, [photos]);

  const planPhotoLimit = getPhotoLimitForPlan(planKey);
  const hiddenOnPublicProfileCount = countPhotosHiddenOnPublicProfile(
    publishedPhotos.length,
    planKey,
  );
  const sectionTitleBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sections) map.set(s.slug, s.title);
    return map;
  }, [sections]);
  const labelForSection = (slug: string): string =>
    sectionTitleBySlug.get(slug) ??
    slug.charAt(0).toUpperCase() + slug.slice(1);

  const usageLine = `You've used ${photoTotalCount} of ${planPhotoLimit} photos`;
  const nearPhotoLimit =
    photoTotalCount > 0 &&
    photoTotalCount >= planPhotoLimit - 1 &&
    photoTotalCount < planPhotoLimit;
  const atPhotoLimit = photoTotalCount >= planPhotoLimit;
  const canUpgrade = planKey !== "elite";
  const sectionTogglesLocked = planKey === "free";

  const isLocked = (_p: PhotoRow): boolean => false;

  /** ----------------------------------------------------------------
   *  Published-photos preview (hero + thumbnail strip)
   *  ----------------------------------------------------------------
   *  Mirrors the public profile gallery: one "big" photo on top with up
   *  to 4 thumbnails beneath, paginated with left/right arrows. Clicking
   *  a section chip above (or a thumbnail) swaps what's shown. Owner
   *  controls (set-as-cover / delete) remain on the thumbnails so the
   *  dashboard still works as a management surface, not just a preview.
   *  ---------------------------------------------------------------- */
  const HERO_VISIBLE_THUMBS = 4;
  const [previewSectionSlug, setPreviewSectionSlug] = useState<string | null>(null);
  const [previewPhotoId, setPreviewPhotoId] = useState<string | null>(null);
  const [previewThumbStart, setPreviewThumbStart] = useState(0);
  const [fitModeByPhotoId, setFitModeByPhotoId] = useState<Record<string, boolean>>({});
  const [fitSavingByPhotoId, setFitSavingByPhotoId] = useState<Record<string, boolean>>({});
  const [productDraftByPhotoId, setProductDraftByPhotoId] = useState<Record<string, ProductDraft>>(
    {}
  );
  const [productSavingByPhotoId, setProductSavingByPhotoId] = useState<Record<string, boolean>>(
    {}
  );
  const [productEditorPhotoId, setProductEditorPhotoId] = useState<string | null>(null);
  /** Full-screen preview while editing draft tiles (click photo area). */
  const [draftLightboxPhotoId, setDraftLightboxPhotoId] = useState<string | null>(null);
  /** In-page “Review this item” flow (same UI as /write-review/item, no new tab). */
  const [itemReviewPhotoId, setItemReviewPhotoId] = useState<string | null>(null);
  /** Draft tile drag-reorder (HTML5 DnD): grip sets this while dragging. */
  const [reorderDraggingId, setReorderDraggingId] = useState<string | null>(null);
  /** Tile receiving a dragged photo, subtle highlight while hovering with a drag. */
  const [reorderDropTargetId, setReorderDropTargetId] = useState<string | null>(null);
  const [reorderBusy, setReorderBusy] = useState(false);

  const clearReorderDragUi = useCallback(() => {
    setReorderDraggingId(null);
    setReorderDropTargetId(null);
  }, []);

  const draftLightboxPhoto = useMemo(
    () =>
      draftLightboxPhotoId ? photos.find((x) => x.id === draftLightboxPhotoId) ?? null : null,
    [photos, draftLightboxPhotoId]
  );

  useEffect(() => {
    if (draftLightboxPhotoId && !photos.some((x) => x.id === draftLightboxPhotoId)) {
      setDraftLightboxPhotoId(null);
    }
  }, [photos, draftLightboxPhotoId]);

  useEffect(() => {
    if (itemReviewPhotoId && !photos.some((x) => x.id === itemReviewPhotoId)) {
      setItemReviewPhotoId(null);
    }
  }, [photos, itemReviewPhotoId]);

  const productSavingRef = useRef(productSavingByPhotoId);
  productSavingRef.current = productSavingByPhotoId;

  const closeProductDetailsModal = useCallback(() => {
    const id = productEditorPhotoId;
    if (!id) return;
    if (productSavingRef.current[id]) return;
    setProductEditorPhotoId(null);
    setProductDraftByPhotoId((cur) => {
      if (!(id in cur)) return cur;
      const { [id]: _, ...rest } = cur;
      return rest;
    });
  }, [productEditorPhotoId]);

  useEffect(() => {
    if (!productEditorPhotoId && !draftLightboxPhotoId && !itemReviewPhotoId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (itemReviewPhotoId) {
        setItemReviewPhotoId(null);
        return;
      }
      if (productEditorPhotoId) {
        closeProductDetailsModal();
        return;
      }
      if (draftLightboxPhotoId) setDraftLightboxPhotoId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    productEditorPhotoId,
    draftLightboxPhotoId,
    itemReviewPhotoId,
    closeProductDetailsModal,
  ]);

  // Pick a sensible default section for the preview. Priority:
  //   1. Keep the user's current choice if it still exists and is enabled.
  //   2. First enabled section that actually has published photos.
  //   3. First enabled section (shows an empty-state hero, prompts upload).
  //   4. Literal first section (edge case: every section disabled).
  useEffect(() => {
    if (sections.length === 0) return;
    setPreviewSectionSlug((prev) => {
      if (prev && sections.some((s) => s.slug === prev && s.is_enabled)) {
        return prev;
      }
      const firstWithPhotos = sections.find(
        (s) => s.is_enabled && publishedPhotos.some((p) => p.section === s.slug)
      );
      if (firstWithPhotos) return firstWithPhotos.slug;
      const firstEnabled = sections.find((s) => s.is_enabled);
      if (firstEnabled) return firstEnabled.slug;
      return sections[0]?.slug ?? null;
    });
  }, [sections]);

  // Reset the "which photo is in the hero" + thumb window whenever the
  // active section changes, so switching sections doesn't leave a Gallery
  // photo showing big (or the thumb strip scrolled mid-way).
  useEffect(() => {
    setPreviewPhotoId(null);
    setPreviewThumbStart(0);
    setProductEditorPhotoId(null);
  }, [previewSectionSlug]);

  useEffect(() => {
    if (productEditorPhotoId && !photos.some((p) => p.id === productEditorPhotoId)) {
      setProductEditorPhotoId(null);
    }
  }, [photos, productEditorPhotoId]);

  const previewSection = useMemo(
    () => sections.find((s) => s.slug === previewSectionSlug) ?? null,
    [sections, previewSectionSlug]
  );

  const previewPhotos = useMemo<PhotoRow[]>(() => {
    if (!previewSectionSlug) return [];
    return publishedPhotos.filter((p) => p.section === previewSectionSlug);
  }, [publishedPhotos, previewSectionSlug]);

  // Which photo is shown big? User selection wins; otherwise prefer the
  // cover; otherwise the first photo in this section.
  const previewPhoto = useMemo<PhotoRow | null>(() => {
    if (previewPhotos.length === 0) return null;
    if (previewPhotoId) {
      const explicit = previewPhotos.find((p) => p.id === previewPhotoId);
      if (explicit) return explicit;
    }
    const cover = previewPhotos.find((p) => p.is_cover);
    return cover ?? previewPhotos[0];
  }, [previewPhotos, previewPhotoId]);

  const previewSectionsForChips = useMemo(
    () => sections.filter((s) => s.is_enabled),
    [sections]
  );

  const activeSectionSlug = useMemo(() => {
    if (previewSectionSlug && sections.some((s) => s.slug === previewSectionSlug)) {
      return previewSectionSlug;
    }
    return sections.find((s) => s.is_enabled)?.slug ?? sections[0]?.slug ?? "gallery";
  }, [previewSectionSlug, sections]);

  const draftPhotosForActiveSection = useMemo(
    () => draftPhotos.filter((p) => p.section === activeSectionSlug),
    [draftPhotos, activeSectionSlug]
  );

  /** Single list per section: drafts and published on the same cards after publish. */
  const photosForActiveUnifiedSection = useMemo(() => {
    return photos
      .filter((p) => p.section === activeSectionSlug)
      .slice()
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        const ta = a.created_at ? Date.parse(a.created_at) : 0;
        const tb = b.created_at ? Date.parse(b.created_at) : 0;
        return tb - ta;
      });
  }, [photos, activeSectionSlug]);

  /** Strip length for arrow pagination: Gallery tab edits all photos in-section; Other uses published-only preview list. */
  const thumbStripPhotoCount = useMemo(() => {
    if (activeSectionSlug === "gallery") return photosForActiveUnifiedSection.length;
    return previewPhotos.length;
  }, [activeSectionSlug, photosForActiveUnifiedSection.length, previewPhotos.length]);

  /** Gallery tab: large hero + thumbnails include drafts and published (matches public profile layout while editing). */
  const galleryHeroPhoto = useMemo<PhotoRow | null>(() => {
    if (activeSectionSlug !== "gallery") return null;
    const list = photosForActiveUnifiedSection;
    if (list.length === 0) return null;
    if (previewPhotoId) {
      const explicit = list.find((p) => p.id === previewPhotoId);
      if (explicit) return explicit;
    }
    const cover = list.find((p) => p.is_cover);
    return cover ?? list[0];
  }, [activeSectionSlug, photosForActiveUnifiedSection, previewPhotoId]);

  // Clamp the thumb-strip scroll window whenever the active strip shrinks.
  useEffect(() => {
    const maxStart = Math.max(0, thumbStripPhotoCount - HERO_VISIBLE_THUMBS);
    if (previewThumbStart > maxStart) setPreviewThumbStart(maxStart);
  }, [thumbStripPhotoCount, previewThumbStart]);

  const maxThumbStart = Math.max(0, thumbStripPhotoCount - HERO_VISIBLE_THUMBS);
  const canPrevThumb = previewThumbStart > 0;
  const canNextThumb = previewThumbStart < maxThumbStart;

  useEffect(() => {
    setSelectedDraftIds((prev) => {
      const filtered = prev.filter((id) =>
        draftPhotosForActiveSection.some((p) => p.id === id)
      );
      return filtered.slice(0, MAX_BULK_DRAFT_SELECTION);
    });
  }, [draftPhotosForActiveSection]);

  useEffect(() => {
    setSelectedDraftIds([]);
  }, [activeSectionSlug]);

  const activeSectionTitle = useMemo(
    () => labelForSection(activeSectionSlug),
    [activeSectionSlug, sectionTitleBySlug]
  );

  /** ---- Section management ---- */
  // Stage a Public/Hidden toggle change without committing it. Clears the
  // pending entry if the user toggles back to the saved value so the Save
  // button disappears on its own.
  const stageSectionEnabled = (section: SectionRow, nextEnabled: boolean) => {
    if (sectionTogglesLocked) {
      setMessage({ type: "error", text: "Upgrade to customize your photo sections." });
      return;
    }
    setPendingSectionEnabled((cur) => {
      const next = { ...cur };
      if (nextEnabled === section.is_enabled) {
        delete next[section.id];
      } else {
        next[section.id] = nextEnabled;
      }
      return next;
    });
  };

  const discardSectionChange = (section: SectionRow) => {
    setPendingSectionEnabled((cur) => {
      if (!(section.id in cur)) return cur;
      const next = { ...cur };
      delete next[section.id];
      return next;
    });
  };

  const saveSectionEnabled = async (section: SectionRow) => {
    if (!businessId) return;
    if (sectionTogglesLocked) {
      setMessage({ type: "error", text: "Upgrade to customize your photo sections." });
      return;
    }
    const nextEnabled = pendingSectionEnabled[section.id];
    if (typeof nextEnabled !== "boolean" || nextEnabled === section.is_enabled) {
      return;
    }
    setSavingSectionId(section.id);
    // Optimistic update so the UI feels instant; rolled back via loadAll()
    // on failure.
    setSections((cur) =>
      cur.map((s) => (s.id === section.id ? { ...s, is_enabled: nextEnabled } : s))
    );
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/sections/${encodeURIComponent(section.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isEnabled: nextEnabled }),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: "error", text: body?.error ?? "Could not update section." });
        await loadAll();
      } else {
        setMessage({
          type: "success",
          text: `“${section.title}” is now ${nextEnabled ? "Public" : "Hidden"}.`,
        });
        setPendingSectionEnabled((cur) => {
          if (!(section.id in cur)) return cur;
          const next = { ...cur };
          delete next[section.id];
          return next;
        });
      }
    } catch {
      setMessage({ type: "error", text: "Network error while updating section." });
      await loadAll();
    } finally {
      setSavingSectionId((cur) => (cur === section.id ? null : cur));
    }
  };

  const deleteSection = async (section: SectionRow) => {
    if (!businessId) return;
    if (section.slug === "gallery") {
      setMessage({
        type: "error",
        text: "Gallery can't be deleted, it's the default album for your photos.",
      });
      return;
    }
    if (sectionTogglesLocked) {
      setMessage({ type: "error", text: "Upgrade to customize your photo sections." });
      return;
    }
    const confirmMsg = section.is_builtin
      ? `Delete the built-in "${section.title}" section? Photos move to Gallery. You can add your own categories any time.`
      : `Delete the "${section.title}" section? Photos in it move to Gallery.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/sections/${encodeURIComponent(section.id)}`,
        { method: "DELETE", credentials: "same-origin" }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: "error", text: body?.error ?? "Could not delete section." });
        return;
      }
      setMessage({ type: "success", text: `Removed "${section.title}".` });
      await loadAll();
    } catch {
      setMessage({ type: "error", text: "Network error while deleting section." });
    }
  };

  const addCustomSection = async () => {
    if (!businessId) return;
    const title = newSectionTitle.trim();
    if (!title) return;
    if (sectionTogglesLocked) {
      setMessage({ type: "error", text: "Upgrade to add custom photo sections." });
      return;
    }
    setAddingSectionBusy(true);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/sections`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title }),
        }
      );
      const body = (await res.json().catch(() => null)) as
        | { section?: SectionRow; error?: string }
        | null;
      if (!res.ok) {
        setMessage({ type: "error", text: body?.error ?? "Could not add section." });
        return;
      }
      setNewSectionTitle("");
      setMessage({ type: "success", text: `Added "${title}" section.` });
      await loadAll();
    } catch {
      setMessage({ type: "error", text: "Network error while adding section." });
    } finally {
      setAddingSectionBusy(false);
    }
  };

  const commitServicesSectionTitle = async (section: SectionRow) => {
    if (!businessId || section.slug !== "services") return;
    const raw =
      servicesTitleDraftById[section.id] !== undefined
        ? servicesTitleDraftById[section.id]
        : section.title;
    const next = raw.trim();
    if (!next) {
      setServicesTitleDraftById((prev) => {
        const n = { ...prev };
        delete n[section.id];
        return n;
      });
      setMessage({ type: "error", text: "Title can't be empty." });
      return;
    }
    if (next.length > 40) {
      setMessage({ type: "error", text: "Title must be 1–40 characters." });
      return;
    }
    if (next === section.title.trim()) {
      setServicesTitleDraftById((prev) => {
        const n = { ...prev };
        delete n[section.id];
        return n;
      });
      return;
    }
    setSavingServicesTitleId(section.id);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/sections/${encodeURIComponent(section.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: next }),
        }
      );
      const body = (await res.json().catch(() => null)) as
        | {
            section?: {
              id: string;
              slug: string;
              title: string;
              is_enabled: boolean;
              is_builtin: boolean;
              sort_order: number;
            };
            error?: string;
          }
        | null;
      if (!res.ok) {
        setMessage({
          type: "error",
          text: body?.error ?? "Could not update section name.",
        });
        return;
      }
      if (body?.section) {
        const row = body.section;
        setSections((cur) =>
          cur.map((s) =>
            s.id === row.id
              ? {
                  ...s,
                  title: row.title,
                  is_enabled: row.is_enabled,
                  is_builtin: row.is_builtin,
                  sort_order: row.sort_order,
                }
              : s
          )
        );
      } else {
        await loadAll();
      }
      setServicesTitleDraftById((prev) => {
        const n = { ...prev };
        delete n[section.id];
        return n;
      });
      setMessage({ type: "success", text: `Section renamed to “${next}”.` });
    } catch {
      setMessage({ type: "error", text: "Network error while saving section name." });
    } finally {
      setSavingServicesTitleId((id) => (id === section.id ? null : id));
    }
  };

  /** ---- Upload (inline per-section; multi-select supported) ---- */
  const handleFilesForSection = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: SectionRow
  ) => {
    const rawList = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (rawList.length === 0 || !businessId) return;

    const exclusive = evaluateFreePlanExclusiveUpload(planKey, section.slug, photos);
    if (exclusive.blocked) {
      setMessage({ type: "error", text: exclusive.message });
      return;
    }

    const files = rawList.filter((f) => f.type.startsWith("image/"));
    if (files.length === 0) {
      setMessage({ type: "error", text: "Please choose image files (JPEG, PNG, or WebP)." });
      return;
    }
    const skipped = rawList.length - files.length;
    if (skipped > 0) {
      setMessage({
        type: "error",
        text: `${skipped} file(s) were skipped, only images are allowed.`,
      });
    }

    for (const file of files) {
      if (file.size > MAX_ORIGINAL_BYTES) {
        setMessage({ type: "error", text: `"${file.name}" is over 20 MB.` });
        return;
      }
    }

    if (atPhotoLimit) {
      setLimitModalOpen(true);
      return;
    }

    const uploadBatchId =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    setUploadingSlug(section.slug);
    let uploadedCount = 0;
    let runningTotal = photos.length;
    try {
      const sb = supabaseBrowser();
      for (let i = 0; i < files.length; i++) {
        const file = files[i]!;
        if (runningTotal >= planPhotoLimit) {
          setLimitModalOpen(true);
          break;
        }

        const compressed = await compressImage(file, {
          maxDimension: 1600,
          quality: 0.82,
        });
        if (compressed.size > MAX_UPLOAD_BYTES) {
          setMessage({
            type: "error",
            text: `"${file.name}" is still too large after compression. Try a smaller file.`,
          });
          break;
        }

        const safe = compressed.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9._-]/g, "");
        const path = `${businessId}/${Date.now()}-${i}-${safe || "photo"}`;

        const { error: upErr } = await sb.storage.from(UPLOAD_BUCKET).upload(path, compressed, {
          upsert: false,
          contentType: compressed.type || "image/jpeg",
        });
        if (upErr) {
          setMessage({
            type: "error",
            text:
              upErr.message ||
              "Upload to storage failed. Check the business_media bucket and your connection.",
          });
          break;
        }

        const { data: pub } = sb.storage.from(UPLOAD_BUCKET).getPublicUrl(path);
        const publicUrl = pub?.publicUrl?.trim();
        if (!publicUrl) {
          setMessage({ type: "error", text: "Could not get a public URL for this image." });
          break;
        }

        const res = await fetch(`/api/business/${encodeURIComponent(businessId)}/photos/upload`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            url: publicUrl,
            section: section.slug,
            uploadBatchId,
          }),
        });

        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        if (!res.ok) {
          if (isPhotoLimitResponse(res.status, body)) {
            setLimitModalOpen(true);
            break;
          }
          if (isFreePlanExclusiveUploadResponse(res.status, body)) {
            setMessage({
              type: "error",
              text: body?.error ?? "That upload isn't allowed on your current plan.",
            });
            break;
          }
          setMessage({
            type: "error",
            text: body?.error || `Could not save photo (${res.status}).`,
          });
          break;
        }
        uploadedCount += 1;
        runningTotal += 1;
      }

      if (uploadedCount > 0) {
        setPendingBatchMeta({ batchId: uploadBatchId, sectionSlug: section.slug });
        setMessage({
          type: "success",
          text:
            uploadedCount === 1
              ? `Photo added to ${section.title} as a draft. Save batch to name this upload, then publish when ready.`
              : `${uploadedCount} photos added to ${section.title} as drafts. Save batch to name this upload group, then publish when ready.`,
        });
        await loadAll();
      }
    } catch (err) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Something went wrong.",
      });
    } finally {
      setUploadingSlug(null);
    }
  };

  const savePendingBatchLabel = async () => {
    if (!businessId || !pendingBatchMeta) return;
    setBatchLabelBusy(true);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/batch-label`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            uploadBatchId: pendingBatchMeta.batchId,
            section: pendingBatchMeta.sectionSlug,
          }),
        }
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        labeledCount?: number;
        uploadBatchLabel?: string;
      } | null;
      if (!res.ok) {
        setMessage({ type: "error", text: body?.error ?? "Could not save batch label." });
        return;
      }
      const n = body?.labeledCount ?? 0;
      const label = body?.uploadBatchLabel ?? "Batch";
      setPendingBatchMeta(null);
      setMessage({
        type: "success",
        text:
          n === 0
            ? "No drafts needed a batch label (they may already be labeled)."
            : `Saved batch as "${label}" (${n} photo${n === 1 ? "" : "s"}).`,
      });
      await loadAll();
    } catch {
      setMessage({ type: "error", text: "Network error while saving batch." });
    } finally {
      setBatchLabelBusy(false);
    }
  };

  /** ---- Photo operations ---- */
  const setAsCover = async (photo: PhotoRow) => {
    if (!businessId) return;
    if (isLocked(photo)) {
      setMessage({
        type: "error",
        text: "This photo is locked for 30 days after publishing. Upgrade to change the cover now.",
      });
      return;
    }
    setPhotoBusyId(photo.id);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/${encodeURIComponent(photo.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isCover: true }),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: "error", text: body?.error ?? "Could not set cover." });
        return;
      }
      setMessage({ type: "success", text: "Cover photo updated." });
      await loadAll();
    } catch {
      setMessage({ type: "error", text: "Network error while setting cover." });
    } finally {
      setPhotoBusyId(null);
    }
  };

  const toggleDraftSelection = (photoId: string) => {
    setSelectedDraftIds((prev) => {
      if (prev.includes(photoId)) return prev.filter((id) => id !== photoId);
      if (prev.length >= MAX_BULK_DRAFT_SELECTION) {
        window.setTimeout(() => {
          setMessage({
            type: "error",
            text: `You can select up to ${MAX_BULK_DRAFT_SELECTION} drafts at once for bulk delete or publish.`,
          });
        }, 0);
        return prev;
      }
      return [...prev, photoId];
    });
  };

  const selectAllDeletableDraftsInSection = () => {
    const ids = draftPhotosForActiveSection
      .filter((p) => !isLocked(p))
      .slice(0, MAX_BULK_DRAFT_SELECTION)
      .map((p) => p.id);
    setSelectedDraftIds(ids);
    const total = draftPhotosForActiveSection.filter((p) => !isLocked(p)).length;
    if (total > MAX_BULK_DRAFT_SELECTION && ids.length === MAX_BULK_DRAFT_SELECTION) {
      setMessage({
        type: "success",
        text: `Selected ${MAX_BULK_DRAFT_SELECTION} drafts (maximum for bulk actions).`,
      });
    }
  };

  const clearDraftSelection = () => setSelectedDraftIds([]);

  const sortSectionPhotosList = (list: PhotoRow[]) =>
    list.slice().sort((a, b) => {
      if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
      const ta = a.created_at ? Date.parse(a.created_at) : 0;
      const tb = b.created_at ? Date.parse(b.created_at) : 0;
      return tb - ta;
    });

  const REORDER_MIME = "application/x-tellacity-photo-id" as const;

  const applyReorderDrop = async (
    sectionSlug: string,
    draggedId: string,
    targetId: string
  ) => {
    if (!businessId || reorderBusy || draggedId === targetId) return;
    const dragged = photos.find((x) => x.id === draggedId);
    if (
      !dragged ||
      dragged.section !== sectionSlug ||
      (dragged.status !== "draft" && dragged.status !== "published")
    ) {
      return;
    }
    const target = photos.find((x) => x.id === targetId);
    if (!target || target.section !== sectionSlug) return;

    const sectionPhotos = sortSectionPhotosList(
      photos.filter((p) => p.section === sectionSlug)
    );
    const without = sectionPhotos.filter((p) => p.id !== draggedId);
    const insertIdx = without.findIndex((p) => p.id === targetId);
    if (insertIdx === -1) return;
    const nextList = [...without.slice(0, insertIdx), dragged, ...without.slice(insertIdx)];
    const orderedIds = nextList.map((p) => p.id);

    const prevSnapshot = photos;
    const idxMap = new Map(orderedIds.map((id, i) => [id, (i + 1) * 10]));
    setPhotos((prev) =>
      prev.map((ph) => {
        if (ph.section !== sectionSlug) return ph;
        const so = idxMap.get(ph.id);
        return so !== undefined ? { ...ph, sort_order: so } : ph;
      })
    );

    setReorderBusy(true);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/reorder`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ section: sectionSlug, orderedIds }),
        }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setPhotos(prevSnapshot);
        setMessage({
          type: "error",
          text: body?.error ?? "Could not save photo order.",
        });
        return;
      }
    } catch {
      setPhotos(prevSnapshot);
      setMessage({ type: "error", text: "Network error while saving order." });
    } finally {
      setReorderBusy(false);
      clearReorderDragUi();
    }
  };

  const deleteSelectedDrafts = async () => {
    if (!businessId) return;
    const toRemove = selectedDraftIds
      .map((id) => draftPhotosForActiveSection.find((p) => p.id === id))
      .filter((p): p is PhotoRow => !!p && !isLocked(p));
    if (toRemove.length === 0) {
      setMessage({ type: "error", text: "No deletable drafts selected (locked photos cannot be removed)." });
      return;
    }
    if (
      !window.confirm(
        `Remove ${toRemove.length} draft photo${toRemove.length === 1 ? "" : "s"}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBulkDeleteBusy(true);
    let removed = 0;
    try {
      for (const photo of toRemove) {
        const res = await fetch(
          `/api/business/${encodeURIComponent(businessId)}/photos/${encodeURIComponent(photo.id)}`,
          { method: "DELETE", credentials: "same-origin" }
        );
        if (!res.ok) {
          const body = (await res.json().catch(() => null)) as { error?: string } | null;
          setMessage({
            type: "error",
            text: body?.error ?? `Could not remove one of the photos (${res.status}).`,
          });
          break;
        }
        removed += 1;
      }
      if (removed > 0) {
        setMessage({
          type: "success",
          text: `Removed ${removed} draft${removed === 1 ? "" : "s"}.`,
        });
        setSelectedDraftIds([]);
        await loadAll();
      }
    } catch {
      setMessage({ type: "error", text: "Network error while deleting drafts." });
    } finally {
      setBulkDeleteBusy(false);
    }
  };

  const deletePhoto = async (photo: PhotoRow) => {
    if (!businessId) return;
    if (isLocked(photo)) {
      setMessage({
        type: "error",
        text: "This photo is locked for 30 days after publishing. Upgrade to remove it now.",
      });
      return;
    }
    if (!window.confirm("Remove this photo?")) return;
    setPhotoBusyId(photo.id);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/${encodeURIComponent(photo.id)}`,
        { method: "DELETE", credentials: "same-origin" }
      );
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessage({ type: "error", text: body?.error ?? "Could not delete photo." });
        return;
      }
      setMessage({ type: "success", text: "Photo removed." });
      await loadAll();
    } catch {
      setMessage({ type: "error", text: "Network error while deleting photo." });
    } finally {
      setPhotoBusyId(null);
    }
  };

  const setDraftPhotoFitMode = (photoId: string, fit: boolean) => {
    setFitModeByPhotoId((cur) => ({ ...cur, [photoId]: fit }));
  };
  const anyFitSaving = Object.values(fitSavingByPhotoId).some(Boolean);

  const savePhotoFitMode = async (photo: PhotoRow, fit: boolean) => {
    if (!businessId) return;
    setFitSavingByPhotoId((cur) => ({ ...cur, [photo.id]: true }));
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/${encodeURIComponent(photo.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            preview: {
              zoom: 1,
              x: 50,
              y: 50,
              frame: fit ? "portrait" : "landscape",
            },
          }),
        }
      );
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setMessage({ type: "error", text: body?.error ?? "Could not save photo fit mode." });
        return;
      }
      setDraftPhotoFitMode(photo.id, fit);
      setPhotos((cur) =>
        cur.map((p) =>
          p.id === photo.id
            ? {
                ...p,
                preview_zoom: 1,
                preview_x: 50,
                preview_y: 50,
                preview_frame: fit ? "portrait" : "landscape",
              }
            : p
        )
      );
      setMessage({ type: "success", text: `Saved ${fit ? "Fit" : "Fill"} for this photo.` });
    } catch {
      setMessage({ type: "error", text: "Network error while saving fit mode." });
    } finally {
      setFitSavingByPhotoId((cur) => ({ ...cur, [photo.id]: false }));
    }
  };

  const savePhotoProductMeta = async (photo: PhotoRow) => {
    if (!businessId) return;
    const draft: ProductDraft =
      productDraftByPhotoId[photo.id] ?? {
        name: photo.product_name ?? "",
      };
    setProductSavingByPhotoId((cur) => ({ ...cur, [photo.id]: true }));
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/${encodeURIComponent(photo.id)}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            product: {
              name: draft.name,
              description: null,
              price: null,
              currency: "USD",
              redirect_url: null,
            },
          }),
        }
      );
      const body = (await res.json().catch(() => null)) as {
        error?: string;
        photo?: {
          product_name?: string | null;
          product_description?: string | null;
          product_price?: number | null;
          product_currency?: string | null;
          product_redirect_url?: string | null;
        };
      } | null;
      if (!res.ok) {
        setMessage({ type: "error", text: body?.error ?? "Could not save product details." });
        return;
      }
      if (body?.photo) {
        const ph = body.photo;
        setPhotos((cur) =>
          cur.map((p) =>
            p.id === photo.id
              ? {
                  ...p,
                  product_name:
                    typeof ph.product_name === "string" ? ph.product_name.trim() || null : null,
                  product_description:
                    typeof ph.product_description === "string"
                      ? ph.product_description.trim() || null
                      : null,
                  product_price:
                    typeof ph.product_price === "number" && Number.isFinite(ph.product_price)
                      ? ph.product_price
                      : null,
                  product_currency:
                    typeof ph.product_currency === "string" && ph.product_currency.trim()
                      ? ph.product_currency.trim().toUpperCase().slice(0, 3)
                      : "USD",
                  product_redirect_url:
                    typeof ph.product_redirect_url === "string" && ph.product_redirect_url.trim()
                      ? ph.product_redirect_url.trim().slice(0, 2000)
                      : null,
                }
              : p
          )
        );
      } else {
        setPhotos((cur) =>
          cur.map((p) =>
            p.id === photo.id
              ? {
                  ...p,
                  product_name: draft.name.trim() || null,
                  product_description: null,
                  product_price: null,
                  product_currency: "USD",
                  product_redirect_url: null,
                }
              : p
          )
        );
      }
      setMessage({ type: "success", text: "Product name saved." });
    } catch {
      setMessage({ type: "error", text: "Network error while saving product details." });
    } finally {
      setProductSavingByPhotoId((cur) => ({ ...cur, [photo.id]: false }));
    }
  };

  /** ---- Publish ---- */
  const publishDrafts = async (sectionSlug?: string | null) => {
    if (!businessId) return;
    const slug = sectionSlug?.trim() || null;
    const targets = slug ? draftPhotos.filter((p) => p.section === slug) : draftPhotos;
    if (targets.length === 0) return;
    setPublishBusy(true);
    try {
      const res = await fetch(
        `/api/business/${encodeURIComponent(businessId)}/photos/publish`,
        {
          method: "POST",
          credentials: "same-origin",
          ...(slug
            ? {
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sectionSlug: slug }),
              }
            : {}),
        }
      );
      const body = (await res.json().catch(() => null)) as
        | { publishedCount?: number; error?: string }
        | null;
      if (!res.ok) {
        setMessage({ type: "error", text: body?.error ?? "Could not publish photos." });
        return;
      }
      const publishedCount = body?.publishedCount ?? targets.length;
      setPublishProfileToast({ count: publishedCount });
      setPendingBatchMeta(null);
      await loadAll();
    } catch {
      setMessage({ type: "error", text: "Network error while publishing." });
    } finally {
      setPublishBusy(false);
    }
  };

  if (!businessId) return null;
  if (loading) return <PageLoadingOverlay />;

  /** Product label editor, matches public profile (title + review stats only). */
  const renderProductDetailsEditor = (p: PhotoRow, wrapperClassName: string) => {
    const pd: ProductDraft =
      productDraftByPhotoId[p.id] ?? {
        name: p.product_name ?? "",
      };
    const merge = (patch: Partial<ProductDraft>) =>
      setProductDraftByPhotoId((cur) => {
        const base: ProductDraft =
          cur[p.id] ?? {
            name: p.product_name ?? "",
          };
        return { ...cur, [p.id]: { ...base, ...patch } };
      });
    return (
      <div className={`relative ${wrapperClassName}`}>
        <p className="text-xs leading-relaxed text-gray-600">
          This name appears under the photo on your public page, with star ratings and{" "}
          <span className="font-medium text-gray-800">Review this product</span>. We no longer use SKU,
          price, or buy links there.
        </p>
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-2.5">
          <p className="text-[10px] font-medium uppercase tracking-wide text-gray-500">
            Product review ID
          </p>
          <p className="mt-1 break-all font-mono text-[11px] leading-snug text-gray-800">{p.id}</p>
          <p className="mt-1.5 text-[11px] leading-relaxed text-gray-500">
            Assigned when this photo is first saved. Public{" "}
            <span className="font-medium text-gray-700">Review this product</span> links use this ID so
            each product can be reviewed separately.
          </p>
          <button
            type="button"
            onClick={() => void copyProductPhotoReviewId(p.id)}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#124541] shadow-sm hover:bg-gray-50"
          >
            <Copy className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {copiedProductPhotoId === p.id ? "Copied" : "Copy ID"}
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label
              htmlFor={`product-name-${p.id}`}
              className="mb-1 block text-xs font-medium text-gray-700"
            >
              Product name
            </label>
            <input
              id={`product-name-${p.id}`}
              type="text"
              value={pd.name}
              onChange={(e) => merge({ name: e.target.value })}
              placeholder="e.g. Kids puffer jacket"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400"
            />
          </div>
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={async () => {
                await savePhotoProductMeta(p);
                setProductEditorPhotoId(null);
              }}
              disabled={productSavingByPhotoId[p.id] === true}
              className="rounded-lg bg-[#124541] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f3a35] disabled:opacity-60"
            >
              {productSavingByPhotoId[p.id] ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const openPublishedProductDetailModal = (p: PhotoRow) => {
    if (p.section !== "products") return;
    setProductEditorPhotoId(p.id);
    setProductDraftByPhotoId((cur) => ({
      ...cur,
      [p.id]: {
        name: cur[p.id]?.name ?? p.product_name ?? "",
      },
    }));
  };

  /** ---- Reusable photo tile ---- */
  const renderPhotoTile = (
    p: PhotoRow,
    tileOpts?: { bulkSelectDrafts?: boolean }
  ) => {
    const bulkSelectDrafts = tileOpts?.bulkSelectDrafts === true;
    const busy = photoBusyId === p.id;
    const locked = isLocked(p);
    const isDraft = p.status === "draft";
    const isDraftBulkSelected = bulkSelectDrafts && isDraft && selectedDraftIds.includes(p.id);
    const bulkSelectionAtCap =
      bulkSelectDrafts &&
      isDraft &&
      !selectedDraftIds.includes(p.id) &&
      selectedDraftIds.length >= MAX_BULK_DRAFT_SELECTION;
    const borderClass = isDraft ? "border-amber-200" : "border-gray-200";
    const footerClass = isDraft
      ? "border-t border-amber-100 bg-white/90"
      : "border-t border-gray-200 bg-white";
    const actionsDisabled = busy || locked || bulkDeleteBusy;

    const reorderDropActive =
      Boolean(reorderDraggingId) && !reorderBusy && reorderDraggingId !== p.id;
    const reorderGripEligible =
      p.status === "draft" || p.status === "published";

    return (
      <li
        key={p.id}
        onDragOver={(e) => {
          if (!reorderDropActive) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setReorderDropTargetId(p.id);
        }}
        onDragLeave={(e) => {
          if (!reorderDropActive) return;
          const next = e.relatedTarget;
          if (next instanceof Node && e.currentTarget.contains(next)) return;
          setReorderDropTargetId((cur) => (cur === p.id ? null : cur));
        }}
        onDrop={(e) => {
          if (!reorderDropActive) return;
          e.preventDefault();
          const draggedId =
            e.dataTransfer.getData(REORDER_MIME) || e.dataTransfer.getData("text/plain");
          if (!draggedId || draggedId === p.id) return;
          void applyReorderDrop(p.section, draggedId, p.id);
        }}
        className={`relative overflow-hidden rounded-lg border bg-gray-50 transition-[transform,box-shadow,opacity] duration-200 ease-out ${borderClass} ${
          isDraftBulkSelected ? "ring-2 ring-[#1FAF9E] ring-offset-2 ring-offset-amber-50/40" : ""
        } ${
          reorderDraggingId === p.id
            ? "z-40 scale-[1.03] opacity-95 shadow-2xl ring-2 ring-[#1FAF9E]/60"
            : ""
        } ${
          reorderDropActive && reorderDropTargetId === p.id
            ? "z-[1] scale-[0.98] bg-teal-50/40 ring-2 ring-[#1FAF9E]"
            : ""
        } ${reorderDropActive && reorderDropTargetId !== p.id ? "duration-150" : ""}`}
      >
        <div className="relative aspect-[4/3] w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt=""
            className={`absolute inset-0 z-0 h-full w-full object-center ${
              (fitModeByPhotoId[p.id] ?? (p.preview_frame === "portrait")) === true
                ? "object-contain bg-gray-100"
                : "object-cover"
            }`}
            loading="lazy"
          />
          {isDraft ? (
            <button
              type="button"
              aria-label="Preview full photo"
              title="Preview full photo"
              className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent"
              onClick={() => setDraftLightboxPhotoId(p.id)}
            />
          ) : !isDraft && p.section === "products" ? (
            <button
              type="button"
              aria-label="Open full product details"
              title="View product details"
              className="absolute inset-0 z-[1] cursor-pointer bg-transparent"
              onClick={() => openPublishedProductDetailModal(p)}
            />
          ) : null}

          {bulkSelectDrafts && isDraft ? (
            <div className="absolute bottom-3 left-2 z-[12]">
              <label
                className={`inline-flex items-center justify-center rounded-md bg-white/95 p-1.5 shadow-md ring-1 ring-black/10 ${
                  bulkSelectionAtCap || locked || bulkDeleteBusy
                    ? "cursor-not-allowed opacity-70"
                    : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedDraftIds.includes(p.id)}
                  disabled={locked || bulkDeleteBusy || bulkSelectionAtCap}
                  onChange={() => toggleDraftSelection(p.id)}
                  aria-label={`Select draft for bulk delete, ${labelForSection(p.section)}`}
                  title={
                    bulkSelectionAtCap
                      ? `At most ${MAX_BULK_DRAFT_SELECTION} drafts can be selected`
                      : undefined
                  }
                  className="h-4 w-4 rounded border-gray-300 text-[#1FAF9E] focus:ring-[#1FAF9E] disabled:cursor-not-allowed"
                />
              </label>
            </div>
          ) : null}

          {isDraft && p.is_cover && p.section !== "products" ? (
            <span className="absolute left-2 top-2 z-[12] inline-flex items-center gap-1 rounded-md bg-[#1FAF9E] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              <Star className="h-3 w-3" aria-hidden />
              Cover
            </span>
          ) : null}

          {!isDraft && locked ? (
            <span className="absolute bottom-3 left-2 z-[12] inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
              <Lock className="h-3 w-3" aria-hidden />
              Locked
            </span>
          ) : null}

          {/* Draft + moderation: single bottom-right badge. Published: moderation only. */}
          {isDraft ? (
            <span
              className={`absolute bottom-3 right-2 z-[11] max-w-[calc(100%-3rem)] truncate rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur ${
                p.moderation_status === "rejected"
                  ? "bg-rose-600/95 text-white"
                  : p.moderation_status === "flagged"
                    ? "bg-orange-500/95 text-white"
                    : p.moderation_status === "approved"
                      ? "bg-amber-500/95 text-white ring-1 ring-amber-700/30"
                      : "bg-gradient-to-r from-amber-500 to-slate-800 text-white ring-1 ring-white/20"
              }`}
              title={
                p.moderation_status === "rejected"
                  ? p.moderation_reason
                    ? `Rejected: ${p.moderation_reason}`
                    : "Rejected by image review"
                  : p.moderation_status === "flagged"
                    ? p.moderation_reason
                      ? `Flagged: ${p.moderation_reason}`
                      : "Flagged for manual review"
                    : p.moderation_status === "approved"
                      ? "Draft, not yet published"
                      : "Pending image review, usually clears within a few minutes"
              }
            >
              {p.moderation_status === "rejected"
                ? "Rejected draft"
                : p.moderation_status === "flagged"
                  ? "Flagged draft preview"
                  : p.moderation_status === "approved"
                    ? "Draft preview"
                    : "Pending draft preview"}
            </span>
          ) : p.moderation_status !== "approved" ? (
            <span
              className={`absolute bottom-3 right-2 z-[11] inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur ${
                p.moderation_status === "rejected"
                  ? "bg-rose-600/90 text-white"
                  : p.moderation_status === "flagged"
                    ? "bg-orange-500/90 text-white"
                    : "bg-slate-700/80 text-white"
              }`}
              title={
                p.moderation_status === "rejected"
                  ? p.moderation_reason
                    ? `Rejected: ${p.moderation_reason}`
                    : "Rejected by image review"
                  : p.moderation_status === "flagged"
                    ? p.moderation_reason
                      ? `Flagged for review: ${p.moderation_reason}`
                      : "Flagged for manual review"
                    : "Pending image review, usually clears within a few minutes"
              }
            >
              {p.moderation_status === "rejected"
                ? "Rejected"
                : p.moderation_status === "flagged"
                  ? "Flagged"
                  : "Pending review"}
            </span>
          ) : null}

          <div
            className={`absolute left-2 right-2 top-2 z-[12] flex min-w-0 items-center ${
              isDraft || (!isDraft && p.section === "products")
                ? "justify-evenly gap-0.5"
                : "justify-end gap-1"
            }`}
          >
            {reorderGripEligible ? (
              <div
                draggable={!bulkDeleteBusy && !publishBusy && !reorderBusy}
                onDragStart={(e) => {
                  if (bulkDeleteBusy || publishBusy || reorderBusy) {
                    e.preventDefault();
                    return;
                  }
                  e.stopPropagation();
                  e.dataTransfer.setData(REORDER_MIME, p.id);
                  e.dataTransfer.setData("text/plain", p.id);
                  e.dataTransfer.effectAllowed = "move";
                  setReorderDraggingId(p.id);
                }}
                onDragEnd={clearReorderDragUi}
                className="inline-flex h-7 w-7 shrink-0 cursor-grab items-center justify-center rounded-md border border-gray-200 bg-white/95 text-gray-500 shadow-sm active:cursor-grabbing"
                aria-label="Drag to reorder"
                title="Drag to reorder"
              >
                <GripVertical className="h-4 w-4" aria-hidden />
              </div>
            ) : null}
            {isDraft || (!isDraft && p.section === "products") ? (
              <div className="inline-flex h-7 min-w-0 shrink items-stretch rounded-md border border-gray-200 bg-white/95 p-0.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => void savePhotoFitMode(p, false)}
                  disabled={fitSavingByPhotoId[p.id] === true}
                  className={`flex min-w-0 flex-1 items-center justify-center rounded px-1.5 text-[9px] font-medium ${
                    (fitModeByPhotoId[p.id] ?? (p.preview_frame === "portrait")) === true
                      ? "text-gray-600 hover:bg-gray-100"
                      : "bg-[#124541] text-white"
                  }`}
                >
                  Fill
                </button>
                <button
                  type="button"
                  onClick={() => void savePhotoFitMode(p, true)}
                  disabled={fitSavingByPhotoId[p.id] === true}
                  className={`flex min-w-0 flex-1 items-center justify-center rounded px-1.5 text-[9px] font-medium ${
                    (fitModeByPhotoId[p.id] ?? (p.preview_frame === "portrait")) === true
                      ? "bg-[#124541] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  Fit
                </button>
              </div>
            ) : null}
            {isDraft && p.section === "products" ? (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDraftLivePreviewPhotoId(p.id);
                  }}
                  title="Preview how this will look when published"
                  aria-label="Preview published look"
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-600 shadow-sm hover:bg-teal-50 hover:text-[#124541]"
                >
                  <Eye className="h-3.5 w-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    openPublishedProductDetailModal(p);
                  }}
                  className="inline-flex h-7 min-w-0 shrink items-center justify-center rounded-full border border-gray-300 bg-white/95 px-2 text-[10px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                >
                  Set name
                </button>
              </>
            ) : null}
            {!isDraft && p.section === "products" ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openPublishedProductDetailModal(p);
                }}
                className="inline-flex h-7 min-w-0 shrink items-center justify-center rounded-full border border-gray-300 bg-white/95 px-2 text-[10px] font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Set name
              </button>
            ) : null}
            {p.section !== "products" && !p.is_cover ? (
              <button
                type="button"
                onClick={() => void setAsCover(p)}
                disabled={actionsDisabled}
                aria-label={isDraft ? "Pick as cover (applies when published)" : "Set as cover"}
                title={
                  locked
                    ? "Locked for 30 days after publishing, upgrade to change the cover now"
                    : isDraft
                      ? "Pick as cover (applies when published)"
                      : "Set as cover"
                }
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Star className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => void deletePhoto(p)}
              disabled={actionsDisabled}
              aria-label={isDraft ? "Remove draft" : "Remove photo"}
              title={
                locked
                  ? "Locked for 30 days after publishing, upgrade to remove now"
                  : isDraft
                    ? "Remove draft"
                    : "Remove photo"
              }
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>

        </div>

        <div className={`${footerClass} px-2 py-1 text-xs text-gray-600`}>
          {labelForSection(p.section)}
          {isDraft && p.is_cover && p.section !== "products" ? (
            <span className="ml-1 font-medium text-[#1FAF9E]">· cover pick</span>
          ) : null}
          {isDraft && p.upload_batch_label ? (
            <span className="mt-0.5 block truncate text-[10px] font-medium text-teal-800">
              {p.upload_batch_label}
            </span>
          ) : null}
        </div>
      </li>
    );
  };

  /** ---- Unified section row: enable toggle + upload/upgrade button + (custom) delete ---- */
  const renderSectionRow = (s: SectionRow) => {
    const isUploading = uploadingSlug === s.slug;
    const anyUploading = uploadingSlug !== null && !isUploading;
    const disabledRow = !s.is_enabled;
    const exclusiveGate = evaluateFreePlanExclusiveUpload(planKey, s.slug, photos);
    const exclusiveUploadBlocked = exclusiveGate.blocked;
    const exclusiveHintText = exclusiveGate.blocked ? exclusiveGate.message : null;
    const isSelected = s.slug === activeSectionSlug;
    const isAvailable = !disabledRow;
    const showUpgradeForMore = atPhotoLimit && canUpgrade && isSelected && !disabledRow;
    const uploadDisabled =
      isUploading ||
      anyUploading ||
      disabledRow ||
      (!showUpgradeForMore && atPhotoLimit) ||
      (!showUpgradeForMore && exclusiveUploadBlocked && isSelected);
    const hint =
      BUILTIN_SECTION_HINTS[s.slug] ??
      (s.is_builtin ? "" : `Photos for "${s.title}".`);
    const savedBatches = savedBatchCountBySectionSlug.get(s.slug) ?? 0;
    const uploadButtonPrimary =
      isSelected && isAvailable && !exclusiveUploadBlocked && !uploadDisabled;

    return (
      <li
        key={s.id}
        role="presentation"
        onClick={(ev) => {
          const el = ev.target as HTMLElement | null;
          if (el?.closest("button, a, input, label, [role='switch']")) return;
          setPreviewSectionSlug(s.slug);
        }}
        className={`cursor-pointer rounded-lg p-4 transition-colors ${
          disabledRow
            ? "cursor-default border border-gray-200 bg-gray-50/80"
            : exclusiveUploadBlocked
              ? "border border-amber-200/90 bg-amber-50/25"
              : isSelected
                ? "border border-[#1FAF9E] bg-white shadow-sm ring-2 ring-[#1FAF9E]/25"
                : "border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
        }`}
      >
        <div className="flex h-full flex-col gap-3">
          <div className="min-w-0 flex-1">
            {(() => {
              const titleAndBadges = (
                <>
                  {s.slug === "services" ? (
                    <>
                      {(() => {
                        const servicesTitleValue =
                          servicesTitleDraftById[s.id] !== undefined
                            ? servicesTitleDraftById[s.id]
                            : s.title;
                        const titleInputSize = Math.min(
                          40,
                          Math.max(4, servicesTitleValue.length + 2)
                        );
                        return (
                          <div className="inline-flex max-w-full shrink-0 items-center gap-1">
                            <input
                              id={`photo-section-title-${s.id}`}
                              type="text"
                              aria-label="Section display name"
                              disabled={savingServicesTitleId === s.id}
                              size={titleInputSize}
                              value={servicesTitleValue}
                              onChange={(e) =>
                                setServicesTitleDraftById((prev) => ({
                                  ...prev,
                                  [s.id]: e.target.value,
                                }))
                              }
                              onBlur={() => void commitServicesSectionTitle(s)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  (e.target as HTMLInputElement).blur();
                                }
                              }}
                              maxLength={40}
                              className={`max-w-[18rem] rounded border border-transparent bg-transparent px-0.5 py-0 text-sm text-[#0E0E0E] outline-none transition placeholder:text-gray-400 hover:border-gray-200 focus:border-[#1FAF9E] focus:ring-1 focus:ring-[#1FAF9E]/30 disabled:opacity-60 ${
                                isSelected && isAvailable
                                  ? "font-bold"
                                  : "font-semibold"
                              }`}
                            />
                            <label
                              htmlFor={`photo-section-title-${s.id}`}
                              className={`shrink-0 cursor-text rounded p-0.5 text-gray-400 transition hover:text-[#1FAF9E] ${
                                savingServicesTitleId === s.id
                                  ? "pointer-events-none opacity-40"
                                  : ""
                              }`}
                              title="Edit section name"
                            >
                              <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                              <span className="sr-only">Edit section name</span>
                            </label>
                          </div>
                        );
                      })()}
                      {isSelected && !disabledRow ? (
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-[#1FAF9E]">
                          Selected
                        </span>
                      ) : null}
                    </>
                  ) : (
                    <h3
                      className={`text-sm text-[#0E0E0E] ${
                        isSelected && isAvailable ? "font-bold" : "font-semibold"
                      }`}
                    >
                      {s.title}
                      {isSelected && !disabledRow ? (
                        <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[#1FAF9E]">
                          Selected
                        </span>
                      ) : null}
                    </h3>
                  )}
                  {s.is_builtin ? (
                    <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                      Built-in
                    </span>
                  ) : (
                    <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-teal-100">
                      Custom
                    </span>
                  )}
                  {!exclusiveUploadBlocked ? <AvailableToUseLabel /> : null}
                </>
              );
              if (s.slug === "gallery") {
                return (
                  <div className="flex w-full flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      {titleAndBadges}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGalleryExampleIndex(0);
                        setGalleryExampleOpen(true);
                      }}
                      className="shrink-0 rounded-lg border border-[#124541]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#124541] shadow-sm transition hover:bg-[#124541]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/35"
                    >
                      Preview Example
                    </button>
                  </div>
                );
              }
              if (s.slug === "products") {
                return (
                  <div className="flex w-full flex-wrap items-start justify-between gap-x-3 gap-y-2">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      {titleAndBadges}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setProductsExampleIndex(0);
                        setProductsExampleOpen(true);
                      }}
                      className="shrink-0 rounded-lg border border-[#124541]/30 bg-white px-2.5 py-1 text-xs font-semibold text-[#124541] shadow-sm transition hover:bg-[#124541]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/35"
                    >
                      Preview Example
                    </button>
                  </div>
                );
              }
              return (
                <div className="flex flex-wrap items-center gap-2">{titleAndBadges}</div>
              );
            })()}
            {savedBatches > 0 ? (
              <p className="mt-1.5">
                <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-800 ring-1 ring-gray-200/90">
                  {savedBatches} batch{savedBatches === 1 ? "" : "es"} saved
                </span>
              </p>
            ) : null}
            {hint ? (
              <p className="mt-1 text-xs text-gray-600 sm:text-sm">{hint}</p>
            ) : null}
            <p className="mt-0.5 text-[11px] text-gray-400">/{s.slug}</p>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-2 border-t border-gray-100 pt-3">
            <div className="flex flex-col items-start gap-1">
              {(() => {
                const effectiveEnabled =
                  s.id in pendingSectionEnabled
                    ? pendingSectionEnabled[s.id]
                    : s.is_enabled;
                const hasPendingChange =
                  s.id in pendingSectionEnabled &&
                  pendingSectionEnabled[s.id] !== s.is_enabled;
                const isSaving = savingSectionId === s.id;

                return (
                  <>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        role="switch"
                        aria-checked={effectiveEnabled}
                        disabled={sectionTogglesLocked || isSaving}
                        onClick={() => stageSectionEnabled(s, !effectiveEnabled)}
                        title={
                          sectionTogglesLocked
                            ? "Upgrade to hide sections from your public profile"
                            : effectiveEnabled
                              ? "Visible on your public profile, click to hide"
                              : "Hidden from your public profile, click to show"
                        }
                        className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/30 disabled:cursor-not-allowed ${
                          sectionTogglesLocked
                            ? "bg-gray-50 text-gray-400"
                            : effectiveEnabled
                              ? "bg-teal-50 text-teal-800 hover:bg-teal-100"
                              : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        <span
                          aria-hidden
                          className={`relative inline-flex h-4 w-7 shrink-0 items-center rounded-full transition-colors ${
                            effectiveEnabled ? "bg-[#1FAF9E]" : "bg-gray-300"
                          } ${sectionTogglesLocked ? "opacity-60" : ""}`}
                        >
                          <span
                            className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform ${
                              effectiveEnabled ? "translate-x-3.5" : "translate-x-0.5"
                            }`}
                          />
                        </span>
                        <span>{effectiveEnabled ? "Public" : "Hidden"}</span>
                        {sectionTogglesLocked ? (
                          <Lock className="h-3 w-3 text-gray-400" aria-hidden />
                        ) : null}
                      </button>

                      {hasPendingChange ? (
                        <>
                          <button
                            type="button"
                            onClick={() => void saveSectionEnabled(s)}
                            disabled={isSaving}
                            title={`Save visibility as ${
                              effectiveEnabled ? "Public" : "Hidden"
                            }`}
                            className="inline-flex items-center gap-1 rounded-full bg-[#1FAF9E] px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#169786] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 disabled:cursor-not-allowed disabled:opacity-70"
                          >
                            {isSaving ? (
                              <>
                                <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                Saving
                              </>
                            ) : (
                              <>
                                <Check className="h-3 w-3" aria-hidden />
                                Save
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => discardSectionChange(s)}
                            disabled={isSaving}
                            className="inline-flex items-center rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-200 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Cancel
                          </button>
                        </>
                      ) : null}
                    </div>
                    <p className="text-[10px] leading-tight text-gray-500">
                      {hasPendingChange
                        ? `Unsaved, click Save to make this section ${
                            effectiveEnabled ? "Public" : "Hidden"
                          }.`
                        : "Hide or show this content to the public."}
                    </p>
                  </>
                );
              })()}
            </div>

            {isSelected && showUpgradeForMore ? (
              <button
                type="button"
                onClick={growUnlock.onClick}
                disabled={growUnlock.loading}
                title="Upgrade to add more photos beyond your current limit"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#4B5563] bg-[#4B5563] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B5563]/40 disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm"
              >
                <Lock className="h-3.5 w-3.5 text-white/90" aria-hidden />
                {growUnlock.loading ? "Starting…" : growUnlock.label}
              </button>
            ) : isSelected && exclusiveHintText ? (
              <p className="max-w-[14rem] rounded-lg border border-amber-200 bg-amber-50/90 px-3 py-2 text-left text-[11px] leading-snug text-amber-950">
                {exclusiveHintText}
              </p>
            ) : isSelected ? (
              <>
                <input
                  ref={(el) => {
                    fileInputRefs.current[s.slug] = el;
                  }}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  aria-label={`Upload photos to ${s.title}`}
                  onChange={(ev) => void handleFilesForSection(ev, s)}
                />
                <button
                  type="button"
                  onClick={() => fileInputRefs.current[s.slug]?.click()}
                  disabled={uploadDisabled}
                  title={
                    atPhotoLimit
                      ? "You've reached your plan's photo limit, delete a photo or upgrade to add more"
                      : !s.is_enabled
                        ? "This section is hidden from your public profile, set it to Public to upload"
                        : "Upload photos to this section"
                  }
                  className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold shadow-sm transition focus-visible:outline-none sm:text-sm ${
                    uploadDisabled
                      ? "cursor-not-allowed border border-gray-200 bg-gray-100 text-gray-500 shadow-none"
                      : uploadButtonPrimary
                        ? "border border-[#86EFAC] bg-[#DCFCE7] text-[#166534] hover:border-[#4ADE80] hover:bg-[#BBF7D0] focus-visible:ring-2 focus-visible:ring-[#86EFAC]/50"
                        : "border border-gray-200 bg-gray-100 text-gray-600 hover:border-gray-300 hover:bg-gray-200 focus-visible:ring-2 focus-visible:ring-gray-300/60"
                  }`}
                >
                  {isUploading ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#166534]/60 border-t-transparent" />
                      Uploading…
                    </>
                  ) : (
                    <>
                      <Upload className="h-3.5 w-3.5" aria-hidden />
                      Upload photos
                    </>
                  )}
                </button>
              </>
            ) : null}

            {!sectionTogglesLocked && s.slug !== "gallery" ? (
              <button
                type="button"
                onClick={() => void deleteSection(s)}
                className="rounded-md border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={`Delete ${s.title}`}
                title={
                  s.is_builtin
                    ? `Remove built-in “${s.title}” (Grow+). Photos move to Gallery.`
                    : `Delete ${s.title}`
                }
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </li>
    );
  };

  const galleryExampleCount = GALLERY_EXAMPLE_IMAGE_PATHS.length;
  const galleryExampleSrc =
    GALLERY_EXAMPLE_IMAGE_PATHS[
      Math.min(galleryExampleIndex, Math.max(0, galleryExampleCount - 1))
    ] ?? GALLERY_EXAMPLE_IMAGE_PATHS[0];

  const productsExampleCount = PRODUCTS_EXAMPLE_IMAGE_PATHS.length;
  const productsExampleSrc =
    PRODUCTS_EXAMPLE_IMAGE_PATHS[
      Math.min(productsExampleIndex, Math.max(0, productsExampleCount - 1))
    ] ?? PRODUCTS_EXAMPLE_IMAGE_PATHS[0];

  return (
    <div className="w-full space-y-6">
      <PhotoLimitModal
        open={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        businessId={businessId}
        currentPlan={planKey}
        trialEligible={selectedBusiness?.trialEligible === true}
        subscriptionStatus={selectedBusiness?.subscriptionStatus}
        onTrialStarted={bumpNavRefresh}
      />

      {galleryExampleOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="gallery-example-modal-title"
          className="fixed inset-0 z-[310] flex items-center justify-center bg-black/80 p-4 sm:p-6"
          onClick={() => setGalleryExampleOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <h2
                id="gallery-example-modal-title"
                className="text-base font-semibold text-[#0E0E0E]"
              >
                Gallery example
              </h2>
              <button
                type="button"
                onClick={() => setGalleryExampleOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <div className="relative flex min-h-[12rem] items-center justify-center px-3 pb-4 pt-2 sm:px-6 sm:pb-6">
              {galleryExampleCount > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryExampleIndex(
                        (i) => (i - 1 + galleryExampleCount) % galleryExampleCount
                      )
                    }
                    className="absolute left-1 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:left-3"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGalleryExampleIndex((i) => (i + 1) % galleryExampleCount)
                    }
                    className="absolute right-1 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:right-3"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element -- static public brand asset */}
              <img
                src={galleryExampleSrc}
                alt="Example of how your Gallery section can appear on your public profile"
                className="max-h-[min(72vh,560px)] w-full max-w-full object-contain"
              />
            </div>
            {galleryExampleCount > 1 ? (
              <p className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-500">
                {galleryExampleIndex + 1} / {galleryExampleCount}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {productsExampleOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="products-example-modal-title"
          className="fixed inset-0 z-[310] flex items-center justify-center bg-black/80 p-4 sm:p-6"
          onClick={() => setProductsExampleOpen(false)}
        >
          <div
            className="relative w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <h2
                id="products-example-modal-title"
                className="text-base font-semibold text-[#0E0E0E]"
              >
                Products example
              </h2>
              <button
                type="button"
                onClick={() => setProductsExampleOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <div className="relative flex min-h-[12rem] items-center justify-center px-3 pb-4 pt-2 sm:px-6 sm:pb-6">
              {productsExampleCount > 1 ? (
                <>
                  <button
                    type="button"
                    onClick={() =>
                      setProductsExampleIndex(
                        (i) => (i - 1 + productsExampleCount) % productsExampleCount
                      )
                    }
                    className="absolute left-1 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:left-3"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-5 w-5" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setProductsExampleIndex((i) => (i + 1) % productsExampleCount)
                    }
                    className="absolute right-1 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:right-3"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-5 w-5" aria-hidden />
                  </button>
                </>
              ) : null}
              {/* eslint-disable-next-line @next/next/no-img-element -- static public brand asset */}
              <img
                src={productsExampleSrc}
                alt="Example of how your Products section can appear on your public profile"
                className="max-h-[min(72vh,560px)] w-full max-w-full object-contain"
              />
            </div>
            {productsExampleCount > 1 ? (
              <p className="border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-500">
                {productsExampleIndex + 1} / {productsExampleCount}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {draftLivePreviewPhotoId
        ? (() => {
            const lp = photos.find((x) => x.id === draftLivePreviewPhotoId);
            if (!lp || lp.status !== "draft" || lp.section !== "products") return null;
            const pd = productDraftByPhotoId[lp.id];
            const name =
              (pd?.name ?? lp.product_name ?? "").trim() || "Untitled product";
            const fitLikePublished =
              (fitModeByPhotoId[lp.id] ?? (lp.preview_frame === "portrait")) === true;
            return (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="draft-live-preview-title"
                className="fixed inset-0 z-[315] flex items-center justify-center bg-black/75 p-4 sm:p-6"
                onClick={() => setDraftLivePreviewPhotoId(null)}
              >
                <div
                  className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl ring-1 ring-black/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
                    <h2
                      id="draft-live-preview-title"
                      className="text-base font-semibold text-[#0E0E0E]"
                    >
                      Published preview
                    </h2>
                    <button
                      type="button"
                      onClick={() => setDraftLivePreviewPhotoId(null)}
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                  <p className="border-b border-gray-50 bg-teal-50/40 px-4 py-2 text-[11px] text-gray-700">
                    Approximate look on your public profile, use{" "}
                    <span className="font-semibold">Set name</span> on the card for the label under the photo.
                  </p>
                  <div className="border-b border-gray-100 bg-neutral-100 px-4 py-4">
                    <div className="relative mx-auto aspect-[4/3] max-h-[280px] w-full overflow-hidden rounded-xl bg-white shadow-inner ring-1 ring-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={lp.url}
                        alt=""
                        className={`h-full w-full object-center ${
                          fitLikePublished ? "object-contain bg-gray-100" : "object-cover"
                        }`}
                      />
                      <span className="pointer-events-none absolute left-2 bottom-2 rounded bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                        Live
                      </span>
                    </div>
                  </div>
                  <div className="space-y-3 px-4 py-4 text-sm">
                    <div>
                      <p className="text-[10px] font-medium uppercase text-gray-400">Name</p>
                      <p className="font-semibold text-[#0E0E0E]">{name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium uppercase text-gray-400">Reviews</p>
                      <p className="text-xs text-gray-500">
                        No reviews yet, matches the public card until customers leave feedback.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()
        : null}

      {productEditorPhotoId
        ? (() => {
            const detailPhoto = photos.find((x) => x.id === productEditorPhotoId);
            if (!detailPhoto || detailPhoto.section !== "products") return null;
            return (
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="product-details-modal-title"
                className="fixed inset-0 z-[320] flex items-center justify-center bg-black/75 p-4 sm:p-6"
                onClick={() => closeProductDetailsModal()}
              >
                <div
                  className="flex max-h-[min(92vh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-amber-200 bg-white shadow-2xl ring-1 ring-black/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex shrink-0 items-center justify-between gap-3 border-b border-amber-100 bg-gradient-to-b from-amber-50/90 to-white px-4 py-3">
                    <h2
                      id="product-details-modal-title"
                      className="text-base font-semibold text-[#0E0E0E]"
                    >
                      Product name
                    </h2>
                    <button
                      type="button"
                      onClick={() => closeProductDetailsModal()}
                      disabled={productSavingByPhotoId[detailPhoto.id] === true}
                      aria-label="Close"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40"
                    >
                      <X className="h-5 w-5" strokeWidth={2} aria-hidden />
                    </button>
                  </div>
                  <div className="shrink-0 border-b border-amber-100/80 bg-neutral-100 px-4 py-4">
                    <div className="flex max-h-[min(42vh,380px)] items-center justify-center overflow-hidden rounded-xl bg-white p-3 shadow-inner ring-1 ring-black/5">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={detailPhoto.url}
                        alt=""
                        className="max-h-[min(42vh,380px)] max-w-full object-contain"
                      />
                    </div>
                  </div>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    {renderProductDetailsEditor(detailPhoto, "p-4")}
                  </div>
                </div>
              </div>
            );
          })()
        : null}

      {itemReviewPhotoId && selectedBusiness?.slug ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Review this item"
          className="fixed inset-0 z-[340] flex items-center justify-center bg-black/75 p-4 sm:p-6"
          onClick={() => setItemReviewPhotoId(null)}
        >
          <div
            className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <WriteReviewItemContent
              businessSlug={selectedBusiness.slug}
              photoId={itemReviewPhotoId}
              variant="modal"
              onRequestClose={() => setItemReviewPhotoId(null)}
            />
          </div>
        </div>
      ) : null}

      {draftLightboxPhoto ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Draft photo preview"
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setDraftLightboxPhotoId(null)}
        >
          <button
            type="button"
            onClick={() => setDraftLightboxPhotoId(null)}
            className="absolute right-4 top-4 z-[1] rounded-full bg-white/15 p-2 text-white ring-1 ring-white/30 hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
            aria-label="Close preview"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
          {(() => {
            const lp = draftLightboxPhoto;
            const productDraft = productDraftByPhotoId[lp.id];
            const productName = (productDraft?.name ?? lp.product_name ?? "").trim();
            const isProducts = lp.section === "products";
            return (
              <div
                className="flex max-h-[min(92vh,920px)] w-full max-w-lg flex-col overflow-y-auto overflow-x-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="shrink-0 bg-neutral-100 px-3 py-4 sm:px-5">
                  <div className="mx-auto flex max-h-[min(52vh,480px)] w-full items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-inner ring-1 ring-black/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={lp.url}
                      alt=""
                      className="max-h-[min(52vh,480px)] max-w-full rounded-lg object-contain shadow-md"
                    />
                  </div>
                </div>
                <div className="border-t border-gray-200 bg-white px-4 py-3 text-left">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    {isProducts ? "Product" : labelForSection(lp.section)}
                  </p>
                  {isProducts ? (
                    <div className="mt-2 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium uppercase text-gray-400">Name</p>
                          <p className="text-sm font-semibold text-gray-900">
                            {productName || "-"}
                          </p>
                        </div>
                        {selectedBusiness?.slug ? (
                          <button
                            type="button"
                            className="shrink-0 rounded-lg border border-[#124541] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#124541] shadow-sm hover:bg-[#124541]/5"
                            onClick={() => {
                              setDraftLightboxPhotoId(null);
                              setItemReviewPhotoId(lp.id);
                            }}
                          >
                            Review this product
                          </button>
                        ) : null}
                      </div>
                      <p className="text-xs text-gray-500">
                        Public visitors see this title, star ratings, and{" "}
                        <span className="font-medium text-gray-700">Review this product</span>. Use{" "}
                        <span className="font-semibold">Set name</span> on the card to edit.
                      </p>
                      <div className="rounded-lg border border-gray-100 bg-gray-50/90 px-2.5 py-2">
                        <p className="text-[10px] font-medium uppercase text-gray-500">Review ID</p>
                        <p className="mt-0.5 break-all font-mono text-[10px] text-gray-800">{lp.id}</p>
                        <button
                          type="button"
                          onClick={() => void copyProductPhotoReviewId(lp.id)}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#124541] hover:underline"
                        >
                          <Copy className="h-3 w-3 shrink-0" aria-hidden />
                          {copiedProductPhotoId === lp.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                      {!productName ? (
                        <p className="text-xs text-amber-800">
                          Add a product name so customers know what they&apos;re reviewing.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-600">
                      Move this photo to <span className="font-medium">Products</span> to add a public product
                      label and reviews.
                    </p>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
      ) : null}

      {showUpgradeSuccess ? (
        <div
          role="status"
          className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-4 text-sm text-emerald-950 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="font-medium">
            You can now upload more photos and customize your sections.
          </p>
          <button
            type="button"
            onClick={() => setShowUpgradeSuccess(false)}
            className="shrink-0 self-start rounded-lg border border-emerald-300/80 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30 sm:self-auto"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Profile photos</h1>
          <p className="mt-1 text-sm text-gray-500">
            Upload, organize, and publish the photos that appear on your public business page.
          </p>
        </div>
        {selectedBusiness?.slug ? (
          <Link
            href={`/b/${selectedBusiness.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 rounded-lg border border-[#124541] px-4 py-2 text-sm font-medium text-[#124541] hover:bg-[#124541]/5"
          >
            View public profile
          </Link>
        ) : null}
      </div>

      {hiddenOnPublicProfileCount > 0 ? (
        <div
          role="note"
          className="rounded-xl border border-sky-200 bg-sky-50/80 px-4 py-3 text-sm text-sky-950"
        >
          <p className="font-medium">
            {hiddenOnPublicProfileCount} published{" "}
            {hiddenOnPublicProfileCount === 1 ? "photo is" : "photos are"} hidden on your public
            profile on the {planKey === "free" ? "Free" : planKey.charAt(0).toUpperCase() + planKey.slice(1)}{" "}
            plan (showing up to {planPhotoLimit}). Upgrade to display all of them again.
          </p>
        </div>
      ) : null}

      {/* Free plan: nudge at the 4-photo cap, delete one or upgrade for more. */}
      {planKey === "free" && atPhotoLimit ? (
        <div
          role="note"
          className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-4 text-sm text-amber-950 sm:flex-row sm:items-start sm:gap-3"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <div className="flex-1">
            <p className="font-medium text-amber-900">
              You&apos;ve reached your Free plan&apos;s {planPhotoLimit}-photo limit
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/85">
              Delete a photo below to free a slot, or upgrade to upload more images, use multiple
              photo categories at once, hide categories you don&apos;t use, and create custom ones.
              Your photos stay on your profile until you remove them, they are not auto-deleted.
            </p>
            {canUpgrade ? (
              <div className="mt-3">
                <GrowUnlockButton
                  {...growUnlock}
                  className="inline-flex items-center justify-center rounded-full bg-[#124541] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f3a35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/30"
                />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* ---- Unified sections + upload card ---- */}
      <div
        ref={cardRef}
        id="photo-sections-card"
        className="scroll-mt-6 rounded-xl border border-gray-200 bg-white p-6 sm:scroll-mt-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="flex flex-wrap items-center gap-x-2 gap-y-1 text-base font-semibold text-[#0E0E0E]">
              <span>Photo sections</span>
              <AvailableToUseLabel />
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {sectionTogglesLocked
                ? "Free plan: choose Gallery, Products, or Other as your photo category, all uploads stay in that one category until you delete those photos to switch. Categories stay visible on your public page."
                : "Toggle categories on or off, add your own, and upload photos directly into any section."}
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-1" aria-live="polite">
          <p className="text-xs text-gray-600">
            {usageLine}
            {nearPhotoLimit && !atPhotoLimit ? (
              <span className="ml-2 text-amber-900/75">You&apos;re close to your limit</span>
            ) : null}
          </p>
          {planKey === "free" ? (
            <p className="text-xs text-gray-500">
              Select a category below, then upload, Free accounts use one category at a time (no mixing across
              Gallery, Products, and Other).
            </p>
          ) : null}
          <p className="text-xs text-gray-500">
            Best results: upload landscape photos around 1600x900 (16:9). Also supported:
            1200x900 (4:3) and 1080x1350 (portrait).
          </p>
        </div>

        {/* The Free-plan upgrade nudge (photo cap + publish lock + section
            access) is rendered once above this card, see the merged
            banner near the top of this file. Keeping it out of here
            avoids the duplicate "Upgrade plan" / "Upgrade to edit now"
            stack we used to show. */}

        <ul className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sections.length === 0 ? (
            <li className="text-sm text-gray-500 col-span-full">No sections configured yet.</li>
          ) : (
            sections.map((s) => renderSectionRow(s))
          )}
        </ul>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void addCustomSection();
          }}
          className="mt-4 flex flex-wrap items-center gap-2"
        >
          <input
            type="text"
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder={
              sectionTogglesLocked
                ? "Upgrade to add custom sections (e.g., Recent projects)"
                : "Add a custom section (e.g., Recent projects)"
            }
            maxLength={40}
            disabled={sectionTogglesLocked || addingSectionBusy}
            className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/30 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={sectionTogglesLocked || addingSectionBusy || !newSectionTitle.trim()}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#124541] px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add
          </button>
        </form>

        <p className="mt-3 text-xs text-gray-500">
          {sectionTogglesLocked
            ? "Uploads always save as "
            : "Grow, Premium, and Elite: you can delete built-in categories (except Gallery) and add your own. Photos from a removed section move to Gallery. Uploads always save as "}
          <span className="font-medium text-[#0E0E0E]">drafts</span>; click Publish to go live.
        </p>

        {message ? (
          <div
            className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
              message.type === "success"
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        ) : null}
      </div>

      {/* ---- Your photos: drafts + published ----
          Gallery: hero + thumbnail strip (public-profile layout) with drafts + published in one strip.
          Products / Other: grid tiles; Other keeps an extra published-only hero preview below the grid.
          Product drafts: eye on the tile opens a published preview modal. */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-base font-semibold text-[#0E0E0E]">
            Your photos, drafts &amp; published ({photos.length})
          </h2>
          <p className="max-w-xl text-xs text-gray-500">
            {planKey === "free"
              ? "Drafts and live photos appear together by section. Gallery uses the same strip layout as your public page; Products use a grid (eye = draft preview). Publish moves a draft to live on the same photo. You can change cover, reorder, or delete published photos anytime."
              : "Gallery uses the large preview and thumbnail strip (what visitors see). Products and Other use a grid; Other adds a published-only hero preview below. Publish updates each photo in place."}
          </p>
        </div>

        {/* Section tabs, counts include drafts + published */}
        {previewSectionsForChips.length > 0 ? (
          <div
            role="tablist"
            aria-label="Photo sections"
            className="mt-4 flex flex-wrap gap-2"
          >
            {previewSectionsForChips.map((s) => {
              const count = photos.filter((p) => p.section === s.slug).length;
                  const isActive = s.slug === previewSectionSlug;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      onClick={() => setPreviewSectionSlug(s.slug)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/30 ${
                        isActive
                          ? "border-[#124541] bg-[#124541] text-white shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span>{s.title}</span>
                      <span
                        className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                          isActive
                            ? "bg-white/20 text-white"
                            : count > 0
                              ? "bg-[#E6F7F5] text-[#124541]"
                              : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

        {draftPhotosForActiveSection.length > 0 ? (
          <div className="mt-4 rounded-lg border border-amber-200/90 bg-amber-50/45 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <p className="min-w-0 max-w-xl text-sm text-gray-800">
                <span className="font-semibold text-[#0E0E0E]">Drafts in {activeSectionTitle}.</span>{" "}
                Drag drafts or published photos by the grip to reorder (Gallery thumbnails and grid).
                Select up to{" "}
                {MAX_BULK_DRAFT_SELECTION} tiles below, then delete or publish, live photos stay on
                the same cards after publishing.
              </p>
              <div className="flex shrink-0 flex-col items-stretch gap-2 sm:flex-row sm:items-center">
                {pendingBatchMeta &&
                draftPhotos.some(
                  (p) =>
                    p.upload_batch_id === pendingBatchMeta.batchId &&
                    p.section === pendingBatchMeta.sectionSlug &&
                    !p.upload_batch_label
                ) ? (
                  <button
                    type="button"
                    onClick={() => void savePendingBatchLabel()}
                    disabled={batchLabelBusy || bulkDeleteBusy}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-[#124541] bg-white px-4 py-2 text-sm font-semibold text-[#124541] shadow-sm hover:bg-[#124541]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/30 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {batchLabelBusy ? (
                      <>
                        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#124541] border-t-transparent" />
                        Saving…
                      </>
                    ) : (
                      <>Save batch</>
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void deleteSelectedDrafts()}
                  disabled={
                    bulkDeleteBusy ||
                    publishBusy ||
                    selectedDraftIds.length === 0 ||
                    !selectedDraftIds.some((id) => {
                      const ph = draftPhotosForActiveSection.find((x) => x.id === id);
                      return ph && !isLocked(ph);
                    })
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200/60 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkDeleteBusy ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-300 border-t-red-700" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4 shrink-0" aria-hidden />
                      Delete selected ({selectedDraftIds.length})
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void publishDrafts(activeSectionSlug)}
                  disabled={
                    publishBusy ||
                    bulkDeleteBusy ||
                    anyFitSaving ||
                    draftPhotosForActiveSection.length === 0
                  }
                  className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-[#124541] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#0f3a35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/30 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {publishBusy ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Publishing…
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" aria-hidden />
                      Publish {draftPhotosForActiveSection.length} in {activeSectionTitle}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {draftPhotos.length > 0 &&
        draftPhotos.some((p) => p.section !== activeSectionSlug) ? (
          <p className="mt-3 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2 text-xs text-amber-950">
            You have {draftPhotos.length} draft{draftPhotos.length === 1 ? "" : "s"} across
            sections, switch tabs to work on another category.
          </p>
        ) : null}

        {photosForActiveUnifiedSection.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">
            No photos in <span className="font-semibold">{activeSectionTitle}</span> yet. Choose
            this category under <span className="font-medium">Photo sections</span> above, then
            upload. New uploads save as drafts until you publish.
          </p>
        ) : (
          <>
            {draftPhotosForActiveSection.length > 0 ? (
              <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-gray-100 pt-4 text-sm">
                <button
                  type="button"
                  onClick={selectAllDeletableDraftsInSection}
                  disabled={
                    bulkDeleteBusy ||
                    draftPhotosForActiveSection.filter((p) => !isLocked(p)).length === 0
                  }
                  className="font-medium text-[#124541] underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Select all
                </button>
                <span className="text-gray-300" aria-hidden>
                  |
                </span>
                <button
                  type="button"
                  onClick={clearDraftSelection}
                  disabled={bulkDeleteBusy || selectedDraftIds.length === 0}
                  className="font-medium text-gray-600 underline-offset-2 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Clear selection
                </button>
                {selectedDraftIds.length > 0 ? (
                  <span className="rounded-full bg-[#E6F7F5] px-2.5 py-0.5 text-xs font-medium text-[#124541] ring-1 ring-teal-100">
                    {selectedDraftIds.length} selected
                  </span>
                ) : null}
              </div>
            ) : null}
            {activeSectionSlug === "gallery" ? (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-500">
                  Same layout as your live Gallery: large preview plus thumbnails. Drafts show editing controls;
                  published tiles hide star/delete until hover (locked photos hide them completely). Drag any tile by
                  the grip on a thumbnail or grid card to reorder, drafts and published photos move the same way.
                </p>
                {galleryHeroPhoto ? (
                  <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
                    <div className="relative block aspect-[16/9] w-full">
                      {galleryHeroPhoto.status === "draft" ? (
                        <button
                          type="button"
                          aria-label="Preview full photo"
                          title="Preview full photo"
                          className="absolute inset-0 z-[1] cursor-zoom-in bg-transparent"
                          onClick={() => setDraftLightboxPhotoId(galleryHeroPhoto.id)}
                        />
                      ) : null}
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        key={galleryHeroPhoto.id}
                        src={galleryHeroPhoto.url}
                        alt=""
                        className={`absolute inset-0 z-0 h-full w-full object-center photos-hero-fade ${
                          galleryHeroPhoto.preview_frame === "portrait"
                            ? "object-contain bg-gray-100"
                            : "object-cover"
                        }`}
                        loading="eager"
                        decoding="async"
                      />

                      <span className="pointer-events-none absolute right-3 top-3 z-[2] rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0E0E0E] shadow-sm ring-1 ring-black/5 backdrop-blur">
                        {previewSection?.title ?? "Gallery"}
                      </span>

                      {galleryHeroPhoto.status === "draft" && galleryHeroPhoto.is_cover ? (
                        <span className="absolute left-3 top-3 z-[2] inline-flex items-center gap-1 rounded-md bg-[#1FAF9E] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
                          <Star className="h-3 w-3" aria-hidden />
                          Cover
                        </span>
                      ) : null}

                      {isLocked(galleryHeroPhoto) ? (
                        <span className="absolute bottom-3 right-3 z-[2] inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                          <Lock className="h-3 w-3" aria-hidden />
                          Locked
                        </span>
                      ) : (
                        <div className="absolute bottom-3 right-3 z-[2] inline-flex h-8 items-stretch rounded-md border border-gray-200 bg-white/95 p-0.5 shadow-md backdrop-blur">
                          <button
                            type="button"
                            onClick={() => void savePhotoFitMode(galleryHeroPhoto, false)}
                            disabled={fitSavingByPhotoId[galleryHeroPhoto.id] === true}
                            className={`rounded px-2 text-[10px] font-semibold ${
                              (fitModeByPhotoId[galleryHeroPhoto.id] ??
                                (galleryHeroPhoto.preview_frame === "portrait")) === true
                                ? "text-gray-600 hover:bg-gray-100"
                                : "bg-[#124541] text-white"
                            }`}
                          >
                            Fill
                          </button>
                          <button
                            type="button"
                            onClick={() => void savePhotoFitMode(galleryHeroPhoto, true)}
                            disabled={fitSavingByPhotoId[galleryHeroPhoto.id] === true}
                            className={`rounded px-2 text-[10px] font-semibold ${
                              (fitModeByPhotoId[galleryHeroPhoto.id] ??
                                (galleryHeroPhoto.preview_frame === "portrait")) === true
                                ? "bg-[#124541] text-white"
                                : "text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            Fit
                          </button>
                        </div>
                      )}

                      {photosForActiveUnifiedSection.length > 1 ? (
                        <span className="pointer-events-none absolute bottom-3 left-3 z-[2] rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur">
                          {photosForActiveUnifiedSection.findIndex((x) => x.id === galleryHeroPhoto.id) +
                            1}{" "}
                          / {photosForActiveUnifiedSection.length}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {photosForActiveUnifiedSection.length > 0 ||
                (planKey === "free" && atPhotoLimit && canUpgrade) ? (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setPreviewThumbStart((prev) => Math.max(0, prev - 1))
                      }
                      disabled={!canPrevThumb}
                      aria-label="Show previous photos"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                    </button>

                    <div className="relative min-w-0 flex-1 overflow-hidden">
                      <div
                        className="flex transition-transform duration-300 ease-out"
                        style={{
                          transform: `translateX(-${(100 / HERO_VISIBLE_THUMBS) * previewThumbStart}%)`,
                        }}
                      >
                        {photosForActiveUnifiedSection.map((p) => {
                          const isActive = galleryHeroPhoto?.id === p.id;
                          const isDraft = p.status === "draft";
                          const locked = isLocked(p);
                          const busy = photoBusyId === p.id;
                          const actionsDisabled = busy || locked || bulkDeleteBusy;
                          const bulkSelectionAtCap =
                            isDraft &&
                            !selectedDraftIds.includes(p.id) &&
                            selectedDraftIds.length >= MAX_BULK_DRAFT_SELECTION;
                          const publishedUnlockedChromeHover =
                            !isDraft && !locked;
                          const publishedLockedChromeOff = !isDraft && locked;
                          const reorderThumbDropActive =
                            Boolean(reorderDraggingId) &&
                            !reorderBusy &&
                            reorderDraggingId !== p.id;
                          return (
                            <div
                              key={p.id}
                              style={{ flex: `0 0 ${100 / HERO_VISIBLE_THUMBS}%` }}
                              className="px-1"
                            >
                              <div
                                role="button"
                                tabIndex={0}
                                aria-pressed={isActive}
                                aria-label={`Show ${labelForSection(p.section)} photo in preview`}
                                onClick={() => setPreviewPhotoId(p.id)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    setPreviewPhotoId(p.id);
                                  }
                                }}
                                onDragOver={(e) => {
                                  if (!reorderThumbDropActive) return;
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = "move";
                                  setReorderDropTargetId(p.id);
                                }}
                                onDragLeave={(e) => {
                                  if (!reorderThumbDropActive) return;
                                  const next = e.relatedTarget;
                                  if (next instanceof Node && e.currentTarget.contains(next)) return;
                                  setReorderDropTargetId((cur) => (cur === p.id ? null : cur));
                                }}
                                onDrop={(e) => {
                                  if (!reorderThumbDropActive) return;
                                  e.preventDefault();
                                  e.stopPropagation();
                                  const draggedId =
                                    e.dataTransfer.getData(REORDER_MIME) ||
                                    e.dataTransfer.getData("text/plain");
                                  if (!draggedId || draggedId === p.id) return;
                                  void applyReorderDrop(p.section, draggedId, p.id);
                                }}
                                className={`group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg border bg-gray-100 transition-[border-color,transform,box-shadow,opacity] duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 ${
                                  isActive
                                    ? "border-[#1FAF9E] ring-2 ring-[#1FAF9E]/40"
                                    : "border-gray-200 hover:border-gray-300"
                                } ${
                                  reorderDraggingId === p.id
                                    ? "z-30 scale-[1.03] opacity-95 shadow-2xl ring-2 ring-[#1FAF9E]/50"
                                    : ""
                                } ${
                                  reorderThumbDropActive &&
                                  reorderDropTargetId === p.id &&
                                  reorderDraggingId !== p.id
                                    ? "z-[5] scale-[0.97] bg-teal-50/50 ring-2 ring-[#1FAF9E]"
                                    : ""
                                }`}
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={p.url}
                                  alt=""
                                  loading="lazy"
                                  decoding="async"
                                  className={`h-full w-full object-center ${
                                    p.preview_frame === "portrait"
                                      ? "object-contain bg-gray-100"
                                      : "object-cover"
                                  }`}
                                />

                                {(isDraft || p.status === "published") ? (
                                  <div
                                    draggable={!bulkDeleteBusy && !publishBusy && !reorderBusy}
                                    onDragStart={(e) => {
                                      if (bulkDeleteBusy || publishBusy || reorderBusy) {
                                        e.preventDefault();
                                        return;
                                      }
                                      e.stopPropagation();
                                      e.dataTransfer.setData(REORDER_MIME, p.id);
                                      e.dataTransfer.setData("text/plain", p.id);
                                      e.dataTransfer.effectAllowed = "move";
                                      setReorderDraggingId(p.id);
                                    }}
                                    onDragEnd={clearReorderDragUi}
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute left-1 top-1 z-[13] inline-flex h-6 w-6 cursor-grab items-center justify-center rounded border border-gray-200 bg-white/95 text-gray-500 shadow-sm active:cursor-grabbing"
                                    aria-label="Drag to reorder"
                                    title="Drag to reorder"
                                  >
                                    <GripVertical className="h-3.5 w-3.5" aria-hidden />
                                  </div>
                                ) : null}

                                {isDraft ? (
                                  <div className="absolute bottom-1.5 left-1.5 z-[12]">
                                    <label
                                      className={`inline-flex items-center justify-center rounded-md bg-white/95 p-1 shadow-md ring-1 ring-black/10 ${
                                        bulkSelectionAtCap || locked || bulkDeleteBusy
                                          ? "cursor-not-allowed opacity-70"
                                          : "cursor-pointer"
                                      }`}
                                      onClick={(e) => e.stopPropagation()}
                                      onKeyDown={(e) => e.stopPropagation()}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedDraftIds.includes(p.id)}
                                        disabled={locked || bulkDeleteBusy || bulkSelectionAtCap}
                                        onChange={() => toggleDraftSelection(p.id)}
                                        aria-label={`Select draft for bulk delete, ${labelForSection(p.section)}`}
                                        title={
                                          bulkSelectionAtCap
                                            ? `At most ${MAX_BULK_DRAFT_SELECTION} drafts can be selected`
                                            : undefined
                                        }
                                        className="h-3.5 w-3.5 rounded border-gray-300 text-[#1FAF9E] focus:ring-[#1FAF9E] disabled:cursor-not-allowed"
                                      />
                                    </label>
                                  </div>
                                ) : null}

                                {isDraft && p.is_cover ? (
                                  <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-[#1FAF9E] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
                                    <Star className="h-2.5 w-2.5" aria-hidden />
                                    Cover
                                  </span>
                                ) : null}

                                {!isDraft && locked ? (
                                  <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                                    <Lock className="h-2.5 w-2.5" aria-hidden />
                                    Locked
                                  </span>
                                ) : null}

                                {isDraft ? (
                                  <span
                                    className={`absolute right-1.5 bottom-1.5 z-[11] max-w-[calc(100%-2.5rem)] truncate rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur ${
                                      p.moderation_status === "rejected"
                                        ? "bg-rose-600/95 text-white"
                                        : p.moderation_status === "flagged"
                                          ? "bg-orange-500/95 text-white"
                                          : p.moderation_status === "approved"
                                            ? "bg-amber-500/95 text-white ring-1 ring-amber-700/30"
                                            : "bg-slate-700/80 text-white"
                                    }`}
                                  >
                                    {p.moderation_status === "rejected"
                                      ? "Rejected"
                                      : p.moderation_status === "flagged"
                                        ? "Flagged"
                                        : p.moderation_status === "approved"
                                          ? "Draft"
                                          : "Pending"}
                                  </span>
                                ) : p.moderation_status !== "approved" ? (
                                  <span
                                    className={`absolute right-1.5 bottom-1.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur ${
                                      p.moderation_status === "rejected"
                                        ? "bg-rose-600/90 text-white"
                                        : p.moderation_status === "flagged"
                                          ? "bg-orange-500/90 text-white"
                                          : "bg-slate-700/80 text-white"
                                    }`}
                                  >
                                    {p.moderation_status === "rejected"
                                      ? "Rejected"
                                      : p.moderation_status === "flagged"
                                        ? "Flagged"
                                        : "Pending"}
                                  </span>
                                ) : null}

                                <div
                                  className={`absolute right-1.5 top-1.5 z-[12] flex items-center gap-1 transition-opacity ${
                                    publishedUnlockedChromeHover
                                      ? "opacity-0 group-hover:opacity-100"
                                      : publishedLockedChromeOff
                                        ? "pointer-events-none opacity-0"
                                        : ""
                                  }`}
                                >
                                  {!p.is_cover ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        void setAsCover(p);
                                      }}
                                      disabled={actionsDisabled}
                                      aria-label={
                                        isDraft ? "Pick as cover (applies when published)" : "Set as cover"
                                      }
                                      title={
                                        locked
                                          ? "Locked, upgrade to change cover now"
                                          : isDraft
                                            ? "Pick as cover (applies when published)"
                                            : "Set as cover"
                                      }
                                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Star className="h-3 w-3" aria-hidden />
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void deletePhoto(p);
                                    }}
                                    disabled={actionsDisabled}
                                    aria-label={isDraft ? "Remove draft" : "Remove photo"}
                                    title={
                                      locked
                                        ? "Locked, upgrade to remove now"
                                        : isDraft
                                          ? "Remove draft"
                                          : "Remove photo"
                                    }
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Trash2 className="h-3 w-3" aria-hidden />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {planKey === "free" && atPhotoLimit && canUpgrade ? (
                          <div
                            style={{
                              flex: `0 0 ${100 / HERO_VISIBLE_THUMBS}%`,
                            }}
                            className="px-1"
                          >
                            <Link
                              href="/business/dashboard/settings/photos/more"
                              className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#1FAF9E]/50 bg-[#E6F7F5] px-2 text-center transition hover:border-[#1FAF9E] hover:bg-[#D9F1EE]"
                            >
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1FAF9E] shadow-sm">
                                <Plus className="h-4 w-4" aria-hidden />
                              </span>
                              <span className="text-[11px] font-semibold text-[#0E0E0E]">
                                Upload more photos
                              </span>
                              <span className="text-[10px] leading-snug text-gray-600">
                                Queue up to{" "}
                                {PLAN_PHOTO_LIMITS.grow - PLAN_PHOTO_LIMITS.free} more on Grow
                              </span>
                            </Link>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setPreviewThumbStart((prev) =>
                          Math.min(maxThumbStart, prev + 1)
                        )
                      }
                      disabled={!canNextThumb}
                      aria-label="Show more photos"
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <ul
                className={`mt-4 grid gap-3 ${
                  activeSectionSlug === "products"
                    ? "grid-cols-2 sm:grid-cols-5"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
                }`}
              >
                {photosForActiveUnifiedSection.map((p) =>
                  renderPhotoTile(p, { bulkSelectDrafts: true })
                )}
              </ul>
            )}
          </>
        )}

            {/* Public profile preview, Other (published only). Gallery uses hero strip above; Products use the grid + tip. */}
            <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
              {previewSectionSlug === "products" ? (
                activeSectionSlug === "products" ? (
                  <p className="text-center text-xs text-gray-500">
                    Product drafts: tap the{" "}
                    <span className="inline-flex align-middle text-gray-700">
                      <Eye className="mx-0.5 inline h-3.5 w-3.5" aria-hidden />
                    </span>{" "}
                    on a card for a published-style preview before you go live. Each upload gets a unique
                    review ID (see <span className="font-medium text-gray-700">Set name</span>).
                  </p>
                ) : null
              ) : previewSectionSlug === "gallery" ? null : (
                <>
                  {previewPhoto ? (
                    <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
                      <div className="relative block aspect-[16/9] w-full">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          key={previewPhoto.id}
                          src={previewPhoto.url}
                          alt=""
                          className={`absolute inset-0 h-full w-full object-center photos-hero-fade ${
                            previewPhoto.preview_frame === "portrait"
                              ? "object-contain bg-gray-100"
                              : "object-cover"
                          }`}
                          loading="eager"
                          decoding="async"
                        />

                        <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0E0E0E] shadow-sm ring-1 ring-black/5 backdrop-blur">
                          {previewSection?.title ?? "Photos"}
                        </span>

                        {isLocked(previewPhoto) ? (
                          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                            <Lock className="h-3 w-3" aria-hidden />
                            Locked
                          </span>
                        ) : null}

                        {previewPhotos.length > 1 ? (
                          <span className="absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur">
                            {previewPhotos.findIndex((p) => p.id === previewPhoto.id) + 1} /{" "}
                            {previewPhotos.length}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <div className="flex aspect-[16/9] w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-1 ring-black/5">
                        <Upload className="h-5 w-5" aria-hidden />
                      </div>
                      <p className="mt-3 text-sm font-semibold text-[#0E0E0E]">
                        No published photos in {previewSection?.title ?? "this section"} yet
                      </p>
                      <p className="mt-1 max-w-sm text-xs text-gray-500">
                        Upload into this section above, then publish to see it here and on your
                        public profile.
                      </p>
                    </div>
                  )}

                  {/* Thumbnail strip + pagination (Gallery / Other sections only) */}
                  {previewPhotos.length > 0 ||
                  (planKey === "free" && atPhotoLimit && canUpgrade) ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setPreviewThumbStart((prev) => Math.max(0, prev - 1))
                    }
                    disabled={!canPrevThumb}
                    aria-label="Show previous photos"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                  </button>

                  <div className="relative min-w-0 flex-1 overflow-hidden">
                    <div
                      className="flex transition-transform duration-300 ease-out"
                      style={{
                        transform: `translateX(-${(100 / HERO_VISIBLE_THUMBS) * previewThumbStart}%)`,
                      }}
                    >
                      {previewPhotos.map((p) => {
                        const isActive = previewPhoto?.id === p.id;
                        const locked = isLocked(p);
                        const busy = photoBusyId === p.id;
                        const actionsDisabled = busy || locked;
                        return (
                          <div
                            key={p.id}
                            style={{ flex: `0 0 ${100 / HERO_VISIBLE_THUMBS}%` }}
                            className="px-1"
                          >
                            <div
                              role="button"
                              tabIndex={0}
                              aria-pressed={isActive}
                              aria-label={`Show ${labelForSection(p.section)} photo in preview`}
                              onClick={() => setPreviewPhotoId(p.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  setPreviewPhotoId(p.id);
                                }
                              }}
                              className={`group relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg border bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 ${
                                isActive
                                  ? "border-[#1FAF9E] ring-2 ring-[#1FAF9E]/40"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={p.url}
                                alt=""
                                loading="lazy"
                                decoding="async"
                                className={`h-full w-full object-center ${
                                  p.preview_frame === "portrait"
                                    ? "object-contain bg-gray-100"
                                    : "object-cover"
                                }`}
                              />

                              {locked ? (
                                <span className="absolute left-1.5 bottom-1.5 inline-flex items-center gap-0.5 rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                                  <Lock className="h-2.5 w-2.5" aria-hidden />
                                  Locked
                                </span>
                              ) : null}

                              {p.moderation_status !== "approved" ? (
                                <span
                                  className={`absolute right-1.5 bottom-1.5 inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur ${
                                    p.moderation_status === "rejected"
                                      ? "bg-rose-600/90 text-white"
                                      : p.moderation_status === "flagged"
                                        ? "bg-orange-500/90 text-white"
                                        : "bg-slate-700/80 text-white"
                                  }`}
                                  title={
                                    p.moderation_status === "rejected"
                                      ? p.moderation_reason
                                        ? `Rejected: ${p.moderation_reason}`
                                        : "Rejected by image review"
                                      : p.moderation_status === "flagged"
                                        ? p.moderation_reason
                                          ? `Flagged for review: ${p.moderation_reason}`
                                          : "Flagged for manual review"
                                        : "Pending image review"
                                  }
                                >
                                  {p.moderation_status === "rejected"
                                    ? "Rejected"
                                    : p.moderation_status === "flagged"
                                      ? "Flagged"
                                      : "Pending"}
                                </span>
                              ) : null}

                              {/* Owner controls, nested inside the div
                                  role=button. We stopPropagation so clicks
                                  on the action buttons don't also swap the
                                  hero. */}
                              <div className="absolute right-1.5 top-1.5 flex items-center gap-1">
                                {!p.is_cover ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      void setAsCover(p);
                                    }}
                                    disabled={actionsDisabled}
                                    aria-label="Set as cover"
                                    title={
                                      locked
                                        ? "Locked for 30 days after publishing, upgrade to change the cover now"
                                        : "Set as cover"
                                    }
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    <Star className="h-3 w-3" aria-hidden />
                                  </button>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void deletePhoto(p);
                                  }}
                                  disabled={actionsDisabled}
                                  aria-label="Remove photo"
                                  title={
                                    locked
                                      ? "Locked for 30 days after publishing, upgrade to remove now"
                                      : "Remove photo"
                                  }
                                  className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-600 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2 className="h-3 w-3" aria-hidden />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {/* "Upload more photos" teaser, only for Free
                          users who have hit their 4-photo cap. Lives at
                          the end of whichever section is currently
                          selected so it's always discoverable. */}
                      {planKey === "free" && atPhotoLimit && canUpgrade ? (
                        <div
                          style={{
                            flex: `0 0 ${100 / HERO_VISIBLE_THUMBS}%`,
                          }}
                          className="px-1"
                        >
                          <Link
                            href="/business/dashboard/settings/photos/more"
                            className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-[#1FAF9E]/50 bg-[#E6F7F5] px-2 text-center transition hover:border-[#1FAF9E] hover:bg-[#D9F1EE]"
                          >
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#1FAF9E] shadow-sm">
                              <Plus className="h-4 w-4" aria-hidden />
                            </span>
                            <span className="text-[11px] font-semibold text-[#0E0E0E]">
                              Upload more photos
                            </span>
                            <span className="text-[10px] leading-snug text-gray-600">
                              Queue up to{" "}
                              {PLAN_PHOTO_LIMITS.grow - PLAN_PHOTO_LIMITS.free}{" "}
                              more on Grow
                            </span>
                          </Link>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setPreviewThumbStart((prev) =>
                        Math.min(maxThumbStart, prev + 1)
                      )
                    }
                    disabled={!canNextThumb}
                    aria-label="Show more photos"
                    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}
                </>
              )}
            </div>

            {atPhotoLimit && canUpgrade ? (
              <p className="mt-3 text-xs text-gray-500">
                Want more than {planPhotoLimit} photos?{" "}
                <GrowUnlockLink {...growUnlock} className="font-semibold text-[#1FAF9E] underline-offset-2 hover:underline" />
              </p>
            ) : null}
      </div>

        {/* Tiny cross-fade for the hero image swap. Scoped via
            styled-jsx so it doesn't leak into other pages. */}
        <style jsx>{`
          @keyframes photosHeroFade {
            0% {
              opacity: 0;
              transform: scale(1.01);
            }
            100% {
              opacity: 1;
              transform: scale(1);
            }
          }
          :global(.photos-hero-fade) {
            animation: photosHeroFade 260ms ease-out both;
          }
        `}</style>

      {/* Floating toast after publish, immediate feedback + link to public profile */}
      {publishProfileToast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 left-4 right-4 z-[1050] mx-auto flex max-w-md sm:left-auto sm:right-6 sm:mx-0"
        >
          <div className="flex w-full flex-col gap-2 rounded-xl border border-emerald-200/80 bg-white p-4 text-sm shadow-lg ring-1 ring-black/5">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <Check className="h-4 w-4" aria-hidden />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="font-semibold text-[#0E0E0E]">
                  {publishProfileToast.count === 1
                    ? "1 photo published."
                    : `${publishProfileToast.count} photos published.`}
                </p>
                {planKey === "free" ? (
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    They&apos;re visible on your profile while our team completes image review.
                  </p>
                ) : null}
                {selectedBusiness?.slug ? (
                  <Link
                    href={`/b/${selectedBusiness.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setPublishProfileToast(null)}
                    className="mt-2 inline-flex text-sm font-semibold text-[#1FAF9E] underline-offset-2 hover:underline"
                  >
                    View public profile
                  </Link>
                ) : (
                  <p className="mt-2 text-xs text-gray-500">Add a public profile URL in settings to share your page.</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setPublishProfileToast(null)}
                className="-mr-1 -mt-1 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
