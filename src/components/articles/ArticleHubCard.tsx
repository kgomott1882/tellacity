import Link from "next/link";
import { hubContentTypeLabel } from "@/lib/articles/articleCategories";
import { formatArticlePublishedDate } from "@/lib/articles/articleDisplay";
import type { HubArticleCard } from "@/lib/articles/hubArticles";

type Props = {
  item: HubArticleCard;
  className?: string;
};

export default function ArticleHubCard({ item, className }: Props) {
  const publishedLabel = formatArticlePublishedDate(item.publishedAt);

  const sectionDivider = (
    <div
      className="-mx-1.5 my-3 h-px shrink-0 bg-gray-100"
      role="presentation"
      aria-hidden
    />
  );

  return (
    <Link
      href={`/articles/${encodeURIComponent(item.slug)}`}
      className={
        className ??
        "group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
      }
    >
      {item.featuredImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.featuredImageUrl}
          alt=""
          className="aspect-[16/10] w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className="aspect-[16/10] w-full bg-gradient-to-br from-[#E8F7F5] to-[#F5F3EF]"
          aria-hidden
        />
      )}
      <div className="flex flex-1 flex-col p-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-[8px] font-medium uppercase tracking-wide text-[#1FAF9E]">
              {hubContentTypeLabel(item.contentType)}
            </p>
          </div>
          <h2 className="mt-2 text-base font-semibold text-[#0E0E0E] group-hover:text-[#124541]">
            {item.title}
          </h2>
        </div>
        {sectionDivider}
        <p className="line-clamp-3 text-sm text-[#606060]">{item.excerpt}</p>
        {sectionDivider}
        <div className="mt-auto pt-1 text-xs text-[#888]">
          <span>
            Published by{" "}
            <span className="font-medium text-[#505050]">{item.publisherName}</span>
          </span>
          {publishedLabel ? ` · ${publishedLabel}` : null}
        </div>
      </div>
    </Link>
  );
}
