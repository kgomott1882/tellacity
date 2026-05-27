import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";

const PAGE_URL = "https://tellacity.com/resources";

export const metadata: Metadata = {
  title: "Resources Hub | Tellacity",
  description:
    "Explore Tellacity's resources, guides, help center, integrations, customer stories, and reputation platform to build verified trust and grow your business.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Resources Hub | Tellacity",
    description:
      "Explore Tellacity's resources, guides, help center, integrations, customer stories, and reputation platform to build verified trust and grow your business.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources Hub | Tellacity",
    description:
      "Explore Tellacity's resources, guides, help center, integrations, customer stories, and reputation platform to build verified trust and grow your business.",
  },
  robots: { index: true, follow: true },
};

const resourcesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Resources Hub | Tellacity",
  description:
    "Explore Tellacity's resources, guides, help center, integrations, customer stories, and reputation platform to build verified trust and grow your business.",
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
        name: "Resources",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const RECOMMENDED_PATH = [
  <>
    Start with the{" "}
    <Link href="/reputation-platform" className={linkClass}>
      Reputation Platform
    </Link>{" "}
    to understand how review invitations, widgets, analytics, and reputation
    management work together.
  </>,
  <>
    Use the{" "}
    <Link href="/help-center" className={linkClass}>
      Help Center
    </Link>{" "}
    if you need setup guidance, documentation, or step-by-step support.
  </>,
  <>
    Read the{" "}
    <Link href="/badges-guide" className={linkClass}>
      Badges Guide
    </Link>{" "}
    and{" "}
    <Link href="/guides" className={linkClass}>
      Guides &amp; Reports
    </Link>{" "}
    to learn how trust is signaled and measured on Tellacity.
  </>,
];

const LEARN_ITEMS = [
  {
    title: "Blog",
    copy: "Practical articles, updates, and insights from the Tellacity team.",
    detail:
      "Short-form updates and practical how-tos for businesses and reviewers following platform news and trust best practices.",
    href: "/blog",
    image: "/Resources/Blog.jpg",
  },
  {
    title: "Guides & Reports",
    copy: "In-depth guides and industry reports to help you grow with trust.",
    detail:
      "Longer-form learning for teams that want deeper context on reputation, reviews, and industry trends—not just quick tips.",
    href: "/guides",
    image: "/Resources/Guides.jpg",
  },
  {
    title: "Badges Guide",
    copy: "Learn what Tellacity badges mean and how they signal trust and transparency.",
    detail:
      "A focused reference for understanding verification badges, credibility signals, and what customers see on business profiles.",
    href: "/badges-guide",
    image: "/Resources/Badges.jpg",
  },
];

const APPLY_ITEMS = [
  {
    title: "Help Center",
    copy: "Find answers, documentation, and step-by-step support.",
    detail:
      "Searchable documentation and guided answers for setup, account questions, and day-to-day use of Tellacity tools.",
    href: "/help-center",
    image: "/brand/Help%20Center.png",
  },
  {
    title: "Integrations",
    copy: "Connect Tellacity with the tools you already use.",
    detail:
      "Overview of connectors and workflows that sync review requests, customer data, and social proof with your existing stack.",
    href: "/integrations",
    image: "/brand/Intergrations.png",
  },
];

const GROW_ITEMS = [
  {
    title: "Customer Stories",
    copy: "See how real businesses build trust and succeed with Tellacity.",
    detail:
      "Real-world examples of how companies collect reviews, respond publicly, and turn trust into measurable growth.",
    href: "/customer-stories",
    image: "/Resources/Customer Stories.jpg",
  },
  {
    title: "Partner Program",
    copy: "Join our partner ecosystem and grow alongside Tellacity.",
    detail:
      "For agencies, platforms, and collaborators who want to extend Tellacity's reputation tools to their own customers and networks.",
    href: "/partner-program",
    image: "/Resources/Partner Program.jpg",
  },
];

