export default function ResourcesPage() {
  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            <span className="relative inline-block">
              <span className="relative z-10">Resources Hub</span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Everything you need to get the most out of Tellacity — from
            understanding trust to applying it in your business.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">
            Learn &amp; Understand
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Build clarity around reviews, trust, and transparency.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Blog",
                copy: "Practical articles, updates, and insights from the Tellacity team.",
              },
              {
                title: "Guides & Reports",
                copy: "In-depth guides and industry reports to help you grow with trust.",
              },
              {
                title: "Badges Guide",
                copy: "Learn what Tellacity badges mean and how they signal trust and transparency.",
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
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">Apply &amp; Use</h2>
          <p className="mt-2 text-sm text-gray-600">
            Put Tellacity into action in your business.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Help Center",
                copy: "Find answers, documentation, and step-by-step support.",
              },
              {
                title: "Integrations",
                copy: "Connect Tellacity with the tools you already use.",
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
      </section>

      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">
            Grow &amp; Partner
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Scale credibility and expand your impact.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Customer Stories",
                copy: "See how real businesses build trust and succeed with Tellacity.",
              },
              {
                title: "Partner Program",
                copy: "Join our partner ecosystem and grow alongside Tellacity.",
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
      </section>
    </main>
  );
}
