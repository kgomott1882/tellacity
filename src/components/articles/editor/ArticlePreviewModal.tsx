"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import ArticleContentRenderer from "@/components/articles/ArticleContentRenderer";
import ArticleBusinessAttribution from "@/components/articles/ArticleBusinessAttribution";
import ArticleTellacityAttribution from "@/components/articles/ArticleTellacityAttribution";
import ArticleAboutBusiness from "@/components/articles/ArticleAboutBusiness";
import {
  articleDisplayTitle,
  formatArticlePublishedDate,
} from "@/lib/articles/articleDisplay";
import type { ArticleContentDoc, ArticleContentType } from "@/lib/articles/types";
import "@/styles/article-body.css";

export type ArticlePreviewBusiness = {
  name: string;
  profileSlug: string;
  logoUrl: string | null;
  website: string | null;
  categorySlug: string | null;
  description: string | null;
  city: string | null;
  countryCode: string | null;
  address: string | null;
};

export type ArticlePreviewMetrics = {
  averageRating: number;
  reviewCount: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  contentType: ArticleContentType;
  content: ArticleContentDoc;
  featuredImageUrl: string | null;
  clientIndustry: string;
  challenge: string;
  solution: string;
  results: string;
  authorName: string;
  authorTitle: string;
  authorAvatarUrl?: string | null;
  business: ArticlePreviewBusiness | null;
  metrics: ArticlePreviewMetrics | null;
  loadingBusiness?: boolean;
};

export default function ArticlePreviewModal({
  open,
  onClose,
  title,
  contentType,
  content,
  featuredImageUrl,
  clientIndustry,
  challenge,
  solution,
  results,
  authorName,
  authorTitle,
  authorAvatarUrl,
  business,
  metrics,
  loadingBusiness = false,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const isCaseStudy = contentType === "case_study";
  const displayTitle = articleDisplayTitle(title);
  const previewDateLabel = formatArticlePublishedDate(new Date().toISOString());
  const profileHref = business?.profileSlug
    ? `/b/${encodeURIComponent(business.profileSlug)}`
    : "#";
  const businessName = business?.name ?? "Your business";

  return (
    <div className="fixed inset-0 z-[200] flex flex-col bg-[#F5F3EF]">
      <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-amber-200 bg-amber-50 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-amber-950">Article preview</p>
          <p className="truncate text-xs text-amber-900/80">
            This is how your article will look when published. Changes here are not saved
            automatically.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 transition-colors hover:bg-amber-100"
        >
          <X className="h-4 w-4" aria-hidden />
          Back to editor
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1FAF9E]">
            {isCaseStudy ? "Case Study" : "Article"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">{displayTitle}</h1>
          <p className="mt-3 text-sm text-[#707070]">
            {previewDateLabel ? previewDateLabel : null}
            {previewDateLabel && businessName ? " · " : null}
            {business ? (
              <span className="font-medium text-[#1FAF9E]">{businessName}</span>
            ) : loadingBusiness ? (
              <span className="text-[#888]">Loading business…</span>
            ) : null}
          </p>

          {featuredImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={featuredImageUrl}
              alt=""
              className="mt-8 w-full rounded-2xl border border-gray-100 object-cover"
            />
          ) : null}

          {isCaseStudy ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Client industry", clientIndustry],
                  ["Challenge", challenge],
                  ["Solution", solution],
                  ["Results", results],
                ] as const
              ).map(([label, value]) =>
                value.trim() ? (
                  <div key={label} className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#888]">
                      {label}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#404040]">{value}</p>
                  </div>
                ) : null,
              )}
            </div>
          ) : null}

          <div className="article-body-content mt-10">
            <ArticleContentRenderer content={content} />
          </div>

          {business ? (
            <>
              <ArticleBusinessAttribution
                businessName={businessName}
                businessProfileHref={profileHref}
                businessLogoUrl={business.logoUrl}
                categorySlug={business.categorySlug}
                publishedAt={new Date().toISOString()}
                updatedAt={null}
                authorName={authorName.trim() || null}
                authorTitle={authorTitle.trim() || null}
                authorAvatarUrl={authorAvatarUrl?.trim() || null}
              />

              <ArticleAboutBusiness
                businessName={businessName}
                businessProfileHref={profileHref}
                businessLogoUrl={business.logoUrl}
                description={business.description}
                categorySlug={business.categorySlug}
                city={business.city}
                countryCode={business.countryCode}
                address={business.address}
                website={business.website}
                averageRating={metrics?.averageRating ?? 0}
                reviewCount={metrics?.reviewCount ?? 0}
              />
            </>
          ) : loadingBusiness ? (
            <div className="mt-12 rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-[#707070]">
              Loading business profile for preview…
            </div>
          ) : (
            <ArticleTellacityAttribution
              publishedAt={new Date().toISOString()}
              authorName={authorName.trim() || null}
              authorTitle={authorTitle.trim() || null}
              authorAvatarUrl={authorAvatarUrl?.trim() || null}
            />
          )}

          <p className="mt-10 rounded-xl border border-dashed border-gray-300 bg-white/60 px-4 py-3 text-center text-sm text-[#707070]">
            Share links and related articles appear on the live page after publishing.
          </p>

          <div className="mt-8 flex justify-center pb-8">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-[#1FAF9E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#189786]"
            >
              Back to editor
            </button>
          </div>
        </article>
      </div>
    </div>
  );
}
