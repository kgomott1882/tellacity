import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const PAGE_URL = "https://tellacity.com/investor-relations";

export const metadata: Metadata = {
  title: "Investor Relations | Tellacity",
  description:
    "Explore Tellacity's investor relations page for earnings updates, annual reports, investor decks, growth strategy, and the trust economy opportunity.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Investor Relations | Tellacity",
    description:
      "Explore Tellacity's investor relations page for earnings updates, annual reports, investor decks, growth strategy, and the trust economy opportunity.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Investor Relations | Tellacity",
    description:
      "Explore Tellacity's investor relations page for earnings updates, annual reports, investor decks, growth strategy, and the trust economy opportunity.",
  },
  robots: { index: true, follow: true },
};

const investorRelationsJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Investor Relations | Tellacity",
  description:
    "Explore Tellacity's investor relations page for earnings updates, annual reports, investor decks, growth strategy, and the trust economy opportunity.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://tellacity.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Investor Relations",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const highlights = [
  {
    title: "Proprietary Verification",
    description:
      "Proof-first review verification reduces manipulation and builds real trust at scale.",
  },
  {
    title: "Scalable SaaS Model",
    description:
      "Recurring revenue streams anchored by growth in verified business accounts.",
  },
  {
    title: "Transparent Trust Metrics",
    description:
      "A clear, auditable trust score system that improves confidence and adoption.",
  },
  {
    title: "Global Market Opportunity",
    description:
      "The trust economy spans every industry where reputation drives purchase.",
  },
];

const KEY_THEMES = [
  {
    title: "Verification-first SaaS model",
    detail:
      "Software built around verified feedback rather than unverified ratings alone.",
  },
  {
    title: "Transparent trust metrics",
    detail:
      "Auditable trust signals that support adoption by consumers and businesses.",
  },
  {
    title: "Multi-market expansion",
    detail:
      "Geographic growth as verified reputation becomes a global purchase factor.",
  },
  {
    title: "Recurring revenue from business accounts",
    detail:
      "Subscription plans tied to review volume, analytics, and reputation tools.",
  },
  {
    title: "Platform integrity and moderation moat",
    detail:
      "Verification, fraud detection, and fair moderation as durable differentiation.",
  },
];

const investmentReasons = [
  {
    title: "Defensible Technology",
    description:
      "Verification-first review infrastructure with expanding trust signals.",
    detail:
      "Proof-first verification and trust infrastructure are harder to replicate than generic review widgets, creating a product moat as signals and moderation mature.",
  },
  {
    title: "Efficient Growth",
    description:
      "Strong retention and organic acquisition powered by reputation flywheels.",
    detail:
      "As businesses collect verified reviews and display social proof, reputation flywheels can improve retention and lower customer acquisition cost over time.",
  },
  {
    title: "Resilient Fundamentals",
    description:
      "Trust remains essential across economic cycles and purchase categories.",
    detail:
      "Consumers continue to rely on credible feedback when choosing providers, trust infrastructure remains relevant through market cycles.",
  },
  {
    title: "Network Effects",
    description:
      "More verified reviews improve transparency and attract more businesses.",
    detail:
      "Each additional verified review strengthens platform utility for consumers researching businesses and for businesses benchmarking reputation.",
  },
  {
    title: "Global Footprint",
    description:
      "Multi-market expansion brings verified reviews to new regions and sectors.",
    detail:
      "Regional expansion opens new categories and geographies where reputation-driven purchase decisions are underserved by verified infrastructure.",
  },
  {
    title: "Brand Trust",
    description:
      "A credible, neutral platform that balances consumer and business needs.",
    detail:
      "Neutrality, transparency, and fair treatment support Tellacity's credibility with consumers, businesses, and partners evaluating long-term alignment.",
  },
];

