import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

const PAGE_URL = "https://tellacity.com/how-tellacity-works";

export const metadata: Metadata = {
  title: "How Tellacity Works | Customer Reviews & Reputation Management Platform",
  description:
    "Learn how Tellacity works as a customer reviews and feedback platform and reputation management platform with verified reviews, trust signals, and business responses.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "How Tellacity Works | Customer Reviews & Reputation Management Platform",
    description:
      "Learn how Tellacity works as a customer reviews and feedback platform and reputation management platform with verified reviews, trust signals, and business responses.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "How Tellacity Works | Customer Reviews & Reputation Management Platform",
    description:
      "Learn how Tellacity works as a customer reviews and feedback platform and reputation management platform with verified reviews, trust signals, and business responses.",
  },
  robots: { index: true, follow: true },
};

const howItWorksJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "How Tellacity Works | Customer Reviews & Reputation Management Platform",
  description:
    "Learn how Tellacity works as a customer reviews and feedback platform and reputation management platform with verified reviews, trust signals, and business responses.",
  url: PAGE_URL,
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
        name: "How Tellacity Works",
        item: PAGE_URL,
      },
    ],
  },
};

const linkClass =
  "font-medium text-[#0E3B36] underline underline-offset-2 hover:text-[#1FAF9E]";

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to use Tellacity to write and discover trustworthy reviews",
  description:
    "The six-step Tellacity flow that connects search, reviews, verification, business response, and community impact.",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Search for businesses",
      text: "Search Tellacity for businesses in any category and country, and view their verified reviews and Trust Score before deciding.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Read Reviews",
      text: "Read verified, moderated customer reviews to learn what real customers actually experienced.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Write a Review",
      text: "Share an honest review with rating, title, and details, optionally attaching proof of purchase.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Review Verification",
      text: "Tellacity verifies reviews against identity signals, proof of purchase, fraud detection, and manual moderation.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Business Collaboration",
      text: "Businesses claim their profile and respond publicly to reviews, resolving issues in the open.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Community Impact",
      text: "Verified reviews update the Trust Score and feed back into search, helping the next customer choose with confidence.",
    },
  ],
};

const verificationItems = [
  {
    title: "Proof of Purchase",
    description:
      "Reviewers can upload receipts, invoices, or order numbers to verify real experiences. Tying each review to a transaction is what prevents bulk fake reviews from drowning out genuine customer voices.",
  },
  {
    title: "Identity Verification",
    description:
      "Accounts are tied to real people to reduce abuse and improve accountability. Real-person accounts make spam, throwaway profiles, and coordinated attacks far harder to pull off.",
  },
  {
    title: "Suspicious Activity Checks",
    description:
      "Automated checks flag unusual patterns, duplicate behavior, and spam. Reviews that look orchestrated, copied, or unusually timed are surfaced for closer inspection before they shape a business's reputation.",
  },
  {
    title: "Photo & Video Evidence",
    description:
      "Optional uploads add context and strengthen the credibility of reviews. Visual proof helps future customers see what the experience actually looked like, not just what it sounded like.",
  },
  {
    title: "Manual Moderation",
    description:
      "Our team reviews disputed content under clear and fair guidelines. Humans handle edge cases that automated systems can't fully judge, including nuanced complaints, retaliation claims, and policy interpretations.",
  },
  {
    title: "AI Fraud Detection",
    description:
      "Advanced systems identify manipulation attempts and protect integrity. Machine-learning models continuously watch for patterns that signal review fraud, paid reviews, or coordinated review bombing.",
  },
];

