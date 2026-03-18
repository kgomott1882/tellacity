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
    },
    {
      feature: "Entry pricing:",
      tellacity: "$69/mo (clear, fixed tiers)",
      trustpilot: "From $299/mo",
      yelp: "From $150/mo",
      feefo: "£149–£299/mo",
      hellopeter: "From $42/mo",
    },
    {
      feature: "Invite control:",
      tellacity: "Full",
      trustpilot: "Limited",
      yelp: "None",
      feefo: "Controlled",
      hellopeter: "Limited",
    },
    {
      feature: "Custom branding:",
      tellacity: "✔",
      trustpilot: "Limited",
      yelp: "✖",
      feefo: "✔",
      hellopeter: "Limited",
    },
    {
      feature: "Widgets:",
      tellacity: "✔",
      trustpilot: "✔",
      yelp: "✔",
      feefo: "✔",
      hellopeter: "✔",
    },
    {
      feature: "Analytics:",
      tellacity: "✔",
      trustpilot: "✔",
      yelp: "Basic",
      feefo: "✔",
      hellopeter: "Basic",
    },
    {
      feature: "Platform reach:",
      tellacity: "Global",
      trustpilot: "Global",
      yelp: "Strong local (US)",
      feefo: "Global (enterprise-focused)",
      hellopeter: "Regional (South Africa)",
    },
    {
      feature: "SEO pages:",
      tellacity: "✔",
      trustpilot: "✔",
      yelp: "✔",
      feefo: "✔",
      hellopeter: "✔",
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
            See how Tellacity compares with Trustpilot, Yelp, Feefo and Hellopeter.
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
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
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
                    width={40}
                    height={40}
                    className="object-contain"
                  />
                  <span className="text-sm">{platform.name}</span>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold">
            Compare Tellacity vs Other Platforms
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Link
              href="/compare/tellacity-vs-trustpilot"
              className="rounded-xl border border-neutral-800 p-4 transition-colors hover:border-[#1FAF9E]"
            >
              Tellacity vs Trustpilot
            </Link>
            <Link
              href="/compare/tellacity-vs-yelp"
              className="rounded-xl border border-neutral-800 p-4 transition-colors hover:border-[#1FAF9E]"
            >
              Tellacity vs Yelp
            </Link>
            <Link
              href="/compare/tellacity-vs-feefo"
              className="rounded-xl border border-neutral-800 p-4 transition-colors hover:border-[#1FAF9E]"
            >
              Tellacity vs Feefo
            </Link>
            <Link
              href="/compare/tellacity-vs-hellopeter"
              className="rounded-xl border border-neutral-800 p-4 transition-colors hover:border-[#1FAF9E]"
            >
              Tellacity vs HelloPeter
            </Link>
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
                        width={36}
                        height={36}
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
                        width={36}
                        height={36}
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
                        width={36}
                        height={36}
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
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                      <span>{platformMeta.feefo.name}</span>
                    </div>
                  </th>
                  <th className="border-b border-neutral-800 px-4 py-3 text-left text-sm font-medium text-neutral-300">
                    <div className="flex items-center gap-2">
                      <Image
                        src={platformMeta.hellopeter.logo}
                        alt={platformMeta.hellopeter.name}
                        width={36}
                        height={36}
                        className="object-contain"
                      />
                      <span>{platformMeta.hellopeter.name}</span>
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
                    <td className="px-4 py-3 text-sm text-neutral-300">{row.hellopeter}</td>
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
          <div className="grid gap-6 md:grid-cols-2">
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
                      width={32}
                      height={32}
                      className="object-contain"
                    />
                    <p className="font-medium text-white">{platform.name}</p>
                  </div>
                  <p className="mt-1 text-neutral-400">{item.text}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* 6. KEY DIFFERENCES SECTION */}
        <section className="mb-16">
          <h2 className="mb-6 text-2xl font-semibold text-white md:text-3xl">
            Key differences
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-800 p-4">
              <p className="mb-3 font-medium text-white">Tellacity vs Trustpilot</p>
              <ul className="list-inside list-disc space-y-1 text-neutral-400">
                <li>Transparent pricing vs sales-based pricing</li>
                <li>Full invite control vs limited flexibility</li>
                <li>Modern system vs legacy platform</li>
              </ul>
            </div>
            <div className="rounded-xl border border-neutral-800 p-4">
              <p className="mb-3 font-medium text-white">Tellacity vs Yelp</p>
              <ul className="list-inside list-disc space-y-1 text-neutral-400">
                <li>Invite-based reviews vs ad-driven visibility</li>
                <li>Full control vs platform-controlled exposure</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 7. FINAL CTA */}
        <section className="text-center">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Looking for a modern review platform?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-neutral-400">
            Start collecting and managing customer feedback with Tellacity.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-[#1FAF9E] px-6 py-3 font-medium text-black hover:opacity-90"
          >
            Get Started
          </Link>
        </section>
      </div>
    </div>
  );
}
