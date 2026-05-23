import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title:
    "About Tellacity | The independent platform for real customer feedback",
  description:
    "Tellacity is an independent platform for real customer feedback. Learn how we help consumers share honest reviews and help businesses build trust through transparency and verified insights.",
  alternates: { canonical: "https://tellacity.com/about" },
  openGraph: {
    title:
      "About Tellacity | The independent platform for real customer feedback",
    description:
      "Tellacity is an independent platform for real customer feedback. Learn how we help consumers share honest reviews and help businesses build trust through transparency and verified insights.",
    url: "https://tellacity.com/about",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title:
      "About Tellacity | The independent platform for real customer feedback",
    description:
      "Tellacity is an independent platform for real customer feedback.",
  },
  robots: { index: true, follow: true },
};

const webPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "About Tellacity | The independent platform for real customer feedback",
  description:
    "Tellacity is an independent platform for real customer feedback that connects honest consumer reviews with businesses ready to listen, learn, and earn trust.",
  url: "https://tellacity.com/about",
  inLanguage: "en",
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
        item: "https://tellacity.com/about",
      },
    ],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tellacity",
  description:
    "The independent platform for real customer feedback. Tellacity helps consumers share verified reviews and helps businesses earn trust through transparency.",
  url: "https://tellacity.com",
  mainEntityOfPage: "https://tellacity.com/about",
  sameAs: [
    "https://www.linkedin.com/company/tellacity",
    "https://x.com/tellacity",
  ],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Customer Feedback Platform",
  applicationCategory: "ReviewApplication",
  operatingSystem: "Web",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://tellacity.com/for-business",
  },
  description:
    "Tellacity helps consumers share real customer feedback and businesses build trust through transparent, verified reviews and insights.",
};