const trustScoreItems = [
  {
    title: "Review Volume",
    description:
      "A healthy number of reviews provides a balanced view of experiences.",
    measures:
      "How many verified reviews a business has accumulated over time.",
    whyItMatters:
      "More reviews mean fewer outliers and a more reliable picture of what customers actually experience.",
  },
  {
    title: "Review Velocity",
    description:
      "Recent, consistent activity signals an active and trusted business.",
    measures:
      "How frequently new verified reviews are added relative to the business's size.",
    whyItMatters:
      "Recent activity shows the reputation is current, not coasting on old wins or hiding new problems.",
  },
  {
    title: "Review Quality",
    description:
      "Detailed feedback improves usefulness and raises confidence.",
    measures:
      "The depth, specificity, and length of the average verified review.",
    whyItMatters:
      "Detailed feedback gives consumers context and gives businesses something concrete to act on.",
  },
  {
    title: "Verification Rate",
    description:
      "Verified reviews carry more weight and improve overall trust.",
    measures:
      "The share of reviews that include proof of purchase or other verification signals.",
    whyItMatters:
      "Higher verification rates indicate that the reputation is built on real transactions, not anonymous claims.",
  },
  {
    title: "Response Rate",
    description:
      "Public replies show accountability and a commitment to customers.",
    measures:
      "How often the business publicly responds to reviews, both positive and negative.",
    whyItMatters:
      "Engaged businesses signal that they take customer feedback seriously, which builds long-term trust.",
  },
  {
    title: "Verified vs Unverified Mix",
    description:
      "A strong verified share indicates real customer activity.",
    measures:
      "The ratio of verified reviews to unverified ones across the full review history.",
    whyItMatters:
      "A healthy verified share shows the reputation comes from real customers, not bots or anonymous campaigns.",
  },
];

const consumerSteps = [
  {
    title: "Write a review",
    description:
      "Use Tellacity's simple, guided form to share a verified review. Clear prompts for rating, title, and details reduce friction so honest feedback only takes a minute.",
  },
  {
    title: "Submit proof",
    description:
      "Add a receipt, invoice, or order ID to show this was a real experience. Verified reviews carry more weight and help future customers trust what they read.",
  },
  {
    title: "Read trusted feedback",
    description:
      "Filter and sort reviews by recency, rating, and verification. Trust signals like the verified badge and Trust Score help you focus on the feedback that matters.",
  },
  {
    title: "Explore transparent ratings",
    description:
      "Use the Trust Score and category comparisons to weigh businesses side by side. Transparent factors mean you can see why a score is high or low, not just the number.",
  },
  {
    title: "Contribute to trust",
    description:
      "Every honest review you write improves the platform for other customers. Your verified feedback also nudges businesses to keep improving.",
  },
];

const businessSteps = [
  {
    title: "Claim your business",
    description:
      "Find your business on Tellacity and claim it with secure verification. Once claimed, you control how your profile presents your reputation to new customers.",
  },
  {
    title: "Set up your profile",
    description:
      "Add a clear description, accurate categories, contact details, photos, and links. Complete profiles convert better and rank more confidently in search.",
  },
  {
    title: "Request reviews",
    description:
      "Invite customers right after a purchase, booking, or service. Well-timed, verified invitations are the single biggest lever for collecting trustworthy reviews.",
  },
  {
    title: "Respond to feedback",
    description:
      "Use threaded replies to thank promoters and resolve issues in public. Open responses show prospects how you handle praise and complaints alike.",
  },
  {
    title: "Improve engagement",
    description:
      "Turn recurring feedback themes into product, service, and operational changes. Closing the loop publicly turns one customer's complaint into the next customer's confidence.",
  },
  {
    title: "Build and showcase trust",
    description:
      "Display your Trust Score and verified reviews via dashboards, widgets, and SEO-ready content. The Tellacity Reputation Management Platform helps you showcase verified reputation where future customers are searching.",
  },
];

const platformIncludes = [
  {
    title: "Public business profile",
    detail:
      "Verified reviews, Trust Score, photos, and business details in one place customers and search systems can cite.",
  },
  {
    title: "Review submission form",
    detail:
      "A guided path for ratings, narrative feedback, and optional proof of purchase.",
  },
  {
    title: "Business dashboard",
    detail:
      "Review inbox, replies, sentiment, and trust performance in one workspace.",
  },
  {
    title: "Trust Score",
    detail:
      "A transparent summary of reputation based on six explicit factors, not a hidden black box.",
  },
  {
    title: "Verification system",
    detail:
      "Overlapping checks for identity, proof, fraud, moderation, and policy compliance.",
  },
  {
    title: "Widgets and analytics",
    detail:
      "Embed verified proof on your site and measure trends from the same verified pipeline.",
  },
];

