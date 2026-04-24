import TellacityStarStrip from "@/components/widgets/TellacityStarStrip";
import WidgetStars from "@/components/widgets/WidgetStars";
import {
  EMAIL_WIDGET_CTA_BORDER,
  EMAIL_WIDGET_CTA_TEXT,
  TELLACITY_TRUST_BADGE_LOGO_PATH,
} from "@/lib/emailBranding";

/** Matches the footer line in “Preview & send” for standard / elite layouts. */
export function TellacityBrandingFooter() {
  return (
    <p className="mt-2 text-center text-[10px] leading-snug text-gray-400">
      Verified reviews powered by <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
    </p>
  );
}

/** Review Hunter: Tellacity wordmark footer (same asset as sent email; size aligned with HTML max-height). */
export function ReviewHunterBrandingFooter() {
  return (
    <div className="mt-2 flex justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={TELLACITY_TRUST_BADGE_LOGO_PATH}
        alt="Tellacity"
        className="h-3 w-auto max-w-[140px] object-contain object-center"
      />
    </div>
  );
}

function EmailWidgetCta({ className = "mt-2.5" }: { className?: string }) {
  return (
    <div
      className={`inline-block rounded-md border bg-white px-3 py-1.5 text-[11px] font-semibold leading-tight ${className}`}
      style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
    >
      Leave a Review
    </div>
  );
}

/**
 * Review Hunter stats chip: replaces the generic "Leave a Review" CTA with a
 * trust-signal line ("4.8 Stars | 24 reviews") so the Review Hunter layout
 * showcases the business' actual aggregate rating. Falls back to a neutral
 * "No reviews yet" label when the business has no published reviews.
 */
function ReviewHunterStatsLine({
  avgRating,
  reviewCount,
  className = "mt-2.5",
}: {
  avgRating?: number | null;
  reviewCount?: number | null;
  className?: string;
}) {
  const safeCount =
    typeof reviewCount === "number" && Number.isFinite(reviewCount) && reviewCount > 0
      ? Math.floor(reviewCount)
      : 0;
  const safeRating =
    typeof avgRating === "number" && Number.isFinite(avgRating)
      ? Math.max(0, Math.min(5, avgRating))
      : 0;
  const hasStats = safeCount > 0 && safeRating > 0;

  if (!hasStats) {
    return (
      <p className={`text-[11px] font-medium text-gray-500 ${className}`}>
        No reviews yet
      </p>
    );
  }

  const ratingText = safeRating.toFixed(1);
  const reviewWord = safeCount === 1 ? "review" : "reviews";
  const countText = safeCount.toLocaleString("en-US");

  return (
    <p
      className={`text-[12px] font-semibold leading-tight text-gray-900 ${className}`}
    >
      <span>{ratingText} Stars</span>
      <span className="mx-1.5 text-gray-400" aria-hidden>
        |
      </span>
      <span className="font-medium text-gray-700">
        {countText} {reviewWord}
      </span>
    </p>
  );
}

export type EmailInvitePreviewVariant = "standard" | "review_hunter" | "elite_body";

type InviteBlockProps = {
  variant: EmailInvitePreviewVariant;
  businessName: string;
  /**
   * `comfortable` matches the “Preview & send” block (text-sm headline, 13px stars).
   * `compact` fits the narrow layout-option cards (11px stars).
   */
  density?: "comfortable" | "compact";
  /** Override outer shell (default matches compose “Preview & send” inset). */
  className?: string;
  /**
   * Aggregate rating (0–5). Used by the `review_hunter` variant to render
   * "X.X Stars | N reviews" in place of the generic "Leave a Review" CTA.
   * Pass `null` when stats aren't available yet.
   */
  avgRating?: number | null;
  /** Published review count paired with `avgRating` (see above). */
  reviewCount?: number | null;
};

/**
 * Core invite strip: headline (standard / Review Hunter), or body-only for Elite (intro lives above in compose).
 * Stars use Tellacity `WidgetStars` styling via `TellacityStarStrip` , same as live compose preview.
 */
export function EmailWidgetInviteBlock({
  variant,
  businessName,
  density = "comfortable",
  className,
  avgRating,
  reviewCount,
}: InviteBlockProps) {
  const starSize = density === "comfortable" ? 13 : 11;
  const showHeadline = variant !== "elite_body";
  const headline =
    variant === "standard"
      ? "Tell us about your experience"
      : variant === "review_hunter"
        ? businessName.trim() || "Your Business"
        : null;

  const headlineClass =
    variant === "review_hunter"
      ? density === "comfortable"
        ? "text-lg font-semibold leading-snug text-gray-900"
        : "text-base font-semibold leading-snug text-gray-900"
      : density === "comfortable"
        ? "text-sm font-semibold text-gray-900"
        : "text-[11px] font-semibold text-gray-800";

  const shell =
    className ??
    "my-4 rounded-lg border border-gray-200 bg-gray-50/50 p-4 text-center";

  return (
    <div className={shell}>
      {showHeadline && headline ? <p className={headlineClass}>{headline}</p> : null}
      <div className={`${showHeadline ? "mt-2" : "mt-0"} flex justify-center`}>
        <TellacityStarStrip size={starSize} />
      </div>
      {variant === "review_hunter" ? (
        <ReviewHunterStatsLine
          avgRating={avgRating}
          reviewCount={reviewCount}
          className="mt-2.5"
        />
      ) : (
        <EmailWidgetCta className={variant === "elite_body" ? "mt-1.5" : "mt-2.5"} />
      )}
      {variant === "review_hunter" ? <ReviewHunterBrandingFooter /> : <TellacityBrandingFooter />}
    </div>
  );
}