export default function AboutPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <section className="bg-[#F6EAE5]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 text-left md:flex-row md:items-center">
          {/* Left copy */}
          <div className="md:w-1/2">
            <h1 className="text-3xl font-semibold text-[#0E3B36] sm:text-4xl lg:text-5xl">
              The independent platform for<br className="hidden sm:block" />
              real customer feedback
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[#2F3B3A] sm:text-base">
              Tellacity helps people share verified experiences and helps
              businesses earn trust through transparent reviews and insights.
              Together we make every decision more confident.
            </p>
            <p className="mt-4 max-w-xl text-xs text-[#4B5857] sm:text-sm">
              From everyday services to global brands, Tellacity connects
              genuine voices with businesses who are ready to listen and
              improve.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/write-review"
                className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/20 hover:bg-[#0B302C] transition-colors"
              >
                Write a review
              </Link>
              <Link
                href="/for-business"
                className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-6 py-2.5 text-sm font-semibold text-[#0E3B36] bg-transparent hover:bg-[#0E3B36]/5 transition-colors"
              >
                Tellacity for Business
              </Link>
            </div>
          </div>

          {/* Right visual collage */}
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

      {/* Who we are and what we do */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            Who we are and what we do
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
            Tellacity is an independent platform for real customer feedback.
            We sit between consumers and businesses in the broader online
            review landscape, providing a neutral space where verified
            experiences carry more weight than star ratings. Together we make
            every decision more confident.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600 sm:text-base">
            Consumers benefit from honest, moderated reviews that help them
            decide who to trust. Businesses benefit from verified signals they
            can learn from, respond to, and build long-term reputation
            around.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                An independent platform for real customer feedback
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Tellacity is owned by neither businesses nor advertisers. We
                exist to keep customer feedback transparent, verified, and
                useful to everyone.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Connecting genuine experiences with businesses who listen
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                From everyday services to global brands, we connect honest
                voices with businesses ready to act on what their customers
                are saying.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Helping decisions become more confident
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Verified reviews, category insights, and reputation signals
                help consumers choose well and help businesses keep
                improving.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Real teams, real feedback */}
      <section className="bg-[#F8F5F1]">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            Real teams, real feedback
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
            Turn everyday customer experiences into insights your whole team
            can act on. Tellacity gives support, marketing, product, and
            leadership a shared source of truth about how customers actually
            feel.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Turn everyday customer experiences into insights
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Verified reviews surface what's working, what's broken, and
                what customers want next, in language your team can act on.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Help every team act on real-world feedback
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Trends, tags, and sentiment flow into the dashboards and
                widgets your support, marketing, and product teams already
                use.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Category insights */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            Category insights
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
            Compare businesses by rating, volume, and recent sentiment in
            every category, so consumers can choose with context and
            businesses can benchmark against peers.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Compare businesses by rating, volume, and recent sentiment
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Side-by-side category views show who's earning trust today,
                not just historically, with verified reviews weighted by
                recency and authenticity.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Discover trends across every category
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Spot rising operators, fading reputations, and shifts in
                customer sentiment across banking, retail, telecom, travel,
                and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-12 text-center">
        <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
          Our mission
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600 sm:text-base">
          To be the most trusted source of information about businesses
          globally. We empower consumers to share their experiences and help
          businesses build trust through transparency, fairness, and open
          communication.
        </p>

        <div className="mt-8 grid gap-4 text-left md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              To be the most trusted source of information about businesses
              globally
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              We protect the integrity of every review with verification,
              moderation, and clear policies, so the information people rely
              on is information they can trust.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              Empowering consumers and businesses through transparency
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Open replies, public reputation, and verified signals make
              accountability the default. That's how we keep the online
              experience trustworthy and sustainable for everyone.
            </p>
          </div>
        </div>
      </section>

      {/* For consumers */}
      <section className="bg-[#F8F5F1]">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            For consumers
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
            Share your real experiences. Help others make informed choices
            and hold businesses accountable. Writing a verified review takes
            a minute, but it shapes how thousands of future customers and
            the business itself learn from your experience. Every review is
            checked by Tellacity's authenticity systems so genuine voices
            are heard and fake feedback doesn't drown them out.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Share your real experiences
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Write verified reviews about businesses you've actually used.
                Honest, specific feedback is what makes the platform
                trustworthy.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Help others make informed choices
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Your review becomes context for the next customer comparing
                options, so they can choose with confidence instead of
                guesswork.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Hold businesses accountable
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Public, verified feedback gives businesses a clear reason to
                fix what's broken and double down on what's working.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href="/write-review"
              className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/20 transition-colors hover:bg-[#0B302C]"
            >
              Write a Review
            </Link>
          </div>
        </div>
      </section>

      {/* For businesses */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 sm:py-14">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            For businesses
          </h2>
          <p className="mt-4 max-w-3xl text-sm text-gray-600 sm:text-base">
            Build trust with verified reviews, respond openly, and grow a
            reputation customers can rely on. Tellacity replaces generic
            star ratings with verified, meaningful signals: who reviewed,
            what they actually experienced, and how that experience is
            trending. Those signals flow into dashboards, widgets, and
            analytics powered by the{" "}
            <Link
              href="/reputation-platform"
              className="font-semibold text-[#0E3B36] underline-offset-2 hover:underline"
            >
              Tellacity Reputation Platform
            </Link>
            , so your team can act on real-world feedback every day.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Build trust with verified reviews
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Verified, moderated reviews give your reputation the
                credibility customers and search engines reward.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Respond openly and improve reputation
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Reply to every review in public. Show prospective customers
                how you handle praise and complaints alike.
              </p>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-5 text-left">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Grow with feedback-driven insights
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                Sentiment, tags, and category benchmarks feed into the
                dashboards, widgets, and analytics your team already uses.
              </p>
            </div>
          </div>
          <div className="mt-8">
            <Link
              href="/for-business"
              className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-5 py-2.5 text-sm font-semibold text-[#0E3B36] transition-colors hover:bg-[#0E3B36]/5"
            >
              Tellacity for Business
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
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            Our values
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            The principles that guide every decision we make as an
            independent platform for verified customer reviews.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Unwavering Trust",
                copy:
                  "We earn trust by keeping the platform credible, fair, and transparent.",
                icon: "shield",
              },
              {
                title: "Community First",
                copy:
                  "We listen to our community and build what helps people make better choices.",
                icon: "users",
              },
              {
                title: "Radical Integrity",
                copy:
                  "We stand for honesty, accountability, and respectful dialogue.",
                icon: "scale",
              },
              {
                title: "Purposeful Transparency",
                copy:
                  "We believe openness creates confidence and long-term trust.",
                icon: "eye",
              },
              {
                title: "Bold Innovation",
                copy:
                  "We keep improving to make trust easier to establish and maintain.",
                icon: "spark",
              },
              {
                title: "Enduring Growth",
                copy:
                  "We focus on sustainable impact for businesses and consumers.",
                icon: "growth",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5F3] text-[#0E3B36]">
                  {item.icon === "shield" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
                    </svg>
                  )}
                  {item.icon === "users" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="3" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a3 3 0 0 1 0 5.76" />
                    </svg>
                  )}
                  {item.icon === "scale" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 21h10" />
                      <path d="M12 3v18" />
                      <path d="M3 6h6l-3 7-3-7z" />
                      <path d="M15 6h6l-3 7-3-7z" />
                    </svg>
                  )}
                  {item.icon === "eye" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                  {item.icon === "spark" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="M4.22 4.22l2.83 2.83" />
                      <path d="M16.95 16.95l2.83 2.83" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <path d="M4.22 19.78l2.83-2.83" />
                      <path d="M16.95 7.05l2.83-2.83" />
                    </svg>
                  )}
                  {item.icon === "growth" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 20h18" />
                      <path d="M5 16l4-4 3 3 5-7" />
                      <path d="M15 6h5v5" />
                    </svg>
                  )}
                </div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-gray-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
