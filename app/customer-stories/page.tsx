import Link from "next/link";

export default function CustomerStoriesPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* 1. HERO SECTION */}
      <section className="border-b border-gray-100 bg-gradient-to-b from-[#F5FAF9] to-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Customer Stories
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#0E0E0E] md:text-5xl">
            How ambitious businesses turn reviews into revenue.
          </h1>
          <p className="mt-4 max-w-3xl text-sm md:text-base text-gray-600">
            Discover how ecommerce brands, financial institutions, healthcare providers, and SaaS companies use
            Tellacity to build trust, increase conversions, and create measurable growth.
          </p>

          <div className="mt-8 grid gap-6 sm:grid-cols-3 text-sm text-gray-700">
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-[#0E0E0E]">+18%</p>
              <p className="mt-1 text-xs text-gray-600">
                Increased checkout conversion after trust signals
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-[#0E0E0E]">2.3Ã-</p>
              <p className="mt-1 text-xs text-gray-600">
                More verified reviews collected in first 90 days
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-2xl font-bold text-[#0E0E0E]">+32</p>
              <p className="mt-1 text-xs text-gray-600">
                Average NPS improvement after closing feedback loops
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. INDUSTRY TAG ROW */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-wrap justify-center gap-3 text-xs sm:text-sm text-gray-700">
          {["Ecommerce", "Financial Services", "Healthcare", "SaaS", "Local Services"].map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-gray-200 px-4 py-2 bg-white"
            >
              {tag}
            </span>
          ))}
        </div>
      </section>

      {/* 3. FEATURED CASE STUDIES */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="mb-8 flex items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Featured Stories
          </h2>
          <p className="text-sm text-gray-500">
            Real examples of teams turning reviews into compound growth.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Brightline Retail */}
          <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Ecommerce
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[#0E0E0E]">
              Brightline Retail
            </h3>
            <p className="mt-3 text-sm text-gray-600 flex-1">
              Automated post-purchase review collection and surfaced trust badges across product pages and checkout.
            </p>
            <ul className="mt-4 space-y-1 text-xs text-gray-700">
              <li>â€¢ +18% checkout conversion</li>
              <li>â€¢ 2.4Ã- more verified reviews in 90 days</li>
              <li>â€¢ 27% increase in repeat purchase rate</li>
            </ul>
          </article>

          {/* Harbour & Co. */}
          <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Financial Services
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[#0E0E0E]">
              Harbour &amp; Co.
            </h3>
            <p className="mt-3 text-sm text-gray-600 flex-1">
              Centralised fragmented customer feedback and used trust scores to reduce churn and strengthen renewal rates.
            </p>
            <ul className="mt-4 space-y-1 text-xs text-gray-700">
              <li>â€¢ 22% reduction in churn</li>
              <li>â€¢ +35 NPS improvement</li>
              <li>â€¢ Faster regulatory reporting transparency</li>
            </ul>
          </article>

          {/* Nova Clinics */}
          <article className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Healthcare
            </p>
            <h3 className="mt-2 text-lg font-semibold text-[#0E0E0E]">
              Nova Clinics
            </h3>
            <p className="mt-3 text-sm text-gray-600 flex-1">
              Invited feedback after every appointment and publicly responded to reviews to strengthen patient trust.
            </p>
            <ul className="mt-4 space-y-1 text-xs text-gray-700">
              <li>â€¢ 94% reviews rated 4â˜… or higher</li>
              <li>â€¢ 48h average response time</li>
              <li>â€¢ Stronger referral growth</li>
            </ul>
          </article>
        </div>
      </section>

      {/* 4. BEFORE / AFTER COMPARISON STRIP */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="grid gap-4 text-sm text-gray-700 md:grid-cols-4">
              <div className="font-semibold text-[#0E0E0E] text-xs uppercase tracking-wide">
                <p>Metric</p>
              </div>
              <div className="font-semibold text-[#0E0E0E] text-xs uppercase tracking-wide">
                <p>Before Tellacity</p>
              </div>
              <div className="font-semibold text-[#0E0E0E] text-xs uppercase tracking-wide">
                <p>After Tellacity</p>
              </div>
              <div className="font-semibold text-[#0E0E0E] text-xs uppercase tracking-wide">
                <p>Change</p>
              </div>
            </div>

            <div className="mt-4 space-y-3 text-sm text-gray-700">
              <div className="grid gap-4 md:grid-cols-4">
                <p>Review Volume</p>
                <p>120/month</p>
                <p>420/month</p>
                <p>3.5Ã- more reviews</p>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <p>Response Time</p>
                <p>72 hours</p>
                <p>18 hours</p>
                <p>4Ã- faster responses</p>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <p>Conversion Rate</p>
                <p>2.3%</p>
                <p>2.7%</p>
                <p>+0.4 pts at checkout</p>
              </div>
              <div className="grid gap-4 md:grid-cols-4">
                <p>NPS</p>
                <p>34</p>
                <p>66</p>
                <p>+32 point lift</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TRUST GROWTH FRAMEWORK */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-[#0E0E0E] mb-6">
          The Trust Growth Framework
        </h2>
        <div className="grid gap-6 md:grid-cols-3 text-sm text-gray-700">
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              1. Automate Review Invitations
            </p>
            <p>
              Trigger review requests after key events like purchases, signâ€‘ups, or completed projectsâ€”without manual
              followâ€‘ups.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              2. Respond &amp; Close the Loop
            </p>
            <p>
              Give teams visibility on feedback, respond publicly, and resolve issues quickly to build longâ€‘term trust.
            </p>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">
              3. Surface Trust Signals Across Journeys
            </p>
            <p>
              Display badges, ratings, and stories across marketing, sales, and checkout to turn trust into revenue.
            </p>
          </div>
        </div>
      </section>

      {/* 6. QUOTE SPOTLIGHT */}
      <section className="border-y border-gray-100 bg-gray-50">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-2xl md:text-3xl font-semibold text-[#0E0E0E] leading-relaxed max-w-3xl mx-auto">
            â€œTellacity didnâ€™t just help us collect reviews. It helped us operationalise trust.â€
          </p>
          <p className="mt-4 text-sm text-gray-600">
            â€” Head of CX, Brightline Retail
          </p>
        </div>
      </section>

      {/* 7. SOCIAL PROOF STRIP */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-center text-sm font-semibold text-[#0E0E0E]">
          Trusted by teams across South Africa, United Kingdom, United States, Australia, Canada, New Zealand and Ireland.
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-3 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div
              key={idx}
              className="h-10 rounded-xl border border-gray-200 bg-gray-50"
            />
          ))}
        </div>
      </section>

      {/* 8. FINAL CTA SECTION */}
      <section className="border-y border-gray-100 bg-[#e9dfd0]">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Ready to turn customer feedback into measurable growth?
          </h2>
          <p className="mt-3 text-sm text-gray-600 max-w-2xl mx-auto">
            Start collecting verified reviews and build visible trust signals across your business.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/business/signup"
              className="rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white shadow hover:opacity-90 transition"
            >
              Create Your Business Profile
            </Link>
          </div>
        </div>
      </section>

      {/* ADDITIONAL STORIES & REGIONAL PERFORMANCE */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-[#0E0E0E] mb-6">
          More customer success stories
        </h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 text-sm text-gray-700">
          {[
            {
              company: "Brightline Retail",
              country: "South Africa",
              industry: "Ecommerce",
              result: "+18% checkout conversion within 90 days.",
            },
            {
              company: "Harbour & Co.",
              country: "United Kingdom",
              industry: "Financial Services",
              result: "22% reduction in churn after centralising trust metrics.",
            },
            {
              company: "Nova Clinics",
              country: "Australia",
              industry: "Healthcare",
              result: "94% 4â˜…+ review consistency across all branches.",
            },
            {
              company: "Atlas Logistics",
              country: "United States",
              industry: "Logistics",
              result: "2.1Ã- faster issue resolution after public review responses.",
            },
            {
              company: "GreenRoot Energy",
              country: "Canada",
              industry: "Utilities",
              result: "+35 NPS improvement in under 6 months.",
            },
            {
              company: "UrbanNest Realty",
              country: "Ireland",
              industry: "Real Estate",
              result: "41% increase in referral-driven enquiries.",
            },
          ].map((story) => (
            <article
              key={story.company}
              className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <h3 className="text-base font-semibold text-[#0E0E0E]">
                {story.company}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {story.country} Â· {story.industry}
              </p>
              <p className="mt-3 text-sm text-gray-700">
                {story.result}
              </p>
              <p className="mt-3 text-xs font-medium text-gray-600">
                Read full story &rarr;
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-semibold text-[#0E0E0E] mb-6">
          Performance trends across regions
        </h2>
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-3 gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-gray-600">
            <p>Region</p>
            <p>Average Review Growth</p>
            <p>Average NPS Lift</p>
          </div>
          <div className="divide-y divide-gray-100 text-sm text-gray-700">
            {[
              { region: "South Africa", growth: "+210%", nps: "+28" },
              { region: "United Kingdom", growth: "+180%", nps: "+31" },
              { region: "United States", growth: "+240%", nps: "+26" },
              { region: "Australia", growth: "+195%", nps: "+29" },
              { region: "Canada", growth: "+170%", nps: "+24" },
              { region: "New Zealand", growth: "+188%", nps: "+27" },
              { region: "Ireland", growth: "+176%", nps: "+22" },
            ].map((row) => (
              <div
                key={row.region}
                className="grid grid-cols-3 gap-4 px-4 py-3"
              >
                <p>{row.region}</p>
                <p>{row.growth}</p>
                <p>{row.nps}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. DISCLAIMER */}
      <section className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-xs text-gray-500">
          Case studies are illustrative examples of how organisations use Tellacity to support trust and performance.
          Results vary by industry, implementation, and customer base.
        </p>
      </section>
    </main>
  );
}



