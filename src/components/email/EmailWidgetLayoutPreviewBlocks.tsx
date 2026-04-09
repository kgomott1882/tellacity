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
      <EmailWidgetCta className={variant === "elite_body" ? "mt-1.5" : "mt-2.5"} />
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
