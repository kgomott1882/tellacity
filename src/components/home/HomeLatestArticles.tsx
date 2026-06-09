"use client";

import Link from "next/link";
import ArticleHubCard from "@/components/articles/ArticleHubCard";
import { FadeUp } from "@/components/ui/MotionWrapper";
import type { HubArticleCard } from "@/lib/articles/hubArticles";

type Props = {
  articles: HubArticleCard[];
};

const MOBILE_ARTICLE_SLIDE_CLASS =
  "w-[calc((100vw-3rem)*0.78)] min-w-[280px] max-w-[340px] shrink-0 snap-center";

export function HomeLatestArticlesSkeleton() {
  return (
    <section aria-hidden className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10 md:py-12">
      <div className="h-8 w-48 animate-pulse rounded-md bg-gray-200" />
      <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-gray-100" />
      <div className="mt-8 flex gap-6 overflow-hidden sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:w-auto ${i > 1 ? "hidden sm:block" : MOBILE_ARTICLE_SLIDE_CLASS}`}
          >
            <div className="aspect-[16/10] w-full animate-pulse bg-gray-100" />
            <div className="space-y-3 p-5">
              <div className="h-3 w-20 animate-pulse rounded bg-gray-100" />
              <div className="h-5 w-full animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function HomeLatestArticles({ articles }: Props) {
  if (!articles.length) return null;

  return (
    <FadeUp>
      <section aria-labelledby="home-latest-articles-title">
        <div className="mx-auto w-full max-w-6xl px-6 py-8 sm:py-10 md:py-12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2
                id="home-latest-articles-title"
                className="home-section-title text-xl sm:text-2xl md:text-3xl"
              >
                <span className="relative inline-block">
                  <span className="relative z-10 home-section-title-accent">Latest</span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#00B4A6]/25" />
                </span>{" "}
                Articles
              </h2>
              <p className="home-section-sub mt-3 max-w-3xl text-sm sm:text-base">
                Insights, business guides, case studies, and updates from Tellacity and verified
                businesses.
              </p>
            </div>
            <Link
              href="/articles"
              className="inline-flex shrink-0 items-center text-sm font-semibold text-[#1FAF9E] hover:underline"
            >
              View All Articles →
            </Link>
          </div>

          {/* Mobile: horizontal swipe strip with next card peeking */}
          <div
            className="mt-8 flex snap-x snap-mandatory gap-6 overflow-x-auto pb-2 pr-6 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            aria-label="Latest articles carousel"
          >
            {articles.map((item) => (
              <div key={item.id} className={MOBILE_ARTICLE_SLIDE_CLASS}>
                <ArticleHubCard item={item} className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md" />
              </div>
            ))}
          </div>

          {/* Tablet + desktop grid */}
          <div className="mt-8 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
            {articles.map((item) => (
              <ArticleHubCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </section>
    </FadeUp>
  );
}
