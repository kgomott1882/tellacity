import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";
import WidgetBrandLogoSlot from "./WidgetBrandLogoSlot";
import {
  TELLACITY_BRAND_ICON_SRC,
  getPublicAppOrigin,
  getPublicWriteReviewUrl,
} from "@/lib/emailBranding";

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

export default function ReviewCollector({
  payload,
  dashboardDemo,
}: {
  payload: WidgetPayload;
  dashboardDemo?: boolean;
}) {
  const writeUrl = getPublicWriteReviewUrl(getPublicAppOrigin(), payload.slug);

  return (
    <div style={{
      fontFamily: "system-ui, -apple-system, sans-serif",
      background: "#fff",
      border: "1px solid #e5e7eb",
      borderRadius: 12,
      boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
      padding: "20px 22px",
      maxWidth: 420,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 14,
    }}>
      {/* Left: branding */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <WidgetBrandLogoSlot payload={payload} dashboardDemo={dashboardDemo} size={36} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
            {payload.business_name}
          </div>
          <div style={{ marginTop: 3 }}>
            <WidgetStars rating={payload.avg_rating} size={11} />
          </div>
          <div style={{ fontSize: 11, color: "#6b7280", marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
            Verified by{" "}
            <img src={TELLACITY_BRAND_ICON_SRC} alt="Tellacity" width={20} height={20} style={{ width: 12, height: 12, objectFit: "contain", borderRadius: 2 }} />
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
          gap: 8,
          padding: "11px 20px",
          background: "#f9fafb",
          color: "#111827",
          border: "1px solid #d1d5db",
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
