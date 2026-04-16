"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";
import { minimalClearFrame } from "@/lib/widgetMinimalSurface";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";
import { postTellacityWidgetHeightToParent } from "@/lib/widgetEmbedParentResize";
import {
  TELLACITY_STAR_EMPTY_FILL,
  TELLACITY_STAR_EMPTY_ICON,
  TELLACITY_STAR_TIER_COLORS,
} from "@/lib/tellacityStarColors";
import { buildWidgetEmbedDemoReviews } from "@/lib/widgetDashboardDemoPayload";

const MAX_DROPDOWN_REVIEWS = 20;

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

/** Same half-star blocks as Tellacity Score / Spotlight (compact for ~30px row). */
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
  box,
  starSize,
}: {
  fill: number;
  tierColor: string | null;
  box: number;
  starSize: number;
}) {
  const f = Math.min(1, Math.max(0, fill));
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

function clampBody(text: string | null, max = 120) {
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

/**
 * Trustpilot-style “See our reviews” row with Tellacity block stars; opens a panel of recent reviews.
 */
export default function ReviewDropdownWidget({
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
  const realReviews = (payload.reviews ?? []).slice(0, MAX_DROPDOWN_REVIEWS);
  const demoReviews = useMemo(
    () => (realReviews.length === 0 && dashboardDemo ? buildWidgetEmbedDemoReviews() : []),
    [realReviews.length, dashboardDemo],
  );
  const reviews = useMemo(
    () => (realReviews.length > 0 ? realReviews : demoReviews).slice(0, MAX_DROPDOWN_REVIEWS),
    [realReviews, demoReviews],
  );

  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const profileUrl = `https://tellacity.com/b/${payload.slug}`;
  const raw = Number(payload.avg_rating);
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
  const count = Math.max(0, Math.floor(Number(payload.review_count) || 0));

  const roundedTier = Math.max(0, Math.min(5, Math.round(rating)));
  const tierColor =
    count > 0 && rating > 0 && roundedTier >= 1
      ? FILL_COLORS[roundedTier] ?? TELLACITY_STAR_TIER_COLORS[4]
      : null;

  const box = 18;
  const starSize = 11;
  const gap = 2;

  const notifyHeight = useCallback(() => {
    postTellacityWidgetHeightToParent();
  }, []);

  useLayoutEffect(() => {
    notifyHeight();
    const t0 = window.setTimeout(notifyHeight, 0);
    const t1 = window.setTimeout(notifyHeight, 80);
    const t2 = window.setTimeout(notifyHeight, 200);
    return () => {
      clearTimeout(t0);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [open, reviews.length, notifyHeight]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    let ro: ResizeObserver | undefined;
    if (typeof ResizeObserver !== "undefined" && document.body) {
      ro = new ResizeObserver(() => notifyHeight());
      ro.observe(document.body);
    }
    return () => ro?.disconnect();
  }, [notifyHeight, open]);

  const text = "var(--tc-widget-text-color, #111827)";
  const muted = "#6B7280";

  const baseFrame: CSSProperties = {
    fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, Segoe UI, sans-serif)",
    color: text,
    boxSizing: "border-box",
  };

  const shell = minimalClearFrame({ ...baseFrame, padding: 0 }, true);

  const chevronStyle: CSSProperties = {
    display: "inline-block",
    width: 0,
    height: 0,
    borderLeft: "4px solid transparent",
    borderRight: "4px solid transparent",
    borderTop: `5px solid var(--tc-widget-text-color, #111827)`,
    transform: open ? "rotate(180deg)" : "none",
    transition: "transform 0.15s ease",
    marginLeft: 2,
    verticalAlign: "middle",
  };

  return (
    <div ref={rootRef} style={{ ...shell, position: "relative", display: "inline-block", maxWidth: "100%" }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls="tellacity-review-dropdown-panel"
        id="tellacity-review-dropdown-trigger"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
          margin: 0,
          padding: "4px 2px",
          border: "none",
          background: "transparent",
          cursor: "pointer",
          font: "inherit",
          color: text,
          textAlign: "left",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            flexDirection: "row",
            gap,
            alignItems: "center",
          }}
          aria-label={count > 0 ? `${rating.toFixed(1)} out of 5 average` : "No rating yet"}
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <ScoreStarBlock
              key={i}
              fill={tierColor ? Math.min(1, Math.max(0, rating - i)) : 0}
              tierColor={tierColor}
              box={box}
              starSize={starSize}
            />
          ))}
        </span>
        <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap" }}>
          See our reviews
        </span>
        <span style={chevronStyle} aria-hidden />
      </button>

      {open ? (
        <div
          id="tellacity-review-dropdown-panel"
          role="region"
          aria-label="Recent reviews"
          style={{
            position: "absolute",
            left: 0,
            top: "100%",
            marginTop: 6,
            zIndex: 50,
            minWidth: 255,
            width: "max(255px, 100%)",
            maxWidth: 380,
            maxHeight: 320,
            overflowY: "auto",
            overflowX: "hidden",
            backgroundColor: "transparent",
            border: "none",
            borderRadius: 10,
            boxShadow: "none",
            textAlign: "left",
          }}
        >
          {reviews.length === 0 ? (
            <div style={{ padding: "14px 16px", fontSize: 13, color: muted }}>
              {realReviews.length === 0 && !dashboardDemo
                ? "No reviews yet. Invite customers to leave feedback on Tellacity."
                : null}
            </div>
          ) : (
            <ul style={{ listStyle: "none", margin: 0, padding: 0 }}>
              {reviews.map((r, idx) => {
                const headline = (r.title?.trim() || "Review").slice(0, 80);
                const name = r.reviewer_name ?? "Anonymous";
                const rel = formatRelativeTime(r.created_at);
                const isLast = idx === reviews.length - 1;
                return (
                  <li
                    key={r.id}
                    style={{
                      padding: "10px 4px 12px",
                      borderBottom: isLast ? "none" : "1px solid rgba(229, 231, 235, 0.55)",
                      backgroundColor: "transparent",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                        marginBottom: 6,
                      }}
                    >
                      <WidgetStars rating={r.rating} size={11} />
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: text,
                        marginBottom: 4,
                        lineHeight: 1.3,
                      }}
                    >
                      {headline}
                    </div>
                    <div style={{ fontSize: 12, color: text, lineHeight: 1.45, marginBottom: 6 }}>
                      {clampBody(r.body)}
                    </div>
                    <div style={{ fontSize: 11, color: muted }}>
                      <strong style={{ fontWeight: 600 }}>{name}</strong>
                      {rel ? ` · ${rel}` : ""}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <div
            style={{
              padding: "10px 4px 6px",
              borderTop: "1px solid rgba(229, 231, 235, 0.55)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              backgroundColor: "transparent",
            }}
          >
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: text,
                textDecoration: "underline",
                textUnderlineOffset: 2,
              }}
            >
              View all on Tellacity
            </a>
            {showTellacityLogo ? (
              <img
                src={TELLACITY_TRUST_BADGE_LOGO_PATH}
                alt="Tellacity"
                style={{
                  height: 14,
                  width: "auto",
                  maxWidth: 100,
                  objectFit: "contain",
                  display: "block",
                }}
              />
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
