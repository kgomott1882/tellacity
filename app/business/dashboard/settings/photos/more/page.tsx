"use client";

/**
 * /business/dashboard/settings/photos/more
 *
 * "Upload more photos" teaser system for Free-plan users who have hit
 * their 4-photo cap. This is intentionally a **browser-only staging
 * area**:
 *
 *   - Photos are held as in-memory `File` objects + `URL.createObjectURL`
 *     previews. Nothing is uploaded to Supabase Storage and no rows are
 *     written to `business_photos`. That keeps us clear of the
 *     `business_photos_plan_limit_trg` trigger (which caps Free at 4)
 *     and avoids orphan blobs/rows we'd have to clean up later.
 *   - "Publish photos" always opens an upgrade modal, that's the whole
 *     point of this surface.
 *   - "Cancel" on the upgrade modal, or the page-level Back button,
 *     opens a confirm dialog: "These photos will not be saved. Are you
 *     sure you want to cancel?" On confirm, all staged files are dropped
 *     (object URLs revoked) and we navigate back.
 *   - A `beforeunload` guard warns the user if they try to leave with
 *     staged files that haven't been cancelled or upgraded.
 *
 * Category system (session-only):
 *   - Built-in categories mirror the real `business_photo_sections`
 *     defaults so the preview feels identical to the paid experience.
 *   - Users can create their own categories (e.g. "Recent projects")
 *     via the "+ New category" control. Custom categories live only in
 *     this React state, they're discarded the same way staged photos
 *     are when the user cancels or navigates away.
 *   - Each staged photo has a section and can be reclassified at any
 *     time using the per-tile dropdown. New uploads default into the
 *     currently active category chip.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import {
  ArrowLeft,
  FolderPlus,
  ImagePlus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import { useBusinessContext } from "../../../_context/BusinessContext";
import {
  DEFAULT_STAGED_SECTION_SLUG,
  useStagedPhotos,
  type StagedPhoto,
  type StagedSectionDef,
} from "../../../_context/StagedPhotosContext";
import {
  normalizePlanCodeToKey,
  PLAN_PHOTO_LIMITS,
  type PlanKey,
} from "@/lib/plans";
import { POST_CHECKOUT_REDIRECT_SESSION_KEY } from "@/lib/upgradeFlow";
import PageLoadingOverlay from "../../../_components/PageLoadingOverlay";
import {
  GrowUnlockButton,
  GrowUnlockError,
} from "@/components/dashboard/GrowUnlockCta";
import { useGrowUnlockCta } from "@/hooks/useGrowUnlockCta";

/* ------------------------------------------------------------------------ */
/*  Category model                                                           */
/* ------------------------------------------------------------------------ */

type SectionDef = StagedSectionDef;

/**
 * Built-in section slugs/titles. Kept in sync with the real
 * `public.business_photo_sections` defaults so when the owner upgrades,
 * any muscle memory ("Team", "Services", …) transfers 1-for-1.
 *
 * Source of truth for real sections:
 *   supabase/migrations/20260723000000_business_photos_publish_and_sections.sql
 *   supabase/migrations/20260724120000_business_photos_section_fleet_logistics.sql
 */
const BUILTIN_SECTIONS: ReadonlyArray<SectionDef> = [
  { slug: "gallery", title: "Gallery", isBuiltin: true },
  { slug: "team", title: "Team", isBuiltin: true },
  { slug: "services", title: "Other", isBuiltin: true },
  { slug: "products", title: "Products", isBuiltin: true },
  { slug: "workplace", title: "Workplace", isBuiltin: true },
  { slug: "fleet-logistics", title: "Fleet & Logistics", isBuiltin: true },
];

const BACK_HREF = "/business/dashboard/settings/photos" as const;
const MORE_PATH = "/business/dashboard/settings/photos/more" as const;
const DEFAULT_SECTION_SLUG = DEFAULT_STAGED_SECTION_SLUG;

/** 4 MB hard cap per file, same ceiling used by the real upload API. */
const MAX_FILE_SIZE_BYTES = 4 * 1024 * 1024;

