import Link from "next/link";

const categories = [
  "All",
  "For Consumers",
  "For Businesses",
  "Trust & Safety",
  "Platform Updates",
  "Guides & Reports",
];

const featuredPost = {
  category: "For Businesses",
  title: "A Business Owner’s Guide to Responding to Negative Reviews (2025 Guide)",
  description:
    "Learn how to professionally handle negative reviews, protect your reputation, and turn unhappy customers into loyal fans with clear, respectful responses.",
  image: "/brand/Block%20Cover.png",
};

const posts = [
  {
    category: "For Consumers",
    title: "How the Tellacity Trust Score Works in 2025",
    description:
      "Understand the signals that shape trust scores and how verified reviews improve clarity for everyone.",
    image: "/brand/Asian Apple.png",
    postedAt: "2025-02-05",
  },
  {
    category: "For Businesses",
    title: "Why Every Business Should Claim Its Tellacity Profile",
    description:
      "Claiming your profile helps you respond publicly, build credibility, and grow trust over time.",
    image: "/brand/Astonished woman.png",
    postedAt: "2025-02-06",
  },
  {
    category: "For Businesses",
    title: "Bringing Your Reviews to Tellacity: A Complete Import Guide",
    description:
      "Import reviews from Google, Facebook, Yelp, or CSV. Consolidate your reputation and boost your Trust Score from day one.",
    image: "/brand/laptom with review platforms.png",
    postedAt: "2025-02-07",
  },
  {
    category: "Trust & Safety",
    title: "The Most Common Online Shopping Scams and How to Avoid Them",
    description:
      "Learn the red flags and how verified reviews protect consumers from bad actors.",
    image: "/brand/woman and scammer.png",
    postedAt: "2025-02-08",
  },
  {
    category: "Guides & Reports",
    title: "Shopping Online Safely in 2025: A Complete Consumer Guide",
    description:
      "Practical tips for evaluating businesses and making confident online purchases.",
    image: "/brand/Shopping Safety.png",
    postedAt: "2025-02-09",
  },
  {
    category: "Platform Updates",
    title: "How to Check If a Business Is Legit Before Buying in 2025",
    description:
      "Use verified signals, transparency markers, and review quality to assess trust.",
    image: "/brand/woman on laptop.png",
    postedAt: "2025-02-10",
  },
  {
    category: "For Consumers",
    title: "What Makes a Review Useful? The Complete 2025 Breakdown",
    description:
      "Clear, specific feedback helps others make better decisions and improves trust.",
    image: "/brand/write a review.png",
    postedAt: "2025-02-12",
  },
  {
    category: "Trust & Safety",
    title: "What Is a Verified Review? The Complete 2025 Guide",
    description:
      "Learn what verification means, how it works, and why verified reviews are the gold standard for trust.",
    image: "/brand/Izabela.png",
    postedAt: "2025-02-11",
  },
  {
    category: "Platform Updates",
    title: "Tellacity 2025 Platform Update: New Dashboards, Analytics & Mobile App Beta",
    description:
      "Redesigned dashboards, enhanced analytics, and the Mobile App Beta. Streamline your workflow and connect with customers like never before.",
    image: "/brand/Tellacity Phone.png",
    postedAt: "2025-02-13",
  },
  {
    category: "For Consumers",
    title: "How to Check If a Business Is Legit in 2026 (Before You Spend Your Money)",
    description:
      "A simple, practical guide to verifying whether a company is real, trustworthy, and worth your time before you spend.",
    image: "/brand/first tellacity blog post.png",
    postedAt: "2026-01-15",
  },
];

const sortedPosts = [...posts].sort(
  (a, b) => (b.postedAt as string).localeCompare(a.postedAt as string)
);

const POSTS_PER_PAGE = 9;

function getPostHref(title: string): string {
  const map: Record<string, string> = {
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
  return map[title] ?? "/blog";
}

export default async function BlogPage(props: {
  searchParams?: Promise<{ page?: string }> | { page?: string };
}) {
  const searchParams = await (props.searchParams ?? Promise.resolve({}));
  const page = Math.max(1, parseInt(searchParams?.page ?? "1", 10) || 1);
  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
  const currentPage = Math.min(page, totalPages);
  const paginatedPosts = sortedPosts.slice(
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
            {categories.map((label, index) => (
              <button
                key={label}
                type="button"
                className={
                  index === 0
                    ? "rounded-full bg-[#0B3B36] px-4 py-2 font-semibold text-white"
                    : "rounded-full border border-gray-200 px-4 py-2 font-semibold text-gray-600 hover:border-gray-300"
                }
              >
                {label}
              </button>
            ))}
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
                href="/blog/trust-score-2025"
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
                  href={`/blog?page=${currentPage - 1}`}
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
                  href={`/blog?page=${n}`}
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
                  href={`/blog?page=${currentPage + 1}`}
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
