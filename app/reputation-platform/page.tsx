import type { Metadata } from "next";
import Link from "next/link";

const PAGE_URL = "https://tellacity.com/reputation-platform";

export const metadata: Metadata = {
  title: "Reputation Management Platform | Tellacity",
  description:
    "Discover Tellacity's Reputation Management Platform for verified review invitations, widgets, analytics, reputation management, and photo uploads in one centralized system.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Reputation Management Platform | Tellacity",
    description:
      "Discover Tellacity's Reputation Management Platform for verified review invitations, widgets, analytics, reputation management, and photo uploads in one centralized system.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reputation Management Platform | Tellacity",
    description:
      "Discover Tellacity's Reputation Management Platform for verified review invitations, widgets, analytics, reputation management, and photo uploads in one centralized system.",
  },
  robots: { index: true, follow: true },
};

const ACCENT = "#1FAF9E";
const ACCENT_BG = "#FBBF24";

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

type PlatformCard = {
  badge: string;
  title: string;
  tagline: string;
  description: string;
  detail: string;
  href: string;
  image?: string;
  imageAlt?: string;
};

const PLATFORM_CARDS: PlatformCard[] = [
  {
    badge: "✉",
    title: "Review Invitations",
    tagline: "Collect verified reviews from every customer interaction.",
    description:
      "Send branded, automated review invitations after every purchase, appointment, or completed service, with reminders, proof-of-purchase, and per-channel attribution built in.",
    detail:
      "Branded, automated invites after purchase or service completion help you collect feedback consistently, not only when customers remember to leave a review on their own.",
    href: "/solutions/review-invitations",
  },
  {
    badge: "⭐",
    title: "Review Widgets",
    tagline: "Show real trust on every page of your site.",
    description:
      "Embed live, verified review widgets on product, pricing, checkout, and marketing pages, all reading from one centralised feed and updating automatically.",
    detail:
      "Live, verified widgets on product and marketing pages show the same proof customers see on your Tellacity profile, without copying static testimonials by hand.",
    href: "/solutions/review-widgets",
  },
  {
    badge: "📊",
    title: "Business Analytics",
    tagline: "See exactly what's driving your trust score.",
    description:
      "Track verified review trends, sentiment, response performance, and multi-location reputation from one centralised analytics dashboard.",
    detail:
      "Trends, sentiment, response performance, and multi-location views help teams understand what is improving trust, and what needs attention.",
    href: "/solutions/business-analytics",
  },
  {
    badge: "🛡",
    title: "Reputation Management",
    tagline: "Own your brand across every customer touchpoint.",
    description:
      "Reply, moderate, dispute, and protect your verified profile from one operational dashboard, with audit logs and fraud detection built in.",
    detail:
      "Reply publicly, moderate content, dispute inaccurate feedback, and protect your verified profile from one operational dashboard, not scattered inboxes.",
    href: "/solutions/reputation-management",
  },
  {
    badge: "📷",
    title: "Photo Uploads",
    tagline: "Real photos, real feedback, real proof.",
    description:
      "Capture verified, moderated customer photos with product attribution, threaded follow-ups, and ImageObject schema for richer search snippets.",
    detail:
      "Moderated customer photos with product attribution add visual proof to reviews and support richer, structured presentation where policies allow.",
    href: "/solutions/photo-uploads",
  },
  {
    badge: "🏆",
    title: "Your Reputation",
    tagline: "One verified profile customers can trust.",
    description:
      "Your Tellacity profile brings verified reviews, responses, photos, and trust signals into one public home customers can find, share, and cite.",
    detail:
      "Instead of scattered proof across sites and screenshots, your reputation lives in one place that stays current as new feedback comes in.",
    href: "/for-business",
    image: "/brand/Your%20Reputation.png",
    imageAlt: "Your Tellacity reputation profile with verified reviews and trust signals",
  },
];

