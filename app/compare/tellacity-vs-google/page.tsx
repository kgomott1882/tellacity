import Link from "next/link";
import Image from "next/image";
import { platformMeta } from "@/lib/platformMeta";

type CompetitorKey = "trustpilot" | "yelp" | "feefo" | "hellopeter";
const GOOGLE_LOGO_SIZE = 160;

const BEST_FOR_TELLACITY = [
  "Businesses that want full control over their customer feedback ecosystem",
  "Teams focused on growth, automation, and ownership of their data",
  "Companies scaling across multiple regions without platform limitations",
  "Brands that want flexible pricing aligned with actual usage",
  "Businesses that prioritize actionable insights over vanity metrics",
  "Teams that want to build trust without relying on third-party marketplaces",
  "Companies looking for modern infrastructure, not legacy systems",
] as const;

const BEST_FOR_GOOGLE = [
  "Businesses relying on Google search and Maps visibility",
  "Teams focused on SEO-driven discovery",
  "Companies that only need public ratings, not owned review systems",
  "Use cases where control and customization are not priorities",
] as const;

const TELLACITY_DIFFERENTIATORS = [
  "Designed for ownership - your reviews, your data, your customer relationships",
  "Built for flexibility - no rigid plans, no forced upgrades",
  "Focused on growth - tools that help you collect, understand, and act on feedback",
  "Scalable by design - works across regions without platform restrictions",
] as const;

const GOOGLE_LIMITATIONS = [
  "No ownership over review environment",
  "Limited tools for collecting and managing feedback",
  "Designed for visibility, not full reputation management",
] as const;

const featureComparison = [
  {
    feature: "Review invites",
    tellacityBadge: "Built for Growth",
    tellacitySubtext: "Automated, flexible, and scalable invite flows",
    competitorBadge: "Restricted",
    competitorSubtext: "Limited by platform rules or plan constraints",
  },
  {
    feature: "Pricing flexibility",
    tellacityBadge: "Usage-based",
    tellacitySubtext: "Pay only for what you actually use",
    competitorBadge: "Rigid",
    competitorSubtext: "Fixed pricing with limited adaptability",
  },
  {
    feature: "Analytics",
    tellacityBadge: "Actionable insights",
    tellacitySubtext: "Real-time data designed for decision making",
    competitorBadge: "Surface-level",
    competitorSubtext: "Basic metrics with limited depth",
  },
  {
    feature: "Global reach",
    tellacityBadge: "Scalable",
    tellacitySubtext: "Works across regions without restrictions",
    competitorBadge: "Platform-bound",
    competitorSubtext: "Reach depends on platform ecosystem",
  },
  {
    feature: "Custom branding",
    tellacityBadge: "Fully customizable",
    tellacitySubtext: "Control your brand experience end-to-end",
    competitorBadge: "Limited",
    competitorSubtext: "Restricted customization options",
  },
  {
    feature: "Contract requirements",
    tellacityBadge: "No lock-ins",
    tellacitySubtext: "Flexible usage without long-term commitments",
    competitorBadge: "Contract-based",
    competitorSubtext: "Requires commitment or structured plans",
  },
] as const;

const pricingTellacity = {
  entry: "Start free, scale as you grow",
  billing: "Flexible monthly - no lock-in",
  notes: "Dedicated review management and widgets.",
};

const pricingGoogle = {
  entry: "Free",
  billing: "N/A (no subscription)",
  notes: "Reviews live on Google Search & Maps profiles.",
};

const EXPLORE_LINKS = [
  { href: "/compare/tellacity-vs-trustpilot", competitorKey: "trustpilot" as CompetitorKey, competitorName: "Trustpilot" },
  { href: "/compare/tellacity-vs-yelp", competitorKey: "yelp" as CompetitorKey, competitorName: "Yelp" },
  { href: "/compare/tellacity-vs-feefo", competitorKey: "feefo" as CompetitorKey, competitorName: "Feefo" },
  { href: "/compare/tellacity-vs-hellopeter", competitorKey: "hellopeter" as CompetitorKey, competitorName: "HelloPeter" },
] as const;

