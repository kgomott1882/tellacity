export default function SolutionPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            <span className="relative inline-block">
              <span className="relative z-10">Solutions for Businesses</span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Tellacity supports businesses at different stages — whether you’re
            improving feedback, increasing conversions, or scaling credibility.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Built for Different Goals. Designed for Trust.
                </span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              By Business Goal
            </h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Engage with feedback",
                  copy:
                    "Respond to reviews publicly, resolve issues transparently, and show customers you’re listening.",
                },
                {
                  title: "Accelerate conversions",
                  copy:
                    "Use verified reviews and social proof to build confidence and turn visitors into customers.",
                },
                {
                  title: "Improve with insights",
                  copy:
                    "Understand customer sentiment, trends, and reputation performance over time.",
                },
                {
                  title: "Grow with trust",
                  copy:
                    "Build long-term credibility that compounds into sustainable business growth.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              By Business Size
            </h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Small & Growing Businesses",
                  copy:
                    "Build credibility early, compete on trust, and grow without complexity.",
                },
                {
                  title: "Established & Multi-Location Businesses",
                  copy:
                    "Manage reputation at scale while staying fair, transparent, and consistent.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">
                Everything You Need to Scale Trust
              </span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Everything you need to collect, manage, and showcase customer
            feedback — designed to build trust at every customer touchpoint.
          </p>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Automated Review Invites",
              copy: "Send timely invites that make it easy for customers to share feedback.",
            },
            {
              title: "Verified Reviews",
              copy: "Build credibility with reviews tied to real customer experiences.",
            },
            {
              title: "Review Management",
              copy: "Keep all feedback organized so you can respond with clarity.",
            },
            {
              title: "Social Proof Widgets",
              copy: "Show verified feedback where it matters most to shoppers.",
            },
            {
              title: "Insights & Analytics",
              copy: "Understand trends and improve the moments that shape trust.",
            },
            {
              title: "Business Profiles",
              copy: "Present a trusted, complete snapshot of your reputation.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <p className="text-base font-semibold text-[#0E0E0E]">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
