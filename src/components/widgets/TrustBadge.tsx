import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";
import WidgetBrandLogoSlot from "./WidgetBrandLogoSlot";
import { TELLACITY_BRAND_ICON_SRC } from "@/lib/emailBranding";

export default function TrustBadge({
  payload,
  dashboardDemo,
  showTellacityLogo = true,
  minimal,
}: {
  payload: WidgetPayload;
  /** Dashboard iframe: hide business logo entirely. */
  dashboardDemo?: boolean;
  showTellacityLogo?: boolean;
  /** Transparent inline embed (`data-theme="minimal"`). */
  minimal?: boolean;
}) {
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
        padding: 0,
        background: "transparent",
        border: "none",
        borderRadius: 0,
        boxShadow: "none",
        textDecoration: "none",
        color: "inherit",
        fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, sans-serif)",
        maxWidth: 340,
      }}
    >
      <WidgetBrandLogoSlot payload={payload} dashboardDemo={dashboardDemo} minimal={minimal} size={44} fontSize={10} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--tc-widget-text-color, #0E0E0E)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {payload.business_name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <WidgetStars rating={payload.avg_rating} size={13} />
          <span style={{ fontSize: 13, fontWeight: 700, color: "var(--tc-widget-text-color, #0E0E0E)" }}>{avg}</span>
          <span style={{ fontSize: 12, color: "var(--tc-widget-text-color, #0E0E0E)" }}>({payload.review_count})</span>
        </div>
        <div style={{ marginTop: 4, fontSize: 11, color: "#000000", display: "flex", alignItems: "center", gap: 4 }}>
          {showTellacityLogo ? (
            <>
              Verified by{" "}
              <img src={TELLACITY_BRAND_ICON_SRC} alt="Tellacity" width={20} height={20} style={{ width: 14, height: 14, objectFit: "contain", display: "inline-block", verticalAlign: "middle", borderRadius: 3 }} />
              <span style={{ color: "var(--tc-widget-text-color, #0E0E0E)", fontWeight: 600 }}>Tellacity</span>
              {" · "}
            </>
          ) : null}
          <span style={{ color: "var(--tc-widget-text-color, #000000)" }}>View reviews →</span>
        </div>
      </div>
    </a>
  );
}
