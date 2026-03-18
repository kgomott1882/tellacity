import Link from "next/link";
import Image from "next/image";
import { platformMeta } from "@/lib/platformMeta";

const comparisons = {
  "tellacity-vs-trustpilot": {
    title: "Tellacity vs Trustpilot",
    competitor: "Trustpilot",
    description:
      "Compare Tellacity and Trustpilot across pricing, control, branding, and actionable insights to find the best review platform for your business.",
    pricing: {
      tellacity: "Start free, scale as you grow",
      competitor: "$299/month+ entry pricing",
    },
    pros: {
      tellacity: [
        "Start free, scale as you grow",
        "Full control over review invites",
        "Custom branding and widgets",
      ],
      competitor: [
        "Established brand",
        "Large consumer traffic",
      ],
    },
    cons: {
      tellacity: ["Newer platform"],
      competitor: [
        "Expensive entry pricing",
        "Limited customization",
        "Strict review control policies",
      ],
    },
  },

  "tellacity-vs-yelp": {
    title: "Tellacity vs Yelp",
    competitor: "Yelp",
    description:
      "Compare Tellacity and Yelp to understand differences in control, visibility, and business tools.",
    pricing: {
      tellacity: "Free + scalable pricing",
      competitor: "Custom / Ads-based",
    },
    pros: {
      tellacity: [
        "Direct invite system",
        "Full ownership of reviews",
        "Actionable business insights",
      ],
      competitor: [
        "High local visibility",
        "Strong brand recognition",
      ],
    },
    cons: {
      tellacity: ["Growing ecosystem"],
      competitor: [
        "Limited control over reviews",
        "Advertising-dependent model",
      ],
    },
  },

  "tellacity-vs-feefo": {
    title: "Tellacity vs Feefo",
    competitor: "Feefo",
    description:
      "Compare Tellacity and Feefo across pricing, enterprise features, and flexibility.",
    pricing: {
      tellacity: "Free + flexible tiers",
      competitor: "Paid enterprise pricing",
    },
    pros: {
      tellacity: [
        "Accessible pricing",
        "Custom widgets",
        "Actionable analytics dashboard",
      ],
      competitor: [
        "Enterprise integrations",
        "Established platform",
      ],
    },
    cons: {
      tellacity: ["Smaller brand footprint"],
      competitor: [
        "Higher cost",
        "Less flexible for small businesses",
      ],
    },
  },

  "tellacity-vs-hellopeter": {
    title: "Tellacity vs HelloPeter",
    competitor: "HelloPeter",
    description:
      "Compare Tellacity and HelloPeter for South African businesses looking for modern review tools.",
    pricing: {
      tellacity: "Start free, scale as you grow",
      competitor: "$42/month entry pricing",
    },
    pros: {
      tellacity: [
        "Modern dashboard",
        "Better automation",
        "Global scalability",
      ],
      competitor: [
        "Strong local presence (South Africa)",
      ],
    },
    cons: {
      tellacity: ["New in market"],
      competitor: [
        "Limited global reach",
        "Basic tooling",
      ],
    },
  },
};

const competitorFeatures: Record<string, Record<string, string>> = {
  "tellacity-vs-trustpilot": {
    freePlan: "Limited / paid",
    invites: "50–200 on lower tiers",
    control: "Limited",
    branding: "Limited",
    widgets: "✓",
    analytics: "✓",
    contracts: "Annual",
    seo: "✓",
  },
  "tellacity-vs-yelp": {
    freePlan: "Free + Ads",
    invites: "None",
    control: "None",
    branding: "✗",
    widgets: "✓",
    analytics: "Basic",
    contracts: "Ad-based",
    seo: "✓",
  },
  "tellacity-vs-feefo": {
    freePlan: "Paid",
    invites: "200–500",
    control: "Controlled",
    branding: "✓",
    widgets: "✓",
    analytics: "Strong",
    contracts: "Often annual",
    seo: "✓",
  },
  "tellacity-vs-hellopeter": {
    freePlan: "$42/mo entry",
    invites: "Limited",
    control: "Limited",
    branding: "Limited",
    widgets: "✓",
    analytics: "Basic",
    contracts: "Monthly",
    seo: "✓",
  },
};

