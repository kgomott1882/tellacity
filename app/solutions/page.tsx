import Link from "next/link";

export const metadata = {
  title: "Solutions | The Tellacity Business Platform",
  description:
    "Tellacity gives every business one platform for review invitations, widgets, analytics, reputation management, and customer feedback. Explore the full product suite.",
  alternates: {
    canonical: "https://tellacity.com/solutions",
  },
  openGraph: {
    title: "Solutions | Tellacity",
    description:
      "The Tellacity business platform: invitations, widgets, analytics, reputation, and customer feedback.",
    url: "https://tellacity.com/solutions",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solutions | Tellacity",
    description:
      "The Tellacity business platform across reviews, widgets, analytics, and reputation.",
  },
};

const ACCENT = "#1FAF9E";
const ACCENT_BG = "#FBBF24";

type SolutionCard = {
  title: string;
  href: string;
  description: string;
  image: { src: string; alt: string };
  badge: string;
};

const SOLUTIONS: SolutionCard[] = [
  {
    title: "Review Invitations",
    href: "/solutions/review-invitations",
    description:
      "Send branded, verified review invitations to every customer with reminders and proof-of-purchase attribution.",
    image: {
      src: "/brand/Review%20Form.png",
      alt: "Tellacity review invitation form",
    },
    badge: "✉",
  },
  {
    title: "Review Widgets",
    href: "/solutions/review-widgets",
    description:
      "Embed verified reviews on your website with badge, carousel, and floating layouts that update in real time.",
    image: {
      src: "/brand/Platforms.png",
      alt: "Tellacity review widgets across web and mobile",
    },
    badge: "⭐",
  },
  {
    title: "Business Analytics",
    href: "/solutions/business-analytics",
    description:
      "Trust score trends, sentiment, channel attribution, and product-level insights from one dashboard.",
    image: {
      src: "/brand/Dashboard.png",
      alt: "Tellacity analytics dashboard",
    },
    badge: "📊",
  },
  {
    title: "Reputation Management",
    href: "/solutions/reputation-management",
    description:
      "Reply, moderate, dispute, and protect your verified business profile across every Tellacity touchpoint.",
    image: {
      src: "/brand/Business%20Profile.png",
      alt: "Tellacity business profile and reputation tools",
    },
    badge: "🛡",
  },
  {
    title: "Photo Uploads",
    href: "/solutions/photo-uploads",
    description:
      "Verified customer photos and structured feedback (title, rating, product attribution, and follow-ups) published to your profile.",
    image: {
      src: "/brand/Gallery%20Photos.png",
      alt: "Tellacity review photos and structured feedback on a verified profile",
    },
    badge: "📷",
  },
];

export default function SolutionsHubPage() {
  return (
    <main className="bg-white">
      <section className="w-full bg-[#1a1a1a]">
        <div className="mx-auto w-full max-w-7xl px-6 py-16 md:py-20">
          <div className="max-w-2xl">
            <Link
              href="/reputation-platform"
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-gray-300 transition-colors hover:border-[#1FAF9E]/50 hover:text-white"
            >
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: ACCENT }}
                aria-hidden
              />
              Part of the Tellacity Reputation Platform
              <span aria-hidden>→</span>
            </Link>
            <p className="mt-4 text-sm font-medium uppercase tracking-wider text-gray-400">
              The Tellacity platform
            </p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
              <span className="block">One platform for</span>
              <span className="block" style={{ color: ACCENT }}>
                reviews, reputation, and growth.
              </span>
            </h1>
            <p className="mt-4 text-base leading-relaxed text-gray-300">
              Tellacity is built for businesses that take customer feedback
              seriously. Every solution below ships as part of the same
              dashboard, with no add-ons, no glue code, and no separate logins.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/business/signup"
                className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_0_rgba(251,191,36,0)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
                style={{ backgroundColor: ACCENT_BG }}
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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {SOLUTIONS.map((solution) => (
              <Link
                key={solution.href}
                href={solution.href}
                className="group flex flex-col overflow-hidden rounded-3xl border border-gray-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-[#1FAF9E]/40 hover:shadow-[0_22px_60px_rgba(31,175,158,0.18)]"
              >
                <div className="relative h-44 w-full overflow-hidden bg-[#F5FAF9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={solution.image.src}
                    alt={solution.image.alt}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <div
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-semibold"
                    style={{ backgroundColor: "#E5F4F2", color: "#0F766E" }}
                    aria-hidden
                  >
                    {solution.badge}
                  </div>
                  <h2 className="mt-4 text-lg font-semibold text-[#0E0E0E]">
                    {solution.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {solution.description}
                  </p>
                  <span
                    className="mt-6 inline-flex items-center text-xs font-semibold"
                    style={{ color: ACCENT }}
                  >
                    Learn more →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="w-full border-t border-gray-100 bg-[#F8FAFC]">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 md:py-16">
          <div className="rounded-3xl border border-[#1FAF9E]/20 bg-white p-8 text-center shadow-[0_22px_60px_rgba(31,175,158,0.08)]">
            <p
              className="text-sm font-medium uppercase tracking-wider"
              style={{ color: ACCENT }}
            >
              The Tellacity Reputation Platform
            </p>
            <h2 className="mt-3 text-2xl font-bold tracking-tight text-[#0E0E0E] sm:text-3xl">
              See how every solution works together
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-gray-600">
              Review invitations, widgets, analytics, reputation management,
              and photo uploads are five modules on one verified review
              infrastructure. The Reputation Platform hub explains how they
              connect and how teams use them together.
            </p>
            <Link
              href="/reputation-platform"
              className="mt-6 inline-flex items-center justify-center rounded-2xl px-6 py-3 text-sm font-semibold text-black shadow-[0_0_0_rgba(251,191,36,0)] transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
              style={{ backgroundColor: ACCENT_BG }}
            >
              Explore the Reputation Platform →
            </Link>
          </div>
        </div>
      </section>

      <section className="w-full bg-[#0E0E0E] text-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center md:py-20">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything your business needs, in one dashboard.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-300">
            Claim your verified Tellacity profile, invite your first customers,
            and start building a reputation customers can actually trust.
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
              href="/pricing"
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