const feedbackLoopStages = [
  {
    title: "Customers",
    detail:
      "People share real experiences through Tellacity's customer reviews and feedback platform, honest input is where the loop starts.",
  },
  {
    title: "Reviews",
    detail:
      "Feedback enters verification and moderation so only authentic, policy-compliant reviews shape public reputation.",
  },
  {
    title: "Business response",
    detail:
      "Teams reply publicly, resolve issues, and show accountability, reputation is managed, not ignored.",
  },
  {
    title: "Trust score",
    detail:
      "Verified signals update the Trust Score so discovery reflects current, defensible reputation.",
  },
  {
    title: "Community",
    detail:
      "The next customer searches with better context; businesses improve; the marketplace becomes more transparent over time.",
  },
];

const stepFlowItems = [
  {
    title: "Search",
    text: "Find businesses and view verified feedback.",
    icon: "search",
    detail:
      "Search Tellacity for a business by name, category, or country to land on a profile with verified reviews, Trust Score, and details.",
    whyItMatters:
      "Discovery built on verified reviews means buying decisions start from real customer experience, not paid placement.",
  },
  {
    title: "Read Reviews",
    text: "Learn from real customer experiences.",
    icon: "star",
    detail:
      "Browse moderated, verified reviews to see what customers actually experienced, with filters for rating, recency, and verification.",
    whyItMatters:
      "Reading honest reviews before you buy turns guesswork into informed choice and pushes businesses to keep performing.",
  },
  {
    title: "Write a Review",
    text: "Share honest feedback to help others.",
    icon: "pencil",
    detail:
      "Submit a review with a rating, title, body, and optional proof of purchase, all from a single guided form.",
    whyItMatters:
      "Every verified review shapes the next customer's decision and gives the business signal it can actually act on.",
  },
  {
    title: "Review Verification",
    text: "Reviews are checked for authenticity and compliance.",
    icon: "shield",
    detail:
      "Tellacity checks each review against identity signals, proof of purchase, fraud detection, and manual moderation when needed.",
    whyItMatters:
      "Verification is what makes the reputation worth trusting and what stops fake reviews from misleading consumers.",
  },
  {
    title: "Business Collaboration",
    text: "Businesses can respond and resolve issues transparently.",
    icon: "chat",
    detail:
      "Businesses claim their profile, respond publicly to reviews, and resolve issues directly with customers in threaded replies.",
    whyItMatters:
      "Open responses turn complaints into proof of accountability, which raises trust even when individual reviews are critical.",
  },
  {
    title: "Community Impact",
    text: "Trusted feedback helps everyone make better decisions.",
    icon: "globe",
    detail:
      "Verified reviews update the Trust Score and category rankings, then feed back into search and discovery for the next customer.",
    whyItMatters:
      "When every review changes how businesses are discovered, the whole market becomes more transparent over time.",
  },
];

function HeroStepArrow() {
  return (
    <svg
      className="h-5 w-5 flex-shrink-0 text-[#1FAF9E] sm:h-6 sm:w-6"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 7l5 5m0 0l-5 5m5-5H6"
      />
    </svg>
  );
}

