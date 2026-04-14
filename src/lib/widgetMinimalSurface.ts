import type { CSSProperties } from "react";

/** Removes outer “card frame” chrome for `data-theme="minimal"` embeds (Trustpilot-style transparency). */
export function minimalClearFrame(base: CSSProperties, minimal?: boolean): CSSProperties {
  if (!minimal) return base;
  return {
    ...base,
    background: "transparent",
    backgroundColor: "transparent",
    border: "none",
    borderTop: "none",
    borderBottom: "none",
    borderLeft: "none",
    borderRight: "none",
    borderRadius: 0,
    boxShadow: "none",
  };
}