/** Rating ladder: same structure as compose preview , 5 rows, Tellacity stars per row. */
export function EmailWidgetRatingLadderPreview({
  density = "comfortable",
}: {
  density?: "comfortable" | "compact";
}) {
  const starSize = density === "comfortable" ? 11 : 8;
  const headingClass =
    density === "comfortable"
      ? "mt-3 text-sm font-bold text-gray-900 underline decoration-gray-300 underline-offset-2"
      : "mb-1.5 text-center text-[9px] font-bold text-gray-800 underline";

  return (
    <div className="text-left">
      <p className={headingClass}>How did we do?</p>
      <div
        className={`overflow-hidden rounded-lg border border-gray-200 bg-white ${
          density === "comfortable" ? "my-3" : "my-1.5"
        }`}
      >
        {[5, 4, 3, 2, 1].map((r) => (
          <div
            key={r}
            className={`flex items-center gap-3 border-b border-gray-100 last:border-b-0 ${
              density === "comfortable" ? "px-3 py-2.5" : "px-2 py-1.5"
            }`}
          >
            <span className="h-3.5 w-3.5 shrink-0 rounded-full border-2 border-gray-300" />
            <WidgetStars rating={r} size={starSize} />
          </div>
        ))}
      </div>
      {density === "comfortable" ? (
        <p className="text-[11px] leading-relaxed text-gray-500">
          Tapping a row opens your review form with that rating pre-selected.
        </p>
      ) : null}
      <p
        className={`text-center text-gray-400 ${
          density === "comfortable" ? "mt-2 text-[10px]" : "mt-1.5 text-[8px]"
        }`}
      >
        Verified reviews powered by <span className="font-semibold text-[#0E0E0E]">Tellacity</span>
      </p>
    </div>
  );
}

type EliteCardProps = {
  businessName: string;
  logoUrl?: string | null;
  density?: "comfortable" | "compact";
};

type ReviewsShowcaseCardProps = {
  businessName: string;
  /** Optional override for the subtitle under the website (defaults to the standard phrasing). */
  tagline?: string | null;
  logoUrl?: string | null;
  /**
   * Business website rendered under the business name. Can be a full URL
   * (`https://example.com`) or a display host (`example.com`). Pass `null`
   * to hide the line.
   */
  website?: string | null;
  /** Optional human-friendly display version of the website (e.g. `example.com`). */
  websiteDisplay?: string | null;
  /**
   * Aggregate review count; paired with `avgRating` to render
   * "4.3 out of 5 based on 4 reviews". Pass `null`/`0` for
   * new businesses (no stats yet).
   */
  reviewCount?: number | null;
  /**
   * Average rating (0–5). Paired with `reviewCount`. Pass `null` when
   * no reviews exist yet.
   */
  avgRating?: number | null;
  density?: "comfortable" | "compact";
};

/**
 * Reviews Showcase: business-card-style invite with logo / name / tagline
 * on the left, trust-signal stack (review count + Tellacity stars +
 * wordmark) on the right. Modeled after well-known trust badges but
 * branded end-to-end with Tellacity stars and logo.
 *
 * Renders in two densities:
 *  - `comfortable` matches the "Preview & send" inset.
 *  - `compact` fits the 280px layout-option tile on the email widgets page.
 */
