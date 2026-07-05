export type ArticleContentType = "article" | "case_study";

export function parseArticleContentType(raw: unknown): ArticleContentType | null {
  const v = String(raw ?? "").trim().toLowerCase();
  if (v === "article" || v === "case_study") return v;
  return null;
}

export type ArticleStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected"
  | "archived";

export type ArticleRevisionStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected";

export type ArticleImageKind = "featured" | "inline";

export type TipTapMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type TipTapNode = {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TipTapNode[];
  text?: string;
  marks?: TipTapMark[];
};

export type ArticleContentDoc = {
  type: "doc";
  content?: TipTapNode[];
};

export type ArticleFaqItem = {
  question: string;
  answer: string;
};

export type ArticleRow = {
  id: string;
  business_id: string;
  author_user_id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: ArticleContentDoc;
  content_type: ArticleContentType;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  meta_title: string | null;
  meta_description: string | null;
  key_takeaways: string[] | null;
  faq: ArticleFaqItem[] | null;
  tags: string[] | null;
  primary_keyword: string | null;
  target_audience: string | null;
  content_goal: string | null;
  status: ArticleStatus;
  client_industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  author_name: string | null;
  author_title: string | null;
  author_bio: string | null;
  author_avatar_url: string | null;
  archived_at: string | null;
  status_before_archive: string | null;
  published_at: string | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
  current_version?: number;
  active_revision_id?: string | null;
};

export type ArticleRevisionRow = {
  id: string;
  article_id: string;
  version_number: number;
  title: string;
  excerpt: string | null;
  content: ArticleContentDoc;
  content_type: ArticleContentType;
  featured_image_url: string | null;
  featured_image_alt: string | null;
  featured_image_width: number | null;
  featured_image_height: number | null;
  meta_title: string | null;
  meta_description: string | null;
  key_takeaways: string[] | null;
  faq: ArticleFaqItem[] | null;
  tags: string[] | null;
  primary_keyword: string | null;
  target_audience: string | null;
  content_goal: string | null;
  client_industry: string | null;
  challenge: string | null;
  solution: string | null;
  results: string | null;
  author_name: string | null;
  author_title: string | null;
  author_bio: string | null;
  author_avatar_url: string | null;
  status: ArticleRevisionStatus;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
};

export type ArticleWithBusiness = ArticleRow & {
  businesses?: {
    id: string;
    name: string | null;
    slug: string | null;
    logo_url?: string | null;
    website?: string | null;
    category_slug?: string | null;
  } | null;
};

export type ArticleUsageSummary = {
  used: number;
  limit: number;
  remaining: number;
  billingMonth: string;
};
