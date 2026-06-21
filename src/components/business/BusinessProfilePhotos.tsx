"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Pause, Play, X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { canAccessBusiness } from "@/lib/canAccessBusinessShared";
import {
  normalizeBusinessPhotoSection,
  type BusinessPhotoPublic,
} from "@/lib/businessPhotosDisplay";
import {
  buildBusinessSignupClaimPrefillUrl,
  type BusinessSignupClaimPrefill,
} from "@/lib/businessSignupClaimPrefill";
import { REVIEWS_PUBLIC_STATUS_AND_VISIBILITY_OR } from "@/lib/reviewVisibility";
import { CAROUSEL_NAV_BUTTON_CLASS } from "@/lib/carouselNavButton";
import RatingStars from "@/components/RatingStars";

const MAX_GRID_PHOTOS = 8;
/** Matches dashboard Gallery editor: visible thumb slots before paging. */
const HERO_VISIBLE_THUMBS = 4;

/** Public profile empty state: “Preview example” modals (`public/brand`, same assets as dashboard). */
const PUBLIC_GALLERY_EXAMPLE_SRC = "/brand/Gallery%20Photos.png" as const;
const PUBLIC_GALLERY_EXAMPLE_2_SRC = "/brand/Gallery%20Photos%202.png" as const;
const PUBLIC_PRODUCTS_EXAMPLE_SRC = "/brand/Products%20Photos.png" as const;

const PREVIEW_EXAMPLES_SLIDE_INTERVAL_MS = 2000;

