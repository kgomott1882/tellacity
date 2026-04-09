import type { ReactNode } from "react";
import type { WidgetPayload } from "./types";
import TrustBadge from "./TrustBadge";
import ReviewCarousel from "./ReviewCarousel";
import ReviewList from "./ReviewList";
import ReviewCollector from "./ReviewCollector";
import TellacityReviewUsBadge from "./TellacityReviewUsBadge";
import ReviewShowcaseEmbed from "./ReviewShowcaseEmbed";
import TellacityTrustBadgeEmbed from "./TellacityTrustBadgeEmbed";
import TellacityScoreStrip from "./TellacityScoreStrip";

/** Matches `planWidget` on the website widgets dashboard grid. */
export type WebsiteWidgetPlanKey =
  | "trust_badge"
  | "review_carousel"
  | "review_list"
  | "review_collector"
  | "review_strip"
  | "review_showcase"
  | "tellacity_trust"
  | "tellacity_score";

const TITLES: Record<WebsiteWidgetPlanKey, string> = {
  trust_badge: "Trust Badge",
  review_carousel: "Review Carousel",
  review_list: "Review List",
  review_collector: "Review Collector",
  review_strip: "Review Strip",
  review_showcase: "Review showcase",
  tellacity_trust: "Tellacity reviews",
  tellacity_score: "Tellacity Score",
};

function buildMockPayload(businessName: string): WidgetPayload {
  const name = businessName.trim() || "Your business";
  const sampleBody =
    "I worked with you in one of your Johannesburg City projects in Hillbrow and I was impressed by the quality and speed.";
  return {
    business_name: name,
    slug: "preview",
    logo_url: null,
    avg_rating: 4.2,
    review_count: 7,
    reviews: [
      {
        id: "mock-1",
        rating: 5,
        title: "Recent review",
        body: sampleBody,
        reviewer_name: "Ronald Mkhubela",
        created_at: "2026-04-01T12:00:00.000Z",
      },
      {
        id: "mock-2",
        rating: 4,
        title: null,
        body: "Professional, clear communication and great results.",
        reviewer_name: "Sam K.",
        created_at: "2026-03-20T12:00:00.000Z",
      },
    ],
  };
}

/**
 * Upgrade modal preview: renders the **same** embed components as `/widgets/embed` with mock data,
 * so Tellacity stars, copy, and layout match production widgets.
 */
export default function WebsiteWidgetUpgradePreview({
  widget,
  businessName,
}: {
  widget: WebsiteWidgetPlanKey | null;
  businessName: string;
}) {
  const toneClass =
    "rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 text-[12px] text-gray-700";

  if (!widget) {
    return (
      <div className={toneClass}>
        <p className="font-semibold text-gray-900">Widget preview</p>
        <p className="mt-1 text-gray-600">
          Unlock additional widget styles and richer social proof blocks.
        </p>
      </div>
    );
  }

  const mock = buildMockPayload(businessName);
  const title = TITLES[widget];
  const innerShell =
    "pointer-events-none max-h-[min(55vh,340px)] overflow-auto rounded-md border border-gray-100 bg-white p-2 shadow-inner";

  let body: ReactNode;
  switch (widget) {
    case "trust_badge":
      body = (
        <div className="flex justify-center py-1">
          <TrustBadge payload={mock} />
        </div>
      );
      break;
    case "review_carousel":
      body = <ReviewCarousel payload={mock} />;
      break;
    case "review_list":
      body = <ReviewList payload={mock} />;
      break;
    case "review_collector":
      body = (
        <div className="flex justify-center py-1">
          <ReviewCollector payload={mock} />
        </div>
      );
      break;
    case "review_strip":
      body = (
        <div className="flex justify-center py-2">
          <TellacityReviewUsBadge href="https://tellacity.com/write-review/preview" size="md" />
        </div>
      );
      break;
    case "review_showcase":
      body = <ReviewShowcaseEmbed payload={mock} />;
      break;
    case "tellacity_trust":
      body = (
        <TellacityTrustBadgeEmbed
          payload={mock}
          reviewHref="https://tellacity.com/write-review/preview"
        />
      );
      break;
    case "tellacity_score":
      body = (
        <div className="py-1">
          <TellacityScoreStrip payload={mock} />
        </div>
      );
      break;
  }

  return (
    <div className={toneClass}>
      <p className="font-semibold text-gray-900">{title}</p>
      <div className="mt-2 select-none">{body ? <div className={innerShell}>{body}</div> : null}</div>
    </div>
  );
}
