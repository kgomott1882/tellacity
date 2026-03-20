import Link from "next/link";
import Image from "next/image";
import { platformMeta } from "@/lib/platformMeta";

type CompetitorKey = "trustpilot" | "yelp" | "feefo" | "hellopeter";

const comparisons = {
  "tellacity-vs-trustpilot": {
    title: "Tellacity vs Trustpilot",
    competitor: "Trustpilot",
    competitorKey: "trustpilot" as CompetitorKey,
    description:
      "Compare Tellacity and Trustpilot across pricing, control, branding, and actionable insights to find the best review platform for your business.",
    quickVerdict:
      "Tellacity offers flexible monthly pricing and full control over invites and branding. Trustpilot brings strong consumer recognition but typically requires higher entry cost and longer commitments.",
    pricingTellacity: {
      entry: "Start free, scale as you grow",
      billing: "Flexible monthly - no lock-in",
      notes: "No long-term contracts; scales with your business.",
    },
    pricingCompetitor: {
      entry: "From ~$299/month",
      billing: "Often annual",
      notes: "Per domain; pricing tiers and add-ons vary.",
    },
    bestForCompetitor: [
      "Businesses operating within Trustpilot's marketplace ecosystem",
      "Teams with budget for enterprise-style reputation programs",
      "Businesses that value a widely recognized trust badge",
    ],
    featureComparison: [
      { feature: "Review invites", tellacity: "✅", competitor: "⚠️" },
      { feature: "Pricing flexibility", tellacity: "✅", competitor: "❌" },
      { feature: "Analytics", tellacity: "✅", competitor: "✅" },
      { feature: "Global reach", tellacity: "✅", competitor: "✅" },
      { feature: "Custom branding", tellacity: "✅", competitor: "⚠️" },
      { feature: "Contract requirements", tellacity: "✅", competitor: "❌" },
    ],
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
    competitorKey: "yelp" as CompetitorKey,
    description:
      "Compare Tellacity and Yelp to understand differences in control, visibility, and business tools.",
    quickVerdict:
      "Tellacity is built for owned review programs, invites, and analytics. Yelp excels at local discovery but ties visibility closely to ads and offers limited review workflow control.",
    pricingTellacity: {
      entry: "Start free, scale as you grow",
      billing: "Flexible monthly - no lock-in",
      notes: "Predictable SaaS-style tiers as you grow.",
    },
    pricingCompetitor: {
      entry: "From ~$150/month (ads)",
      billing: "Ad-based",
      notes: "Spend varies by market and competition.",
    },
    bestForCompetitor: [
      "Local US businesses focused on Yelp discovery",
      "Brands already investing in Yelp advertising",
      "Lead generation tied to Yelp search",
    ],
    featureComparison: [
      { feature: "Review invites", tellacity: "✅", competitor: "❌" },
      { feature: "Pricing flexibility", tellacity: "✅", competitor: "⚠️" },
      { feature: "Analytics", tellacity: "✅", competitor: "⚠️" },
      { feature: "Global reach", tellacity: "✅", competitor: "⚠️" },
      { feature: "Custom branding", tellacity: "✅", competitor: "❌" },
      { feature: "Contract requirements", tellacity: "✅", competitor: "⚠️" },
    ],
    cons: {
      tellacity: ["Growing ecosystem"],
      competitor: ["Limited control over reviews", "Advertising-dependent model"],
    },
  },

  "tellacity-vs-feefo": {
    title: "Tellacity vs Feefo",
    competitor: "Feefo",
    competitorKey: "feefo" as CompetitorKey,
    description:
      "Compare Tellacity and Feefo across pricing, enterprise features, and flexibility.",
    quickVerdict:
      "Tellacity keeps pricing approachable with strong automation and branding. Feefo is strong for verified enterprise programs but is typically costlier and less flexible for many teams.",
    pricingTellacity: {
      entry: "Start free, scale as you grow",
      billing: "Flexible monthly - no lock-in",
      notes: "Transparent tiers without enterprise-only lock-in.",
    },
    pricingCompetitor: {
      entry: "£149–£299/month (typical entry)",
      billing: "Monthly / annual packages",
      notes: "Enterprise tiers and features affect total cost.",
    },
    bestForCompetitor: [
      "Enterprise verified purchase review programs",
      "Retail and e‑commerce at scale",
      "Teams prioritizing Feefo’s verification model",
    ],
    featureComparison: [
      { feature: "Review invites", tellacity: "✅", competitor: "⚠️" },
      { feature: "Pricing flexibility", tellacity: "✅", competitor: "❌" },
      { feature: "Analytics", tellacity: "✅", competitor: "✅" },
      { feature: "Global reach", tellacity: "✅", competitor: "✅" },
      { feature: "Custom branding", tellacity: "✅", competitor: "✅" },
      { feature: "Contract requirements", tellacity: "✅", competitor: "❌" },
    ],
    cons: {
      tellacity: ["Smaller brand footprint"],
      competitor: ["Higher cost", "Less flexible for small businesses"],
    },
  },

  "tellacity-vs-hellopeter": {
    title: "Tellacity vs HelloPeter",
    competitor: "HelloPeter",
    competitorKey: "hellopeter" as CompetitorKey,
    description:
      "Compare Tellacity and HelloPeter for South African businesses looking for modern review tools.",
    quickVerdict:
      "Tellacity scales globally with automation and modern tooling. HelloPeter is a strong South African name for public feedback but has narrower global reach and lighter analytics.",
    pricingTellacity: {
      entry: "Start free, scale as you grow",
      billing: "Flexible monthly - no lock-in",
      notes: "Scales with usage; no forced annual lock-in.",
    },
    pricingCompetitor: {
      entry: "From ~$42/month",
      billing: "Monthly",
      notes: "Entry plans; advanced features may cost more.",
    },
    bestForCompetitor: [
      "South African businesses and local consumers",
      "Complaint-forward and public reputation threads",
      "Teams prioritizing a known regional directory",
    ],
    featureComparison: [
      { feature: "Review invites", tellacity: "✅", competitor: "⚠️" },
      { feature: "Pricing flexibility", tellacity: "✅", competitor: "⚠️" },
      { feature: "Analytics", tellacity: "✅", competitor: "⚠️" },
      { feature: "Global reach", tellacity: "✅", competitor: "❌" },
      { feature: "Custom branding", tellacity: "✅", competitor: "⚠️" },
      { feature: "Contract requirements", tellacity: "✅", competitor: "⚠️" },
    ],
    cons: {
      tellacity: ["New in market"],
      competitor: ["Limited global reach", "Basic tooling"],
    },
  },
} as const;

