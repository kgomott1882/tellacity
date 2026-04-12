"use client";

/** Matches `planWidget` on the website widgets dashboard grid. */
export type WebsiteWidgetPlanKey =
  | "trust_badge"
  | "review_carousel"
  | "review_list"
  | "review_collector"
  | "review_strip"
  | "review_showcase"
  | "tellacity_trust"
  | "tellacity_score"
  | "trust_strip"
  | "trust_stacked"
  | "trust_strip_icon"
  | "trust_mini";

const EMBED_TYPE_BY_WIDGET: Record<WebsiteWidgetPlanKey, string> = {
  trust_badge: "badge",
  review_carousel: "carousel",
  review_list: "list",
  review_collector: "collector",
  review_strip: "review_us",
  review_showcase: "showcase",
  tellacity_trust: "tellacity_trust",
  tellacity_score: "score_strip",
  trust_strip: "trust_strip",
  trust_stacked: "trust_stacked",
  trust_strip_icon: "trust_strip_icon",
  trust_mini: "trust_mini",
};

const PREVIEW_HEIGHT_BY_WIDGET: Record<WebsiteWidgetPlanKey, number> = {
  trust_badge: 120,
  review_carousel: 300,
  review_list: 420,
  review_collector: 80,
  review_strip: 88,
  review_showcase: 400,
  tellacity_trust: 200,
  tellacity_score: 150,
  trust_strip: 86,
  trust_stacked: 220,
  trust_strip_icon: 86,
  trust_mini: 34,
};

export default function WebsiteWidgetUpgradePreview({
  widget,
  businessSlug,
}: {
  widget: WebsiteWidgetPlanKey | null;
  businessSlug?: string | null;
}) {
  const toneClass =
    "rounded-lg border border-[#E9E1D2] bg-[#F9F6EF] px-3 py-3 text-[12px] text-[#1F2937]";
  const normalizedSlug = (businessSlug ?? "").trim().toLowerCase();

  const innerShell =
    "pointer-events-none max-h-[min(55vh,340px)] overflow-auto rounded-md bg-transparent p-0";

  if (!widget) {
    return (
      <div className={toneClass}>
        <p className="font-semibold text-[#111827]">Widget preview</p>
        <p className="mt-1 text-[#374151]">
          Unlock additional widget styles and richer social proof blocks.
        </p>
      </div>
    );
  }

  if (!normalizedSlug) {
    return (
      <div className={toneClass}>
        <p className="mt-1 text-[#374151]">
          Select a business to load real widget preview data.
        </p>
      </div>
    );
  }

  const embedType = EMBED_TYPE_BY_WIDGET[widget];
  const previewHeight = PREVIEW_HEIGHT_BY_WIDGET[widget];
  const previewSrc = `/widgets/embed?business=${encodeURIComponent(
    normalizedSlug
  )}&type=${encodeURIComponent(embedType)}&dashboard_demo=1`;

  return (
    <div className={toneClass}>
      <div className="mt-2 select-none">
        <div className={innerShell}>
          <iframe
            title={`${widget} upgrade preview`}
            src={previewSrc}
            className="w-full"
            style={{
              height: previewHeight,
              border: 0,
              display: "block",
              overflow: "hidden",
            }}
            scrolling="no"
          />
        </div>
      </div>
    </div>
  );
}
