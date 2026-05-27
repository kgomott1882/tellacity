import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

const PAGE_URL = "https://tellacity.com/safety-trust";

export const metadata: Metadata = {
  title: "Safety & Trust | Tellacity",
  description:
    "Learn how Tellacity verifies reviews, moderates content, safeguards trust, and enforces fair rules for consumers and businesses.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Safety & Trust | Tellacity",
    description:
      "Learn how Tellacity verifies reviews, moderates content, safeguards trust, and enforces fair rules for consumers and businesses.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Safety & Trust | Tellacity",
    description:
      "Learn how Tellacity verifies reviews, moderates content, safeguards trust, and enforces fair rules for consumers and businesses.",
  },
  robots: { index: true, follow: true },
};

const safetyTrustJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Safety & Trust | Tellacity",
  description:
    "Learn how Tellacity verifies reviews, moderates content, safeguards trust, and enforces fair rules for consumers and businesses.",
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
        name: "Safety & Trust",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const PRINCIPLES = [
  {
    title: "Neutral",
    text: "Balancing the rights of consumers and businesses alike.",
    explain:
      "Tellacity applies the same standards to consumers and businesses so neither side gets an unfair advantage.",
  },
  {
    title: "Open",
    text: "Everyone can share genuine experiences and respond.",
    explain:
      "Genuine experiences and professional responses are welcome when they follow platform rules.",
  },
  {
    title: "Fair",
    text: "Rules apply equally to all. No paid priority, no bias.",
    explain:
      "Ratings, visibility, and moderation are not sold to the highest bidder.",
  },
  {
    title: "Transparent",
    text: "We communicate clearly about what we do and why.",
    explain:
      "Tellacity explains verification, moderation, and enforcement in public policies.",
  },
  {
    title: "Relevant",
    text: "We stay useful, accurate, and trustworthy as tech evolves.",
    explain:
      "Added in 2025, this principle keeps the system current as review fraud and AI change.",
  },
] as const;

const JOURNEY_STEPS = [
  {
    step: "1",
    title: "Account Verification",
    text: "The reviewer creates a verified Tellacity account, agreeing to clear community terms.",
    explain:
      "Account verification links feedback to a real user and our community standards.",
  },
  {
    step: "2",
    title: "Review Submission",
    text: "The consumer submits a review after a genuine experience (organic or invited).",
    explain:
      "Reviews should follow a real transaction or interaction, not promotional campaigns.",
  },
  {
    step: "3",
    title: "AI & Manual Assessment",
    text: "Our detection models screen millions of data points for anomalies.",
    explain:
      "Automated checks flag suspicious patterns; human reviewers handle edge cases.",
  },
  {
    step: "4",
    title: "Publication",
    text: "If cleared, the review goes live and becomes visible to the public.",
    explain:
      "Published reviews include verification signals so readers can weigh evidence.",
  },
  {
    step: "5",
    title: "Safeguarding",
    text: "Continuous monitoring identifies and removes fake or misleading content.",
    explain:
      "Ongoing monitoring keeps the record accurate after publication.",
  },
] as const;

const ENFORCEMENT_ACTIONS = [
  {
    title: "Warnings Issued",
    value: "21,000 (↑ 6%)",
    desc: "Educational alerts for first-time misuse",
    explain:
      "Early-stage alerts when behaviour approaches policy lines without immediate removal.",
  },
  {
    title: "Formal Notices",
    value: "6,000 (↑ 12%)",
    desc: "Cease and desist to repeat offenders",
    explain:
      "Documented notices to repeat or serious offenders requiring corrective action.",
  },
  {
    title: "Public Warnings",
    value: "10,000 (↑ 20%)",
    desc: "Red banners for serious breaches",
    explain:
      "Visible warnings on profiles when misuse threatens platform integrity.",
  },
  {
    title: "Consumer Alerts",
    value: "7,000 (↓ 30%)",
    desc: "Blue banners for risky industries",
    explain:
      "Consumer-facing alerts when patterns suggest elevated risk in a sector.",
  },
  {
    title: "Business Removals",
    value: "3,800 (↓ 18%)",
    desc: "Bad-fit or fraudulent businesses delisted",
    explain:
      "Delisting when a business is fraudulent, repeatedly abusive, or not a fit for Tellacity.",
  },
] as const;

