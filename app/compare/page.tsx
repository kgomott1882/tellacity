import Link from "next/link";
import Image from "next/image";
import { platformMeta } from "@/lib/platformMeta";

const GOOGLE_LOGO_SIZE = 160;

export default function ComparePage() {
  const platforms = ["tellacity", "trustpilot", "yelp", "feefo", "hellopeter"] as const;

  const platformPositioning: Record<(typeof platforms)[number], string> = {
    tellacity: "Modern review management, automation, and global scale",
    trustpilot: "Enterprise-grade trust signals and consumer marketplace reach",
    yelp: "Local discovery and advertising (especially US)",
    feefo: "Verified purchase reviews for enterprise programs",
    hellopeter: "South Africa–focused public feedback and complaints",
  };

  const tableRows = [
    {
      feature: "Free plan:",
      tellacity: "✔",
      trustpilot: "Limited",
      yelp: "✔",
      feefo: "✖",
      hellopeter: "✖",
      google: "✓",
    },
    {
      feature: "Entry pricing:",
      tellacity: "$49/mo (clear, fixed tiers)",
      trustpilot: "From $299/mo",
      yelp: "From $150/mo",
      feefo: "£149–£299/mo",
      hellopeter: "From $42/mo",
      google: "Free (no subscription)",
    },
    {
      feature: "Invite control:",
      tellacity: "Full",
      trustpilot: "Limited",
      yelp: "None",
      feefo: "Controlled",
      hellopeter: "Limited",
      google: "None",
    },
    {
      feature: "Custom branding:",
      tellacity: "✔",
      trustpilot: "Limited",
      yelp: "✖",
      feefo: "✔",
      hellopeter: "Limited",
      google: "✕",
    },
    {
      feature: "Widgets:",
      tellacity: "✔",
      trustpilot: "✔",
      yelp: "✔",
      feefo: "✔",
      hellopeter: "✔",
      google: "✕",
    },
    {
      feature: "Analytics:",
      tellacity: "✔",
      trustpilot: "✔",
      yelp: "Basic",
      feefo: "✔",
      hellopeter: "Basic",
      google: "Basic",
    },
    {
      feature: "Platform reach:",
      tellacity: "Global",
      trustpilot: "Global",
      yelp: "Strong local (US)",
      feefo: "Global (enterprise-focused)",
      hellopeter: "Regional (South Africa)",
      google: "Global (Google Search & Maps)",
    },
    {
      feature: "SEO pages:",
      tellacity: "✔",
      trustpilot: "✔",
      yelp: "✔",
      feefo: "✔",
      hellopeter: "✔",
      google: "✓",
    },
  ];

  const bestFor = [
    { platform: "Tellacity", text: "Businesses that want full control and automation" },
    { platform: "Trustpilot", text: "Businesses using marketplace visibility at scale" },
    { platform: "Yelp", text: "Local discovery and advertising" },
    { platform: "Feefo", text: "Enterprise verified review programs" },
    { platform: "Hellopeter", text: "South African complaint-driven reviews" },
  ];

  const individualCompareLinks = [
    { href: "/compare/tellacity-vs-trustpilot", label: "Tellacity vs Trustpilot", competitorKey: "trustpilot" as const },
    { href: "/compare/tellacity-vs-yelp", label: "Tellacity vs Yelp", competitorKey: "yelp" as const },
    { href: "/compare/tellacity-vs-feefo", label: "Tellacity vs Feefo", competitorKey: "feefo" as const },
    { href: "/compare/tellacity-vs-hellopeter", label: "Tellacity vs HelloPeter", competitorKey: "hellopeter" as const },
    { href: "/compare/tellacity-vs-google", label: "Tellacity vs Google Reviews", competitorKey: "google" as const, wide: true },
  ] as const;

  return (
    <div className="min-h-screen bg-[#2C2C2C] px-6 py-16 text-white">
      <div className="mx-auto max-w-6xl">
        {/* 1. Hero */}
        <section className="mb-16 text-center">
          <h1 className="text-3xl font-semibold text-white md:text-4xl">Compare review platforms</h1>
          <p className="mx-auto mt-4 max-w-2xl text-white">
            See how Tellacity compares with Trustpilot, Yelp, Feefo, HelloPeter and Google Reviews
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-[#1FAF9E] px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Explore Tellacity
          </Link>
        </section>

        {/* 2. Platform grid (positioning) */}
        <section className="mb-16" aria-labelledby="platform-overview-heading">
          <h2 id="platform-overview-heading" className="mb-2 text-2xl font-semibold text-white md:text-3xl">
            Platform overview
          </h2>
          <p className="mb-8 max-w-3xl text-sm text-white">
            How each platform is positioned - use the full comparison table below for feature-by-feature detail.
          </p>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {platforms.map((key) => {
              const platform = platformMeta[key];
              const isTellacity = key === "tellacity";
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center justify-start gap-2 rounded-xl border p-4 text-center transition-colors hover:border-[#1FAF9E] ${
                    isTellacity ? "border-[#1FAF9E]/40 bg-[#1FAF9E]/5" : "border-neutral-800"
                  }`}
                >
                  <Image
                    src={platform.logo}
                    alt={platform.name}
                    width={80}
                    height={80}
                    className="object-contain"
                  />
                  <span className="text-sm font-medium text-white">{platform.name}</span>
                  <span className="text-xs leading-snug text-white">{platformPositioning[key]}</span>
                </div>
              );
            })}
            <div className="flex flex-col items-center justify-start gap-2 rounded-xl border border-neutral-800 p-4 text-center transition-colors hover:border-[#1FAF9E]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/googlereviews.png"
                alt="Google Reviews"
                className="mb-1 h-40 w-40 object-contain object-center"
              />
              <span className="text-sm font-medium text-white">Google Reviews</span>
              <span className="text-xs leading-snug text-white">
                Search &amp; Maps visibility; no subscription for reviews
              </span>
            </div>
          </div>
        </section>

        {/* 3. Full comparison table */}
        <section id="full-comparison" className="mb-8" aria-labelledby="full-comparison-heading">
          <h2 id="full-comparison-heading" className="mb-6 text-2xl font-semibold text-white md:text-3xl">
            Full comparison
          </h2>
          <div className="mb-16 overflow-hidden rounded-xl border border-neutral-800">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-neutral-900">
                    <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-white">
                      Feature
                    </th>
                    <th className="border-b border-r border-neutral-800 bg-[#1FAF9E]/10 px-4 py-3 text-left text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Image
                          src={platformMeta.tellacity.logo}
                          alt={platformMeta.tellacity.name}
                          width={72}
                          height={72}
                          className="object-contain"
                        />
                        <span className="hidden sm:inline">{platformMeta.tellacity.name}</span>
                      </div>
                    </th>
                    <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Image
                          src={platformMeta.trustpilot.logo}
                          alt={platformMeta.trustpilot.name}
                          width={72}
                          height={72}
                          className="object-contain"
                        />
                        <span className="hidden sm:inline">{platformMeta.trustpilot.name}</span>
                      </div>
                    </th>
                    <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Image
                          src={platformMeta.yelp.logo}
                          alt={platformMeta.yelp.name}
                          width={72}
                          height={72}
                          className="object-contain"
                        />
                        <span className="hidden sm:inline">{platformMeta.yelp.name}</span>
                      </div>
                    </th>
                    <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Image
                          src={platformMeta.feefo.logo}
                          alt={platformMeta.feefo.name}
                          width={72}
                          height={72}
                          className="object-contain"
                        />
                        <span className="hidden sm:inline">{platformMeta.feefo.name}</span>
                      </div>
                    </th>
                    <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Image
                          src={platformMeta.hellopeter.logo}
                          alt={platformMeta.hellopeter.name}
                          width={72}
                          height={72}
                          className="object-contain"
                        />
                        <span className="hidden sm:inline">{platformMeta.hellopeter.name}</span>
                      </div>
                    </th>
                    <th className="border-b border-neutral-800 px-4 py-3 text-left text-sm font-medium text-white">
                      <div className="flex items-center gap-2">
                        <Image
                          src={platformMeta.google.logo}
                          alt={platformMeta.google.name}
                          width={GOOGLE_LOGO_SIZE}
                          height={GOOGLE_LOGO_SIZE}
                          className="h-40 w-40 object-contain"
                        />
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row, i) => (
                    <tr key={i} className="border-b border-neutral-800 last:border-b-0">
                      <td className="border-r border-neutral-800 px-4 py-3 text-sm text-white">
                        {row.feature}
                      </td>
                      <td className="border-r border-neutral-800 bg-[#1FAF9E]/10 px-4 py-3 text-sm text-white">
                        {row.tellacity}
                      </td>
                      <td className="border-r border-neutral-800 px-4 py-3 text-sm text-white">
                        {row.trustpilot}
                      </td>
                      <td className="border-r border-neutral-800 px-4 py-3 text-sm text-white">
                        {row.yelp}
                      </td>
                      <td className="border-r border-neutral-800 px-4 py-3 text-sm text-white">
                        {row.feefo}
                      </td>
                      <td className="border-r border-neutral-800 px-4 py-3 text-sm text-white">
                        {row.hellopeter}
                      </td>
                      <td className="px-4 py-3 text-sm text-white">{row.google}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mb-16 space-y-2">
            <p className="text-xs text-white">
              Pricing shown is based on publicly available entry-level plans. Actual costs may increase depending on
              features, usage, and contract terms.
            </p>
            <p className="text-xs text-white">
              *Yelp pricing is based on advertising packages rather than subscription-based review management tools.*
            </p>
            <p className="text-xs text-white">
              Platform reach affects visibility, customer trust, and scalability across markets.
            </p>
          </div>
        </section>

        {/* 4. Use-case breakdown */}
        <section className="mb-16" aria-labelledby="use-case-heading">
          <h2 id="use-case-heading" className="mb-6 text-2xl font-semibold text-white md:text-3xl">
            Best platform by use case
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bestFor.map((item) => {
              const key =
                item.platform.toLowerCase() === "hellopeter"
                  ? "hellopeter"
                  : (item.platform.toLowerCase() as keyof typeof platformMeta);
              const platform = platformMeta[key];

              return (
                <div key={item.platform} className="rounded-xl border border-neutral-800 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Image src={platform.logo} alt={platform.name} width={64} height={64} className="object-contain" />
                    <p className="font-medium text-white">{platform.name}</p>
                  </div>
                  <p className="mt-1 text-white">{item.text}</p>
                </div>
              );
            })}
            <div className="rounded-xl border border-neutral-800 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Image
                  src={platformMeta.google.logo}
                  alt={platformMeta.google.name}
                  width={GOOGLE_LOGO_SIZE}
                  height={GOOGLE_LOGO_SIZE}
                  className="h-40 w-40 object-contain"
                />
              </div>
              <p className="mt-1 text-white">Search visibility and local reputation</p>
            </div>
          </div>

          <h3 className="mt-10 mb-4 text-lg font-semibold text-white">When should you use each platform?</h3>
          <div className="space-y-3 text-sm text-white">
            <p>Choose Tellacity if you want full control, transparent pricing, and scalable automation.</p>
            <p>Choose Trustpilot if your business needs global visibility and you have a larger budget.</p>
            <p>Choose Yelp if your focus is local discovery and US-based customers.</p>
            <p>Choose Feefo if you require enterprise-level verified review programs.</p>
            <p>Choose HelloPeter if your business operates primarily in South Africa.</p>
            <p>Choose Google Reviews if your priority is search visibility and local SEO presence.</p>
          </div>
        </section>

        {/* 5. Head-to-head comparisons */}
        <section className="mb-16" aria-labelledby="head-to-head-heading">
          <h2 id="head-to-head-heading" className="mb-6 text-2xl font-semibold text-white">
            Head-to-head comparisons
          </h2>
          <p className="mb-6 max-w-2xl text-sm text-white">
            Deep dives compare Tellacity with one competitor at a time - focused pricing, features, and trade-offs.
          </p>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {individualCompareLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 rounded-xl border border-white/10 px-4 py-3 text-white transition-all hover:border-[#1FAF9E] hover:bg-white/[0.03] ${
                  "wide" in link && link.wide ? "md:col-span-2" : ""
                }`}
              >
                <Image
                  src={platformMeta[link.competitorKey].logo}
                  alt={platformMeta[link.competitorKey].name}
                  width={28}
                  height={28}
                  className="h-7 w-7 object-contain"
                />
                {link.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Supporting content */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white md:text-3xl">Key differences</h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-1 font-medium text-white">Pricing philosophy</p>
              <p className="text-sm text-white">
                Tellacity offers clear, fixed pricing starting at $49/month with no hidden tiers. Other platforms like
                Trustpilot and Feefo typically start at higher entry prices (around $299/month) with additional costs
                based on features and volume.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-1 font-medium text-white">Control and ownership</p>
              <p className="text-sm text-white">
                Tellacity gives businesses full control over how reviews are collected, displayed, and branded. Other
                platforms may limit customization or require higher-tier plans for full control.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <p className="mb-1 font-medium text-white">Automation and scalability</p>
              <p className="text-sm text-white">
                Tellacity is built for automated review collection through integrations and invite systems. Some
                platforms rely more on manual processes or restrict automation features to enterprise plans.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="mb-4 text-lg font-semibold text-white">Frequently asked questions</h2>
          <div className="space-y-4 text-sm text-white">
            <div>
              <p className="font-medium text-white">Is Trustpilot free for businesses?</p>
              <p>
                Trustpilot offers a limited free plan, but most features require paid subscriptions starting at around
                $299/month.
              </p>
            </div>
            <div>
              <p className="font-medium text-white">Is Yelp really free?</p>
              <p>Yelp allows businesses to list for free, but many visibility and advertising features are paid.</p>
            </div>
            <div>
              <p className="font-medium text-white">What is the best review platform?</p>
              <p>
                The best platform depends on your needs. Tellacity focuses on control and automation, while others focus
                on visibility or regional markets.
              </p>
            </div>
            <div>
              <p className="font-medium text-white">Is Google Reviews enough for a business?</p>
              <p>
                Google Reviews is important for local SEO, but it lacks advanced tools like automation, analytics, and
                branding control.
              </p>
            </div>
            <div>
              <p className="font-medium text-white">What is the difference between Tellacity and Trustpilot?</p>
              <p>
                Tellacity focuses on transparency, automation, and affordability, while Trustpilot focuses on global
                brand visibility with higher pricing tiers.
              </p>
            </div>
          </div>
        </section>

        <p className="mt-10 text-sm text-white">
          <Link href="/compare/best-review-platforms" className="text-white hover:underline">
            How to choose among the best review platforms →
          </Link>
        </p>

        <section className="pt-8 text-center">
          <p className="mx-auto mb-6 max-w-xl text-white">Start collecting and managing customer feedback.</p>
          <Link
            href="/business/signup"
            className="inline-block rounded-lg bg-[#1FAF9E] px-6 py-3 font-medium text-white hover:opacity-90"
          >
            Get started
          </Link>
        </section>
      </div>
    </div>
  );
}
