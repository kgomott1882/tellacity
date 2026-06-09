import type {
  ArticleLinkValidationInput,
  LinkValidationIssue,
  LinkValidationResult,
} from "../linkValidation/types";
import { validateArticleLinks } from "../linkValidation/validateArticleLinks";

/** Result from the article validation pipeline (extensible for future rules). */
export type ArticleValidationResult = {
  ok: boolean;
  linkValidation: LinkValidationResult;
  issues: LinkValidationIssue[];
};

/**
 * Central article validation entry point.
 * Add future rules (keyword stuffing, AI spam, plagiarism) as additional steps here.
 */
export function validateArticleContent(
  input: ArticleLinkValidationInput,
): ArticleValidationResult {
  const linkValidation = validateArticleLinks(input);
  const issues = [...linkValidation.issues];

  return {
    ok: issues.length === 0,
    linkValidation,
    issues,
  };
}

export { validateArticleLinks } from "../linkValidation/validateArticleLinks";
export type {
  ArticleLinkValidationInput,
  LinkValidationErrorCode,
  LinkValidationIssue,
  LinkValidationResult,
} from "../linkValidation/types";
export {
  LINK_VALIDATION_MESSAGES,
  MAX_EXTERNAL_LINKS,
  MAX_SAME_EXTERNAL_URL_OCCURRENCES,
} from "../linkValidation/types";
