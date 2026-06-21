import type {
  ArticleLinkValidationInput,
  LinkValidationIssue,
  LinkValidationResult,
} from "./types";
import {
  DEFAULT_MAX_EXTERNAL_LINKS,
  externalLinkLimitMessage,
  LINK_VALIDATION_MESSAGES,
  MAX_SAME_EXTERNAL_URL_OCCURRENCES,
} from "./types";
import { extractLinksFromArticle } from "./extractLinks";
import {
  isExternalCountedLink,
  isTellacityInternalLink,
  normalizeUrlForComparison,
  parseHttpUrl,
} from "./urlUtils";
import {
  isAdultLink,
  isAffiliateLink,
  isGamblingLink,
  isUnsafeDownloadLink,
  isUrlShortener,
} from "./rules";

function issue(code: LinkValidationIssue["code"], message?: string): LinkValidationIssue {
  if (code === "external_link_limit") {
    return { code, message: message ?? LINK_VALIDATION_MESSAGES.external_link_limit };
  }
  return { code, message: message ?? LINK_VALIDATION_MESSAGES[code] };
}

/**
 * Validates all links in article content (client + server).
 * Pure function, no I/O.
 */
export function validateArticleLinks(input: ArticleLinkValidationInput): LinkValidationResult {
  const issues: LinkValidationIssue[] = [];
  const businessWebsite = input.businessWebsite ?? null;
  const maxExternalLinks = input.maxExternalLinks ?? DEFAULT_MAX_EXTERNAL_LINKS;
  const rawLinks = extractLinksFromArticle(input);

  const externalLinks: string[] = [];
  const externalOccurrences = new Map<string, number>();

  for (const raw of rawLinks) {
    if (isTellacityInternalLink(raw)) continue;

    const url = parseHttpUrl(raw);
    if (!url) continue;

    if (!input.bypassLinkRestrictions) {
      if (isAffiliateLink(raw)) {
        issues.push(issue("affiliate_link"));
        continue;
      }
      if (isUrlShortener(raw)) {
        issues.push(issue("url_shortener"));
        continue;
      }
      if (isGamblingLink(raw)) {
        issues.push(issue("gambling_link"));
        continue;
      }
      if (isAdultLink(raw)) {
        issues.push(issue("adult_link"));
        continue;
      }
      if (isUnsafeDownloadLink(raw)) {
        issues.push(issue("unsafe_download"));
        continue;
      }
    }

    if (isExternalCountedLink(raw, businessWebsite)) {
      externalLinks.push(raw);
      const key = normalizeUrlForComparison(url);
      externalOccurrences.set(key, (externalOccurrences.get(key) ?? 0) + 1);
    }
  }

  if (input.bypassLinkRestrictions) {
    return {
      ok: true,
      issues: [],
      externalLinkCount: externalLinks.length,
      maxExternalLinks,
    };
  }

  if (externalLinks.length > maxExternalLinks) {
    issues.push(issue("external_link_limit", externalLinkLimitMessage(maxExternalLinks)));
  }

  for (const count of externalOccurrences.values()) {
    if (count > MAX_SAME_EXTERNAL_URL_OCCURRENCES) {
      issues.push(issue("repeated_link"));
      break;
    }
  }

  const uniqueIssues = dedupeIssues(issues);

  return {
    ok: uniqueIssues.length === 0,
    issues: uniqueIssues,
    externalLinkCount: externalLinks.length,
    maxExternalLinks,
  };
}

function dedupeIssues(issues: LinkValidationIssue[]): LinkValidationIssue[] {
  const seen = new Set<string>();
  const out: LinkValidationIssue[] = [];
  for (const item of issues) {
    if (seen.has(item.code)) continue;
    seen.add(item.code);
    out.push(item);
  }
  return out;
}

export {
  DEFAULT_MAX_EXTERNAL_LINKS,
  MAX_EXTERNAL_LINKS,
  MAX_SAME_EXTERNAL_URL_OCCURRENCES,
} from "./constants";
export { externalLinkLimitMessage, LINK_VALIDATION_MESSAGES } from "./types";
export type {
  ArticleLinkValidationInput,
  LinkValidationErrorCode,
  LinkValidationIssue,
  LinkValidationResult,
} from "./types";
