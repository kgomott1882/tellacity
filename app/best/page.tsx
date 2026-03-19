import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

type GroupRow = {
  group_slug?: string | null;
  slug?: string | null;
  name: string | null;
};

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

export async function generateMetadata() {
  return {
    title: "Best Companies by Category | Tellacity",
    description:
      "Discover the best companies across every industry based on real customer reviews on Tellacity.",
  };
}

export default async function BestPage() {
  const supabase = createClient();

  const { data: groups } = await supabase
    .from("best_category_groups")
    .select("*")
    .order("name", { ascending: true });

  const list = (Array.isArray(groups) ? groups : []) as GroupRow[];
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://tellacity.com";

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: list
      .filter((g) => {
        const raw = g.group_slug ?? g.slug ?? "";
        const safeSlug = raw.trim().toLowerCase();
        return isValidSlug(safeSlug);
      })
      .map((g, index) => {
        const slug = (g.group_slug ?? g.slug ?? "").trim().toLowerCase();
        return {
          "@type": "ListItem",
          position: index + 1,
          name: (g.name ?? slug) || "Category group",
          url: `${siteUrl}/best/${slug}`,
        };
      }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <h1 className="text-2xl font-bold text-[#0E0E0E] sm:text-3xl">
            Best Companies by Category
          </h1>
          <p className="mt-2 text-gray-600">
            Explore the top rated companies across every industry on Tellacity.
          </p>

          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3">
            {list.map((group) => {
              const slug = (group.group_slug ?? group.slug ?? "").trim().toLowerCase();
              if (!isValidSlug(slug)) return null;
              const name = (group.name ?? slug) || "Category group";
              return (
                <Link
                  key={slug || name}
                  href={`/best/${slug}`}
                  className="block rounded-lg border border-gray-200 bg-white p-5 transition hover:border-emerald-500"
                >
                  <span className="text-lg font-semibold text-[#0E0E0E]">
                    {name}
                  </span>
                  <p className="mt-1 text-sm text-gray-500">
                    Explore top companies
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
