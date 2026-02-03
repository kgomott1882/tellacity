import Link from "next/link";

export default function ForBusinessPage() {
  return (
    <main className="bg-white">
      {/* HERO */}
      <section className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-semibold text-[#0E0E0E] sm:text-5xl">
            <span className="relative inline-block">
              <span className="relative z-10">
                Your Reputation Is Your Strongest Growth Channel
              </span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h1>
          <p className="mt-4 text-base text-gray-600">
            Turn authentic customer feedback into trust, credibility, and
            consistent growth — with a platform built to showcase what customers
            really think.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/business/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
            >
              Get Started for Free
            </Link>
            <Link
              href="/for-business#pricing"
              className="inline-flex items-center justify-center rounded-full border border-[#1FAF9E] px-6 py-3 text-sm font-semibold text-[#1FAF9E]"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>

      {/* EVERYTHING YOU NEED */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Everything You Need to Scale Trust
                </span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Everything you need to collect, manage, and showcase customer
              feedback — designed to build trust at every customer touchpoint.
            </p>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
            <svg
              viewBox="0 0 640 400"
              className="h-full w-full"
              role="img"
              aria-hidden="true"
            >
              <rect width="640" height="400" rx="24" fill="#F8FAFC" />
              <rect x="48" y="56" width="220" height="120" rx="16" fill="#E5E7EB" />
              <rect x="292" y="56" width="300" height="120" rx="16" fill="#EEF2F7" />
              <rect x="48" y="200" width="544" height="144" rx="20" fill="#FFFFFF" />
              <circle cx="88" cy="92" r="10" fill="#CBD5F5" />
              <circle cx="120" cy="92" r="10" fill="#C7EFD9" />
              <circle cx="152" cy="92" r="10" fill="#FADBB4" />
              <path
                d="M88 304c44-40 92-52 144-36 52 16 86 14 128-10 42-24 86-28 136-12"
                fill="none"
                stroke="#1FAF9E"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            {
              title: "Automated Review Invites",
              copy: "Send timely invites that make it easy for customers to share feedback.",
            },
            {
              title: "Verified Reviews",
              copy: "Build credibility with reviews tied to real customer experiences.",
            },
            {
              title: "Review Management",
              copy: "Keep all feedback organized so you can respond with clarity.",
            },
            {
              title: "Social Proof Widgets",
              copy: "Show verified feedback where it matters most to shoppers.",
            },
            {
              title: "Insights & Analytics",
              copy: "Understand trends and improve the moments that shape trust.",
            },
            {
              title: "Business Profiles",
              copy: "Present a trusted, complete snapshot of your reputation.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <p className="text-base font-semibold text-[#0E0E0E]">
                {item.title}
              </p>
              <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
            </div>
          ))}
        </div>
      </section>

      {/* DIFFERENT */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <svg
                  viewBox="0 0 640 400"
                  className="h-full w-full"
                  role="img"
                  aria-hidden="true"
                >
                  <rect width="640" height="400" rx="24" fill="#F8FAFC" />
                  <rect x="84" y="96" width="120" height="72" rx="16" fill="#E5E7EB" />
                  <rect x="260" y="96" width="120" height="72" rx="16" fill="#E5E7EB" />
                  <rect x="436" y="96" width="120" height="72" rx="16" fill="#E5E7EB" />
                  <circle cx="144" cy="232" r="18" fill="#1FAF9E" opacity="0.7" />
                  <circle cx="320" cy="232" r="18" fill="#1FAF9E" opacity="0.7" />
                  <circle cx="496" cy="232" r="18" fill="#1FAF9E" opacity="0.7" />
                  <path
                    d="M162 232h140M338 232h140"
                    stroke="#94A3B8"
                    strokeWidth="6"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Built for Fair, Transparent Feedback — Not Review Blackmail
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <div className="mt-6 grid gap-4 text-sm text-gray-600 md:grid-cols-2">
                {[
                  "Verified reviews only",
                  "No pay-to-hide reviews",
                  "Right of reply, not deletion",
                  "Trust over tactics",
                ].map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-gray-200 p-4"
                  >
                    <p className="text-sm font-semibold text-[#0E0E0E]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CONVERT */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Convert Visitors Into Customers
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
                <li>Build trust with verified reviews</li>
                <li>Improve conversions with visible social proof</li>
                <li>Show responsiveness through public replies</li>
                <li>Strengthen credibility across every touchpoint</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <svg
                viewBox="0 0 640 400"
                className="h-full w-full"
                role="img"
                aria-hidden="true"
              >
                <rect width="640" height="400" rx="24" fill="#F8FAFC" />
                <rect x="96" y="80" width="448" height="240" rx="28" fill="#FFFFFF" />
                <rect x="140" y="120" width="220" height="28" rx="14" fill="#E2E8F0" />
                <rect x="140" y="168" width="320" height="24" rx="12" fill="#EEF2F7" />
                <rect x="140" y="214" width="260" height="24" rx="12" fill="#EEF2F7" />
                <circle cx="480" cy="198" r="42" fill="#1FAF9E" opacity="0.12" />
                <path
                  d="M464 204l10 10 20-22"
                  stroke="#1FAF9E"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* REVIEW FLOW */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <svg
                  viewBox="0 0 640 400"
                  className="h-full w-full"
                  role="img"
                  aria-hidden="true"
                >
                  <rect width="640" height="400" rx="24" fill="#F8FAFC" />
                  <rect x="216" y="60" width="208" height="280" rx="32" fill="#FFFFFF" />
                  <rect x="248" y="104" width="144" height="36" rx="18" fill="#E2E8F0" />
                  <rect x="248" y="160" width="120" height="28" rx="14" fill="#EEF2F7" />
                  <rect x="248" y="206" width="156" height="28" rx="14" fill="#EEF2F7" />
                  <rect x="248" y="254" width="100" height="28" rx="14" fill="#DCFCE7" />
                  <circle cx="320" cy="310" r="10" fill="#CBD5F5" />
                </svg>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    What Happens After a Review Is Posted?
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-4">
                {[
                  "Customer leaves a verified review",
                  "Business is notified instantly",
                  "Business responds publicly or privately",
                  "Trust indicators update automatically",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-gray-200 bg-white p-4"
                  >
                    <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1FAF9E] text-xs font-semibold text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-semibold text-[#0E0E0E]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WHO FOR */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="max-w-3xl">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">Who Tellacity Is For</span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h2>
        </div>
        <div className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            "Local & service businesses",
            "Online brands & e-commerce",
            "Growing companies",
          ].map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-gray-200 bg-white p-6"
            >
              <p className="text-base font-semibold text-[#0E0E0E]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">Common Questions, Answered</span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[
              {
                question: "Can we respond to negative reviews?",
                answer:
                  "Yes. Businesses can respond publicly or privately to clarify and resolve issues.",
              },
              {
                question: "Are reviews moderated?",
                answer:
                  "Yes. Reviews are reviewed to ensure they meet our fairness and trust guidelines.",
              },
              {
                question: "Can competitors leave fake reviews?",
                answer:
                  "We use verification and fraud checks to prevent manipulation and bad actors.",
              },
              {
                question: "Do we need to pay to be listed?",
                answer:
                  "No. Businesses can be listed and reviewed without any paid plan.",
              },
            ].map((item) => (
              <div key={item.question}>
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {item.question}
                </p>
                <p className="mt-2 text-sm text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            <span className="relative inline-block">
              <span className="relative z-10">
                Why Industry Leaders Choose Tellacity
              </span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-gray-600">
            <li>Verified feedback, not anonymous noise</li>
            <li>Transparent review policies</li>
            <li>Fair treatment for businesses and customers</li>
            <li>Designed for long-term trust</li>
          </ul>
        </div>
      </section>

      {/* INTEGRATIONS */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div>
              <div className="max-w-3xl">
                <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                  <span className="relative inline-block">
                    <span className="relative z-10">
                      Works With the Tools You Already Use
                    </span>
                    <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                  </span>
                </h2>
                <p className="mt-3 text-sm text-gray-600">
                  Tellacity fits seamlessly into your existing workflow so
                  collecting, managing, and showcasing reviews happens
                  automatically — without changing how your team works.
                </p>
              </div>
              <div className="mt-6 space-y-3 text-sm text-gray-600">
                {[
                  "Sync customer data in real time",
                  "Automate review requests via SMS & email",
                  "Display verified social proof automatically",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-[#1FAF9E] text-xs font-semibold text-[#1FAF9E]">
                      ✓
                    </span>
                    <p>{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
              <svg
                viewBox="0 0 640 400"
                className="h-full w-full"
                role="img"
                aria-hidden="true"
              >
                <rect width="640" height="400" rx="24" fill="#F8FAFC" />
                <rect x="80" y="96" width="120" height="80" rx="20" fill="#E5E7EB" />
                <rect x="240" y="96" width="120" height="80" rx="20" fill="#E5E7EB" />
                <rect x="400" y="96" width="120" height="80" rx="20" fill="#E5E7EB" />
                <rect x="140" y="220" width="120" height="80" rx="20" fill="#E5E7EB" />
                <rect x="300" y="220" width="120" height="80" rx="20" fill="#E5E7EB" />
                <rect x="460" y="220" width="80" height="80" rx="20" fill="#E5E7EB" />
              </svg>
            </div>
          </div>
          <div className="mt-8 grid gap-3 text-sm text-gray-500 sm:grid-cols-3 lg:grid-cols-5">
            {[
              "Zapier",
              "Klaviyo",
              "Twilio",
              "Shopify",
              "WooCommerce",
              "Magento",
              "HubSpot",
              "Salesforce",
              "Slack",
              "WordPress",
              "Zendesk",
            ].map((item) => (
              <div
                key={item}
                className="rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-center font-semibold text-gray-500"
              >
                {item}
              </div>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-500">
            And many more via direct integrations and automation.
          </p>
          <Link
            href="/business/signup"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
          >
            Get Started for Free
          </Link>
        </div>
      </section>

      {/* SEGMENTATION */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Built for Different Goals. Designed for Trust.
                </span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Tellacity supports businesses at different stages — whether you’re
              improving feedback, increasing conversions, or scaling credibility.
            </p>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              By Business Goal
            </h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Engage with feedback",
                  copy:
                    "Respond to reviews publicly, resolve issues transparently, and show customers you’re listening.",
                },
                {
                  title: "Accelerate conversions",
                  copy:
                    "Use verified reviews and social proof to build confidence and turn visitors into customers.",
                },
                {
                  title: "Improve with insights",
                  copy:
                    "Understand customer sentiment, trends, and reputation performance over time.",
                },
                {
                  title: "Grow with trust",
                  copy:
                    "Build long-term credibility that compounds into sustainable business growth.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              By Business Size
            </h3>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {[
                {
                  title: "Small & Growing Businesses",
                  copy:
                    "Build credibility early, compete on trust, and grow without complexity.",
                },
                {
                  title: "Established & Multi-Location Businesses",
                  copy:
                    "Manage reputation at scale while staying fair, transparent, and consistent.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-gray-200 bg-white p-6"
                >
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SIMPLE SETUP */}
      <section className="mx-auto w-full max-w-7xl px-6 pb-16" id="pricing">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <div className="grid gap-8 md:grid-cols-2 md:items-center">
            <div className="order-2 md:order-1">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
                <svg
                  viewBox="0 0 640 400"
                  className="h-full w-full"
                  role="img"
                  aria-hidden="true"
                >
                  <rect width="640" height="400" rx="24" fill="#F8FAFC" />
                  <path
                    d="M96 276c60-88 120-120 180-96 60 24 112 16 160-24 48-40 96-48 148-24"
                    fill="none"
                    stroke="#1FAF9E"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <circle cx="140" cy="240" r="10" fill="#CBD5F5" />
                  <circle cx="276" cy="204" r="10" fill="#C7EFD9" />
                  <circle cx="408" cy="176" r="10" fill="#FADBB4" />
                </svg>
              </div>
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">
                    Simple Setup. Immediate Impact.
                  </span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {["Connect your business", "Collect feedback", "Grow with trust"].map(
                  (item, index) => (
                    <div
                      key={item}
                      className="rounded-2xl border border-gray-200 bg-white p-6"
                    >
                      <span className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1FAF9E] text-xs font-semibold text-white">
                        {index + 1}
                      </span>
                      <p className="text-sm font-semibold text-[#0E0E0E]">
                        {item}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="bg-[#F6FBFA]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-14 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-2xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">
                  Ready to Turn Trust Into Growth?
                </span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h3>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/business/signup"
              className="inline-flex items-center justify-center rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
            >
              Get Started for Free
            </Link>
            <Link
              href="/for-business#pricing"
              className="inline-flex items-center justify-center rounded-full border border-[#1FAF9E] px-6 py-3 text-sm font-semibold text-[#1FAF9E]"
            >
              View Pricing
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