export default function TellacityVsGooglePage() {
  return (
    <div className="min-h-screen bg-[#0E0E0E] px-6 py-16 text-white">
      <div className="sticky top-0 z-40 -mx-6 mb-8 border-b border-neutral-800 bg-[#0E0E0E]/90 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <span className="text-sm text-neutral-300">Start collecting verified reviews today</span>
          <Link
            href="/business/signup"
            className="rounded-md bg-[#1FAF9E] px-4 py-2 text-sm font-medium text-black hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12">
        <div className="mb-4 text-xs text-neutral-400">
          <Link href="/" className="hover:text-white">
            Home
          </Link>{" "}
          /{" "}
          <Link href="/compare" className="hover:text-white">
            Compare
          </Link>{" "}
          / <span className="text-white">Tellacity vs Google Reviews</span>
        </div>

        <section className="text-center">
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src={platformMeta.tellacity.logo}
                alt={platformMeta.tellacity.name}
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-semibold md:text-2xl">{platformMeta.tellacity.name}</span>
            </div>
            <span className="text-2xl font-semibold md:text-3xl">vs</span>
            <div className="flex items-center gap-2">
              <Image
                src={platformMeta.google.logo}
                alt="Google Reviews"
                width={GOOGLE_LOGO_SIZE}
                height={GOOGLE_LOGO_SIZE}
                className="h-40 w-40 object-contain"
              />
              <span className="sr-only">Google Reviews</span>
            </div>
          </div>
          <p className="mx-auto mt-2 max-w-2xl text-sm text-neutral-400 md:text-base">
            Compare Tellacity and Google Reviews to find the right mix of owned review programs and search visibility.
          </p>
        </section>

        <section className="rounded-xl border border-[#1FAF9E] bg-[#1FAF9E]/5 p-5">
          <p className="text-sm leading-relaxed text-neutral-300">
            <span className="font-medium text-white">Quick verdict:</span> Use Google Reviews for how customers find you in
            Search and Maps; use Tellacity when you need invites, branding, widgets, and analytics around your review
            program.
          </p>
        </section>

        <section>
          <h2 className="mb-6 text-2xl font-semibold md:text-3xl">Pricing comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 text-neutral-400">
                  <th className="py-3 text-left">Platform</th>
                  <th className="py-3 text-left">Entry Price</th>
                  <th className="py-3 text-left">Billing</th>
                  <th className="py-3 text-left">Notes</th>
                </tr>
              </thead>
              <tbody className="text-white">
                <tr className="border-b border-neutral-800">
                  <td className="rounded-l-md bg-[#1FAF9E]/10 py-3 font-semibold text-[#1FAF9E]">Tellacity</td>
                  <td className="bg-[#1FAF9E]/5 py-3 text-[#1FAF9E]">{pricingTellacity.entry}</td>
                  <td className="bg-[#1FAF9E]/5 py-3">{pricingTellacity.billing}</td>
                  <td className="rounded-r-md bg-[#1FAF9E]/5 py-3 text-neutral-400">{pricingTellacity.notes}</td>
                </tr>
                <tr>
                  <td className="py-3 font-semibold">Google Reviews</td>
                  <td className="py-3">{pricingGoogle.entry}</td>
                  <td className="py-3">{pricingGoogle.billing}</td>
                  <td className="py-3 text-neutral-400">{pricingGoogle.notes}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Google Reviews has no platform fee; Tellacity pricing reflects review management features.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6">Feature comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-5 pl-6 text-left font-medium text-white/70">Feature</th>
                  <th className="border-l border-r border-emerald-500/20 bg-emerald-500/5 py-5 pl-6 text-left font-medium text-white">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.tellacity.logo}
                        alt={platformMeta.tellacity.name}
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                      <span>Tellacity</span>
                    </div>
                  </th>
                  <th className="py-5 pl-6 text-left font-medium text-white/70">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.google.logo}
                        alt="Google Reviews"
                        width={GOOGLE_LOGO_SIZE}
                        height={GOOGLE_LOGO_SIZE}
                        className="h-40 w-40 object-contain"
                      />
                      <span className="sr-only">Google Reviews</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {featureComparison.map((row) => (
                  <tr key={row.feature} className="border-b border-white/5 transition hover:bg-white/5 last:border-b-0">
                    <td className="py-5 pl-6 align-top text-white/80">{row.feature}</td>
                    <td className="border-l border-r border-emerald-500/20 bg-emerald-500/5 py-5 pl-6 align-top">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {row.tellacityBadge}
                      </span>
                      <p className="mt-2 text-sm text-neutral-300">{row.tellacitySubtext}</p>
                    </td>
                    <td className="py-5 pl-6 align-top">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                        {row.competitorBadge}
                      </span>
                      <p className="mt-2 text-sm text-neutral-400">{row.competitorSubtext}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-6 mt-20">Best for</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative rounded-2xl border border-emerald-500/20 bg-gradient-to-b from-emerald-500/5 to-transparent p-6 shadow-[0_0_40px_rgba(16,185,129,0.15)]">
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src={platformMeta.tellacity.logo}
                  alt={platformMeta.tellacity.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="font-semibold text-white">Tellacity</h3>
              </div>
              <ul className="space-y-2 text-neutral-300">
                {BEST_FOR_TELLACITY.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-80">
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src={platformMeta.google.logo}
                  alt="Google Reviews"
                  width={GOOGLE_LOGO_SIZE}
                  height={GOOGLE_LOGO_SIZE}
                  className="h-40 w-40 object-contain"
                />
                <h3 className="sr-only">Google Reviews</h3>
              </div>
              <ul className="space-y-2 text-neutral-300">
                {BEST_FOR_GOOGLE.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-white mb-4">Why businesses switch to Tellacity</h2>
            <p className="text-white/60 max-w-2xl mb-10">
              Most businesses start with traditional platforms - then move to Tellacity when they need more control,
              flexibility, and real growth.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition">
                <h3 className="text-lg font-semibold text-white mb-2">From platform dependency → full ownership</h3>
                <p className="text-neutral-300">
                  Stop relying on third-party marketplaces to manage your reputation. Tellacity gives you full control
                  over your reviews, data, and customer relationships.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition">
                <h3 className="text-lg font-semibold text-white mb-2">From rigid pricing → flexible growth</h3>
                <p className="text-neutral-300">
                  Traditional platforms lock you into fixed plans. Tellacity adapts to your business with usage-based
                  pricing that scales as you grow.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition">
                <h3 className="text-lg font-semibold text-white mb-2">From passive reviews → active insights</h3>
                <p className="text-neutral-300">
                  Go beyond collecting reviews. Turn feedback into real-time insights that help you improve, respond,
                  and grow faster.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition">
                <h3 className="text-lg font-semibold text-white mb-2">From limitations → scalability</h3>
                <p className="text-neutral-300">
                  Whether you&apos;re operating locally or globally, Tellacity is built to scale without restrictions,
                  contracts, or platform limitations.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <a
                href="/get-started"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-emerald-500 text-black font-medium hover:bg-emerald-400 transition"
              >
                Get started with Tellacity
              </a>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h3 className="mb-2 font-semibold">Why Tellacity is built differently</h3>
            <ul className="space-y-2 text-neutral-300">
              {TELLACITY_DIFFERENTIATORS.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 opacity-90">
            <h3 className="mb-2 font-semibold">Limitations of Google Reviews</h3>
            <ul className="space-y-2 text-neutral-300">
              {GOOGLE_LIMITATIONS.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="mb-4 text-xl font-semibold">Explore other comparisons</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {EXPLORE_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                aria-label={`Tellacity vs ${l.competitorName}`}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] px-4 py-3 transition-colors hover:border-[#1FAF9E] hover:bg-white/[0.03]"
              >
                <Image
                  src={platformMeta[l.competitorKey].logo}
                  alt={l.competitorName}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                <span className="font-medium text-white">{l.competitorName}</span>
              </Link>
            ))}
          </div>
          <p className="mt-6 text-sm text-neutral-400">
            <Link href="/compare" className="text-[#1FAF9E] hover:underline">
              View all platforms on the compare hub
            </Link>
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4">Frequently asked questions</h2>
          <div className="space-y-4 text-sm text-neutral-400">
            <div>
              <p className="text-white font-medium">Is Google Reviews free?</p>
              <p className="mt-1">Yes, Google Reviews is free for businesses and customers.</p>
            </div>
            <div>
              <p className="text-white font-medium">Is Google Reviews enough for a business?</p>
              <p className="mt-1">
                It is essential for visibility, but it lacks automation, owned invites, and branding tools that platforms
                like Tellacity provide.
              </p>
            </div>
            <div>
              <p className="text-white font-medium">What is the main difference between Tellacity and Google?</p>
              <p className="mt-1">
                Tellacity focuses on managing and scaling a review program; Google Reviews focuses on displaying ratings
                in search results.
              </p>
            </div>
          </div>
        </section>

        <div className="space-y-4 pt-8 text-center">
          <p className="text-white font-medium">Looking for more control over your reviews?</p>
          <p className="text-sm text-neutral-400">Start collecting and managing customer feedback with Tellacity.</p>
          <Link
            href="/business/signup"
            className="inline-block rounded-lg bg-[#1FAF9E] px-6 py-3 font-medium text-black hover:opacity-90"
          >
            Get Started
          </Link>
          <p className="mt-2 text-xs text-neutral-500">No hidden fees. No long-term contracts.</p>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: "Tellacity vs Google Reviews",
            description:
              "Compare Tellacity and Google Reviews to find the right platform for collecting, managing, and showcasing customer feedback.",
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
                  text: "Tellacity focuses on managing and scaling reviews, while Google Reviews focuses on displaying them in search.",
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
                name: "Tellacity vs Google Reviews",
                item: "https://tellacity.com/compare/tellacity-vs-google",
              },
            ],
          }),
        }}
      />
    </div>
  );
}