export default function ResourcesPage() {
  return (
    <main className="relative bg-gradient-to-b from-[#F4F9F8] to-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(resourcesJsonLd) }}
      />

      <section className="relative mx-auto w-full max-w-7xl px-6 py-16">
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#1FAF9E]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Knowledge &amp; Resources
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[#0E0E0E] md:text-5xl">
            <span className="relative inline-block">
              <span className="relative z-10">Resources Hub</span>
              <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Everything you need to get the most out of Tellacity — from
            understanding trust to applying it in your business.
          </p>
          <p className="mt-3 text-sm text-gray-600">
            Whether you are a business building reputation, a reviewer learning
            how feedback works, or a partner scaling trust tools, this hub
            organises Tellacity content by what you need to learn, apply, and
            grow. New to the platform? Start with{" "}
            <Link href="/how-tellacity-works" className={linkClass}>
              How Tellacity Works
            </Link>{" "}
            or explore{" "}
            <Link href="/for-business" className={linkClass}>
              Tellacity for Business
            </Link>
            .
          </p>
        </div>

        <div className="relative mt-10 rounded-xl border border-[#2fb2a8]/20 bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[#0E0E0E]">
            Featured Resource
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            This section highlights the most useful starting points for new
            users and businesses looking to build trust on Tellacity.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            If you are unsure where to begin, start with the Reputation
            Platform overview—it explains how verified reviews, widgets,
            analytics, and reputation management connect in one system.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-gray-600">
            Businesses evaluating plans can pair that overview with{" "}
            <Link href="/pricing" className={linkClass}>
              pricing
            </Link>{" "}
            and the{" "}
            <Link href="/faq" className={linkClass}>
              FAQ
            </Link>{" "}
            for quick answers on plans and policies.
          </p>
          <Link
            href="/reputation-platform"
            className="mt-6 inline-flex items-center rounded-lg bg-black px-5 py-2 text-sm font-medium text-white shadow transition-opacity hover:opacity-90"
          >
            Explore featured content
          </Link>
        </div>

        <div className="relative mt-10 rounded-xl border border-gray-200 bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[#0E0E0E]">
            Recommended path
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Not sure which resource to open first? Follow this short path to
            build context before diving into specific tools or guides.
          </p>
          <ul className="mt-4 max-w-2xl list-disc space-y-3 pl-5 text-sm text-gray-600">
            {RECOMMENDED_PATH.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>

        <div className="relative mt-10 overflow-hidden rounded-xl border border-[#1FAF9E]/20 bg-gradient-to-r from-[#0E3B36] via-[#0F766E] to-[#1FAF9E] p-8 text-white shadow-md">
          <h2 className="text-xl font-semibold sm:text-2xl">
            Explore the Platform
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-white/90">
            The Tellacity Reputation Platform is the central system for verified
            customer trust. Review invitations, on-site widgets, analytics,
            reputation management, and photo uploads are designed to work
            together—not as disconnected add-ons.
          </p>
          <p className="mt-3 max-w-2xl text-sm text-white/90">
            Understanding the platform first makes every other resource in this
            hub easier to use, from integrations to badges to customer stories.
          </p>
          <h3 className="mt-6 text-base font-semibold text-white">
            The Tellacity Reputation Platform
          </h3>
          <p className="mt-2 max-w-2xl text-sm text-white/90">
            A central system for verified customer trust, review invitations,
            widgets, analytics, reputation management, and photo uploads.
          </p>
          <Link
            href="/reputation-platform"
            className="mt-6 inline-flex items-center rounded-lg bg-white px-5 py-2 text-sm font-medium text-[#0F766E] shadow transition-opacity hover:opacity-90"
          >
            Explore the platform →
          </Link>
        </div>

        <section className="relative mt-10 block overflow-hidden rounded-xl shadow-md">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000"
            alt="Customer trust and review insights"
            className="h-[280px] w-full object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h2 className="text-xl font-semibold sm:text-2xl">
              Customer Trust &amp; Review Insights
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/90">
              Guides, research, and practical insights on customer reviews,
              reputation, and feedback transparency.
            </p>
          </div>
        </section>
        <div className="relative mt-4 max-w-3xl space-y-3 text-sm text-gray-600">
          <p>
            This area covers how customer reviews, reputation signals, and
            feedback transparency work on Tellacity—written for readers who
            want practical, research-oriented context, not marketing slogans.
          </p>
          <p>
            Use it alongside{" "}
            <Link href="/safety-trust" className={linkClass}>
              Safety &amp; Trust
            </Link>
            ,{" "}
            <Link href="/reviewer-guidelines" className={linkClass}>
              reviewer guidelines
            </Link>
            , and the guides below when you need to understand how feedback is
            verified, moderated, and displayed fairly.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-16 border-t border-gray-100 px-6 pb-16 pt-12">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">
            Learn &amp; Understand
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Build clarity around reviews, trust, and transparency with content
            you can read at your own pace.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            The <strong className="font-semibold text-[#0E0E0E]">Blog</strong>{" "}
            is best for practical articles and platform updates.{" "}
            <strong className="font-semibold text-[#0E0E0E]">
              Guides &amp; Reports
            </strong>{" "}
            suit deeper learning and industry context. The{" "}
            <strong className="font-semibold text-[#0E0E0E]">
              Badges Guide
            </strong>{" "}
            explains what trust badges mean on profiles. Choose the format that
            matches your time—quick updates or in-depth guidance.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {LEARN_ITEMS.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden rounded-t-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                  <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-sm font-medium text-white shadow transition hover:opacity-90"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">
            Apply &amp; Use
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Put Tellacity into action in your business with documentation and
            integrations.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            The Help Center is your first stop for documentation, setup steps, and
            support-style answers. Integrations explain how Tellacity connects
            to CRM, ecommerce, automation, and communication tools you already
            use—so review collection fits your workflow instead of adding manual
            work.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            For policy and billing questions beyond documentation, see the{" "}
            <Link href="/faq" className={linkClass}>
              FAQ
            </Link>{" "}
            or{" "}
            <Link href="/help-center" className={linkClass}>
              Help Center
            </Link>
            .
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {APPLY_ITEMS.map((item) => (
              <div
                key={item.title}
                className="group overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden rounded-t-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                  <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-sm font-medium text-white shadow transition hover:opacity-90"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">
            Grow &amp; Partner
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Scale credibility and expand your impact with proof and partnerships.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Customer Stories show how real businesses use Tellacity to build
            trust and improve outcomes—useful when you want credibility from
            peers, not just product descriptions. The Partner Program is for
            agencies and platforms that want to grow alongside Tellacity and
            extend reputation tools to their own clients.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Both sections are helpful when you are scaling impact beyond a
            single profile or evaluating Tellacity for a wider rollout. See{" "}
            <Link href="/for-business" className={linkClass}>
              Tellacity for Business
            </Link>{" "}
            and{" "}
            <Link href="/pricing" className={linkClass}>
              pricing
            </Link>{" "}
            for plan context.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {GROW_ITEMS.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden rounded-t-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                  <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                  <Link
                    href={item.href}
                    className="mt-4 inline-block rounded-lg bg-black px-5 py-2 text-sm font-medium text-white shadow transition hover:opacity-90"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-[#F7F8FA] p-8">
          <p className="max-w-3xl text-sm text-gray-600">
            Tellacity&apos;s resources work alongside our{" "}
            <Link href="/safety-trust" className={linkClass}>
              trust
            </Link>
            ,{" "}
            <Link href="/help-center" className={linkClass}>
              support
            </Link>
            , and{" "}
            <Link href="/for-business" className={linkClass}>
              business
            </Link>{" "}
            pages. Explore the{" "}
            <Link href="/reputation-platform" className={linkClass}>
              Reputation Platform
            </Link>
            , browse the{" "}
            <Link href="/blog" className={linkClass}>
              blog
            </Link>
            , or visit{" "}
            <Link href="/integrations" className={linkClass}>
              integrations
            </Link>{" "}
            and{" "}
            <Link href="/customer-stories" className={linkClass}>
              customer stories
            </Link>{" "}
            or the{" "}
            <Link href="/partner-program" className={linkClass}>
              partner program
            </Link>{" "}
            when you are ready to go deeper.
          </p>
        </div>
      </section>
    </main>
  );
}
