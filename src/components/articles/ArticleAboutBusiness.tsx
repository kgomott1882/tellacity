import Link from "next/link";
import RatingStars from "@/components/RatingStars";
import { formatBusinessTagLabel } from "@/lib/businessTags";
import { formatBusinessAddressLines } from "@/lib/address";

type Props = {
  businessName: string;
  businessProfileHref: string | null;
  businessLogoUrl: string | null;
  description: string | null;
  categorySlug: string | null;
  city: string | null;
  countryCode: string | null;
  address: string | null;
  website: string | null;
  averageRating: number;
  reviewCount: number;
};

function websiteHref(raw: string): string {
  return raw.startsWith("http") ? raw : `https://${raw}`;
}

export default function ArticleAboutBusiness({
  businessName,
  businessProfileHref,
  businessLogoUrl,
  description,
  categorySlug,
  city,
  countryCode,
  address,
  website,
  averageRating,
  reviewCount,
}: Props) {
  const locationLines = formatBusinessAddressLines(address, city, countryCode);
  const trimmedDescription = description?.trim() ?? "";
  const websiteUrl = website?.trim() ? websiteHref(website.trim()) : null;

  return (
    <section
      aria-labelledby="article-about-business-heading"
      className="mt-8 rounded-2xl border border-gray-100 bg-white p-6 sm:p-8"
    >
      <h2 id="article-about-business-heading" className="text-lg font-semibold text-[#0E0E0E]">
        About this business
      </h2>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row">
        {businessLogoUrl && businessProfileHref ? (
          <Link href={businessProfileHref} className="shrink-0 self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={businessLogoUrl}
              alt=""
              className="h-20 w-20 rounded-xl border border-gray-100 bg-white object-contain p-1"
            />
          </Link>
        ) : businessLogoUrl ? (
          <div className="shrink-0 self-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={businessLogoUrl}
              alt=""
              className="h-20 w-20 rounded-xl border border-gray-100 bg-white object-contain p-1"
            />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {businessProfileHref ? (
            <Link
              href={businessProfileHref}
              className="text-xl font-semibold text-[#0E0E0E] hover:text-[#124541]"
            >
              {businessName}
            </Link>
          ) : (
            <p className="text-xl font-semibold text-[#0E0E0E]">{businessName}</p>
          )}

          {trimmedDescription ? (
            <p className="mt-3 text-sm leading-relaxed text-[#404040]">{trimmedDescription}</p>
          ) : null}

          <dl className="mt-4 space-y-2 text-sm">
            {categorySlug ? (
              <div>
                <dt className="sr-only">Category</dt>
                <dd className="text-[#707070]">{formatBusinessTagLabel(categorySlug)}</dd>
              </div>
            ) : null}
            {locationLines.length > 0 ? (
              <div>
                <dt className="font-medium text-[#0E0E0E]">Location</dt>
                <dd className="mt-0.5 text-[#707070]">
                  {locationLines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>

          {reviewCount > 0 ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <RatingStars rating={averageRating} size={14} />
              <span className="text-sm font-semibold text-[#0E0E0E]">
                {averageRating.toFixed(1)}
              </span>
              <span className="text-sm text-[#707070]">
                ({reviewCount.toLocaleString()} review{reviewCount === 1 ? "" : "s"})
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        {businessProfileHref ? (
          <Link
            href={businessProfileHref}
            className="inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#189786]"
          >
            View business profile
          </Link>
        ) : null}
        {websiteUrl ? (
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#0E0E0E] hover:bg-gray-50"
          >
            Visit website
          </a>
        ) : null}
        {businessProfileHref ? (
          <Link
            href={businessProfileHref}
            className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-[#0E0E0E] hover:bg-gray-50"
          >
            Read reviews
          </Link>
        ) : null}
      </div>
    </section>
  );
}