function getCompetitorFeature(slug: string, key: string): string {
  return competitorFeatures[slug]?.[key] ?? "—";
}

export default async function CompareSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = comparisons[slug as keyof typeof comparisons];

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0E0E0E] text-white">
        <p>Comparison not found</p>
      </div>
    );
  }

  const featureRows = [
    { feature: "Free Plan", tellacity: "Start free, scale as you grow", competitor: getCompetitorFeature(slug, "freePlan") },
    { feature: "Review Invites", tellacity: "Full control, scalable", competitor: getCompetitorFeature(slug, "invites") },
    { feature: "Control Over Reviews", tellacity: "Full", competitor: getCompetitorFeature(slug, "control") },
    { feature: "Custom Branding", tellacity: "✓", competitor: getCompetitorFeature(slug, "branding") },
    { feature: "Widgets", tellacity: "✓", competitor: getCompetitorFeature(slug, "widgets") },
    { feature: "Actionable insights", tellacity: "Actionable business insights", competitor: getCompetitorFeature(slug, "analytics") },
    { feature: "Contracts", tellacity: "Flexible monthly pricing — no lock-in", competitor: getCompetitorFeature(slug, "contracts") },
    { feature: "SEO Benefits", tellacity: "✓", competitor: getCompetitorFeature(slug, "seo") },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] px-6 py-16 text-white">
      <div className="sticky top-0 z-40 bg-[#0E0E0E]/90 backdrop-blur border-b border-neutral-800 py-3 -mx-6 mb-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
          <span className="text-sm text-neutral-300">
            Start collecting verified reviews today
          </span>
          <Link
            href="/business/signup"
            className="bg-[#1FAF9E] text-black px-4 py-2 rounded-md text-sm font-medium hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12">
        <div className="text-xs text-neutral-400 mb-4">
          <Link href="/" className="hover:text-white">Home</Link> /{" "}
          <Link href="/compare" className="hover:text-white">Compare</Link> /{" "}
          <span className="text-white">{data.title}</span>
        </div>
        <div className="space-y-4 text-center">
          <div className="flex items-center justify-center gap-4">
            <div className="flex items-center gap-2">
              <Image
                src={platformMeta.tellacity.logo}
                alt={platformMeta.tellacity.name}
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-semibold md:text-2xl">
                {platformMeta.tellacity.name}
              </span>
            </div>
            <span className="text-2xl font-semibold md:text-3xl">vs</span>
            <div className="flex items-center gap-2">
              <Image
                src={
                  platformMeta[
                    data.competitor.toLowerCase() as
                      | "trustpilot"
                      | "yelp"
                      | "feefo"
                      | "hellopeter"
                  ].logo
                }
                alt={data.competitor}
                width={40}
                height={40}
                className="object-contain"
              />
              <span className="text-xl font-semibold md:text-2xl">
                {data.competitor}
              </span>
            </div>
          </div>
          <p className="mx-auto max-w-2xl text-neutral-400">{data.description}</p>
        </div>

        <section className="mb-10 border border-[#1FAF9E] rounded-xl p-5 bg-[#1FAF9E]/5">
          <p className="text-sm text-neutral-300 leading-relaxed">
            <span className="text-white font-medium">Quick verdict:</span>{" "}
            Tellacity is a modern alternative with flexible monthly pricing, full control over
            reviews, and powerful analytics — while competitors like Trustpilot and Feefo require
            long-term contracts and higher costs.
          </p>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold md:text-3xl">
            Pricing comparison
          </h2>
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
                  <td className="py-3 font-semibold text-[#1FAF9E] bg-[#1FAF9E]/10 rounded-l-md">
                    Tellacity
                  </td>
                  <td className="py-3 text-[#1FAF9E] bg-[#1FAF9E]/5">
                    Start free, scale as you grow
                  </td>
                  <td className="py-3 bg-[#1FAF9E]/5">
                    Flexible monthly pricing — no lock-in
                  </td>
                  <td className="py-3 text-neutral-400 bg-[#1FAF9E]/5 rounded-r-md">
                    No contracts. Scales with your business.
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3">Trustpilot</td>
                  <td className="py-3">From $299/month</td>
                  <td className="py-3">Annual contract</td>
                  <td className="py-3 text-neutral-400">
                    Per domain. Billed annually.
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3">Feefo</td>
                  <td className="py-3">£149–£299/month</td>
                  <td className="py-3">Monthly</td>
                  <td className="py-3 text-neutral-400">
                    Pricing varies by package and features.
                  </td>
                </tr>
                <tr className="border-b border-neutral-800">
                  <td className="py-3">HelloPeter</td>
                  <td className="py-3">From $42/month</td>
                  <td className="py-3">Monthly</td>
                  <td className="py-3 text-neutral-400">
                    Entry-level pricing. Features limited.
                  </td>
                </tr>
                <tr>
                  <td className="py-3">Yelp</td>
                  <td className="py-3">From $150/month (ads)</td>
                  <td className="py-3">Ad-based</td>
                  <td className="py-3 text-neutral-400">
                    Ad spend varies based on competition.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-neutral-500 mt-3">
            Pricing shown is based on publicly available entry-level plans. Actual costs may increase
            depending on features, usage, and contract terms.
          </p>
          <p className="text-xs text-neutral-500 mt-2">
            Platform reach affects visibility, customer trust, and scalability across markets.
          </p>
        </section>

        <div className="mb-12 border border-[#1FAF9E] rounded-xl p-5 bg-[#1FAF9E]/5">
          <h3 className="font-semibold mb-2 text-white">Transparent pricing matters</h3>

          <p className="text-sm text-neutral-300 leading-relaxed">
            Many review platforms advertise &quot;starting from&quot; pricing, but actual costs can
            increase significantly based on features, usage, and long-term contracts. Tellacity
            offers clear, flexible monthly pricing so you always know what you&apos;re paying.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[#1FAF9E] bg-[#1FAF9E]/10 p-6">
            <div className="mb-2 flex items-center gap-2">
              <Image
                src={platformMeta.tellacity.logo}
                alt={platformMeta.tellacity.name}
                width={40}
                height={40}
                className="object-contain"
              />
              <h3 className="font-semibold">{platformMeta.tellacity.name}</h3>
            </div>
            <p className="text-neutral-300">{data.pricing.tellacity}</p>
          </div>
          <div className="rounded-xl border border-neutral-800 p-6">
            <div className="mb-2 flex items-center gap-2">
              <Image
                src={
                  platformMeta[
                    data.competitor.toLowerCase() as
                      | "trustpilot"
                      | "yelp"
                      | "feefo"
                      | "hellopeter"
                  ].logo
                }
                alt={data.competitor}
                width={40}
                height={40}
                className="object-contain"
              />
              <h3 className="font-semibold">{data.competitor}</h3>
            </div>
            <p className="text-neutral-400">{data.pricing.competitor}</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold">Why choose Tellacity</h3>
            <ul className="space-y-2 text-neutral-300">
              {data.pros.tellacity.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="font-semibold">Why choose {data.competitor}</h3>
            <ul className="space-y-2 text-neutral-400">
              {data.pros.competitor.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center my-12">
          <Link
            href="/business/signup"
            className="bg-[#1FAF9E] text-black px-6 py-3 rounded-lg font-medium hover:opacity-90"
          >
            Start with Tellacity
          </Link>
          <p className="text-xs text-neutral-500 mt-2">
            No hidden fees. No long-term contracts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <h3 className="mb-2 font-semibold">Limitations of Tellacity</h3>
            <ul className="space-y-2 text-neutral-400">
              {data.cons.tellacity.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-2 font-semibold">Limitations of {data.competitor}</h3>
            <ul className="space-y-2 text-neutral-400">
              {data.cons.competitor.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold md:text-3xl">
            What you actually get
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-800 bg-[#111] p-6">
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src={platformMeta.tellacity.logo}
                  alt={platformMeta.tellacity.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="font-semibold text-[#1FAF9E]">
                  {platformMeta.tellacity.name}
                </h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>Unlimited review invites (plan-based scaling)</li>
                <li>Full control over reviews</li>
                <li>Custom branding &amp; widgets</li>
                <li>Actionable analytics dashboard</li>
                <li>Flexible monthly pricing — no lock-in</li>
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-[#111] p-6">
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src={platformMeta.trustpilot.logo}
                  alt={platformMeta.trustpilot.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="font-semibold">{platformMeta.trustpilot.name}</h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>50–200 invites on lower tiers</li>
                <li>High monthly cost ($299+)</li>
                <li>Limited customization</li>
                <li>Add-ons required for advanced features</li>
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-[#111] p-6">
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src={platformMeta.feefo.logo}
                  alt={platformMeta.feefo.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="font-semibold">{platformMeta.feefo.name}</h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>200–500 invites</li>
                <li>Strong analytics tools</li>
                <li>Enterprise-focused pricing</li>
                <li>Extra features cost more</li>
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-[#111] p-6">
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src={platformMeta.yelp.logo}
                  alt={platformMeta.yelp.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="font-semibold">{platformMeta.yelp.name}</h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>Free listing</li>
                <li>Pay for ads to gain visibility</li>
                <li>No control over review system</li>
                <li>Lead-generation focused</li>
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-800 bg-[#111] p-6">
              <div className="mb-3 flex items-center gap-2">
                <Image
                  src={platformMeta.hellopeter.logo}
                  alt={platformMeta.hellopeter.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="font-semibold">{platformMeta.hellopeter.name}</h3>
              </div>
              <ul className="space-y-2 text-sm text-neutral-400">
                <li>Review collection tools</li>
                <li>Social proof features</li>
                <li>Limited analytics</li>
                <li>South Africa-focused</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-16 border border-neutral-800 rounded-xl p-6 text-center bg-[#111]">
          <p className="text-sm text-neutral-400">
            Trusted by growing businesses looking for a modern review platform.
          </p>
        </section>

        <section className="mb-16 overflow-hidden rounded-xl border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-neutral-800 bg-neutral-900/50 text-neutral-400">
                  <th className="py-3 pl-4 text-left font-medium">Feature</th>
                  <th className="py-3 pl-4 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.tellacity.logo}
                        alt={platformMeta.tellacity.name}
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                      <span>{platformMeta.tellacity.name}</span>
                    </div>
                  </th>
                  <th className="py-3 pl-4 text-left font-medium">
                    <div className="flex items-center gap-2">
                      <Image
                        src={
                          platformMeta[
                            data.competitor.toLowerCase() as
                              | "trustpilot"
                              | "yelp"
                              | "feefo"
                              | "hellopeter"
                          ].logo
                        }
                        alt={data.competitor}
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                      <span>{data.competitor}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="text-white">
                {featureRows.map((row, i) => (
                  <tr key={i} className="border-b border-neutral-800 last:border-b-0">
                    <td className="py-3 pl-4 text-neutral-400">{row.feature}</td>
                    <td className="py-3 pl-4 text-[#1FAF9E] bg-[#1FAF9E]/10 font-semibold">
                      {row.tellacity}
                    </td>
                    <td className="py-3 pl-4">{row.competitor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-16">
          <h2 className="text-2xl font-semibold mb-6">
            Platform positioning &amp; focus
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-[#1FAF9E] rounded-xl p-6 bg-[#1FAF9E]/5">
              <div className="flex items-center gap-2 mb-3">
                <Image
                  src={platformMeta.tellacity.logo}
                  alt={platformMeta.tellacity.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="text-sm font-semibold text-[#1FAF9E]">
                  {platformMeta.tellacity.name}
                </h3>
              </div>

              <p className="text-sm text-neutral-300 mb-2">
                Modern, global review platform built for flexibility and growth.
              </p>

              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• Global-first platform</li>
                <li>• Monthly pricing (no contracts)</li>
                <li>• Built for startups → enterprise scaling</li>
                <li>• Focus on analytics + control</li>
                <li>• Designed as a modern global alternative</li>
              </ul>
            </div>

            <div className="border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Image
                  src={platformMeta.trustpilot.logo}
                  alt={platformMeta.trustpilot.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="text-sm font-semibold">
                  {platformMeta.trustpilot.name}
                </h3>
              </div>

              <p className="text-sm text-neutral-300 mb-2">
                Established global review platform focused on enterprise trust and brand reputation.
              </p>

              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• Global presence</li>
                <li>• Strong brand recognition</li>
                <li>• Enterprise-focused pricing</li>
                <li>• Long-term contracts common</li>
              </ul>
            </div>

            <div className="border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Image
                  src={platformMeta.yelp.logo}
                  alt={platformMeta.yelp.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="text-sm font-semibold">
                  {platformMeta.yelp.name}
                </h3>
              </div>

              <p className="text-sm text-neutral-300 mb-2">
                Local discovery and advertising platform centered around visibility and lead generation.
              </p>

              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• Strong local search presence</li>
                <li>• Ad-driven business model</li>
                <li>• Limited control over reviews</li>
                <li>• Focus on US and local markets</li>
              </ul>
            </div>

            <div className="border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Image
                  src={platformMeta.feefo.logo}
                  alt={platformMeta.feefo.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="text-sm font-semibold">
                  {platformMeta.feefo.name}
                </h3>
              </div>

              <p className="text-sm text-neutral-300 mb-2">
                Verified review platform focused on transactional feedback and enterprise insights.
              </p>

              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• UK-origin platform with global clients</li>
                <li>• Strong verification model</li>
                <li>• Enterprise-oriented pricing</li>
                <li>• Analytics-focused</li>
              </ul>
            </div>

            <div className="border border-neutral-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Image
                  src={platformMeta.hellopeter.logo}
                  alt={platformMeta.hellopeter.name}
                  width={40}
                  height={40}
                  className="object-contain"
                />
                <h3 className="text-sm font-semibold">
                  {platformMeta.hellopeter.name}
                </h3>
              </div>

              <p className="text-sm text-neutral-300 mb-2">
                Regional review platform focused on customer complaints and public feedback.
              </p>

              <ul className="text-xs text-neutral-400 space-y-1">
                <li>• Strong presence in South Africa</li>
                <li>• Complaint-driven reviews</li>
                <li>• Limited global reach</li>
                <li>• Basic analytics tools</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold mb-6">
            Why businesses switch to Tellacity
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-neutral-800 rounded-xl p-5">
              <h3 className="font-medium mb-2">No long-term contracts</h3>
              <p className="text-sm text-neutral-400">
                Unlike competitors, Tellacity uses flexible monthly pricing with no lock-in.
              </p>
            </div>

            <div className="border border-neutral-800 rounded-xl p-5">
              <h3 className="font-medium mb-2">Full control over reviews</h3>
              <p className="text-sm text-neutral-400">
                Own your customer feedback and manage your reputation on your terms.
              </p>
            </div>

            <div className="border border-neutral-800 rounded-xl p-5">
              <h3 className="font-medium mb-2">Built for growth</h3>
              <p className="text-sm text-neutral-400">
                Advanced analytics, invite systems, and automation to scale your business.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-16">
          <div className="rounded-xl border border-neutral-800 bg-[#111] p-6">
            <h2 className="mb-4 text-xl font-semibold">
              A new approach to review management
            </h2>
            <p className="text-sm leading-relaxed text-neutral-400">
              Tellacity focuses on control, automation, and transparent pricing. You get full control over reviews, flexible monthly pricing without long-term contracts, and tools designed to scale with your business. If you want visibility in search, use Google alongside a dedicated platform; if you want to own the review process without high fixed costs, Tellacity is built for that.
            </p>
          </div>
        </section>

        <p className="text-sm text-neutral-400 mb-8">
          <Link href="/compare" className="text-[#1FAF9E] hover:underline">
            View all comparison pages
          </Link>
        </p>

        <div className="space-y-4 pt-8 text-center">
          <h2 className="text-2xl font-semibold mb-3">
            Ready to switch to a better review platform?
          </h2>
          <p className="text-neutral-400 mb-6">
            Join businesses choosing flexibility, transparency, and growth with Tellacity.
          </p>
          <Link
            href="/business/signup"
            className="inline-block rounded-lg bg-[#1FAF9E] px-6 py-3 font-medium text-black transition hover:opacity-90"
          >
            Get Started
          </Link>
          <p className="text-xs text-neutral-500 mt-2">
            No hidden fees. No long-term contracts.
          </p>
        </div>
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: data.title,
            description: data.description,
            url: `https://tellacity.com/compare/${slug}`,
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
              { "@type": "ListItem", position: 2, name: data.competitor },
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
              { "@type": "ListItem", position: 3, name: data.title, item: `https://tellacity.com/compare/${slug}` },
            ],
          }),
        }}
      />
    </div>
  );
}
