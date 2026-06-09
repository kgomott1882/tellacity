import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createSupabaseServerClient as createClient } from "@/lib/supabase/server";
import { cleanSlugForRedirect } from "@/lib/businessSlug";
import { isBusinessPubliclyActive } from "@/lib/businessPublicAccess";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const supabase = createClient();
  const normalized = slug.trim().toLowerCase();
  const { data: business } = await supabase
    .from("businesses")
    .select("name, status")
    .eq("slug", normalized)
    .maybeSingle();

  if (!business || !isBusinessPubliclyActive(business.status)) {
    return { title: "Articles | Tellacity", robots: { index: false } };
  }

  const url = `https://tellacity.com/b/${encodeURIComponent(normalized)}/articles`;
  return {
    title: `${business.name} Articles | Tellacity`,
    description: `Blogs and case studies published by ${business.name} on Tellacity.`,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
  };
}

export default async function BusinessArticlesArchivePage(props: PageProps) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const normalized = slug.trim().toLowerCase();
  const page = Math.max(1, Number(searchParams.page ?? "1") || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient();
  let { data: business } = await supabase
    .from("businesses")
    .select("id, name, slug, status")
    .eq("slug", normalized)
    .maybeSingle();

  if (!business) {
    const clean = cleanSlugForRedirect(slug);
    if (clean && clean !== normalized) {
      const { data: fallback } = await supabase
        .from("businesses")
        .select("id, name, slug, status")
        .eq("slug", clean)
        .maybeSingle();
      business = fallback;
    }
  }

  if (!business || !isBusinessPubliclyActive(business.status)) notFound();

  const { data: articles, count } = await supabase
    .from("articles")
    .select("id, title, slug, excerpt, featured_image_url, published_at, content_type", {
      count: "exact",
    })
    .eq("business_id", business.id)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  return (
    <main className="min-h-screen bg-[#F5F3EF]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <Link
          href={`/b/${encodeURIComponent(String(business.slug))}`}
          className="text-sm font-medium text-[#1FAF9E] hover:underline"
        >
          ← {business.name}
        </Link>
        <h1 className="mt-4 text-3xl font-semibold text-[#0E0E0E]">
          Articles &amp; resources
        </h1>
        <p className="mt-2 text-[#505050]">
          Blogs and case studies published by {business.name}. Each item links to its canonical
          article on Tellacity&apos;s public Articles section.
        </p>

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {(articles ?? []).map((a) => (
            <Link
              key={a.id}
              href={`/articles/${encodeURIComponent(String(a.slug))}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:shadow-md"
            >
              {a.featured_image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={String(a.featured_image_url)}
                  alt=""
                  className="aspect-[16/10] w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="aspect-[16/10] bg-gradient-to-br from-[#E8F7F5] to-[#F5F3EF]" />
              )}
              <div className="flex flex-1 flex-col p-5">
                <h2 className="text-lg font-semibold text-[#0E0E0E] group-hover:text-[#124541]">
                  {a.title}
                </h2>
                <p className="mt-2 line-clamp-2 text-sm text-[#606060]">{a.excerpt}</p>
                <p className="mt-auto pt-4 text-xs text-[#888]">
                  {a.published_at
                    ? new Date(String(a.published_at)).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : null}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {totalPages > 1 ? (
          <nav className="mt-10 flex justify-center gap-4 text-sm">
            {page > 1 ? (
              <Link
                href={`/b/${encodeURIComponent(String(business.slug))}/articles?page=${page - 1}`}
                className="font-medium text-[#1FAF9E] hover:underline"
              >
                ← Previous
              </Link>
            ) : null}
            <span className="text-gray-500">
              Page {page} of {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                href={`/b/${encodeURIComponent(String(business.slug))}/articles?page=${page + 1}`}
                className="font-medium text-[#1FAF9E] hover:underline"
              >
                Next →
              </Link>
            ) : null}
          </nav>
        ) : null}
      </div>
    </main>
  );
}
