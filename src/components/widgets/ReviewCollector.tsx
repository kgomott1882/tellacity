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
        backgroundColor: "var(--tc-widget-active-star-color, #FEC84B)",
        border: "1px solid var(--tc-widget-active-star-color, #FEC84B)",
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
  showTellacityLogo = true,
  minimal,
}: {
  payload: WidgetPayload;
  dashboardDemo?: boolean;
  showTellacityLogo?: boolean;
  minimal?: boolean;
}) {
  const writeUrl = getPublicWriteReviewUrl(getPublicAppOrigin(), payload.slug);

  return (
    <div style={{
      fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, sans-serif)",
      background: "transparent",
      border: "none",
      borderRadius: 0,
      boxShadow: "none",
      padding: 0,
      maxWidth: 420,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      gap: 10,
    }}>
      {/* Left: branding */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <WidgetBrandLogoSlot payload={payload} dashboardDemo={dashboardDemo} minimal={minimal} size={36} />
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tc-widget-text-color, #0E0E0E)" }}>
            {payload.business_name}
          </div>
          <div style={{ marginTop: 3 }}>
            <WidgetStars rating={payload.avg_rating} size={11} />
          </div>
          {showTellacityLogo ? (
            <div style={{ fontSize: 11, color: "var(--tc-widget-text-color, #0E0E0E)", marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
              Verified by{" "}
              <img src={TELLACITY_BRAND_ICON_SRC} alt="Tellacity" width={20} height={20} style={{ width: 12, height: 12, objectFit: "contain", borderRadius: 2 }} />
              <span style={{ color: "var(--tc-widget-text-color, #0E0E0E)", fontWeight: 600 }}>Tellacity</span>
            </div>
          ) : null}
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
          padding: minimal ? "4px 0" : "11px 20px",
          background: "transparent",
          color: "var(--tc-widget-text-color, #0E0E0E)",
          border: minimal ? "none" : "1px solid var(--tc-widget-accent-color, #d1d5db)",
          borderRadius: minimal ? 0 : 8,
          textDecoration: minimal ? "underline" : "none",
          textUnderlineOffset: minimal ? 3 : undefined,
          fontSize: 13,
          fontWeight: 600,
          whiteSpace: "nowrap",
          flexShrink: 0,
          marginLeft: minimal ? 4 : 8,
        }}
      >
        <TellacityStarIcon />
        Write a review
      </a>
    </div>
  );
}
