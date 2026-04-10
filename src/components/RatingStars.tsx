import { Star } from "lucide-react";

type RatingStarsProps = {
  rating: number;
  reviewCount?: number;
  size?: number;
  editable?: boolean;
  onChange?: (value: number) => void;
};

export default function RatingStars({
  rating,
  reviewCount, // currently unused: kept for data consistency with callers
  size = 16,
  editable = false,
  onChange,
}: RatingStarsProps) {
  const filledCount = Math.max(0, Math.min(5, Math.round(rating)));
  const boxSize = size + 6;
  const fillColors: Record<number, string> = {
    1: "#F04438",
    2: "#F79009",
    3: "#FEC84B",
    4: "#84CC16",
    5: "#12B76A",
  };
  const filledColor = fillColors[filledCount] ?? "#12B76A";
  /** Empty / zero-rating stars: visible gray (transparent + #E4E7EC was nearly invisible on white). */
  const emptyStarBg = "#F2F4F7";
  const emptyStarBorder = "#D0D5DD";
  const emptyStarGlyph = "#98A2B3";

  return (
    <div className="flex items-center gap-1">
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
                backgroundColor: isFilled ? filledColor : emptyStarBg,
                border: `1px solid ${isFilled ? filledColor : emptyStarBorder}`,
                color: isFilled ? "#FFFFFF" : emptyStarGlyph,
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
