import Link from "next/link";

export const metadata = {
  title:
    "Verifiable Reputation Platform for Trust, Reviews, and Analytics | Tellacity",
  description:
    "The Tellacity Reputation Platform connects review invitations, widgets, analytics, reputation management, and photo uploads into one system for verified customer trust.",
  alternates: {
    canonical: "https://tellacity.com/reputation-platform",
  },
  openGraph: {
    title:
      "Verifiable Reputation Platform for Trust, Reviews, and Analytics | Tellacity",
    description:
      "The Tellacity Reputation Platform connects review invitations, widgets, analytics, reputation management, and photo uploads into one system for verified customer trust.",
    url: "https://tellacity.com/reputation-platform",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Verifiable Reputation Platform for Trust, Reviews, and Analytics | Tellacity",
    description:
      "Review invitations, widgets, analytics, reputation management, and photo uploads on one verified reputation platform.",
  },
  robots: { index: true, follow: true },
};

const ACCENT = "#1FAF9E";
const ACCENT_BG = "#FBBF24";

type PlatformCard = {
  badge: string;
  title: string;
  tagline: string;
  description: string;
  href: string;
};

const PLATFORM_CARDS: PlatformCard[] = [
  {
    badge: "✉",
    title: "Review Invitations",
    tagline: "Collect verified reviews from every customer interaction.",
    description:
      "Send branded, automated review invitations after every purchase, appointment, or completed service, with reminders, proof-of-purchase, and per-channel attribution built in.",
    href: "/solutions/review-invitations",
  },
  {
    badge: "⭐",
    title: "Review Widgets",
    tagline: "Show real trust on every page of your site.",
    description:
      "Embed live, verified review widgets on product, pricing, checkout, and marketing pages, all reading from one centralised feed and updating automatically.",
    href: "/solutions/review-widgets",
  },
  {
    badge: "📊",
    title: "Business Analytics",
    tagline: "See exactly what's driving your trust score.",
    description:
      "Track verified review trends, sentiment, response performance, and multi-location reputation from one centralised analytics dashboard.",
    href: "/solutions/business-analytics",
  },
  {
    badge: "🛡",
    title: "Reputation Management",
    tagline: "Own your brand across every customer touchpoint.",
    description:
      "Reply, moderate, dispute, and protect your verified profile from one operational dashboard, with audit logs and fraud detection built in.",
    href: "/solutions/reputation-management",
  },
  {
    badge: "📷",
    title: "Photo Uploads",
    tagline: "Real photos, real feedback, real proof.",
    description:
      "Capture verified, moderated customer photos with product attribution, threaded follow-ups, and ImageObject schema for richer search snippets.",
    href: "/solutions/photo-uploads",
  },
];

type TeamUseCase = {
  icon: string;
  team: string;
  body: string;
  links: { label: string; href: string }[];
};

const TEAM_USE_CASES: TeamUseCase[] = [
  {
    icon: "📣",
    team: "Marketing teams",
    body: "Surface verified customer trust where buyers actually make decisions, then turn authentic photo reviews into social proof across campaigns, widgets, and product pages.",
    links: [
      { label: "Review Widgets", href: "/solutions/review-widgets" },
      { label: "Photo Uploads", href: "/solutions/photo-uploads" },
    ],
  },
  {
    icon: "🛠",
    team: "Support teams",
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
    question: "What is the Tellacity Reputation Platform?",
    answer:
      "The Tellacity Reputation Platform is one centralised system for building verified customer trust. It connects review invitations, review widgets, business analytics, reputation management, and photo uploads, so every part of your customer feedback workflow runs from the same verified review infrastructure.",
  },
  {
    question: "Can I use only one part of the platform?",
    answer:
      "Yes. Every solution works on its own. Many businesses start with Review Invitations or Reputation Management and add widgets, analytics, and photo uploads as they grow. Because everything is part of the same platform, switching on a new module never means migrating data.",
  },
  {
    question: "How quickly does the platform integrate with my site?",
    answer:
      "Most businesses are live in under a day. Claim your verified Tellacity profile, send your first review invitations, and drop a single widget snippet into your site. There is no build step, no framework lock-in, and no separate logins between modules.",
  },
  {
    question: "Are all reviews and photos verified?",
    answer:
      "Yes. Reviews are tied to authenticated customer accounts, with optional proof-of-purchase, and every photo runs through EXIF-stripping plus automated NSFW, malware, format, and policy moderation before it goes live. Every action is logged in an audit trail.",
  },
  {
    question: "How does the platform improve SEO and trust signals?",
    answer:
      "The platform emits structured data (Review, AggregateRating, ImageObject, FAQPage, HowTo, and SoftwareApplication schema) across your verified business profile, widgets, and review pages, so customers, search engines, and AI systems all see the same consistent, citable trust signals.",
  },
];

const platformJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Reputation Platform",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    url: "https://tellacity.com/business/signup",
    availability: "https://schema.org/InStock",
  },
  hasPart: [
    {
      "@type": "SoftwareApplication",
      name: "Tellacity Review Invitations",
      url: "https://tellacity.com/solutions/review-invitations",
    },
    {
      "@type": "SoftwareApplication",
      name: "Tellacity Review Widgets",
      url: "https://tellacity.com/solutions/review-widgets",
    },
    {
      "@type": "SoftwareApplication",
      name: "Tellacity Business Analytics",
      url: "https://tellacity.com/solutions/business-analytics",
    },
    {
      "@type": "SoftwareApplication",
      name: "Tellacity Reputation Management",
      url: "https://tellacity.com/solutions/reputation-management",
    },
    {
      "@type": "SoftwareApplication",
      name: "Tellacity Photo Uploads",
      url: "https://tellacity.com/solutions/photo-uploads",
    },
  ],
  description:
    "The Tellacity Reputation Platform combines review invitations, widgets, analytics, reputation management, and photo uploads into one centralised system for verified customer trust.",
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://tellacity.com/" },
    {
      "@type": "ListItem",
      position: 2,
      name: "Reputation Platform",
      item: "https://tellacity.com/reputation-platform",
    },
  ],
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

export default function ReputationPlatformHubPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(platformJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <section className="w-full bg-[#1a1a1a]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-3xl">
            <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
              The Tellacity Reputation Platform
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <span className="block">Build Verified Customer Trust with</span>
              <span className="block" style={{ color: ACCENT }}>
                the Tellacity Reputation Platform
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-gray-300">
              One centralised platform connects review invitations, widgets,
              analytics, reputation management, and photo uploads. Every module
              reads from the same verified review pipeline, so customers,
              search engines, and AI systems see one consistent trust signal
              across every touchpoint.
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
        <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
          <p className="text-sm font-medium uppercase tracking-wider text-amber-700">
            The problem
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
            The problem with scattered reputation signals
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-gray-700">
            <p>
              Most businesses collect customer feedback in five or six
              different places. Reviews live on a third-party site, photos sit
              in support tickets, analytics live in a spreadsheet, replies go
              out from a personal inbox, and disputes are tracked nowhere at
              all.
            </p>
            <p>
              When verified customer trust is split across tools, teams stop
              trusting their own numbers. Leadership reads one trust score,
              support reads another, and marketing publishes static
              testimonials that go stale the moment a new review comes in.
            </p>
            <p>
              Search engines and LLMs see the same fragmentation. Without one
              centralised, verified, structured source of customer feedback,
              your reputation is harder to cite, harder to verify, and harder
              to defend.
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
      </section>

      <section className="w-full border-t border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              The platform
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              How Tellacity connects every part of your reputation
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              The Tellacity Reputation Platform is five modules, one verified
              review infrastructure, one centralised dashboard. Each module
              works on its own. Together, they turn customer feedback into a
              measurable, defensible, citable trust signal.
            </p>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Reviews collected through invitations feed the widgets shown on
              your site. Those same reviews power the analytics that leadership
              tracks, and every reply, dispute, and photo upload is moderated
              through the same operational system.
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
                  {card.title}: {card.tagline}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {card.description}
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
            <p className="text-sm font-medium uppercase tracking-wider text-amber-700">
              Use cases
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              Use cases by team
            </h2>
            <p className="mt-4 text-base leading-relaxed text-gray-600">
              Every team in the business uses the Tellacity Reputation Platform
              differently, but they all work from the same verified customer
              data.
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
                <p className="mt-4 text-sm leading-relaxed text-gray-600">
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
          </ul>
        </div>
      </section>

      <section className="w-full border-t border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-4xl px-6 py-16 md:py-20">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-medium uppercase tracking-wider text-gray-500">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-[#0E0E0E] sm:text-4xl">
              Common questions about the platform
            </h2>
            <p className="mt-3 text-base leading-relaxed text-gray-600">
              Short answers to the most common questions about how the
              Tellacity Reputation Platform fits together.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl space-y-3">
            {PLATFORM_FAQS.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-colors open:border-[#1FAF9E]/40 open:bg-[#F5FAF9]"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-left text-base font-semibold text-[#0E0E0E]">
                  <span>{faq.question}</span>
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
            <Link
              href="/how-tellacity-works"
              className="font-semibold text-[#0F766E] hover:underline"
            >
              How Tellacity works
            </Link>{" "}
            guide, learn more about best practices in our{" "}
            <Link
              href="/resources"
              className="font-semibold text-[#0F766E] hover:underline"
            >
              Resources
            </Link>{" "}
            hub, or{" "}
            <Link
              href="/"
              className="font-semibold text-[#0F766E] hover:underline"
            >
              browse customer reviews from around the world
            </Link>
            .
          </p>
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
