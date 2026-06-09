import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ArticleContentRenderer from "@/components/articles/ArticleContentRenderer";
import ArticleBusinessAttribution from "@/components/articles/ArticleBusinessAttribution";
import ArticleAboutBusiness from "@/components/articles/ArticleAboutBusiness";
import ArticleShareSection from "@/components/articles/ArticleShareSection";
import ArticleRelatedArticles from "@/components/articles/ArticleRelatedArticles";
import TellacityArticleDetail from "@/components/articles/TellacityArticleDetail";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import type { ArticleContentDoc } from "@/lib/articles/types";
import { formatArticlePublishedDate } from "@/lib/articles/articleDisplay";
import { fetchRelatedArticles } from "@/lib/articles/relatedArticles";
import {
  getTellacityArticleBySlug,
  tellacityArticleHasHtmlBody,
} from "@/lib/articles/tellacityArticles";
import type { PlatformArticleRow } from "@/lib/platformArticles/types";
import {
  fetchPublishedPlatformArticleBySlug,
  platformRowToTellacityArticle,
} from "@/lib/platformArticles/public";

export const dynamic = "force-dynamic";

type PageProps = { params: Promise<{ slug: string }> };

const SITE_URL = "https://tellacity.com";

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const normalized = slug.trim().toLowerCase();
  const supabase = createClient();

  const platformArticle = await fetchPublishedPlatformArticleBySlug(
    supabase,
    normalized,
  );
  if (platformArticle) {
    const url = `${SITE_URL}/articles/${encodeURIComponent(platformArticle.slug)}`;
    return {
      title: `${platformArticle.title} | Tellacity Articles`,
      description: platformArticle.description,
      alternates: { canonical: url },
      openGraph: {
        title: platformArticle.title,
        description: platformArticle.description,
        url,
        type: "article",
        publishedTime: platformArticle.date,
        images: platformArticle.thumbnail ? [{ url: platformArticle.thumbnail }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: platformArticle.title,
        description: platformArticle.description,
      },
    };
  }

  const tellacityPost = getTellacityArticleBySlug(normalized);
  if (tellacityPost && tellacityArticleHasHtmlBody(tellacityPost)) {
    const url = `${SITE_URL}/articles/${encodeURIComponent(tellacityPost.slug)}`;
    return {
      title: `${tellacityPost.title} | Tellacity Articles`,
      description: tellacityPost.description,
      alternates: { canonical: url },
      openGraph: {
        title: tellacityPost.title,
        description: tellacityPost.description,
        url,
        type: "article",
        publishedTime: tellacityPost.date,
        images: tellacityPost.thumbnail ? [{ url: tellacityPost.thumbnail }] : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: tellacityPost.title,
        description: tellacityPost.description,
      },
    };
  }

  const { data } = await supabase
    .from("articles")
    .select("title, excerpt, featured_image_url, slug, published_at, updated_at")
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (!data) {
    return { title: "Article not found | Tellacity", robots: { index: false } };
  }

  const url = `${SITE_URL}/articles/${encodeURIComponent(data.slug)}`;
  return {
    title: `${data.title} | Tellacity Articles`,
    description: data.excerpt ?? undefined,
    alternates: { canonical: url },
    openGraph: {
      title: data.title,
      description: data.excerpt ?? undefined,
      url,
      type: "article",
      publishedTime: data.published_at ?? undefined,
      modifiedTime: data.updated_at ?? undefined,
      images: data.featured_image_url ? [{ url: data.featured_image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: data.title,
      description: data.excerpt ?? undefined,
    },
  };
}

export default async function ArticleDetailPage(props: PageProps) {
  const { slug } = await props.params;
  const normalized = slug.trim().toLowerCase();
  const supabase = createClient();

  const { data: platformRow } = await supabase
    .from("platform_articles")
    .select("*")
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (platformRow) {
    const post = platformRowToTellacityArticle(platformRow as PlatformArticleRow);
    if (tellacityArticleHasHtmlBody(post)) {
      return <TellacityArticleDetail post={post} />;
    }
  }

  const tellacityPost = getTellacityArticleBySlug(normalized);
  if (tellacityPost && tellacityArticleHasHtmlBody(tellacityPost)) {
    return <TellacityArticleDetail post={tellacityPost} />;
  }

  const { data: article } = await supabase
    .from("articles")
    .select(
      "*, businesses(id, name, slug, canonical_slug, logo_url, website, category_slug, status, description, city, country_code, address)",
    )
    .eq("slug", normalized)
    .eq("status", "published")
    .maybeSingle();

  if (!article) notFound();

  const biz = (article as { businesses?: Record<string, unknown> | null }).businesses;
  if (!biz || String(biz.status) !== "active") notFound();

  const businessId = String(biz.id);
  const businessName = String(biz.name ?? "Business");
  const businessSlug = String(biz.slug ?? "");
  const profileSlug = String(biz.canonical_slug ?? biz.slug ?? "");
  const profileHref = `/b/${encodeURIComponent(profileSlug || businessSlug)}`;
  const categorySlug = biz.category_slug ? String(biz.category_slug) : null;

  const [{ data: metrics }, relatedArticles] = await Promise.all([
    supabase
      .from("business_review_metrics_v")
      .select("average_rating, review_count")
      .eq("business_id", businessId)
      .maybeSingle(),
    fetchRelatedArticles(supabase, {
      articleId: String(article.id),
      businessId,
      categorySlug,
    }),
  ]);

  const avg = Number((metrics as { average_rating?: number } | null)?.average_rating ?? 0);
  const reviewCount = Number((metrics as { review_count?: number } | null)?.review_count ?? 0);

  const canonicalUrl = `${SITE_URL}/articles/${encodeURIComponent(String(article.slug))}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.published_at,
    dateModified: article.updated_at ?? article.published_at,
    image: article.featured_image_url ? [article.featured_image_url] : undefined,
    author: {
      "@type": "Organization",
      name: businessName,
      url: `${SITE_URL}${profileHref}`,
    },
    publisher: {
      "@type": "Organization",
      name: "Tellacity",
      url: SITE_URL,
    },
    mainEntityOfPage: canonicalUrl,
  };

  const isCaseStudy = article.content_type === "case_study";
  const publishedDateLabel = formatArticlePublishedDate(article.published_at);
  const authorName =
    typeof article.author_name === "string" ? article.author_name : null;
  const authorTitle =
    typeof article.author_title === "string" ? article.author_title : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-[#F5F3EF]">
        <article className="mx-auto max-w-3xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#1FAF9E]">
            {isCaseStudy ? "Case Study" : "Business Article"}
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            {article.title}
          </h1>
          <p className="mt-3 text-sm text-[#707070]">
            {publishedDateLabel ? publishedDateLabel : null}
            {publishedDateLabel && businessName ? " · " : null}
            {businessName ? (
              <Link href={profileHref} className="font-medium text-[#1FAF9E] hover:underline">
                {businessName}
              </Link>
            ) : null}
          </p>

          {article.featured_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={String(article.featured_image_url)}
              alt=""
              className="mt-8 w-full rounded-2xl border border-gray-100 object-cover"
            />
          ) : null}

          {isCaseStudy ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {(
                [
                  ["Client industry", article.client_industry],
                  ["Challenge", article.challenge],
                  ["Solution", article.solution],
                  ["Results", article.results],
                ] as const
              ).map(([label, value]) =>
                value ? (
                  <div key={label} className="rounded-xl border border-gray-100 bg-white p-4">
                    <div className="text-xs font-semibold uppercase tracking-wide text-[#888]">
                      {label}
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-[#404040]">{String(value)}</p>
                  </div>
                ) : null,
              )}
            </div>
          ) : null}

          <div className="mt-10">
            <ArticleContentRenderer content={article.content as ArticleContentDoc} />
          </div>

          <ArticleBusinessAttribution
            businessName={businessName}
            businessProfileHref={profileHref}
            businessLogoUrl={biz.logo_url ? String(biz.logo_url) : null}
            categorySlug={categorySlug}
            publishedAt={article.published_at ? String(article.published_at) : null}
            updatedAt={article.updated_at ? String(article.updated_at) : null}
            authorName={authorName}
            authorTitle={authorTitle}
          />

          <ArticleAboutBusiness
            businessName={businessName}
            businessProfileHref={profileHref}
            businessLogoUrl={biz.logo_url ? String(biz.logo_url) : null}
            description={biz.description ? String(biz.description) : null}
            categorySlug={categorySlug}
            city={biz.city ? String(biz.city) : null}
            countryCode={biz.country_code ? String(biz.country_code) : null}
            address={biz.address ? String(biz.address) : null}
            website={biz.website ? String(biz.website) : null}
            averageRating={avg}
            reviewCount={reviewCount}
          />

          <ArticleShareSection title={String(article.title)} url={canonicalUrl} />

          <ArticleRelatedArticles articles={relatedArticles} />
        </article>
      </main>
    </>
  );
}
