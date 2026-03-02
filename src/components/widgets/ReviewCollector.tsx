import type { WidgetPayload } from "./types";

export default function ReviewCollector({ payload }: { payload: WidgetPayload }) {
  const writeUrl = `https://tellacity.com/b/${payload.slug}/write-review`;

  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "#fff",
      border: "1.5px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      padding: "14px 16px",
      maxWidth: 420,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
    }}>
      {/* Left: branding */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {payload.logo_url && (
          <div style={{ width: 36, height: 36, borderRadius: 6, background: "#f9fafb", border: "1px solid #e5e7eb", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", padding: 2 }}>
            <img
              src={payload.logo_url}
              alt={payload.business_name}
              style={{ width: "98%", height: "98%", objectFit: "contain", display: "block" }}
            />
          </div>
        )}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
            {payload.business_name}
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
            Verified by{" "}
            <img src="/brand/appicon.png.png" alt="Tellacity" style={{ width: 12, height: 12, objectFit: "contain", borderRadius: 2 }} />
            <span style={{ color: "#000", fontWeight: 600 }}>Tellacity</span>
          </div>
        </div>
      </div>

      {/* Right: CTA button */}
      <a
        href={writeUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "8px 14px",
          background: "#f9fafb",
          color: "#111827",
          border: "1.5px solid #e5e7eb",
          borderRadius: 8,
          textDecoration: "none",
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
        }}
      >
        <span aria-hidden="true">⭐</span>
        Write a review
      </a>
    </div>
  );
}
