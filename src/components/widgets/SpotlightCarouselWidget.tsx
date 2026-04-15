"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo } from "react";
import type { WidgetPayload, WidgetReview } from "./types";
import WidgetBrandLogoSlot from "./WidgetBrandLogoSlot";
import WidgetStars from "./WidgetStars";
import { minimalClearFrame } from "@/lib/widgetMinimalSurface";
import { postTellacityWidgetHeightToParent } from "@/lib/widgetEmbedParentResize";
import {
  TELLACITY_STAR_EMPTY_FILL,
  TELLACITY_STAR_EMPTY_ICON,
  TELLACITY_STAR_TIER_COLORS,
} from "@/lib/tellacityStarColors";

const MAX_REVIEWS_ROW = 6;

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

/** Same half-star blocks as `TellacityScoreStrip` (aggregate header). */
function ScoreStarBlock({ fill, tierColor }: { fill: number; tierColor: string | null }) {
  const f = Math.min(1, Math.max(0, fill));
  const box = 22;
  const starSize = 14;
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
          borderRadius: 3,
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
        borderRadius: 3,
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

function clampCardBody(text: string | null, max = 110) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

function formatRelativeTime(iso: string): string {
  try {
    const d = new Date(iso);
    const t = d.getTime();
    if (Number.isNaN(t)) return "";
    const diffMs = Date.now() - t;
    const sec = Math.floor(diffMs / 1000);
    if (sec < 45) return "just now";
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min} minute${min === 1 ? "" : "s"} ago`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} hour${hr === 1 ? "" : "s"} ago`;
    const day = Math.floor(hr / 24);
    if (day < 14) return `${day} day${day === 1 ? "" : "s"} ago`;
    return d.toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

function VerifiedBadge({ compact }: { compact?: boolean }) {
  const ink = "var(--tc-widget-text-color, #111827)";
  const sz = compact ? 12 : 14;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 3,
        fontSize: compact ? 10 : 11,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      <svg width={sz} height={sz} viewBox="0 0 24 24" fill="none" aria-hidden>
        <circle cx="12" cy="12" r="10" fill={ink} />
        <path
          d="M8 12l2.5 2.5L16 9"
          stroke="white"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span style={{ color: ink }}>Verified</span>
    </span>
  );
}

function ReviewMiniCard({
  review,
  text,
  muted,
}: {
  review: WidgetReview;
  text: string;
  muted: string;
}) {
  const headline = (review.title?.trim() || "Great experience").toUpperCase();
  const rel = formatRelativeTime(review.created_at);
  const name = review.reviewer_name ?? "Anonymous";

  return (
    <div
      style={{
        boxSizing: "border-box",
        minWidth: 0,
        padding: "2px 4px 0",
        backgroundColor: "transparent",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
          marginBottom: 8,
          flexWrap: "wrap",
        }}
      >
        <WidgetStars rating={review.rating} size={10} />
        <VerifiedBadge compact />
      </div>
      <div style={{ fontSize: 11, color: muted, marginBottom: 8, lineHeight: 1.35 }}>
        <strong style={{ fontWeight: 600, color: muted }}>{name}</strong>
        {rel ? `, ${rel}` : ""}
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: text,
          letterSpacing: 0.02,
          lineHeight: 1.25,
          marginBottom: 6,
          textTransform: "uppercase",
        }}
      >
        {headline}
      </div>
      <div style={{ fontSize: 12, color: text, lineHeight: 1.45 }}>{clampCardBody(review.body)}</div>
    </div>
  );
}

/**
 * Trustpilot-style spotlight: score summary on top, latest reviews in a horizontal row.
 */
