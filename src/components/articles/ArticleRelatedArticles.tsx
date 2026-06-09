import Link from "next/link";
import type { RelatedArticleCard } from "@/lib/articles/relatedArticles";
import { articleDisplayTitle, formatArticlePublishedDate } from "@/lib/articles/articleDisplay";

type Props = {
  articles: RelatedArticleCard[];
};

export default function ArticleRelatedArticles({ articles }: Props) {
  if (articles.length === 0) return null;

  return (
    <section
      aria-labelledby="related-articles-heading"
      className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8"
    >
      <h2 id="related-articles-heading" className="text-lg font-semibold text-[#0E0E0E]">
        Related articles
      </h2>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {articles.map((article) => (
          <Link
            key={article.id}
            href={`/articles/${encodeURIComponent(article.slug)}`}
            className="group flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-[#FAFAF8] transition-shadow hover:shadow-md"
          >
            {article.featured_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={article.featured_image_url}
                alt=""
                className="aspect-[16/10] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div
                className="aspect-[16/10] bg-gradient-to-br from-[#E8F7F5] to-[#F5F3EF]"
                aria-hidden
              />
            )}
            <div className="flex flex-1 flex-col p-4">
              <h3 className="line-clamp-2 text-base font-semibold text-[#0E0E0E] group-hover:text-[#124541]">
                {articleDisplayTitle(article.title)}
              </h3>
              {article.business_name ? (
                <p className="mt-2 text-xs font-medium text-[#707070]">{article.business_name}</p>
              ) : null}
              <p className="mt-auto pt-3 text-xs text-[#888]">
                {formatArticlePublishedDate(article.published_at) ?? ""}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
