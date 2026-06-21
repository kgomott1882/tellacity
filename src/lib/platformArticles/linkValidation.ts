import type { ArticleLinkValidationInput } from "@/lib/articles/linkValidation/types";

/** Admin Tellacity editorial articles, no link count or URL rule blockers. */
export const ADMIN_PLATFORM_ARTICLE_LINK_VALIDATION = {
  bypassLinkRestrictions: true,
  maxExternalLinks: 999_999,
} as const satisfies Partial<ArticleLinkValidationInput>;

export function adminPlatformArticleLinkInput(
  base: Pick<ArticleLinkValidationInput, "content" | "caseStudyFields" | "businessWebsite">,
): ArticleLinkValidationInput {
  return {
    ...base,
    ...ADMIN_PLATFORM_ARTICLE_LINK_VALIDATION,
  };
}
