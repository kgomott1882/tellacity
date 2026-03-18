import Link from "next/link";
import Image from "next/image";
import { platformMeta } from "@/lib/platformMeta";

const tableRows = [
  { feature: "Free plan:", tellacity: "✓", google: "✓" },
  { feature: "Entry pricing:", tellacity: "$69/mo (clear, fixed tiers)", google: "Free (no subscription)" },
  { feature: "Invite control:", tellacity: "Full", google: "None" },
  { feature: "Custom branding:", tellacity: "✓", google: "✕" },
  { feature: "Widgets:", tellacity: "✓", google: "✕" },
  { feature: "Analytics:", tellacity: "✓", google: "Basic" },
  { feature: "Platform reach:", tellacity: "Global", google: "Global (search-based)" },
  { feature: "SEO pages:", tellacity: "✓", google: "✓" },
];

export default function TellacityVsGooglePage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white px-6 py-16">
      <div className="mx-auto max-w-4xl space-y-12">
        <div className="text-xs text-neutral-400 mb-4">
          <Link href="/" className="hover:text-white">Home</Link> /{" "}
          <Link href="/compare" className="hover:text-white">Compare</Link> /{" "}
          <span className="text-white">Tellacity vs Google Reviews</span>
        </div>
        {/* 1. Hero */}
        <section className="text-center">
          <h1 className="text-2xl md:text-3xl font-semibold text-white">
            Tellacity vs Google Reviews
          </h1>
          <p className="text-sm text-neutral-400 text-center mt-2 max-w-2xl mx-auto">
            Compare Tellacity and Google Reviews to find the right platform for collecting, managing, and showcasing customer feedback.
          </p>
        </section>

        {/* 2. Platform cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
            <Image
              src={platformMeta.tellacity.logo}
              alt={platformMeta.tellacity.name}
              width={48}
              height={48}
              className="object-contain mb-2"
            />
            <p className="text-white font-medium">Tellacity</p>
            <p className="text-sm text-neutral-400 mt-1">
              Full control, automation, and business-focused review management
            </p>
          </div>
          <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
            <Image
              src={platformMeta.google.logo}
              alt={platformMeta.google.name}
              width={96}
              height={96}
              className="object-contain mb-2"
            />
            <p className="text-sm text-neutral-400 mt-1">
              Search visibility and local reputation through Google Search and Maps
            </p>
          </div>
        </div>

        {/* 3. Comparison table */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Comparison</h2>
          <div className="overflow-x-auto rounded-xl border border-neutral-800">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400">
                  <th className="py-3 pl-4 text-left font-medium">Feature</th>
                  <th className="py-3 pl-4 text-left font-medium">Tellacity</th>
                  <th className="py-3 pl-4 text-left font-medium">Google Reviews</th>
                </tr>
              </thead>
              <tbody className="text-white">
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-neutral-800 last:border-b-0">
                    <td className="py-3 pl-4 text-neutral-400">{row.feature}</td>
                    <td className="py-3 pl-4 text-[#1FAF9E] bg-[#1FAF9E]/10 font-medium">{row.tellacity}</td>
                    <td className="py-3 pl-4">{row.google}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. What each platform is best for */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">What each platform is best for</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-white font-medium">Tellacity</p>
              <p className="text-sm text-neutral-400 mt-1">
                Businesses that want full control, automation, and scalable review collection
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-white font-medium">Google Reviews</p>
              <p className="text-sm text-neutral-400 mt-1">
                Businesses focused on local SEO and visibility in Google Search and Maps
              </p>
            </div>
          </div>
        </section>

        {/* 5. Key differences */}
        <section>
          <h2 className="text-lg font-semibold text-white mb-4">Key differences</h2>
          <div className="space-y-4 mt-6">
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-white font-medium mb-1">Control vs visibility</p>
              <p className="text-sm text-neutral-400">
                Tellacity gives businesses full control over how reviews are collected, managed, and displayed.
                Google Reviews focuses on visibility within search results but offers limited control.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-white font-medium mb-1">Automation vs passive reviews</p>
              <p className="text-sm text-neutral-400">
                Tellacity allows automated review invites and workflows.
                Google Reviews relies on customers leaving reviews manually.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 p-4">
              <p className="text-white font-medium mb-1">Branding and customization</p>
              <p className="text-sm text-neutral-400">
                Tellacity supports widgets and branding control.
                Google Reviews cannot be customized or branded.
              </p>
            </div>
          </div>
        </section>

        {/* 6. FAQ */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            Frequently asked questions
          </h2>

          <div className="space-y-4 text-sm text-neutral-400">
            <div>
              <p className="text-white font-medium">Is Google Reviews free?</p>
              <p className="mt-1">Yes, Google Reviews is completely free to use for businesses and customers.</p>
            </div>

            <div>
              <p className="text-white font-medium">Is Google Reviews enough for a business?</p>
              <p className="mt-1">
                Google Reviews is important for visibility, but it lacks automation, analytics,
                and branding features offered by platforms like Tellacity.
              </p>
            </div>

            <div>
              <p className="text-white font-medium">What is the main difference between Tellacity and Google?</p>
              <p className="mt-1">
                Tellacity focuses on managing and growing reviews, while Google Reviews focuses on displaying them in search.
              </p>
            </div>
          </div>
        </section>

        {/* 7. Compare with other platforms */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            Compare with other platforms
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

        <section className="mt-4">
          <Link href="/compare/best-review-platforms" className="text-sm text-[#1FAF9E] hover:underline">
            See the best review platforms →
          </Link>
        </section>

        {/* 8. CTA */}
        <div className="mt-12 text-center">
          <p className="text-white font-medium mb-2">
            Looking for more control over your reviews?
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
            name: "Tellacity vs Google Reviews",
            description: "Compare Tellacity and Google Reviews to find the right platform for collecting, managing, and showcasing customer feedback.",
            url: "https://tellacity.com/compare/tellacity-vs-google",
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
              { "@type": "ListItem", position: 2, name: "Google Reviews" },
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
                name: "Is Google Reviews free?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Yes, Google Reviews is completely free to use for businesses and customers.",
                },
              },
              {
                "@type": "Question",
                name: "Is Google Reviews enough for a business?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Google Reviews is important for visibility, but it lacks automation, analytics, and branding features offered by platforms like Tellacity.",
                },
              },
              {
                "@type": "Question",
                name: "What is the main difference between Tellacity and Google?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Tellacity focuses on managing and growing reviews, while Google Reviews focuses on displaying them in search.",
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
              { "@type": "ListItem", position: 3, name: "Tellacity vs Google Reviews", item: "https://tellacity.com/compare/tellacity-vs-google" },
            ],
          }),
        }}
      />
    </div>
  );
}
