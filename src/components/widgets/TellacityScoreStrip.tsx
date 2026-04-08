import type { WidgetPayload } from "./types";
import { TELLACITY_BRAND_ICON_SRC } from "@/lib/emailBranding";
import { TELLACITY_STAR_EMPTY_BORDER, TELLACITY_STAR_TIER_COLORS } from "@/lib/tellacityStarColors";

const FILL_COLORS: Record<number, string> = {
  1: TELLACITY_STAR_TIER_COLORS[0],
  2: TELLACITY_STAR_TIER_COLORS[1],
  3: TELLACITY_STAR_TIER_COLORS[2],
  4: TELLACITY_STAR_TIER_COLORS[3],
  5: TELLACITY_STAR_TIER_COLORS[4],
};
const EMPTY_COLOR = TELLACITY_STAR_EMPTY_BORDER;

/** Same star glyph + stroke as WidgetStars (Tellacity widget stars). */
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

function ScoreStarBlock({
  fill,
  tierColor,
}: {
  fill: number;
  tierColor: string | null;
}) {
  const f = Math.min(1, Math.max(0, fill));
  const box = 22;
  const starSize = 14;

  if (f <= 0 || !tierColor) {
    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: box,
          height: box,
          borderRadius: 3,
          backgroundColor: "transparent",
          border: `1px solid ${EMPTY_COLOR}`,
          flexShrink: 0,
        }}
      >
        <StarSVG size={starSize} color={EMPTY_COLOR} />
      </span>
    );
  }

  return (
    <span
      style={{
        position: "relative",
        width: box,
        height: box,
        borderRadius: 3,
        overflow: "hidden",
        border: `1px solid ${tierColor}`,
        flexShrink: 0,
        backgroundColor: EMPTY_COLOR,
      }}
    >
      <span
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: `${f * 100}%`,
          background: tierColor,
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

/**
 * Trustpilot-style score strip with Tellacity tier colors + WidgetStars-style glyphs.
 */
export default function TellacityScoreStrip({ payload }: { payload: WidgetPayload }) {
  const url = `https://tellacity.com/b/${payload.slug}`;
  const raw = Number(payload.avg_rating);
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
  const displayScore =
    payload.avg_rating != null && Number.isFinite(raw) ? rating.toFixed(1) : "—";
  const count = Math.max(0, Math.floor(Number(payload.review_count) || 0));

  const roundedTier = Math.max(0, Math.min(5, Math.round(rating)));
  const tierColor =
    count > 0 && rating > 0 && roundedTier >= 1
      ? FILL_COLORS[roundedTier] ?? TELLACITY_STAR_TIER_COLORS[4]
      : null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-block",
        maxWidth: 320,
        textDecoration: "none",
        color: "#111827",
        fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          padding: "4px 0",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <img
            src={TELLACITY_BRAND_ICON_SRC}
            alt=""
            width={22}
            height={22}
            style={{ width: 22, height: 22, borderRadius: 4, objectFit: "contain", display: "block" }}
          />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: "#0E0E0E" }}>
            Tellacity
          </span>
        </div>

        <div
          style={{ display: "flex", flexDirection: "row", gap: 3, alignItems: "center" }}
          aria-label={`${rating.toFixed(1)} out of 5 average`}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <ScoreStarBlock
              key={i}
              fill={tierColor ? Math.min(1, Math.max(0, rating - i)) : 0}
              tierColor={tierColor}
            />
          ))}
        </div>

        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.45,
            color: "#111827",
          }}
        >
          <span style={{ fontWeight: 400 }}>Tellacity Score </span>
          <strong style={{ fontWeight: 700 }}>{displayScore}</strong>
          <span style={{ fontWeight: 400, color: "#6b7280" }}> | </span>
          <strong style={{ fontWeight: 700 }}>{count}</strong>
          <span style={{ fontWeight: 400 }}> </span>
          <span style={{ fontWeight: 400, textDecoration: "underline", textUnderlineOffset: 2 }}>
            reviews
          </span>
        </p>
      </div>
    </a>
  );
}
