import Link from "next/link";
import Image from "next/image";
import { platformMeta } from "@/lib/platformMeta";

const tableRows = [
  { feature: "Free plan:", tellacity: "✔", trustpilot: "Limited", yelp: "✔", feefo: "✖", hellopeter: "✖", google: "✓" },
  { feature: "Entry pricing:", tellacity: "$69/mo (clear, fixed tiers)", trustpilot: "From $299/mo", yelp: "From $150/mo", feefo: "£149–£299/mo", hellopeter: "From $42/mo", google: "Free (no subscription)" },
  { feature: "Invite control:", tellacity: "Full", trustpilot: "Limited", yelp: "None", feefo: "Controlled", hellopeter: "Limited", google: "None" },
  { feature: "Custom branding:", tellacity: "✔", trustpilot: "Limited", yelp: "✖", feefo: "✔", hellopeter: "Limited", google: "✕" },
  { feature: "Widgets:", tellacity: "✔", trustpilot: "✔", yelp: "✔", feefo: "✔", hellopeter: "✔", google: "✕" },
  { feature: "Analytics:", tellacity: "✔", trustpilot: "✔", yelp: "Basic", feefo: "✔", hellopeter: "Basic", google: "Basic" },
  { feature: "Platform reach:", tellacity: "Global", trustpilot: "Global", yelp: "Strong local (US)", feefo: "Global (enterprise-focused)", hellopeter: "Regional (South Africa)", google: "Global (Google Search & Maps)" },
  { feature: "SEO pages:", tellacity: "✔", trustpilot: "✔", yelp: "✔", feefo: "✔", hellopeter: "✔", google: "✓" },
];

const platformCards = [
  { key: "tellacity" as const, text: "Full control, automation, and modern review management" },
  { key: "trustpilot" as const, text: "Global brand visibility and reputation management" },
  { key: "yelp" as const, text: "Local discovery and advertising for US businesses" },
  { key: "feefo" as const, text: "Enterprise-level verified review systems" },
  { key: "hellopeter" as const, text: "South African complaint-driven review platform" },
  { key: "google" as const, text: "Search visibility and local SEO through Google Search and Maps" },
];

