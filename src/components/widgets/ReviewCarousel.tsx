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

function clampBody(text: string | null, max = 180) {
  if (!text) return "";
  return text.length > max ? text.slice(0, max).trimEnd() + "…" : text;
}

/**
 * Pure server component - no useState, no hydration mismatch.
 * Renders all reviews in a horizontally scrollable row.
 * JavaScript-free navigation via CSS scroll-snap.
 */
export default function ReviewCarousel({
  payload,
  dashboardDemo,
  showTellacityLogo = true,
}: {
  payload: WidgetPayload;
  dashboardDemo?: boolean;
  showTellacityLogo?: boolean;
}) {
  const reviews = (payload.reviews ?? []).slice(0, 10);
  const profileUrl = `https://tellacity.com/b/${payload.slug}`;

  if (reviews.length === 0) {
    return (
      <div
        style={{
          fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, sans-serif)",
          maxWidth: 420,
          borderTop: "1px solid #D1D5DB",
          borderBottom: "1px solid #D1D5DB",
          padding: "12px 16px",
          color: "var(--tc-widget-text-color, #0E0E0E)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <WidgetBrandLogoSlot payload={payload} dashboardDemo={dashboardDemo} size={28} fontSize={8} />
          <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tc-widget-text-color, #0E0E0E)" }}>{payload.business_name}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <WidgetStars rating={payload.avg_rating} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
            {(Number(payload.avg_rating) || 0).toFixed(1)}
          </span>
          <span style={{ fontSize: 12, color: "var(--tc-widget-text-color, #0E0E0E)" }}>({payload.review_count})</span>
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: "var(--tc-widget-text-color, #0E0E0E)" }}>No reviews yet.</div>
        <div style={{ marginTop: 10, borderTop: "1px solid #D1D5DB", paddingTop: 8 }}>
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
          >
            {showTellacityLogo ? (
              <>
                Verified by{" "}
                <img src={TELLACITY_BRAND_ICON_SRC} alt="Tellacity" width={20} height={20} style={{ width: 13, height: 13, objectFit: "contain", borderRadius: 3 }} />
                <strong style={{ color: "var(--tc-widget-text-color, #0E0E0E)" }}>Tellacity</strong> ·{" "}
              </>
            ) : null}
            <span style={{ color: "var(--tc-widget-accent-color, var(--tc-widget-text-color, #0E0E0E))" }}>View reviews →</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, sans-serif)",
        maxWidth: 420,
        borderTop: "1px solid #D1D5DB",
        borderBottom: "1px solid #D1D5DB",
      }}
    >
      {/* Scrollable track */}
      <div style={{
        display: "flex",
        gap: 12,
        overflowX: "auto",
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
        paddingBottom: 4,
        scrollbarWidth: "none",
      }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              flexShrink: 0,
              width: "100%",
              scrollSnapAlign: "start",
              background: "transparent",
              border: "none",
              borderRadius: 0,
              boxShadow: "none",
              padding: "14px 16px",
            }}
          >
            {/* Business header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <WidgetBrandLogoSlot payload={payload} dashboardDemo={dashboardDemo} size={28} fontSize={8} />
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--tc-widget-text-color, #0E0E0E)" }}>{payload.business_name}</span>
            </div>

            <WidgetStars rating={review.rating} />
            {review.title && (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: "var(--tc-widget-text-color, #0E0E0E)" }}>{review.title}</div>
            )}
            <div style={{ marginTop: 4, fontSize: 13, color: "var(--tc-widget-text-color, #0E0E0E)", lineHeight: 1.5 }}>
              {clampBody(review.body)}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
              {review.reviewer_name ?? "Anonymous"} · {formatDate(review.created_at)}
            </div>

            <div style={{ marginTop: 12, borderTop: "1px solid #D1D5DB", paddingTop: 8 }}>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                {showTellacityLogo ? (
                  <>
                    Verified by{" "}
                    <img src={TELLACITY_BRAND_ICON_SRC} alt="Tellacity" width={20} height={20} style={{ width: 13, height: 13, objectFit: "contain", borderRadius: 3 }} />
                    <strong style={{ color: "var(--tc-widget-text-color, #0E0E0E)" }}>Tellacity</strong>{" "}
                  </>
                ) : null}
                <span style={{ color: "var(--tc-widget-accent-color, var(--tc-widget-text-color, #0E0E0E))" }}>→</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <div style={{ marginTop: 8, fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)", textAlign: "center" }}>
          Scroll to see more reviews
        </div>
      )}
    </div>
  );
}
