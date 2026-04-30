"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ImageIcon, X } from "lucide-react";
import { CAROUSEL_NAV_BUTTON_CLASS } from "@/lib/carouselNavButton";
import { CarouselNavChevron } from "@/components/ui/CarouselNavChevron";
import {
  getBusinessPhotoSectionsOrdered,
  groupBusinessPhotosWithConfig,
  type BusinessPhotoPublic,
  type BusinessPhotoSectionConfig,
} from "@/lib/businessPhotosDisplay";
import { formatProductPrice } from "@/lib/productCurrency";
import type { PlanKey } from "@/lib/plans";
import {
  buildBusinessSignupClaimPrefillUrl,
  type BusinessSignupClaimPrefill,
} from "@/lib/businessSignupClaimPrefill";

type Props = {
  photos: BusinessPhotoPublic[];
  /** Per-business section config. When absent, falls back to the built-ins. */
  sections?: BusinessPhotoSectionConfig[];
  /**
   * When set on an unclaimed profile, "Claim this profile" links to business
   * signup with name, website, and business id pre-filled.
   */
  claimSignupPrefill?: BusinessSignupClaimPrefill | null;
  /**
   * Whether the business has a registered owner. When false, the empty state
   * shows the "Claim this profile" teaser; when true, it shows a clean
   * neutral cover area with a simple honest message and no stock imagery.
   */
  isClaimed?: boolean;
  /**
   * Active billing plan for the business. Free and unclaimed profiles get a
   * grid of empty category placeholder cards below the hero so the page
   * still feels complete and subtly nudges owners to upload / claim.
   * Paid plans (grow / premium / elite) skip the placeholders to avoid
   * upselling customers who are already paying.
   */
  planKey?: PlanKey;
};

/** Neutral business imagery for empty-state teaser (local asset, no external fetch). */
const EMPTY_PHOTOS_TEASER_SRC = "/brand/Business Profile.png" as const;

/** Number of thumbnails visible in the hero gallery strip at once. */
const HERO_VISIBLE_THUMBS = 4;

/** Public photo + the human-readable title of the section it belongs to. */
type HeroPhoto = BusinessPhotoPublic & { sectionTitle: string };

type SectionBucket = { key: string; title: string; photos: BusinessPhotoPublic[] };

function bucketAllPhotosBySection(
  photos: BusinessPhotoPublic[],
  sectionsConfig: BusinessPhotoSectionConfig[] | undefined
): SectionBucket[] {
  if (sectionsConfig && sectionsConfig.length > 0) {
    return groupBusinessPhotosWithConfig(photos, sectionsConfig, { keepEmpty: true }).map((s) => ({
      key: s.key,
      title: s.title,
      photos: s.photos,
    }));
  }
  return getBusinessPhotoSectionsOrdered(photos).map((s) => ({
    key: s.key,
    title: s.title,
    photos: s.photos,
  }));
}

function defaultSectionTabKey(tabs: SectionBucket[], photos: BusinessPhotoPublic[]): string {
  if (tabs.length === 0) return "";
  const cover = photos.find((p) => p.is_cover === true);
  if (cover) {
    const raw = String(cover.section ?? "").trim().toLowerCase();
    if (tabs.some((t) => t.key === raw)) return raw;
  }
  return tabs[0]?.key ?? "";
}

function pickInitialPhotoIdInSection(sectionPhotos: BusinessPhotoPublic[]): string {
  const cover = sectionPhotos.find((p) => p.is_cover === true);
  return (cover ?? sectionPhotos[0])?.id ?? "";
}

type HeroPhotoGalleryProps = {
  photos: HeroPhoto[];
  selectedId: string;
  onSelect: (id: string) => void;
  onOpenLightbox: (url: string) => void;
};

/**
 * Hero gallery used at the top of a public business profile:
 *   [ big main preview ]
 *   [ ◀  thumb thumb thumb thumb  ▶ ]
 *
 * Clicking a thumbnail swaps the main preview with a smooth cross-fade.
 * When the business has more than {@link HERO_VISIBLE_THUMBS} photos the
 * strip becomes a horizontally-sliding carousel driven by the chevron
 * buttons. The preview itself is clickable → opens the existing lightbox.
 */
