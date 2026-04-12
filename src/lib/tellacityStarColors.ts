/**
 * Tellacity tier colors for star ratings (1 = lowest, 5 = highest).
 * Shared by WidgetStars, embed widgets, and email HTML.
 */
export const TELLACITY_STAR_TIER_COLORS: readonly [string, string, string, string, string] = [
  "#F04438",
  "#F79009",
  "#FEC84B",
  "#84CC16",
  "#12B76A",
];

export const TELLACITY_STAR_EMPTY_BORDER = "#E4E7EC";
export const TELLACITY_STAR_EMPTY_FILL = "#EEF2F6";
export const TELLACITY_STAR_EMPTY_ICON = "#98A2B3";

/**
 * Color for every filled star cell at a given rounded rating (matches WidgetStars).
 * e.g. 4 → all active cells lime (#84CC16); 2 → both active cells orange (#F79009).
 */
export function tellacityActiveStarColorForRating(rating: number): string {
  const r = Math.min(5, Math.max(1, Math.round(Number(rating) || 1)));
  return TELLACITY_STAR_TIER_COLORS[r - 1];
}
