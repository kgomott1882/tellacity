import Link from "next/link";
import Image from "next/image";

const ARTICLE_SLUGS: Record<string, string> = {
  "How the Tellacity Trust Score Works in 2025": "/blog/trust-score-2025",
  "Why Every Business Should Claim Its Tellacity Profile": "/blog/claim-tellacity-profile",
  "Bringing Your Reviews to Tellacity: A Complete Import Guide": "/blog/import-reviews",
  "The Most Common Online Shopping Scams and How to Avoid Them": "/blog/online-shopping-scams-2025",
  "Shopping Online Safely in 2025: A Complete Consumer Guide": "/blog/shopping-online-safely-2025",
  "How to Check If a Business Is Legit Before Buying in 2025": "/blog/check-business-legit-2025",
  "What Is a Verified Review? The Complete 2025 Guide": "/blog/verified-review-2025",
  "What Makes a Review Useful? The Complete 2025 Breakdown": "/blog/what-makes-a-review-useful-2025",
  "Tellacity 2025 Platform Update: New Dashboards, Analytics & Mobile App Beta": "/blog/platform-update-2025",
  "How to Check If a Business Is Legit in 2026 (Before You Spend Your Money)": "/blog/check-business-legit-2026",
};

function formatPressDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

const pressItems = [
  {
    category: "For Consumers",
    title: "How the Tellacity Trust Score Works in 2025",
    image: "/brand/Asian Apple.png",
    postedAt: "2025-02-05",
  },
  {
    category: "For Businesses",
    title: "Why Every Business Should Claim Its Tellacity Profile",
    image: "/brand/Astonished woman.png",
    postedAt: "2025-02-06",
  },
  {
    category: "For Businesses",
    title: "Bringing Your Reviews to Tellacity: A Complete Import Guide",
    image: "/brand/laptom with review platforms.png",
    postedAt: "2025-02-07",
  },
  {
    category: "Trust & Safety",
    title: "The Most Common Online Shopping Scams and How to Avoid Them",
    image: "/brand/woman and scammer.png",
    postedAt: "2025-02-08",
  },
  {
    category: "Guides & Reports",
    title: "Shopping Online Safely in 2025: A Complete Consumer Guide",
    image: "/brand/Shopping Safety.png",
    postedAt: "2025-02-09",
  },
  {
    category: "Platform Updates",
    title: "How to Check If a Business Is Legit Before Buying in 2025",
    image: "/brand/woman on laptop.png",
    postedAt: "2025-02-10",
  },
  {
    category: "Trust & Safety",
    title: "What Is a Verified Review? The Complete 2025 Guide",
    image: "/brand/Izabela.png",
    postedAt: "2025-02-11",
  },
  {
    category: "For Consumers",
    title: "What Makes a Review Useful? The Complete 2025 Breakdown",
    image: "/brand/write a review.png",
    postedAt: "2025-02-12",
  },
  {
    category: "Platform Updates",
    title: "Tellacity 2025 Platform Update: New Dashboards, Analytics & Mobile App Beta",
    image: "/brand/Tellacity Phone.png",
    postedAt: "2025-02-13",
  },
  {
    category: "For Consumers",
    title: "How to Check If a Business Is Legit in 2026 (Before You Spend Your Money)",
    image: "/brand/first tellacity blog post.png",
    postedAt: "2026-01-15",
  },
];

const sortedItems = [...pressItems].sort((a, b) =>
  b.postedAt.localeCompare(a.postedAt)
);

const featuredArticle = sortedItems[0];
const gridArticles = sortedItems.slice(1);

const ITEMS_PER_PAGE = 6;

export default async function PressPage(props: {
  searchParams?: Promise<{ page?: string }> | { page?: string };
}) {
  const searchParams = await (props.searchParams ?? Promise.resolve({}));
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const totalPages = Math.ceil(gridArticles.length / ITEMS_PER_PAGE);
  const currentPage = Math.min(page, totalPages);
  const paginatedGrid = gridArticles.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  return (
    <main className="bg-white">
      {/* Hero */}
      <section className="border-b border-gray-100 bg-white">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-14 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
              Inside Tellacity
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl lg:text-[2.5rem]">
              Global news and announcements
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative h-36 w-48 overflow-hidden rounded-2xl bg-gray-100 shadow-md">
              <Image
                src="/brand/Tellacity Phone.png"
                alt=""
                fill
                className="object-cover"
                sizes="192px"
              />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-16 w-16 rounded-2xl bg-[#0E3B36]/10" />
              <div className="h-14 w-14 self-end rounded-2xl bg-[#0E3B36]/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Featured article */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-8">
          <p className="mb-4 flex items-center gap-1.5 text-xs text-gray-500">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 bg-white text-[10px] font-medium text-gray-500">
              o
            </span>
            Featured article
          </p>
          <Link
            href={ARTICLE_SLUGS[featuredArticle.title] || "/blog"}
            className="block overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md lg:flex"
          >
            <div className="relative h-56 w-full bg-gray-100 lg:h-72 lg:w-[48%]">
              <Image
                src={featuredArticle.image}
                alt=""
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 48vw"
                priority
              />
            </div>
            <div className="flex flex-1 flex-col justify-center p-8">
              <span className="text-xs font-medium text-gray-500">
                {featuredArticle.category}
              </span>
              <h2 className="mt-2 text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
                {featuredArticle.title}
              </h2>
              <time
                dateTime={featuredArticle.postedAt}
                className="mt-3 block text-sm text-gray-500"
              >
                {formatPressDate(featuredArticle.postedAt)}
              </time>
            </div>
          </Link>
        </div>
      </section>

      {/* Article grid */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {paginatedGrid.map((item) => {
              const href = ARTICLE_SLUGS[item.title] || "/blog";
              return (
                <Link
                  key={item.title}
                  href={href}
                  className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative h-44 w-full bg-gray-100">
                    <Image
                      src={item.image}
                      alt=""
                      fill
                      className="object-cover transition-transform group-hover:scale-[1.02]"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-5">
                    <span className="text-xs font-medium text-gray-500">
                      {item.category}
                    </span>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold text-[#0E0E0E] group-hover:text-[#0E3B36]">
                      {item.title}
                    </h3>
                    <time
                      dateTime={item.postedAt}
                      className="mt-2 block text-xs text-gray-500"
                    >
                      {formatPressDate(item.postedAt)}
                    </time>
                  </div>
                </Link>
              );
            })}
          </div>

          {totalPages > 1 && (
            <nav
              className="mt-10 flex flex-wrap items-center justify-center gap-2"
              aria-label="Pagination"
            >
              {currentPage > 1 ? (
                <Link
                  href={`/press?page=${currentPage - 1}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                >
                  ‹ Previous page
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-400">
                  ‹ Previous page
                </span>
              )}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <Link
                  key={n}
                  href={`/press?page=${n}`}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium ${
                    n === currentPage
                      ? "border-[#0B3B36] bg-[#0B3B36] text-white"
                      : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {n}
                </Link>
              ))}
              {currentPage < totalPages ? (
                <Link
                  href={`/press?page=${currentPage + 1}`}
                  className="rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                >
                  Next page ›
                </Link>
              ) : (
                <span className="rounded-lg border border-gray-100 px-3 py-2 text-sm text-gray-400">
                  Next page ›
                </span>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* Press CTA */}
      <section className="border-t border-gray-200 bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
            Get in touch with our Press team
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            For media enquiries, or to learn more about Tellacity’s global impact,
            contact our dedicated Press team.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-lg bg-[#0E0E0E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#333]"
          >
            Email Press Team
          </Link>
        </div>
      </section>
    </main>
  );
}
