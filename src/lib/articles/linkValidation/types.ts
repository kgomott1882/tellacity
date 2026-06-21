import type { ArticleContentDoc } from "../types";
import { DEFAULT_MAX_EXTERNAL_LINKS } from "./constants";

export type LinkValidationErrorCode =
  | "external_link_limit"
  | "affiliate_link"
  | "url_shortener"
  | "gambling_link"
  | "adult_link"
  | "unsafe_download"
  | "repeated_link";

export type LinkValidationIssue = {
  code: LinkValidationErrorCode;
  message: string;
};

export type LinkValidationResult = {
  ok: boolean;
  issues: LinkValidationIssue[];
  /** External links counted toward the limit (after exemptions). */
  externalLinkCount: number;
  /** Plan-specific maximum external links for this validation run. */
  maxExternalLinks: number;
};

export type ArticleLinkValidationInput = {
  content: ArticleContentDoc;
  caseStudyFields?: {
    clientIndustry?: string | null;
    challenge?: string | null;
    solution?: string | null;
    results?: string | null;
  };
  businessWebsite?: string | null;
  /** Defaults to Grow-tier limit when omitted. */
  maxExternalLinks?: number;
  /** Tellacity admin platform articles only, skip all link blockers. */
  bypassLinkRestrictions?: boolean;
};

export { DEFAULT_MAX_EXTERNAL_LINKS, MAX_EXTERNAL_LINKS, MAX_SAME_EXTERNAL_URL_OCCURRENCES } from "./constants";

export function externalLinkLimitMessage(limit: number): string {
  return `You can include a maximum of ${limit} external links per article.`;
}

export const LINK_VALIDATION_MESSAGES: Record<
  Exclude<LinkValidationErrorCode, "external_link_limit">,
  string
> & { external_link_limit: string } = {
  external_link_limit: externalLinkLimitMessage(DEFAULT_MAX_EXTERNAL_LINKS),
  affiliate_link: "Affiliate links are not allowed in articles.",
  url_shortener: "URL shorteners are not allowed in articles.",
  gambling_link: "Gambling-related links are not allowed.",
  adult_link: "Adult-content links are not allowed.",
  unsafe_download: "Unsafe download links are not allowed.",
  repeated_link: "Repeated external links detected. Please reduce duplicate links.",
};
