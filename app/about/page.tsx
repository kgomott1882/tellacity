import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

const PAGE_URL = "https://tellacity.com/about";

export const metadata: Metadata = {
  title: "About Tellacity | Reputation Management Platform & Customer Reviews",
  description:
    "Learn about Tellacity, the independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "About Tellacity | Reputation Management Platform & Customer Reviews",
    description:
      "Learn about Tellacity, the independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Tellacity | Reputation Management Platform & Customer Reviews",
    description:
      "Learn about Tellacity, the independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
  },
  robots: { index: true, follow: true },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "About Tellacity | Reputation Management Platform & Customer Reviews",
  description:
    "Learn about Tellacity, the independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
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
        name: "About",
        item: PAGE_URL,
      },
    ],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tellacity",
  description:
    "Tellacity is an independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
  url: "https://tellacity.com",
  mainEntityOfPage: PAGE_URL,
  sameAs: [
    "https://www.linkedin.com/company/tellacity",
    "https://x.com/tellacity",
  ],
};

const linkClass =
  "font-medium text-[#0E3B36] underline underline-offset-2 hover:text-[#1FAF9E]";

const h2Class = "text-2xl font-semibold text-[#0E3B36] sm:text-3xl";
const bodyClass = "mt-4 max-w-3xl text-sm text-gray-600 sm:text-base";
const cardClass = "rounded-2xl border border-gray-200 bg-white p-5 text-left";

const VALUES = [
  {
    title: "Unwavering Trust",
    copy:
      "We earn trust by keeping the platform credible, fair, and transparent. Credibility, fairness, and transparency are not slogans, they are how we moderate, verify, and present feedback.",
    icon: "shield",
  },
  {
    title: "Community First",
    copy:
      "We listen to our community and build tools that help people make better choices. Consumers and businesses both shape how Tellacity improves over time.",
    icon: "users",
  },
  {
    title: "Radical Integrity",
    copy:
      "We stand for honesty, accountability, and respectful dialogue. That means clear policies, fair treatment, and no tolerance for manipulation of reviews.",
    icon: "scale",
  },
  {
    title: "Purposeful Transparency",
    copy:
      "We believe openness creates confidence and long-term trust. Public replies, visible verification, and explainable trust signals keep the marketplace honest.",
    icon: "eye",
  },
  {
    title: "Bold Innovation",
    copy:
      "We keep improving how trust is built and maintained, from verification paths to analytics that turn feedback into action.",
    icon: "spark",
  },
  {
    title: "Enduring Growth",
    copy:
      "We focus on sustainable impact for businesses and consumers. Reputation should compound over years, not reset with every campaign.",
    icon: "growth",
  },
] as const;

