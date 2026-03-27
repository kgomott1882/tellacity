/**
 * Tellacity-style star rating for widgets.
 * Matches RatingStars.tsx: colored square boxes, color-coded by rating.
 * Pure inline styles - no Tailwind, no lucide, safe for iframe embedding.
 */

import { TELLACITY_STAR_EMPTY_BORDER, TELLACITY_STAR_TIER_COLORS } from "@/lib/tellacityStarColors";

const FILL_COLORS: Record<number, string> = {
  1: TELLACITY_STAR_TIER_COLORS[0],
  2: TELLACITY_STAR_TIER_COLORS[1],
  3: TELLACITY_STAR_TIER_COLORS[2],
  4: TELLACITY_STAR_TIER_COLORS[3],
  5: TELLACITY_STAR_TIER_COLORS[4],
};
const EMPTY_COLOR = TELLACITY_STAR_EMPTY_BORDER;

function StarSVG({ size, color }: { size: number; color: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

export default function WidgetStars({
  rating,
  size = 14,
}: {
  rating: number;
  size?: number;
}) {
  const filled = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
  const filledColor = FILL_COLORS[filled] ?? FILL_COLORS[5];
  const boxSize = size + 6;

  return (
    <span style={{ display: "inline-flex", gap: 3 }} aria-label={`${filled} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => {
        const isFilled = i <= filled;
        return (
          <span
            key={i}
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: boxSize,
              height: boxSize,
              borderRadius: 3,
              backgroundColor: isFilled ? filledColor : "transparent",
              border: `1px solid ${isFilled ? filledColor : EMPTY_COLOR}`,
            }}
          >
            <StarSVG size={size} color={isFilled ? "#fff" : EMPTY_COLOR} />
          </span>
        );
      })}
    </span>
  );
}
