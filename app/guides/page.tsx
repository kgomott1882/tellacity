import Image from "next/image";
import Link from "next/link";

export default function GuidesPage() {
  return (
    <main className="bg-white min-h-screen">

      {/* HERO */}
      <section className="bg-gradient-to-b from-[#F5FAF9] to-white py-24 px-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto text-center">

          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
            Knowledge Hub
          </p>

          <h1 className="text-5xl font-bold mb-6">
            Guides & Reports
          </h1>

          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">
            In-depth research, strategic insights, and actionable frameworks
            to help businesses build trust, increase credibility, and grow sustainably.
          </p>

          {/* Trust Stats */}
          <div className="flex justify-center gap-12 text-center">
            <div>
              <p className="text-3xl font-bold">50k+</p>
              <p className="text-sm text-gray-500">Businesses Analyzed</p>
            </div>
            <div>
              <p className="text-3xl font-bold">1M+</p>
              <p className="text-sm text-gray-500">Reviews Studied</p>
            </div>
            <div>
              <p className="text-3xl font-bold">2026</p>
              <p className="text-sm text-gray-500">Updated Data</p>
            </div>
          </div>

        </div>
      </section>

      {/* FEATURED REPORT */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-lg overflow-hidden grid md:grid-cols-2">

          <div className="relative h-96">
            <Image
              src="/Resources/Guides.jpg"
              alt="Trust Report"
              fill
              className="object-cover"
            />
          </div>

          <div className="p-12 flex flex-col justify-center">

            <p className="text-sm text-gray-500 mb-3 uppercase tracking-wide">
              Featured Research
            </p>

            <h2 className="text-3xl font-bold mb-6">
              2026 Trust & Transparency Report
            </h2>

            <p className="text-gray-600 mb-8 leading-relaxed">
              An industry-wide analysis of how consumer trust is evolving.
              This report breaks down review credibility trends, response
              behavior benchmarks, and actionable insights businesses can
              apply immediately.
            </p>

            <button className="bg-black text-white px-7 py-3 rounded-lg w-fit shadow hover:opacity-90 transition">
              Download Full Report
            </button>

          </div>
        </div>
      </section>

      {/* CATEGORY SECTION */}
      <section className="px-6 py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold mb-16 text-center">
            Explore by Category
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            {[
              {
                title: "Trust Strategy",
                desc: "Frameworks and playbooks for building measurable, long-term credibility.",
                href: "/resources/guides/trust-strategy"
              },
              {
                title: "Reputation Management",
                desc: "Turn customer reviews into strategic business assets.",
                href: "/resources/guides/reputation-management"
              },
              {
                title: "Consumer Insights",
                desc: "Data-backed understanding of modern buying psychology.",
                href: "/resources/guides/consumer-insights"
              }
            ].map((item, i) => (
              <Link
                key={i}
                href={item.href}
                className="block bg-white border border-gray-200 rounded-xl p-10 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-10 w-10 rounded-lg bg-[#1FAF9E]/10 flex items-center justify-center mb-6">
                  <div className="h-4 w-4 bg-[#1FAF9E] rounded" />
                </div>
                <h3 className="text-xl font-semibold mb-5">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-8">
                  {item.desc}
                </p>
                <span className="inline-block bg-black text-white px-5 py-2 rounded-lg text-sm hover:opacity-90 transition cursor-pointer">
                  Explore Category
                </span>
              </Link>
            ))}

          </div>

        </div>
      </section>

      {/* RECENT PUBLICATIONS */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">

          <h2 className="text-3xl font-bold mb-16 text-center">
            Recent Publications
          </h2>

          <div className="grid md:grid-cols-3 gap-10">

            {[
              {
                title: "Building Trust in 2026",
                excerpt: "A strategic roadmap for credibility growth."
              },
              {
                title: "Understanding Trust Scores",
                excerpt: "How scoring systems influence buyer decisions."
              },
              {
                title: "How Reviews Influence Buying",
                excerpt: "Psychology and behavioral analysis of consumers."
              }
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm hover:shadow-lg transition"
              >
                <p className="text-xs uppercase tracking-wide text-gray-400 mb-4">
                  Research Note
                </p>
                <h3 className="text-lg font-semibold mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-5">
                  {item.excerpt}
                </p>
                <div className="border-t border-gray-100 pt-5">
                  <button className="bg-black text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 transition">
                    Read Guide
                  </button>
                </div>
              </div>
            ))}

          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-black text-white py-24 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">
            Turn Insights Into Growth
          </h2>
          <p className="text-gray-300 mb-10">
            Use Tellacity's research-backed tools to strengthen credibility,
            attract customers, and scale trust confidently.
          </p>
          <button className="bg-white text-black px-7 py-3 rounded-lg font-medium hover:opacity-90 transition">
            Start Free Today
          </button>
        </div>
      </section>

    </main>
  );
}
