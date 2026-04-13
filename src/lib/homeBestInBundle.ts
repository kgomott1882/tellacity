/** Same rotating slugs as the homepage hero; keep in sync with `app/page.tsx` UI. */
export const HOME_ROTATING_BEST_IN_SLUGS = [
  "banking",
  "insurance",
  "restaurants-and-bars",
  "internet-and-software",
  "banking-and-money",
  "cars-and-trucks",
] as const;

export type HomeBestInBusiness = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  website_display?: string | null;
  trust_score: number;
  review_count: number;
  logo_url: string | null;
  resolved_logo_url: string | null;
};
