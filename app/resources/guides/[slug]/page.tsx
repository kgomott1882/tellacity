import Link from "next/link";

export default async function GuideCategoryPage(
  props: {
    params: Promise<{ slug: string }>;
  }
) {
  const { slug } = await props.params;

  const title = slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const frameworkPillars = [
    { name: "Clarity", text: "Define what trust means for your brand and how you will measure it." },
    { name: "Consistency", text: "Apply the same standards across touchpoints and over time." },
    { name: "Evidence", text: "Collect and showcase verified feedback that backs your claims." },
    { name: "Improvement", text: "Use insights to iterate and strengthen credibility continuously." },
  ];

  const steps = [
    { num: 1, label: "Assess", text: "Audit your current trust signals and identify gaps." },
    { num: 2, label: "Activate", text: "Implement frameworks and processes that build credibility." },
    { num: 3, label: "Measure", text: "Track key metrics and review feedback systematically." },
    { num: 4, label: "Optimize", text: "Refine based on data and scale what works." },
  ];

  const relatedGuides = [
    { title: "Building Trust in 2026", desc: "A strategic roadmap for credibility growth.", href: "/resources/guides" },
    { title: "Understanding Trust Scores", desc: "How scoring systems influence buyer decisions.", href: "/resources/guides" },
    { title: "How Reviews Influence Buying", desc: "Psychology and behavioral analysis of consumers.", href: "/resources/guides" },
  ];

  return (
    <main className="bg-white min-h-screen">
      {/* 1. HERO */}
      <section className="bg-gradient-to-b from-[#F5FAF9] to-white py-24 px-6 border-b border-gray-100">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
            Guides & Reports
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#0E0E0E]">
            {title}
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg mb-10">
            Strategic frameworks and evidence-based practices to build trust,
            transparency, and measurable growth in your organization.
          </p>
          <button className="bg-black text-white px-6 py-3 rounded-lg font-medium shadow hover:opacity-90 transition">
            Download Full Framework
          </button>
        </div>
      </section>

      {/* 2. WHY THIS MATTERS */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-8 text-[#0E0E0E]">
              Why This Matters in 2026
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Trust is no longer a soft metric. Consumers and B2B buyers rely on
              transparent signals—verified reviews, clear policies, and consistent
              evidence—before committing. Organizations that invest in trust
              infrastructure see stronger retention, higher conversion, and
              more resilient reputations.
            </p>
            <p className="text-gray-600 leading-relaxed">
              This framework distills research and best practices into a
              structured approach you can implement and measure. Use it to align
              teams, prioritize initiatives, and track progress against
              credibility goals.
            </p>
          </div>
          <div className="relative w-full aspect-[4/3] min-h-[240px] rounded-xl overflow-hidden bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/customer-analytics.jpg.png"
              alt="Customer analytics dashboard"
              width={800}
              height={600}
              loading="lazy"
              decoding="async"
              className="rounded-xl object-cover w-full h-full"
            />
          </div>
        </div>
      </section>

      {/* 3. CORE FRAMEWORK */}
      <section className="px-6 py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-[#0E0E0E]">
            The Framework
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {frameworkPillars.map((pillar, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-4 text-[#0E0E0E]">
                  {pillar.name}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {pillar.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. IMPLEMENTATION ROADMAP */}
      <section className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-16 text-[#0E0E0E]">
            Implementation Roadmap
          </h2>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-8 py-8 border-b border-gray-100 last:border-0"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm">
                  {step.num}
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-[#0E0E0E]">
                    Step {step.num} – {step.label}
                  </h3>
                  <p className="text-gray-600 leading-relaxed max-w-2xl">
                    {step.text}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. RELATED PUBLICATIONS */}
      <section className="px-6 py-24 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-[#0E0E0E]">
            Related Publications
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {relatedGuides.slice(0, 3).map((guide, i) => (
              <div
                key={i}
                className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm"
              >
                <h3 className="text-lg font-semibold mb-3 text-[#0E0E0E]">
                  {guide.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">
                  {guide.desc}
                </p>
                <Link
                  href={guide.href}
                  className="inline-block bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition"
                >
                  Read Guide
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. FINAL CTA */}
      <section className="px-6 py-24 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-gray-600 text-sm mb-6">
            Explore more research and strategic insights.
          </p>
          <Link
            href="/resources/guides"
            className="inline-block border-2 border-black text-black px-6 py-3 rounded-lg font-medium hover:bg-black hover:text-white transition"
          >
            View All Guides
          </Link>
        </div>
      </section>
    </main>
  );
}
