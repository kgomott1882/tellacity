export const ARTICLE_SUBMIT_RETURN_PATH_KEY = "tellacity_article_submit_return_path";
export const ARTICLE_SUBMIT_INTENT_KEY = "tellacity_article_submit_intent";
export const ARTICLE_SUBMIT_SOURCE = "article_submit";

export type ArticleSubmitIntent = "need_plan" | "need_quota";

const VALID_INTENTS = new Set<ArticleSubmitIntent>(["need_plan", "need_quota"]);

export function isArticleSubmitIntent(
  raw: string | null | undefined,
): raw is ArticleSubmitIntent {
  const v = (raw ?? "").trim() as ArticleSubmitIntent;
  return VALID_INTENTS.has(v);
}

export function saveArticleSubmitContext(returnPath: string, intent: ArticleSubmitIntent): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(ARTICLE_SUBMIT_RETURN_PATH_KEY, returnPath);
    window.sessionStorage.setItem(ARTICLE_SUBMIT_INTENT_KEY, intent);
  } catch {
    // ignore
  }
}

export function readArticleSubmitContext(): {
  returnPath: string | null;
  intent: ArticleSubmitIntent | null;
} {
  if (typeof window === "undefined") {
    return { returnPath: null, intent: null };
  }
  try {
    const returnPath = window.sessionStorage.getItem(ARTICLE_SUBMIT_RETURN_PATH_KEY);
    const intentRaw = window.sessionStorage.getItem(ARTICLE_SUBMIT_INTENT_KEY);
    return {
      returnPath: returnPath?.trim() || null,
      intent: isArticleSubmitIntent(intentRaw) ? intentRaw : null,
    };
  } catch {
    return { returnPath: null, intent: null };
  }
}

export function clearArticleSubmitContext(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ARTICLE_SUBMIT_RETURN_PATH_KEY);
    window.sessionStorage.removeItem(ARTICLE_SUBMIT_INTENT_KEY);
  } catch {
    // ignore
  }
}

/** Navigate to pricing with saved return path so the user can resume their draft. */
export function openArticleSubmitPricingPage(
  returnPath: string,
  intent: ArticleSubmitIntent,
): void {
  saveArticleSubmitContext(returnPath, intent);
  const qs = new URLSearchParams({
    source: ARTICLE_SUBMIT_SOURCE,
    intent,
  });
  window.location.assign(`/business/dashboard/settings/usage?${qs.toString()}`);
}

export function articleEditorReturnPath(articleId: string): string {
  return `/business/dashboard/articles/${encodeURIComponent(articleId)}/edit`;
}
