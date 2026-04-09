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
}: {
  payload: WidgetPayload;
  dashboardDemo?: boolean;
}) {
  const reviews = (payload.reviews ?? []).slice(0, 5);
  const profileUrl = `https://tellacity.com/b/${payload.slug}`;

  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "#fff",
      border: "1.5px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      overflow: "hidden",
      maxWidth: 420,
    }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: "1px solid #f3f4f6", display: "flex", alignItems: "center", gap: 10 }}>
        <WidgetBrandLogoSlot payload={payload} dashboardDemo={dashboardDemo} size={34} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{payload.business_name}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>
            {(Number(payload.avg_rating) || 0).toFixed(1)} · {payload.review_count} reviews
          </div>
        </div>
      </div>

      {/* Reviews */}
      {reviews.length === 0 ? (
        <div style={{ padding: "16px", fontSize: 13, color: "#6b7280" }}>No reviews yet.</div>
      ) : (
        reviews.map((review, i) => (
          <div
            key={review.id}
            style={{
              padding: "12px 16px",
              borderBottom: i < reviews.length - 1 ? "1px solid #f3f4f6" : "none",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <WidgetStars rating={review.rating} size={12} />
              <span style={{ fontSize: 11, color: "#9ca3af" }}>{formatDate(review.created_at)}</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              {clampBody(review.body)}
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: "#9ca3af" }}>
              - {review.reviewer_name ?? "Anonymous"}
            </div>
          </div>
        ))
      )}

      {/* Footer */}
      <div style={{ padding: "10px 16px", borderTop: "1px solid #f3f4f6", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "#9ca3af", display: "inline-flex", alignItems: "center", gap: 4 }}>
          Verified by{" "}
          <img src={TELLACITY_BRAND_ICON_SRC} alt="Tellacity" width={20} height={20} style={{ width: 13, height: 13, objectFit: "contain", borderRadius: 3 }} />
          <span style={{ color: "#000", fontWeight: 600 }}>Tellacity</span>
        </span>
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 11, color: "#2fb2a8", textDecoration: "none", fontWeight: 500 }}
        >
          View all reviews →
        </a>
      </div>
    </div>
  );
}
