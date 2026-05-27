import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import ValuesTabs from "./ValuesTabs";
import { JOBS } from "./jobs";

const PAGE_URL = "https://tellacity.com/careers";

export const metadata: Metadata = {
  title: "Careers | Tellacity",
  description:
    "Join Tellacity and help build transparent, trustworthy products. Explore open roles in engineering, design, trust, moderation, and business development.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Careers | Tellacity",
    description:
      "Join Tellacity and help build transparent, trustworthy products. Explore open roles in engineering, design, trust, moderation, and business development.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers | Tellacity",
    description:
      "Join Tellacity and help build transparent, trustworthy products. Explore open roles in engineering, design, trust, moderation, and business development.",
  },
  robots: { index: true, follow: true },
};

const careersJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Careers | Tellacity",
  description:
    "Join Tellacity and help build transparent, trustworthy products. Explore open roles in engineering, design, trust, moderation, and business development.",
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
        name: "Careers",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const HOW_WE_WORK = [
  {
    title: "Focused work",
    detail:
      "We protect time for deep work and thoughtful execution—clear priorities beat constant context-switching.",
  },
  {
    title: "Remote-first",
    detail:
      "Teams collaborate across regions with async-friendly communication; remote-first means location is not a barrier to ownership.",
  },
  {
    title: "Collaborative",
    detail:
      "Small, empowered teams share context openly and pair with product, design, and trust specialists when decisions cross functions.",
  },
];

const ROLE_SUMMARIES: Record<string, { work: string; fit: string }> = {
  "senior-software-engineer-fullstack": {
    work: "Build core product features and trust infrastructure.",
    fit: "Suited to experienced fullstack engineers who want ownership from spec to production.",
  },
  "product-designer": {
    work: "Design clear, usable experiences for consumers and businesses.",
    fit: "Ideal for product designers who care about trust, clarity, and end-to-end UX craft.",
  },
  "brand-trust-analyst": {
    work: "Help analyze trust signals, brand perception, and platform quality.",
    fit: "A strong fit for analytical thinkers interested in fraud patterns and reputation data.",
  },
  "community-moderation-specialist": {
    work: "Support safe, fair moderation and community standards.",
    fit: "Well suited to calm, detail-oriented people with moderation or community support experience.",
  },
  "business-development-manager": {
    work: "Grow partnerships and business adoption.",
    fit: "Best for B2B relationship builders motivated by trust-focused SaaS and long-term partnerships.",
  },
};

const WHY_JOIN = [
  {
    title: "Collaborate with a purpose-driven team",
    detail:
      "You will work with people who care about fairness and impact—not vanity metrics or opaque growth tactics.",
  },
  {
    title: "Build products that improve transparency",
    detail:
      "Your work connects directly to verified reviews, trust signals, and tools on the ",
    link: { href: "/reputation-platform", label: "Reputation Platform" },
    suffix: ".",
  },
  {
    title: "Move fast with clarity and ownership",
    detail:
      "Teams are trusted to deliver with autonomy; expectations are clear and follow-through matters more than hierarchy.",
  },
  {
    title: "Work across markets and industries",
    detail:
      "Tellacity serves consumers and businesses globally, so you gain exposure to varied use cases and regional needs.",
  },
  {
    title: "Learn in a culture that values integrity",
    detail:
      "We invest in learning and honest feedback—aligned with the same integrity standards we apply to the product.",
  },
];

const GLOBAL_TEAM = [
  {
    title: "Shared mission",
    detail:
      "Every region works toward the same goal: making trust more transparent and accessible for everyone.",
  },
  {
    title: "Regional collaboration",
    detail:
      "Distributed teams share context across time zones so product decisions reflect diverse markets and users.",
  },
  {
    title: "Building trust globally",
    detail:
      "Remote collaboration helps us build a trust platform that is usable beyond a single geography or industry.",
  },
];

function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

function buildJobPostingJsonLd() {
  return JOBS.map((job) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description:
      ROLE_SUMMARIES[job.slug]?.work ??
      `${job.title} at Tellacity. ${job.location}.`,
    hiringOrganization: {
      "@type": "Organization",
      name: "Tellacity",
      sameAs: "https://tellacity.com",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressCountry: "Worldwide",
      },
    },
    jobLocationType: "TELECOMMUTE",
    url: `${PAGE_URL}/${job.slug}`,
  }));
}

