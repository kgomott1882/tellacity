import Link from "next/link";

export default function BestReviewPlatformsPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] px-6 py-16 text-white">
      <div className="mx-auto max-w-3xl space-y-12">
        <div className="mb-4 text-xs text-neutral-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/compare" className="hover:text-white">
            Compare
          </Link>{" "}
          / <span className="text-white">Best Review Platforms</span>
        </div>

        <section className="text-center">
          <h1 className="text-2xl font-semibold text-white md:text-3xl">Best review platforms in 2026</h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-neutral-400">
            A short guide to what to look for. For Tellacity vs Trustpilot, Yelp, Feefo, HelloPeter, and Google in one
            matrix, use the main compare hub - that&apos;s where the full multi-platform breakdown lives.
          </p>
        </section>

        <section className="rounded-xl border border-[#1FAF9E]/40 bg-[#1FAF9E]/5 p-6 text-left">
          <h2 className="mb-2 text-lg font-semibold text-white">Full side-by-side comparison</h2>
          <p className="text-sm text-neutral-300">
            The compare hub includes platform positioning, a feature matrix across all major platforms, and use-case
            guidance in one place.
          </p>
          <Link
            href="/compare#full-comparison"
            className="mt-4 inline-block rounded-lg bg-[#1FAF9E] px-5 py-2.5 text-sm font-medium text-black hover:opacity-90"
          >
            Open full comparison
          </Link>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Which review platform is best for you?</h2>
          <div className="space-y-3 text-sm text-neutral-400">
            <p>
              Choose <span className="text-neutral-200">Tellacity</span> if you want full control, transparent pricing,
              and automated review collection.
            </p>
            <p>
              Choose <span className="text-neutral-200">Trustpilot</span> if your business needs global visibility and
              enterprise-level credibility.
            </p>
            <p>
              Choose <span className="text-neutral-200">Yelp</span> if your focus is local customers, especially in the
              United States.
            </p>
            <p>
              Choose <span className="text-neutral-200">Feefo</span> if you require enterprise integrations and
              verified review programs.
            </p>
            <p>
              Choose <span className="text-neutral-200">HelloPeter</span> if your business operates primarily in South
              Africa.
            </p>
            <p>
              Choose <span className="text-neutral-200">Google Reviews</span> if your priority is search visibility and
              local SEO.
            </p>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Key differences explained</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="mb-1 font-medium text-white">Pricing</p>
              <p className="text-sm text-neutral-400">
                Tellacity offers clear, fixed pricing starting at $69/month. Other platforms often start higher and scale
                with usage - see the hub table for a direct comparison.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="mb-1 font-medium text-white">Control</p>
              <p className="text-sm text-neutral-400">
                Tellacity emphasizes branding, widgets, and review collection workflows. Google Reviews and Yelp offer
                limited customization by design.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="mb-1 font-medium text-white">Automation</p>
              <p className="text-sm text-neutral-400">
                Tellacity supports automated review invites and integrations. Google and Yelp rely mostly on organic
                customer reviews.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Frequently asked questions</h2>
          <div className="space-y-4 text-sm text-neutral-400">
            <div>
              <p className="font-medium text-white">What is the best review platform?</p>
              <p className="mt-1">
                It depends on your market, budget, and whether you need owned workflows or marketplace visibility.
              </p>
            </div>
            <div>
              <p className="font-medium text-white">Is Trustpilot worth it?</p>
              <p className="mt-1">Trustpilot can work well for large brands, but entry pricing is typically higher.</p>
            </div>
            <div>
              <p className="font-medium text-white">Are Google Reviews enough?</p>
              <p className="mt-1">
                Google Reviews are essential for SEO, but many teams add a platform for invites, analytics, and branding.
              </p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-lg font-semibold text-white">Compare platforms in detail</h2>
          <div className="flex flex-wrap gap-3 text-sm">
            <Link href="/compare/tellacity-vs-trustpilot" className="text-[#1FAF9E] hover:underline">
              Tellacity vs Trustpilot
            </Link>
            <Link href="/compare/tellacity-vs-yelp" className="text-[#1FAF9E] hover:underline">
              Tellacity vs Yelp
            </Link>
            <Link href="/compare/tellacity-vs-feefo" className="text-[#1FAF9E] hover:underline">
              Tellacity vs Feefo
            </Link>
            <Link href="/compare/tellacity-vs-hellopeter" className="text-[#1FAF9E] hover:underline">
              Tellacity vs HelloPeter
            </Link>
            <Link href="/compare/tellacity-vs-google" className="text-[#1FAF9E] hover:underline">
              Tellacity vs Google Reviews
            </Link>
          </div>
        </section>

        <section>
          <Link href="/compare" className="text-sm text-neutral-400 hover:text-white">
            ← Back to compare hub
          </Link>
        </section>

        <div className="pt-4 text-center">
          <Link
            href="/business/signup"
            className="inline-block rounded-lg bg-[#1FAF9E] px-5 py-2.5 text-sm font-medium text-black hover:opacity-90"
          >
            Get started with Tellacity
          </Link>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Best Review Platforms in 2026",
            description:
              "Compare the best review platforms including Tellacity, Trustpilot, Yelp, Feefo, HelloPeter and Google Reviews.",
            url: "https://tellacity.com/compare/best-review-platforms",
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Tellacity" },
              { "@type": "ListItem", position: 2, name: "Trustpilot" },
              { "@type": "ListItem", position: 3, name: "Yelp" },
              { "@type": "ListItem", position: 4, name: "Feefo" },
              { "@type": "ListItem", position: 5, name: "HelloPeter" },
              { "@type": "ListItem", position: 6, name: "Google Reviews" },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What is the best review platform?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "The best platform depends on your needs. Tellacity focuses on automation and control, while platforms like Google and Yelp focus on visibility.",
                },
              },
              {
                "@type": "Question",
                name: "Is Trustpilot worth it?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Trustpilot can be effective for large businesses, but it comes with higher pricing tiers.",
                },
              },
              {
                "@type": "Question",
                name: "Are Google Reviews enough?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Google Reviews are essential for SEO, but they lack advanced tools like automation and analytics.",
                },
              },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://tellacity.com" },
              { "@type": "ListItem", position: 2, name: "Compare", item: "https://tellacity.com/compare" },
              {
                "@type": "ListItem",
                position: 3,
                name: "Best Review Platforms",
                item: "https://tellacity.com/compare/best-review-platforms",
              },
            ],
          }),
        }}
      />
    </div>
  );
}
