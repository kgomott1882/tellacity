import WidgetStars from "./WidgetStars";
import type { WidgetPayload } from "./types";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";

export default function TellacityTrustBadgeEmbed({
  payload,
  reviewHref,
  showTellacityLogo = true,
  minimal,
}: {
  payload: WidgetPayload;
  reviewHref: string;
  showTellacityLogo?: boolean;
  minimal?: boolean;
}) {
  const reviewCount = Math.max(0, payload.review_count);
  const avg = payload.avg_rating;
  const avgRounded =
    reviewCount > 0 && Number.isFinite(avg) ? Math.round(avg * 10) / 10 : null;
  const starsRating =
    reviewCount > 0 && Number.isFinite(avg)
      ? Math.min(5, Math.max(1, Math.round(avg)))
      : 5;
  const statsLabel =
    avgRounded != null && reviewCount > 0
      ? `${avgRounded} Stars | ${reviewCount.toLocaleString("en-GB")} reviews`
      : "No published reviews yet , your live average and count will show here.";

  return (
    <div
      style={{
        margin: minimal ? 0 : "0 auto",
        width: "100%",
        maxWidth: minimal ? "100%" : 420,
        background: "transparent",
        textAlign: minimal ? "left" : "center",
        color: "var(--tc-widget-text-color, #0E0E0E)",
        fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, Segoe UI, sans-serif)",
      }}
    >
      <a
        href={reviewHref}
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "inline-block", color: "inherit", textDecoration: "none" }}
      >
        {showTellacityLogo ? (
          <div style={{ display: "flex", justifyContent: minimal ? "flex-start" : "center" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={TELLACITY_TRUST_BADGE_LOGO_PATH}
              alt="Tellacity"
              style={{ height: 24, maxWidth: 148, objectFit: "contain" }}
            />
          </div>
        ) : null}
        <div
          style={{
            marginTop: showTellacityLogo ? 6 : 0,
            display: "flex",
            justifyContent: minimal ? "flex-start" : "center",
          }}
        >
          <WidgetStars rating={starsRating} size={12} />
        </div>
      </a>
      <p
        style={{
          marginTop: minimal ? 8 : 12,
          fontSize: 11,
          color: "var(--tc-widget-text-color, #0E0E0E)",
        }}
      >
        {statsLabel}
      </p>
    </div>
  );
}