const BEST_FOR_TELLACITY = [
  "Businesses that want full control over their customer feedback ecosystem",
  "Teams focused on growth, automation, and ownership of their data",
  "Companies scaling across multiple regions without platform limitations",
  "Brands that want flexible pricing aligned with actual usage",
  "Businesses that prioritize actionable insights over vanity metrics",
  "Teams that want to build trust without relying on third-party marketplaces",
  "Companies looking for modern infrastructure, not legacy systems",
] as const;

const FEATURE_COMPARISON_ROWS = [
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

const COMPETITOR_BEST_FOR: Record<CompetitorKey, readonly string[]> = {
  trustpilot: [
    "Businesses comfortable operating inside a marketplace ecosystem",
    "Teams willing to work within fixed pricing structures",
    "Companies that rely on external platforms for visibility",
    "Use cases where flexibility and customization are not a priority",
  ],
  yelp: [
    "Businesses operating within Yelp’s local discovery ecosystem",
    "Teams relying on Yelp visibility for customer acquisition",
    "Companies comfortable with platform-controlled exposure",
    "Use cases where flexibility and ownership are not a priority",
  ],
  feefo: [
    "Businesses using verified purchase review systems",
    "Teams operating within structured enterprise workflows",
    "Companies prioritizing verification over flexibility",
    "Use cases where customization is not a primary requirement",
  ],
  hellopeter: [
    "Businesses focused on South African visibility",
    "Teams relying on public complaint and feedback threads",
    "Companies operating within a regional platform ecosystem",
    "Use cases where global scalability is not required",
  ],
};

const TELLACITY_DIFFERENTIATORS = [
  "Designed for ownership - your reviews, your data, your customer relationships",
  "Built for flexibility - no rigid plans, no forced upgrades",
  "Focused on growth - tools that help you collect, understand, and act on feedback",
  "Scalable by design - works across regions without platform restrictions",
] as const;

const COMPETITOR_LIMITATIONS: Record<CompetitorKey, readonly string[]> = {
  yelp: [
    "Limited control over how reviews are displayed",
    "Visibility often tied to advertising spend",
    "Customer access influenced by platform algorithms",
  ],
  trustpilot: [
    "Higher entry pricing compared to flexible alternatives",
    "Limited customization in lower tiers",
    "Structured plans that may not adapt to all business needs",
  ],
  feefo: [
    "Higher cost structure for scaling businesses",
    "Less flexibility outside verified purchase workflows",
    "Customization depends on plan level",
  ],
  hellopeter: [
    "Limited reach outside South Africa",
    "Basic tooling compared to modern platforms",
    "Focused on public complaints rather than full feedback systems",
  ],
};

export default async function ComparePage(props: {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await props.params;
  const rawSearchParams = (await (props.searchParams ?? Promise.resolve({}))) as Record<
    string,
    string | string[] | undefined
  >;

  const { slug } = params;
  const countryParam = rawSearchParams["country"];

  const rawCountry = String(
    Array.isArray(countryParam) ? countryParam[0] : countryParam ?? ""
  )
    .trim()
    .toUpperCase();
  const allowedCountries = new Set(["US", "ZA", "GB", "AU", "CA", "NZ", "IE"]);
  const countryCode = allowedCountries.has(rawCountry) ? rawCountry : null;
  const companyCountrySegment = countryCode
    ? countryCode === "GB"
      ? "uk"
      : countryCode.toLowerCase()
    : null;
  const categoriesHref = countryCode ? `/categories?country=${countryCode}` : "/categories";
  const companiesHref = companyCountrySegment
    ? `/companies/${companyCountrySegment}?country=${countryCode}`
    : "/companies";
  const data = comparisons[slug as keyof typeof comparisons];

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#2C2C2C] text-white">
        <p>Comparison not found</p>
      </div>
    );
  }

  const competitorMeta = platformMeta[data.competitorKey];
  const competitorBestFor = COMPETITOR_BEST_FOR[data.competitorKey];
  const competitorName = data.competitor;

  return (
    <div className="min-h-screen bg-[#2C2C2C] px-6 py-16 text-white">
      <div className="sticky top-0 z-40 -mx-6 mb-8 border-b border-neutral-700 bg-[#2C2C2C]/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
          <div className="min-w-0 text-xs text-white">
            <Link href="/" className="hover:text-white">
              Home
            </Link>{" "}
            /{" "}
            <Link href="/compare" className="hover:text-white">
              Compare
            </Link>{" "}
            / <span className="text-white">{data.title}</span>
          </div>
          <Link
            href="/business/signup"
            className="shrink-0 rounded-md bg-[#1FAF9E] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Get Started
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-12">
        <div className="space-y-4 text-center">
          <h1 className="text-3xl font-semibold md:text-4xl">
            <span className="inline-flex items-center justify-center gap-3">
              <Image
                src={platformMeta.tellacity.logo}
                alt={platformMeta.tellacity.name}
                width={40}
                height={40}
                className="object-contain"
              />
              <span>{platformMeta.tellacity.name}</span>
              <span>vs</span>
              <Image
                src={competitorMeta.logo}
                alt={data.competitor}
                width={40}
                height={40}
                className="object-contain"
              />
              <span>{data.competitor}</span>
            </span>
          </h1>
          <p className="mt-3 max-w-2xl mx-auto text-sm text-[#F0E8DC]">
            Looking for the difference between Tellacity and {competitorName}? This comparison breaks down features, pricing, control, and flexibility to help businesses choose the right customer review platform.
          </p>
          <p className="mx-auto max-w-2xl text-sm text-[#F0E8DC]">{data.description}</p>
        </div>

        <section className="mb-10 rounded-xl border border-[#1FAF9E] bg-[#1FAF9E]/5 p-5">
          <p className="text-sm leading-relaxed text-white">
            <span className="font-medium text-white">Quick verdict:</span> {data.quickVerdict}
          </p>
        </section>

        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white md:text-3xl">Pricing comparison</h2>
          <div className="overflow-x-auto rounded-lg border border-stone-400 bg-[#F0E8DC]">
            <table className="w-full min-w-[600px] border-collapse text-sm text-black">
              <caption className="sr-only">Pricing comparison for Tellacity and {data.competitor}</caption>
              <thead>
                <tr>
                  <th scope="col" className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-left font-semibold text-black">
                    Platform
                  </th>
                  <th scope="col" className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-left font-semibold text-black">
                    Entry Price
                  </th>
                  <th scope="col" className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-left font-semibold text-black">
                    Billing
                  </th>
                  <th scope="col" className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-left font-semibold text-black">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 font-semibold text-black">Tellacity</td>
                  <td className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-black">
                    {data.pricingTellacity.entry}
                  </td>
                  <td className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-black">
                    {data.pricingTellacity.billing}
                  </td>
                  <td className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-black">
                    {data.pricingTellacity.notes}
                  </td>
                </tr>
                <tr>
                  <td className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 font-semibold text-black">
                    {data.competitor}
                  </td>
                  <td className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-black">
                    {data.pricingCompetitor.entry}
                  </td>
                  <td className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-black">
                    {data.pricingCompetitor.billing}
                  </td>
                  <td className="border border-stone-400 bg-[#F0E8DC] px-4 py-3 text-black">
                    {data.pricingCompetitor.notes}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-white">
            Pricing shown is based on publicly available entry-level plans. Actual costs may increase depending on
            features, usage, and contract terms.
          </p>
          <div className="mt-10 border-t pt-6">
            <h2 className="text-lg font-semibold text-white mb-2">
              Looking for alternatives to {competitorName}?
            </h2>

            <p className="text-sm text-white max-w-2xl">
              If you're exploring alternatives to {competitorName}, Tellacity offers
              greater control, flexible integrations, and a modern approach to
              customer feedback and business intelligence.
            </p>
          </div>
        </section>

        <div className="mb-12 rounded-xl border border-[#1FAF9E] bg-[#1FAF9E]/5 p-5">
          <h3 className="mb-2 font-semibold text-white">Transparent pricing matters</h3>
          <p className="text-sm leading-relaxed text-white">
            Many platforms advertise &quot;starting from&quot; pricing while total cost grows with add-ons and
            contracts. Tellacity uses clear, flexible monthly pricing so you know what you&apos;re paying.
          </p>
        </div>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6">Feature comparison</h2>
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02]">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="py-5 pl-6 text-left font-medium text-white">Feature</th>
                  <th className="border-l border-r border-emerald-500/20 bg-emerald-500/5 py-5 pl-6 text-left font-medium text-white">
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
                  <th className="py-5 pl-6 text-left font-medium text-white">
                    <div className="flex items-center gap-2">
                      <Image src={competitorMeta.logo} alt={data.competitor} width={36} height={36} className="object-contain" />
                      <span>{data.competitor}</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {FEATURE_COMPARISON_ROWS.map((row) => (
                  <tr key={row.feature} className="border-b border-white/5 transition hover:bg-white/5 last:border-b-0">
                    <td className="py-5 pl-6 align-top text-white">{row.feature}</td>
                    <td className="border-l border-r border-emerald-500/20 bg-emerald-500/5 py-5 pl-6 align-top">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-white border border-emerald-500/20">
                        {row.tellacityBadge}
                      </span>
                      <p className="mt-2 text-sm text-white">{row.tellacitySubtext}</p>
                    </td>
                    <td className="py-5 pl-6 align-top">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-white border border-yellow-500/20">
                        {row.competitorBadge}
                      </span>
                      <p className="mt-2 text-sm text-white">{row.competitorSubtext}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-16">
          <h2 className="text-2xl font-semibold text-white mb-6 mt-20">Best for</h2>
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
              <ul className="space-y-2 text-white">
                {BEST_FOR_TELLACITY.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="mb-3 flex items-center gap-2">
                <Image src={competitorMeta.logo} alt={data.competitor} width={40} height={40} className="object-contain" />
                <h3 className="font-semibold text-white">{data.competitor}</h3>
              </div>
              <ul className="space-y-2 text-white">
                {competitorBestFor.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="mt-24">
          <div className="max-w-6xl mx-auto px-6">
            <h2 className="text-3xl font-semibold text-white mb-4">Why businesses switch to Tellacity</h2>
            <p className="text-white max-w-2xl mb-10">
              Most businesses start with traditional platforms - then move to Tellacity when they need more control,
              flexibility, and real growth.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition">
                <h3 className="text-lg font-semibold text-white mb-2">From platform dependency → full ownership</h3>
                <p className="text-white">
                  Stop relying on third-party marketplaces to manage your reputation. Tellacity gives you full control
                  over your reviews, data, and customer relationships.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition">
                <h3 className="text-lg font-semibold text-white mb-2">From rigid pricing → flexible growth</h3>
                <p className="text-white">
                  Traditional platforms lock you into fixed plans. Tellacity adapts to your business with usage-based
                  pricing that scales as you grow.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition">
                <h3 className="text-lg font-semibold text-white mb-2">From passive reviews → active insights</h3>
                <p className="text-white">
                  Go beyond collecting reviews. Turn feedback into real-time insights that help you improve, respond,
                  and grow faster.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:bg-white/10 hover:shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:-translate-y-1 transition">
                <h3 className="text-lg font-semibold text-white mb-2">From limitations → scalability</h3>
                <p className="text-white">
                  Whether you&apos;re operating locally or globally, Tellacity is built to scale without restrictions,
                  contracts, or platform limitations.
                </p>
              </div>
            </div>

            <div className="mt-12 text-center">
              <a
                href="/get-started"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-400 transition"
              >
                Get started with Tellacity
              </a>
            </div>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-6">
            <h3 className="mb-2 font-semibold">Why Tellacity is built differently</h3>
            <ul className="space-y-2 text-white">
              {TELLACITY_DIFFERENTIATORS.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h3 className="mb-2 font-semibold">Limitations of {data.competitor}</h3>
            <ul className="space-y-2 text-white">
              {COMPETITOR_LIMITATIONS[data.competitorKey].map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>

        <section className="mt-16 pt-8 border-t border-neutral-800">
          <h3 className="text-lg font-semibold text-white mb-4">
            Compare Tellacity with other platforms
          </h3>

          <div className="flex flex-wrap gap-4 text-sm">
            <a href="/compare/tellacity-vs-trustpilot" className="text-white hover:text-white transition">
              Tellacity vs Trustpilot
            </a>
            <a href="/compare/tellacity-vs-yelp" className="text-white hover:text-white transition">
              Tellacity vs Yelp
            </a>
            <a href="/compare/tellacity-vs-feefo" className="text-white hover:text-white transition">
              Tellacity vs Feefo
            </a>
            <a href="/compare/tellacity-vs-hellopeter" className="text-white hover:text-white transition">
              Tellacity vs HelloPeter
            </a>
          </div>
        </section>

        <div className="space-y-4 pt-8 text-center">
          <h2 className="mb-3 text-2xl font-semibold text-white">Ready to switch to a better review platform?</h2>
          <p className="mb-6 text-white">
            Join businesses choosing flexibility, transparency, and growth with Tellacity.
          </p>
          <Link
            href="/business/signup"
            className="inline-block rounded-lg bg-[#1FAF9E] px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            Get Started
          </Link>
          <p className="mt-2 text-xs text-white">No hidden fees. No long-term contracts.</p>
        </div>

        <div className="mt-10 border-t pt-6 text-sm space-y-2">
          <p>
            Explore more customer review platforms or browse businesses already using Tellacity.
          </p>

          <div className="flex gap-4">
            <a href={categoriesHref} className="text-white hover:underline">
              Browse categories
            </a>

            <a href={companiesHref} className="text-white hover:underline">
              Browse companies
            </a>
          </div>
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
