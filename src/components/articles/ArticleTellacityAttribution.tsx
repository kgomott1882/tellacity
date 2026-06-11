import Link from "next/link";
import WriterBylineAvatar from "@/components/articles/WriterBylineAvatar";
import {
  formatArticleMonthYear,
  shouldShowArticleLastUpdated,
} from "@/lib/articles/articleDisplay";

type Props = {
  publishedAt: string;
  updatedAt?: string | null;
  authorName?: string | null;
  authorTitle?: string | null;
  authorAvatarUrl?: string | null;
};

export default function ArticleTellacityAttribution({
  publishedAt,
  updatedAt = null,
  authorName,
  authorTitle,
  authorAvatarUrl,
}: Props) {
  const publishedLabel = formatArticleMonthYear(publishedAt);
  const showLastUpdated = shouldShowArticleLastUpdated(publishedAt, updatedAt);
  const lastUpdatedLabel = showLastUpdated ? formatArticleMonthYear(updatedAt) : null;
  const trimmedAuthorName = authorName?.trim() ?? "";
  const trimmedAuthorTitle = authorTitle?.trim() ?? "";
  const hasWriter = Boolean(trimmedAuthorName);

  return (
    <section
      aria-labelledby="article-attribution-heading"
      className="mt-12 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <h2 id="article-attribution-heading" className="sr-only">
        Article attribution
      </h2>

      <div className={`grid ${hasWriter ? "lg:grid-cols-[1fr_1.15fr]" : ""}`}>
        {hasWriter ? (
          <div className="border-b border-gray-100 bg-gradient-to-br from-[#F8FBFA] to-white p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">
              Written by
            </p>
            <div className="mt-4 flex items-start gap-4">
              <WriterBylineAvatar
                name={trimmedAuthorName}
                avatarUrl={authorAvatarUrl}
              />
              <div className="min-w-0">
                <p className="text-xl font-semibold leading-tight text-[#0E0E0E]">
                  {trimmedAuthorName}
                </p>
                {trimmedAuthorTitle ? (
                  <p className="mt-1 text-sm leading-relaxed text-[#707070]">
                    {trimmedAuthorTitle}
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#888]">
            Published by
          </p>
          <div className="mt-4 flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-[#1FAF9E]/10 text-sm font-semibold text-[#0E4E45]"
              aria-hidden
            >
              T
            </div>
            <div className="min-w-0 flex-1">
              <Link
                href="/about"
                className="text-xl font-semibold leading-tight text-[#0E0E0E] hover:text-[#124541]"
              >
                Tellacity
              </Link>
              <p className="mt-1 text-sm text-[#707070]">
                Editorial guides on reviews, trust, and reputation
              </p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#707070]">
                {publishedLabel ? <span>Published {publishedLabel}</span> : null}
                {lastUpdatedLabel ? <span>Last updated {lastUpdatedLabel}</span> : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
