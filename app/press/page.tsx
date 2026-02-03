import Link from "next/link";

const featuredStory = {
  title:
    "Growing Use of AI Helps Remove 90% of Detected Fake Reviews, According to Tellacity’s 2025 Trust Report",
  description:
    "Tellacity’s latest report highlights how AI and verification workflows continue to reduce review manipulation while protecting honest feedback.",
  image: "/brand/Block%20Cover.png",
  date: "Jan 15, 2025",
  author: "Tellacity Trust Report",
};

const pressStories = [
  {
    title:
      "Tellacity Expands Into Seven New Countries, Becoming One of Africa’s Most Trusted Review Platforms",
    description:
      "The expansion improves local access to verified reviews and stronger consumer protection across new regions.",
  },
  {
    title:
      "Tellacity Introduces New Trust Score Features and Verification Checklist",
    description:
      "New platform updates make it easier for consumers to verify experiences and for businesses to respond clearly.",
  },
  {
    title:
      "Growing Use of AI Helps Remove 90% of Detected Fake Reviews in 2025",
    description:
      "AI-driven moderation and proof-of-purchase checks continue to reduce manipulation risks.",
  },
];

export default function PressPage() {
  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
                Best of Tellacity
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
                Global news and announcements
              </h1>
            </div>
            <div className="relative">
              <div className="h-28 w-44 overflow-hidden rounded-2xl bg-gray-100 shadow-sm" />
              <div className="absolute -left-6 -bottom-6 flex h-14 w-14 items-center justify-center rounded-full border border-white bg-gray-200 shadow-sm">
                <span className="text-xs font-semibold text-gray-500">TC</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-10">
          <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:flex">
            <div className="h-48 w-full bg-gray-100 lg:h-auto lg:w-[46%]">
              <img
                src={featuredStory.image}
                alt="Featured press story"
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex-1 p-8">
              <h2 className="text-xl font-semibold text-[#0E0E0E]">
                {featuredStory.title}
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                {featuredStory.description}
              </p>
              <div className="mt-4 text-xs text-gray-500">
                {featuredStory.date} · {featuredStory.author}
              </div>
              <Link
                href="/blog"
                className="mt-6 inline-flex items-center rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:border-gray-300"
              >
                Read More →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-14">
          <div className="flex justify-end">
            <select className="h-9 rounded-full border border-gray-200 px-4 text-xs text-gray-600">
              <option>All News</option>
              <option>Press Releases</option>
              <option>Reports</option>
              <option>Announcements</option>
            </select>
          </div>

          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {pressStories.map((story) => (
              <div
                key={story.title}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                <div className="h-32 w-full bg-gray-100">
                  <img
                    src="/brand/Block%20Cover.png"
                    alt={story.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-sm font-semibold text-[#0E0E0E]">
                    {story.title}
                  </h3>
                  <p className="mt-2 text-xs text-gray-600">
                    {story.description}
                  </p>
                  <Link
                    href="/blog"
                    className="mt-4 inline-flex items-center text-xs font-semibold text-[#0E3B36]"
                  >
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-3 text-xs text-gray-500">
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
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Get in touch with our Press team
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            For press inquiries, partnerships, and media requests, please
            contact our team and we’ll respond promptly.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0B3B36] px-6 py-2 text-sm font-semibold text-white"
          >
            Email Press Team
          </Link>
        </div>
      </section>
    </main>
  );
}
