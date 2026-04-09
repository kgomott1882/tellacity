"use client";

import { useEffect, useState } from "react";
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
  variant?: "default" | "landing";
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
  const [logoImageError, setLogoImageError] = useState(false);

  const hasReply = businessReplies && businessReplies.length > 0;
  const firstReply = hasReply ? businessReplies[0] : null;
  const showMoreSection = showMoreAndReply && (hasReply || review.review_id || review.id);

  const rating = review.rating || 0;
  const title = review.title;
  const body = review.body;

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

  useEffect(() => {
    setLogoImageError(false);
  }, [reviewId, logoUrl]);

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

  if (rawWebsite) {
    try {
      const url = new URL(
        rawWebsite.startsWith("http")
          ? rawWebsite
          : `https://${rawWebsite}`
      );
      displayWebsite = url.hostname.replace(/^www\./, "");
      websiteUrl = url.href;
    } catch {
      displayWebsite = rawWebsite;
      websiteUrl = rawWebsite;
    }
  }

  const goToBusiness = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (businessSlug) {
      router.push(`/b/${businessSlug}`);
    }
  };

  const isLanding = variant === "landing";

  return (
    <div
      onClick={!isLanding ? () => businessSlug && router.push(`/b/${businessSlug}`) : undefined}
      className={cn(
        "flex flex-col rounded-xl border border-[#124541]/70 bg-white shadow-[0_10px_24px_-14px_rgba(31,175,158,0.85)] hover:shadow-[0_16px_34px_-12px_rgba(31,175,158,0.95)] transition-all duration-500 overflow-hidden",
        !isLanding && "h-full cursor-pointer",
        isLanding &&
          "h-[328px] sm:h-[336px] cursor-default hover:shadow-[0_10px_24px_-14px_rgba(31,175,158,0.85)]",
        highlight &&
          "ring-2 ring-[#1FAF9E]/80 bg-emerald-50/90 shadow-[0_0_28px_rgba(31,175,158,0.45)]",
        bgColor,
        className
      )}
    >
      <div
        className={cn("flex gap-3", isLanding ? "cursor-pointer shrink-0 px-3 py-3" : "p-4")}
        onClick={isLanding ? goToBusiness : undefined}
        role={isLanding ? "link" : undefined}
        tabIndex={isLanding ? 0 : undefined}
        onKeyDown={
          isLanding
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  businessSlug && router.push(`/b/${businessSlug}`);
                }
              }
            : undefined
        }
      >
        <div className="h-12 w-12 flex-shrink-0 rounded-sm flex items-center justify-center overflow-hidden bg-slate-50">
          {logoUrl && !logoImageError ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
              onError={() => setLogoImageError(true)}
            />
          ) : (
            <span className="text-sm font-semibold uppercase text-slate-500">
              {(businessName?.trim()?.[0] ?? "?").toUpperCase()}
            </span>
          )}
        </div>

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
            <RatingStars rating={rating} size={12} editable={false} />
          </div>
        </div>
      </div>

      <div className="h-px shrink-0 bg-slate-200" />

      <div
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col",
          isLanding ? "min-h-0 gap-0 px-3 pb-2 pt-2" : "gap-2 flex-grow p-4",
        )}
      >
        <div className="flex shrink-0 justify-between gap-2 text-xs text-slate-500">
          <span className="min-w-0 truncate font-semibold text-slate-900">
            {reviewerName}
          </span>
          <span className="shrink-0">{dateText}</span>
        </div>

        {!isLanding && title && (
          <div className="mt-0 line-clamp-1 break-words font-semibold text-sm text-slate-900">
            {title}
          </div>
        )}

        {/* Landing: max 5 lines with … (do not use flex-1 here , it breaks line-clamp/ellipsis) */}
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

        {isLanding && reviewId && (
          <div className="mt-auto shrink-0 pt-1.5" onClick={(e) => e.stopPropagation()}>
            <Link
              href={`/review/${reviewId}`}
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
                    href={`/review/${reviewId}`}
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
