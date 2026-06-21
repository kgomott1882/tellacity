import type { Metadata } from "next";
import ArticlesHubClient from "./ArticlesHubClient";
import {
  parseArticleCategoryFilter,
  parseArticleHubTypeFilter,
} from "@/lib/articles/articleCategories";
import {
  ARTICLES_HUB_URL,
  fetchHubArticles,
} from "@/lib/articles/hubArticles";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Articles | Tellacity",
  description:
    "Tellacity articles, business guides, and case studies, reviews, trust, consumer safety, platform updates, and stories from verified businesses.",
  alternates: { canonical: ARTICLES_HUB_URL },
  openGraph: {
    title: "Articles | Tellacity",
    description:
      "Tellacity articles, business guides, and case studies in one unified content hub.",
    url: ARTICLES_HUB_URL,
    siteName: "Tellacity",
    type: "website",
  },
  robots: { index: true, follow: true },
};

type PageProps = {
  searchParams: Promise<{
    page?: string;
    type?: string;
    category?: string;
    businessCategory?: string;
  }>;
};

export default async function ArticlesHubPage(props: PageProps) {
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const typeFilter = parseArticleHubTypeFilter(searchParams.type);
  const categoryFilter = parseArticleCategoryFilter(searchParams.category);
  const businessCategorySlug = searchParams.businessCategory?.trim().toLowerCase() || null;

  const supabase = createClient();
  let businessCategoryLabel: string | null = null;
  if (businessCategorySlug) {
    const { data: categoryRow } = await supabase
      .from("categories")
      .select("name")
      .eq("slug", businessCategorySlug)
      .maybeSingle();
    businessCategoryLabel = categoryRow?.name?.trim() || null;
  }

  const result = await fetchHubArticles(supabase, {
    typeFilter,
    categoryFilter,
    businessCategorySlug,
    page,
  });

  const articlesHubJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Tellacity Articles",
    description:
      "Tellacity articles, business guides, and case studies on reviews, trust, and reputation.",
    url: ARTICLES_HUB_URL,
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: "https://tellacity.com/" },
        { "@type": "ListItem", position: 2, name: "Articles", item: ARTICLES_HUB_URL },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articlesHubJsonLd) }}
      />
      <ArticlesHubClient
        items={result.items}
        page={result.page}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
        typeFilter={typeFilter}
        categoryFilter={categoryFilter}
        businessCategorySlug={businessCategorySlug}
        businessCategoryLabel={businessCategoryLabel}
      />
    </>
  );
}
