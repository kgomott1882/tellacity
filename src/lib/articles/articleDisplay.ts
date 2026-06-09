export function articleDisplayTitle(title: string | null | undefined): string {
  const trimmed = (title ?? "").trim();
  return trimmed || "Untitled draft";
}

/** Fixed locale so SSR and client hydration match on public pages. */
export function formatArticlePublishedDate(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/** Month + year for attribution lines, e.g. "June 2026". */
export function formatArticleMonthYear(iso: string | null | undefined): string | null {
  if (!iso) return null;
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return null;
  }
}

/** Show "Last updated" only when the article was materially updated after first publish. */
export function shouldShowArticleLastUpdated(
  publishedAt: string | null | undefined,
  updatedAt: string | null | undefined,
): boolean {
  if (!publishedAt || !updatedAt) return false;
  try {
    const published = new Date(publishedAt).getTime();
    const updated = new Date(updatedAt).getTime();
    if (!Number.isFinite(published) || !Number.isFinite(updated)) return false;
    if (updated <= published) return false;
    const publishedDay = new Date(publishedAt).toDateString();
    const updatedDay = new Date(updatedAt).toDateString();
    return publishedDay !== updatedDay;
  } catch {
    return false;
  }
}