export function EmailWidgetReviewsShowcaseCard({
  businessName,
  tagline,
  logoUrl,
  website,
  websiteDisplay,
  reviewCount,
  avgRating,
  density = "comfortable",
}: ReviewsShowcaseCardProps) {
  const name = businessName.trim() || "Your Business";

  const rawWebsite = (website ?? "").trim();
  const rawWebsiteDisplay = (websiteDisplay ?? "").trim();
  const websiteText =
    (rawWebsiteDisplay || rawWebsite)
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "") || null;
  const websiteHref = rawWebsite
    ? /^https?:\/\//i.test(rawWebsite)
      ? rawWebsite
      : `https://${rawWebsite}`
    : null;
  const safeCount =
    typeof reviewCount === "number" && Number.isFinite(reviewCount) && reviewCount > 0
      ? Math.floor(reviewCount)
      : 0;
  const safeRating =
    typeof avgRating === "number" && Number.isFinite(avgRating)
      ? Math.max(0, Math.min(5, avgRating))
      : 0;
  const hasStats = safeCount > 0 && safeRating > 0;
  const countText = hasStats ? safeCount.toLocaleString("en-US") : null;
  const ratingText = hasStats ? safeRating.toFixed(1) : null;

  const starSize = density === "comfortable" ? 16 : 11;
  const avatarSize = density === "comfortable" ? "h-12 w-12" : "h-9 w-9";
  const nameClass =
    density === "comfortable"
      ? "text-sm font-semibold text-gray-900"
      : "text-[12px] font-semibold text-gray-900";
  const taglineClass =
    density === "comfortable"
      ? "mt-0.5 text-xs text-gray-500"
      : "mt-0.5 text-[10px] leading-snug text-gray-500";
  const countClass =
    density === "comfortable"
      ? "text-[9px] font-medium leading-tight text-gray-700"
      : "text-[6px] font-medium leading-tight text-gray-700";

  return (
    <div
      className={`rounded-lg border border-gray-200 bg-white text-left shadow-sm ${
        density === "comfortable" ? "p-4" : "p-3"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`${avatarSize} shrink-0 flex items-center justify-center overflow-hidden rounded-md bg-gray-100 ring-1 ring-gray-200`}
          aria-hidden
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt=""
              className="object-contain"
              style={{ width: "98%", height: "98%" }}
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center font-semibold uppercase tracking-wide text-gray-500 ${
                density === "comfortable" ? "text-[10px]" : "text-[8px]"
              }`}
            >
              LOGO
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className={`${nameClass} truncate`}>{name}</p>
          {websiteText ? (
            <p
              className={`${
                density === "comfortable"
                  ? "mt-0.5 text-xs text-gray-700"
                  : "mt-0.5 text-[10px] leading-snug text-gray-700"
              } truncate`}
            >
              {websiteHref ? (
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-700 no-underline hover:underline"
                >
                  {websiteText}
                </a>
              ) : (
                websiteText
              )}
            </p>
          ) : null}
          {tagline && tagline.trim() ? (
            <p className={`${taglineClass} line-clamp-2`}>{tagline.trim()}</p>
          ) : null}
        </div>
      </div>

      <div
        className={`${density === "comfortable" ? "mt-4 pt-4" : "mt-3 pt-3"} border-t border-gray-100`}
      >
        <p className={`${countClass} whitespace-nowrap`}>
          {hasStats ? (
            <>
              <span className="font-semibold text-gray-900">{ratingText}</span>
              {" out of 5 based on "}
              <span className="font-semibold text-gray-900">
                {countText} {safeCount === 1 ? "review" : "reviews"}
              </span>
            </>
          ) : (
            "Be the first to leave a review"
          )}
        </p>
        <div
          className={`${density === "comfortable" ? "mt-1" : "mt-0.5"} flex items-center gap-2`}
        >
          <TellacityStarStrip size={starSize} />
        </div>
        <div className={density === "comfortable" ? "mt-3" : "mt-2"}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={TELLACITY_TRUST_BADGE_LOGO_PATH}
            alt="Tellacity"
            className={
              density === "comfortable"
                ? "h-3.5 w-auto max-w-[150px] object-contain"
                : "h-3 w-auto max-w-[120px] object-contain"
            }
          />
        </div>
      </div>

      <EmailWidgetCta className={density === "comfortable" ? "mt-4" : "mt-3"} />
    </div>
  );
}

/**
 * Elite branded: header band (logo optional) + business name, then invite body (stars + CTA + branding).
 * Aligns with the compose preview card for `elite_branded`.
 */
export function EmailWidgetEliteBrandedCard({ businessName, logoUrl, density = "comfortable" }: EliteCardProps) {
  const name = businessName.trim() || "Your Business";
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white text-center shadow-sm">
      <div className="border-b border-gray-100 bg-gray-50 px-3 py-3">
        <div className="mb-2 flex min-h-[36px] items-center justify-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="max-h-9 max-w-[180px] object-contain" />
          ) : (
            <div
              className={
                density === "comfortable"
                  ? "rounded-md bg-gray-100 px-2.5 py-1 text-[11px] text-gray-400"
                  : "mx-auto flex h-10 w-16 items-center justify-center rounded bg-gray-200 text-[10px] text-gray-400"
              }
            >
              {density === "comfortable" ? "Business logo" : "logo"}
            </div>
          )}
        </div>
        <p className={density === "comfortable" ? "text-sm font-semibold text-gray-900" : "text-base font-semibold tracking-wide text-gray-800"}>
          {name}
        </p>
      </div>
      <div className={density === "comfortable" ? "px-4 py-4" : "px-3 py-3"}>
        <div className="flex justify-center">
          <TellacityStarStrip size={density === "comfortable" ? 13 : 10} />
        </div>
        <div
          className={`${density === "comfortable" ? "mt-1.5" : "mt-1"} inline-block rounded border bg-transparent px-2.5 py-1 text-[10px] font-semibold leading-tight`}
          style={{ borderColor: EMAIL_WIDGET_CTA_BORDER, color: EMAIL_WIDGET_CTA_TEXT }}
        >
          Leave a Review
        </div>
        <TellacityBrandingFooter />
      </div>
    </div>
  );
}
