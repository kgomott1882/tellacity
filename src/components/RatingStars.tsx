"use client";

import { Star } from "lucide-react";
import {
  TELLACITY_STAR_EMPTY_BORDER,
  TELLACITY_STAR_EMPTY_FILL,
  TELLACITY_STAR_EMPTY_ICON,
  tellacityActiveStarColorForRating,
} from "@/lib/tellacityStarColors";

type RatingStarsProps = {
  rating: number;
  reviewCount?: number;
  size?: number;
  editable?: boolean;
  onChange?: (value: number) => void;
  /** Subtle shimmer animation (tier colors unchanged). */
  variant?: "default" | "gold";
  className?: string;
};

export default function RatingStars({
  rating,
  reviewCount, // currently unused: kept for data consistency with callers
  size = 16,
  editable = false,
  onChange,
  variant = "default",
  className = "",
}: RatingStarsProps) {
  const filledCount = Math.max(0, Math.min(5, Math.round(rating)));
  const boxSize = size + 6;
  const filledColor =
    filledCount > 0
      ? tellacityActiveStarColorForRating(filledCount)
      : tellacityActiveStarColorForRating(1);

  return (
    <div
      className={`flex items-center gap-1 ${
        variant === "gold" ? "home-rating-gold" : ""
      } ${className}`.trim()}
    >
      {Array.from({ length: 5 }).map((_, index) => {
        const isFilled = index < filledCount;
        const value = index + 1;
        const handleClick = () => {
          if (!editable || !onChange) return;
          onChange(value);
        };

        return (
          <span
            key={`star-${index}`}
            className={`inline-flex items-center justify-center rounded-[3px] text-white ${
              editable ? "cursor-pointer" : ""
            }`}
            onClick={handleClick}
            role={editable ? "button" : undefined}
            tabIndex={editable ? 0 : -1}
            onKeyDown={
              editable
                ? (event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleClick();
                    }
                  }
                : undefined
            }
            style={{ width: boxSize, height: boxSize }}
          >
            <span
              className="inline-flex items-center justify-center rounded-[3px]"
              style={{
                width: boxSize,
                height: boxSize,
                backgroundColor: isFilled ? filledColor : TELLACITY_STAR_EMPTY_FILL,
                border: `1px solid ${isFilled ? filledColor : TELLACITY_STAR_EMPTY_BORDER}`,
                color: isFilled ? "#FFFFFF" : TELLACITY_STAR_EMPTY_ICON,
              }}
            >
              <Star size={size} className="fill-current" aria-hidden />
            </span>
          </span>
        );
      })}
    </div>
  );
}
