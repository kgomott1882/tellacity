import type { WidgetPayload } from "./types";
import WidgetStars from "./WidgetStars";

export default function TellacityTrustMini({
  payload,
  showTellacityLogo = true,
  minimal: _minimal,
}: {
  payload: WidgetPayload;
  showTellacityLogo?: boolean;
  minimal?: boolean;
}) {
  const raw = Number(payload.avg_rating ?? 0);
  const rating = Number.isFinite(raw) ? Math.min(5, Math.max(0, raw)) : 0;
  const reviewCount = Math.max(0, Math.floor(Number(payload.review_count) || 0));
  const href = `https://tellacity.com/b/${payload.slug}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        textDecoration: "none",
        color: "var(--tc-widget-text-color, #0E0E0E)",
        fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, Segoe UI, sans-serif)",
      }}
    >
      {showTellacityLogo ? (
        <img
          src="/brand/appicon.Icons.png"
          alt="Tellacity"
          style={{
            height: 24,
            width: 24,
            objectFit: "contain",
            display: "block",
            borderRadius: 2,
          }}
        />
      ) : null}
      <WidgetStars rating={rating} size={10} />
      <span style={{ fontSize: 14, lineHeight: 1.1 }}>
        <strong style={{ fontWeight: 700 }}>{rating.toFixed(1)}</strong>
        <span style={{ padding: "0 4px" }}>·</span>
        <span>
          {reviewCount.toLocaleString("en-US")} {reviewCount === 1 ? "review" : "reviews"}
        </span>
      </span>
    </a>
  );
}
