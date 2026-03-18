import Link from "next/link";
import { getAllReviewSeoPages } from "../../data/reviewSeoPages";

export default async function ReviewsIndexPage() {
  const pages = getAllReviewSeoPages();

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-4xl px-6 py-16">
        <header className="text-center">
          <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E] sm:text-4xl">
            Review guides
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Research businesses and compare customer feedback. Use these guides to understand what to look for when reading reviews and complaints online.
          </p>
        </header>

        <section className="mt-12">
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
            {pages.map((page) => (
              <Link
                key={page.slug}
                href={`/reviews/${page.slug}`}
                className="block rounded-xl border border-gray-200 bg-white p-6 transition-shadow hover:border-gray-300 hover:shadow-md"
              >
                <h2 className="text-lg font-semibold text-[#0E0E0E]">
                  {page.brandName}
                </h2>
                {(page.category || page.country) && (
                  <p className="mt-1 text-xs text-gray-500">
                    {[page.category, page.country].filter(Boolean).join(" · ")}
                  </p>
                )}
                <p className="mt-3 text-sm text-gray-600 line-clamp-3">
                  {page.summary}
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-[#0B3B36]">
                  Read guide →
                </span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
