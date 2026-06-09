import Link from "next/link";
import { articleDisplayTitle, formatArticlePublishedDate } from "@/lib/articles/articleDisplay";

export type BusinessProfileArticleCard = {
  id: string;
  title: string;
  slug: string;
  featured_image_url: string | null;
  published_at: string | null;
};

export default function BusinessProfileArticles({
  businessName,
  businessSlug,
  articles,
  categoryLabel,
  categoryArticlesHref,
}: {
  businessName: string;
  businessSlug: string;
  articles: BusinessProfileArticleCard[];
  categoryLabel?: string | null;
  categoryArticlesHref?: string | null;
}) {
  const hasArticles = articles.length > 0;
  const showCategoryDiscovery = Boolean(categoryLabel?.trim() && categoryArticlesHref?.trim());

  return (
    <section aria-labelledby="business-articles-heading" className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 id="business-articles-heading" className="biz-section-title text-lg">
            <span className="biz-section-accent">Articles</span> &amp; resources
          </h2>
          <p className="biz-section-sub mt-3 text-sm">
            Insights, updates, guides, and resources published by {businessName}.
          </p>
        </div>
        {hasArticles ? (
          <Link
            href={`/b/${encodeURIComponent(businessSlug)}/articles`}
            className="biz-link-teal shrink-0 text-sm font-semibold"
          >
            View all articles →
          </Link>
        ) : null}
      </div>

      {hasArticles ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.slice(0, 3).map((a) => (
            <Link
              key={a.id}
              href={`/articles/${encodeURIComponent(a.slug)}`}
              className="biz-article-card group flex flex-col overflow-hidden"
            >
              {a.featured_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={a.featured_image_url}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-[16/10] bg-gradient-to-br from-[#E8F7F5] to-[#F5F3EF]" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <h3 className="line-clamp-2 text-base font-semibold text-[#0E0E0E] group-hover:text-[#124541]">
                  {articleDisplayTitle(a.title)}
                </h3>
                <p className="mt-auto pt-4 text-xs text-gray-500">
                  {formatArticlePublishedDate(a.published_at)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white px-4 py-5">
          <p className="text-sm text-gray-600">
            No articles have been published by this business yet.
          </p>
        </div>
      )}

      {showCategoryDiscovery ? (
        <p className="text-sm">
          <Link
            href={categoryArticlesHref!}
            className="biz-link-teal font-semibold hover:underline"
          >
            {hasArticles
              ? `Explore more articles in ${categoryLabel} →`
              : `Explore articles from businesses in ${categoryLabel} →`}
          </Link>
        </p>
      ) : null}
    </section>
  );
}
