import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import RatingStars from "@/components/RatingStars";

type Row = {
  rank_position: number | null;
  business_slug: string | null;
  business_name: string | null;
  category_name: string | null;
  rating_value: number | null;
  review_count: number | null;
};

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

export async function generateMetadata() {
  return {
    title: "Top Rated Companies | Tellacity",
    description:
      "Discover the top rated companies across all industries based on real customer reviews on Tellacity.",
  };
}

export default async function TopRatedPage() {
  const supabase = createClient();

  const { data: rows } = await supabase
    .from("global_top_businesses")
    .select("*")
    .order("rank_position", { ascending: true })
    .limit(100);

  const list = (Array.isArray(rows) ? rows : []) as Row[];
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://tellacity.com";

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: list
      .filter((row) => {
        const safeSlug = (row.business_slug ?? "").trim().toLowerCase();
        return isValidSlug(safeSlug);
      })
      .map((row) => ({
        "@type": "ListItem",
        position: row.rank_position ?? 0,
        name: row.business_name ?? row.business_slug ?? "Business",
        url: `${siteUrl}/b/${(row.business_slug ?? "").trim().toLowerCase()}`,
      })),
  };

  const cardClass =
    "block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-emerald-500";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-4xl px-6 py-10">
          <h1 className="text-2xl font-bold text-[#0E0E0E] sm:text-3xl">
            Top Rated Companies
          </h1>

          {list.length === 0 ? (
            <p className="mt-6 text-gray-600">
              No businesses have enough reviews yet to appear in the top rankings.
            </p>
          ) : (
            <ul className="mt-8 space-y-4">
              {list.map((row) => {
                const slug = (row.business_slug ?? "").trim().toLowerCase();
                const hasValidSlug = isValidSlug(slug);
                const name = (row.business_name ?? slug) || "Business";
                const rank = row.rank_position ?? 0;
                const rating = Number(row.rating_value ?? 0);
                const reviewCount = Number(row.review_count ?? 0);
                const categoryName = row.category_name ?? "";
                const metaLine =
                  [categoryName, reviewCount === 1 ? "1 review" : `${reviewCount.toLocaleString()} reviews`]
                    .filter(Boolean)
                    .join(" • ");

                const content = (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-3">
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
                      </div>
                    </div>
                    {metaLine && (
                      <p className="mt-2 text-sm text-gray-600">{metaLine}</p>
                    )}
                  </>
                );

                return (
                  <li key={slug || `rank-${rank}`}>
                    {hasValidSlug ? (
                      <Link href={`/b/${slug}`} className={cardClass}>
                        {content}
                      </Link>
                    ) : (
                      <div className={cardClass}>{content}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
