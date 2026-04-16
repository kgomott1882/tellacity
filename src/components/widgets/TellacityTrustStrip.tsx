import type { WidgetPayload } from "./types";
import {
  TELLACITY_STAR_EMPTY_FILL,
  TELLACITY_STAR_EMPTY_ICON,
  tellacityActiveStarColorForRating,
} from "@/lib/tellacityStarColors";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";

function StarCell({ fill, color }: { fill: number; color: string }) {
  const clamped = Math.min(1, Math.max(0, fill));
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        width: 18,
        height: 18,
        borderRadius: 2,
        background: TELLACITY_STAR_EMPTY_FILL,
        overflow: "hidden",
        flexShrink: 0,
        border:
          clamped > 0
            ? "1px solid transparent"
            : "1px solid var(--tc-widget-empty-star-border, #9CA3AF)",
      }}
      aria-hidden
    >
      <span
        style={{
          position: "absolute",
          inset: 0,
          width: `${clamped * 100}%`,
          background: `var(--tc-widget-active-star-color, ${color})`,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: clamped > 0 ? "#ffffff" : TELLACITY_STAR_EMPTY_ICON,
          fontSize: 11,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        ★
      </span>
    </span>
  );
}

export default function TellacityTrustStrip({
  payload,
  showTellacityLogo = true,
  minimal,
}: {
  payload: WidgetPayload;
  showTellacityLogo?: boolean;
  minimal?: boolean;
}) {
  const raw = Number(payload.avg_rating ?? 0);
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
  const reviewCount = Math.max(0, Math.floor(Number(payload.review_count) || 0));
  const hasStats = reviewCount > 0 && rating > 0;
  const activeStarColor = tellacityActiveStarColorForRating(rating);
  const href = `https://tellacity.com/b/${payload.slug}`;
  const statusLabel = hasStats ? "Excellent" : "No reviews yet";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        boxSizing: "border-box",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        flexWrap: "wrap",
        gap: 8,
        background: "transparent",
        color: "var(--tc-widget-text-color, #0E0E0E)",
        textDecoration: "none",
        fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, Segoe UI, sans-serif)",
        borderRadius: 0,
        padding: minimal ? 0 : "8px 10px",
        textAlign: "center",
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
          color: "var(--tc-widget-text-color, #000000)",
        }}
      >
        {statusLabel}
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <StarCell key={i} fill={hasStats ? rating - i : 0} color={activeStarColor} />
        ))}
      </span>
      <span style={{ fontSize: 14, lineHeight: 1.2, textAlign: "center" }}>
        {hasStats ? (
          <>
            <strong style={{ fontWeight: 700 }}>{rating.toFixed(1)}</strong> out of 5 based on{" "}
            <strong style={{ fontWeight: 700 }}>{reviewCount.toLocaleString("en-US")} reviews</strong>
          </>
        ) : (
          "Be the first to leave a review"
        )}
      </span>
      {showTellacityLogo ? (
        <img
          src={TELLACITY_TRUST_BADGE_LOGO_PATH}
          alt="Tellacity"
          style={{
            height: 14,
            width: "auto",
            maxWidth: 132,
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
          }}
        />
      ) : null}
    </a>
  );
}