function ValueIcon({ icon }: { icon: (typeof VALUES)[number]["icon"] }) {
  const props = {
    viewBox: "0 0 24 24",
    className: "h-4 w-4",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (icon === "shield") {
    return (
      <svg {...props}>
        <path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
      </svg>
    );
  }
  if (icon === "users") {
    return (
      <svg {...props}>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="3" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a3 3 0 0 1 0 5.76" />
      </svg>
    );
  }
  if (icon === "scale") {
    return (
      <svg {...props}>
        <path d="M7 21h10" />
        <path d="M12 3v18" />
        <path d="M3 6h6l-3 7-3-7z" />
        <path d="M15 6h6l-3 7-3-7z" />
      </svg>
    );
  }
  if (icon === "eye") {
    return (
      <svg {...props}>
        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    );
  }
  if (icon === "spark") {
    return (
      <svg {...props}>
        <path d="M12 2v4" />
        <path d="M12 18v4" />
        <path d="M4.22 4.22l2.83 2.83" />
        <path d="M16.95 16.95l2.83 2.83" />
        <path d="M2 12h4" />
        <path d="M18 12h4" />
        <path d="M4.22 19.78l2.83-2.83" />
        <path d="M16.95 7.05l2.83-2.83" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path d="M3 20h18" />
      <path d="M5 16l4-4 3 3 5-7" />
      <path d="M15 6h5v5" />
    </svg>
  );
}

export default function AboutPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />

      <section className="bg-[#F6EAE5]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 text-left md:flex-row md:items-center">
          <div className="md:w-1/2">
            <h1 className="text-3xl font-semibold text-[#0E3B36] sm:text-4xl lg:text-5xl">
              The independent customer reviews and feedback platform
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[#2F3B3A] sm:text-base">
              Tellacity helps people share verified experiences and helps
              businesses earn trust through transparent reviews and insights.
              Together we make every decision more confident.
            </p>
            <p className="mt-4 max-w-xl text-xs text-[#4B5857] sm:text-sm">
              From everyday services to global brands, Tellacity connects
              genuine voices with businesses who are ready to listen and
              improve. Learn more about the{" "}
              <Link href="/reputation-platform" className={linkClass}>
                Tellacity Reputation Management Platform
              </Link>{" "}
              or read our{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust
              </Link>{" "}
              framework.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/write-review"
                className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/20 transition-colors hover:bg-[#0B302C]"
              >
                Write a review
              </Link>
              <Link
                href="/for-business"
                className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] bg-transparent px-6 py-2.5 text-sm font-semibold text-[#0E3B36] transition-colors hover:bg-[#0E3B36]/5"
              >
                Tellacity for Business
              </Link>
            </div>
          </div>

          <div className="md:w-1/2">
            <div className="relative mx-auto max-w-md">
              <div className="grid gap-4">
                <div className="flex gap-4">
                  <div className="h-24 flex-1 rounded-2xl bg-white/90 p-3 shadow-lg shadow-black/10">
                    <p className="text-xs font-semibold text-[#0E0E0E]">
                      Real teams, real feedback
                    </p>
                    <p className="mt-1 text-[11px] text-gray-600">
                      Turn everyday customer experiences into insights your
                      whole team can act on.
                    </p>
                  </div>
                  <div className="h-24 w-24 overflow-hidden rounded-2xl shadow-lg shadow-black/20">
                    <Image
                      src="/brand/woman on laptop.png"
                      alt="Woman working on a laptop"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-24 w-24 rounded-2xl bg-[#0E3B36] shadow-lg shadow-black/20" />
                  <div className="h-24 flex-1 rounded-2xl bg-white/95 p-3 shadow-lg shadow-black/10">
                    <p className="text-xs font-semibold text-[#0E0E0E]">
                      Category insights
                    </p>
                    <p className="mt-1 text-[11px] text-gray-600">
                      Compare businesses by rating, volume, and recent
                      sentiment in every category.
                    </p>
                  </div>
                </div>

                <div className="h-28 overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/15">
                  <img
                    src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1600&q=80"
                    alt="People collaborating in an office"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="overflow-hidden rounded-3xl bg-gray-100">
            <Image
              src="/brand/Office discussion.png"
              alt="Office discussion"
              width={1600}
              height={560}
              className="h-56 w-full object-cover sm:h-72"
              priority
            />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>Who we are</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Tellacity is an independent customer reviews and feedback platform
              positioned between consumers and businesses in the online review
              landscape. We provide a neutral space where verified customer
              experiences matter more than marketing claims or star ratings
              alone.
            </p>
            <p>
              We are not owned by businesses or advertisers. That independence
              keeps moderation fair, keeps policies focused on authenticity,
              and helps both sides of the marketplace trust what they see on
              Tellacity.
            </p>
            <p>
              Whether you are choosing a service, comparing providers, or
              managing reputation for your company, Tellacity is built so the
              same trust infrastructure serves everyone honestly.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F8F5F1]">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>What Tellacity does</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Tellacity is a customer reviews and feedback platform where honest,
              moderated reviews and reputation insights live in one place.
              Verified experiences carry more weight than anonymous ratings, and
              both consumers and businesses benefit from the same system.
            </p>
            <p>
              Consumers get context they can trust. Businesses get signals they
              can respond to, learn from, and publish through profiles, widgets,
              and analytics. That is the core of what we do: connect real
              feedback to better decisions.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Independent platform
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Tellacity exists to keep customer feedback transparent and
                useful, not to favour advertisers or listing owners. Neutrality
                is how we stay credible as a reviews and feedback platform.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Verified experiences
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Reviews tied to real customer paths, moderation, and clear
                policies help genuine voices stand out. Verification is what
                turns feedback into trust people can rely on.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Transparent reviews and insights
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Public replies, category benchmarks, sentiment, and reputation
                signals give consumers context and give businesses a fair,
                actionable picture of how they are perceived.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>
            How the reputation management platform works
          </h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              The{" "}
              <Link href="/reputation-platform" className={linkClass}>
                Tellacity Reputation Management Platform
              </Link>{" "}
              connects verified reviews, moderation, business responses, widgets,
              and analytics into one system, not a static directory of ratings.
            </p>
            <p>
              Feedback flows from collection through verification and
              publication, then into dashboards and on-site widgets your team
              can act on. That turns everyday reviews into usable reputation
              signals for support, marketing, product, and leadership.
            </p>
            <p>
              Tellacity is a reputation management platform first: built to help
              businesses manage trust over time, not just display a score.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Verified customer reviews
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Reviews enter through verified paths with moderation before they
                appear publicly. One pipeline feeds profiles, search, and
                business tools.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Business response and moderation
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Teams reply publicly, dispute inaccurate content, and work within{" "}
                <Link href="/business-guidelines" className={linkClass}>
                  business guidelines
                </Link>{" "}
                and{" "}
                <Link href="/reviewer-guidelines" className={linkClass}>
                  reviewer guidelines
                </Link>
                , aligned with our trust framework.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Insights across dashboards and widgets
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Analytics, widgets, and profile infrastructure share the same
                verified data so what customers see matches what your team
                measures.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8F5F1]">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>How Tellacity works</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Tellacity follows a simple model: verified feedback in, trust
              signals out. Here is how the platform connects consumers and
              businesses in practice.
            </p>
          </div>
          <ol className="mt-8 space-y-4">
            {[
              {
                title: "Consumers share verified experiences",
                detail:
                  "Customers write about businesses they have actually used. Reviews enter Tellacity's verification and moderation path before they go live.",
              },
              {
                title: "Tellacity checks authenticity and applies policies",
                detail: "moderation-step",
              },
              {
                title: "Businesses receive insights and respond publicly",
                detail:
                  "Teams use the reputation management platform to reply, track sentiment, and improve service based on real customer language, not guesses.",
              },
              {
                title: "Trust signals flow into profiles, widgets, and analytics",
                detail:
                  "Verified proof appears on Tellacity profiles, embeddable widgets, and business dashboards so reputation stays consistent across touchpoints.",
              },
            ].map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B36] text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-sm font-semibold text-[#0E0E0E]">
                    {step.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                    {step.detail === "moderation-step" ? (
                      <>
                        Moderation, guidelines, and verification standards keep
                        feedback fair. See our{" "}
                        <Link href="/safety-trust" className={linkClass}>
                          Safety &amp; Trust
                        </Link>{" "}
                        framework for how we handle abuse, disputes, and policy
                        enforcement.
                      </>
                    ) : (
                      step.detail
                    )}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <p className={`${bodyClass} mt-6`}>
            Want the full walkthrough? Read{" "}
            <Link href="/how-tellacity-works" className={linkClass}>
              how Tellacity works
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>What the platform includes</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Tellacity is a customer reviews and feedback platform with
              reputation management built in. These are the practical capabilities
              businesses and consumers use every day.
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              {
                title: "Verified review collection",
                detail:
                  "Invite customers, collect feedback through verified paths, and keep reviews tied to real experiences.",
              },
              {
                title: "Reputation management and moderation",
                detail:
                  "Reply, dispute, and protect profiles from one operational system with audit-friendly policies.",
              },
              {
                title: "Business responses",
                detail:
                  "Public replies show accountability and give future customers context on how you handle feedback.",
              },
              {
                title: "Trust signals and analytics",
                detail:
                  "Sentiment, trends, and trust scores help teams understand reputation performance over time.",
              },
              {
                title: "Widgets and profile infrastructure",
                detail:
                  "Embed verified proof on your site and maintain a Tellacity profile customers can find and cite.",
              },
            ].map((item) => (
              <li key={item.title} className={cardClass}>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
              </li>
            ))}
          </ul>
          <p className={`${bodyClass} mt-6`}>
            Explore{" "}
            <Link href="/reputation-platform" className={linkClass}>
              the Reputation Management Platform
            </Link>
            , compare{" "}
            <Link href="/pricing" className={linkClass}>
              pricing
            </Link>
            , or browse{" "}
            <Link href="/resources" className={linkClass}>
              resources
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-[#F8F5F1]">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>Real teams, real feedback</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Tellacity turns everyday customer experiences into actionable
              insight for support, marketing, product, and leadership teams.
            </p>
            <p>
              Instead of scattered spreadsheets and conflicting scores, teams
              work from one shared source of truth about how customers actually
              feel, so decisions are practical, not political.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Turn everyday customer experiences into insights
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Verified reviews surface what is working, what is broken, and
                what customers want next, in language your team can act on, not
                generic star averages.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Help every team act on real-world feedback
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Trends, tags, and sentiment flow into dashboards and widgets so
                support, marketing, and product teams can prioritize what
                matters most.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>Category insights</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Users can compare businesses by rating, volume, and recent
              sentiment, not just a static score from years ago. Recency and
              authenticity matter when trust is on the line.
            </p>
            <p>
              Category trends help consumers choose with context and help
              businesses benchmark themselves against peers in banking, retail,
              telecom, travel, and more.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Compare businesses by rating, volume, and recent sentiment
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Side-by-side category views show who is earning trust today,
                with verified reviews weighted by recency and authenticity.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Discover trends across every category
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Spot rising operators, fading reputations, and shifts in customer
                sentiment so you can choose, or improve, with eyes open.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8F5F1]">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>Why independence matters</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Tellacity is not owned by businesses or advertisers. Independence
              helps keep the customer reviews and feedback platform fair and
              credible when stakes are high for both consumers and brands.
            </p>
            <p>
              Neutral moderation supports both sides of the marketplace: consumers
              get honest context, and businesses get a fair chance to respond and
              improve without pay-to-hide dynamics.
            </p>
            <p>
              That independence is why verification, clear policies, and
              transparent trust signals sit at the centre of everything we build.
              Read more in our{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust
              </Link>{" "}
              and{" "}
              <Link href="/business-guidelines" className={linkClass}>
                Business Guidelines
              </Link>{" "}
              pages.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 text-center sm:py-14">
          <h2 className={h2Class}>Our mission</h2>
          <div className="mx-auto mt-4 max-w-3xl space-y-3 text-left text-sm text-gray-600 sm:text-base">
            <p>
              To be the most trusted source of information about businesses
              globally. We empower consumers to share their experiences and help
              businesses build trust through transparency, fairness, and open
              communication.
            </p>
            <p>
              In plain terms: we want verification, moderation, and clear
              policies to be the backbone of trust online, so accountability is
              the default, not the exception.
            </p>
          </div>

          <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                A trusted source of business information globally
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                We protect the integrity of every review with verification,
                moderation, and clear policies, so the information people rely on
                is information they can trust.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Transparency and accountability by default
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Open replies, public reputation, and verified signals make
                accountability normal. That is how we keep the online experience
                trustworthy and sustainable for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F8F5F1]">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>For consumers</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Share your real experiences. Help others make informed choices and
              hold businesses accountable. Writing a verified review takes a
              minute, but it shapes how thousands of future customers, and the
              business itself, learn from your experience.
            </p>
            <p>
              Every review is checked by Tellacity&apos;s authenticity systems so
              genuine voices are heard and fake feedback does not drown them out.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Share your real experiences
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Write about businesses you have actually used. Honest, specific
                feedback is what makes the customer reviews and feedback platform
                trustworthy for everyone who follows.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Help others make informed choices
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Your review becomes context for the next customer comparing
                options, so they can choose with confidence instead of guesswork.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Hold businesses accountable
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Public, verified feedback gives businesses a clear reason to fix
                what is broken and double down on what is working.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/write-review"
              className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/20 transition-colors hover:bg-[#0B302C]"
            >
              Write a Review
            </Link>
            <Link
              href="/reviewer-guidelines"
              className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-5 py-2.5 text-sm font-semibold text-[#0E3B36] transition-colors hover:bg-[#0E3B36]/5"
            >
              Reviewer Guidelines
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className={h2Class}>For businesses</h2>
          <div className={`${bodyClass} space-y-3`}>
            <p>
              Build trust with verified reviews, respond openly, and grow a
              reputation customers can rely on. Tellacity replaces generic star
              ratings with verified, meaningful signals: who reviewed, what they
              actually experienced, and how that experience is trending.
            </p>
            <p>
              Those signals flow into dashboards, widgets, and analytics powered
              by the{" "}
              <Link href="/reputation-platform" className={linkClass}>
                Tellacity Reputation Management Platform
              </Link>
              , so your team can act on real-world feedback every day.
            </p>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Build trust with verified reviews
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Verified, moderated reviews give your reputation the credibility
                customers and search engines can understand, because proof is
                structured and current, not copied from elsewhere.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Respond openly and improve reputation
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Reply to reviews in public. Show prospective customers how you
                handle praise and complaints alike, that is accountability in
                practice.
              </p>
            </div>
            <div className={cardClass}>
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Grow with feedback-driven insights
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Sentiment, tags, and category benchmarks feed into dashboards,
                widgets, and analytics so product and service improve from real
                customer language.
              </p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/for-business"
              className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-5 py-2.5 text-sm font-semibold text-[#0E3B36] transition-colors hover:bg-[#0E3B36]/5"
            >
              Tellacity for Business
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-5 py-2.5 text-sm font-semibold text-[#0E3B36] transition-colors hover:bg-[#0E3B36]/5"
            >
              View Pricing
            </Link>
          </div>
          <div className="mt-10 overflow-hidden rounded-3xl bg-gray-100">
            <Image
              src="/brand/About%20Tellacity.jpeg"
              alt="About Tellacity"
              width={1024}
              height={520}
              className="h-auto w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 pt-4 text-center">
          <h2 className={h2Class}>Our values</h2>
          <p className="mt-3 text-sm text-gray-600">
            The principles that guide every decision we make as an independent
            customer reviews and feedback platform.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VALUES.map((item) => (
              <div key={item.title} className={cardClass}>
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5F3] text-[#0E3B36]">
                  <ValueIcon icon={item.icon} />
                </div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-gray-600 sm:text-sm">
                  {item.copy}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-gray-200 bg-[#F8F5F1] p-6 text-left">
            <p className="text-sm text-gray-600">
              Tellacity&apos;s about page connects the consumer experience,
              business tools, and trust policies that support the broader{" "}
              <Link href="/reputation-platform" className={linkClass}>
                reputation management platform
              </Link>
              . Explore{" "}
              <Link href="/write-review" className={linkClass}>
                Write a review
              </Link>
              ,{" "}
              <Link href="/for-business" className={linkClass}>
                Tellacity for Business
              </Link>
              ,{" "}
              <Link href="/blog" className={linkClass}>
                the blog
              </Link>
              ,{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>
              , and{" "}
              <Link href="/contact" className={linkClass}>
                Contact
              </Link>
              .
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
