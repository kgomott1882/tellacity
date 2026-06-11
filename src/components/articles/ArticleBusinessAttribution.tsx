import Link from "next/link";
import WriterBylineAvatar from "@/components/articles/WriterBylineAvatar";
import {
  formatArticleMonthYear,
  shouldShowArticleLastUpdated,
} from "@/lib/articles/articleDisplay";
import { formatBusinessTagLabel } from "@/lib/businessTags";

type Props = {
  businessName: string;
  businessProfileHref: string;
  businessLogoUrl: string | null;
  categorySlug: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  authorName: string | null;
  authorTitle: string | null;
  authorAvatarUrl?: string | null;
};

export default function ArticleBusinessAttribution({
  businessName,
  businessProfileHref,
  businessLogoUrl,
  categorySlug,
  publishedAt,
  updatedAt,
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
            {businessLogoUrl ? (
              <Link href={businessProfileHref} className="shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={businessLogoUrl}
                  alt=""
                  className="h-14 w-14 rounded-xl border border-gray-100 bg-white object-contain p-1"
                />
              </Link>
            ) : (
              <div
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-gray-100 bg-[#F5F3EF] text-sm font-semibold text-[#707070]"
                aria-hidden
              >
                {businessName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <Link
                href={businessProfileHref}
                className="text-xl font-semibold leading-tight text-[#0E0E0E] hover:text-[#124541]"
              >
                {businessName}
              </Link>
              {categorySlug ? (
                <p className="mt-1 text-sm text-[#707070]">
                  {formatBusinessTagLabel(categorySlug)}
                </p>
              ) : null}

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
