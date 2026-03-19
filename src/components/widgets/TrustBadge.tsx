import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";

export default function TrustBadge({ payload }: { payload: WidgetPayload }) {
  const url = `https://tellacity.com/b/${payload.slug}`;
  const avg = payload.avg_rating != null ? (Number(payload.avg_rating) || 0).toFixed(1) : "-";

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "12px 16px",
        background: "#fff",
        border: "1.5px solid #e5e7eb",
        borderRadius: 12,
        boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        textDecoration: "none",
        color: "inherit",
        fontFamily: "system-ui, -apple-system, sans-serif",
        maxWidth: 340,
      }}
    >
      {payload.logo_url && (
        <div style={{ width: 44, height: 44, borderRadius: 8, background: "#f9fafb", border: "1px solid #e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2 }}>
          <img
            src={payload.logo_url}
            alt={payload.business_name}
            style={{ width: "98%", height: "98%", objectFit: "contain", display: "block" }}
          />
        </div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#111827", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {payload.business_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <WidgetStars rating={payload.avg_rating} size={13} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>{avg}</span>
          <span style={{ fontSize: 12, color: "#6b7280" }}>({payload.review_count})</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "#6b7280", display: "flex", alignItems: "center", gap: 4 }}>
          Verified by{" "}
          <img src="/brand/appicon.png.png" alt="Tellacity" style={{ width: 14, height: 14, objectFit: "contain", display: "inline-block", verticalAlign: "middle", borderRadius: 3 }} />
          <span style={{ color: "#000", fontWeight: 600 }}>Tellacity</span>
          {" · "}
          <span style={{ color: "#2fb2a8" }}>View reviews →</span>
        </div>
      </div>
    </a>
  );
}
