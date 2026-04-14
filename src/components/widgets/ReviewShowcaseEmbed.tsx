import WidgetStars from "./WidgetStars";
import type { WidgetPayload } from "./types";

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function snippetText(s: string | null | undefined, max: number) {
  const t = (s ?? "").trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  return `${t.slice(0, max).trimEnd()}…`;
}

export default function ReviewShowcaseEmbed({
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
  const featured =
    payload.reviews[0] ??
    (dashboardDemo
      ? {
          id: "demo-showcase-review",
          rating: 5,
          title: "Excellent service",
          body: "Friendly team, clear communication, and quality results from start to finish.",
          reviewer_name: "M. Nkosi",
          created_at: "2026-02-03T08:30:00.000Z",
        }
      : undefined);
  const avgRounded =
    payload.review_count > 0 && Number.isFinite(payload.avg_rating)
      ? Math.round(payload.avg_rating * 10) / 10
      : null;
  const starsRating = featured
    ? Math.min(5, Math.max(1, Math.round(Number(featured.rating) || 5)))
    : payload.review_count > 0
      ? Math.min(5, Math.max(1, Math.round(Number(payload.avg_rating) || 5)))
      : 5;

  return (
    <div
      className={minimal ? "mx-auto w-full max-w-none" : "mx-auto w-full max-w-md"}
      style={{
        color: "var(--tc-widget-text-color, #0E0E0E)",
        fontFamily: "var(--tc-widget-font-family, system-ui, -apple-system, Segoe UI, sans-serif)",
      }}
    >
      <div className="overflow-hidden rounded-none border-0 bg-transparent shadow-none">
        <div className="h-0" />
        <div className={minimal ? "px-0 py-0 text-left" : "px-3 py-3 text-left"}>
          {featured ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <WidgetStars rating={starsRating} size={11} />
                <span className="shrink-0 text-[10px] text-black">
                  {formatDate(featured.created_at)}
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-black">
                by {featured.reviewer_name?.trim() || "Customer"}
              </p>
              <p className="mt-1.5 text-sm font-bold text-black">
                {(featured.title ?? "").trim() || "Recent review"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-black">
                {snippetText(featured.body, 220)}
              </p>
            </>
          ) : (
            <div className="py-2 text-center text-sm text-black">
              <div className="flex justify-center">
                <WidgetStars rating={starsRating} size={11} />
              </div>
              <p className="mt-3">
                Be the first to share your experience with{" "}
                <strong>{payload.business_name}</strong>.
              </p>
            </div>
          )}
        </div>
        <div
          className={
            minimal
              ? "border-t-0 px-0 py-1 text-left text-[10px] text-black"
              : "border-t border-gray-200 px-3 py-2 text-center text-[10px] text-black"
          }
        >
          {avgRounded != null && payload.review_count > 0 ? (
            <>
              Rated <strong>{avgRounded}</strong> out of <strong>5</strong> |{" "}
              <strong>{payload.review_count.toLocaleString("en-GB")}</strong>{" "}
              reviews on <strong className="text-black">{showTellacityLogo ? "Tellacity" : "our platform"}</strong>
            </>
          ) : (
            <>Reviews {showTellacityLogo ? <strong className="text-black">on Tellacity</strong> : null}</>
          )}
        </div>
        <div className="h-0" />
      </div>
    </div>
  );
}
