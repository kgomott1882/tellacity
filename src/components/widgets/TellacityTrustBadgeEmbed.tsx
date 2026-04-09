import WidgetStars from "./WidgetStars";
import type { WidgetPayload } from "./types";
import { TELLACITY_TRUST_BADGE_LOGO_PATH } from "@/lib/emailBranding";

export default function TellacityTrustBadgeEmbed({
  payload,
  reviewHref,
}: {
  payload: WidgetPayload;
  reviewHref: string;
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
    <div className="mx-auto w-full max-w-sm rounded-lg border border-gray-200 bg-white px-4 py-4 text-center shadow-sm">
      <a
        href={reviewHref}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block text-inherit no-underline"
      >
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TELLACITY_TRUST_BADGE_LOGO_PATH}
            alt="Tellacity"
            className="h-6 max-w-[148px] object-contain"
          />
        </div>
        <div className="mt-1.5 flex justify-center">
          <WidgetStars rating={starsRating} size={12} />
        </div>
      </a>
      <p
        className={`mt-3 text-[11px] ${reviewCount > 0 ? "text-gray-600" : "text-gray-500"}`}
      >
        {statsLabel}
      </p>
      <p className="mt-2 text-[10px] leading-snug text-gray-400">
        Figures match your Tellacity public profile.
      </p>
    </div>
  );
}
