"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { WidgetPayload, WidgetReview } from "./types";
import WidgetStars from "./WidgetStars";
import { minimalClearFrame } from "@/lib/widgetMinimalSurface";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";
import { postTellacityWidgetHeightToParent } from "@/lib/widgetEmbedParentResize";

const MAX_SLIDER_REVIEWS = 15;
const VISIBLE_CARDS = 4;

function clampBody(text: string | null, max = 140) {
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
        gap: compact ? 3 : 4,
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

/** Floating column (no card chrome) so the strip works on any site background. */
function SliderReviewCard({
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
        flex: "1 1 0",
        minWidth: 0,
        boxSizing: "border-box",
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
      <div style={{ fontSize: 12, color: text, lineHeight: 1.45 }}>{clampBody(review.body)}</div>
    </div>
  );
}

function buildDemoReviews(): WidgetReview[] {
  const now = Date.now();
  return [
    {
      id: "slider-demo-1",
      rating: 5,
      title: "This was awesome!",
      body: "Never had a better experience than with this awesome company.",
      reviewer_name: "Steve",
      created_at: new Date(now - 2 * 60 * 1000).toISOString(),
    },
    {
      id: "slider-demo-2",
      rating: 5,
      title: "Highly recommended",
      body: "Friendly service, quick turnaround, and reliable support from start to finish.",
      reviewer_name: "T. Mokoena",
      created_at: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "slider-demo-3",
      rating: 4,
      title: "Solid choice",
      body: "Good value and clear communication throughout the project.",
      reviewer_name: "A. Naidoo",
      created_at: new Date(now - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "slider-demo-4",
      rating: 5,
      title: "Would use again",
      body: "Professional team and delivered on time.",
      reviewer_name: "J. Pillay",
      created_at: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "slider-demo-5",
      rating: 4,
      title: "Great experience",
      body: "Clear process from quote to completion. Would recommend to others.",
      reviewer_name: "Ronald Makhubela",
      created_at: new Date(now - 13 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Trustpilot-style slider: floating review columns (no per-review cards), prev/next arrows, summary footer with Tellacity Trust Stacked mark.
 */
export default function ReviewSliderWidget({
  payload,
  dashboardDemo,
  showTellacityLogo = true,
  minimal,
}: {
  payload: WidgetPayload;
  dashboardDemo?: boolean;
  showTellacityLogo?: boolean;
  minimal?: boolean;
}) {
  const realReviews = (payload.reviews ?? []).slice(0, MAX_SLIDER_REVIEWS);
  const demoReviews = useMemo(
    () => (realReviews.length === 0 && dashboardDemo ? buildDemoReviews() : []),
    [realReviews.length, dashboardDemo],
  );
  const reviews = useMemo(
    () => (realReviews.length > 0 ? realReviews : demoReviews).slice(0, MAX_SLIDER_REVIEWS),
    [realReviews, demoReviews],
  );

  const visible = Math.min(VISIBLE_CARDS, Math.max(1, reviews.length));
  const maxOffset = Math.max(0, reviews.length - visible);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    setOffset((o) => Math.min(o, maxOffset));
  }, [maxOffset, reviews.length]);

  const profileUrl = `https://tellacity.com/b/${payload.slug}`;
  const raw = Number(payload.avg_rating);
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
  const displayScore =
    payload.avg_rating != null && Number.isFinite(raw) ? rating.toFixed(1) : "-";
  const count = Math.max(0, Math.floor(Number(payload.review_count) || 0));

  const windowed = reviews.slice(offset, offset + visible);
  const showArrows = reviews.length > visible;

  const goPrev = useCallback(() => setOffset((o) => Math.max(0, o - 1)), []);
  const goNext = useCallback(() => setOffset((o) => Math.min(maxOffset, o + 1)), [maxOffset]);

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
    offset,
    visible,
    reviews.length,
    minimal,
    dashboardDemo,
    payload.slug,
    payload.review_count,
    payload.avg_rating,
    realReviews.length,
    maxOffset,
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

  /** Always transparent shell so embeds sit cleanly on the host page background. */
  const cardShell: CSSProperties = minimalClearFrame({ ...baseFrame, padding: "8px 0 6px" }, true);

  const arrowBtn: CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 2,
    width: 36,
    height: 36,
    borderRadius: 9999,
    border: "1px solid #E5E7EB",
    background: "#ffffff",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    lineHeight: 1,
    color: text,
    padding: 0,
  };

  const hasReviews = reviews.length > 0;

  return (
    <div style={cardShell}>
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
        <div style={{ position: "relative", paddingLeft: showArrows ? 44 : 0, paddingRight: showArrows ? 44 : 0 }}>
          {showArrows ? (
            <button
              type="button"
              aria-label="Previous reviews"
              style={{ ...arrowBtn, left: 0, opacity: offset <= 0 ? 0.4 : 1 }}
              disabled={offset <= 0}
              onClick={goPrev}
            >
              ‹
            </button>
          ) : null}
          {showArrows ? (
            <button
              type="button"
              aria-label="Next reviews"
              style={{ ...arrowBtn, right: 0, opacity: offset >= maxOffset ? 0.4 : 1 }}
              disabled={offset >= maxOffset}
              onClick={goNext}
            >
              ›
            </button>
          ) : null}

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              gap: 12,
              width: "100%",
              alignItems: "stretch",
            }}
          >
            {windowed.map((r) => (
              <SliderReviewCard key={r.id} review={r} text={text} muted={muted} />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ fontSize: 13, color: text, padding: "8px 0 4px" }}>
          {realReviews.length === 0 && !dashboardDemo
            ? "No reviews yet. Invite customers to leave feedback on Tellacity."
            : null}
        </div>
      )}

      {hasReviews ? (
        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: "1px solid #E5E7EB",
            textAlign: "center",
          }}
        >
          <p style={{ margin: "0 0 7px", fontSize: 12, lineHeight: 1.45, color: muted }}>
            <strong style={{ color: text }}>Rated {displayScore} / 5</strong> based on{" "}
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontWeight: 600, color: text, textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              {count} {count === 1 ? "review" : "reviews"}
            </a>
            . Showing our latest reviews.
          </p>
          {showTellacityLogo ? (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "inline-flex", justifyContent: "center" }}
            >
              <img
                src={TELLACITY_TRUST_BADGE_LOGO_PATH}
                alt="Tellacity"
                style={{
                  height: 15,
                  width: "auto",
                  maxWidth: 108,
                  objectFit: "contain",
                  objectPosition: "center",
                  display: "block",
                }}
              />
            </a>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
