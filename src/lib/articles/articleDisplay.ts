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

function collapseArticlePlainText(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function firstParagraphPlainFromHtml(html: string): string {
  const match = html.match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
  if (!match?.[1]) return collapseArticlePlainText(html).slice(0, 500);
  return collapseArticlePlainText(match[1]);
}

/**
 * True when a lead/excerpt repeats the opening paragraph of the HTML body
 * (common for admin platform articles where excerpt is auto-derived from content).
 */
export function articleLeadDuplicatesBodyOpening(
  description: string | null | undefined,
  bodyHtml: string | null | undefined,
): boolean {
  const lead = collapseArticlePlainText(description ?? "");
  const opening = firstParagraphPlainFromHtml(bodyHtml ?? "");
  if (!lead || !opening || lead.length < 40) return false;

  const leadNorm = lead.toLowerCase().replace(/…$/, "").replace(/\.\.\.$/, "").trim();
  const openNorm = opening.toLowerCase();

  if (openNorm === leadNorm) return true;
  if (openNorm.startsWith(leadNorm)) return true;
  if (leadNorm.startsWith(openNorm)) return true;

  const prefixLen = Math.min(leadNorm.length, 120);
  const leadPrefix = leadNorm.slice(0, prefixLen);
  return leadPrefix.length >= 40 && openNorm.startsWith(leadPrefix);
}