export default function BestReviewPlatformsPage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <div className="text-xs text-neutral-400 mb-4">
          <Link href="/" className="hover:text-white">Home</Link> /{" "}
          <Link href="/compare" className="hover:text-white">Compare</Link> /{" "}
          <span className="text-white">Best Review Platforms</span>
        </div>
        {/* 1. Hero */}
        <section className="text-center">
          <h1 className="text-2xl font-semibold text-white text-center md:text-3xl">
            Best Review Platforms in 2026
          </h1>
          <p className="text-sm text-neutral-400 text-center mt-2 max-w-2xl mx-auto">
            Compare the best review platforms including Tellacity, Trustpilot, Yelp, Feefo, HelloPeter and Google Reviews.
          </p>
        </section>

        {/* 2. Platform overview cards (6) */}
        <section>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {platformCards.map(({ key, text }) => {
              const platform = platformMeta[key];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-white/10 p-4 bg-white/[0.02]"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Image
                      src={platform.logo}
                      alt={platform.name}
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                    <p className="text-white font-medium">{platform.name}</p>
                  </div>
                  <p className="text-sm text-neutral-400">{text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Comparison table */}
        <section className="overflow-hidden rounded-xl border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-neutral-900">
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    Feature
                  </th>
                  <th className="border-b border-r border-neutral-800 bg-[#1FAF9E]/10 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image src={platformMeta.tellacity.logo} alt={platformMeta.tellacity.name} width={36} height={36} className="object-contain" />
                      <span>{platformMeta.tellacity.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image src={platformMeta.trustpilot.logo} alt={platformMeta.trustpilot.name} width={36} height={36} className="object-contain" />
                      <span>{platformMeta.trustpilot.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image src={platformMeta.yelp.logo} alt={platformMeta.yelp.name} width={36} height={36} className="object-contain" />
                      <span>{platformMeta.yelp.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image src={platformMeta.feefo.logo} alt={platformMeta.feefo.name} width={36} height={36} className="object-contain" />
                      <span>{platformMeta.feefo.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image src={platformMeta.hellopeter.logo} alt={platformMeta.hellopeter.name} width={36} height={36} className="object-contain" />
                      <span>{platformMeta.hellopeter.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-neutral-800 px-4 py-3 text-left text-sm font-medium text-white">
                    <div className="flex items-center gap-2">
                      <Image src={platformMeta.google.logo} alt={platformMeta.google.name} width={36} height={36} className="object-contain" />
                      <span>{platformMeta.google.name}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-neutral-800 last:border-b-0">
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">{row.feature}</td>
                    <td className="border-r border-neutral-800 bg-[#1FAF9E]/10 px-4 py-3 text-sm text-neutral-300">{row.tellacity}</td>
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">{row.trustpilot}</td>
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">{row.yelp}</td>
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">{row.feefo}</td>
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">{row.hellopeter}</td>
                    <td className="px-4 py-3 text-sm text-neutral-300">{row.google}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Which platform is best for you */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            Which review platform is best for you?
          </h2>
          <div className="space-y-3 text-sm text-neutral-400">
            <p>
              Choose Tellacity if you want full control, transparent pricing, and automated review collection.
            </p>
            <p>
              Choose Trustpilot if your business needs global visibility and enterprise-level credibility.
            </p>
            <p>
              Choose Yelp if your focus is local customers, especially in the United States.
            </p>
            <p>
              Choose Feefo if you require enterprise integrations and verified review programs.
            </p>
            <p>
              Choose HelloPeter if your business operates primarily in South Africa.
            </p>
            <p>
              Choose Google Reviews if your priority is search visibility and local SEO.
            </p>
          </div>
        </section>

        {/* 5. Key differences explained */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Key differences explained</h2>
          <div className="space-y-4 mt-4">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-white font-medium mb-1">Pricing</p>
              <p className="text-sm text-neutral-400">
                Tellacity offers clear, fixed pricing starting at $69/month.
                Other platforms like Trustpilot and Feefo often start at higher entry prices and scale with usage.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-white font-medium mb-1">Control</p>
              <p className="text-sm text-neutral-400">
                Tellacity gives businesses control over branding, widgets, and review collection.
                Google Reviews and Yelp offer limited customization.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-white font-medium mb-1">Automation</p>
              <p className="text-sm text-neutral-400">
                Tellacity supports automated review invites and integrations.
                Google and Yelp rely mostly on organic customer reviews.
              </p>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white mb-4">
            Frequently asked questions
          </h2>
          <div className="space-y-4 text-sm text-neutral-400">
            <div>
              <p className="text-white font-medium">What is the best review platform?</p>
              <p className="mt-1">
                The best platform depends on your needs. Tellacity focuses on automation and control,
                while platforms like Google and Yelp focus on visibility.
              </p>
            </div>
            <div>
              <p className="text-white font-medium">Is Trustpilot worth it?</p>
              <p className="mt-1">
                Trustpilot can be effective for large businesses, but it comes with higher pricing tiers.
              </p>
            </div>
            <div>
              <p className="text-white font-medium">Are Google Reviews enough?</p>
              <p className="mt-1">
                Google Reviews are essential for SEO, but they lack advanced tools like automation and analytics.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Internal linking */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            Compare platforms in detail
          </h2>
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

        <section className="mt-6">
          <Link href="/compare" className="text-sm text-neutral-400 hover:text-white">
            ← View all comparison pages
          </Link>
        </section>

        {/* 8. CTA */}
        <div className="mt-12 text-center">
          <p className="text-white font-medium mb-2">
            Looking for a modern review platform?
          </p>
          <p className="text-sm text-neutral-400 mb-4">
            Start collecting and managing customer feedback with Tellacity.
          </p>
          <Link
            href="/business/signup"
            className="inline-block bg-[#1FAF9E] text-black px-5 py-2 rounded-md font-medium hover:opacity-90"
          >
            Get Started
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
            description: "Compare the best review platforms including Tellacity, Trustpilot, Yelp, Feefo, HelloPeter and Google Reviews.",
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
              { "@type": "ListItem", position: 3, name: "Best Review Platforms", item: "https://tellacity.com/compare/best-review-platforms" },
            ],
          }),
        }}
      />
    </div>
  );
}
