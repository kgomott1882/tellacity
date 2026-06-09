import type { ArticleContentDoc, TipTapNode } from "../types";
import type { ArticleLinkValidationInput } from "./types";
import { extractLinksFromArticle } from "./extractLinks";
import { validateArticleLinks } from "./validateArticleLinks";
import {
  isAdultLink,
  isAffiliateLink,
  isGamblingLink,
  isUnsafeDownloadLink,
  isUrlShortener,
} from "./rules";
import { isExternalCountedLink } from "./urlUtils";
import { LINK_VALIDATION_MESSAGES } from "./types";

function normalizeHref(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return trimmed;
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `https://${trimmed}`;
}

function appendLinkParagraph(content: ArticleContentDoc, href: string): ArticleContentDoc {
  const linkNode: TipTapNode = {
    type: "text",
    text: href,
    marks: [{ type: "link", attrs: { href } }],
  };
  const paragraph: TipTapNode = {
    type: "paragraph",
    content: [linkNode],
  };
  return {
    type: "doc",
    content: [...(content.content ?? []), paragraph],
  };
}

/**
 * Client-side check before inserting a new link in the editor.
 * Returns a user-facing block reason, or null if the link may be added.
 */
export function validateProposedArticleLink(
  href: string,
  input: ArticleLinkValidationInput,
  options?: { replacingHref?: string | null },
): string | null {
  if (input.bypassLinkRestrictions) return null;

  const normalized = normalizeHref(href);
  if (!normalized) return null;

  if (isAffiliateLink(normalized)) return LINK_VALIDATION_MESSAGES.affiliate_link;
  if (isUrlShortener(normalized)) return LINK_VALIDATION_MESSAGES.url_shortener;
  if (isGamblingLink(normalized)) return LINK_VALIDATION_MESSAGES.gambling_link;
  if (isAdultLink(normalized)) return LINK_VALIDATION_MESSAGES.adult_link;
  if (isUnsafeDownloadLink(normalized)) return LINK_VALIDATION_MESSAGES.unsafe_download;

  const replacingHref = options?.replacingHref?.trim();
  if (replacingHref) {
    return validateReplacingArticleLink(normalized, replacingHref, input);
  }

  const before = validateArticleLinks(input);
  const existingLinks = extractLinksFromArticle(input);
  const alreadyPresent = existingLinks.some(
    (link) => link.trim().toLowerCase() === normalized.toLowerCase(),
  );

  if (alreadyPresent) {
    const afterDuplicate = validateArticleLinks({
      ...input,
      content: appendLinkParagraph(input.content, normalized),
    });
    if (!afterDuplicate.ok) {
      const repeated = afterDuplicate.issues.find((i) => i.code === "repeated_link");
      if (repeated) return repeated.message;
    }
    return null;
  }

  const after = validateArticleLinks({
    ...input,
    content: appendLinkParagraph(input.content, normalized),
  });

  if (after.ok) return null;

  if (!before.ok) {
    return before.issues[0]?.message ?? after.issues[0]?.message ?? null;
  }

  return after.issues[0]?.message ?? null;
}

function validateReplacingArticleLink(
  newHref: string,
  oldHref: string,
  input: ArticleLinkValidationInput,
): string | null {
  const oldNorm = normalizeHref(oldHref);
  if (oldNorm === newHref) return null;

  const businessWebsite = input.businessWebsite ?? null;
  const before = validateArticleLinks(input);
  const oldExternal = Boolean(oldNorm && isExternalCountedLink(oldNorm, businessWebsite));
  const newExternal = isExternalCountedLink(newHref, businessWebsite);

  if (oldExternal && newExternal) {
    const otherIssues = before.issues.filter((issue) => issue.code !== "external_link_limit");
    if (otherIssues.length === 0) return null;
    return otherIssues[0]?.message ?? null;
  }

  if (!oldExternal && !newExternal) {
    return before.ok ? null : before.issues[0]?.message ?? null;
  }

  const links = extractLinksFromArticle(input);
  const nextLinks = [...links];
  const removeIdx = nextLinks.findIndex(
    (link) => normalizeHref(link) === oldNorm || link.trim() === oldHref.trim(),
  );
  if (removeIdx >= 0) nextLinks.splice(removeIdx, 1);
  nextLinks.push(newHref);

  const after = validateArticleLinks({
    content: buildDocFromLinks(nextLinks),
    caseStudyFields: input.caseStudyFields,
    businessWebsite: input.businessWebsite,
  });

  if (after.ok) return null;
  return after.issues[0]?.message ?? null;
}

function buildDocFromLinks(links: string[]): ArticleContentDoc {
  let doc: ArticleContentDoc = { type: "doc", content: [] };
  for (const link of links) {
    doc = appendLinkParagraph(doc, link);
  }
  return doc;
}