export default function SpotlightCarouselWidget({
  payload,
  dashboardDemo,
  showTellacityLogo: _showTellacityLogo = true,
  minimal,
}: {
  payload: WidgetPayload;
  dashboardDemo?: boolean;
  showTellacityLogo?: boolean;
  minimal?: boolean;
}) {
  const realReviews = (payload.reviews ?? []).slice(0, MAX_REVIEWS_ROW);
  const demoReviews: WidgetReview[] = useMemo(
    () =>
      realReviews.length === 0 && dashboardDemo
        ? [
            {
              id: "spotlight-demo-1",
              rating: 5,
              title: "This was awesome!",
              body: "Never had a better experience than with this awesome company.",
              reviewer_name: "Steve",
              created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
            },
            {
              id: "spotlight-demo-2",
              rating: 5,
              title: "Highly recommended",
              body: "Friendly service, quick turnaround, and reliable support from start to finish.",
              reviewer_name: "T. Mokoena",
              created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
              id: "spotlight-demo-3",
              rating: 4,
              title: "Solid choice",
              body: "Good value and clear communication throughout the project.",
              reviewer_name: "A. Naidoo",
              created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
          ]
        : [],
    [realReviews.length, dashboardDemo],
  );
  const reviews = useMemo(
    () => (realReviews.length > 0 ? realReviews : demoReviews).slice(0, MAX_REVIEWS_ROW),
    [realReviews, demoReviews],
  );

  const profileUrl = `https://tellacity.com/b/${payload.slug}`;
  const raw = Number(payload.avg_rating);
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
  const displayScore =
    payload.avg_rating != null && Number.isFinite(raw) ? rating.toFixed(1) : "-";
  const count = Math.max(0, Math.floor(Number(payload.review_count) || 0));

  const roundedTier = Math.max(0, Math.min(5, Math.round(rating)));
  const tierColor =
    count > 0 && rating > 0 && roundedTier >= 1
      ? FILL_COLORS[roundedTier] ?? TELLACITY_STAR_TIER_COLORS[4]
      : null;

  useEffect(() => {
    function tick() {
      postTellacityWidgetHeightToParent();
    }
    tick();
    const t0 = window.setTimeout(tick, 0);
    const t1 = window.setTimeout(tick, 120);
    const t2 = window.setTimeout(tick, 500);
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      ro = new ResizeObserver(() => tick());
      ro.observe(document.body);
    }
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
      ro?.disconnect();
    };
  }, [
    reviews.length,
    minimal,
    dashboardDemo,
    payload.slug,
    payload.review_count,
    payload.avg_rating,
    realReviews.length,
  ]);

  const text = "var(--tc-widget-text-color, #111827)";
  const muted = "#6B7280";

  const baseFrame: CSSProperties = {
    fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, Segoe UI, sans-serif)",
    width: "100%",
    maxWidth: "100%",
    minWidth: 0,
    boxSizing: "border-box",
    color: text,
  };

  const cardShell: CSSProperties = minimal
    ? minimalClearFrame({ ...baseFrame, padding: "8px 0" }, true)
    : {
        ...baseFrame,
        padding: "16px 18px",
        borderRadius: 12,
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(15, 23, 42, 0.06)",
      };

  const hasReviews = reviews.length > 0;

  return (
    <div style={cardShell}>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 10,
            flexWrap: "wrap",
          }}
        >
          <WidgetBrandLogoSlot
            payload={payload}
            dashboardDemo={dashboardDemo}
            minimal={minimal}
            size={32}
            fontSize={8}
          />
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: "-0.02em", color: text }}>
            {payload.business_name}
          </span>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: 3,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 10,
          }}
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

        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.45, color: text }}>
          <span style={{ fontWeight: 400 }}>Tellacity Score </span>
          <strong style={{ fontWeight: 700 }}>{displayScore}</strong>
          <span style={{ fontWeight: 400, color: text }}> | </span>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontWeight: 700,
              color: text,
              textDecoration: "underline",
              textUnderlineOffset: 2,
            }}
          >
            {count} {count === 1 ? "review" : "reviews"}
          </a>
        </p>
      </div>

      <div style={{ height: 1, background: "#E5E7EB", margin: "14px 0 12px" }} />

      <p
        style={{
          margin: "0 0 10px",
          fontSize: 11,
          fontWeight: 500,
          color: muted,
          textAlign: "left",
        }}
      >
        Showing our latest reviews
      </p>

      {hasReviews ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${reviews.length}, minmax(0, 1fr))`,
            gap: "12px 16px",
            width: "100%",
            alignItems: "start",
            paddingBottom: 2,
          }}
        >
          {reviews.map((r) => (
            <ReviewMiniCard key={r.id} review={r} text={text} muted={muted} />
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 13, color: text, padding: "8px 0 4px" }}>
          {realReviews.length === 0 && !dashboardDemo
            ? "No reviews yet. Invite customers to leave feedback on Tellacity."
            : null}
        </div>
      )}
    </div>
  );
}
