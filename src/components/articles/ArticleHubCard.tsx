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
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-[#1FAF9E]">
            {hubContentTypeLabel(item.contentType)}
          </p>
          {item.category && item.contentType === "tellacity" ? (
            <span className="rounded-full bg-[#F5F3EF] px-2 py-0.5 text-[11px] font-medium text-[#707070]">
              {item.category}
            </span>
          ) : null}
        </div>
        <h2 className="mt-2 text-lg font-semibold text-[#0E0E0E] group-hover:text-[#124541]">
          {item.title}
        </h2>
        <p className="mt-2 line-clamp-3 text-sm text-[#606060]">{item.excerpt}</p>
        <div className="mt-auto pt-4 text-xs text-[#888]">
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