const KEY_BENEFITS = [
  {
    title: "One source of truth for trust",
    detail:
      "Reviews, replies, photos, and analytics draw from the same verified pipeline instead of conflicting spreadsheets and tools.",
  },
  {
    title: "Verified reviews instead of fragmented signals",
    detail:
      "Collect and display feedback tied to real customer interactions, not disconnected ratings copied from elsewhere.",
  },
  {
    title: "Analytics, widgets, and moderation in one workflow",
    detail:
      "Invite customers, respond publicly, embed proof, and measure performance without switching systems.",
  },
  {
    title: "Better visibility for customers, search engines, and AI systems",
    detail:
      "Structured, consistent proof on your profile and site is easier to understand, cite, and defend over time.",
  },
  {
    title: "A reputation system designed for long-term growth",
    detail:
      "Trust compounds as verified feedback, responses, and insights accumulate, not as one-off campaign assets.",
  },
];

const WORKFLOW_STEPS = [
  {
    title: "Invite customers",
    detail:
      "Send branded review invitations after purchases, appointments, or completed services through email, SMS, or QR workflows.",
  },
  {
    title: "Collect verified feedback",
    detail:
      "Customers submit reviews through Tellacity's verified review path; proof and moderation standards apply before content is published.",
  },
  {
    title: "Moderate and manage responses",
    detail:
      "Your team replies, flags issues, and resolves disputes from one dashboard aligned with our trust policies.",
  },
  {
    title: "Publish widgets and photos",
    detail:
      "Verified reviews and moderated photos appear on your profile, widgets, and marketing touchpoints from the same feed.",
  },
  {
    title: "Track analytics and improve",
    detail:
      "Analytics show trends, sentiment, and response performance so you can act on feedback, not just collect it.",
  },
];

type TeamUseCase = {
  icon: string;
  team: string;
  benefit: string;
  body: string;
  links: { label: string; href: string }[];
};

const TEAM_USE_CASES: TeamUseCase[] = [
  {
    icon: "📣",
    team: "Marketing teams",
    benefit: "Main benefit: social proof and conversion at decision points.",
    body: "Surface verified customer trust where buyers actually make decisions, then turn authentic photo reviews into social proof across campaigns, widgets, and product pages.",
    links: [
      { label: "Review Widgets", href: "/solutions/review-widgets" },
      { label: "Photo Uploads", href: "/solutions/photo-uploads" },
    ],
  },
  {
    icon: "🛠",
    team: "Support teams",
    benefit: "Main benefit: faster issue resolution with full review context.",
    body: "Respond faster with one centralised queue for replies, flags, and disputes, while live analytics surface the issues hurting customer trust before they spread.",
    links: [
      {
        label: "Reputation Management",
        href: "/solutions/reputation-management",
      },
      { label: "Business Analytics", href: "/solutions/business-analytics" },
    ],
  },
  {
    icon: "🏢",
    team: "Operations teams",
    benefit: "Main benefit: multi-location consistency from one system.",
    body: "Compare locations, branches, and service regions side by side, then enforce consistent reputation workflows from one operational system.",
    links: [
      { label: "Business Analytics", href: "/solutions/business-analytics" },
      {
        label: "Reputation Management",
        href: "/solutions/reputation-management",
      },
    ],
  },
  {
    icon: "🎯",
    team: "Leadership teams",
    benefit: "Main benefit: visibility into trust performance across the org.",
    body: "Track verified trust score health, dispute outcomes, and response performance across the organisation from one centralised, export-ready dashboard.",
    links: [
      { label: "Business Analytics", href: "/solutions/business-analytics" },
      {
        label: "Reputation Management",
        href: "/solutions/reputation-management",
      },
    ],
  },
  {
    icon: "🧪",
    team: "Product teams",
    benefit: "Main benefit: spot recurring issues and quantify impact.",
    body: "Spot recurring product issues earlier with visual customer feedback, then quantify the impact with product-level analytics tied to verified reviews.",
    links: [
      { label: "Photo Uploads", href: "/solutions/photo-uploads" },
      { label: "Business Analytics", href: "/solutions/business-analytics" },
    ],
  },
];

type PlatformFaq = { question: string; answer: string };

