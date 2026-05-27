import type { WidgetType } from "@/components/widgets/types";

/**
 * Central Tellacity website-widget registry: categories, display names, canonical slugs,
 * embed `data-type` ids (`id`), and `planWidget` keys used with `canAccessWebsiteWidget` / billing.
 *
 * Embed URLs and v1.js must keep using `id`, do not rename these values without a migration.
 */
export const WIDGET_CATEGORY_KEYS = ["CRUCIAL_WIDGETS", "TESTIMONIAL_WIDGETS"] as const;
export type WidgetCategoryKey = (typeof WIDGET_CATEGORY_KEYS)[number];

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
  | "trust_mini"
  | "spotlight_carousel"
  | "review_slider"
  | "review_dropdown"
  | "micro_trustscore";

export type WebsiteWidgetDefinition = {
  /** Canonical lowercase_underscore slug (marketing / APIs); not the embed query `type`. */
  slug: string;
  /** Display name in UI */
  name: string;
  /** Embed `data-type` / dashboard selection id */
  id: WidgetType;
  description: string;
  sizesHelp: string;
  previewHeight: number;
  planWidget: WebsiteWidgetPlanKey;
};

export const WIDGET_CATEGORIES: {
  [K in WidgetCategoryKey]: { label: string; description: string; widgets: readonly WebsiteWidgetDefinition[] };
} = {
  CRUCIAL_WIDGETS: {
    label: "Crucial Widgets",
    description: "Trust-building widgets that represent Tellacity credibility and business reputation.",
    widgets: [
      {
        slug: "review_collector",
        name: "Review Collector",
        id: "collector",
        description: "Elegant review collector strip",
        sizesHelp: "Single horizontal strip; roughly 240–520px wide depending on copy.",
        previewHeight: 112,
        planWidget: "review_strip",
      },
      {
        slug: "trust_badge",
        name: "Trust Badge",
        id: "badge",
        description: "Compact rating badge for headers and footers.",
        sizesHelp: "Typical width about 260–340px; height scales with your logo and text.",
        previewHeight: 128,
        planWidget: "trust_badge",
      },
      {
        slug: "tellacity_reviews",
        name: "Tellacity reviews",
        id: "tellacity_trust",
        description: "Compact badge: logo, stars, and live rating & review count.",
        sizesHelp: "Compact; reserve roughly 200–280px width by 120–220px height.",
        previewHeight: 220,
        planWidget: "tellacity_trust",
      },
      {
        slug: "tellacity_score",
        name: "Tellacity Score",
        id: "score_strip",
        description: "Trust-style score strip with block stars and review count.",
        sizesHelp: "Score row; about 280–320px wide, height driven by stacked lines.",
        previewHeight: 168,
        planWidget: "tellacity_score",
      },
      {
        slug: "tellacity_trust_strip",
        name: "Tellacity Trust Strip",
        id: "trust_strip",
        description: "Trustpilot-style strip with stars, score, and review count.",
        sizesHelp: "Full-width strip on mobile; desktop from ~300px wide.",
        previewHeight: 148,
        planWidget: "trust_strip",
      },
      {
        slug: "tellacity_trust_stacked",
        name: "Tellacity Trust Stacked",
        id: "trust_stacked",
        description: "Vertical trust block with headline, stars, count, and logo.",
        sizesHelp: "Vertical block; about 240–320px wide, height ~200–260px.",
        previewHeight: 240,
        planWidget: "trust_stacked",
      },
      {
        slug: "tellacity_trust_strip_icon",
        name: "Tellacity Trust Strip (Icon)",
        id: "trust_strip_icon",
        description: "Compact trust strip with Tellacity icon only.",
        sizesHelp: "Compact row; from ~260px wide on desktop layouts.",
        previewHeight: 128,
        planWidget: "trust_strip_icon",
      },
      {
        slug: "tellacity_trust_mini",
        name: "Tellacity Trust Mini",
        id: "trust_mini",
        description: "Minimal stars + score + review count.",
        sizesHelp: "Minimal inline row; from ~180px wide.",
        previewHeight: 120,
        planWidget: "trust_mini",
      },
      {
        slug: "micro_trustscore",
        name: "Micro TrustScore",
        id: "micro_trustscore",
        description:
          "Ultra-compact row: status word, score out of 5, Tellacity block stars, and Trust Stacked mark (Trustpilot Micro TrustScore–style).",
        sizesHelp:
          "Single horizontal strip (word, score, stars, logo, no wrap). About 150–250px wide (or %); row ~22–28px tall. Transparent background.",
        previewHeight: 120,
        planWidget: "micro_trustscore",
      },
    ],
  },
  TESTIMONIAL_WIDGETS: {
    label: "Testimonial Widgets",
    description: "Review-display widgets focused on showcasing customer feedback and experiences.",
    widgets: [
      {
        slug: "review_carousel",
        name: "Review Carousel",
        id: "carousel",
        description: "Showcase rotating customer reviews.",
        sizesHelp:
          "Horizontal swipe row: use the full width of your content area (about 100% of the parent, minimum ~320px; wider columns show more cards at once). In the dashboard, the preview stretches left to right so cards are not clipped. Responsive on mobile, tablet, and desktop.",
        previewHeight: 320,
        planWidget: "review_carousel",
      },
      {
        slug: "review_list",
        name: "Review List",
        id: "list",
        description: "Display latest reviews in a vertical list.",
        sizesHelp: "Up to about 420px wide recommended; height grows with review count.",
        previewHeight: 440,
        planWidget: "review_list",
      },
      {
        slug: "review_showcase",
        name: "Review Showcase",
        id: "showcase",
        description: "Trust-style card with your latest public review and aggregate stats.",
        sizesHelp: "Card-style block; about 360–420px wide works well on desktop.",
        previewHeight: 420,
        planWidget: "review_showcase",
      },
      {
        slug: "spotlight_carousel",
        name: "Spotlight Carousel",
        id: "spotlight_carousel",
        description:
          "Tellacity Score on top; latest reviews in a single row (no card backgrounds, floats on your page).",
        sizesHelp:
          "Responsive block; minimum about 180×350px, typical max width 100% and ~520px height.",
        previewHeight: 560,
        planWidget: "spotlight_carousel",
      },
      {
        slug: "review_slider",
        name: "Review Slider",
        id: "review_slider",
        description:
          "Floating latest reviews in a window with arrows and a rating footer (Tellacity Trust Stacked mark); no card backgrounds.",
        sizesHelp:
          "Wide strip; about 300–1200px width, height roughly 260–420px depending on copy.",
        previewHeight: 420,
        planWidget: "review_slider",
      },
      {
        slug: "review_dropdown",
        name: "Review Drop-Down",
        id: "review_dropdown",
        description:
          "Compact row: Tellacity block stars plus “See our reviews”, opens a dropdown of recent reviews (Trustpilot-style).",
        sizesHelp:
          "Inline header/footer friendly; about 255–760px wide, ~30px row height (panel opens below).",
        previewHeight: 400,
        planWidget: "review_dropdown",
      },
    ],
  },
} as const;

