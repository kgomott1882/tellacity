export type WidgetReview = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewer_name: string | null;
  created_at: string;
};

export type WidgetPayload = {
  business_name: string;
  slug: string;
  logo_url: string | null;
  avg_rating: number;
  review_count: number;
  reviews: WidgetReview[];
};

export type WidgetType =
  | "badge"
  | "carousel"
  | "list"
  | "collector"
  | "review_us"
  | "score_strip"
  | "showcase"
  | "tellacity_trust"
  | "trust_strip"
  | "trust_stacked"
  | "trust_strip_icon"
  | "trust_mini"
  | "spotlight_carousel"
  | "review_slider"
  | "review_dropdown"
  | "micro_trustscore";
