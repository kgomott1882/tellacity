"use client";

import ArticleContentRenderer from "@/components/articles/ArticleContentRenderer";
import { articleDisplayTitle } from "@/lib/articles/articleDisplay";
import type { ArticleContentDoc } from "@/lib/articles/types";

export type AdminArticlePreviewData = {
  title: string;
  content_type: string;
  featured_image_url: string | null;
  content: ArticleContentDoc;
  client_industry?: string | null;
  challenge?: string | null;
  solution?: string | null;
  results?: string | null;
};

export default function AdminArticleModerationPreview({ article }: { article: AdminArticlePreviewData }) {
  const isCaseStudy = article.content_type === "case_study";
  const displayTitle = articleDisplayTitle(article.title);

  return (
    <div className="rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-4 py-3 sm:px-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#1FAF9E]">
          Full article preview
        </p>
        <p className="mt-1 text-xs text-neutral-500">
          This is how the article body will appear after approval.
        </p>
      </div>

      <div className="max-h-[min(70vh,720px)] overflow-y-auto px-4 py-5 sm:px-6">
        <article className="mx-auto max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1FAF9E]">
            {isCaseStudy ? "Case Study" : "Article"}
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-neutral-900 sm:text-3xl">{displayTitle}</h3>

          {article.featured_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={article.featured_image_url}
              alt=""
              className="mt-6 w-full rounded-xl border border-neutral-100 object-cover"
            />
          ) : null}

          {isCaseStudy ? (
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {(
                [
                  ["Client industry", article.client_industry],
                  ["Challenge", article.challenge],
                  ["Solution", article.solution],
                  ["Results", article.results],
                ] as const
              ).map(([label, value]) =>
                value?.trim() ? (
                  <div key={label} className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                      {label}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                      {value}
                    </p>
                  </div>
                ) : null,
              )}
            </div>
          ) : null}

          <div className="article-body mt-8">
            <ArticleContentRenderer content={article.content} />
          </div>
        </article>
      </div>
    </div>
  );
}
