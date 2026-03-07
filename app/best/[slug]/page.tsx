import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import RatingStars from "@/components/RatingStars";

type GroupRow = {
  group_slug: string | null;
  group_name: string | null;
  category_slug: string | null;
  category_name: string | null;
  rating_value: number | null;
  review_count: number | null;
  rank_position: number | null;
};

type CategoryRow = {
  group_slug: string | null;
  category_slug: string | null;
  category_name: string | null;
  business_slug: string | null;
  business_name: string | null;
  rating_value: number | null;
  review_count: number | null;
  rank_position: number | null;
};

function slugToTitle(slug: string) {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const supabase = createClient();

  const { data: group } = await supabase
    .from("category_groups")
    .select("*")
    .eq("group_slug", slug)
    .maybeSingle();

  if (group) {
    const groupName = (group as { name?: string }).name ?? slugToTitle(slug);
    return {
      title: `Best ${groupName} Categories | Tellacity`,
      description: `Explore the best ${groupName} categories ranked by customer reviews on Tellacity.`,
    };
  }

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (category) {
    const categoryName = (category as { name?: string }).name ?? slugToTitle(slug);
    return {
      title: `Best ${categoryName} Companies | Tellacity`,
      description: `Discover the best ${categoryName} companies based on real customer reviews on Tellacity.`,
    };
  }

  return {
    title: "Not Found | Tellacity",
  };
}

export default async function BestPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;
  const supabase = createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://tellacity.com";

  const { data: group } = await supabase
    .from("category_groups")
    .select("*")
    .eq("group_slug", slug)
    .maybeSingle();

  if (group) {
    const { data: groupRows } = await supabase
      .from("group_top_categories")
      .select("*")
      .eq("group_slug", slug)
      .order("rank_position", { ascending: true });

    const groupList = (Array.isArray(groupRows) ? groupRows : []) as GroupRow[];
    const groupName = groupList[0]?.group_name ?? (group as { name?: string }).name ?? slugToTitle(slug);

    if (groupList.length === 0) {
      return (
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold text-[#0E0E0E] sm:text-3xl">
              Best {groupName} Categories
            </h1>
            <p className="mt-6 text-gray-600">
              No reviewed categories yet in this group.
            </p>
          </div>
        </main>
      );
    }

    const itemListSchema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: groupList
        .filter((row) => row.category_slug)
        .map((row) => ({
          "@type": "ListItem",
          position: row.rank_position ?? 0,
          name: row.category_name ?? row.category_slug ?? "Category",
          url: `${siteUrl}/best/${row.category_slug}`,
        })),
    };

    const cardClass =
      "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#124541] hover:shadow-md";

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
        />
        <main className="min-h-screen bg-gray-50">
          <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
            <h1 className="text-2xl font-bold text-[#0E0E0E] sm:text-3xl">
              Best {groupName} Categories
            </h1>

            <ul className="mt-6 space-y-3">
              {groupList.map((row) => {
                const categorySlug = row.category_slug ?? "";
                const name = (row.category_name ?? categorySlug) || "Category";
                const rank = row.rank_position ?? 0;
                const rating = Number(row.rating_value ?? 0);
                const reviewCount = Number(row.review_count ?? 0);
                const content = (
                  <>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <span className="shrink-0 text-lg font-bold text-[#0E0E0E]">
                        {rank}.
                      </span>
                      <span className="font-semibold text-[#0E0E0E]">
                        {name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <RatingStars rating={rating} size={14} editable={false} />
                      <span className="text-gray-600">
                        {reviewCount === 1
                          ? "1 review"
                          : `${reviewCount.toLocaleString()} reviews`}
                      </span>
                    </div>
                  </>
                );
                return (
                  <li key={categorySlug || `rank-${rank}`}>
                    {categorySlug ? (
                      <Link href={`/best/${categorySlug}`} className={cardClass}>
                        {content}
                      </Link>
                    ) : (
                      <div className={cardClass}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </main>
      </>
    );
  }

  const { data: category } = await supabase
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    notFound();
  }

  const { data: categoryRows } = await supabase
    .from("best_businesses_by_category")
    .select("*")
    .eq("category_slug", slug)
    .order("rating_value", { ascending: false })
    .order("review_count", { ascending: false })
    .limit(50);

  const categoryList = (Array.isArray(categoryRows) ? categoryRows : []) as CategoryRow[];
  const categoryName =
    categoryList[0]?.category_name ?? (category as { name?: string }).name ?? slugToTitle(slug);

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: categoryList
      .filter((row) => row.business_slug)
      .map((row, index) => ({
        "@type": "ListItem",
        position: row.rank_position ?? index + 1,
        name: row.business_name ?? row.business_slug ?? "Business",
        url: `${siteUrl}/b/${row.business_slug}`,
      })),
  };

  const cardClass =
    "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition hover:border-[#124541] hover:shadow-md";

  if (categoryList.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold text-[#0E0E0E] sm:text-3xl">
            Best {categoryName} Companies
          </h1>
          <p className="mt-6 text-gray-600">
            No reviewed businesses yet in this category.
          </p>
        </div>
      </main>
    );
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
          <h1 className="text-2xl font-bold text-[#0E0E0E] sm:text-3xl">
            Best {categoryName} Companies
          </h1>

          <ul className="mt-6 space-y-3">
            {categoryList.map((row, index) => {
              const businessSlug = row.business_slug ?? "";
              const name = (row.business_name ?? businessSlug) || "Business";
              const rank = row.rank_position ?? index + 1;
              const rating = Number(row.rating_value ?? 0);
              const reviewCount = Number(row.review_count ?? 0);
              const content = (
                <>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <span className="shrink-0 text-lg font-bold text-[#0E0E0E]">
                      {rank}.
                    </span>
                    <span className="font-semibold text-[#0E0E0E]">
                      {name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <RatingStars rating={rating} size={14} editable={false} />
                    <span className="text-gray-600">
                      {reviewCount === 1
                        ? "1 review"
                        : `${reviewCount.toLocaleString()} reviews`}
                    </span>
                  </div>
                </>
              );
              return (
                <li key={businessSlug || `rank-${rank}`}>
                  {businessSlug ? (
                    <Link href={`/b/${businessSlug}`} className={cardClass}>
                      {content}
                    </Link>
                  ) : (
                    <div className={cardClass}>{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </main>
    </>
  );
}