/** `public/brand` asset URL (encodes spaces, ellipsis, etc. to match on-disk filenames). */
function publicBrandAsset(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

const PREVIEW_EXAMPLE_SLIDES = [
  {
    caption: "Products example",
    src: PUBLIC_PRODUCTS_EXAMPLE_SRC,
    alt: "Example of how a Products section can look on a public business profile",
  },
  {
    caption: "Gallery example",
    src: PUBLIC_GALLERY_EXAMPLE_SRC,
    alt: "Example of how a Gallery section can look on a public business profile",
  },
  {
    caption: "Gallery example 2",
    src: PUBLIC_GALLERY_EXAMPLE_2_SRC,
    alt: "Additional gallery layout example on a public business profile",
  },
] as const;

/** Industry-specific before/after examples (`public/brand`). */
const PREVIEW_INDUSTRY_EXAMPLES = [
  {
    id: "restaurant",
    label: "Restaurant",
    src: "/brand/Steak_salad_restaurant_menu_picture_202606011551.jpeg",
    alt: "Restaurant menu and dish photo example on a business profile",
  },
  {
    id: "car-dealership",
    label: "Car Dealership",
    src: "/brand/Cars_for_sale_dealership_202606011741.jpeg",
    alt: "Car dealership inventory example on a business profile",
  },
  {
    id: "car-fix",
    label: "Car Fix",
    src: "/brand/Car_accident_and_repair_comparison_202606011536.jpeg",
    alt: "Car accident and repair comparison example on a business profile",
  },
  {
    id: "realtor",
    label: "Realtor",
    src: "/brand/Modern_house_for_sale_202606011709.jpeg",
    alt: "Real estate listing example on a business profile",
  },
  {
    id: "roofing",
    label: "Roofing",
    src: "/brand/Men_roofing_a_house_202606011712.jpeg",
    alt: "Roofing work example on a business profile",
  },
  {
    id: "pool-cleaning",
    label: "Pool Cleaning",
    src: "/brand/Pool_dirty_to_clean_202606011551.jpeg",
    alt: "Pool cleaning before and after example on a business profile",
  },
  {
    id: "logistics",
    label: "Logistics",
    src: "/brand/Branded_cards_for_work_purpose_202606011502.jpeg",
    alt: "Logistics and branded work materials example on a business profile",
  },
  {
    id: "hair-transplant",
    label: "Hair Transplant",
    src: "/brand/Man_hair_implantation_before_after_202606011551.jpeg",
    alt: "Before and after hair transplant example on a business profile",
  },
  {
    id: "face-hair-products",
    label: "Face & Hair Products",
    src: publicBrandAsset(
      "Face_products_ready_for_advertis…_202606011700.jpeg",
    ),
    alt: "Face and hair product photography example on a business profile",
  },
  {
    id: "gym",
    label: "Gym",
    src: "/brand/Realistic_gym_with_people_202606011714.jpeg",
    alt: "Gym and fitness facility example on a business profile",
  },
  {
    id: "corporate-offices",
    label: "Corporate Offices",
    src: "/brand/Recreate_photo_without_fleet_202606011509.jpeg",
    alt: "Corporate office environment example on a business profile",
  },
  {
    id: "interior-offices",
    label: "Interior Offices",
    src: "/brand/Office%20Rental_20260502_111519.png",
    alt: "Interior office space example on a business profile",
  },
  {
    id: "team",
    label: "Team",
    src: "/brand/Team_pictures_work_attire_202606011500.jpeg",
    alt: "Team in work attire example on a business profile",
  },
] as const;

type PreviewFrame = {
  caption: string;
  src: string;
  alt: string;
};

type Props = {
  photos: BusinessPhotoPublic[];
  /** Required for “Upload photos” owner vs claim routing. */
  businessId: string;
  /** Display domain / URL for product “Buy” when a photo has no product link (same as dashboard). */
  businessWebsite?: string | null;
  /** Public slug for “Review this item” links on product cards. */
  businessSlug?: string | null;
  /**
   * When set on an unclaimed profile, claim/signup links include business
   * context (same as legacy behavior).
   */
  claimSignupPrefill?: BusinessSignupClaimPrefill | null;
};

/** Same ordering as dashboard unified gallery list: sort_order asc, then newer first. */
function sortPhotosLikeDashboard(list: BusinessPhotoPublic[]): BusinessPhotoPublic[] {
  return [...list].sort((a, b) => {
    const sa = Number(a.sort_order) || 0;
    const sb = Number(b.sort_order) || 0;
    if (sa !== sb) return sa - sb;
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return tb - ta;
  });
}

function ProfileGalleryHeroStrip({
  photos,
  onOpenLightbox,
}: {
  photos: BusinessPhotoPublic[];
  onOpenLightbox: (url: string) => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thumbStart, setThumbStart] = useState(0);

  const heroPhoto = useMemo(() => {
    if (photos.length === 0) return null;
    if (selectedId) {
      const hit = photos.find((p) => p.id === selectedId);
      if (hit) return hit;
    }
    const cover = photos.find((p) => p.is_cover === true);
    return cover ?? photos[0] ?? null;
  }, [photos, selectedId]);

  const maxThumbStart = Math.max(0, photos.length - HERO_VISIBLE_THUMBS);
  const safeThumbStart = Math.min(thumbStart, maxThumbStart);
  const canPrevThumb = safeThumbStart > 0;
  const canNextThumb = safeThumbStart < maxThumbStart;

  if (!heroPhoto) return null;

  return (
    <div className="mt-6 space-y-3">
      <div className="relative overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-sm">
        <button
          type="button"
          onClick={() => onOpenLightbox(heroPhoto.url)}
          className="relative block aspect-[16/9] w-full cursor-zoom-in text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 focus-visible:ring-offset-2"
          aria-label="View gallery photo larger"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={heroPhoto.id}
            src={heroPhoto.url}
            alt=""
            className={`absolute inset-0 h-full w-full object-center photos-hero-fade ${
              heroPhoto.preview_frame === "portrait"
                ? "object-contain bg-gray-100"
                : "object-cover"
            }`}
            loading="eager"
            decoding="async"
          />

          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0E0E0E] shadow-sm ring-1 ring-black/5 backdrop-blur">
            Gallery
          </span>

          {photos.length > 1 ? (
            <span className="pointer-events-none absolute bottom-3 left-3 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white shadow-sm backdrop-blur">
              {photos.findIndex((p) => p.id === heroPhoto.id) + 1} / {photos.length}
            </span>
          ) : null}
        </button>
      </div>

      {photos.length > 0 ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() =>
              setThumbStart((prev) => {
                const cur = Math.min(prev, maxThumbStart);
                return Math.max(0, cur - 1);
              })
            }
            disabled={!canPrevThumb}
            aria-label="Show previous gallery photos"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div
              className="flex transition-transform duration-300 ease-out"
              style={{
                transform: `translateX(-${(100 / HERO_VISIBLE_THUMBS) * safeThumbStart}%)`,
              }}
            >
              {photos.map((p) => {
                const isActive = heroPhoto.id === p.id;
                const fitPortrait = p.preview_frame === "portrait";
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
                      aria-label="Show this photo in the gallery preview"
                      onClick={() => setSelectedId(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedId(p.id);
                        }
                      }}
                      className={`relative aspect-[4/3] w-full cursor-pointer overflow-hidden rounded-lg border bg-gray-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 ${
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
                          fitPortrait ? "object-contain bg-gray-100" : "object-cover"
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setThumbStart((prev) => {
                const cur = Math.min(prev, maxThumbStart);
                return Math.min(maxThumbStart, cur + 1);
              })
            }
            disabled={!canNextThumb}
            aria-label="Show more gallery photos"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

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
  );
}

function ProfileProductsGrid({
  photos,
  businessId,
  businessSlug,
  onOpenLightbox,
}: {
  photos: BusinessPhotoPublic[];
  businessId: string;
  businessSlug: string | null | undefined;
  onOpenLightbox: (url: string) => void;
}) {
  const pageSize = MAX_GRID_PHOTOS;
  const [pageStart, setPageStart] = useState(0);
  const [productReviewStats, setProductReviewStats] = useState<
    Record<string, { averageRating: number; reviewCount: number }>
  >({});
  const [productStatsLoading, setProductStatsLoading] = useState(false);

  const total = photos.length;
  const maxStart = Math.max(0, total - pageSize);
  const safeStart = Math.min(pageStart, maxStart);
  const canPrev = safeStart > 0;
  const canNext = safeStart < maxStart;
  const gridPhotos = photos.slice(safeStart, safeStart + pageSize);
  const rangeEnd = Math.min(safeStart + gridPhotos.length, total);

  useEffect(() => {
    setPageStart((prev) => Math.min(prev, maxStart));
  }, [maxStart]);

  const photoIdsKey = useMemo(() => photos.map((p) => p.id).join("|"), [photos]);
  useEffect(() => {
    setPageStart(0);
  }, [photoIdsKey]);

  useEffect(() => {
    if (!businessId) {
      setProductReviewStats({});
      setProductStatsLoading(false);
      return;
    }
    const photoIds = photos.map((p) => p.id).filter(Boolean);
    if (photoIds.length === 0) {
      setProductReviewStats({});
      setProductStatsLoading(false);
      return;
    }

    let cancelled = false;
    const CHUNK = 60;

    void (async () => {
      setProductStatsLoading(true);
      const merged: Record<string, { sum: number; count: number }> = {};
      try {
        const sb = supabaseBrowser();

        for (let i = 0; i < photoIds.length; i += CHUNK) {
          const chunk = photoIds.slice(i, i + CHUNK);
          const { data, error } = await sb
            .from("reviews")
            .select("product_photo_id, rating")
            .eq("business_id", businessId)
            .in("product_photo_id", chunk)
            .or(REVIEWS_PUBLIC_STATUS_AND_VISIBILITY_OR);

          if (cancelled) return;
          if (error) {
            setProductReviewStats({});
            return;
          }

          for (const row of data ?? []) {
            const pid = String((row as { product_photo_id?: string | null }).product_photo_id ?? "");
            if (!pid) continue;
            const r = Number((row as { rating?: number | null }).rating);
            if (!Number.isFinite(r) || r < 1 || r > 5) continue;
            if (!merged[pid]) merged[pid] = { sum: 0, count: 0 };
            merged[pid].sum += r;
            merged[pid].count += 1;
          }
        }

        if (cancelled) return;

        const out: Record<string, { averageRating: number; reviewCount: number }> = {};
        for (const [pid, v] of Object.entries(merged)) {
          out[pid] = {
            averageRating: v.count > 0 ? v.sum / v.count : 0,
            reviewCount: v.count,
          };
        }
        setProductReviewStats(out);
      } finally {
        if (!cancelled) setProductStatsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId, photoIdsKey, photos]);

  return (
    <div className="mt-10 space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="text-base font-semibold text-[#0E0E0E]">Products &amp; Services</h3>
          <p className="max-w-2xl text-xs leading-relaxed text-gray-500">
            This business hasn&apos;t added product details yet. Own this business? Add your products,
            services, and gallery to stand out.
          </p>
        </div>
        {total > pageSize ? (
          <p className="text-xs text-gray-500" aria-live="polite">
            {safeStart + 1}–{rangeEnd} of {total}
          </p>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        {total > pageSize ? (
          <button
            type="button"
            onClick={() =>
              setPageStart((prev) => {
                const cur = Math.min(prev, maxStart);
                return Math.max(0, cur - pageSize);
              })
            }
            disabled={!canPrev}
            aria-label="Previous products"
            className="touch-manipulation inline-flex h-9 w-9 shrink-0 self-center items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-4">
            {gridPhotos.map((p) => {
              const fitPortrait = p.preview_frame === "portrait";
              const name = (p.product_name ?? "").trim() || "Product";
              const slug = (businessSlug ?? "").trim();
              const reviewHref =
                slug.length > 0
                  ? `/write-review/item?businessSlug=${encodeURIComponent(slug)}&photoId=${encodeURIComponent(p.id)}`
                  : null;
              const stats = productReviewStats[p.id];
              const reviewCount = stats?.reviewCount ?? 0;
              const averageRating = stats?.averageRating ?? 0;
              const hasReviews = reviewCount > 0 && averageRating > 0;

              return (
                <article
                  key={p.id}
                  className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md"
                  aria-label={name}
                >
                  <button
                    type="button"
                    onClick={() => onOpenLightbox(p.url)}
                    className="group relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-gray-100 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/35 focus-visible:ring-offset-2"
                    aria-label={`View larger image: ${name}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.url}
                      alt=""
                      className={`h-full w-full object-center transition duration-200 group-hover:scale-[1.02] ${
                        fitPortrait ? "object-contain bg-gray-100" : "object-cover"
                      }`}
                      loading="lazy"
                      decoding="async"
                    />
                  </button>

                  <div className="flex min-h-0 flex-1 flex-col gap-1 border-t border-gray-100 p-2.5">
                    <h4 className="line-clamp-2 text-sm font-semibold leading-snug text-[#0E0E0E]">
                      {name}
                    </h4>
                    <div className="min-h-[2.25rem] text-xs leading-snug">
                      {productStatsLoading ? (
                        <span className="text-gray-400">Loading…</span>
                      ) : hasReviews ? (
                        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                          <RatingStars rating={averageRating} size={11} />
                          <span className="font-semibold tabular-nums text-[#0E0E0E]">
                            {averageRating.toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">No reviews yet</span>
                      )}
                    </div>
                    {reviewHref ? (
                      <div className="mt-1.5">
                        <Link
                          href={reviewHref}
                          className="inline-flex w-full touch-manipulation items-center justify-center rounded-lg bg-[#124541] px-3 py-2 text-center text-xs font-semibold text-white shadow-sm transition hover:bg-[#0f3a35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541]/40"
                        >
                          Review this product
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {total > pageSize ? (
          <button
            type="button"
            onClick={() =>
              setPageStart((prev) => {
                const cur = Math.min(prev, maxStart);
                return Math.min(maxStart, cur + pageSize);
              })
            }
            disabled={!canNext}
            aria-label="Next products"
            className="touch-manipulation inline-flex h-9 w-9 shrink-0 self-center items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ProfileSectionPhotoGrid({
  title,
  photos,
  onOpenLightbox,
}: {
  title: string;
  photos: BusinessPhotoPublic[];
  onOpenLightbox: (url: string) => void;
}) {
  const gridPhotos = photos.slice(0, MAX_GRID_PHOTOS);
  const moreCount =
    photos.length > MAX_GRID_PHOTOS ? photos.length - MAX_GRID_PHOTOS : 0;

  return (
    <div className="mt-10 space-y-3">
      <h3 className="text-base font-semibold text-[#0E0E0E]">{title}</h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
        {gridPhotos.map((p, idx) => {
          const showMoreOverlay = moreCount > 0 && idx === gridPhotos.length - 1;
          const fitPortrait = p.preview_frame === "portrait";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onOpenLightbox(p.url)}
              className="group relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-100 text-left shadow-sm transition hover:border-gray-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/35"
              aria-label={
                showMoreOverlay
                  ? `View photos, ${moreCount} more not shown`
                  : "View photo"
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={p.url}
                alt=""
                className={`h-full w-full object-center transition duration-200 group-hover:scale-[1.02] ${
                  fitPortrait ? "object-contain bg-gray-100" : "object-cover"
                }`}
                loading="lazy"
                decoding="async"
              />
              {showMoreOverlay ? (
                <span
                  className="absolute inset-0 flex items-center justify-center bg-black/55 text-lg font-semibold text-white backdrop-blur-[1px]"
                  aria-hidden
                >
                  +{moreCount} more
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BusinessProfilePhotos({
  photos,
  businessId,
  businessWebsite: _businessWebsite = null,
  businessSlug = null,
  claimSignupPrefill = null,
}: Props) {
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [ctaBusy, setCtaBusy] = useState(false);
  const [previewExamplesOpen, setPreviewExamplesOpen] = useState(false);
  const [previewExampleSlideIndex, setPreviewExampleSlideIndex] = useState(0);
  const [previewSlideshowPaused, setPreviewSlideshowPaused] = useState(false);
  const [previewIndustryId, setPreviewIndustryId] = useState<string | null>(null);
  const previewTouchStartXRef = useRef<number | null>(null);
  const previewBodyRef = useRef<HTMLDivElement | null>(null);
  const [previewScrollNav, setPreviewScrollNav] = useState({
    visible: false,
    canUp: false,
    canDown: false,
  });
  const [portalReady, setPortalReady] = useState(false);
  const [canManagePhotos, setCanManagePhotos] = useState(false);

  const previewSlideCount = PREVIEW_EXAMPLE_SLIDES.length;

  const goToPreviewSlide = useCallback((delta: number) => {
    setPreviewIndustryId(null);
    setPreviewExampleSlideIndex(
      (i) => (i + delta + previewSlideCount) % previewSlideCount,
    );
  }, [previewSlideCount]);

  const selectIndustryPreview = useCallback((industryId: string) => {
    setPreviewIndustryId(industryId);
    setPreviewSlideshowPaused(true);
  }, []);

  const handlePreviewTouchStart = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      previewTouchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
    },
    [],
  );

  const handlePreviewTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLDivElement>) => {
      const startX = previewTouchStartXRef.current;
      previewTouchStartXRef.current = null;
      if (startX == null) return;
      const endX = event.changedTouches[0]?.clientX ?? startX;
      const deltaX = endX - startX;
      if (Math.abs(deltaX) < 48) return;
      goToPreviewSlide(deltaX > 0 ? -1 : 1);
    },
    [goToPreviewSlide],
  );

  const updatePreviewScrollNav = useCallback(() => {
    const el = previewBodyRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const maxScroll = Math.max(0, scrollHeight - clientHeight);
    const visible = maxScroll > 8;
    setPreviewScrollNav({
      visible,
      canUp: scrollTop > 8,
      canDown: scrollTop < maxScroll - 8,
    });
  }, []);

  const scrollPreviewBody = useCallback((direction: -1 | 1) => {
    const el = previewBodyRef.current;
    if (!el) return;
    const step = Math.max(160, Math.floor(el.clientHeight * 0.55));
    el.scrollBy({ top: direction * step, behavior: "smooth" });
  }, []);

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const trimmedId = String(businessId ?? "").trim();
    if (!trimmedId) return;

    void (async () => {
      const sb = supabaseBrowser();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session?.user) return;
      const allowed = await canAccessBusiness(sb, session.user.id, trimmedId);
      if (!cancelled) setCanManagePhotos(allowed);
    })();

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  useEffect(() => {
    if (!previewExamplesOpen) return;
    setPreviewExampleSlideIndex(0);
    setPreviewSlideshowPaused(false);
    setPreviewIndustryId(null);
  }, [previewExamplesOpen]);

  useEffect(() => {
    if (!previewExamplesOpen || previewSlideshowPaused || previewIndustryId) return;
    const id = window.setInterval(() => {
      setPreviewExampleSlideIndex((i) => (i + 1) % previewSlideCount);
    }, PREVIEW_EXAMPLES_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [previewExamplesOpen, previewSlideshowPaused, previewIndustryId, previewSlideCount]);

  const galleryPhotos = useMemo(
    () =>
      sortPhotosLikeDashboard(
        photos.filter((p) => normalizeBusinessPhotoSection(p.section) === "gallery")
      ),
    [photos]
  );
  const productsPhotos = useMemo(
    () =>
      sortPhotosLikeDashboard(
        photos.filter((p) => normalizeBusinessPhotoSection(p.section) === "products")
      ),
    [photos]
  );
  const servicesPhotos = useMemo(
    () =>
      sortPhotosLikeDashboard(
        photos.filter((p) => normalizeBusinessPhotoSection(p.section) === "services")
      ),
    [photos]
  );

  /** Owner-only onboarding helpers, hidden from public visitors. */
  const showOwnerPhotoActions = canManagePhotos && photos.length === 0;

  const resolveUploadHref = useCallback(async (): Promise<void> => {
    const sb = supabaseBrowser();
    const {
      data: { session },
    } = await sb.auth.getSession();
    if (!session?.user) {
      window.location.href = claimSignupPrefill
        ? buildBusinessSignupClaimPrefillUrl(claimSignupPrefill)
        : "/business/signup";
      return;
    }
    const trimmedId = String(businessId ?? "").trim();
    if (!trimmedId) {
      window.location.href = claimSignupPrefill
        ? buildBusinessSignupClaimPrefillUrl(claimSignupPrefill)
        : "/business/signup";
      return;
    }
    const allowed = await canAccessBusiness(sb, session.user.id, trimmedId);
    if (allowed) {
      window.location.href = "/business/dashboard/settings/photos";
      return;
    }
    window.location.href = claimSignupPrefill
      ? buildBusinessSignupClaimPrefillUrl(claimSignupPrefill)
      : "/business/signup";
  }, [businessId, claimSignupPrefill]);

  const handleUploadPhotos = useCallback(() => {
    setCtaBusy(true);
    void resolveUploadHref().finally(() => setCtaBusy(false));
  }, [resolveUploadHref]);

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

  useEffect(() => {
    if (!previewExamplesOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPreviewExamplesOpen(false);
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToPreviewSlide(-1);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToPreviewSlide(1);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        scrollPreviewBody(-1);
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        scrollPreviewBody(1);
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [previewExamplesOpen, goToPreviewSlide, scrollPreviewBody]);

  useEffect(() => {
    if (!previewExamplesOpen) return;
    const el = previewBodyRef.current;
    const sync = () => updatePreviewScrollNav();
    sync();
    const t1 = window.setTimeout(sync, 60);
    const t2 = window.setTimeout(sync, 320);
    el?.addEventListener("scroll", sync, { passive: true });
    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => sync())
        : null;
    if (el) ro?.observe(el);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      el?.removeEventListener("scroll", sync);
      ro?.disconnect();
    };
  }, [
    previewExamplesOpen,
    previewExampleSlideIndex,
    previewIndustryId,
    updatePreviewScrollNav,
  ]);

  const activeIndustryPreview = previewIndustryId
    ? PREVIEW_INDUSTRY_EXAMPLES.find((item) => item.id === previewIndustryId) ?? null
    : null;

  const previewFrame: PreviewFrame = activeIndustryPreview
    ? {
        caption: activeIndustryPreview.label,
        src: activeIndustryPreview.src,
        alt: activeIndustryPreview.alt,
      }
    : {
        caption: PREVIEW_EXAMPLE_SLIDES[previewExampleSlideIndex]?.caption ?? "",
        src:
          PREVIEW_EXAMPLE_SLIDES[previewExampleSlideIndex]?.src ??
          PREVIEW_EXAMPLE_SLIDES[0].src,
        alt:
          PREVIEW_EXAMPLE_SLIDES[previewExampleSlideIndex]?.alt ??
          PREVIEW_EXAMPLE_SLIDES[0].alt,
      };

  return (
    <section
      className="business-photos-section space-y-6"
      aria-labelledby="business-photos-heading"
    >
      <div>
        <h2
          id="business-photos-heading"
          className="biz-section-title text-lg"
        >
          <span className="biz-section-accent">Business</span> photos
        </h2>
        <p className="biz-section-sub mt-3 text-sm">
          Photos shared by the business help customers learn more about its products,
          services, team, and location.
        </p>
      </div>

      {photos.length === 0 ? (
        <>
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-5">
            <p className="text-sm text-gray-600">
              No business photos have been uploaded yet.
            </p>
          </div>
          {showOwnerPhotoActions ? (
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setPreviewExamplesOpen(true)}
                className="biz-btn-preview px-3 py-1.5 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4A6]/35"
                aria-label="Preview example layouts for products and gallery"
              >
                Preview Example
              </button>
              <button
                type="button"
                onClick={handleUploadPhotos}
                disabled={ctaBusy}
                aria-label={ctaBusy ? "Please wait" : "Upload photos"}
                className="biz-btn-primary inline-flex min-h-[2.5rem] items-center justify-center rounded-full px-6 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4A6]/40 disabled:opacity-60"
              >
                {ctaBusy ? "Please wait…" : "Upload"}
              </button>
            </div>
          ) : null}
        </>
      ) : (
        <>
          {galleryPhotos.length > 0 ? (
            <ProfileGalleryHeroStrip
              photos={galleryPhotos}
              onOpenLightbox={setLightboxSrc}
            />
          ) : null}

          {productsPhotos.length > 0 ? (
            <ProfileProductsGrid
              photos={productsPhotos}
              businessId={businessId}
              businessSlug={businessSlug}
              onOpenLightbox={setLightboxSrc}
            />
          ) : null}

          {servicesPhotos.length > 0 ? (
            <ProfileSectionPhotoGrid
              title="Other"
              photos={servicesPhotos}
              onOpenLightbox={setLightboxSrc}
            />
          ) : null}
        </>
      )}

      {portalReady && lightboxSrc
        ? createPortal(
            <div className="business-cinematic">
              <div
                role="dialog"
                aria-modal="true"
                aria-label="Photo preview"
                onClick={() => setLightboxSrc(null)}
                className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
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
            </div>,
            document.body,
          )
        : null}

      {portalReady && previewExamplesOpen
        ? createPortal(
            <div className="business-cinematic">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="public-preview-examples-title"
                className="biz-preview-overlay fixed inset-0 z-[200] flex items-center justify-center bg-black/80"
                onClick={() => setPreviewExamplesOpen(false)}
              >
          <div
            className="biz-preview-dialog relative flex w-full flex-col overflow-hidden bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 border-b border-gray-100 px-3 py-2.5 sm:gap-3 sm:px-4">
              <h2
                id="public-preview-examples-title"
                className="text-sm font-semibold text-[#0E0E0E] sm:text-base"
              >
                Profile preview examples
              </h2>
              <button
                type="button"
                onClick={() => setPreviewExamplesOpen(false)}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                aria-label="Close"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            </div>
            <div className="relative flex min-h-0 flex-1 flex-col">
              <div
                ref={previewBodyRef}
                className="biz-preview-body flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-contain p-2 sm:p-3"
              >
              <figure className="biz-preview-figure flex flex-col rounded-xl bg-gray-50">
                <figcaption
                  className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-gray-200/80 bg-white px-3 py-2 sm:px-4"
                  aria-live="polite"
                >
                  <span className="min-w-0 truncate text-sm font-semibold text-[#0E0E0E]">
                    {previewFrame.caption}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    {!activeIndustryPreview ? (
                      <button
                        type="button"
                        onClick={() => setPreviewSlideshowPaused((p) => !p)}
                        className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-[#124541] shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 md:hidden"
                        aria-pressed={previewSlideshowPaused}
                        aria-label={
                          previewSlideshowPaused
                            ? "Resume automatic slideshow"
                            : "Pause automatic slideshow"
                        }
                      >
                        {previewSlideshowPaused ? (
                          <>
                            <Play className="h-3 w-3" aria-hidden />
                            Play
                          </>
                        ) : (
                          <>
                            <Pause className="h-3 w-3" aria-hidden />
                            Pause
                          </>
                        )}
                      </button>
                    ) : null}
                    <span className="text-xs text-gray-500">
                      {activeIndustryPreview
                        ? "Industry preview"
                        : `${previewExampleSlideIndex + 1} / ${previewSlideCount}`}
                    </span>
                  </div>
                </figcaption>
                <p className="biz-preview-scroll-hint shrink-0 border-b border-gray-200/60 bg-white px-3 py-1.5 text-[11px] text-gray-500">
                  Scroll down for industry examples · swipe or use arrows to change slides
                </p>
                <div
                  className="biz-preview-image-stage relative shrink-0"
                  onTouchStart={handlePreviewTouchStart}
                  onTouchEnd={handlePreviewTouchEnd}
                >
                  <button
                    type="button"
                    onClick={() => goToPreviewSlide(-1)}
                    className="absolute left-1 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-[#124541] shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:left-2 sm:h-9 sm:w-9"
                    aria-label="Previous example slide"
                  >
                    <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </button>
                  {/* eslint-disable-next-line @next/next/no-img-element -- static public brand asset */}
                  <img
                    key={previewFrame.src}
                    src={previewFrame.src}
                    alt={previewFrame.alt}
                    className="biz-preview-image"
                    onLoad={updatePreviewScrollNav}
                  />
                  <button
                    type="button"
                    onClick={() => goToPreviewSlide(1)}
                    className="absolute right-1 top-1/2 z-10 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white/95 text-[#124541] shadow-md transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:right-2 sm:h-9 sm:w-9"
                    aria-label="Next example slide"
                  >
                    <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden />
                  </button>
                  {!activeIndustryPreview ? (
                    <button
                      type="button"
                      onClick={() => setPreviewSlideshowPaused((p) => !p)}
                      className="absolute bottom-2 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1.5 rounded-full border border-gray-200/90 bg-white/95 px-3.5 py-1.5 text-xs font-semibold text-[#124541] shadow-lg backdrop-blur-sm transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:bottom-auto sm:top-1/2 sm:inline-flex sm:-translate-y-1/2"
                      aria-pressed={previewSlideshowPaused}
                      aria-label={
                        previewSlideshowPaused
                          ? "Resume automatic slideshow"
                          : "Pause automatic slideshow"
                      }
                    >
                      {previewSlideshowPaused ? (
                        <>
                          <Play className="h-3.5 w-3.5" aria-hidden />
                          Play
                        </>
                      ) : (
                        <>
                          <Pause className="h-3.5 w-3.5" aria-hidden />
                          Pause
                        </>
                      )}
                    </button>
                  ) : null}
                </div>
                <div className="biz-preview-footer flex shrink-0 flex-col gap-2.5 border-t border-gray-200/80 bg-white px-2 py-3 sm:gap-2 sm:px-3 sm:py-3">
                  <p className="biz-preview-industry-label shrink-0 text-xs font-semibold text-[#0E0E0E]">
                    Industry examples
                  </p>
                  <div className="biz-preview-industry-strip">
                    {PREVIEW_INDUSTRY_EXAMPLES.map((item) => {
                      const isActive = previewIndustryId === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectIndustryPreview(item.id)}
                          className={`biz-preview-industry-chip rounded-md border px-2 py-1 text-[10px] font-semibold leading-tight shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/35 sm:py-0.5 sm:text-[11px] ${
                            isActive
                              ? "border-[#1FAF9E] bg-[#1FAF9E]/10 text-[#0E3B36]"
                              : "border-gray-300 bg-white text-[#124541] hover:bg-[#124541]/5"
                          }`}
                          aria-pressed={isActive}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                  <div
                    className="flex shrink-0 items-center justify-center gap-2 py-0.5"
                    role="tablist"
                    aria-label="Layout example slides"
                  >
                    {PREVIEW_EXAMPLE_SLIDES.map((slide, index) => {
                      const isActive =
                        !previewIndustryId && index === previewExampleSlideIndex;
                      return (
                        <button
                          key={slide.src}
                          type="button"
                          role="tab"
                          aria-selected={isActive}
                          aria-label={`Go to slide ${index + 1}: ${slide.caption}`}
                          onClick={() => {
                            setPreviewIndustryId(null);
                            setPreviewExampleSlideIndex(index);
                          }}
                          className={`h-3 w-3 rounded-full transition sm:h-2.5 sm:w-2.5 md:h-2 md:w-2 ${
                            isActive
                              ? "scale-110 bg-[#1FAF9E]"
                              : "bg-gray-300 hover:bg-gray-400"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </figure>
              </div>
              {previewScrollNav.visible ? (
                <div
                  className="biz-preview-scroll-nav"
                  aria-label="Preview scroll controls"
                >
                  <button
                    type="button"
                    onClick={() => scrollPreviewBody(-1)}
                    disabled={!previewScrollNav.canUp}
                    aria-label="Scroll preview up"
                    className={`biz-carousel-nav biz-preview-scroll-btn ${CAROUSEL_NAV_BUTTON_CLASS}`}
                  >
                    <ChevronUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollPreviewBody(1)}
                    disabled={!previewScrollNav.canDown}
                    aria-label="Scroll preview down"
                    className={`biz-carousel-nav biz-preview-scroll-btn ${CAROUSEL_NAV_BUTTON_CLASS}`}
                  >
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              ) : null}
            </div>
          </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
