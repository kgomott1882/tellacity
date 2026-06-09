"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ARTICLE_FILTER_CATEGORIES,
  ARTICLE_HUB_TYPE_FILTERS,
  type ArticleFilterCategory,
  type ArticleHubTypeFilter,
} from "@/lib/articles/articleCategories";
import { formatBusinessTagLabel } from "@/lib/businessTags";
import ArticleHubCard from "@/components/articles/ArticleHubCard";
import {
  buildArticlesHubQuery,
  type HubArticleCard,
} from "@/lib/articles/hubArticles";

type Props = {
  items: HubArticleCard[];
  page: number;
  totalPages: number;
  totalCount: number;
  typeFilter: ArticleHubTypeFilter;
  categoryFilter: ArticleFilterCategory;
  businessCategorySlug?: string | null;
  businessCategoryLabel?: string | null;
};

export default function ArticlesHubClient({
  items,
  page,
  totalPages,
  totalCount,
  typeFilter,
  categoryFilter,
  businessCategorySlug = null,
  businessCategoryLabel = null,
}: Props) {
  const router = useRouter();
  const categoryScopeLabel =
    businessCategoryLabel?.trim() ||
    (businessCategorySlug ? formatBusinessTagLabel(businessCategorySlug) : null);
  const isBusinessCategoryScope = Boolean(businessCategorySlug);

  const navigate = (next: {
    type?: ArticleHubTypeFilter;
    category?: ArticleFilterCategory;
    page?: number;
  }) => {
    router.push(
      buildArticlesHubQuery({
        type: next.type ?? typeFilter,
        category: next.category ?? categoryFilter,
        businessCategory: businessCategorySlug,
        page: next.page ?? 1,
      }),
    );
  };

  return (
    <main className="min-h-screen bg-[#F5F3EF]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <h1 className="text-3xl font-semibold text-[#0E0E0E]">
          {isBusinessCategoryScope && categoryScopeLabel
            ? `Articles in ${categoryScopeLabel}`
            : "Articles"}
        </h1>
        <p className="mt-3 max-w-3xl text-base text-[#505050]">
          {isBusinessCategoryScope && categoryScopeLabel
            ? `Explore articles, guides, and case studies published by businesses in ${categoryScopeLabel} on Tellacity.`
            : "Tellacity articles, business guides, and case studies in one place — editorial content from Tellacity plus stories published by verified businesses."}
        </p>

        <div className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[#888]">
              Content type
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {ARTICLE_HUB_TYPE_FILTERS.filter(
                (option) =>
                  !isBusinessCategoryScope || option.value !== "tellacity",
              ).map((option) => {
                const active = typeFilter === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => navigate({ type: option.value, page: 1 })}
                    className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                      active
                        ? "bg-[#1FAF9E] text-white"
                        : "border border-gray-200 bg-white text-[#404040] hover:border-[#1FAF9E]/40"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {!isBusinessCategoryScope ? (
            <div>
              <label
                htmlFor="articles-category-filter"
                className="text-xs font-semibold uppercase tracking-wide text-[#888]"
              >
                Category
              </label>
              <select
                id="articles-category-filter"
                value={categoryFilter}
                onChange={(event) =>
                  navigate({
                    category: event.target.value as ArticleFilterCategory,
                    page: 1,
                  })
                }
                className="mt-2 block w-full min-w-[14rem] rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
              >
                {ARTICLE_FILTER_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {categoryFilter !== "All" ? (
                <p className="mt-2 text-xs text-[#707070]">
                  Category filters apply to Tellacity articles. Business articles appear when
                  category is All.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-sm text-[#707070]">
          {totalCount} {totalCount === 1 ? "article" : "articles"}
        </p>

        {items.length === 0 ? (
          <div className="mt-10 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
            <p className="text-base font-medium text-[#0E0E0E]">
              {isBusinessCategoryScope && categoryScopeLabel
                ? `No articles have been published by businesses in ${categoryScopeLabel} yet.`
                : "No articles match these filters"}
            </p>
            <p className="mt-2 text-sm text-[#707070]">
              {isBusinessCategoryScope
                ? "Check back later or browse all articles on Tellacity."
                : "Try a different content type or set category to All."}
            </p>
            {isBusinessCategoryScope ? (
              <Link
                href="/articles"
                className="mt-4 inline-block text-sm font-semibold text-[#1FAF9E] hover:underline"
              >
                Browse all articles →
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <ArticleHubCard key={item.id} item={item} />
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <nav className="mt-10 flex items-center justify-center gap-4 text-sm">
            {page > 1 ? (
              <Link
                href={buildArticlesHubQuery({
                  type: typeFilter,
                  category: categoryFilter,
                  businessCategory: businessCategorySlug,
                  page: page - 1,
                })}
                className="font-medium text-[#1FAF9E] hover:underline"
              >
                ← Previous
              </Link>
            ) : null}
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={buildArticlesHubQuery({
                  type: typeFilter,
                  category: categoryFilter,
                  businessCategory: businessCategorySlug,
                  page: page + 1,
                })}
                className="font-medium text-[#1FAF9E] hover:underline"
              >
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
