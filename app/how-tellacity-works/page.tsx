import Link from "next/link";

const verificationItems = [
  {
    title: "Proof of Purchase",
    description:
      "Reviewers can upload receipts, invoices, or order numbers to verify real experiences.",
  },
  {
    title: "Identity Verification",
    description:
      "Accounts are tied to real people to reduce abuse and improve accountability.",
  },
  {
    title: "Suspicious Activity Checks",
    description:
      "Automated checks flag unusual patterns, duplicate behavior, and spam.",
  },
  {
    title: "Photo & Video Evidence",
    description:
      "Optional uploads add context and strengthen the credibility of reviews.",
  },
  {
    title: "Manual Moderation",
    description:
      "Our team reviews disputed content under clear and fair guidelines.",
  },
  {
    title: "AI Fraud Detection",
    description:
      "Advanced systems identify manipulation attempts and protect integrity.",
  },
];

const trustScoreItems = [
  { title: "Review Volume", description: "A healthy number of reviews provides a balanced view of experiences." },
  { title: "Review Velocity", description: "Recent, consistent activity signals an active and trusted business." },
  { title: "Review Quality", description: "Detailed feedback improves usefulness and raises confidence." },
  { title: "Verification Rate", description: "Verified reviews carry more weight and improve overall trust." },
  { title: "Response Rate", description: "Public replies show accountability and a commitment to customers." },
  { title: "Verified vs Unverified Mix", description: "A strong verified share indicates real customer activity." },
];

const feedbackLoop = [
  "Customers share experiences",
  "Businesses respond and improve",
  "Trust indicators update automatically",
  "Community benefits from transparency",
];

const consumerSteps = [
  "Write a review",
  "Submit proof",
  "Read trusted feedback",
  "Explore transparent ratings",
  "Contribute to trust",
];

const businessSteps = [
  "Claim your business",
  "Set up your profile",
  "Request reviews",
  "Respond to feedback",
  "Improve engagement",
  "Build and showcase trust",
];

const stepFlowItems = [
  { title: "Search", text: "Find businesses and view verified feedback.", icon: "search" },
  { title: "Read Reviews", text: "Learn from real customer experiences.", icon: "star" },
  { title: "Write a Review", text: "Share honest feedback to help others.", icon: "pencil" },
  { title: "Review Verification", text: "Reviews are checked for authenticity and compliance.", icon: "shield" },
  { title: "Business Collaboration", text: "Businesses can respond and resolve issues transparently.", icon: "chat" },
  { title: "Community Impact", text: "Trusted feedback helps everyone make better decisions.", icon: "globe" },
];

function HeroIllustration() {
  return (
    <div className="relative flex items-center justify-center p-6">
      <div className="flex items-center gap-2 sm:gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1FAF9E]/20 text-[#0E3B36] sm:h-14 sm:w-14">
          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </div>
        <svg className="h-5 w-5 flex-shrink-0 text-[#1FAF9E] sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1FAF9E]/20 text-[#0E3B36] sm:h-14 sm:w-14">
          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>
        <svg className="h-5 w-5 flex-shrink-0 text-[#1FAF9E] sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1FAF9E]/20 text-[#0E3B36] sm:h-14 sm:w-14">
          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21m-6-18v18m-6-13.5V21" />
          </svg>
        </div>
        <svg className="h-5 w-5 flex-shrink-0 text-[#1FAF9E] sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1FAF9E] text-white sm:h-14 sm:w-14">
          <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.926.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 002.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a6.726 6.726 0 012.748 1.35m7.172 0H21M3.75 18.75h.007v.008H3.75v-.008zm.375 0h.008v.008h-.008V18.75zm.375 0h.008v.008h-.008V18.75z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function StepIcon({ name }: { name: string }) {
  const className = "h-8 w-8 sm:h-10 sm:w-10";
  if (name === "search")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    );
  if (name === "star")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
      </svg>
    );
  if (name === "pencil")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
      </svg>
    );
  if (name === "shield")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
      </svg>
    );
  if (name === "chat")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
      </svg>
    );
  if (name === "globe")
    return (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
      </svg>
    );
  return null;
}

