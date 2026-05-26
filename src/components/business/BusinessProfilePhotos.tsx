"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
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
import RatingStars from "@/components/RatingStars";

const MAX_GRID_PHOTOS = 8;
/** Matches dashboard Gallery editor: visible thumb slots before paging. */
const HERO_VISIBLE_THUMBS = 4;

/** Local asset, blurred behind the empty state (legacy profile teaser pattern). */
const EMPTY_PHOTOS_TEASER_SRC = "/brand/Business Profile.png" as const;

/** Public profile empty state: “Preview example” modals (`public/brand`, same assets as dashboard). */
const PUBLIC_GALLERY_EXAMPLE_SRC = "/brand/Gallery%20Photos.png" as const;
const PUBLIC_PRODUCTS_EXAMPLE_SRC = "/brand/Products%20Photos.png" as const;

const PREVIEW_EXAMPLES_SLIDE_INTERVAL_MS = 1500;
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
] as const;

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

  useEffect(() => {
    if (!previewExamplesOpen) return;
    setPreviewExampleSlideIndex(0);
    const id = window.setInterval(() => {
      setPreviewExampleSlideIndex((i) => (i + 1) % PREVIEW_EXAMPLE_SLIDES.length);
    }, PREVIEW_EXAMPLES_SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [previewExamplesOpen]);

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

  /**
   * Unclaimed profile or no photos yet: onboarding copy + “Preview example” buttons.
   * Claimed with photos: alternate intro copy and no preview buttons.
   */
  const showPublicPreviewExamples =
    photos.length === 0 || claimSignupPrefill != null;

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
      if (e.key !== "Escape") return;
      setPreviewExamplesOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [previewExamplesOpen]);

  const previewExampleSlide =
    PREVIEW_EXAMPLE_SLIDES[previewExampleSlideIndex] ?? PREVIEW_EXAMPLE_SLIDES[0];

  return (
    <section
      className="business-photos-section space-y-3"
      aria-labelledby="business-photos-heading"
    >
      <div>
        <h2
          id="business-photos-heading"
          className="text-lg font-semibold text-[#0E0E0E]"
        >
          Business photos
        </h2>
        {showPublicPreviewExamples ? (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
            Photos help customers visualise the shop, products, and experience before
            they commit. Businesses can upload photos from their Tellacity dashboard to
            showcase their brand and build trust quickly.
          </p>
        ) : (
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-gray-600">
            Photos help customers visualise the shop, products, and experience before
            they commit.
          </p>
        )}
      </div>

      {showPublicPreviewExamples ? (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewExamplesOpen(true)}
            className="rounded-lg border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-[#124541] shadow-sm transition hover:bg-[#124541]/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/35"
            aria-label="Preview example layouts for products and gallery"
          >
            Preview Example
          </button>
        </div>
      ) : null}

      {photos.length === 0 ? (
        <div
          className="relative mx-auto mt-6 aspect-[14.6/10] w-full max-w-[min(100%,14.6in)] overflow-hidden rounded-xl border border-gray-200/80 shadow-sm"
          role="img"
          aria-label="Business photos, no uploads yet"
        >
          <div className="absolute inset-0 h-full w-full" aria-hidden>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={EMPTY_PHOTOS_TEASER_SRC}
              alt=""
              className="h-full w-full scale-105 object-cover blur-md sm:blur-lg"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-gray-900/25 via-gray-900/15 to-gray-900/30" />
          </div>
          <div className="absolute inset-0 z-[1] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-sm rounded-xl border border-white/80 bg-white/95 p-5 text-center shadow-md backdrop-blur-[2px] sm:p-6">
              <h3 className="text-base font-semibold text-[#0E0E0E] sm:text-lg">
                Business photos
              </h3>
              <p className="mt-2 text-sm font-medium text-gray-900">
                This business hasn&apos;t added photos yet.
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                Photos help customers get a better feel for a business.
              </p>
              <button
                type="button"
                onClick={handleUploadPhotos}
                disabled={ctaBusy}
                aria-label={ctaBusy ? "Please wait" : "Upload photos"}
                className="mt-4 inline-flex min-h-[2.5rem] w-full max-w-[200px] items-center justify-center rounded-full bg-[#1FAF9E] px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#169786] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 disabled:opacity-60"
              >
                {ctaBusy ? "Please wait…" : "Upload"}
              </button>
            </div>
          </div>
        </div>
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

      {previewExamplesOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="public-preview-examples-title"
          className="fixed inset-0 z-[125] flex items-center justify-center bg-black/80 p-4 sm:p-6"
          onClick={() => setPreviewExamplesOpen(false)}
        >
          <div
            className="relative max-h-[94vh] w-full max-w-[min(96vw,1400px)] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <h2
                id="public-preview-examples-title"
                className="text-base font-semibold text-[#0E0E0E]"
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
            <div className="max-h-[calc(94vh-3.25rem)] overflow-y-auto px-3 pb-6 pt-4 sm:px-6 sm:pb-8 lg:px-8 lg:pb-10">
              <figure className="overflow-hidden rounded-xl bg-gray-50">
                <figcaption
                  className="border-b border-gray-200/80 bg-white px-3 py-2 text-sm font-semibold text-[#0E0E0E] sm:px-4 sm:py-3 sm:text-base"
                  aria-live="polite"
                >
                  {previewExampleSlide.caption}
                </figcaption>
                <div className="flex items-center justify-center p-3 sm:p-4 lg:p-5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static public brand asset */}
                  <img
                    src={previewExampleSlide.src}
                    alt={previewExampleSlide.alt}
                    className="max-h-[min(78vh,720px)] w-full max-w-full object-contain"
                  />
                </div>
              </figure>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
