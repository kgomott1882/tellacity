import type { WidgetPayload, WidgetReview, WidgetType } from "@/components/widgets/types";
import { WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS } from "./widgetsConfig";

/** Widget embed types where dashboard `limit` pads/fetches review rows (same set as star-filter testimonial widgets). */
export const WIDGET_TYPES_PREVIEW_PAD_LIMIT: WidgetType[] = [
  ...(WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS as unknown as WidgetType[]),
];

/** Dashboard "Reviews in preview" stepper (`data-limit`) for widgets that load review rows. */
export const DASHBOARD_PREVIEW_REVIEW_LIMIT_MIN = 1;

/** Carousel, list, showcase, dropdown: preview + `data-limit` cap. */
export const DASHBOARD_PREVIEW_REVIEW_LIMIT_MAX_COMPACT = 4;

/** Spotlight carousel + review slider only: preview + `data-limit` cap. */
export const DASHBOARD_PREVIEW_REVIEW_LIMIT_MAX_SPOTLIGHT_SLIDER = 14;

export function dashboardPreviewReviewLimitCap(widgetType: WidgetType): number {
  if (widgetType === "spotlight_carousel" || widgetType === "review_slider") {
    return DASHBOARD_PREVIEW_REVIEW_LIMIT_MAX_SPOTLIGHT_SLIDER;
  }
  if (
    widgetType === "carousel" ||
    widgetType === "list" ||
    widgetType === "showcase" ||
    widgetType === "review_dropdown"
  ) {
    return DASHBOARD_PREVIEW_REVIEW_LIMIT_MAX_COMPACT;
  }
  return DASHBOARD_PREVIEW_REVIEW_LIMIT_MAX_COMPACT;
}

/** Same caps as the dashboard stepper for `/widgets/embed` and `v1.js`. */
export function widgetEmbedDataLimitCap(type: WidgetType): number {
  return dashboardPreviewReviewLimitCap(type);
}

const DEMO_AVG_RATING = 4.8;
const DEMO_REVIEW_COUNT = 24;

/**
 * Sample reviews for `/widgets/embed?dashboard_demo=1` so dashboard previews show
 * filled stars and carousel-style widgets without published reviews.
 */
