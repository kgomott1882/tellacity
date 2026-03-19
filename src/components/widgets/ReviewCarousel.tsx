import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";

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
export default function ReviewCarousel({ payload }: { payload: WidgetPayload }) {
  const reviews = (payload.reviews ?? []).slice(0, 10);
  const profileUrl = `https://tellacity.com/b/${payload.slug}`;

  if (reviews.length === 0) {
    return (
      <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 13, color: "#6b7280", padding: 16 }}>
        No reviews yet.
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", maxWidth: 420 }}>
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
              background: "#fff",
              border: "1.5px solid #e5e7eb",
              borderRadius: 12,
              boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
              padding: "14px 16px",
            }}
          >
            {/* Business header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              {payload.logo_url && (
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "#f9fafb", border: "1px solid #e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2 }}>
                  <img src={payload.logo_url} alt="" style={{ width: "98%", height: "98%", objectFit: "contain", display: "block" }} />
                </div>
              )}
              <span style={{ fontSize: 12, fontWeight: 600, color: "#374151" }}>{payload.business_name}</span>
            </div>

            <WidgetStars rating={review.rating} />
            {review.title && (
              <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: "#111827" }}>{review.title}</div>
            )}
            <div style={{ marginTop: 4, fontSize: 13, color: "#374151", lineHeight: 1.5 }}>
              {clampBody(review.body)}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af" }}>
              {review.reviewer_name ?? "Anonymous"} · {formatDate(review.created_at)}
            </div>

            <div style={{ marginTop: 12, borderTop: "1px solid #f3f4f6", paddingTop: 8 }}>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#2fb2a8", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
              >
                Verified by{" "}
                <img src="/brand/appicon.png.png" alt="Tellacity" style={{ width: 13, height: 13, objectFit: "contain", borderRadius: 3 }} />
                <strong style={{ color: "#000" }}>Tellacity</strong> →
              </a>
            </div>
          </div>
        ))}
      </div>

      {reviews.length > 1 && (
        <div style={{ marginTop: 8, fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
          Scroll to see more reviews
        </div>
      )}
    </div>
  );
}
