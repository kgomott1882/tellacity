import Link from "next/link";
import { formatArticleMonthYear } from "@/lib/articles/articleDisplay";

type Props = {
  publishedAt: string;
};

export default function ArticleTellacityAttribution({ publishedAt }: Props) {
  const publishedLabel = formatArticleMonthYear(publishedAt);

  return (
    <section
      aria-labelledby="article-attribution-heading"
      className="mt-12 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
    >
      <h2 id="article-attribution-heading" className="sr-only">
        Article attribution
      </h2>
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
            {publishedLabel ? (
              <p className="mt-3 text-sm text-[#707070]">Published {publishedLabel}</p>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
