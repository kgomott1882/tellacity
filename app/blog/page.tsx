import Link from "next/link";
import {
  BLOG_CATEGORIES,
  featuredPost,
  sortedPosts,
  getPostHref,
} from "@/app/blog/data";

const POSTS_PER_PAGE = 9;

function buildBlogUrl(params: { page?: number; category?: string }): string {
  const search = new URLSearchParams();
  if (params.category && params.category !== "All")
    search.set("category", params.category);
  if (params.page != null && params.page > 1) search.set("page", String(params.page));
  const q = search.toString();
  return q ? `/blog?${q}` : "/blog";
}

export default async function BlogPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string; category?: string }>;
}) {
  const sp = (await searchParams) ?? {};
  const category = sp.category ?? null;
  const rawPage = sp.page ?? "1";
  const page = Math.max(1, parseInt(rawPage, 10) || 1);

  const filteredPosts =
    category && category !== "All"
      ? sortedPosts.filter((post) => post.category === category)
      : sortedPosts;

  const totalPages = Math.ceil(filteredPosts.length / POSTS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(1, totalPages));
  const paginatedPosts = filteredPosts.slice(
    (currentPage - 1) * POSTS_PER_PAGE,
    currentPage * POSTS_PER_PAGE
  );
  return (
    <main className="bg-white">
      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Tellacity Blog
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Insightful updates, practical guides, and articles to help you grow
            your business.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-14">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            <div className="flex flex-1 items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                id="blog-search"
                type="search"
                name="q"
                placeholder="Search articles..."
                autoComplete="off"
                aria-label="Search articles"
                className="w-full border-0 bg-transparent text-sm text-[#0E0E0E] placeholder:text-gray-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#0B3B36] px-6 text-sm font-semibold text-white"
            >
              Search
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs">
            {BLOG_CATEGORIES.map((label) => {
              const isActive =
                label === "All" ? !category : category === label;
              return (
                <Link
                  key={label}
                  href={buildBlogUrl({ page: 1, category: label === "All" ? undefined : label })}
                  className={`rounded-full border px-4 py-2 font-semibold transition-all duration-200 ${
                    isActive
                      ? "border-[#2fb2a8] bg-[#2fb2a8] text-white"
                      : "border-gray-200 text-gray-600 hover:border-[#2fb2a8] hover:bg-[#2fb2a8]/10 hover:text-[#2fb2a8]"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:flex">
            <div className="flex-1 p-8">
              <span className="inline-flex rounded-full bg-[#E6F6F1] px-3 py-1 text-xs font-semibold text-[#0B3B36]">
                {featuredPost.category}
              </span>
              <h2 className="mt-4 text-2xl font-semibold text-[#0E0E0E]">
                {featuredPost.title}
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                {featuredPost.description}
              </p>
              <Link
                href={featuredPost.href}
                className="mt-6 inline-flex items-center rounded-lg bg-[#0B3B36] px-4 py-2 text-sm font-semibold text-white"
              >
                Read More
              </Link>
            </div>
            <div className="h-64 w-full bg-gray-100 lg:h-auto lg:w-[46%]">
              <img
                src={featuredPost.image}
                alt="Featured blog cover"
                className="h-full w-full object-cover"
              />
            </div>
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedPosts.map((post) => (
              <div
                key={post.title}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="h-36 w-full bg-gray-100">
                  <img
                    src={post.image}
                    alt={post.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <span className="inline-flex rounded-full bg-[#E6F6F1] px-3 py-1 text-xs font-semibold text-[#0B3B36]">
                    {post.category}
                  </span>
                  <h3 className="mt-3 text-sm font-semibold text-[#0E0E0E]">
                    {post.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600">{post.description}</p>
                  <Link
                    href={getPostHref(post.title)}
                    className="mt-4 inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-10 flex items-center justify-center gap-2 text-xs text-gray-500"
              aria-label="Pagination"
            >
              {currentPage > 1 ? (
                <Link
                  href={buildBlogUrl({
                    page: currentPage - 1,
                    category: category ?? undefined,
                  })}
                  className="rounded-md border border-gray-200 px-3 py-2 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-md border border-gray-100 px-3 py-2 text-gray-400">
                  Previous
                </span>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={buildBlogUrl({
                    page: n,
                    category: category ?? undefined,
                  })}
                  className={`rounded-md border px-3 py-2 font-semibold ${
                    n === currentPage
                      ? "border-[#0B3B36] bg-[#0B3B36] text-white"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </Link>
              ))}
              {currentPage < totalPages ? (
                <Link
                  href={buildBlogUrl({
                    page: currentPage + 1,
                    category: category ?? undefined,
                  })}
                  className="rounded-md border border-gray-200 px-3 py-2 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-md border border-gray-100 px-3 py-2 text-gray-400">
                  Next
                </span>
              )}
            </nav>
          )}
        </div>
      </section>
    </main>
  );
}
