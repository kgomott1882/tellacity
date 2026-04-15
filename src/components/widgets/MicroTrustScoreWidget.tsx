import type { CSSProperties } from "react";
import type { WidgetPayload } from "./types";
import { minimalClearFrame } from "@/lib/widgetMinimalSurface";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";
import {
  TELLACITY_STAR_EMPTY_FILL,
  TELLACITY_STAR_EMPTY_ICON,
  TELLACITY_STAR_TIER_COLORS,
} from "@/lib/tellacityStarColors";

const FILL_COLORS: Record<number, string> = {
  1: TELLACITY_STAR_TIER_COLORS[0],
  2: TELLACITY_STAR_TIER_COLORS[1],
  3: TELLACITY_STAR_TIER_COLORS[2],
  4: TELLACITY_STAR_TIER_COLORS[3],
  5: TELLACITY_STAR_TIER_COLORS[4],
};
const EMPTY_FILL = TELLACITY_STAR_EMPTY_FILL;
const EMPTY_ICON = TELLACITY_STAR_EMPTY_ICON;
const EMPTY_BORDER_CSS_VAR = "var(--tc-widget-empty-star-border, #9CA3AF)";

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
      aria-hidden
    >
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
    </svg>
  );
}

/** Tellacity tier block stars — compact for ~20–24px row height (Micro TrustScore). */
function ScoreStarBlock({
  fill,
  tierColor,
}: {
  fill: number;
  tierColor: string | null;
}) {
  const f = Math.min(1, Math.max(0, fill));
  const box = 15;
  const starSize = 9;
  const activeColor = tierColor
    ? `var(--tc-widget-active-star-color, ${tierColor})`
    : "var(--tc-widget-active-star-color, #12B76A)";

  if (f <= 0 || !tierColor) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: box,
          height: box,
          borderRadius: 2,
          backgroundColor: EMPTY_FILL,
          border: `1px solid ${EMPTY_BORDER_CSS_VAR}`,
          flexShrink: 0,
        }}
      >
        <StarSVG size={starSize} color={EMPTY_ICON} />
      </span>
    );
  }

  return (
    <span
      style={{
        position: "relative",
        width: box,
        height: box,
        borderRadius: 2,
        overflow: "hidden",
        border: `1px solid ${activeColor}`,
        flexShrink: 0,
        backgroundColor: EMPTY_FILL,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${f * 100}%`,
          background: activeColor,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <StarSVG size={starSize} color="#fff" />
      </span>
    </span>
  );
}

function trustWordForRating(rating: number, hasStats: boolean): string {
  if (!hasStats) return "Tellacity";
  if (rating >= 4.5) return "Excellent";
  if (rating >= 4) return "Great";
  if (rating >= 3.5) return "Good";
  if (rating >= 3) return "Fair";
  return "Growing";
}

/**
 * Trustpilot-style Micro TrustScore: one short word, “X.X out of 5”, Tellacity block stars, Trust Stacked mark.
 * Transparent, ~20–25px row — for headers and tight footers.
 */
export default function MicroTrustScoreWidget({
  payload,
  showTellacityLogo = true,
  minimal,
}: {
  payload: WidgetPayload;
  showTellacityLogo?: boolean;
  minimal?: boolean;
}) {
  const href = `https://tellacity.com/b/${payload.slug}`;
  const raw = Number(payload.avg_rating ?? 0);
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
  const reviewCount = Math.max(0, Math.floor(Number(payload.review_count) || 0));
  const hasStats = reviewCount > 0 && rating > 0;
  const display = hasStats ? rating.toFixed(1) : "—";

  const roundedTier = Math.max(0, Math.min(5, Math.round(rating)));
  const tierColor =
    hasStats && rating > 0 && roundedTier >= 1
      ? FILL_COLORS[roundedTier] ?? TELLACITY_STAR_TIER_COLORS[4]
      : null;

  const word = trustWordForRating(rating, hasStats);
  const text = "var(--tc-widget-text-color, #0E0E0E)";

  const base: CSSProperties = {
    fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, Segoe UI, sans-serif)",
    fontSize: 13,
    lineHeight: 1.2,
    color: text,
    boxSizing: "border-box",
  };

  const shell = minimalClearFrame({ ...base, padding: minimal ? 0 : "2px 0" }, true);

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        ...shell,
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        flexWrap: "nowrap",
        width: "max-content",
        maxWidth: "none",
        textDecoration: "none",
        whiteSpace: "nowrap",
      }}
    >
      <span
        style={{
          fontWeight: 800,
          letterSpacing: "-0.02em",
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        {word}
      </span>
      <span style={{ fontWeight: 400, whiteSpace: "nowrap", flexShrink: 0 }}>
        <span style={{ fontWeight: 600 }}>{display}</span> out of 5
      </span>
      <span
        style={{
          display: "inline-flex",
          flexDirection: "row",
          gap: 2,
          alignItems: "center",
          flexShrink: 0,
        }}
        aria-label={hasStats ? `${rating.toFixed(1)} out of 5` : "No rating"}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <ScoreStarBlock
            key={i}
            fill={tierColor ? Math.min(1, Math.max(0, rating - i)) : 0}
            tierColor={tierColor}
          />
        ))}
      </span>
      {showTellacityLogo ? (
        <img
          src={TELLACITY_TRUST_BADGE_LOGO_PATH}
          alt="Tellacity"
          style={{
            height: 12,
            width: "auto",
            maxWidth: 88,
            objectFit: "contain",
            display: "block",
            flexShrink: 0,
            alignSelf: "center",
          }}
        />
      ) : null}
    </a>
  );
}
