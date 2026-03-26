import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";

function TellacityStarIcon() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 16,
        height: 16,
        borderRadius: 3,
        backgroundColor: "#FEC84B",
        border: "1px solid #FEC84B",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      <svg
        width={10}
        height={10}
        viewBox="0 0 24 24"
        fill="#fff"
        stroke="#fff"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
      </svg>
    </span>
  );
}

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
          <div style={{ marginTop: 3 }}>
            <WidgetStars rating={payload.avg_rating} size={11} />
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
        <TellacityStarIcon />
        Write a review
      </a>
    </div>
  );
}