export default function SafetyTrustPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(safetyTrustJsonLd) }}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Trust &amp; Verification Framework
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
            Building verified trust between consumers and businesses means
            combining transparent review rules, business verification, AI-backed
            moderation, and human oversight.
          </p>
          <div className="relative mx-auto mt-8 aspect-[16/9] w-full max-w-4xl overflow-hidden rounded-3xl bg-gray-100">
            <Image
              src="/brand/what%20trust.jpg"
              alt="What verified trust means at Tellacity"
              fill
              sizes="(max-width: 768px) 100vw, 896px"
              className="object-cover object-center"
            />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
            What &quot;Verified&quot; Means
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600 sm:text-base">
            Verified trust links reviews and businesses to real-world signals, not
            just star ratings. Consumers get more reliable feedback; businesses
            get a fairer reputation system grounded in evidence and response.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Building Verified Trust Between Consumers and Businesses. Our
            mission is to build verified connections through transparent
            reviews, verified ownership, and AI-backed moderation. See{" "}
            <Link href="/how-tellacity-works" className={linkClass}>
              How Tellacity Works
            </Link>{" "}
            and our{" "}
            <Link href="/reviewer-guidelines" className={linkClass}>
              Reviewer Guidelines
            </Link>
            .
          </p>
          <div className="mt-6 grid gap-3 text-sm text-gray-700 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#1FAF9E]" />
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Consumers</h3>
                <p className="mt-1 text-gray-600">
                  Make confident decisions through real reviews from verified
                  customers.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
              <span className="mt-1 h-2 w-2 rounded-full bg-[#1FAF9E]" />
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Businesses</h3>
                <p className="mt-1 text-gray-600">
                  Earn credibility by responding, improving, and growing
                  through authentic engagement.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
                Our Vision: Tellacity Everywhere
              </h2>
              <p className="mt-3 text-sm text-gray-600 sm:text-base">
                Tellacity aims to be a universal trust signal across markets and
                categories so verified feedback helps people make more confident
                decisions anywhere they shop, book, or compare providers.
              </p>
              <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
                Universal symbol of trust
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                To be the universal symbol of trust. We help people connect to
                verified feedback and authentic business profiles across regions
                and categories.
              </p>
              <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
                Confident decisions
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Verified reviews and claimed business profiles give consumers
                clearer signals before they commit time, money, or trust to a
                provider.
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gray-100">
              <Image
                src="/brand/world.jpg"
                alt="Tellacity everywhere - global trust"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
            Our Verification Principles
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            These principles guide every verification and moderation decision.
            In 2025, Tellacity added &quot;Relevance,&quot; reaffirming our
            commitment to continuous improvement as review fraud and technology
            evolve.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {PRINCIPLES.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F5F3] text-xs font-semibold text-[#0E3B36]">
                  ✓
                </div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-gray-600">{item.text}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  {item.explain}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
            The Journey of a Verified Review
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            A five-step process ensures every review on Tellacity earns its
            place. The flow balances openness for honest reviewers with
            integrity checks that protect consumers and businesses.
          </p>
          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
            <div className="space-y-4 text-left">
              {JOURNEY_STEPS.map((item) => (
                <div
                  key={item.step}
                  className="flex items-start gap-4 rounded-xl border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0E3B36] text-xs font-semibold text-white">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-[#0E0E0E]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">{item.text}</p>
                    <p className="mt-1 text-xs leading-relaxed text-gray-500">
                      {item.explain}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gray-100">
              <Image
                src="/brand/analysis%20trust.jpg"
                alt="Analysis and trust in the verified review journey"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-12">
          <div className="rounded-2xl border border-[#A7E6C8] bg-[#F0FFF7] p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
              Verified Businesses
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-gray-600">
              A Verified Business badge means a company has claimed its profile,
              verified ownership, and agreed to our code of integrity. Claimed
              ownership matters because it connects public feedback to an
              accountable operator.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Verified Business badge
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Public &quot;Verified Business&quot; badge on the profile.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Access to analytics &amp; response tools
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Dashboards and reply tools help businesses engage responsibly
                  with feedback.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Eligibility for Verified Review filters
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Consumers can filter for verified customer experiences when
                  comparing options.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Higher visibility in consumer searches
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Verified profiles can surface more prominently when they meet
                  quality and compliance signals.
                </p>
              </div>
            </div>
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-white">
              <Image
                src="/brand/anly%20white%20board.jpg"
                alt="Verified Businesses - analytics and tools"
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 lg:p-8">
            <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
              Safeguarding Trust
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-gray-600">
              AI moderation, human oversight, and community reports work
              together as layered protection against fake reviews, spam, and
              manipulation.
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  AI Moderation
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Models screen millions of data points to catch anomalies at
                  scale before they reach readers.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Human Oversight
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Trained reviewers handle disputes, edge cases, and appeals
                  that automation alone cannot resolve fairly.
                </p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  Community Vigilance
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Users and businesses can flag content that violates{" "}
                  <Link href="/reviewer-guidelines" className={linkClass}>
                    community guidelines
                  </Link>
                  .
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-600">
              The figures below summarise platform-wide moderation outcomes:
              how much suspicious content is caught automatically, how much
              receives human review, and how consistently verification rules
              are applied.
            </p>
            <div className="mt-4 space-y-3 text-xs text-gray-700">
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span>1.2 million</span>
                <span className="text-gray-500">fake reviews removed</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span>91%</span>
                <span className="text-gray-500">
                  removed automatically via AI
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span>9%</span>
                <span className="text-gray-500">manually investigated</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2">
                <span>98%</span>
                <span className="text-gray-500">verification compliance</span>
              </div>
            </div>
            <div className="relative mt-6 aspect-[16/9] w-full overflow-hidden rounded-xl bg-gray-100">
              <Image
                src="/brand/safe%20gurad.jpg"
                alt="Safeguarding trust - AI moderation and human oversight"
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 py-12 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
            Taking Action
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            When misuse occurs, Tellacity acts decisively. Enforcement scales
            with severity, from educational warnings to public alerts and
            removal. We also pursue legal action against those who manipulate
            reviews.
          </p>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
            The counts below are enforcement outcomes over time. They show how
            often we intervene to protect trust, not to suppress legitimate
            negative feedback.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ENFORCEMENT_ACTIONS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[#0E3B36]">
                  {item.title}
                </h3>
                <p className="mt-2 text-lg font-semibold text-[#0E0E0E]">
                  {item.value}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.desc}</p>
                <p className="mt-2 text-xs leading-relaxed text-gray-500">
                  {item.explain}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-6xl px-6 py-12">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
                The Future of Verified Trust
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                As AI reshapes how people engage with online content, Tellacity
                is defining what verified authenticity looks like. Our 2026
                commitments are product and integrity goals tied to transparency
                and scale.
              </p>
              <h3 className="mt-6 text-base font-semibold text-[#0E0E0E]">
                2026 commitments
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                These targets guide investment in verification, detection
                accuracy, and public reporting, not marketing claims divorced
                from moderation reality.
              </p>
              <h3 className="mt-6 text-sm font-semibold text-[#0E0E0E]">
                Verified businesses target
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Expand verified businesses to 500,000+
              </p>
              <h3 className="mt-4 text-sm font-semibold text-[#0E0E0E]">
                AI accuracy target
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Achieve 95% AI accuracy in detection
              </p>
              <h3 className="mt-4 text-sm font-semibold text-[#0E0E0E]">
                Regional Trust Dashboards
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Launch regional Trust Dashboards for transparency
              </p>
            </div>
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-gray-100">
              <Image
                src="/brand/Green%20world.png"
                alt="The future of verified trust - global impact"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-center"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16">
          <h2 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
            Related trust pages
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Explore the policies and guides that explain how Tellacity keeps the
            platform fair, transparent, and trustworthy.
          </p>
          <ul className="mt-6 grid gap-2 text-sm text-gray-700 sm:grid-cols-2">
            <li>
              <Link href="/reviewer-guidelines" className={linkClass}>
                Reviewer Guidelines
              </Link>
            </li>
            <li>
              <Link href="/how-tellacity-works" className={linkClass}>
                How Tellacity Works
              </Link>
            </li>
            <li>
              <Link href="/faq" className={linkClass}>
                FAQ
              </Link>
            </li>
            <li>
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/reputation-platform" className={linkClass}>
                Reputation Platform
              </Link>
            </li>
            <li>
              <Link href="/terms-of-service" className={linkClass}>
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className={linkClass}>
                Privacy Policy
              </Link>
            </li>
            <li>
              <Link href="/contact" className={linkClass}>
                Contact
              </Link>
            </li>
          </ul>
          <p className="mt-6 max-w-3xl text-sm text-gray-600">
            This framework sits at the heart of Tellacity&apos;s{" "}
            <Link href="/reputation-platform" className={linkClass}>
              trust and reputation platform
            </Link>
            .
          </p>
          <p className="mt-4 max-w-3xl text-sm text-gray-600">
            Tellacity&apos;s verification system works together with our{" "}
            <Link href="/reviewer-guidelines" className={linkClass}>
              reviewer
            </Link>{" "}
            and{" "}
            <Link href="/terms-of-service" className={linkClass}>
              moderation
            </Link>{" "}
            policies.
          </p>
        </div>
      </section>
    </main>
  );
}
