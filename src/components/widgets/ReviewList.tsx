import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";
import WidgetBrandLogoSlot from "./WidgetBrandLogoSlot";
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
}: {
  payload: WidgetPayload;
  dashboardDemo?: boolean;
  showTellacityLogo?: boolean;
}) {
  const reviews = (payload.reviews ?? []).slice(0, 5);
  const profileUrl = `https://tellacity.com/b/${payload.slug}`;

  return (
    <div style={{
      fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, sans-serif)",
      background: "transparent",
      border: "none",
      borderRadius: 0,
      boxShadow: "none",
      overflow: "hidden",
      maxWidth: 420,
      color: "var(--tc-widget-text-color, #0E0E0E)",
      borderTop: "1px solid #D1D5DB",
      borderBottom: "1px solid #D1D5DB",
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #D1D5DB", display: "flex", alignItems: "center", gap: 10 }}>
        <WidgetBrandLogoSlot payload={payload} dashboardDemo={dashboardDemo} size={34} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tc-widget-text-color, #0E0E0E)" }}>{payload.business_name}</div>
          <div style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
            {(Number(payload.avg_rating) || 0).toFixed(1)} · {payload.review_count} reviews
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div style={{ padding: "16px", fontSize: 13, color: "var(--tc-widget-text-color, #0E0E0E)" }}>No reviews yet.</div>
      ) : (
        reviews.map((review, i) => (
          <div
            key={review.id}
            style={{
              padding: "12px 16px",
              borderBottom: i < reviews.length - 1 ? "1px solid #E5E7EB" : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <WidgetStars rating={review.rating} size={12} />
              <span style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)" }}>{formatDate(review.created_at)}</span>
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

      {/* Footer */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #D1D5DB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)", display: "inline-flex", alignItems: "center", gap: 4 }}>
          {showTellacityLogo ? (
            <>
              Verified by{" "}
              <img src={TELLACITY_BRAND_ICON_SRC} alt="Tellacity" width={20} height={20} style={{ width: 13, height: 13, objectFit: "contain", borderRadius: 3 }} />
              <span style={{ color: "var(--tc-widget-text-color, #0E0E0E)", fontWeight: 600 }}>Tellacity</span>
            </>
          ) : null}
        </span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "var(--tc-widget-accent-color, var(--tc-widget-text-color, #0E0E0E))", textDecoration: "none", fontWeight: 500 }}
        >
          View all reviews →
        </a>
      </div>
    </div>
  );
}
