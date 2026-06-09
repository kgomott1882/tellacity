/** Editorial categories for Tellacity-written articles (migrated from Blog). */
export const ARTICLE_FILTER_CATEGORIES = [
  "All",
  "Reviews",
  "Trust",
  "Consumer Safety",
  "Platform Updates",
  "Comparisons",
  "Business Growth",
] as const;

export type ArticleFilterCategory = (typeof ARTICLE_FILTER_CATEGORIES)[number];
export type ArticleTopic = Exclude<ArticleFilterCategory, "All">;

export type TellacityPostMeta = { topic: ArticleTopic; whyRead: string };

export const TELLACITY_POST_META: Record<string, TellacityPostMeta> = {
  "how-to-get-more-customer-reviews": {
    topic: "Reviews",
    whyRead: "Proven ways to collect more customer feedback.",
  },
  "why-customers-dont-leave-reviews-how-to-fix": {
    topic: "Reviews",
    whyRead: "Fix the blockers that stop customers from reviewing.",
  },
  "turn-reviews-into-growth-2026": {
    topic: "Business Growth",
    whyRead: "Turn feedback into product and revenue insights.",
  },
  "review-response-playbook-2026": {
    topic: "Reviews",
    whyRead: "Respond publicly with a repeatable playbook.",
  },
  "import-reviews": {
    topic: "Platform Updates",
    whyRead: "Bring existing reviews into Tellacity step by step.",
  },
  "claim-tellacity-profile": {
    topic: "Business Growth",
    whyRead: "Why claiming your profile matters for trust.",
  },
  "trust-score-2025": {
    topic: "Trust",
    whyRead: "Understand how Tellacity calculates trust.",
  },
  "check-business-legit-2026": {
    topic: "Consumer Safety",
    whyRead: "Check a business before you spend money.",
  },
  "check-business-legit-2025": {
    topic: "Consumer Safety",
    whyRead: "Spot red flags before you buy online.",
  },
  "what-makes-a-review-useful-2025": {
    topic: "Trust",
    whyRead: "Learn what separates useful reviews from noise.",
  },
  "verified-review-2025": {
    topic: "Trust",
    whyRead: "See what verified reviews mean in practice.",
  },
  "online-shopping-scams-2025": {
    topic: "Consumer Safety",
    whyRead: "Avoid the most common shopping scams.",
  },
  "shopping-online-safely-2025": {
    topic: "Consumer Safety",
    whyRead: "Shop online with a practical safety checklist.",
  },
  "platform-update-2025": {
    topic: "Platform Updates",
    whyRead: "See what changed in Tellacity for 2025.",
  },
  "best-trustpilot-alternatives-2026": {
    topic: "Comparisons",
    whyRead: "Compare Trustpilot alternatives side by side.",
  },
  "google-reviews-vs-trustpilot-2026": {
    topic: "Comparisons",
    whyRead: "Decide between Google Reviews and Trustpilot.",
  },
  "best-review-platforms-small-business-2026": {
    topic: "Comparisons",
    whyRead: "Find review platforms that fit small teams.",
  },
};

export const ARTICLE_HUB_TYPE_FILTERS = [
  { value: "all", label: "All" },
  { value: "tellacity", label: "Tellacity Articles" },
  { value: "business", label: "Business Articles" },
  { value: "case_study", label: "Case Studies" },
] as const;

export type ArticleHubTypeFilter = (typeof ARTICLE_HUB_TYPE_FILTERS)[number]["value"];

export function getTellacityArticleTopic(slug: string): ArticleTopic | null {
  return TELLACITY_POST_META[slug.trim().toLowerCase()]?.topic ?? null;
}

export function parseArticleHubTypeFilter(raw: string | undefined): ArticleHubTypeFilter {
  if (raw === "tellacity" || raw === "business" || raw === "case_study") return raw;
  return "all";
}

export function parseArticleCategoryFilter(raw: string | undefined): ArticleFilterCategory {
  if (!raw) return "All";
  const match = ARTICLE_FILTER_CATEGORIES.find((c) => c.toLowerCase() === raw.toLowerCase());
  return match ?? "All";
}

export function hubContentTypeLabel(
  contentType: "tellacity" | "business" | "case_study",
): string {
  if (contentType === "tellacity") return "Tellacity Article";
  if (contentType === "case_study") return "Case Study";
  return "Business Article";
}