export default function HowTellacityWorksPage() {
  return (
    <main className="bg-white">
      {/* SECTION 1 - HERO VISUAL */}
      <section className="bg-[#F9F9F9] py-16 lg:py-24">
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

      {/* SECTION 2 - STEP FLOW TIMELINE */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            From search to trust
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600">
            Six steps that connect customers, reviews, and businesses.
          </p>
          <div className="mt-12 overflow-x-auto pb-4">
            <div className="flex min-w-max flex-col gap-8 md:flex-row md:items-stretch md:gap-0 md:min-w-0">
              {stepFlowItems.map((item, index) => (
                <div key={item.title} className="flex flex-col items-center md:flex-1 md:flex-row md:justify-center">
                  <div className="flex flex-col items-center text-center md:max-w-[160px]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1FAF9E]/10 text-[#0E3B36] transition hover:bg-[#1FAF9E]/20">
                      <StepIcon name={item.icon} />
                    </div>
                    <span className="mt-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#0E3B36] text-xs font-bold text-white">
                      {index + 1}
                    </span>
                    <h3 className="mt-2 text-sm font-semibold text-[#0E0E0E]">{item.title}</h3>
                    <p className="mt-1 text-xs text-gray-600">{item.text}</p>
                  </div>
                  {index < stepFlowItems.length - 1 && (
                    <div className="hidden h-px flex-1 bg-gradient-to-r from-[#1FAF9E]/40 to-transparent md:block md:max-w-[60px] lg:max-w-[80px]" aria-hidden />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3 - PRODUCT PREVIEW: Inside Tellacity */}
      <section className="bg-[#F9F9F9] py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-6xl px-6">
          <h2 className="text-center text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            Inside Tellacity
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-gray-600">
            See how businesses and customers use the platform.
          </p>
          <div className="mt-12 grid grid-cols-1 gap-12 md:grid-cols-3 md:gap-10">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-96 w-full min-w-0 items-center justify-center overflow-hidden rounded-lg md:h-[28rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Business%20Profile.png"
                  alt="Business profile page"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#0E0E0E]">Business profile page</h3>
              <p className="mt-1 text-sm text-gray-600">Public page with reviews, trust score, and business details.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-96 w-full min-w-0 items-center justify-center overflow-hidden rounded-lg md:h-[28rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Review%20Form.png"
                  alt="Review submission"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#0E0E0E]">Review submission</h3>
              <p className="mt-1 text-sm text-gray-600">Simple form to submit and verify your experience.</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="flex h-96 w-full min-w-0 items-center justify-center overflow-hidden rounded-lg md:h-[28rem]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/Dashboard.png"
                  alt="Business dashboard"
                  className="max-h-full max-w-full object-contain"
                />
              </div>
              <h3 className="mt-4 text-base font-semibold text-[#0E0E0E]">Business dashboard</h3>
              <p className="mt-1 text-sm text-gray-600">Analytics, review inbox, and response tools.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Consumers / For Businesses (existing) */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-5xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">For Consumers</h3>
              <ul className="mt-4 space-y-3 text-xs text-gray-600">
                {consumerSteps.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1FAF9E]" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/write-review"
                className="mt-5 inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0a2d29]"
              >
                Write a Review
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">For Businesses</h3>
              <ul className="mt-4 space-y-3 text-xs text-gray-600">
                {businessSteps.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1FAF9E]" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-2">
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
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Our Verification System
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-500">
            We use multiple layers of protection to keep reviews authentic and fair.
          </p>
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
                <p className="text-sm font-semibold text-[#0E0E0E]">{item.title}</p>
                <p className="mt-2 text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 - TRUST SCORE VISUALIZATION */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-2xl px-6 text-center">
          <h2 className="text-2xl font-semibold text-[#0E3B36] sm:text-3xl">
            How the Tellacity Trust Score Works
          </h2>
          <p className="mt-3 text-sm text-gray-600">
            Trust scores summarize reputation using clear, transparent factors.
          </p>
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="text-4xl font-bold text-[#0E3B36]">4.3 <span className="text-2xl font-normal text-gray-400">/ 5</span></div>
            <p className="mt-1 text-sm text-gray-500">Trust Score</p>
            <div className="mt-8 space-y-4">
              {trustScoreItems.map((item, i) => (
                <div key={item.title}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-[#0E0E0E]">{item.title}</span>
                    <span className="text-gray-500">{[72, 85, 78, 90, 88, 82][i] ?? 80}%</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-[#1FAF9E]"
                      style={{ width: `${[72, 85, 78, 90, 88, 82][i] ?? 80}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6 - FEEDBACK LOOP DIAGRAM */}
      <section className="bg-gray-50 py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-5xl px-6 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            The Feedback Loop
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-500">
            A transparent cycle that benefits customers, businesses, and the community.
          </p>
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
          <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 text-left">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">Why It Matters</h3>
            <p className="mt-2 text-sm text-gray-600">
              Honest feedback creates accountability, strengthens trust, and helps businesses improve while giving consumers the confidence to make smarter choices.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 7 - REAL REVIEW EXAMPLE */}
      <section className="bg-white py-16 lg:py-24 border-t border-gray-100">
        <div className="mx-auto w-full max-w-2xl px-6">
          <h2 className="text-center text-2xl font-semibold text-[#0E3B36]">
            What a verified review looks like
          </h2>
          <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-lg shadow-gray-200/50">
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

      {/* SECTION 8 - FINAL CTA */}
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
