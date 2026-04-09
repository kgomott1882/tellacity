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

export default function ReviewShowcaseEmbed({ payload }: { payload: WidgetPayload }) {
  const featured = payload.reviews[0];
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
    <div className="mx-auto w-full max-w-md">
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="h-1.5 bg-gray-100" />
        <div className="px-3 py-3 text-left">
          {featured ? (
            <>
              <div className="flex items-start justify-between gap-2">
                <WidgetStars rating={starsRating} size={11} />
                <span className="shrink-0 text-[10px] text-gray-400">
                  {formatDate(featured.created_at)}
                </span>
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">
                by {featured.reviewer_name?.trim() || "Customer"}
              </p>
              <p className="mt-1.5 text-sm font-bold text-gray-900">
                {(featured.title ?? "").trim() || "Recent review"}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                {snippetText(featured.body, 220)}
              </p>
            </>
          ) : (
            <div className="py-2 text-center text-sm text-gray-600">
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
        <div className="border-t border-gray-200 px-3 py-2 text-center text-[10px] text-gray-600">
          {avgRounded != null && payload.review_count > 0 ? (
            <>
              Rated <strong>{avgRounded}</strong> out of <strong>5</strong> |{" "}
              <strong>{payload.review_count.toLocaleString("en-GB")}</strong>{" "}
              reviews on <strong className="text-[#0E0E0E]">Tellacity</strong>
            </>
          ) : (
            <>Reviews on <strong className="text-[#0E0E0E]">Tellacity</strong></>
          )}
        </div>
        <div className="h-1.5 bg-gray-100" />
      </div>
    </div>
  );
}
