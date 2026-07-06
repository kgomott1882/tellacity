"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, ImageIcon } from "lucide-react";
import RatingStars from "@/components/RatingStars";
import {
  CATEGORY_DIRECTORY_TAB_ACTIVE_CLASS,
  CATEGORY_DIRECTORY_TAB_LINK_CLASS,
  formatBusinessTagLabel,
  mergeTagsForDisplay,
} from "@/lib/businessTags";
import {
  formatBusinessAddressLines,
  formatDisplayLocationLines,
} from "@/lib/address";
import { sanitizeText } from "@/lib/sanitizeText";
import {
  businessHasPublishedReviewsForRanking,
  type CategoryBusinessRow,
} from "@/lib/categoryListingQueries";

type BusinessRow = CategoryBusinessRow;

function categoryListLogoUrl(
  row: Pick<BusinessRow, "website"> & {
    logo_url?: string | null;
    resolved_logo_url?: string | null;
  },
  similarBusinessLogoUrl: (args: {
    resolved_logo_url: string | null;
    logo_url: string | null;
    website: string | null;
  }) => string | null,
): string | null {
  return similarBusinessLogoUrl({
    resolved_logo_url: row.resolved_logo_url ?? null,
    logo_url: row.logo_url ?? null,
    website: row.website,
  });
}

function snapshotRpcRating(row: BusinessRow): { trust: number; count: number } {
  const trust =
    (Number(row.trust_score ?? 0) || 0) ||
    (Number(row.average_rating ?? 0) || 0) ||
    (Number(row.avg_rating ?? 0) || 0);
  return { trust, count: Number(row.review_count ?? 0) || 0 };
}

type Props = {
  business: BusinessRow;
  rankBadge?: 1 | 2 | 3 | null;
  listingKind: "category" | "tag";
  categorySlug: string;
  countryCode: string;
  logoResolver: (args: {
    resolved_logo_url: string | null;
    logo_url: string | null;
    website: string | null;
  }) => string | null;
  isValidSlug: (slug: string) => boolean;
  slugForTagChip: (raw: string) => string | null;
  toTagSlug: (tagName: string) => string;
  categoryBrowseHref: (catSlug: string, country: string) => string;
  tagBrowseHref: (tagSlug: string, country: string) => string;
  shouldShowPrimaryCategoryChip: (
    listingKind: "category" | "tag",
    pageCategorySlug: string,
    businessPrimary: string | null | undefined,
  ) => boolean;
  filterKeywordTagsForPage: (
    mergedTags: string[],
    listingKind: "category" | "tag",
    pageSlug: string,
  ) => string[];
  showTags?: boolean;
  showAddress?: boolean;
};

