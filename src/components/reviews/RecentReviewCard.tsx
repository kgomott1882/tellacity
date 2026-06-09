"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";

import RatingStars from "@/components/RatingStars";
import ReviewReactionButtons from "@/components/ReviewReactionButtons";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import ReviewShareMenu from "@/components/ReviewShareMenu";
import SimilarBusinessLogo from "@/components/business/SimilarBusinessLogo";
import { similarBusinessLogoUrl } from "@/lib/logo";

type BusinessReply = { body: string; createdAt: string };

type RecentReviewCardProps = {
  review: any;
  businessReplies?: BusinessReply[] | null;
  /** Set false on landing page so reply/More is only on business profile. Default true. */
  showMoreAndReply?: boolean;
  className?: string;
  isMobile?: boolean;
  bgColor?: string;
  /** Homepage: roomier title/body spacing and gentler line clamps. */
  variant?: "default" | "landing" | "profile";
  /** Pulse highlight (e.g. after publishing , homepage). */
  highlight?: boolean;
};

export default function RecentReviewCard({
  review,
  businessReplies,
  showMoreAndReply = true,
  className,
  isMobile,
  bgColor,
  variant = "default",
  highlight = false,
}: RecentReviewCardProps) {
  const router = useRouter();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);

  const hasReply = businessReplies && businessReplies.length > 0;
  const firstReply = hasReply ? businessReplies[0] : null;
  const showMoreSection = showMoreAndReply && (hasReply || review.review_id || review.id);

  const rating = review.rating || 0;
  const title = review.title;
  const body = review.body;

  const productLabel = String(
    review.product_name ?? review.productName ?? "",
  ).trim();
  const hasProductPhotoId = Boolean(
    review.product_photo_id ?? review.productPhotoId ?? null,
  );
  const titleTrim = typeof title === "string" ? title.trim() : "";
  const bodyTrim = typeof body === "string" ? body.trim() : "";
  // Landing payloads can omit product_name while still being a product review.
  const productLabelForDisplay =
    productLabel.length > 0
      ? productLabel
      : hasProductPhotoId && titleTrim.length > 0
        ? titleTrim
        : "";
  /** Item reviews often set `title` to the product name. Avoid "Product: X" + bold "X". */
  const titleDuplicatesProduct =
    productLabelForDisplay.length > 0 &&
    titleTrim.length > 0 &&
    titleTrim.toLowerCase() === productLabelForDisplay.toLowerCase();
  /** Body sometimes equals the product name only (no real comment). */
  const bodyOnlyDuplicatesProduct =
    productLabelForDisplay.length > 0 &&
    bodyTrim.length > 0 &&
    bodyTrim.toLowerCase() === productLabelForDisplay.toLowerCase();
  const statusText = String(review.status ?? "")
    .trim()
    .toLowerCase();
  const isProductReview = productLabelForDisplay.length > 0;
  /** Legacy rows can have null status while still being treated as public live. */
  const isPublishedLikeStatus = statusText === "" || statusText === "published";
  const shouldShowTitle =
    titleTrim.length > 0 &&
    !titleDuplicatesProduct &&
    (isProductReview ? isPublishedLikeStatus : true);

  const reviewId = review.review_id || review.id;

  const logoUrl = similarBusinessLogoUrl({
    resolved_logo_url:
      review.resolved_logo_url ?? review.business?.resolved_logo_url ?? null,
    logo_url: review.logo_url ?? review.business?.logo_url ?? null,
    website:
      review.business_website ??
      review.website ??
      review.business?.website ??
      null,
  });

  const businessName =
    review.business_name ||
    review.business?.name ||
    "Business";

  const businessSlug =
    review.business_slug ||
    review.business?.slug ||
    null;

  const reviewerName = review.reviewer_name;
  
  let dateText = "";
  try {
    if (review.created_at) {
      const date = new Date(review.created_at);
      const d = date.getDate();
      const m = date.getMonth() + 1;
      const y = date.getFullYear();
      const pad = (n: number) => n.toString().padStart(2, "0");
      dateText = isMobile
        ? `${pad(d)}/${pad(m)}/${y.toString().slice(-2)}`
        : `${pad(d)}/${pad(m)}/${y}`;
    }
  } catch {
    dateText = "";
  }

  const rawWebsite =
    review.business_website ||
    review.website ||
    "";

  let displayWebsite = "";
  let websiteUrl = "";
  let normalizedWebsiteDomain = "";

  if (rawWebsite) {
    try {
      const url = new URL(
        rawWebsite.startsWith("http")
          ? rawWebsite
          : `https://${rawWebsite}`
      );
      displayWebsite = url.hostname.replace(/^www\./, "");
      normalizedWebsiteDomain = displayWebsite.toLowerCase();
      websiteUrl = url.href;
    } catch {
      displayWebsite = rawWebsite;
      websiteUrl = rawWebsite;
      normalizedWebsiteDomain = rawWebsite
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .split("/")[0]
        .trim()
        .toLowerCase();
    }
  }

  const isLanding = variant === "landing";
  const isProfile = variant === "profile";
  const businessHref = businessSlug
    ? `/b/${businessSlug}`
    : normalizedWebsiteDomain
      ? `/review/${encodeURIComponent(normalizedWebsiteDomain)}`
      : "/";

  return (
    <div
      onClick={!isLanding ? () => businessSlug && router.push(`/b/${businessSlug}`) : undefined}
      className={cn(
        "flex flex-col rounded-xl border bg-white transition-all duration-500 overflow-hidden",
        isProfile
          ? "border-gray-200 shadow-[0_8px_24px_-8px_rgba(10,10,10,0.08)]"
          : "border-[#124541]/70 shadow-[0_10px_24px_-14px_rgba(31,175,158,0.85)] hover:shadow-[0_16px_34px_-12px_rgba(31,175,158,0.95)]",
        !isLanding && !isProfile && "h-full cursor-pointer",
        isProfile && "h-full cursor-pointer",
        isLanding &&
          "h-[328px] sm:h-[336px] cursor-default hover:shadow-[0_10px_24px_-14px_rgba(31,175,158,0.85)]",
        highlight &&
          "ring-2 ring-[#1FAF9E]/80 bg-emerald-50/90 shadow-[0_0_28px_rgba(31,175,158,0.45)]",
        bgColor,
        className
      )}
    >
      {businessHref ? (
        <Link
          href={businessHref}
          className={cn("flex gap-3", isLanding ? "cursor-pointer shrink-0 px-3 py-3" : "p-4")}
          onClick={(event) => event.stopPropagation()}
          aria-label={`View ${businessName} profile`}
        >
          <SimilarBusinessLogo
            logoUrl={logoUrl}
            nameForAlt={businessName}
            variant="compact"
          />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <h3 className="font-bold text-slate-900 truncate text-base">
                {businessName}
              </h3>
              {(() => {
                const count = Number(review.review_count ?? review.business?.review_count ?? 0) || 0;
                const hasAtLeastOneReview = count > 0 || !!businessName;
                return hasAtLeastOneReview;
              })() && (
                <img
                  src="/brand/Tellacity%20Vefication%20Batch.png"
                  alt="Tellacity verified reviews"
                  className="h-5 w-5 shrink-0"
                />
              )}
            </div>

            {displayWebsite && (
              <span className="block text-xs text-slate-500 truncate">
                {displayWebsite}
              </span>
            )}

            <div className="mt-2">
              <RatingStars
                rating={rating}
                size={12}
                editable={false}
                variant={isProfile ? "gold" : "default"}
                className={isProfile ? "biz-rating-gold" : undefined}
              />
            </div>
          </div>
        </Link>
      ) : (
        <div className={cn("flex gap-3", isLanding ? "shrink-0 px-3 py-3" : "p-4")}>
        <SimilarBusinessLogo
          logoUrl={logoUrl}
          nameForAlt={businessName}
          variant="compact"
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <h3 className="font-bold text-slate-900 truncate text-base">
              {businessName}
            </h3>
            {(() => {
              const count = Number(review.review_count ?? review.business?.review_count ?? 0) || 0;
              const hasAtLeastOneReview = count > 0 || !!businessName;
              return hasAtLeastOneReview;
            })() && (
              <img
                src="/brand/Tellacity%20Vefication%20Batch.png"
                alt="Tellacity verified reviews"
                className="h-5 w-5 shrink-0"
              />
            )}
          </div>

          {displayWebsite && (
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="block text-xs text-slate-500 truncate hover:underline"
              >
                {displayWebsite}
              </a>
          )}

          <div className="mt-2">
            <RatingStars
              rating={rating}
              size={12}
              editable={false}
              variant={isProfile ? "gold" : "default"}
              className={isProfile ? "biz-rating-gold" : undefined}
            />
          </div>
        </div>
        </div>
      )}

      <div className="h-px shrink-0 bg-slate-200" />

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          isLanding ? "min-h-0 gap-0 px-3 pb-2 pt-2" : "gap-2 flex-grow p-4",
        )}
      >
        <div className="flex shrink-0 justify-between gap-2 text-xs text-slate-500">
          <span className="min-w-0 truncate text-sm font-semibold text-slate-900">
            {reviewerName}
          </span>
          {/* Homepage "Recent reviews" carousel hides the review date on the card
              itself; it's still visible on the full `/review/id/[id]` page users
              reach via the "More" link. Other surfaces (business profile) keep
              the date inline. */}
          {!isLanding && <span className="shrink-0">{dateText}</span>}
        </div>

        {productLabelForDisplay ? (
          <p
            className={cn(
              "mt-1 text-xs text-[#1FAF9E]",
              isLanding ? "font-normal" : "font-medium",
            )}
          >
            Product: {productLabelForDisplay}
          </p>
        ) : null}

        {shouldShowTitle && (
          <div className="mt-0 line-clamp-1 break-words text-xs font-semibold text-[#1FAF9E]">
            {titleTrim}
          </div>
        )}

        {/* Landing: max 5 lines with … (do not use flex-1 here , it breaks line-clamp/ellipsis) */}
        {!bodyOnlyDuplicatesProduct && bodyTrim.length > 0 && (
          <p
            className={cn(
              "text-sm leading-relaxed text-slate-600 break-words [overflow-wrap:anywhere]",
              isLanding ? "mt-2 line-clamp-5 overflow-hidden" : "mt-0",
              !isLanding &&
                !showMore &&
                (isMobile ? "line-clamp-4" : "line-clamp-5"),
              !isLanding && "flex-grow",
            )}
          >
            {body}
          </p>
        )}

        {isLanding && reviewId && (
          <div className="mt-auto shrink-0 pt-1.5" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/review/id/${reviewId}`}
              className="inline-flex items-center gap-0.5 text-xs font-medium text-[#1FAF9E] hover:underline"
            >
              More
              <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </Link>
          </div>
        )}

        {!isLanding && showMoreSection && (
          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            {!showMore ? (
              <button
                type="button"
                onClick={() => setShowMore(true)}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#1FAF9E] hover:underline"
              >
                More <ChevronDown className="h-3 w-3" />
              </button>
            ) : (
              <div className="space-y-2">
                {firstReply && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                    <p className="font-semibold text-sm text-gray-800">
                      Reply from {businessName}
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">{firstReply.body}</p>
                    <p className="mt-1 text-xs text-slate-400">{firstReply.createdAt}</p>
                  </div>
                )}
                {reviewId && (
                  <Link
                    href={`/review/id/${reviewId}`}
                    className="inline-block text-xs font-medium text-[#1FAF9E] hover:underline"
                  >
                    View full review →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="h-px shrink-0 bg-slate-200" />

      <div
        className={cn(
          "flex shrink-0 items-center justify-between bg-white",
          isLanding ? "px-2.5 py-1.5" : "px-3 py-2",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <ReviewReactionButtons
          reviewId={reviewId}
          initialLikeCount={review.like_count || 0}
          /**
           * Landing renders 60+ cards. The like_count from home_feed_v2 SSR
           * is authoritative, so we skip the on-mount GET to avoid 60+ x ~1.3s
           * helpful API calls. Other surfaces keep the refresh (e.g. business
           * profile where freshness across reloads matters).
           */
          refreshOnMount={!isLanding}
        />

        <Popover open={isShareOpen} onOpenChange={setIsShareOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-slate-500 hover:text-[#124541]"
            >
              <span className="text-xs font-medium">Share</span>
              <Share2 className="h-4 w-4" />
            </Button>
          </PopoverTrigger>

          <PopoverContent
            align="end"
            className="w-56 p-3 rounded-xl shadow-xl"
          >
            <ReviewShareMenu
              reviewId={reviewId}
              businessSlug={businessSlug}
              businessName={businessName}
              onClose={() => setIsShareOpen(false)}
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