const integrityMilestones = [
  {
    title: "Proof-first verification engine launched",
    detail:
      "Core infrastructure that ties reviews to verified customer interactions rather than anonymous submissions.",
  },
  {
    title: "AI fraud detection system deployed",
    detail:
      "Automated signals that flag suspicious patterns before they undermine platform trust.",
  },
  {
    title: "Regional expansion into new markets",
    detail:
      "Regional expansion into seven new markets, extending verified reputation tools to additional geographies.",
  },
  {
    title: "Enterprise partnerships with payment platforms",
    detail:
      "Partnerships that connect trust signals to commerce and payment workflows at scale.",
  },
];

const progressTimeline = [
  {
    label: "Proof-first verification engine launched",
    significance:
      "Established the technical foundation for verified reviews at scale.",
  },
  {
    label: "AI fraud detection system deployed",
    significance:
      "Added automated protection against manipulation and suspicious review behaviour.",
  },
  {
    label: "Regional expansion into seven new markets",
    significance:
      "Demonstrated multi-market execution and demand for trust infrastructure globally.",
  },
  {
    label: "Enterprise partnerships with payment platforms",
    significance:
      "Extended Tellacity's trust layer into enterprise and payments ecosystems.",
  },
];

export default function InvestorRelationsPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(investorRelationsJsonLd),
        }}
      />

      <section className="bg-[#0B3B36]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-white">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs">
              Q4 2025 Earnings Report Available
            </p>
            <h1 className="mt-5 text-4xl font-semibold sm:text-5xl">
              Powering the Trust Economy
            </h1>
            <p className="mt-4 text-sm text-white/80">
              We are redefining digital reputation through verified proof. Join
              us as we build the global standard for consumer transparency.
            </p>
            <p className="mt-3 text-sm text-white/80">
              This investor relations page combines market opportunity, product
              strategy, and transparency for analysts and prospective
              partners. Learn more about{" "}
              <Link
                href="/about"
                className="font-medium text-white underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                Tellacity
              </Link>{" "}
              and our{" "}
              <Link
                href="/reputation-platform"
                className="font-medium text-white underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                Reputation Platform
              </Link>
              .
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#financial-reports"
                className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-[#0B3B36]"
              >
                Download Investor Deck
              </a>
              <a
                href="#financial-reports"
                className="rounded-full border border-white/40 px-5 py-2 text-xs font-semibold text-white"
              >
                View Annual Report
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Investment Opportunity
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[#0E0E0E]">
            Investment Opportunity
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Tellacity is building infrastructure for verified trust in online
            reputation, not a surface-level ratings site, but software, moderation,
            and trust signals designed to scale with businesses and consumers.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            For investors, the opportunity sits at the intersection of SaaS
            recurring revenue, platform integrity, and a large addressable market
            where confidence in reviews directly affects economic outcomes.
          </p>
          <ul className="mt-6 max-w-3xl space-y-2 text-xs text-gray-600">
            {highlights.map((item) => (
              <li key={item.title} className="flex items-start gap-2">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#1FAF9E]" />
                <span>
                  <span className="font-semibold text-[#0E0E0E]">
                    {item.title}
                  </span>
                  : {item.description}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Key investment themes
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Tellacity combines software, trust infrastructure, and transparent
            moderation into a scalable platform model.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {KEY_THEMES.map((theme) => (
              <div
                key={theme.title}
                className="rounded-2xl border border-gray-200 bg-[#F7F8FA] p-5"
              >
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {theme.title}
                </p>
                <p className="mt-2 text-xs text-gray-600">{theme.detail}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 max-w-3xl text-sm text-gray-600">
            Business monetisation is outlined on our{" "}
            <Link href="/pricing" className={linkClass}>
              pricing
            </Link>{" "}
            and{" "}
            <Link href="/for-business" className={linkClass}>
              for-business
            </Link>{" "}
            pages; trust enforcement is detailed in{" "}
            <Link href="/safety-trust" className={linkClass}>
              Safety &amp; Trust
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                Bridging the Trust Gap
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                The digital economy suffers from a crisis of confidence. Fake
                reviews, AI-generated content, and paid endorsements cost the
                global economy over $4 trillion annually in lost value and fraud.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                That $4T trust gap reflects economic loss from decisions made on
                manipulated or unverified feedback, from wasted spend to fraud and
                reduced conversion for honest businesses.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                Tellacity addresses this gap with verification-first
                infrastructure: proof-linked reviews, transparent moderation, and
                tools businesses use to collect, respond to, and showcase credible
                feedback at scale.
              </p>
            </div>
            <div className="overflow-hidden rounded-3xl bg-white p-4 shadow-sm">
              <Image
                src="/brand/Random numbers.png"
                alt="Trust and growth metrics"
                width={600}
                height={256}
                className="h-64 w-full rounded-2xl object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Why Invest in Tellacity?
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Our platform is designed to build trust at scale while unlocking
            sustainable growth.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            The themes below summarise why verification infrastructure, network
            effects, and brand neutrality matter to long-term investors, not as
            marketing slogans, but as structural advantages in a trust-driven
            market.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {investmentReasons.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-gray-600">{item.description}</p>
                <p className="mt-2 text-xs text-gray-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Commitment to Integrity
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Our verification systems and transparent moderation policies are
            built to protect trust for consumers and businesses.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Transparent moderation and verification are core to Tellacity&apos;s
            business model, not optional product features. Trust is both the market
            need we address and the principle that governs how the platform
            operates.
          </p>
          <div className="mt-8 space-y-6">
            {integrityMilestones.map((item) => (
              <div key={item.title}>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Milestones &amp; Progress
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            These milestones are operational proof points showing execution
            across product, AI, expansion, and partnerships, not aspirations alone.
          </p>
          <ol className="mt-8 space-y-6 border-l-2 border-[#1FAF9E]/40 pl-6">
            {progressTimeline.map((item, index) => (
              <li key={item.label} className="relative">
                <span className="absolute -left-[1.65rem] top-1 flex h-3 w-3 rounded-full bg-[#1FAF9E]" />
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {index + 1}. {item.label}
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {item.significance}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section id="financial-reports" className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Financial Reports &amp; Decks
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Investors can review official materials here to support due diligence,
            including the latest earnings update, investor deck, and annual report.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            The Q4 2025 earnings report is now available alongside presentation
            materials summarising performance, strategy, and trust-economy
            positioning.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-full bg-[#0B3B36] px-5 py-2 text-xs font-semibold text-white"
            >
              Download Investor Deck
            </button>
            <button
              type="button"
              className="rounded-full border border-[#0B3B36] px-5 py-2 text-xs font-semibold text-[#0B3B36]"
            >
              View Annual Report
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Q4 2025 Earnings Report Available, request access via{" "}
            <Link href="/investor-relations/contact" className={linkClass}>
              investor relations contact
            </Link>{" "}
            if materials are not yet published to your region.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-10">
          <p className="max-w-3xl text-sm text-gray-600">
            Tellacity&apos;s investor story is closely tied to our{" "}
            <Link href="/reputation-platform" className={linkClass}>
              trust infrastructure
            </Link>{" "}
            and{" "}
            <Link href="/for-business" className={linkClass}>
              business platform
            </Link>
            . For general enquiries outside investor relations, see{" "}
            <Link href="/contact" className={linkClass}>
              contact
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-[#0B3B36]">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center text-white">
          <h2 className="text-2xl font-semibold">Get in Touch</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80">
            Contact our investor relations team to learn more about Tellacity&apos;s
            performance, roadmap, and growth strategy.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80">
            Our team can help with earnings materials, strategic updates,
            partnership discussions, and scheduling management or analyst
            conversations.
          </p>
          <Link
            href="/investor-relations/contact"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-white px-6 py-2 text-sm font-semibold text-[#0B3B36] transition-colors hover:bg-white/95"
          >
            Email Investor Relations
          </Link>
        </div>
      </section>
    </main>
  );
}
