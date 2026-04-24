"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Plus,
  Star,
  Trash2,
  Upload,
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
import { openUpgradeFlow } from "@/lib/upgradeFlow";
import {
  computePublishLockStatus,
  isPhotoEditLocked,
} from "@/lib/businessPhotoLock";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";
import {
  isFreePlanSectionLockResponse,
  isPhotoLimitResponse,
  isSectionUploadLocked,
} from "@/lib/photoUploadFreeLimit";
import { compressImage } from "@/lib/imageCompression";
import PhotoLimitModal from "@/components/business/PhotoLimitModal";

const UPLOAD_BUCKET = "business_media";
const MAX_ORIGINAL_BYTES = 20 * 1024 * 1024;
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Bulk delete / bulk publish selection cap (checkboxes in drafts grid). */
const MAX_BULK_DRAFT_SELECTION = 5;

const BUILTIN_SECTION_HINTS: Record<string, string> = {
  gallery: "Your main image strip on your public profile.",
  team: "Faces and roles behind your business.",
  workspace: "Where you work and how it feels.",
  products: "What you sell at a glance.",
  services: "How you help customers.",
  "fleet-logistics": "Vehicles, trucks, and logistics assets you operate.",
};

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

  const [loading, setLoading] = useState(!!businessId);
  const [photos, setPhotos] = useState<PhotoRow[]>([]);
  const [sections, setSections] = useState<SectionRow[]>([]);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showUpgradeSuccess, setShowUpgradeSuccess] = useState(false);
  const [newSectionTitle, setNewSectionTitle] = useState("");
  const [addingSectionBusy, setAddingSectionBusy] = useState(false);
  const [publishBusy, setPublishBusy] = useState(false);
  // Controls the "Yay! Your photos are now live" success modal that appears
  // after a successful publish. Tracks how many photos were published so the
  // modal can pluralise correctly.
  const [publishSuccess, setPublishSuccess] = useState<{
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

  // Pending visibility changes per section — set when the user flips a
  // section's Public/Hidden toggle but has not yet pressed Save. Keyed by
  // section.id. The on-disk `is_enabled` stays untouched until the user
  // confirms. Mirrors the draft/publish pattern we use elsewhere so people
  // can explore without accidentally hiding a section from their public
  // profile mid-thought.
  const [pendingSectionEnabled, setPendingSectionEnabled] = useState<
    Record<string, boolean>
  >({});
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);

  const cardRef = useRef<HTMLDivElement | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const loadAll = useCallback(async () => {
    if (!businessId) return;
    const sb = supabaseBrowser();

    const [photosRes, sectionsRes] = await Promise.all([
      applyBusinessPhotosOrdering(
        sb
          .from("business_photos")
          .select(
            "id, url, section, is_cover, sort_order, status, published_at, created_at, moderation_status, moderation_reason, is_suspected_collage, upload_batch_id, upload_batch_label"
          )
          .eq("business_id", businessId)
      ),
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
            section: String(r.section ?? "gallery"),
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
    let mappedSections = sectionRows.map((r) => ({
      id: String(r.id),
      slug: String(r.slug),
      title: String(r.title),
      is_enabled: r.is_enabled !== false,
      is_builtin: r.is_builtin === true,
      sort_order: typeof r.sort_order === "number" ? r.sort_order : 0,
    }));

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
          if (data?.sections) mappedSections = data.sections;
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

  const lastPublishedAt = useMemo<string | null>(() => {
    let best: number | null = null;
    for (const p of publishedPhotos) {
      if (!p.published_at) continue;
      const t = Date.parse(p.published_at);
      if (!Number.isFinite(t)) continue;
      if (best === null || t > best) best = t;
    }
    return best === null ? null : new Date(best).toISOString();
  }, [publishedPhotos]);
  const businessLock = useMemo(
    () => computePublishLockStatus(planKey, lastPublishedAt),
    [planKey, lastPublishedAt]
  );
  const lockUnlockDate = businessLock.lockedUntil
    ? new Date(businessLock.lockedUntil)
    : null;
  const lockUnlockLabel = lockUnlockDate
    ? lockUnlockDate.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";
  const sectionTitleBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sections) map.set(s.slug, s.title);
    return map;
  }, [sections]);
  const labelForSection = (slug: string): string =>
    sectionTitleBySlug.get(slug) ??
    slug.charAt(0).toUpperCase() + slug.slice(1);

  const planPhotoLimit = getPhotoLimitForPlan(planKey);
  const usageLine = `You've used ${photoTotalCount} of ${planPhotoLimit} photos`;
  const nearPhotoLimit =
    photoTotalCount > 0 &&
    photoTotalCount >= planPhotoLimit - 1 &&
    photoTotalCount < planPhotoLimit;
  const atPhotoLimit = photoTotalCount >= planPhotoLimit;
  const canUpgrade = planKey !== "elite";
  const sectionTogglesLocked = planKey === "free";

  const isLocked = (p: PhotoRow): boolean =>
    isPhotoEditLocked(planKey, p.status, p.published_at);

  /** ----------------------------------------------------------------
   *  Published-photos preview (hero + thumbnail strip)
   *  ----------------------------------------------------------------
   *  Mirrors the public profile gallery: one "big" photo on top with up
   *  to 4 thumbnails beneath, paginated with left/right arrows. Clicking
   *  a section chip above (or a thumbnail) swaps what's shown. Owner
   *  controls (set-as-cover / delete) remain on the thumbnails so the
   *  dashboard still works as a management surface — not just a preview.
   *  ---------------------------------------------------------------- */
  const HERO_VISIBLE_THUMBS = 4;
  const [previewSectionSlug, setPreviewSectionSlug] = useState<string | null>(null);
  const [previewPhotoId, setPreviewPhotoId] = useState<string | null>(null);
  const [previewThumbStart, setPreviewThumbStart] = useState(0);

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
  // active section changes, so switching to Team doesn't leave a Gallery
  // photo showing big (or the thumb strip scrolled mid-way).
  useEffect(() => {
    setPreviewPhotoId(null);
    setPreviewThumbStart(0);
  }, [previewSectionSlug]);

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

  // Clamp the thumb-strip scroll window to valid bounds whenever the
  // list shrinks (e.g. after a delete).
  useEffect(() => {
    const maxStart = Math.max(0, previewPhotos.length - HERO_VISIBLE_THUMBS);
    if (previewThumbStart > maxStart) setPreviewThumbStart(maxStart);
  }, [previewPhotos.length, previewThumbStart]);

  const maxThumbStart = Math.max(0, previewPhotos.length - HERO_VISIBLE_THUMBS);
  const canPrevThumb = previewThumbStart > 0;
  const canNextThumb = previewThumbStart < maxThumbStart;

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
        text: "Gallery can't be deleted — it's the default album for your photos.",
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

  /** ---- Upload (inline per-section; multi-select supported) ---- */
  const handleFilesForSection = async (
    e: React.ChangeEvent<HTMLInputElement>,
    section: SectionRow
  ) => {
    const rawList = e.target.files ? Array.from(e.target.files) : [];
    e.target.value = "";
    if (rawList.length === 0 || !businessId) return;

    if (isSectionUploadLocked(planKey, section.slug)) {
      openUpgradeFlow("section_locked");
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
        text: `${skipped} file(s) were skipped — only images are allowed.`,
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
          if (isFreePlanSectionLockResponse(res.status, body)) {
            openUpgradeFlow("section_locked");
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
      setMessage({
        type: "success",
        text: `Published ${publishedCount} photo${
          publishedCount === 1 ? "" : "s"
        }.`,
      });
      if (planKey === "free" && publishedCount > 0) {
        setPublishSuccess({ count: publishedCount });
      }
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

    return (
      <li
        key={p.id}
        className={`relative overflow-hidden rounded-lg border bg-gray-50 aspect-[4/3] ${borderClass} ${
          isDraftBulkSelected ? "ring-2 ring-[#1FAF9E] ring-offset-2 ring-offset-amber-50/40" : ""
        }`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={p.url} alt="" className="h-full w-full object-cover" loading="lazy" />

        {bulkSelectDrafts && isDraft ? (
          <div className="absolute left-2 bottom-12 z-[2]">
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

        {isDraft ? (
          <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
            <span className="rounded-md bg-amber-500/90 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
              Draft
            </span>
            {p.is_cover ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-[#1FAF9E] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
                <Star className="h-3 w-3" aria-hidden />
                Cover
              </span>
            ) : null}
          </div>
        ) : p.is_cover ? (
          <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#1FAF9E] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
            <Star className="h-3 w-3" aria-hidden />
            Cover
          </span>
        ) : null}

        {!isDraft && locked ? (
          <span className="absolute left-2 bottom-8 inline-flex items-center gap-1 rounded-md bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
            <Lock className="h-3 w-3" aria-hidden />
            Locked
          </span>
        ) : null}

        {/* Moderation badge — only render when the validator has an opinion
            (pending/flagged/rejected). Approved rows get no badge to keep
            the tile clean. */}
        {p.moderation_status !== "approved" ? (
          <span
            className={`absolute right-2 bottom-8 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide shadow-sm backdrop-blur ${
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
                  : "Pending image review — usually clears within a few minutes"
            }
          >
            {p.moderation_status === "rejected"
              ? "Rejected"
              : p.moderation_status === "flagged"
                ? "Flagged"
                : "Pending review"}
          </span>
        ) : null}

        <div className="absolute right-2 top-2 flex items-center gap-1">
          {!p.is_cover ? (
            <button
              type="button"
              onClick={() => void setAsCover(p)}
              disabled={actionsDisabled}
              aria-label={isDraft ? "Pick as cover (applies when published)" : "Set as cover"}
              title={
                locked
                  ? "Locked for 30 days after publishing — upgrade to change the cover now"
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
                ? "Locked for 30 days after publishing — upgrade to remove now"
                : isDraft
                  ? "Remove draft"
                  : "Remove photo"
            }
            className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 bg-white/95 text-gray-600 shadow-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>

        <div className={`${footerClass} px-2 py-1 text-xs text-gray-600`}>
          {labelForSection(p.section)}
          {!isDraft && p.is_cover ? (
            <span className="ml-1 font-medium text-[#1FAF9E]">· cover</span>
          ) : null}
          {isDraft && p.is_cover ? (
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
    const uploadPlanLocked = isSectionUploadLocked(planKey, s.slug);
    const isSelected = s.slug === activeSectionSlug;
    // "Active / available" = enabled AND the current plan can actually upload
    // to this section. Paid plans → every enabled section. Free → only Gallery.
    const isAvailable = !disabledRow && !uploadPlanLocked;
    const uploadDisabled =
      isUploading ||
      anyUploading ||
      disabledRow ||
      atPhotoLimit ||
      (isAvailable && !isSelected);
    const hint =
      BUILTIN_SECTION_HINTS[s.slug] ??
      (s.is_builtin ? "" : `Photos for "${s.title}".`);
    const savedBatches = savedBatchCountBySectionSlug.get(s.slug) ?? 0;
    const uploadButtonPrimary = isSelected && isAvailable && !uploadDisabled;

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
            : uploadPlanLocked
              ? "border border-amber-200/90 bg-amber-50/25"
              : isSelected
                ? "border border-[#1FAF9E] bg-white shadow-sm ring-2 ring-[#1FAF9E]/25"
                : "border border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/60"
        }`}
      >
        <div className="flex h-full flex-col gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
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
              {s.is_builtin ? (
                <span className="rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                  Built-in
                </span>
              ) : (
                <span className="rounded-md bg-teal-50 px-1.5 py-0.5 text-[10px] font-medium text-teal-700 ring-1 ring-teal-100">
                  Custom
                </span>
              )}
              {!uploadPlanLocked ? <AvailableToUseLabel /> : null}
            </div>
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
                              ? "Visible on your public profile — click to hide"
                              : "Hidden from your public profile — click to show"
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
                        ? `Unsaved — click Save to make this section ${
                            effectiveEnabled ? "Public" : "Hidden"
                          }.`
                        : "Hide or show this content to the public."}
                    </p>
                  </>
                );
              })()}
            </div>

            {uploadPlanLocked ? (
              <button
                type="button"
                onClick={() => openUpgradeFlow("section_locked")}
                title="Upgrade to upload photos to this section"
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#4B5563] bg-[#4B5563] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#374151] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4B5563]/40 sm:text-sm"
              >
                <Lock className="h-3.5 w-3.5 text-white/90" aria-hidden />
                Upgrade to upload
              </button>
            ) : (
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
                      ? "You've reached your plan's photo limit"
                      : !s.is_enabled
                        ? "This section is hidden from your public profile — set it to Public to upload"
                        : !isSelected
                          ? "Select this category first to upload here"
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
            )}

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

  return (
    <div className="w-full space-y-6">
      <PhotoLimitModal open={limitModalOpen} onClose={() => setLimitModalOpen(false)} />

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

      {/* Single merged Free-plan upgrade nudge — covers BOTH the 30-day
          publish lock and the photo upload limit. Title adapts to the
          most urgent state (limit reached > lock), while the body
          describes whichever concerns are active and a unified list of
          upgrade benefits. Replaces two previously-stacked banners. */}
      {planKey === "free" && (businessLock.locked || atPhotoLimit) ? (
        <div
          role="note"
          className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-4 text-sm text-amber-950 sm:flex-row sm:items-start sm:gap-3"
        >
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
          <div className="flex-1">
            <p className="font-medium text-amber-900">
              {atPhotoLimit
                ? `You've reached your Free plan's ${planPhotoLimit}-photo limit`
                : `Published photos locked for ${businessLock.daysRemaining} more day${
                    businessLock.daysRemaining === 1 ? "" : "s"
                  }`}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-900/85">
              {businessLock.locked ? (
                <>
                  On the Free plan, photos you&apos;ve already published become read-only
                  for 30 calendar days — they unlock automatically on{" "}
                  <span className="font-semibold">{lockUnlockLabel}</span>.{" "}
                </>
              ) : null}
              {atPhotoLimit
                ? "You\u2019ve also hit your photo upload limit. "
                : businessLock.locked
                  ? "You can still upload new photos up to your plan limit. "
                  : ""}
              Upgrade to edit published photos now, add more photos, upload to every
              section (Team, Workspace, Products, Services), hide categories you don&apos;t
              use, and create custom ones. Your built-in categories stay visible on your
              public page even when empty.
            </p>
            {canUpgrade ? (
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() =>
                    openUpgradeFlow(atPhotoLimit ? "upload_limit" : "publish_lock")
                  }
                  className="inline-flex items-center justify-center rounded-full bg-[#124541] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f3a35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/30"
                >
                  Upgrade to edit now
                </button>
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
                ? "Free plan: upload to Gallery only. Other sections stay visible on your public page — upgrade to add photos to them."
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
        </div>

        {/* The Free-plan upgrade nudge (photo cap + publish lock + section
            access) is rendered once above this card — see the merged
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

      {/* ---- Drafts awaiting publish (scoped to selected section) ---- */}
      {draftPhotos.length > 0 ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h2 className="text-base font-semibold text-[#0E0E0E]">
                {activeSectionTitle} drafts (
                {draftPhotosForActiveSection.length})
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Showing drafts for the selected section ({activeSectionTitle}). Use the checkboxes
                to select up to {MAX_BULK_DRAFT_SELECTION} drafts at a time, then{" "}
                <span className="font-medium text-[#0E0E0E]">Delete selected</span> or publish.
                Tap the star on any draft to mark it as your cover — that applies when you publish
                this section.{" "}
                {planKey === "free" ? (
                  <span className="font-medium text-amber-900">
                    Free plan: Once a photo is published, it becomes read-only. Upgrade to edit it
                    now, or wait 30 calendar days to upload, update, or remove it.
                  </span>
                ) : null}
              </p>
              {draftPhotos.length !== draftPhotosForActiveSection.length ? (
                <p className="mt-2 text-xs text-amber-900/90">
                  You have {draftPhotos.length} draft photo{draftPhotos.length === 1 ? "" : "s"}{" "}
                  across all sections. Select another category above to review or publish those
                  drafts.
                </p>
              ) : null}
            </div>
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
          {draftPhotosForActiveSection.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">
              No drafts in this section. Select a different photo category or upload photos here.
            </p>
          ) : (
            <>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-amber-200/50 pt-3 text-sm">
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
                  <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-amber-200/80">
                    {selectedDraftIds.length} selected
                  </span>
                ) : null}
              </div>
              <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {draftPhotosForActiveSection.map((p) =>
                  renderPhotoTile(p, { bulkSelectDrafts: true })
                )}
              </ul>
            </>
          )}
        </div>
      ) : null}

      {/* ---- Published photos — category-driven hero preview ----
          Mirrors the public /b/[slug] gallery: pick a section (Gallery,
          Team, Workspace, …) at the top, see a large cover photo with
          up to 4 thumbnails beneath, click any thumb to swap what's big,
          and page through extra photos with the left/right arrows.
          Owner controls (set-as-cover, delete, lock/moderation badges)
          stay on the thumbnails so this is still a working management
          surface, not just a read-only preview. */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <h2 className="text-base font-semibold text-[#0E0E0E]">
            Your published photos ({publishedPhotos.length})
          </h2>
          {publishedPhotos.length > 0 ? (
            <p className="text-xs text-gray-500">
              {planKey === "free"
                ? "Preview each section exactly like your public page. Photos lock for 30 days after publishing."
                : "Preview each section. Click the star on a thumbnail to set it as your cover."}
            </p>
          ) : null}
        </div>

        {publishedPhotos.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No published photos yet.{" "}
            {draftPhotos.length > 0
              ? "You have drafts above — publish them to make them live."
              : "Upload one above to show on your public profile."}
          </p>
        ) : (
          <>
            {/* Section chips — one per enabled section. Count badge shows
                how many published photos live in that section so owners
                can see at a glance which buckets are empty. */}
            {previewSectionsForChips.length > 0 ? (
              <div
                role="tablist"
                aria-label="Photo sections"
                className="mt-4 flex flex-wrap gap-2"
              >
                {previewSectionsForChips.map((s) => {
                  const count = publishedPhotos.filter(
                    (p) => p.section === s.slug
                  ).length;
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

            {/* Hero preview area */}
            <div className="mt-5 space-y-3">
              {previewPhoto ? (
                <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
                  <div className="relative block aspect-[16/9] w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={previewPhoto.id}
                      src={previewPhoto.url}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover object-center photos-hero-fade"
                      loading="eager"
                      decoding="async"
                    />

                    {/* Section label chip (matches the public page). */}
                    <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0E0E0E] shadow-sm ring-1 ring-black/5 backdrop-blur">
                      {previewSection?.title ?? "Photos"}
                    </span>

                    {/* Cover / lock / position indicators */}
                    {previewPhoto.is_cover ? (
                      <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-[#1FAF9E] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm">
                        <Star className="h-3 w-3" aria-hidden />
                        Cover
                      </span>
                    ) : null}

                    {isLocked(previewPhoto) ? (
                      <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white shadow-sm backdrop-blur">
                        <Lock className="h-3 w-3" aria-hidden />
                        Locked
                      </span>
                    ) : null}

                    {previewPhotos.length > 1 ? (
                      <span className="absolute left-3 bottom-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur">
                        {previewPhotos.findIndex((p) => p.id === previewPhoto.id) + 1} / {previewPhotos.length}
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                // Section exists but has no published photos yet — show
                // an inviting placeholder so owners understand which
                // bucket is empty and how to fill it.
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

              {/* Thumbnail strip + pagination arrows. We only render the
                  strip at all if there's something worth scrolling to —
                  a photo in this section, or the Free-plan "upload more"
                  teaser card. */}
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
                                className="h-full w-full object-cover"
                              />

                              {p.is_cover ? (
                                <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-md bg-[#1FAF9E] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white shadow-sm">
                                  <Star className="h-2.5 w-2.5" aria-hidden />
                                  Cover
                                </span>
                              ) : null}

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

                              {/* Owner controls — nested inside the div
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
                                        ? "Locked for 30 days after publishing — upgrade to change the cover now"
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
                                      ? "Locked for 30 days after publishing — upgrade to remove now"
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

                      {/* "Upload more photos" teaser — only for Free
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
            </div>

            {atPhotoLimit && canUpgrade ? (
              <p className="mt-3 text-xs text-gray-500">
                Want more than {planPhotoLimit} photos?{" "}
                <button
                  type="button"
                  onClick={() => openUpgradeFlow("upload_limit")}
                  className="font-semibold text-[#1FAF9E] underline-offset-2 hover:underline"
                >
                  Upgrade
                </button>
              </p>
            ) : null}
          </>
        )}

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
      </div>

      {/* ---------- Publish success modal (Free plan) ----------
          Fires after drafts are successfully published. Reassures the
          owner that the photos are visible immediately while making the
          moderation step transparent so rejected photos later don't feel
          sudden. */}
      {publishSuccess ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPublishSuccess(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                  aria-hidden
                >
                  <path
                    fillRule="evenodd"
                    d="M16.704 5.29a1 1 0 010 1.42l-8 8a1 1 0 01-1.42 0l-4-4a1 1 0 011.42-1.42L8 12.58l7.29-7.29a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-[#0E0E0E]">
                  Yay! Your photos are now live and visible.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  They&apos;re currently under review by the Tellacity admin
                  team for final approval.
                </p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setPublishSuccess(null)}
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedBusiness?.slug ? (
                <Link
                  href={`/b/${selectedBusiness.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setPublishSuccess(null)}
                  className="inline-flex items-center gap-1 rounded-md bg-[#1FAF9E] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#179487]"
                >
                  View them live
                  <span aria-hidden>→</span>
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
