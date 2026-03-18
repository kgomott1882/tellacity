import Link from "next/link";
import Image from "next/image";
import { platformMeta } from "@/lib/platformMeta";

export default function ComparePage() {
  const platforms = ["tellacity", "trustpilot", "yelp", "feefo", "hellopeter"] as const;

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
      tellacity: "$69/mo (clear, fixed tiers)",
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
    { platform: "Trustpilot", text: "Large brands needing global visibility" },
    { platform: "Yelp", text: "Local discovery and advertising" },
    { platform: "Feefo", text: "Enterprise verified review programs" },
    { platform: "Hellopeter", text: "South African complaint-driven reviews" },
  ];

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white px-6 py-16">
      <div className="mx-auto max-w-6xl">
        {/* 1. HERO SECTION */}
        <section className="mb-16 text-center">
          <h1 className="text-3xl font-semibold text-white md:text-4xl">
            Compare Review Platforms
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-neutral-400">
            See how Tellacity compares with Trustpilot, Yelp, Feefo, HelloPeter and Google Reviews
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-[#1FAF9E] px-6 py-3 font-medium text-black hover:opacity-90"
          >
            Explore Tellacity
          </Link>
        </section>

        {/* 2. PLATFORM CARDS */}
        <section className="mb-16">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-6">
            {platforms.map((key) => {
              const platform = platformMeta[key];
              const isTellacity = key === "tellacity";
              return (
                <div
                  key={key}
                  className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center text-neutral-300 transition-colors hover:border-[#1FAF9E] ${
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
                  <span className="text-sm">{platform.name}</span>
                </div>
              );
            })}
            <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-neutral-800 p-4 text-center text-neutral-300 transition-colors hover:border-[#1FAF9E]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/googlereviews.png"
                alt="Google Reviews"
                className="mb-2 h-6 w-6 object-contain object-center"
              />
            </div>
          </div>
        </section>

        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">
            Compare Tellacity vs Other Platforms
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Link
              href="/compare/tellacity-vs-trustpilot"
              className="block rounded-xl border border-white/10 px-4 py-3 text-white transition-all hover:border-white/20 hover:bg-white/[0.03]"
            >
              Tellacity vs Trustpilot
            </Link>
            <Link
              href="/compare/tellacity-vs-yelp"
              className="block rounded-xl border border-white/10 px-4 py-3 text-white transition-all hover:border-white/20 hover:bg-white/[0.03]"
            >
              Tellacity vs Yelp
            </Link>
            <Link
              href="/compare/tellacity-vs-feefo"
              className="block rounded-xl border border-white/10 px-4 py-3 text-white transition-all hover:border-white/20 hover:bg-white/[0.03]"
            >
              Tellacity vs Feefo
            </Link>
            <Link
              href="/compare/tellacity-vs-hellopeter"
              className="block rounded-xl border border-white/10 px-4 py-3 text-white transition-all hover:border-white/20 hover:bg-white/[0.03]"
            >
              Tellacity vs HelloPeter
            </Link>
            <div className="md:col-span-2">
              <Link
                href="/compare/tellacity-vs-google"
                className="block rounded-xl border border-white/10 px-4 py-3 text-white transition-all hover:border-white/20 hover:bg-white/[0.03]"
              >
                Tellacity vs Google Reviews
              </Link>
            </div>
          </div>
        </div>

        {/* 3. COMPARISON TABLE */}
        <section className="mb-16 overflow-hidden rounded-xl border border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="bg-neutral-900">
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    Feature
                  </th>
                  <th className="border-b border-r border-neutral-800 bg-[#1FAF9E]/10 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.tellacity.logo}
                        alt={platformMeta.tellacity.name}
                        width={72}
                        height={72}
                        className="object-contain"
                      />
                      <span>{platformMeta.tellacity.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.trustpilot.logo}
                        alt={platformMeta.trustpilot.name}
                        width={72}
                        height={72}
                        className="object-contain"
                      />
                      <span>{platformMeta.trustpilot.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.yelp.logo}
                        alt={platformMeta.yelp.name}
                        width={72}
                        height={72}
                        className="object-contain"
                      />
                      <span>{platformMeta.yelp.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.feefo.logo}
                        alt={platformMeta.feefo.name}
                        width={72}
                        height={72}
                        className="object-contain"
                      />
                      <span>{platformMeta.feefo.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-r border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.hellopeter.logo}
                        alt={platformMeta.hellopeter.name}
                        width={72}
                        height={72}
                        className="object-contain"
                      />
                      <span>{platformMeta.hellopeter.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-neutral-800 px-4 py-3 text-left text-sm font-medium text-white">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.google.logo}
                        alt={platformMeta.google.name}
                        width={144}
                        height={144}
                        className="object-contain"
                      />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, i) => (
                  <tr key={i} className="border-b border-neutral-800 last:border-b-0">
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">
                      {row.feature}
                    </td>
                    <td className="border-r border-neutral-800 bg-[#1FAF9E]/10 px-4 py-3 text-sm text-neutral-300">
                      {row.tellacity}
                    </td>
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">
                      {row.trustpilot}
                    </td>
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">
                      {row.yelp}
                    </td>
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">
                      {row.feefo}
                    </td>
                    <td className="border-r border-neutral-800 px-4 py-3 text-sm text-neutral-300">
                      {row.hellopeter}
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-300">{row.google}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. FOOTNOTES */}
        <section className="mb-16">
          <p className="text-xs text-neutral-500">
            Pricing shown is based on publicly available entry-level plans. Actual costs may
            increase depending on features, usage, and contract terms.
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            *Yelp pricing is based on advertising packages rather than subscription-based
            review management tools.*
          </p>
          <p className="mt-2 text-xs text-neutral-500">
            Platform reach affects visibility, customer trust, and scalability across markets.
          </p>
        </section>

        {/* 5. BEST FOR SECTION */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white md:text-3xl">
            What each platform is best for
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {bestFor.map((item) => {
              const key =
                item.platform.toLowerCase() === "hellopeter"
                  ? "hellopeter"
                  : (item.platform.toLowerCase() as keyof typeof platformMeta);
              const platform = platformMeta[key];

              return (
                <div
                  key={item.platform}
                  className="rounded-xl border border-neutral-800 p-4"
                >
                  <div className="mb-2 flex items-center gap-2">
                    <Image
                      src={platform.logo}
                      alt={platform.name}
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                    <p className="font-medium text-white">{platform.name}</p>
                  </div>
                  <p className="mt-1 text-neutral-400">{item.text}</p>
                </div>
              );
            })}
            <div className="rounded-xl border border-neutral-800 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Image
                  src={platformMeta.google.logo}
                  alt={platformMeta.google.name}
                  width={128}
                  height={128}
                  className="object-contain"
                />
              </div>
              <p className="mt-1 text-neutral-400">
                Search visibility and local reputation
              </p>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-semibold text-white mb-4">
            When should you use each platform?
          </h2>

          <div className="space-y-3 text-sm text-neutral-400">
            <p>
              Choose Tellacity if you want full control, transparent pricing, and scalable automation.
            </p>
            <p>
              Choose Trustpilot if your business needs global visibility and you have a larger budget.
            </p>
            <p>
              Choose Yelp if your focus is local discovery and US-based customers.
            </p>
            <p>
              Choose Feefo if you require enterprise-level verified review programs.
            </p>
            <p>
              Choose HelloPeter if your business operates primarily in South Africa.
            </p>
            <p>
              Choose Google Reviews if your priority is search visibility and local SEO presence.
            </p>
          </div>
        </section>

        {/* 6. KEY DIFFERENCES SECTION */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white md:text-3xl">
            Key differences
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <p className="text-white font-medium mb-1">Pricing philosophy</p>
              <p className="text-sm text-neutral-400">
                Tellacity offers clear, fixed pricing starting at $69/month with no hidden tiers.
                Other platforms like Trustpilot and Feefo typically start at higher entry prices
                (around $299/month) with additional costs based on features and volume.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <p className="text-white font-medium mb-1">Control and ownership</p>
              <p className="text-sm text-neutral-400">
                Tellacity gives businesses full control over how reviews are collected, displayed,
                and branded. Other platforms may limit customization or require higher-tier plans
                for full control.
              </p>
            </div>

            <div className="rounded-xl border border-white/10 p-4 bg-white/[0.02]">
              <p className="text-white font-medium mb-1">Automation and scalability</p>
              <p className="text-sm text-neutral-400">
                Tellacity is built for automated review collection through integrations and
                invite systems. Some platforms rely more on manual processes or restrict
                automation features to enterprise plans.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-white mb-4">
            Frequently asked questions
          </h2>

          <div className="space-y-4 text-sm text-neutral-400">
            <div>
              <p className="text-white font-medium">
                Is Trustpilot free for businesses?
              </p>
              <p>
                Trustpilot offers a limited free plan, but most features require paid subscriptions
                starting at around $299/month.
              </p>
            </div>

            <div>
              <p className="text-white font-medium">
                Is Yelp really free?
              </p>
              <p>
                Yelp allows businesses to list for free, but many visibility and advertising
                features are paid.
              </p>
            </div>

            <div>
              <p className="text-white font-medium">
                What is the best review platform?
              </p>
              <p>
                The best platform depends on your needs. Tellacity focuses on control and automation,
                while others focus on visibility or regional markets.
              </p>
            </div>

            <div>
              <p className="text-white font-medium">
                Is Google Reviews enough for a business?
              </p>
              <p>
                Google Reviews is important for local SEO, but it lacks advanced tools like
                automation, analytics, and branding control.
              </p>
            </div>

            <div>
              <p className="text-white font-medium">
                What is the difference between Tellacity and Trustpilot?
              </p>
              <p>
                Tellacity focuses on transparency, automation, and affordability, while Trustpilot
                focuses on global brand visibility with higher pricing tiers.
              </p>
            </div>
          </div>
        </section>

        <p className="text-sm text-neutral-400 mt-10">
          <Link href="/compare/best-review-platforms" className="text-[#1FAF9E] hover:underline">
            View best review platforms →
          </Link>
        </p>

        {/* Final CTA — one only */}
        <section className="text-center pt-8">
          <p className="mx-auto max-w-xl text-neutral-400 mb-6">
            Start collecting and managing customer feedback.
          </p>
          <Link
            href="/business/signup"
            className="inline-block rounded-lg bg-[#1FAF9E] px-6 py-3 font-medium text-black hover:opacity-90"
          >
            Get started
          </Link>
        </section>
      </div>
    </div>
  );
}
