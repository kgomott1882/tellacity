"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Share2 } from "lucide-react";
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

type RecentReviewCardProps = {
  review: any;
  className?: string;
  isMobile?: boolean;
  bgColor?: string;
};

export default function RecentReviewCard({
  review,
  className,
  isMobile,
  bgColor,
}: RecentReviewCardProps) {
  const router = useRouter();
  const [isShareOpen, setIsShareOpen] = useState(false);

  const rating = review.rating || 0;
  const title = review.title;
  const body = review.body;

  const reviewId = review.review_id || review.id;

  const businessName =
    review.business_name ||
    review.business?.name ||
    "Business";

  const businessSlug =
    review.business_slug ||
    review.business?.slug ||
    null;

  const rawLogoUrl = review.resolved_logo_url;
  let logoUrl = rawLogoUrl;
  if (rawLogoUrl && rawLogoUrl.includes("img.logo.dev")) {
    try {
      const parsed = new URL(rawLogoUrl);
      parsed.searchParams.set("fallback", "404");
      logoUrl = parsed.toString();
    } catch {
      logoUrl = rawLogoUrl;
    }
  }

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

  const handleCardClick = () => {
    if (businessSlug) {
      router.push(`/b/${businessSlug}`);
    }
  };

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "flex flex-col h-full rounded-xl border border-[#124541] bg-white shadow-md hover:shadow-lg transition-all cursor-pointer overflow-hidden",
        bgColor,
        isMobile ? "h-[320px]" : "",
        className
      )}
    >
      <div className="flex gap-3 p-4">
        <div className="h-12 w-12 rounded-sm border border-[#EDEDED] bg-[#FCF7F6] flex items-center justify-center overflow-hidden">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={businessName}
              className="h-full w-full object-contain"
              referrerPolicy="no-referrer"
              crossOrigin="anonymous"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : null}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-slate-900 truncate text-base">
            {businessName}
          </h3>

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

      <div className="h-px bg-slate-200" />

      <div className="flex flex-col gap-2 p-4 flex-grow">
        <div className="flex justify-between text-xs text-slate-500">
          <span className="truncate font-semibold text-slate-900">
            {reviewerName}
          </span>
          <span>{dateText}</span>
        </div>

        {title && (
          <div className="font-semibold text-sm text-slate-900 line-clamp-1">
            {title}
          </div>
        )}

        <p
          className={cn(
            "text-sm text-slate-600 leading-relaxed",
            isMobile ? "line-clamp-4" : "line-clamp-5"
          )}
        >
          {body}
        </p>
      </div>

      <div className="h-px bg-slate-200" />

      <div
        className="flex items-center justify-between px-3 py-2 bg-white"
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
