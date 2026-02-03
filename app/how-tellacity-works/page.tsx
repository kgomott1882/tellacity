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
  {
    title: "Review Volume",
    description:
      "A healthy number of reviews provides a balanced view of experiences.",
  },
  {
    title: "Review Velocity",
    description:
      "Recent, consistent activity signals an active and trusted business.",
  },
  {
    title: "Review Quality",
    description:
      "Detailed feedback improves usefulness and raises confidence.",
  },
  {
    title: "Verification Rate",
    description:
      "Verified reviews carry more weight and improve overall trust.",
  },
  {
    title: "Response Rate & Speed",
    description:
      "Public replies show accountability and a commitment to customers.",
  },
  {
    title: "Verified vs. Unverified Mix",
    description:
      "A strong verified share indicates real customer activity.",
  },
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

export default function HowTellacityWorksPage() {
  return (
    <main className="bg-white">
      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-4xl font-semibold text-[#0E3B36] sm:text-5xl">
            How Tellacity Works
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
            Tellacity makes it easy to share and discover real experiences. Our
            verification process, transparent policies, and fair moderation keep
            the platform trustworthy for everyone.
          </p>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 pb-12">
          <div className="mx-auto flex max-w-md flex-col gap-3">
            {[
              { title: "Search", text: "Find businesses and view verified feedback." },
              { title: "Read Reviews", text: "Learn from real customer experiences." },
              { title: "Write a Review", text: "Share honest feedback to help others." },
              {
                title: "Review Verification",
                text: "Reviews are checked for authenticity and compliance.",
              },
              {
                title: "Business Collaboration",
                text: "Businesses can respond and resolve issues transparently.",
              },
              {
                title: "Community Impact",
                text: "Trusted feedback helps everyone make better decisions.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm"
              >
                <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full border border-[#CFEAE6] text-xs font-semibold text-[#0E3B36]">
                  ✓
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-600">{item.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                For Consumers
              </h3>
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
                className="mt-5 inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-4 py-2 text-xs font-semibold text-white"
              >
                Write a Review
              </Link>
            </div>
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                For Businesses
              </h3>
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
                  className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-4 py-2 text-xs font-semibold text-white"
                >
                  Tellacity for Business
                </Link>
                <Link
                  href="/business/claim"
                  className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-4 py-2 text-xs font-semibold text-[#0E3B36]"
                >
                  Claim Your Business
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Our Verification System
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-xs text-gray-500">
            We use multiple layers of protection to keep reviews authentic and
            fair.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {verificationItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5F3] text-xs font-semibold text-[#0E3B36]">
                  ✓
                </div>
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            How Trust Score Works
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-xs text-gray-500">
            Trust scores summarize reputation using clear, transparent factors.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {trustScoreItems.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5F3] text-xs font-semibold text-[#0E3B36]">
                  ✓
                </div>
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-12 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            The Feedback Loop
          </h2>
          <p className="mx-auto mt-3 max-w-3xl text-xs text-gray-500">
            A transparent cycle that benefits customers, businesses, and the
            community.
          </p>
          <div className="mt-8 grid gap-3 rounded-2xl border border-gray-200 bg-white p-6 text-xs text-gray-600 sm:grid-cols-4">
            {feedbackLoop.map((item) => (
              <div
                key={item}
                className="flex items-center justify-center rounded-xl border border-gray-100 bg-gray-50 px-3 py-4"
              >
                {item}
              </div>
            ))}
          </div>
          <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 text-xs text-gray-600">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              Why It Matters
            </h3>
            <p className="mt-2">
              Honest feedback creates accountability, strengthens trust, and
              helps businesses improve while giving consumers the confidence to
              make smarter choices.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Start Using Tellacity Today
          </h2>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/write-review"
              className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-5 py-2 text-xs font-semibold text-white"
            >
              Write a Review
            </Link>
            <Link
              href="/for-business"
              className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-5 py-2 text-xs font-semibold text-[#0E3B36]"
            >
              Tellacity for Business
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 px-5 py-2 text-xs font-semibold text-gray-700"
            >
              Browse Reviews
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
