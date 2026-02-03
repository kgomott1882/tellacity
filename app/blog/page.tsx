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
    image: "/brand/Block%20Cover.png",
  },
  {
    category: "For Businesses",
    title: "Why Every Business Should Claim Its Tellacity Profile",
    description:
      "Claiming your profile helps you respond publicly, build credibility, and grow trust over time.",
    image: "/brand/Block%20Cover.png",
  },
  {
    category: "Trust & Safety",
    title: "The Most Common Online Shopping Scams and How to Avoid Them",
    description:
      "Learn the red flags and how verified reviews protect consumers from bad actors.",
    image: "/brand/Block%20Cover.png",
  },
  {
    category: "Guides & Reports",
    title: "Shopping Online Safely in 2025: A Complete Consumer Guide",
    description:
      "Practical tips for evaluating businesses and making confident online purchases.",
    image: "/brand/Block%20Cover.png",
  },
  {
    category: "Platform Updates",
    title: "How to Check If a Business Is Legit Before Buying in 2025",
    description:
      "Use verified signals, transparency markers, and review quality to assess trust.",
    image: "/brand/Block%20Cover.png",
  },
  {
    category: "For Consumers",
    title: "What Makes a Review Useful? The Complete 2025 Breakdown",
    description:
      "Clear, specific feedback helps others make better decisions and improves trust.",
    image: "/brand/Block%20Cover.png",
  },
];

export default function BlogPage() {
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
                type="text"
                placeholder="Search articles..."
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
                href="/blog"
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
            {posts.map((post) => (
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
                    href="/blog"
                    className="mt-4 inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300"
                  >
                    Read More
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-3 text-xs text-gray-500">
            <button
              type="button"
              className="rounded-md border border-gray-200 px-3 py-1 text-gray-600"
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-[#0B3B36] px-3 py-1 font-semibold text-[#0B3B36]"
            >
              1
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-200 px-3 py-1 text-gray-600"
            >
              2
            </button>
            <button
              type="button"
              className="rounded-md border border-gray-200 px-3 py-1 text-gray-600"
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