/** Max user-created categories in a single session. */
const MAX_CUSTOM_SECTIONS = 10;
/** Max characters a custom category title may have. */
const MAX_SECTION_TITLE_LEN = 30;

function makeId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof (crypto as Crypto).randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `sp_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

/**
 * Turn a human-readable title into a URL/DB-safe slug. Mirrors the
 * relaxed check in `20260727120000_business_photos_section_check_relax.sql`
 * (lowercase alphanum + single dashes, no leading/trailing dash) so a
 * slug created here would remain valid server-side if we ever persist it.
 */
function slugifyTitle(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/* ------------------------------------------------------------------------ */
/*  Component                                                                */
/* ------------------------------------------------------------------------ */

export default function UploadMorePhotosPage() {
  const router = useRouter();
  const { selectedBusiness, bumpNavRefresh } = useBusinessContext();
  const planKey: PlanKey = normalizePlanCodeToKey(
    selectedBusiness?.plan ?? null
  );

  // Free-plan cap is the whole reason this page exists. If the owner is
  // already on Grow/Premium/Elite, bounce them back to the real photo
  // manager where they can upload for real.
  useEffect(() => {
    if (!selectedBusiness) return;
    if (planKey !== "free") {
      router.replace(BACK_HREF);
    }
  }, [planKey, router, selectedBusiness]);

  const maxAdditional = useMemo(
    () => Math.max(0, PLAN_PHOTO_LIMITS.grow - PLAN_PHOTO_LIMITS.free),
    []
  );

  /* ---------- Staging state (dashboard-scoped, survives SPA nav) ---------- */
  // Living in context means the queue survives when the user clicks
  // "Upgrade plan" to visit checkout and later comes back via "Back".
  // Only an explicit Cancel + confirm (see `onConfirmDiscard`) clears it.
  const {
    staged,
    setStaged,
    customSections,
    setCustomSections,
    activeSection,
    setActiveSection,
    discardAll,
    setBusinessId,
  } = useStagedPhotos();

  // Bind the queue to the current business, swapping businesses wipes it
  // via the provider so we never surface queued photos against the wrong
  // workspace.
  useEffect(() => {
    setBusinessId(selectedBusiness?.id ?? null);
  }, [selectedBusiness?.id, setBusinessId]);

  const [message, setMessage] = useState<
    { type: "success" | "error" | "info"; text: string } | null
  >(null);
  const [dragActive, setDragActive] = useState(false);
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);
  const [newCategoryTitle, setNewCategoryTitle] = useState("");

  // Set to true while a confirmed cancel-and-exit is in flight. Lets us
  // bypass the beforeunload guard during programmatic navigation.
  const exitingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allSections = useMemo<SectionDef[]>(
    () => [...BUILTIN_SECTIONS, ...customSections],
    [customSections]
  );

  const sectionTitleBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const s of allSections) m.set(s.slug, s.title);
    return m;
  }, [allSections]);

  /** Per-section counts for chip badges + grouped grid headings. */
  const countsBySection = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of staged) {
      map.set(p.section, (map.get(p.section) ?? 0) + 1);
    }
    return map;
  }, [staged]);

  // Auto-dismiss inline messages.
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(() => setMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [message]);

  // Warn on tab close with unresolved staged files.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (exitingRef.current) return;
      if (staged.length === 0) return;
      e.preventDefault();
      e.returnValue =
        "These photos will not be saved. Are you sure you want to leave?";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [staged.length]);

  // Object-URL lifecycle is owned by the dashboard-wide provider, so we
  // deliberately do NOT revoke on unmount, this page can be revisited from
  // the checkout screen and the previews must still render.

  /* -------------------- category management -------------------- */

  const commitNewCategory = useCallback(() => {
    const title = newCategoryTitle.trim().slice(0, MAX_SECTION_TITLE_LEN);
    if (!title) {
      setMessage({
        type: "error",
        text: "Category name can't be empty.",
      });
      return;
    }
    const slug = slugifyTitle(title);
    if (!slug) {
      setMessage({
        type: "error",
        text: "Use letters or numbers in the category name.",
      });
      return;
    }
    if (allSections.some((s) => s.slug === slug)) {
      setMessage({
        type: "error",
        text: `A category called "${sectionTitleBySlug.get(slug) ?? title}" already exists.`,
      });
      return;
    }
    if (customSections.length >= MAX_CUSTOM_SECTIONS) {
      setMessage({
        type: "error",
        text: `You can create up to ${MAX_CUSTOM_SECTIONS} custom categories.`,
      });
      return;
    }
    const next: SectionDef = { slug, title, isBuiltin: false };
    setCustomSections((prev) => [...prev, next]);
    setActiveSection(slug);
    setNewCategoryTitle("");
    setNewCategoryOpen(false);
    setMessage({
      type: "success",
      text: `Category "${title}" created, new uploads will go here.`,
    });
  }, [
    allSections,
    customSections.length,
    newCategoryTitle,
    sectionTitleBySlug,
  ]);

  const cancelNewCategory = () => {
    setNewCategoryOpen(false);
    setNewCategoryTitle("");
  };

  const removeCustomSection = useCallback((slug: string) => {
    setCustomSections((prev) => prev.filter((s) => s.slug !== slug));
    // Any photos that were in the removed section are rehomed to Gallery
    // so we never leave orphaned photos without a valid chip.
    setStaged((prev) =>
      prev.map((p) =>
        p.section === slug ? { ...p, section: DEFAULT_SECTION_SLUG } : p
      )
    );
    setActiveSection((current) =>
      current === slug ? DEFAULT_SECTION_SLUG : current
    );
  }, []);

  const changePhotoSection = useCallback(
    (photoId: string, nextSlug: string) => {
      setStaged((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, section: nextSlug } : p))
      );
    },
    []
  );

  /* -------------------- file intake -------------------- */

  const acceptFiles = useCallback(
    (incoming: FileList | File[] | null) => {
      if (!incoming) return;
      const arr = Array.from(incoming);
      if (arr.length === 0) return;

      const room = Math.max(0, maxAdditional - staged.length);
      if (room === 0) {
        setMessage({
          type: "error",
          text: `You've reached the ${maxAdditional}-photo preview limit. Remove one to add another.`,
        });
        return;
      }

      const targetSection = allSections.some((s) => s.slug === activeSection)
        ? activeSection
        : DEFAULT_SECTION_SLUG;

      const accepted: StagedPhoto[] = [];
      const skippedType: string[] = [];
      const skippedSize: string[] = [];
      let truncated = false;

      for (const file of arr) {
        if (accepted.length >= room) {
          truncated = true;
          break;
        }
        if (!file.type.startsWith("image/")) {
          skippedType.push(file.name);
          continue;
        }
        if (file.size > MAX_FILE_SIZE_BYTES) {
          skippedSize.push(file.name);
          continue;
        }
        accepted.push({
          id: makeId(),
          file,
          previewUrl: URL.createObjectURL(file),
          name: file.name,
          sizeKb: Math.max(1, Math.round(file.size / 1024)),
          section: targetSection,
        });
      }

      if (accepted.length > 0) {
        setStaged((prev) => [...prev, ...accepted]);
      }

      const notes: string[] = [];
      if (accepted.length > 0) {
        const label = sectionTitleBySlug.get(targetSection) ?? targetSection;
        notes.push(
          `Added ${accepted.length} photo${accepted.length === 1 ? "" : "s"} to "${label}".`
        );
      }
      if (truncated) {
        notes.push(
          `Only the first ${room} fit, you can queue up to ${maxAdditional} at a time.`
        );
      }
      if (skippedType.length > 0) {
        notes.push(`Skipped non-image file(s): ${skippedType.join(", ")}.`);
      }
      if (skippedSize.length > 0) {
        notes.push(
          `Skipped over 4 MB: ${skippedSize.join(", ")} (compress first).`
        );
      }
      if (notes.length > 0) {
        setMessage({
          type:
            accepted.length > 0 && skippedType.length + skippedSize.length === 0
              ? "success"
              : "info",
          text: notes.join(" "),
        });
      }
    },
    [activeSection, allSections, maxAdditional, sectionTitleBySlug, staged.length]
  );

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    acceptFiles(e.target.files);
    e.target.value = "";
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    acceptFiles(e.dataTransfer?.files ?? null);
  };

  const removeStaged = useCallback((id: string) => {
    setStaged((prev) => {
      const target = prev.find((p) => p.id === id);
      if (target) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {
          /* noop */
        }
      }
      return prev.filter((p) => p.id !== id);
    });
  }, []);

  /* -------------------- nav / modals -------------------- */

  const onPublishClick = () => {
    if (staged.length === 0) {
      setMessage({
        type: "info",
        text: "Add photos first, then Publish to see upgrade options.",
      });
      return;
    }
    setUpgradeOpen(true);
  };

  /**
   * The modal's "Cancel" button is NOT a destructive action, it just
   * dismisses the modal so the user can keep editing or choose a different
   * plan tier. The discard path is only reached through the explicit page
   * Cancel button below (which opens `cancelConfirmOpen`).
   */
  const onUpgradeCancel = () => {
    setUpgradeOpen(false);
  };

  /**
   * Explicit Cancel on the page header. Only asks for confirmation when
   * there's queued work to protect; otherwise returns straight to the photo
   * manager without prompting. No confirmed cancel = no deletion.
   */
  const onPageCancel = () => {
    if (staged.length === 0) {
      exitingRef.current = true;
      router.push(BACK_HREF);
      return;
    }
    setCancelConfirmOpen(true);
  };

  const onConfirmDiscard = () => {
    discardAll();
    setCancelConfirmOpen(false);
    exitingRef.current = true;
    setMessage(null);
    router.push(BACK_HREF);
  };

  const onKeepEditing = () => {
    setCancelConfirmOpen(false);
  };

  /**
   * The header "Back to photos" link is a quick exit that preserves the
   * queue, we only intercept if we need confirmation for a destructive
   * operation, which this isn't. Leaving the page via Back keeps photos
   * staged in the dashboard context so the user can return any time.
   */
  const onBackClick = (_e: React.MouseEvent) => {
    // no-op: let the <Link> navigate naturally, queue survives in context
  };

  /**
   * Route the user into Paystack checkout using Next.js' SPA router. This
   * keeps the dashboard React tree mounted, including our staged queue
   * context, so "Back to plans" from the checkout screen returns here
   * with every photo, category, and active-chip exactly as the user left
   * them. Photos are only ever discarded via the explicit Cancel path.
   */
  const onUpgradeConfirm = () => {
    setUpgradeOpen(false);
    // Tell the billing / Paystack-return flow where to land if the upgrade
    // succeeds. A successful upgrade surfaces the user back in the real
    // photo manager (not here, the staging page self-redirects paid plans
    // away anyway).
    try {
      window.sessionStorage.setItem(
        POST_CHECKOUT_REDIRECT_SESSION_KEY,
        "/business/dashboard/settings/photos"
      );
    } catch {
      /* ignore */
    }
    const qs = new URLSearchParams({
      plan: "grow",
      cycle: "monthly",
      returnTo: MORE_PATH,
    });
    router.push(
      `/business/dashboard/billing/checkout?${qs.toString()}`
    );
  };

  const growUnlock = useGrowUnlockCta({
    businessId: selectedBusiness?.id,
    currentPlan: planKey,
    trialEligible: selectedBusiness?.trialEligible === true,
    subscriptionStatus: selectedBusiness?.subscriptionStatus,
    onTrialStarted: bumpNavRefresh,
    onTrialSuccess: () => setUpgradeOpen(false),
    paidDestination: {
      type: "action",
      run: onUpgradeConfirm,
    },
  });

  if (!selectedBusiness) return <PageLoadingOverlay />;
  if (planKey !== "free") return <PageLoadingOverlay />;

  const remainingSlots = Math.max(0, maxAdditional - staged.length);
  const atStagingCap = remainingSlots === 0;
  const activeTitle =
    sectionTitleBySlug.get(activeSection) ?? "Gallery";

  /* -------------------- render -------------------- */

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* ---------- Header ---------- */}
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-col gap-2">
          <Link
            href={BACK_HREF}
            onClick={onBackClick}
            className="inline-flex w-fit items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#1FAF9E]"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to photos
          </Link>
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold text-[#0E0E0E]">
              <Sparkles className="h-5 w-5 text-[#1FAF9E]" aria-hidden />
              Upload more photos
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              You&apos;ve reached the {PLAN_PHOTO_LIMITS.free}-photo limit on
              the Free plan. Queue up to{" "}
              <span className="font-semibold text-[#0E0E0E]">
                {maxAdditional}
              </span>{" "}
              additional photos here, organise them into categories like
              Team, Services, Products (or create your own). They&apos;ll go
              live once you upgrade to the Grow plan ({PLAN_PHOTO_LIMITS.grow}{" "}
              photos total).
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onPageCancel}
            className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onPublishClick}
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1FAF9E] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#179487] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={staged.length === 0}
          >
            <Upload className="h-3.5 w-3.5" aria-hidden />
            Publish photos
          </button>
        </div>
      </div>

      {/* ---------- Inline message ---------- */}
      {message ? (
        <div
          className={`rounded-md border px-3 py-2 text-sm ${
            message.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : message.type === "error"
                ? "border-rose-200 bg-rose-50 text-rose-800"
                : "border-sky-200 bg-sky-50 text-sky-800"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      {/* ---------- Category bar ---------- */}
      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0E0E0E]">
              Photo categories
            </h2>
            <p className="mt-0.5 text-xs text-gray-500">
              New uploads go into the highlighted category. Tap any photo
              tile&apos;s dropdown to move it between categories.
            </p>
          </div>
          {!newCategoryOpen ? (
            <button
              type="button"
              onClick={() => setNewCategoryOpen(true)}
              disabled={customSections.length >= MAX_CUSTOM_SECTIONS}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#1FAF9E] bg-white px-3 py-1.5 text-xs font-semibold text-[#1FAF9E] hover:bg-[#E6F7F5] disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
              title={
                customSections.length >= MAX_CUSTOM_SECTIONS
                  ? `Max ${MAX_CUSTOM_SECTIONS} custom categories`
                  : "Create a new category"
              }
            >
              <FolderPlus className="h-3.5 w-3.5" aria-hidden />
              New category
            </button>
          ) : null}
        </div>

        {newCategoryOpen ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="text"
              autoFocus
              value={newCategoryTitle}
              onChange={(e) =>
                setNewCategoryTitle(
                  e.target.value.slice(0, MAX_SECTION_TITLE_LEN)
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitNewCategory();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancelNewCategory();
                }
              }}
              placeholder="e.g. Recent projects"
              className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
              maxLength={MAX_SECTION_TITLE_LEN}
            />
            <button
              type="button"
              onClick={commitNewCategory}
              className="inline-flex items-center rounded-md bg-[#1FAF9E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#179487]"
            >
              Add
            </button>
            <button
              type="button"
              onClick={cancelNewCategory}
              className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <span className="text-[11px] text-gray-400">
              {newCategoryTitle.length}/{MAX_SECTION_TITLE_LEN}
            </span>
          </div>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {allSections.map((s) => {
            const active = s.slug === activeSection;
            const count = countsBySection.get(s.slug) ?? 0;
            return (
              <div
                key={s.slug}
                className={`group inline-flex items-stretch overflow-hidden rounded-full border text-xs ${
                  active
                    ? "border-[#1FAF9E] bg-[#E6F7F5] text-[#0E0E0E]"
                    : "border-gray-200 bg-white text-gray-700 hover:border-[#1FAF9E]/50"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveSection(s.slug)}
                  className="flex items-center gap-1.5 px-3 py-1 font-medium"
                  title={
                    active
                      ? `New uploads go into ${s.title}`
                      : `Select ${s.title} for new uploads`
                  }
                >
                  <span>{s.title}</span>
                  <span
                    className={`inline-flex min-w-[18px] items-center justify-center rounded-full px-1.5 text-[10px] font-semibold ${
                      active
                        ? "bg-[#1FAF9E] text-white"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {count}
                  </span>
                  {!s.isBuiltin ? (
                    <span
                      className={`ml-1 rounded px-1 text-[9px] font-semibold uppercase tracking-wide ${
                        active
                          ? "bg-white/70 text-[#1FAF9E]"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      Custom
                    </span>
                  ) : null}
                </button>
                {!s.isBuiltin ? (
                  <button
                    type="button"
                    onClick={() => removeCustomSection(s.slug)}
                    className="border-l border-current/20 px-2 text-gray-400 hover:bg-rose-50 hover:text-rose-600"
                    aria-label={`Delete category ${s.title}`}
                    title="Delete this custom category"
                  >
                    ×
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {/* ---------- Counter strip ---------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-[#FAFAFA] px-4 py-3">
        <div className="text-sm text-gray-700">
          <span className="font-semibold text-[#0E0E0E]">
            {staged.length} / {maxAdditional}
          </span>{" "}
          queued &middot;{" "}
          {atStagingCap ? (
            <span className="text-amber-700">Queue full</span>
          ) : (
            <span className="text-gray-500">
              {remainingSlots} slot{remainingSlots === 1 ? "" : "s"} left
            </span>
          )}
          <span className="ml-2 text-xs text-gray-500">
           , new uploads go to{" "}
            <span className="font-semibold text-[#0E0E0E]">{activeTitle}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={atStagingCap}
          className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-[#0E0E0E] hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <ImagePlus className="h-3.5 w-3.5" aria-hidden />
          Add photos
        </button>
      </div>

      {/* ---------- Drop zone ---------- */}
      <div
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        className={`rounded-xl border-2 px-4 py-10 text-center transition ${
          dragActive
            ? "border-dashed border-[#1FAF9E] bg-[#E6F7F5]"
            : atStagingCap
              ? // When the queue is full we drop the dashed look and give
                // the zone a soft teal fill so it reads like a success
                // card framing the CTA, not a disabled drop target.
                "border-solid border-[#1FAF9E]/40 bg-[#E6F7F5]/60"
              : "border-dashed border-gray-300 bg-white hover:border-[#1FAF9E]/60 hover:bg-[#F3FBFA]"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={onFileInputChange}
        />
        {atStagingCap ? (
          // Queue is at capacity, the drop-zone copy ("JPG / PNG / WebP…",
          // "Select photos") is no longer actionable. Replace it with the
          // single relevant next step: publish the full queue, which
          // funnels straight into the Grow-plan upgrade modal.
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1FAF9E]/10 text-[#1FAF9E]">
              <Sparkles className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-base font-semibold text-[#0E0E0E]">
              Your {maxAdditional}-photo preview is ready.
            </p>
            <p className="max-w-sm text-xs text-gray-600">
              Remove a photo above to swap it, or publish now, we&apos;ll
              walk you through upgrading to the Grow plan so every photo
              goes live under its category.
            </p>
            <button
              type="button"
              onClick={onPublishClick}
              className="mt-1 inline-flex items-center gap-1.5 rounded-md bg-[#1FAF9E] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#179487] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
            >
              <Upload className="h-4 w-4" aria-hidden />
              Publish photos
              <span aria-hidden>→</span>
            </button>
          </div>
        ) : (
          <div className="mx-auto flex max-w-md flex-col items-center gap-2">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1FAF9E]/10 text-[#1FAF9E]">
              <ImagePlus className="h-6 w-6" aria-hidden />
            </span>
            <p className="text-sm font-semibold text-[#0E0E0E]">
              Drag photos here, they&apos;ll be added to {activeTitle}.
            </p>
            <p className="text-xs text-gray-500">
              JPG / PNG / WebP &middot; up to 4 MB each &middot; up to{" "}
              {maxAdditional} photos
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-[#0E0E0E] px-3 py-1.5 text-xs font-semibold text-white hover:bg-black"
            >
              Select photos
            </button>
          </div>
        )}
      </div>

      {/* ---------- Staged grid, grouped by category ---------- */}
      {staged.length > 0 ? (
        <div className="flex flex-col gap-6">
          {allSections
            .filter((s) => (countsBySection.get(s.slug) ?? 0) > 0)
            .map((section) => {
              const photos = staged.filter((p) => p.section === section.slug);
              if (photos.length === 0) return null;
              return (
                <div key={section.slug}>
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-[#0E0E0E]">
                      {section.title}{" "}
                      <span className="text-gray-500">({photos.length})</span>
                    </h2>
                    {section.slug === activeSection ? (
                      <span className="inline-flex items-center rounded-full bg-[#1FAF9E]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#1FAF9E]">
                        Active upload target
                      </span>
                    ) : null}
                  </div>
                  <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                    {photos.map((p) => (
                      <li
                        key={p.id}
                        className="relative overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
                      >
                        <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={p.previewUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeStaged(p.id)}
                          className="absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white"
                          title="Remove from queue"
                          aria-label={`Remove ${p.name}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div className="border-t border-gray-100 bg-white px-2 py-1.5">
                          <div className="truncate text-[11px] font-medium text-[#0E0E0E]">
                            {p.name}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {p.sizeKb >= 1024
                              ? `${(p.sizeKb / 1024).toFixed(1)} MB`
                              : `${p.sizeKb} KB`}
                          </div>
                          <label className="sr-only" htmlFor={`section-${p.id}`}>
                            Category for {p.name}
                          </label>
                          <select
                            id={`section-${p.id}`}
                            value={p.section}
                            onChange={(e) =>
                              changePhotoSection(p.id, e.target.value)
                            }
                            className="mt-1 w-full rounded border border-gray-200 bg-white px-1.5 py-1 text-[11px] text-gray-700 focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]/30"
                          >
                            {allSections.map((s) => (
                              <option key={s.slug} value={s.slug}>
                                {s.title}
                                {s.isBuiltin ? "" : " (custom)"}
                              </option>
                            ))}
                          </select>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
        </div>
      ) : null}

      {/* ---------- Upgrade modal ---------- */}
      {upgradeOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-4"
          onClick={onUpgradeCancel}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[#1FAF9E]/10 text-[#1FAF9E]">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-[#0E0E0E]">
                  Upgrade to publish these photos.
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  You&apos;ve reached your free photo limit. Move to the Grow
                  plan to publish these {staged.length} queued photo
                  {staged.length === 1 ? "" : "s"}, your categories and
                  assignments come along, and unlock up to{" "}
                  {PLAN_PHOTO_LIMITS.grow} photos total.
                </p>
              </div>
            </div>
            <GrowUnlockError message={growUnlock.errorMessage} className="mt-4" />
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onUpgradeCancel}
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <GrowUnlockButton
                {...growUnlock}
                className="inline-flex items-center gap-1 rounded-md bg-[#1FAF9E] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#179487]"
              />
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- Cancel / discard confirmation ---------- */}
      {cancelConfirmOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/55 p-4"
          onClick={onKeepEditing}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-[#0E0E0E]">
              These photos will not be saved.
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Are you sure you want to cancel? All{" "}
              <span className="font-semibold">{staged.length}</span> queued
              photo{staged.length === 1 ? "" : "s"} and any custom categories
              you created will be discarded.
            </p>
            <div className="mt-5 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onKeepEditing}
                className="inline-flex items-center rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Keep editing
              </button>
              <button
                type="button"
                onClick={onConfirmDiscard}
                className="inline-flex items-center rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700"
              >
                Yes, discard
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