export default function CareersPage() {
  const jobPostingJsonLd = buildJobPostingJsonLd();

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(careersJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": jobPostingJsonLd,
          }),
        }}
      />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Our values guide how we work
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Build trust with purpose
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Tellacity is a place to do meaningful work with people who care about
            transparency, fairness, and real impact.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            We build products that make reputation verifiable and fair. Learn
            more about{" "}
            <Link href="/about" className={linkClass}>
              Tellacity
            </Link>{" "}
            and what we stand for in{" "}
            <Link href="/safety-trust" className={linkClass}>
              Safety &amp; Trust
            </Link>
            .
          </p>

          <h2 className="mt-10 text-2xl font-semibold text-[#0E0E0E]">
            Our values
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Our values guide how we work day to day—not as wall art, but as
            expectations for decisions, communication, and how we treat customers
            and each other.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Select a value below to read how we define it in practice.
          </p>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.05fr_1.2fr] lg:items-start">
            <div className="overflow-hidden rounded-2xl bg-gray-100">
              <Image
                src="/brand/Happy Eployees.png"
                alt="Happy employees at Tellacity"
                width={600}
                height={312}
                className="h-52 w-full object-cover"
              />
            </div>
            <ValuesTabs />
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="overflow-hidden rounded-2xl bg-gray-200">
              <Image
                src="/brand/Boardroom people.png"
                alt="Boardroom team at Tellacity"
                width={600}
                height={256}
                className="h-64 w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                How we work
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                We value clear communication, thoughtful execution, and a
                healthy balance between focus and collaboration. Our teams are
                small, empowered, and trusted to deliver.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                That means async-friendly updates, direct ownership of outcomes,
                and collaboration when cross-functional context improves the
                result—not meetings for their own sake.
              </p>
              <div className="mt-6 space-y-4">
                {HOW_WE_WORK.map((item) => (
                  <div key={item.title}>
                    <h3 className="text-sm font-semibold text-[#0E0E0E]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Opportunity unlocked
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            We&apos;re growing quickly and building a team that cares about trust,
            transparency, and impact.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            We are hiring across product, engineering, trust, moderation, and
            business functions as we scale the{" "}
            <Link href="/for-business" className={linkClass}>
              business platform
            </Link>{" "}
            and{" "}
            <Link href="/reputation-platform" className={linkClass}>
              reputation infrastructure
            </Link>
            .
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Each role contributes directly to the product, reputation, or growth
            engine behind Tellacity.
          </p>
          <div className="mt-8 space-y-4 text-left">
            {JOBS.map((job) => {
              const safeSlug = (job.slug ?? "").trim().toLowerCase();
              if (!isValidSlug(safeSlug)) return null;
              const summary = ROLE_SUMMARIES[safeSlug];
              return (
                <div
                  key={safeSlug}
                  className="rounded-lg border border-gray-200 bg-white px-4 py-4 sm:px-5"
                >
                  <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[#0E0E0E]">
                        {job.title}
                      </h3>
                      {summary ? (
                        <>
                          <p className="mt-1 text-sm text-gray-600">
                            {summary.work}
                          </p>
                          <p className="mt-1 text-xs text-gray-500">
                            {summary.fit}
                          </p>
                        </>
                      ) : null}
                      <p className="mt-1 text-xs text-gray-500">
                        {job.location}
                        {job.department ? ` · ${job.department}` : ""}
                      </p>
                    </div>
                    <Link
                      href={`/careers/${safeSlug}`}
                      className="shrink-0 rounded-full border border-[#0E3B36] px-4 py-1.5 text-xs font-semibold text-[#0E3B36] transition-colors hover:bg-[#0E3B36] hover:text-white"
                    >
                      Apply now →
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="overflow-hidden rounded-2xl bg-gray-200">
              <Image
                src="/brand/joinhands.png"
                alt="Team collaboration at Tellacity"
                width={600}
                height={224}
                className="h-56 w-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                Why join Tellacity?
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                You can expect a practical, mission-driven environment—not generic
                recruitment slogans, but real problems in trust, reviews, and
                transparency.
              </p>
              <div className="mt-6 space-y-5">
                {WHY_JOIN.map((item) => (
                  <div key={item.title}>
                    <h3 className="text-sm font-semibold text-[#0E0E0E]">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-600">
                      {item.detail}
                      {item.link ? (
                        <Link href={item.link.href} className={linkClass}>
                          {item.link.label}
                        </Link>
                      ) : null}
                      {item.suffix ?? ""}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#CFEAE6] text-[#0E3B36]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8" />
              <path d="M3.6 15h16.8" />
              <path d="M12 3c2.5 2.7 2.5 14.3 0 18" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[#0E0E0E]">
            One global team
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            We work across regions with a shared mission to make trust more
            transparent and accessible for everyone.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Distributed collaboration helps us build a more accessible trust
            platform—and reflects how our customers use Tellacity across markets.
            Read more from{" "}
            <Link href="/investor-relations" className={linkClass}>
              investor relations
            </Link>{" "}
            about our global footprint.
          </p>
          <div className="mx-auto mt-8 max-w-2xl space-y-4 text-left">
            {GLOBAL_TEAM.map((item) => (
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

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Contact talent
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Don&apos;t see the right role? Send us your profile and tell us how
            you&apos;d like to contribute—we review general applications and
            keep strong candidates in mind for future openings.
          </p>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            Tellacity&apos;s careers and culture are shaped by the same trust
            principles that guide our product. See{" "}
            <Link href="/safety-trust" className={linkClass}>
              Safety &amp; Trust
            </Link>{" "}
            and the{" "}
            <Link href="/reputation-platform" className={linkClass}>
              Reputation Platform
            </Link>{" "}
            to understand what we build and why it matters.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0B3B36] px-6 py-2 text-sm font-semibold text-white hover:bg-[#0a302c]"
          >
            Contact Talent
          </Link>
        </div>
      </section>
    </main>
  );
}
