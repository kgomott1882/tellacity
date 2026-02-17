import Link from "next/link";

const CATEGORIES = [
  "Trust Strategy",
  "Reputation Management",
  "Consumer Insights",
] as const;

const CATEGORY_SLUG: Record<(typeof CATEGORIES)[number], string> = {
  "Trust Strategy": "trust-strategy",
  "Reputation Management": "reputation-management",
  "Consumer Insights": "consumer-insights",
};

const GUIDES = [
  {
    title: "Building Trust in 2026",
    description: "A strategic roadmap for credibility growth and long-term brand trust.",
    category: "Trust Strategy" as const,
  },
  {
    title: "The Transparency Playbook",
    description: "Practical frameworks for open communication and verified evidence.",
    category: "Trust Strategy" as const,
  },
  {
    title: "Measuring Credibility Signals",
    description: "How to track and report trust metrics that matter to buyers.",
    category: "Reputation Management" as const,
  },
  {
    title: "Review Intelligence Framework",
    description: "Turn customer feedback into actionable business intelligence.",
    category: "Reputation Management" as const,
  },
  {
    title: "Trust Score Deep Dive",
    description: "Understanding how scoring systems influence buyer decisions.",
    category: "Consumer Insights" as const,
  },
  {
    title: "Consumer Buying Psychology 2026",
    description: "Data-backed insights into modern purchasing behavior.",
    category: "Consumer Insights" as const,
  },
];

export default function GuidesHubPage() {
  return (
    <main className="bg-white min-h-screen">
      {/* 1. HERO */}
      <section className="bg-gradient-to-b from-[#F5FAF9] to-gray-50 py-24 px-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
            Guides Library
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#0E0E0E]">
            All Guides & Strategic Frameworks
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            Tellacity&apos;s full collection of research-driven guides to help you
            build trust, strengthen reputation, and grow with transparency.
          </p>
          <Link
            href="#"
            className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium shadow hover:opacity-90 transition"
          >
            Download 2026 Trust Report
          </Link>
        </div>
      </section>

      {/* 2. FILTER / CATEGORY BAR */}
      <section className="px-6 py-8 border-b border-gray-100 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className="px-5 py-2.5 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. GUIDES GRID */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {GUIDES.map((guide) => (
              <div
                key={guide.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mb-4">
                  {guide.category}
                </span>
                <h2 className="text-xl font-semibold mb-3 text-[#0E0E0E]">
                  {guide.title}
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {guide.description}
                </p>
                <Link
                  href={`/resources/guides/${CATEGORY_SLUG[guide.category]}`}
                  className="inline-block bg-black text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 transition"
                >
                  Read Full Guide
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FEATURED DOWNLOAD */}
      <section className="px-6 py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-8 rounded-2xl bg-white border border-gray-200 p-10 shadow-sm">
          <div className="max-w-xl">
            <h2 className="text-2xl font-bold mb-4 text-[#0E0E0E]">
              Download the 2026 Trust & Transparency Report
            </h2>
            <p className="text-gray-600 leading-relaxed">
              An industry-wide analysis of how consumer trust is evolving. Key
              insights on review credibility, response benchmarks, and actionable
              frameworks for businesses.
            </p>
          </div>
          <div className="flex-shrink-0">
            <Link
              href="#"
              className="inline-block bg-black text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition"
            >
              Download PDF
            </Link>
          </div>
        </div>
      </section>

      {/* 5. FOOTER SPACING */}
      <div className="h-16" />
    </main>
  );
}