const PLATFORM_FAQS: PlatformFaq[] = [
  {
    question: "What is the Tellacity Reputation Management Platform?",
    answer:
      "The Tellacity Reputation Management Platform is one centralised system for building verified customer trust. It connects review invitations, review widgets, business analytics, reputation management, and photo uploads, so every part of your customer feedback workflow runs from the same verified review infrastructure. That connected design is what makes trust signals more defensible and easier to manage over time.",
  },
  {
    question: "Can I use only one part of the platform?",
    answer:
      "Yes. Every solution works on its own, many businesses start with Review Invitations or Reputation Management and add modules later. Because everything shares the same platform, turning on widgets, analytics, or photo uploads never means migrating data or reconciling conflicting sources.",
  },
  {
    question: "How quickly does the platform integrate with my site?",
    answer:
      "Most businesses are live in under a day: claim your verified Tellacity profile, send your first review invitations, and add a widget snippet to your site. Integration is designed to be fast and practical depending on your setup, there is no build step, no framework lock-in, and no separate logins between modules.",
  },
  {
    question: "Are all reviews and photos verified?",
    answer:
      "Tellacity is built around verified customer feedback. Reviews are tied to authenticated customer accounts, with optional proof-of-purchase, and photos pass through EXIF-stripping plus automated moderation before they go live. Verification status depends on the review and photo path, content must meet policy checks before it appears publicly, and every action is logged in an audit trail.",
  },
  {
    question: "How does the platform improve SEO and trust signals?",
    answer:
      "The platform keeps structured, current, and consistent proof on your profile, widgets, and review pages, including schema such as Review, AggregateRating, and ImageObject where applicable. That helps customers, search engines, and AI systems see the same citable trust signals instead of stale or fragmented copies. Results depend on your content and implementation, but one consistent source is easier to trust and defend.",
  },
];

const reputationPlatformJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Reputation Management Platform | Tellacity",
  description:
    "Discover Tellacity's Reputation Management Platform for verified review invitations, widgets, analytics, reputation management, and photo uploads in one centralized system.",
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
        name: "Reputation Management Platform",
        item: PAGE_URL,
      },
    ],
  },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PLATFORM_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

