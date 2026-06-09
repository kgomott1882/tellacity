import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArticleContentDoc } from "../types";
import { getActivePlanKeyForBusiness, getExternalLinkLimitForPlan } from "@/lib/plans";
import type { LinkValidationIssue, LinkValidationResult } from "./validateArticleLinks";
import { validateArticleContent } from "../validation/ArticleValidationService";

export type EnforceArticleLinkValidationInput = {
  content: ArticleContentDoc;
  caseStudyFields?: {
    clientIndustry?: string | null;
    challenge?: string | null;
    solution?: string | null;
    results?: string | null;
  };
  businessWebsite?: string | null;
};

export async function fetchBusinessWebsite(
  db: SupabaseClient,
  businessId: string,
): Promise<string | null> {
  const { data } = await db
    .from("businesses")
    .select("website")
    .eq("id", businessId)
    .maybeSingle();
  return typeof data?.website === "string" ? data.website : null;
}

export async function logArticleValidationFailures(
  db: SupabaseClient,
  params: {
    articleId: string;
    businessId: string;
    issues: LinkValidationIssue[];
  },
): Promise<void> {
  if (!params.issues.length) return;

  const rows = params.issues.map((item) => ({
    article_id: params.articleId,
    business_id: params.businessId,
    validation_type: item.code,
    message: item.message,
  }));

  const { error } = await db.from("article_validation_logs").insert(rows);
  if (error) {
    console.error("[article link validation] log insert failed", error.message);
  }
}

export async function enforceArticleLinkValidation(
  db: SupabaseClient,
  params: {
    businessId: string;
    articleId: string;
    input: EnforceArticleLinkValidationInput;
  },
): Promise<
  | { ok: true; result: LinkValidationResult }
  | { ok: false; result: LinkValidationResult; message: string }
> {
  let businessWebsite = params.input.businessWebsite;
  if (businessWebsite === undefined) {
    businessWebsite = await fetchBusinessWebsite(db, params.businessId);
  }

  const planKey = await getActivePlanKeyForBusiness(params.businessId, db);
  const maxExternalLinks = getExternalLinkLimitForPlan(planKey);

  const validation = validateArticleContent({
    content: params.input.content,
    caseStudyFields: params.input.caseStudyFields,
    businessWebsite,
    maxExternalLinks,
  });
  const result = validation.linkValidation;

  if (validation.ok) {
    return { ok: true, result };
  }

  await logArticleValidationFailures(db, {
    articleId: params.articleId,
    businessId: params.businessId,
    issues: validation.issues,
  });

  return {
    ok: false,
    result,
    message: result.issues[0]?.message ?? "Article link validation failed.",
  };
}
