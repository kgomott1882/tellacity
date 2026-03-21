import Link from "next/link";

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F5F1EB] text-black">
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-black md:text-4xl">
          How can we help?
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm text-gray-600 md:text-base">
          Choose the option that best matches your request.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <Link
            href="/contact/support"
            className="block cursor-pointer rounded-xl border border-[#2A2A2A]/20 bg-white p-8 text-left transition hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold text-black">
              Contact Support
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Get help with your account, reviews, or platform issues.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-[#1FAF9E]">
              Go to support →
            </span>
          </Link>

          <Link
            href="/contact/sales"
            className="block cursor-pointer rounded-xl border border-[#2A2A2A]/20 bg-white p-8 text-left transition hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold text-black">Contact Sales</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Talk to our team about plans, pricing, and growing your business.
            </p>
            <span className="mt-6 inline-block text-sm font-medium text-[#1FAF9E]">
              Contact sales →
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