const RELATED_PAGES = [
  { href: "/for-business", label: "Tellacity for Business" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help-center", label: "Help Center" },
  { href: "/faq", label: "FAQ" },
  { href: "/safety-trust", label: "Safety & Trust" },
  { href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
  { href: "/how-tellacity-works", label: "How Tellacity Works" },
  { href: "/resources", label: "Resources" },
];

export default function ReputationPlatformHubPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reputationPlatformJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="w-full bg-[#1a1a1a]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
              The Tellacity Reputation Management Platform
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Build Verified Customer Trust
            </h1>
            <p className="mt-4 text-base leading-relaxed text-gray-300">
              The Tellacity Reputation Management Platform connects review
              invitations, widgets, analytics, reputation management, and photo
              uploads in one verified system. Every module reads from the same
              verified review pipeline, so customers, search engines, and AI
              systems see one consistent trust signal across every touchpoint.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-300">
              Explore{" "}
              <Link
                href="/for-business"
                className="font-medium text-white underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                Tellacity for Business
              </Link>
              , compare{" "}
              <Link
                href="/pricing"
                className="font-medium text-white underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                pricing
              </Link>
              , or read{" "}
              <Link
                href="/how-tellacity-works"
                className="font-medium text-white underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                how Tellacity works
              </Link>
              .
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/business/signup"
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_rgba(251,191,36,0)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
                style={{ backgroundColor: ACCENT_BG }}
              >
                Start free
              </Link>
              <Link
                href="/suggest-business"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
              >
                Claim your business
              </Link>
              <Link
                href="/business/dashboard"
                className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
              >
                Open dashboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
                The problem
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700">
                <p>
                  Most businesses collect customer feedback in five or six different
                  places. Reviews live on a third-party site, photos sit in support
                  tickets, analytics live in a spreadsheet, replies go out from a
                  personal inbox, and disputes are tracked nowhere at all.
                </p>
                <p>
                  When verified customer trust is split across tools, teams stop
                  trusting their own numbers. Leadership reads one trust score,
                  support reads another, and marketing publishes static testimonials
                  that go stale the moment a new review comes in.
                </p>
                <p>
                  Scattered reviews, photos, analytics, and disputes make reputation
                  harder to manage, and harder for customers to trust what they see
                  on each channel.
                </p>
                <p>
                  Search engines and LLMs see the same fragmentation. Without one
                  centralised, verified, structured source of customer feedback,
                  your reputation is harder to cite, harder to verify, and harder to
                  defend.
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href="/solutions/review-invitations"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_rgba(251,191,36,0)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
                  style={{ backgroundColor: ACCENT_BG }}
                >
                  Start collecting verified reviews
                </Link>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/Customer%20Feedback.png"
              alt="Customer feedback scattered across disconnected tools and channels"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="w-full border-t border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Tellacity_reputation_system.jpeg"
                  alt="Tellacity reputation management system connecting reviews, widgets, and analytics"
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/reputation_system.jpeg"
                  alt="Unified reputation system for collecting and managing verified customer feedback"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
                Why businesses choose Tellacity
              </h2>
              <p className="mt-4 text-base leading-relaxed text-gray-600">
                Businesses choose Tellacity when they want one reputation system, not
                a patchwork of widgets, spreadsheets, and disconnected review sites.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                {KEY_BENEFITS.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-2xl border border-gray-200 bg-white p-5"
                  >
                    <p className="text-sm font-semibold text-[#0E0E0E]">
                      {item.title}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                  </div>
                ))}
                <div
                  className="min-h-[8.5rem] rounded-2xl bg-[#1FAF9E]"
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
                How the platform works
              </h2>
              <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700">
                <p>
                  Tellacity uses one verified review pipeline and one dashboard so
                  every module shares the same source of truth. Reviews collected
                  through invitations feed the widgets on your site; those same
                  reviews power analytics leadership tracks.
                </p>
                <p>
                  Replies, disputes, and photo uploads run through the same
                  operational system, with moderation and audit trails aligned to our{" "}
                  <Link href="/safety-trust" className={linkClass}>
                    Safety &amp; Trust
                  </Link>{" "}
                  framework.
                </p>
                <p>
                  Each module works on its own, but together they turn customer
                  feedback into a measurable, defensible, citable trust signal that
                  is easier to explain to buyers, support teams, and partners.
                </p>
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/trust%20investor.png"
              alt="Tellacity unified platform connecting verified reviews, trust signals, and business reputation"
              className="h-auto w-full object-contain"
            />
          </div>
        </div>
      </section>

      <section className="w-full border-t border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              Platform modules
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Six modules, one verified review infrastructure, one centralised
              dashboard. Explore each module in depth on its solution page.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {PLATFORM_CARDS.map((card) => (
              <Link
                key={card.href}
                href={card.href}
                className="group flex flex-col rounded-3xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#1FAF9E]/40 hover:shadow-[0_22px_60px_rgba(31,175,158,0.18)]"
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-base font-semibold"
                  style={{ backgroundColor: "#E5F4F2", color: "#0F766E" }}
                  aria-hidden
                >
                  {card.badge}
                </div>
                <h3 className="mt-4 text-base font-semibold text-[#0E0E0E]">
                  {card.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-[#0F766E]">
                  {card.tagline}
                </p>
                {card.image ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.image}
                      alt={card.imageAlt ?? card.title}
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : null}
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {card.description}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {card.detail}
                </p>
                <span
                  className="mt-6 inline-flex items-center text-xs font-semibold"
                  style={{ color: ACCENT }}
                >
                  Learn more →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              Use cases by team
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Every team uses the Tellacity Reputation Management Platform differently, but
              they all work from the same verified customer data, not duplicate
              exports or conflicting scores.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              That shared foundation is what keeps marketing, support,
              operations, leadership, and product aligned on trust.
            </p>
          </div>

          <ul className="mt-12 grid gap-4 sm:grid-cols-2">
            {TEAM_USE_CASES.map((team) => (
              <li
                key={team.team}
                className="flex flex-col rounded-3xl border border-gray-200 bg-white p-6"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-base"
                    style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}
                    aria-hidden
                  >
                    {team.icon}
                  </span>
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    {team.team}
                  </h3>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-700">
                  {team.benefit}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {team.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {team.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-[#1FAF9E]/40 hover:text-[#0F766E]"
                    >
                      {link.label} →
                    </Link>
                  ))}
                </div>
              </li>
            ))}
            <li
              className="min-h-[12rem] rounded-3xl bg-[#1FAF9E] sm:min-h-0"
              aria-hidden
            />
          </ul>
        </div>
      </section>

      <section className="w-full border-t border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            How the workflow fits together
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-600">
            This is one system, not separate tools stitched together. The steps
            below show how modules connect from invitation through improvement.
          </p>
          <ol className="mt-8 space-y-6">
            {WORKFLOW_STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600">
                    {step.detail}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
          <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            Why this matters for trust and search
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              Structured, verified, up-to-date reputation data helps users,
              search engines, and AI systems understand your business with less
              guesswork. When proof is consistent across your profile, widgets,
              and review pages, it is easier to trust and cite.
            </p>
            <p>
              Tellacity emits structured data, such as Review, AggregateRating,
              ImageObject, and related schema where applicable, so public proof
              stays aligned with what customers actually experience.
            </p>
            <p>
              We do not promise specific ranking outcomes; results depend on your
              content, market, and implementation. One consistent source is
              still easier to defend than scattered screenshots and stale
              testimonials.
            </p>
            <p>
              Read our{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                reviewer guidelines
              </Link>{" "}
              and{" "}
              <Link href="/faq" className={linkClass}>
                FAQ
              </Link>{" "}
              for how verification and moderation work in practice.
            </p>
          </div>
        </div>
      </section>

      <section className="w-full border-t border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              Common questions
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Short answers to the most common questions about how the Tellacity
              Reputation Management Platform fits together.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {PLATFORM_FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-colors open:border-[#1FAF9E]/40 open:bg-[#F5FAF9]"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left">
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    {faq.question}
                  </h3>
                  <span
                    aria-hidden
                    className="mt-1 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-gray-200 text-sm text-gray-500 transition-transform duration-200 group-open:rotate-45 group-open:border-[#1FAF9E] group-open:text-[#1FAF9E]"
                  >
                    +
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-gray-700">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-gray-600">
            See how the platform fits together in our{" "}
            <Link href="/how-tellacity-works" className={linkClass}>
              How Tellacity works
            </Link>{" "}
            guide, learn more in our{" "}
            <Link href="/resources" className={linkClass}>
              Resources
            </Link>{" "}
            hub, or visit the{" "}
            <Link href="/help-center" className={linkClass}>
              Help Center
            </Link>{" "}
            for setup support.
          </p>
        </div>
      </section>

      <section className="w-full bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12">
          <div className="rounded-2xl border border-gray-200 bg-[#F7F8FA] p-8">
            <p className="max-w-3xl text-sm text-gray-600">
              Tellacity&apos;s Reputation Management Platform sits at the center of our
              business, trust, and support ecosystem. Explore{" "}
              <Link href="/for-business" className={linkClass}>
                Tellacity for Business
              </Link>
              ,{" "}
              <Link href="/pricing" className={linkClass}>
                pricing
              </Link>
              ,{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust
              </Link>
              , and{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>{" "}
              to go deeper.
            </p>
            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {RELATED_PAGES.map((page) => (
                <li key={page.href}>
                  <Link href={page.href} className={linkClass}>
                    {page.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#0E0E0E] text-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center md:py-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Start building your reputation platform
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-300">
            Claim your verified Tellacity profile, invite your first customers,
            and put every part of your customer reputation on one centralised
            platform.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-relaxed text-gray-300">
            Start free, centralize invitations and responses in one dashboard,
            and add widgets and analytics as your reputation program grows.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_rgba(251,191,36,0)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
              style={{ backgroundColor: ACCENT_BG }}
            >
              Start free
            </Link>
            <Link
              href="/suggest-business"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Claim your business
            </Link>
            <Link
              href="/business/dashboard"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              Open dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