export default function CategoryDirectoryBusinessCard({
  business,
  rankBadge = null,
  listingKind,
  categorySlug,
  countryCode,
  logoResolver,
  isValidSlug,
  slugForTagChip,
  toTagSlug,
  categoryBrowseHref,
  tagBrowseHref,
  shouldShowPrimaryCategoryChip,
  filterKeywordTagsForPage,
  showTags = true,
  showAddress = true,
}: Props) {
  const safeSlug = (business.slug ?? "").trim().toLowerCase();
  const logoUrl = categoryListLogoUrl(business, logoResolver);
  const [logoImageFailed, setLogoImageFailed] = useState(false);

  useEffect(() => {
    setLogoImageFailed(false);
  }, [logoUrl]);

  if (!isValidSlug(safeSlug)) return null;

  const reviewCount = Number(business.review_count ?? 0) || 0;
  const showRankBadge =
    rankBadge != null && businessHasPublishedReviewsForRanking(business);
  const ratingValue = snapshotRpcRating(business).trust;
  const locationLines = (() => {
    const lines = formatBusinessAddressLines(
      business.address,
      business.city,
      business.country_code,
    );
    if (lines.length > 0) return lines;
    return formatDisplayLocationLines(business.display_location ?? "");
  })();

  const businessTags = mergeTagsForDisplay(
    business.tags,
    business.secondary_category_slugs,
    business.category_slug,
  );
  const keywordTags = filterKeywordTagsForPage(
    businessTags,
    listingKind,
    categorySlug,
  );
  const showPrimaryChip = shouldShowPrimaryCategoryChip(
    listingKind,
    categorySlug,
    business.category_slug,
  );
  const pageCatNorm = categorySlug.trim().toLowerCase();
  const name = sanitizeText(business.name);
  const showLogoImage = Boolean(logoUrl) && !logoImageFailed;

  return (
    <article className="cat-dir-biz-card">
      {showRankBadge ? (
        <span
          className={`cat-dir-rank-badge cat-dir-rank-badge--${rankBadge}`}
        >
          {rankBadge === 1 ? "🥇 #1" : rankBadge === 2 ? "🥈 #2" : "🥉 #3"}
        </span>
      ) : null}
      <div className="cat-dir-biz-card-inner">
        <Link
          href={`/b/${safeSlug}`}
          className="flex min-w-0 flex-1 gap-3 no-underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00B4A6]/40"
        >
          {showLogoImage ? (
            <div className="cat-dir-biz-logo">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl!}
                alt={`${name} logo`}
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
                loading="lazy"
                decoding="async"
                onError={() => setLogoImageFailed(true)}
              />
            </div>
          ) : (
            <div className="cat-dir-biz-logo cat-dir-biz-logo--empty" aria-hidden>
              <ImageIcon className="cat-dir-biz-logo-placeholder-icon" strokeWidth={1.5} />
            </div>
          )}

          <div className="cat-dir-biz-main">
            <div className="flex items-center gap-1">
              <div className="cat-dir-biz-name truncate">{name}</div>
              {reviewCount > 0 ? (
                <img
                  src="/brand/Tellacity%20Vefication%20Batch.png"
                  alt="Tellacity verified reviews"
                  className="h-5 w-5 shrink-0"
                />
              ) : null}
            </div>
            {business.website ? (
              <div className="cat-dir-biz-website">
                <span className="truncate">{sanitizeText(business.website)}</span>
                <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
              </div>
            ) : null}
            <div className="cat-dir-biz-rating">
              <RatingStars
                rating={ratingValue}
                reviewCount={reviewCount}
                size={12}
                className="home-rating-gold"
              />
              <span className="cat-dir-biz-rating-num">
                {ratingValue.toFixed(1)}
              </span>
              <span className="cat-dir-biz-rating-count">
                · {reviewCount.toLocaleString("en-US")} reviews
              </span>
            </div>
          </div>
        </Link>

        {showAddress && locationLines.length > 0 ? (
          <aside className="cat-dir-biz-address">
            {locationLines.map((line, idx) => (
              <div
                key={`${business.id}-loc-${idx}`}
                className={
                  idx === 0 && locationLines.length > 1
                    ? "cat-dir-biz-address-city max-w-full break-words"
                    : "max-w-full break-words"
                }
              >
                {sanitizeText(line)}
              </div>
            ))}
          </aside>
        ) : null}
      </div>

      {showTags && (showPrimaryChip || keywordTags.length > 0) ? (
        <div className="cat-dir-biz-tags border-t border-[#F0F0F0] px-4 pb-3 pt-2 sm:pl-[4.75rem]">
          {showPrimaryChip && business.category_slug
            ? (() => {
                const slug =
                  slugForTagChip(business.category_slug) ??
                  business.category_slug.trim().toLowerCase();
                if (!isValidSlug(slug)) return null;
                return (
                  <Link
                    href={categoryBrowseHref(slug, countryCode)}
                    className={`${CATEGORY_DIRECTORY_TAB_LINK_CLASS} cat-dir-biz-tag`}
                  >
                    {formatBusinessTagLabel(business.category_slug)}
                  </Link>
                );
              })()
            : null}
          {keywordTags.map((tag) => {
            const slug = slugForTagChip(tag);
            if (!slug) return null;
            const activeTag = listingKind === "tag" && slug === pageCatNorm;
            return activeTag ? (
              <span
                key={`${business.id}-${tag}`}
                className={`${CATEGORY_DIRECTORY_TAB_ACTIVE_CLASS} cat-dir-biz-tag cat-dir-biz-tag--active`}
                aria-current="page"
              >
                {formatBusinessTagLabel(tag)}
              </span>
            ) : (
              <Link
                key={`${business.id}-${tag}`}
                href={tagBrowseHref(slug, countryCode)}
                className={`${CATEGORY_DIRECTORY_TAB_LINK_CLASS} cat-dir-biz-tag`}
              >
                {formatBusinessTagLabel(tag)}
              </Link>
            );
          })}
        </div>
      ) : null}
    </article>
  );
}

export { snapshotRpcRating };
