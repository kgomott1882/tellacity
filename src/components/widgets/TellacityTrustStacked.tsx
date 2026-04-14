import type { WidgetPayload } from "./types";
import {
  TELLACITY_STAR_EMPTY_FILL,
  TELLACITY_STAR_EMPTY_ICON,
  tellacityActiveStarColorForRating,
} from "@/lib/tellacityStarColors";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";

function StarCell({
  fill,
  activeColor,
}: {
  fill: number;
  activeColor: string;
}) {
  const clamped = Math.min(1, Math.max(0, fill));
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        width: 26,
        height: 26,
        borderRadius: 2,
        overflow: "hidden",
        background: TELLACITY_STAR_EMPTY_FILL,
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
          background: `var(--tc-widget-active-star-color, ${activeColor})`,
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
          fontSize: 16,
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        ★
      </span>
    </span>
  );
}

export default function TellacityTrustStacked({
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
  const statusLabel = hasStats ? "Excellent" : "No reviews yet";
  const href = `https://tellacity.com/b/${payload.slug}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        gap: 10,
        textDecoration: "none",
        color: "var(--tc-widget-text-color, #0E0E0E)",
        fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, Segoe UI, sans-serif)",
        ...(minimal ? { padding: 0 } : {}),
      }}
    >
      <span
        style={{
          fontSize: hasStats ? 30 : 24,
          fontWeight: 400,
          lineHeight: 1,
          color: "var(--tc-widget-text-color, #000000)",
        }}
      >
        {statusLabel}
      </span>

      <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <StarCell
            key={i}
            fill={hasStats ? rating - i : 0}
            activeColor={activeStarColor}
          />
        ))}
      </span>

      <span style={{ fontSize: 16, lineHeight: 1.25 }}>
        Based on{" "}
        <span style={{ textDecoration: "underline", textUnderlineOffset: 2 }}>
          {reviewCount.toLocaleString("en-US")} {reviewCount === 1 ? "review" : "reviews"}
        </span>
      </span>

      {showTellacityLogo ? (
        <img
          src={TELLACITY_TRUST_BADGE_LOGO_PATH}
          alt="Tellacity"
          style={{
            height: 24,
            width: "auto",
            maxWidth: 160,
            objectFit: "contain",
            objectPosition: "center",
            display: "block",
          }}
        />
      ) : null}
    </a>
  );
}
