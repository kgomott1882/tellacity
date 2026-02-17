const BADGES = [
  {
    title: "Verified Business",
    description:
      "Indicates that the business has confirmed ownership of its Tellacity profile.",
  },
  {
    title: "Top Rated",
    description:
      "Awarded to businesses maintaining consistently high ratings over time.",
  },
  {
    title: "Transparency Leader",
    description:
      "Recognizes businesses that actively respond to reviews and engage customers.",
  },
  {
    title: "Trusted Score Certified",
    description:
      "Granted to businesses meeting credibility benchmarks across multiple signals.",
  },
];

const EARNED_ITEMS = [
  {
    title: "Consistent review quality",
    text: "Maintaining genuine, verified feedback that meets platform standards.",
  },
  {
    title: "Authentic customer engagement",
    text: "Responding to reviews and addressing customer concerns transparently.",
  },
  {
    title: "Profile verification",
    text: "Completing identity and business verification steps.",
  },
  {
    title: "Ongoing transparency signals",
    text: "Sustaining practices that demonstrate credibility over time.",
  },
];

export default function BadgesGuidePage() {
  return (
    <main className="bg-white min-h-screen">
      {/* 1. HERO */}
      <section className="bg-gradient-to-b from-[#F5FAF9] to-white py-24 px-6 border-b border-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-semibold mb-4">
            Trust Signals
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-[#0E0E0E]">
            Badges Guide
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Learn what Tellacity badges represent and how they communicate trust,
            transparency, and credibility.
          </p>
        </div>
      </section>

      {/* 2. INTRODUCTION */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-10 text-[#0E0E0E]">
            Why Badges Matter
          </h2>
          <div className="space-y-6 text-gray-600 leading-relaxed">
            <p>
              Consumers increasingly rely on visual trust signals when evaluating
              businesses. In crowded markets, badges act as quick, scannable
              indicators that help buyers distinguish credible businesses from
              those that have not yet demonstrated the same level of
              accountability.
            </p>
            <p>
              Badges reduce decision friction by surfacing verified information
              at a glance. When customers see that a business has confirmed its
              profile, maintained high ratings, or earned recognition for
              transparency, they can proceed with greater confidence. These
              indicators are backed by platform standards and ongoing verification.
            </p>
            <p>
              Transparency builds long-term credibility. Businesses that earn and
              maintain badges signal a commitment to accountability, which
              supports stronger customer relationships and more sustainable
              growth. Tellacity badges are designed to reflect real, measurable
              trust and transparency practices.
            </p>
          </div>
        </div>
      </section>

      {/* 3. BADGE TYPES */}
      <section className="px-6 py-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {BADGES.map((badge) => (
              <div
                key={badge.title}
                className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 hover:shadow-md transition-all"
              >
                <div className="w-12 h-12 rounded-full bg-[#1FAF9E]/10 flex items-center justify-center mb-5">
                  <div className="w-3 h-3 rounded-full bg-[#1FAF9E]" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-[#0E0E0E]">
                  {badge.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {badge.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. HOW BADGES ARE EARNED */}
      <section className="px-6 py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-12 text-[#0E0E0E]">
            How Badges Are Earned
          </h2>
          <div className="space-y-8">
            {EARNED_ITEMS.map((item) => (
              <div
                key={item.title}
                className="flex gap-4 pb-8 border-b border-gray-100 last:border-0 last:pb-0"
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1FAF9E]/10 flex items-center justify-center mt-0.5">
                  <span className="text-[#1FAF9E] font-semibold text-sm">✓</span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-[#0E0E0E]">
                    {item.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-20" />
    </main>
  );
}