function HeroPhotoGallery({
  photos,
  selectedId,
  onSelect,
  onOpenLightbox,
}: HeroPhotoGalleryProps) {
  const totalCount = photos.length;
  const selectedIndex = useMemo(() => {
    const idx = photos.findIndex((p) => p.id === selectedId);
    return idx >= 0 ? idx : 0;
  }, [photos, selectedId]);

  const selectedPhoto = photos[selectedIndex] ?? photos[0];

  const maxStart = Math.max(0, totalCount - HERO_VISIBLE_THUMBS);
  const [thumbStart, setThumbStart] = useState<number>(0);

  // Keep the active thumb on-screen when the selection moves (e.g. via a
  // section-grid click) without jerking the window if it's already visible.
  useEffect(() => {
    setThumbStart((prev) => {
      if (selectedIndex < prev) return selectedIndex;
      if (selectedIndex > prev + HERO_VISIBLE_THUMBS - 1) {
        return Math.min(
          maxStart,
          selectedIndex - HERO_VISIBLE_THUMBS + 1
        );
      }
      return Math.min(prev, maxStart);
    });
  }, [selectedIndex, maxStart]);

  const showArrows = totalCount > HERO_VISIBLE_THUMBS;
  const canSlidePrev = showArrows && thumbStart > 0;
  const canSlideNext = showArrows && thumbStart < maxStart;

  const slidePrev = useCallback(() => {
    setThumbStart((prev) => Math.max(0, prev - 1));
  }, []);
  const slideNext = useCallback(() => {
    setThumbStart((prev) => Math.min(maxStart, prev + 1));
  }, [maxStart]);

  if (!selectedPhoto) return null;

  // Offset the whole strip horizontally based on thumbStart so we get a
  // smooth slide, and mask anything that overflows the window.
  const translatePct = (100 / HERO_VISIBLE_THUMBS) * thumbStart;

  const categoryLabel = selectedPhoto.sectionTitle?.trim() || "Photos";
  const isCoverShot = selectedPhoto.is_cover === true;
  const isFitMode = selectedPhoto.preview_frame === "portrait";
  const isProductPhoto = selectedPhoto.section === "products";
  const productName = selectedPhoto.product_name?.trim() ?? "";
  const productCode = selectedPhoto.product_description?.trim() ?? "";
  const productPrice = selectedPhoto.product_price ?? null;
  const productCurrency = selectedPhoto.product_currency ?? "USD";
  const priceLabel = formatProductPrice(productPrice, productCurrency);
  const hasProductMeta =
    isProductPhoto && (productName || productCode || priceLabel != null);

  return (
    <div className="w-full">
      <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-sm">
        <button
          type="button"
          onClick={() => onOpenLightbox(selectedPhoto.url)}
          aria-label={isCoverShot ? "Open cover photo" : "Open business photo"}
          className="relative block aspect-[16/9] w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#1FAF9E]/40"
        >
          {/* Cross-fading main preview. The `key` forces React to remount
              the <img>, which lets the `animate-hero-fade` CSS play from
              opacity:0 → 1 on every change. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={selectedPhoto.id}
            src={selectedPhoto.url}
            alt={isCoverShot ? "Cover photo" : "Business photo"}
            className={`absolute inset-0 h-full w-full object-center ${
              isFitMode ? "object-contain bg-gray-100" : "object-cover"
            }`}
            loading="eager"
            decoding="async"
            style={{
              animation: "heroFade 260ms ease-out both",
            }}
          />
        </button>

        {/* Category chip — top-right — reflects the current photo's section. */}
        <span
          className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0E0E0E] shadow-sm ring-1 ring-black/5 backdrop-blur"
          aria-live="polite"
        >
          {categoryLabel}
        </span>

        {totalCount > 1 ? (
          <span
            className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur"
            aria-hidden
          >
            {selectedIndex + 1} / {totalCount}
          </span>
        ) : null}
      </div>

      {totalCount > 0 ? (
        <div className="mt-3 flex items-center gap-2">
          {showArrows ? (
            <button
              type="button"
              onClick={slidePrev}
              disabled={!canSlidePrev}
              aria-label="Previous thumbnails"
              className={CAROUSEL_NAV_BUTTON_CLASS}
            >
              <CarouselNavChevron dir="left" />
            </button>
          ) : null}

          <div
            className="relative flex-1 overflow-hidden"
            role="tablist"
            aria-label="Business photo thumbnails"
          >
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{ transform: `translateX(-${translatePct}%)` }}
            >
              {photos.map((p, idx) => {
                const isActive = p.id === selectedPhoto.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Show photo ${idx + 1}`}
                    onClick={() => onSelect(p.id)}
                    className="group px-1.5 focus-visible:outline-none"
                    style={{ flex: `0 0 ${100 / HERO_VISIBLE_THUMBS}%` }}
                  >
                    <div
                      className={`relative aspect-[4/3] overflow-hidden rounded-xl border transition-all duration-200 ${
                        isActive
                          ? "border-[#1FAF9E] ring-2 ring-[#1FAF9E]/40 shadow-md"
                          : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.url}
                        alt=""
                        loading="lazy"
                        className={`h-full w-full object-center transition-transform duration-300 ${
                          p.preview_frame === "portrait"
                            ? "object-contain bg-gray-100"
                            : "object-cover"
                        } ${
                          isActive
                            ? "scale-100"
                            : "scale-[1.02] group-hover:scale-105"
                        }`}
                      />
                      {!isActive ? (
                        <div className="absolute inset-0 bg-black/5 transition-opacity duration-200 group-hover:opacity-0" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {showArrows ? (
            <button
              type="button"
              onClick={slideNext}
              disabled={!canSlideNext}
              aria-label="More thumbnails"
              className={CAROUSEL_NAV_BUTTON_CLASS}
            >
              <CarouselNavChevron dir="right" />
            </button>
          ) : null}
        </div>
      ) : null}

      {hasProductMeta ? (
        <div className="mt-3 rounded-xl border border-gray-200 bg-white p-3">
          {productName ? (
            <h3 className="text-sm font-semibold text-gray-900">{productName}</h3>
          ) : null}
          {productCode ? (
            <p className="mt-1 text-sm text-gray-600">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Product code{" "}
              </span>
              <span className="font-mono text-gray-800">{productCode}</span>
            </p>
          ) : null}
          {priceLabel ? (
            <p className="mt-2 text-sm font-semibold text-[#124541]">{priceLabel}</p>
          ) : null}
        </div>
      ) : null}

      {/* Keyframes for the preview cross-fade. Scoped via inline <style> so
          we don't need a tailwind config change. */}
      <style jsx>{`
        @keyframes heroFade {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Per-section crop of the shared blurred business photo. We reuse the
 * same `EMPTY_PHOTOS_TEASER_SRC` asset the "unclaimed + no photos" hero
 * uses — so every empty card looks like a blurred version of that
 * preview — but each section picks a different `object-position` crop.
 * After the heavy blur, visitors read the grid as 6 distinct blurred
 * photos rather than the same tile copy-pasted. Unknown section slugs
 * (e.g. custom sections) fall back to centered.
 */
const SECTION_IMAGE_POSITIONS: Record<string, string> = {
  products: "50% 15%",
  services: "25% 75%",
  gallery: "50% 50%",
};

function objectPositionForSection(key: string): string {
  const normalized = (key || "").trim().toLowerCase();
  return SECTION_IMAGE_POSITIONS[normalized] ?? "50% 50%";
}

/** A single empty photo-category slot rendered on Free / unclaimed profiles. */
function EmptyCategoryCard({
  title,
  sectionKey,
}: {
  title: string;
  /** Built-in section slug (products / services / gallery) or any custom slug. Drives which crop of
   *  the shared blurred teaser image is shown so cards don't look
   *  identical. */
  sectionKey: string;
}) {
  const message = "This business has not yet uploaded photos.";
  const objectPosition = objectPositionForSection(sectionKey);

  return (
    <div
      className="group relative flex aspect-[4/3] w-full flex-col items-center justify-center overflow-hidden rounded-xl border border-gray-200/80 bg-gray-100 p-4 text-center shadow-sm transition-colors hover:border-gray-300"
      role="img"
      aria-label={`${title} — ${message}`}
    >
      {/* Heavily blurred real photo — matches the "Business photos" hero
          shown on unclaimed / empty profiles. Each section picks a
          different crop so the grid reads as several different blurred
          photos, not copies of the same tile. A soft dark gradient adds
          depth and improves legibility of the glass chip overlay. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={EMPTY_PHOTOS_TEASER_SRC}
          alt=""
          className="h-full w-full scale-110 object-cover blur-md sm:blur-lg"
          style={{ objectPosition }}
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/15 via-gray-900/5 to-gray-900/25" />
      </div>

      {/* Glass chip — mirrors the centered card used by the empty-state
          hero, just sized down for the mini tile. `backdrop-blur` lets
          the blurred photo read through without hurting legibility. */}
      <div className="relative z-[1] flex flex-col items-center gap-1.5 rounded-lg border border-white/80 bg-white/90 px-3 py-2.5 shadow-sm backdrop-blur-[2px]">
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-1 ring-black/5">
          <ImageIcon size={14} aria-hidden />
        </span>
        <p className="text-[13px] font-semibold leading-tight text-[#0E0E0E]">{title}</p>
        <p className="max-w-[22ch] text-[10.5px] leading-snug text-gray-600">
          {message}
        </p>
      </div>
    </div>
  );
}

type EmptyCategoryGridProps = {
  sections: { key: string; title: string; photos: BusinessPhotoPublic[] }[];
  isClaimed: boolean;
  /** When true, the hero also has real photos above this grid, so the intro
   *  copy frames the grid as "more categories to come". When false (no photos
   *  at all) we keep the intro quiet since the hero teaser already handles
   *  the primary message. */
  hasPhotosAbove: boolean;
  /**
   * When true, every configured section is rendered as an empty placeholder
   * card — even sections that already have photos uploaded. Used for Free
   * plan businesses so a "visual gap" of empty slots is always visible on
   * the public profile, nudging owners to upgrade past the free photo
   * limit. When false (default) only sections without photos are shown.
   */
  forceAllEmpty?: boolean;
};

function EmptyCategoryGrid({
  sections,
  isClaimed,
  hasPhotosAbove,
  forceAllEmpty = false,
}: EmptyCategoryGridProps) {
  const emptySections = useMemo(
    // Even in Free-plan "force" mode, keep this grid to genuinely empty
    // sections so categories that already have photos (e.g. Gallery) don't
    // render as fake-empty placeholders.
    () => sections.filter((s) => s.photos.length === 0),
    [sections, forceAllEmpty]
  );

  if (emptySections.length === 0) return null;

  // Intro copy. When we're deliberately rendering every slot as empty
  // (Free plan "visual gap" mode) and there are real photos above, the
  // default "upload photos to fill them in" reads as misleading — the
  // owner HAS uploaded, they've just hit the free-plan limit. Frame the
  // grid as an upgrade prompt instead.
  const introCopy = forceAllEmpty && hasPhotosAbove && isClaimed
    ? "Free plan businesses can only upload a limited number of photos. Upgrade to add photos to more sections."
    : isClaimed
      ? "These sections are ready — upload photos to fill them in."
      : "These sections appear once this business uploads photos.";

  const introHeading = forceAllEmpty && hasPhotosAbove && isClaimed
    ? "More photo sections"
    : "More photo categories";

  // Layout rules:
  // - When a business already has photos above (hero is visible), show the
  //   remaining empty categories as 2-up cards so there is no "missing third"
  //   gap on wide screens.
  // - When there are no uploaded photos yet, show all categories equally in
  //   a 3-up row on >= sm screens.
  const useTwoUpLayout = hasPhotosAbove && emptySections.length <= 2;
  const gridClass = useTwoUpLayout
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4"
    : "grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4";
  const widthClass = useTwoUpLayout ? "max-w-5xl" : "max-w-6xl";

  return (
    <section aria-label="More photo categories" className="space-y-4">
      {hasPhotosAbove ? (
        <div>
          <h3 className="text-sm font-semibold text-[#0E0E0E]">
            {introHeading}
          </h3>
          <p className="mt-1 text-xs text-gray-500">{introCopy}</p>
        </div>
      ) : null}

      <div className={`mx-auto w-full ${widthClass} ${gridClass}`}>
        {emptySections.map((s) => (
          <EmptyCategoryCard key={s.key} title={s.title} sectionKey={s.key} />
        ))}
      </div>
    </section>
  );
}

export default function BusinessProfilePhotos({
  photos,
  sections: sectionsConfig,
  claimSignupPrefill = null,
  isClaimed = false,
  planKey = "free",
}: Props) {
  const isCompletelyEmpty = photos.length === 0;

  const groupedFull = useMemo(
    () => (isCompletelyEmpty ? [] : bucketAllPhotosBySection(photos, sectionsConfig)),
    [isCompletelyEmpty, photos, sectionsConfig]
  );

  /** Sections with at least one published photo — only these appear in the profile tab strip. */
  const publishedSectionTabs = useMemo(
    () => groupedFull.filter((s) => s.photos.length > 0),
    [groupedFull]
  );

  const defaultTabKey = useMemo(
    () => defaultSectionTabKey(publishedSectionTabs, photos),
    [publishedSectionTabs, photos]
  );

  const [activeSectionKeyUser, setActiveSectionKeyUser] = useState<string | null>(null);

  const activeSectionKey =
    activeSectionKeyUser &&
    publishedSectionTabs.some((t) => t.key === activeSectionKeyUser)
      ? activeSectionKeyUser
      : defaultTabKey;

  useEffect(() => {
    if (
      activeSectionKeyUser &&
      !publishedSectionTabs.some((t) => t.key === activeSectionKeyUser)
    ) {
      setActiveSectionKeyUser(null);
    }
  }, [publishedSectionTabs, activeSectionKeyUser]);

  // Same section list but built from the ORIGINAL photos (banner included).
  // Used to decide which categories are truly empty for the placeholder
  // grid — otherwise a section whose only photo was promoted to the banner
  // would show up as an empty slot, which is misleading.
  //
  // Free plan note: custom per-business sections are intentionally ignored
  // for Free profiles — the public page always renders the built-in
  // categories (Products / Services / Gallery). That keeps the visual
  // structure consistent across
  // every Free business and signals that full section customization is a
  // paid-plan feature. Paid plans keep their custom section config.
  const sectionsForEmptyGrid = useMemo(() => {
    if (planKey === "free") {
      return getBusinessPhotoSectionsOrdered(photos).map((s) => ({
        key: s.key,
        title: s.title,
        photos: s.photos,
      }));
    }
    if (sectionsConfig && sectionsConfig.length > 0) {
      return groupBusinessPhotosWithConfig(photos, sectionsConfig, {
        keepEmpty: true,
      }).map((s) => ({
        key: s.key,
        title: s.title,
        photos: s.photos,
      }));
    }
    return getBusinessPhotoSectionsOrdered(photos).map((s) => ({
      key: s.key,
      title: s.title,
      photos: s.photos,
    }));
  }, [photos, sectionsConfig, planKey]);

  const activeSectionBucket = useMemo(
    () => publishedSectionTabs.find((s) => s.key === activeSectionKey),
    [publishedSectionTabs, activeSectionKey]
  );

  /** Hero strip shows only photos from the selected category tab. */
  const heroPhotosForActiveTab = useMemo<HeroPhoto[]>(() => {
    if (!activeSectionBucket) return [];
    const title = activeSectionBucket.title.trim() || activeSectionBucket.key || "Photos";
    return activeSectionBucket.photos.map((p) => ({ ...p, sectionTitle: title }));
  }, [activeSectionBucket]);

  const [selectedId, setSelectedId] = useState<string>("");

  // Keep the selected thumbnail in sync with the active tab and upstream data.
  useEffect(() => {
    if (heroPhotosForActiveTab.length === 0) {
      setSelectedId("");
      return;
    }
    setSelectedId((prev) =>
      heroPhotosForActiveTab.some((p) => p.id === prev)
        ? prev
        : pickInitialPhotoIdInSection(heroPhotosForActiveTab)
    );
  }, [heroPhotosForActiveTab]);

  const onSelectSectionTab = useCallback(
    (key: string) => {
      const bucket = publishedSectionTabs.find((t) => t.key === key);
      if (!bucket) return;
      setActiveSectionKeyUser(key);
      setSelectedId(pickInitialPhotoIdInSection(bucket.photos));
    },
    [publishedSectionTabs]
  );

  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  // ESC to close + lock body scroll while the lightbox is open.
  useEffect(() => {
    if (!lightboxSrc) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxSrc(null);
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [lightboxSrc]);

  return (
    <div className="space-y-10 overflow-x-clip">
      {isCompletelyEmpty ? (
        isClaimed ? (
          // Claimed business with no photos: soft, defocused-photo placeholder
          // built entirely from CSS gradients (no stock imagery). Feels like a
          // real photo area that's just out of focus, with an honest centered
          // message that no photos have been uploaded yet.
          <div className="relative mx-auto aspect-[14.6/10] w-full max-w-[min(100%,14.6in)] overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-slate-100 via-white to-slate-100 shadow-sm">
            {/* Defocused "photo" — soft colored blobs, all heavily blurred.
                Kept in a neutral teal-on-warm palette to feel photographic
                without mimicking any specific subject. */}
            <div className="absolute inset-0 overflow-hidden" aria-hidden>
              <div className="absolute -left-[10%] -top-[20%] h-[70%] w-[60%] rounded-full bg-gradient-to-br from-[#1FAF9E]/20 via-[#5FD0C2]/15 to-transparent blur-3xl" />
              <div className="absolute -right-[15%] top-[15%] h-[70%] w-[55%] rounded-full bg-gradient-to-bl from-amber-100/60 via-orange-100/40 to-transparent blur-3xl" />
              <div className="absolute bottom-[-20%] left-[20%] h-[70%] w-[60%] rounded-full bg-gradient-to-tr from-slate-300/50 via-slate-200/30 to-transparent blur-3xl" />
              <div className="absolute right-[5%] bottom-[5%] h-[45%] w-[45%] rounded-full bg-gradient-to-tl from-[#124541]/10 via-slate-200/30 to-transparent blur-2xl" />
              {/* Soft grain / wash to knit the blobs together and keep a
                  uniform film-grain feel across the whole plate. */}
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(255,255,255,0.35)_100%)]" />
            </div>

            {/* Centered overlay message. */}
            <div className="relative z-[2] flex h-full w-full items-center justify-center p-6">
              <div className="rounded-xl bg-white/70 px-5 py-4 text-center shadow-sm ring-1 ring-white/60 backdrop-blur-md sm:px-6 sm:py-5">
                <h2 className="text-base font-semibold text-[#0E0E0E] sm:text-lg">
                  Business photos
                </h2>
                <p className="mt-1.5 text-sm text-gray-600">
                  This business hasn&apos;t uploaded photos yet.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Unclaimed business: marketing teaser with the Claim CTA.
          <>
            <div className="relative mx-auto aspect-[14.6/10] w-full max-w-[min(100%,14.6in)] overflow-hidden rounded-xl border border-gray-200/80 shadow-sm">
              <div className="absolute inset-0 h-full w-full" aria-hidden>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={EMPTY_PHOTOS_TEASER_SRC}
                  alt=""
                  className="h-full w-full scale-105 object-cover blur-md sm:blur-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 via-gray-900/15 to-gray-900/30" />
              </div>
              <div className="relative z-[2] flex h-full w-full items-center justify-center p-4 sm:p-6">
                <div className="w-full max-w-md rounded-xl border border-white/80 bg-white/95 p-5 text-center shadow-md backdrop-blur-[2px] sm:p-6">
                  <h2 className="text-base font-semibold text-[#0E0E0E] sm:text-lg">Business photos</h2>
                  <p className="mt-2 text-sm text-gray-700">
                    This business hasn&apos;t added photos yet.
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-500">
                    Photos help customers get a better feel for a business.
                  </p>
                  <div className="mt-4 flex justify-center">
                    <Link
                      href={
                        claimSignupPrefill
                          ? buildBusinessSignupClaimPrefillUrl(claimSignupPrefill)
                          : "/business/signup"
                      }
                      className="inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#169786] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                    >
                      Claim this profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-sm text-gray-400 sm:mt-4">
              Products • Services • Gallery
            </p>
          </>
        )
      ) : heroPhotosForActiveTab.length > 0 ? (
        <div className="space-y-4">
          {publishedSectionTabs.length > 0 ? (
            <div
              role="tablist"
              aria-label="Photo categories"
              className="flex flex-wrap gap-2 border-b border-gray-100 pb-3"
            >
              {publishedSectionTabs.map((tab) => {
                const selected = tab.key === activeSectionKey;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    id={`profile-photo-tab-${tab.key}`}
                    onClick={() => onSelectSectionTab(tab.key)}
                    className={`inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/35 ${
                      selected
                        ? "bg-[#0E0E0E] text-white shadow-sm"
                        : "bg-gray-100 text-gray-700 ring-1 ring-gray-200/80 hover:bg-gray-50"
                    }`}
                  >
                    <span>{tab.title}</span>
                    <span
                      className={`tabular-nums text-xs font-semibold ${
                        selected ? "text-white/80" : "text-gray-500"
                      }`}
                    >
                      {tab.photos.length}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : null}
          <div role="tabpanel" aria-labelledby={`profile-photo-tab-${activeSectionKey}`}>
            <HeroPhotoGallery
              photos={heroPhotosForActiveTab}
              selectedId={selectedId || heroPhotosForActiveTab[0].id}
              onSelect={setSelectedId}
              onOpenLightbox={setLightboxSrc}
            />
          </div>
        </div>
      ) : null}

      {/* Empty-category placeholders — rendered for Free plans or unclaimed
          profiles. They turn missing content into a soft conversion prompt:
          Products / Services / Gallery
          each appear as a clean empty photo slot, so the page feels complete
          and subtly encourages uploads (or claiming, when the business has no
          owner yet).

          For Free plans we pass `forceAllEmpty` so every section renders as
          an empty card — even sections the business has already uploaded
          photos to within the free-plan limit. That creates a visible "gap"
          below the hero gallery that signals "more photos can be added
          beyond the free limit" and nudges the owner to upgrade. Paid plans
          (grow / premium / elite) keep the default behavior: only sections
          that are genuinely empty appear as placeholders. */}
      {planKey === "free" || !isClaimed ? (
        <EmptyCategoryGrid
          sections={sectionsForEmptyGrid}
          isClaimed={isClaimed}
          hasPhotosAbove={!isCompletelyEmpty}
          forceAllEmpty={planKey === "free"}
        />
      ) : null}

      {lightboxSrc ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo preview"
          onClick={() => setLightboxSrc(null)}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
        >
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxSrc(null);
            }}
            aria-label="Close preview"
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
          >
            <X size={20} aria-hidden />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[90vh] max-w-[92vw] items-center justify-center overflow-hidden rounded-xl bg-black/30 shadow-2xl ring-1 ring-white/10"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={lightboxSrc}
              alt=""
              className="block max-h-[90vh] max-w-[92vw] object-contain"
              loading="eager"
              decoding="async"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
