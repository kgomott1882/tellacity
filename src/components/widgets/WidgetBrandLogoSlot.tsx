import type { CSSProperties } from "react";
import type { WidgetPayload } from "./types";

type Props = {
  payload: WidgetPayload;
  /** Dashboard iframe preview: show a neutral "Logo" tile instead of the real business logo. */
  dashboardDemo?: boolean;
  size: number;
  fontSize?: number;
};

/**
 * Business logo area for embed widgets. When `dashboardDemo` (dashboard iframe preview), renders nothing
 * so previews show no business logo and no placeholder tile.
 */
export default function WidgetBrandLogoSlot({
  payload,
  dashboardDemo,
  size,
  fontSize: _fontSize = 9,
}: Props) {
  if (dashboardDemo) {
    return null;
  }

  const radius = size >= 40 ? 8 : 6;
  const box: CSSProperties = {
    width: size,
    height: size,
    borderRadius: radius,
    flexShrink: 0,
  };

  if (!payload.logo_url) return null;

  return (
    <div
      style={{
        ...box,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        padding: 2,
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={payload.logo_url}
        alt={payload.business_name}
        style={{ width: "98%", height: "98%", objectFit: "contain", display: "block" }}
      />
    </div>
  );
}