/** Flat list in category order (Crucial first, then Testimonial). Single source for dashboard grid + limits. */
export const WEBSITE_WIDGETS: readonly WebsiteWidgetDefinition[] = [
  ...WIDGET_CATEGORIES.CRUCIAL_WIDGETS.widgets,
  ...WIDGET_CATEGORIES.TESTIMONIAL_WIDGETS.widgets,
];

export type WebsiteWidgetId = (typeof WEBSITE_WIDGETS)[number]["id"];

/** Embed types that support dashboard “Reviews in preview”, `data-limit`, and star filters. */
export const WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS = [
  "carousel",
  "list",
  "showcase",
  "spotlight_carousel",
  "review_slider",
  "review_dropdown",
] as const satisfies readonly WebsiteWidgetId[];

const _categoryByWidgetId: Partial<Record<WebsiteWidgetId, WidgetCategoryKey>> = {};
for (const key of WIDGET_CATEGORY_KEYS) {
  for (const w of WIDGET_CATEGORIES[key].widgets) {
    _categoryByWidgetId[w.id as WebsiteWidgetId] = key;
  }
}

export function getWidgetCategoryKey(widgetId: string): WidgetCategoryKey | undefined {
  return _categoryByWidgetId[widgetId as WebsiteWidgetId];
}

export function getWebsiteWidgetById(id: string): WebsiteWidgetDefinition | undefined {
  return WEBSITE_WIDGETS.find((w) => w.id === id);
}