export function buildWidgetEmbedDemoReviews(): WidgetReview[] {
  const now = Date.now();
  return [
    {
      id: "embed-demo-1",
      rating: 5,
      title: "Excellent service",
      body: "Friendly team, clear communication, and quality results from start to finish.",
      reviewer_name: "M. Nkosi",
      created_at: new Date(now - 2 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-2",
      rating: 5,
      title: "Highly recommended",
      body: "Never had a better experience, quick turnaround and reliable support.",
      reviewer_name: "Steve",
      created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-3",
      rating: 4,
      title: "Solid choice",
      body: "Good value and clear communication throughout the project.",
      reviewer_name: "T. Mokoena",
      created_at: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-4",
      rating: 5,
      title: "Would use again",
      body: "Professional team and delivered on time.",
      reviewer_name: "A. Naidoo",
      created_at: new Date(now - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-5",
      rating: 4,
      title: "Great experience",
      body: "Clear process from quote to completion. Would recommend to others.",
      reviewer_name: "J. Pillay",
      created_at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-6",
      rating: 5,
      title: "Outstanding work",
      body: "Attention to detail and proactive updates made everything easy.",
      reviewer_name: "Ronald Makhubela",
      created_at: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-7",
      rating: 4,
      title: "Very pleased",
      body: "Fair pricing and they stood behind their timeline.",
      reviewer_name: "L. van Wyk",
      created_at: new Date(now - 12 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-8",
      rating: 5,
      title: "Top notch",
      body: "We will be back for our next project without hesitation.",
      reviewer_name: "K. Dlamini",
      created_at: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-9",
      rating: 4,
      title: "Reliable partner",
      body: "Consistent quality and easy to work with across the engagement.",
      reviewer_name: "P. Govender",
      created_at: new Date(now - 16 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-10",
      rating: 5,
      title: "Exceeded expectations",
      body: "Clear milestones and responsive support whenever we had questions.",
      reviewer_name: "N. Botha",
      created_at: new Date(now - 18 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-11",
      rating: 4,
      title: "Strong recommendation",
      body: "Good value and honest communication from day one.",
      reviewer_name: "R. Cloete",
      created_at: new Date(now - 20 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-12",
      rating: 5,
      title: "Five stars",
      body: "Professional, punctual, and the outcome matched the brief perfectly.",
      reviewer_name: "S. Khumalo",
      created_at: new Date(now - 22 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-13",
      rating: 4,
      title: "Happy customer",
      body: "Smooth process and a team that actually listens.",
      reviewer_name: "D. Fortuin",
      created_at: new Date(now - 24 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-14",
      rating: 5,
      title: "Brilliant",
      body: "We felt looked after from the first call to handover.",
      reviewer_name: "C. Mbatha",
      created_at: new Date(now - 26 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-15",
      rating: 4,
      title: "Solid results",
      body: "Delivered on scope and kept us updated throughout.",
      reviewer_name: "E. Jacobs",
      created_at: new Date(now - 28 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-16",
      rating: 5,
      title: "Impressed",
      body: "Attention to detail stood out compared to others we tried.",
      reviewer_name: "H. Sithole",
      created_at: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-17",
      rating: 4,
      title: "Worth it",
      body: "Fair pricing and no surprises along the way.",
      reviewer_name: "B. Coetzee",
      created_at: new Date(now - 32 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-18",
      rating: 5,
      title: "Excellent",
      body: "Would confidently refer friends and colleagues.",
      reviewer_name: "Y. Mthembu",
      created_at: new Date(now - 34 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-19",
      rating: 4,
      title: "Great team",
      body: "Friendly, skilled, and organised, exactly what we needed.",
      reviewer_name: "G. Petersen",
      created_at: new Date(now - 36 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "embed-demo-20",
      rating: 5,
      title: "Outstanding",
      body: "A pleasure to work with from start to finish.",
      reviewer_name: "V. Radebe",
      created_at: new Date(now - 38 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
}

/**
 * Dashboard iframe only: if the business has fewer published reviews than the requested
 * `limit`, pad with demo rows so the preview matches the user's "Reviews in preview" control.
 */
export function applyDashboardPreviewReviewLimit(
  payload: WidgetPayload,
  limit: number,
  widgetType: WidgetType,
): WidgetPayload {
  if (!WIDGET_TYPES_PREVIEW_PAD_LIMIT.includes(widgetType)) {
    return payload;
  }
  const cap = Math.min(
    dashboardPreviewReviewLimitCap(widgetType),
    Math.max(DASHBOARD_PREVIEW_REVIEW_LIMIT_MIN, Math.floor(limit)),
  );
  const raw = [...(payload.reviews ?? [])];
  const trimmed = raw.slice(0, cap);
  if (trimmed.length >= cap) {
    return { ...payload, reviews: trimmed };
  }
  const demos = buildWidgetEmbedDemoReviews();
  const seen = new Set(trimmed.map((r) => r.id));
  const merged: WidgetReview[] = [...trimmed];
  for (const d of demos) {
    if (merged.length >= cap) break;
    if (!seen.has(d.id)) {
      seen.add(d.id);
      merged.push(d);
    }
  }
  return { ...payload, reviews: merged };
}

function hasPositiveStats(payload: WidgetPayload): boolean {
  const count = Math.max(0, Math.floor(Number(payload.review_count) || 0));
  const avgNum = Number(payload.avg_rating);
  return count > 0 && Number.isFinite(avgNum) && avgNum > 0;
}

/**
 * Returns a shallow-cloned payload with demo stats/reviews when the business has
 * no usable public stats or no review rows (dashboard configure iframe only).
 */
export function applyWidgetDashboardDemoOverlay(payload: WidgetPayload): WidgetPayload {
  const reviewRows = payload.reviews ?? [];
  const needsStats = !hasPositiveStats(payload);
  const needsReviews = reviewRows.length === 0;

  if (!needsStats && !needsReviews) {
    return payload;
  }

  return {
    ...payload,
    ...(needsStats
      ? {
          avg_rating: DEMO_AVG_RATING,
          review_count: Math.max(DEMO_REVIEW_COUNT, Math.floor(Number(payload.review_count) || 0)),
        }
      : {}),
    ...(needsReviews ? { reviews: buildWidgetEmbedDemoReviews() } : {}),
  };
}
