export default function SafetyTrustPage() {
  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Trust &amp; Verification Framework
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            What &quot;Verified&quot; Means
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
            Building Verified Trust Between Consumers and Businesses. Our
            mission is to build verified connections through transparent
            reviews, verified ownership, and AI-backed moderation.
          </p>
          <div className="mt-8 overflow-hidden rounded-3xl bg-gray-100">
            <div className="h-56 w-full bg-gray-200 sm:h-72" />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                Our Vision: Tellacity Everywhere
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                To be the universal symbol of trust. We help people make
                confident decisions by connecting them to verified feedback and
                authentic business profiles.
              </p>
              <div className="mt-5 grid gap-3 text-sm text-gray-700">
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#1FAF9E]" />
                  <p>
                    <span className="font-semibold text-[#0E0E0E]">
                      Consumers:
                    </span>{" "}
                    Make confident decisions through real reviews from verified
                    customers.
                  </p>
                </div>
                <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
                  <span className="mt-1 h-2 w-2 rounded-full bg-[#1FAF9E]" />
                  <p>
                    <span className="font-semibold text-[#0E0E0E]">
                      Businesses:
                    </span>{" "}
                    Earn credibility by responding, improving, and growing
                    through authentic engagement.
                  </p>
                </div>
              </div>
            </div>
            <div className="overflow-hidden rounded-3xl bg-gray-100">
              <div className="h-64 w-full bg-gray-200" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Our Verification Principles
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            In 2025, Tellacity added &quot;Relevance,&quot; reaffirming our
            commitment to continuous improvement.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { title: "Neutral", text: "Balancing the rights of consumers and businesses alike." },
              { title: "Open", text: "Everyone can share genuine experiences and respond." },
              { title: "Fair", text: "Rules apply equally to all. No paid priority, no bias." },
              { title: "Transparent", text: "We communicate clearly about what we do and why." },
              { title: "Relevant", text: "We stay useful, accurate, and trustworthy as tech evolves." },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F5F3] text-xs font-semibold text-[#0E3B36]">
                  ✓
                </div>
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            The Journey of a Verified Review
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            A five-step process ensures every review on Tellacity earns its
            place.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="space-y-4 text-left">
              {[
                {
                  step: "1",
                  title: "Account Verification",
                  text: "The reviewer creates a verified Tellacity account, agreeing to clear community terms.",
                },
                {
                  step: "2",
                  title: "Review Submission",
                  text: "The consumer submits a review after a genuine experience (organic or invited).",
                },
                {
                  step: "3",
                  title: "AI & Manual Assessment",
                  text: "Our detection models screen millions of data points for anomalies.",
                },
                {
                  step: "4",
                  title: "Publication",
                  text: "If cleared, the review goes live and becomes visible to the public.",
                },
                {
                  step: "5",
                  title: "Safeguarding",
                  text: "Continuous monitoring identifies and removes fake or misleading content.",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0E3B36] text-xs font-semibold text-white">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0E0E0E]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">{item.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="overflow-hidden rounded-3xl bg-gray-100">
              <div className="h-64 w-full bg-gray-200" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-[#A7E6C8] bg-[#F0FFF7] p-6">
              <h3 className="text-lg font-semibold text-[#0E0E0E]">
                Verified Businesses
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                A Verified Business badge means a company has claimed its
                profile, verified ownership, and agreed to our code of integrity.
              </p>
              <ul className="mt-4 space-y-2 text-xs text-gray-700">
                <li>Public &quot;Verified Business&quot; badge</li>
                <li>Access to analytics &amp; response tools</li>
                <li>Eligibility for &quot;Verified Review&quot; filters</li>
                <li>Higher visibility in consumer searches</li>
              </ul>
              <div className="mt-5 overflow-hidden rounded-xl bg-white">
                <div className="h-36 w-full bg-gray-200" />
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-[#0E0E0E]">
                Safeguarding Trust
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Our multilayered defense includes AI Moderation, Human
                Oversight, and Community Vigilance.
              </p>
              <div className="mt-4 space-y-3 text-xs text-gray-700">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                  <span>1.2 million</span>
                  <span className="text-gray-500">fake reviews removed</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                  <span>91%</span>
                  <span className="text-gray-500">removed automatically via AI</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                  <span>9%</span>
                  <span className="text-gray-500">manually investigated</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                  <span>98%</span>
                  <span className="text-gray-500">verification compliance</span>
                </div>
              </div>
              <div className="mt-5 overflow-hidden rounded-xl bg-white">
                <div className="h-36 w-full bg-gray-200" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Taking Action
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            When misuse occurs, Tellacity acts decisively. We also pursue legal
            action against those who manipulate reviews.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Warnings Issued", value: "21,000 (↑ 6%)", desc: "Educational alerts for first-time misuse" },
              { title: "Formal Notices", value: "6,000 (↑ 12%)", desc: "Cease and desist to repeat offenders" },
              { title: "Public Warnings", value: "10,000 (↑ 20%)", desc: "Red banners for serious breaches" },
              { title: "Consumer Alerts", value: "7,000 (↓ 30%)", desc: "Blue banners for risky industries" },
              { title: "Business Removals", value: "3,800 (↓ 18%)", desc: "Bad-fit or fraudulent businesses delisted" },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0E3B36]">
                  {item.title}
                </p>
                <p className="mt-2 text-lg font-semibold text-[#0E0E0E]">
                  {item.value}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                The Future of Verified Trust
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                As AI reshapes how people engage with online content, Tellacity
                is defining what verified authenticity looks like.
              </p>
              <p className="mt-4 text-sm font-semibold text-[#0E0E0E]">
                Our 2026 Commitments:
              </p>
              <ul className="mt-3 space-y-2 text-sm text-gray-600">
                <li>Expand verified businesses to 500,000+</li>
                <li>Achieve 95% AI accuracy in detection</li>
                <li>Launch regional Trust Dashboards for transparency</li>
              </ul>
            </div>
            <div className="overflow-hidden rounded-3xl bg-gray-100">
              <div className="h-64 w-full bg-gray-200" />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
