import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";
import WidgetBrandLogoSlot from "./WidgetBrandLogoSlot";
import { minimalClearFrame } from "@/lib/widgetMinimalSurface";
import { TELLACITY_BRAND_ICON_SRC } from "@/lib/emailBranding";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" });
  } catch {
    return iso;
  }
}

function clampBody(text: string | null, max = 140) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

export default function ReviewList({
  payload,
  dashboardDemo,
  showTellacityLogo = true,
  minimal,
  showBusinessName = true,
}: {
  payload: WidgetPayload;
  dashboardDemo?: boolean;
  showTellacityLogo?: boolean;
  minimal?: boolean;
  showBusinessName?: boolean;
}) {
  const realReviews = payload.reviews ?? [];
  const demoReviews =
    realReviews.length === 0 && dashboardDemo
      ? [
          {
            id: "demo-review-1",
            rating: 5,
            title: "Great service",
            body: "Very professional, quick turnaround, and great communication throughout.",
            reviewer_name: "A. Customer",
            created_at: "2026-01-15T09:20:00.000Z",
          },
          {
            id: "demo-review-2",
            rating: 4,
            title: "Smooth experience",
            body: "Helpful team and good quality work. Would happily recommend them.",
            reviewer_name: "S. Patel",
            created_at: "2026-01-10T14:10:00.000Z",
          },
        ]
      : [];
  const reviews = realReviews.length > 0 ? realReviews : demoReviews;
  const profileUrl = `https://tellacity.com/b/${payload.slug}`;

  const outer = minimalClearFrame(
    {
      fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, sans-serif)",
      background: "transparent",
      border: "none",
      borderRadius: 0,
      boxShadow: "none",
      overflow: "hidden",
      maxWidth: minimal ? "100%" : 420,
      color: "var(--tc-widget-text-color, #0E0E0E)",
      borderTop: minimal ? "none" : "1px solid #D1D5DB",
      borderBottom: minimal ? "none" : "1px solid #D1D5DB",
    },
    minimal,
  );

  return (
    <div style={outer}>
      <div
        style={{
          padding: minimal ? "8px 0" : "12px 16px",
          borderBottom: minimal ? "none" : "1px solid #D1D5DB",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <WidgetBrandLogoSlot
          payload={payload}
          dashboardDemo={dashboardDemo}
          minimal={minimal}
          size={34}
        />
        <div>
          {showBusinessName ? (
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
            {payload.business_name}
          </div>
          ) : null}
          <div style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
            {(Number(payload.avg_rating) || 0).toFixed(1)} · {payload.review_count} reviews
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <div style={{ padding: minimal ? "8px 0" : "16px", fontSize: 13, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
          No reviews yet.
        </div>
      ) : (
        reviews.map((review, i) => (
          <div
            key={review.id}
            style={{
              padding: minimal ? "10px 0" : "12px 16px",
              borderBottom:
                minimal || i >= reviews.length - 1 ? "none" : "1px solid #E5E7EB",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <WidgetStars rating={review.rating} size={12} />
              <span style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
                {formatDate(review.created_at)}
              </span>
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "var(--tc-widget-text-color, #0E0E0E)", lineHeight: 1.5 }}>
              {clampBody(review.body)}
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
              - {review.reviewer_name ?? "Anonymous"}
            </div>
          </div>
        ))
      )}

      <div
        style={{
          padding: minimal ? "8px 0 0" : "10px 16px",
          borderTop: minimal ? "none" : "1px solid #D1D5DB",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {showTellacityLogo ? (
            <>
              Verified by{" "}
              <img
                src={TELLACITY_BRAND_ICON_SRC}
                alt="Tellacity"
                width={20}
                height={20}
                style={{ width: 13, height: 13, objectFit: "contain", borderRadius: 3 }}
              />
              <span style={{ color: "var(--tc-widget-text-color, #0E0E0E)", fontWeight: 600 }}>Tellacity</span>
            </>
          ) : null}
        </span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "var(--tc-widget-text-color, #000000)", textDecoration: "none", fontWeight: 500 }}
        >
          View all reviews →
        </a>
      </div>
    </div>
  );
}
