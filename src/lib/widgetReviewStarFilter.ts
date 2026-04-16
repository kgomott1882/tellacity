import type { WidgetPayload, WidgetReview, WidgetType } from "@/components/widgets/types";
import { WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS } from "./widgetsConfig";

export const DEFAULT_REVIEW_STAR_RATINGS: readonly number[] = [1, 2, 3, 4, 5];

/** Widget embed types that load a list of reviews and respect the star filter (see `widgetsConfig`). */
export const WIDGET_TYPES_WITH_REVIEW_STAR_FILTER: readonly WidgetType[] =
  WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS as unknown as readonly WidgetType[];

export function isWidgetTypeWithReviewStarFilter(type: WidgetType): boolean {
  return (WIDGET_TYPES_WITH_REVIEW_STAR_FILTER as readonly string[]).includes(type);
}

export function reviewRoundedStarBand(rating: number): number {
  const n = Number(rating);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(1, Math.round(n)));
}

/** Coerce user / JSON input into a sorted unique list of 1–5, or all five if invalid / empty. */
export function normalizeReviewStarRatings(raw: unknown): number[] {
  if (raw == null) return [...DEFAULT_REVIEW_STAR_RATINGS];
  if (typeof raw === "string") {
    const parts = raw.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    return normalizeReviewStarRatings(parts.map((p) => parseInt(p, 10)));
  }
  if (!Array.isArray(raw)) return [...DEFAULT_REVIEW_STAR_RATINGS];
  const s = new Set<number>();
  for (const x of raw) {
    const n = typeof x === "number" ? x : typeof x === "string" ? parseInt(String(x), 10) : NaN;
    if (!Number.isFinite(n)) continue;
    const b = Math.round(n);
    if (b >= 1 && b <= 5) s.add(b);
  }
  const out = [...s].sort((a, b) => a - b);
  return out.length > 0 ? out : [...DEFAULT_REVIEW_STAR_RATINGS];
}

export function parseReviewStarsQueryParam(raw: string | undefined): number[] | null {
  const t = (raw ?? "").trim();
  if (t === "") return null;
  return normalizeReviewStarRatings(t.split(","));
}

export function isFullStarSelection(ratings: readonly number[]): boolean {
  const n = normalizeReviewStarRatings([...ratings]);
  return (
    n.length === DEFAULT_REVIEW_STAR_RATINGS.length &&
    DEFAULT_REVIEW_STAR_RATINGS.every((v, i) => n[i] === v)
  );
}

export function filterReviewsByStarRatings(reviews: WidgetReview[], allowed: readonly number[]): WidgetReview[] {
  if (allowed.length === 0 || isFullStarSelection(allowed)) return reviews;
  const set = new Set(allowed);
  return reviews.filter((r) => set.has(reviewRoundedStarBand(r.rating)));
}

export function applyReviewStarFilterToPayload(
  payload: WidgetPayload,
  allowed: readonly number[],
): WidgetPayload {
  const next = filterReviewsByStarRatings(payload.reviews ?? [], allowed);
  return { ...payload, reviews: next };
}

export function formatReviewStarsForQuery(allowed: readonly number[]): string {
  return normalizeReviewStarRatings([...allowed]).join(",");
}

export function resolveWidgetReviewStarRatings(
  queryRaw: string | undefined,
  embedSettings: unknown,
  type: WidgetType,
): number[] {
  const fromQuery = parseReviewStarsQueryParam(queryRaw);
  if (fromQuery) return normalizeReviewStarRatings(fromQuery);
  if (
    embedSettings &&
    typeof embedSettings === "object" &&
    embedSettings !== null &&
    "reviewStarRatingsByType" in embedSettings
  ) {
    const map = (embedSettings as { reviewStarRatingsByType?: unknown }).reviewStarRatingsByType;
    if (map && typeof map === "object" && type in map) {
      return normalizeReviewStarRatings((map as Record<string, unknown>)[type]);
    }
  }
  return [...DEFAULT_REVIEW_STAR_RATINGS];
}