function HeroIllustration() {
  const steps = [
    { num: 1, filled: false },
    { num: 2, filled: false },
    { num: 3, filled: false },
    { num: 4, filled: true },
  ] as const;

  return (
    <div className="relative flex items-center justify-center rounded-2xl bg-[#0E3B36]/5 p-6 sm:p-8">
      <div className="flex items-center gap-2 sm:gap-4">
        {steps.map((step, index) => (
          <div key={step.num} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0E3B36] text-xs font-bold text-white sm:h-8 sm:w-8 sm:text-sm">
                {step.num}
              </span>
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full sm:h-14 sm:w-14 ${
                  step.filled
                    ? "bg-[#1FAF9E] text-white"
                    : "bg-[#1FAF9E]/20 text-[#0E3B36]"
                }`}
              >
                {step.num === 1 && (
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                )}
                {step.num === 2 && (
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                )}
                {step.num === 3 && (
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21m-6-18v18m-6-13.5V21" />
                  </svg>
                )}
                {step.num === 4 && (
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.926.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a6.726 6.726 0 012.748 1.35m7.172 0H21M3.75 18.75h.007v.008H3.75v-.008zm.375 0h.008v.008h-.008V18.75zm.375 0h.008v.008h-.008V18.75z" />
                  </svg>
                )}
              </div>
            </div>
            {index < steps.length - 1 && <HeroStepArrow />}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HowTellacityWorksPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howItWorksJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      {/* SECTION 1 - HERO VISUAL */}
      <section className="bg-[#E8F5F3] py-16 lg:py-24">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-1 gap-12 items-center lg:grid-cols-2">
            <div>
              <h1 className="text-4xl font-semibold text-[#0E3B36] sm:text-5xl">
                How Tellacity Works
              </h1>
              <p className="mt-4 max-w-xl text-base text-gray-600">
                Tellacity makes it easy to share and discover real experiences. Our
                verification process, transparent policies, and fair moderation keep
                the platform trustworthy for everyone.
              </p>
              <p className="mt-3 max-w-xl text-sm text-gray-600">
                This page explains how consumers and businesses interact with
                Tellacity, from discovery to verified feedback and trust
                signals.
              </p>
              <div className="mt-8">
                <Link
                  href="/write-review"
                  className="inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#1FAF9E]/25 transition hover:bg-[#169786]"
                >
                  Write a Review
                </Link>
              </div>
            </div>
            <div className="relative">
              <HeroIllustration />
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2 - FROM SEARCH TO TRUST */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            From search to trust
          </h2>
          <div className="mx-auto mt-3 max-w-3xl space-y-3 text-center text-sm text-gray-600">
            <p>
              Six steps connect customers, reviews, and businesses on Tellacity,
              from the first search to the verified feedback that updates trust
              signals. Each step adds authenticity so reputation becomes more
              reliable, not just louder.
            </p>
            <p>
              This journey is the backbone of the customer reviews and feedback
              platform: discovery, reading, writing, verification, business
              collaboration, and community impact all feed the same trust
              infrastructure.
            </p>
          </div>
          <div className="mt-10 overflow-hidden rounded-3xl bg-gray-100">
            <Image
              src="/brand/How%20it%20Works.jpeg"
              alt="How it Works"
              width={1376}
              height={768}
              className="h-auto w-full object-cover"
            />
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stepFlowItems.map((item, index) => (
              <div
                key={`detail-${item.title}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:border-[#1FAF9E]/30 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#1FAF9E]">
                  Step {index + 1}
                </p>
                <h3 className="mt-1 text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
                <p className="mt-2 text-xs text-gray-500">
                  <span className="font-semibold text-[#0E3B36]">Why it matters:</span>{" "}
                  {item.whyItMatters}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 - PRODUCT PREVIEW: Inside Tellacity */}
      <section className="bg-[#F9F9F9] py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-12">
            <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
              <Image
                src="/brand/Inside%20Tellacity.png"
                alt="Inside Tellacity"
                width={530}
                height={699}
                className="h-auto w-full object-cover"
              />
            </div>
            <div className="flex flex-col justify-center text-left">
              <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
                Inside Tellacity
              </h2>
              <div className="mt-3 space-y-3 text-sm text-gray-600 sm:text-base">
                <p>
                  See the three surfaces customers and businesses actually use:
                  the public business profile, the review submission form, and
                  the business dashboard. Together they turn customer experience
                  into verified reputation.
                </p>
                <p>
                  Consumers mostly interact with profiles and the review form.
                  Businesses live in the dashboard, where the{" "}
                  <Link href="/reputation-platform" className={linkClass}>
                    Tellacity Reputation Management Platform
                  </Link>{" "}
                  connects responses, analytics, and widgets to the same
                  verified review pipeline.
                </p>
              </div>
              <div className="mt-8 space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    Business profile page
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    A public profile shows verified reviews, the Trust Score,
                    ratings, photos, and business details in one place.
                    Customers use it to decide who to trust, and search
                    engines and LLMs use it as a structured source about the
                    business.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    Review submission
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    A guided form captures a title, body, star rating, and
                    optional proof of purchase. Every submission flows into
                    Tellacity's verification system so genuine reviews are
                    surfaced and fraudulent ones are caught before they
                    shape a business's reputation.
                  </p>
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#0E0E0E]">
                    Business dashboard
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">
                    Owners get a review inbox, response tools, sentiment
                    trends, and the live Trust Score in one workspace.
                    That dashboard is how reputation management becomes
                    an operational habit instead of a once-a-quarter
                    fire drill.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            How the reputation management platform fits in
          </h2>
          <div className="mt-4 max-w-3xl space-y-3 text-sm text-gray-600 sm:text-base">
            <p>
              The{" "}
              <Link href="/reputation-platform" className={linkClass}>
                Tellacity Reputation Management Platform
              </Link>{" "}
              underpins the entire feedback loop. It wires verified reviews into
              dashboards, widgets, analytics, and automation that businesses use
              every day, not as separate tools, but as one system.
            </p>
            <p>
              When a review is verified, it can flow to public profiles, embeddable
              widgets, business responses, and trust metrics without manual
              reconciliation. That is how feedback becomes operational reputation
              management instead of a static rating.
            </p>
            <p>
              Consumers still experience Tellacity as a customer reviews and
              feedback platform. Businesses use the reputation management platform
              to act on what customers say, see{" "}
              <Link href="/for-business" className={linkClass}>
                Tellacity for Business
              </Link>{" "}
              and{" "}
              <Link href="/pricing" className={linkClass}>
                pricing
              </Link>{" "}
              for how teams get started.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#F9F9F9] py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            What Tellacity includes
          </h2>
          <div className="mt-4 max-w-3xl space-y-3 text-sm text-gray-600 sm:text-base">
            <p>
              Tellacity is both a public discovery experience and a reputation
              management system. These are the major product surfaces that connect
              reviews, verification, trust signals, and business tools.
            </p>
          </div>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {platformIncludes.map((item) => (
              <li
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{item.detail}</p>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm text-gray-600">
            Explore the full platform on the{" "}
            <Link href="/reputation-platform" className={linkClass}>
              Reputation Management Platform
            </Link>{" "}
            page or browse{" "}
            <Link href="/resources" className={linkClass}>
              resources
            </Link>{" "}
            and the{" "}
            <Link href="/blog" className={linkClass}>
              blog
            </Link>
            .
          </p>
        </div>
      </section>

      {/* For Consumers / For Businesses */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0E3B36] sm:text-2xl">
                For consumers
              </h2>
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <p>
                  Tellacity is built for people who want honest context before
                  they buy. These five steps show how consumers write, verify,
                  and rely on feedback on the customer reviews and feedback
                  platform.
                </p>
                <p>
                  Verification and trust signals help you focus on reviews that
                  reflect real experiences, not noise or manipulation.
                </p>
              </div>
              <ul className="mt-5 space-y-4">
                {consumerSteps.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1FAF9E]"
                      aria-hidden
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-[#0E0E0E]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <Link
                href="/write-review"
                className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a2d29]"
              >
                Write a Review
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#0E3B36] sm:text-2xl">
                For businesses
              </h2>
              <div className="mt-2 space-y-2 text-sm text-gray-600">
                <p>
                  Six steps to claim, grow, and showcase verified reputation
                  through the{" "}
                  <Link href="/reputation-platform" className={linkClass}>
                    Tellacity Reputation Management Platform
                  </Link>
                  . This is how businesses act on real-world feedback, not just
                  collect stars.
                </p>
                <p>
                  Dashboards, invitations, public replies, and widgets share one
                  verified pipeline so your team sees the same truth customers
                  see on your profile.
                </p>
              </div>
              <ul className="mt-5 space-y-4">
                {businessSteps.map((item) => (
                  <li key={item.title} className="flex gap-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-[#1FAF9E]"
                      aria-hidden
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-[#0E0E0E]">
                        {item.title}
                      </h3>
                      <p className="mt-1 text-xs text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="mt-6 flex flex-wrap gap-2">
                <Link
                  href="/for-business"
                  className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a2d29]"
                >
                  Tellacity for Business
                </Link>
                <Link
                  href="/business/claim"
                  className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-4 py-2 text-xs font-semibold text-[#0E3B36] hover:bg-[#0E3B36]/5"
                >
                  Claim Your Business
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4 - VERIFICATION SYSTEM (visual trust badges) */}
      <section className="bg-gray-50 py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-6xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            The verification system
          </h2>
          <div className="mx-auto mt-3 max-w-3xl space-y-3 text-sm text-gray-600">
            <p>
              Tellacity uses multiple overlapping layers to protect authenticity
              and fairness. Each safeguard targets a different way fake or
              manipulated reviews can slip through.
            </p>
            <p>
              Verification is what makes the customer reviews and feedback
              platform worth trusting, and what keeps the reputation management
              platform defensible for businesses. Read our{" "}
              <Link href="/reviewer-guidelines" className={linkClass}>
                reviewer guidelines
              </Link>{" "}
              and{" "}
              <Link href="/safety-trust" className={linkClass}>
                Safety &amp; Trust
              </Link>{" "}
              pages for policy detail.
            </p>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {verificationItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm transition hover:shadow-md hover:border-[#1FAF9E]/30"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#1FAF9E] text-white">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-[#0E0E0E]">{item.title}</h3>
                <p className="mt-2 text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - TRUST SCORE VISUALIZATION */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
              How the Trust Score works
            </h2>
            <div className="mt-3 space-y-3 text-sm text-gray-600">
              <p>
                The Trust Score is a single, transparent number that summarizes
                reputation on Tellacity. It is calculated from six explicit
                factors, not a hidden algorithm, so businesses know what drives
                the score and customers know what it reflects.
              </p>
              <p>
                The score emphasizes current, verified reputation: recency,
                verification rate, and response behavior matter alongside volume
                and quality. It is designed to reflect how the business is doing
                now, not only historical averages from years ago.
              </p>
            </div>
          </div>
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="text-4xl font-bold text-[#0E3B36]">
              4.3{" "}
              <span className="text-2xl font-normal text-gray-400">/ 5</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">Trust Score</p>
            <div className="mt-8 space-y-4 text-left">
              {trustScoreItems.map((item, i) => (
                <div key={item.title}>
                  <div className="flex justify-between text-xs">
                    <h3 className="font-medium text-[#0E0E0E]">
                      {item.title}
                    </h3>
                    <span className="text-gray-500">
                      {[72, 85, 78, 90, 88, 82][i] ?? 80}%
                    </span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#1FAF9E]"
                      style={{
                        width: `${[72, 85, 78, 90, 88, 82][i] ?? 80}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trust Score factors explained */}
          <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trustScoreItems.map((item) => (
              <div
                key={`tsd-${item.title}`}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left shadow-sm"
              >
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-[#0E3B36]">
                    What it measures:
                  </span>{" "}
                  {item.measures}
                </p>
                <p className="mt-2 text-xs text-gray-600">
                  <span className="font-semibold text-[#0E3B36]">
                    Why it matters:
                  </span>{" "}
                  {item.whyItMatters}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      <section className="bg-gray-50 py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-5xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            The feedback loop
          </h2>
          <div className="mx-auto mt-3 max-w-3xl space-y-3 text-sm text-gray-600">
            <p>
              Customer experiences flow into reviews, business responses, updated
              trust signals, and community benefit. The loop is transparent by
              design, it improves the whole marketplace over time, not just one
              listing at a time.
            </p>
            <p>
              Each stage below shows how the customer reviews and feedback
              platform and reputation management platform stay connected.
            </p>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {[
              { label: "Customers", icon: "person" },
              { label: "Reviews", icon: "doc" },
              { label: "Business response", icon: "chat" },
              { label: "Trust score", icon: "shield" },
              { label: "Community", icon: "globe" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-2 sm:gap-4">
                <div className="flex flex-col items-center rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1FAF9E]/15 text-[#0E3B36]">
                    {item.icon === "person" && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>}
                    {item.icon === "doc" && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
                    {item.icon === "chat" && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>}
                    {item.icon === "shield" && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>}
                    {item.icon === "globe" && <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" /></svg>}
                  </div>
                  <span className="mt-2 text-xs font-medium text-[#0E0E0E]">{item.label}</span>
                </div>
                {i < 4 && <svg className="h-5 w-5 flex-shrink-0 text-[#1FAF9E] sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>}
              </div>
            ))}
          </div>
          <div className="mt-10 grid gap-4 text-left sm:grid-cols-2 lg:grid-cols-3">
            {feedbackLoopStages.map((stage) => (
              <div
                key={stage.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {stage.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{stage.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 7 - REAL REVIEW EXAMPLE */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-2xl px-6">
          <h2 className="text-center text-2xl font-semibold text-[#0E3B36]">
            What a verified review looks like
          </h2>
          <div className="mt-3 space-y-3 text-center text-sm text-gray-600">
            <p>
              &ldquo;Verified&rdquo; on Tellacity means the reviewer has a real
              account, the review passed our verification system, and (where
              applicable) proof of purchase is on file.
            </p>
            <p>
              Verified reviews weigh more heavily in the Trust Score and carry
              more credibility with consumers and systems that surface structured
              review information, because the structure is visible, not assumed.
            </p>
          </div>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 text-left">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              Verified review structure
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Every verified review on Tellacity carries the same
              transparent structure: a star rating, a clear title, a
              detailed body, the reviewer's verified identity, the
              business it relates to, and the verified badge. Each
              element is part of why customers (and search engines) can
              trust what they see.
            </p>
          </div>
          <h3 className="mt-10 text-center text-base font-semibold text-[#0E0E0E]">
            Example: Verified review for a business
          </h3>
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/50">
            <div className="flex gap-1 text-[#1FAF9E]">
              {[1, 2, 3, 4, 5].map((i) => (
                <svg key={i} className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
              ))}
            </div>
            <p className="mt-3 text-lg font-medium text-[#0E0E0E]">&ldquo;Great service and fast support.&rdquo;</p>
            <p className="mt-2 text-sm text-gray-600">- Verified Customer</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">Verified review</span>
              <span className="text-xs text-gray-500">Example Business Ltd</span>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#F9F9F9] py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-5xl px-6">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            Why this matters
          </h2>
          <div className="mt-4 max-w-3xl space-y-3 text-sm text-gray-600 sm:text-base">
            <p>
              Verified reviews, transparent moderation, and trust signals matter
              because buying decisions should not depend on manipulated ratings or
              stale scores. Tellacity makes reputation legible, for consumers
              choosing a provider and for businesses improving service.
            </p>
            <p>
              The customer reviews and feedback platform gives the public an
              honest view of real experiences. The Tellacity Reputation Management
              Platform gives businesses the tools to respond, measure, and
              publish verified proof consistently.
            </p>
            <p>
              Together they connect discovery, verification, response, and
              analytics in one trust-oriented system. Learn more on{" "}
              <Link href="/about" className={linkClass}>
                About Tellacity
              </Link>
              , read{" "}
              <Link href="/business-guidelines" className={linkClass}>
                business guidelines
              </Link>
              , or visit the{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>
              .
            </p>
          </div>
          <p className="mt-8 text-sm text-gray-600">
            Tellacity&apos;s how-it-works page connects the consumer experience,
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
            <Link href="/resources" className={linkClass}>
              resources
            </Link>
            ,{" "}
            <Link href="/blog" className={linkClass}>
              blog
            </Link>
            ,{" "}
            <Link href="/reviewer-guidelines" className={linkClass}>
              reviewer guidelines
            </Link>
            ,{" "}
            <Link href="/safety-trust" className={linkClass}>
              Safety &amp; Trust
            </Link>
            , and{" "}
            <Link href="/contact" className={linkClass}>
              contact
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-gradient-to-r from-teal-500 to-emerald-600 py-20 lg:py-24">
        <div className="mx-auto w-full max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-semibold text-white sm:text-4xl">
            Ready to share your experience?
          </h2>
          <p className="mt-4 text-white/90">
            Join thousands of people helping others make better decisions.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              href="/write-review"
              className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-[#0E3B36] shadow-lg transition hover:bg-gray-50"
            >
              Write a Review
            </Link>
            <Link
              href="/business/claim"
              className="inline-flex items-center justify-center rounded-full border-2 border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Claim Your Business
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
