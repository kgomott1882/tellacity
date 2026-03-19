import Link from "next/link";

export default function PartnerProgramPage() {
  return (
    <main className="min-h-screen bg-white">
      {/* HERO SECTION */}
      <section className="border-b border-neutral-200 bg-gradient-to-b from-[#F5FAF9] to-white">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Partner Program
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#0E0E0E] md:text-5xl">
            Partner with Tellacity. Grow trust. Grow revenue.
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-sm md:text-base text-gray-600">
            Join our ecosystem of agencies, consultants, and platforms helping businesses turn customer feedback
            into measurable growth.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/partner-program/apply">
              <button className="bg-black text-white px-6 py-3 rounded-xl shadow-md hover:opacity-90 transition">
                Apply to Become a Partner
              </button>
            </Link>
            <Link href="/partner-program/contact">
              <button className="border border-neutral-300 px-6 py-3 rounded-xl hover:bg-neutral-100 transition">
                Talk to Partnerships Team
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* PARTNER TYPES */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-[#0E0E0E] text-center mb-6">
          Who should partner with Tellacity?
        </h2>
        <p className="text-sm text-gray-600 text-center max-w-2xl mx-auto mb-10">
          Tellacity partners with organisations that help businesses grow through better customer experience, marketing,
          and technology.
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-sm text-gray-700">
          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#0E0E0E] mb-3">
              Agency Partner
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Manage reviews for clients</li>
              <li>• Offer trust &amp; reputation strategy</li>
              <li>• Access discounted partner pricing</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#0E0E0E] mb-3">
              Integration Partner
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Connect CRM, POS, or ecommerce platforms</li>
              <li>• Build native Tellacity integrations</li>
              <li>• Co-marketing opportunities</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#0E0E0E] mb-3">
              Referral Partner
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Refer businesses to Tellacity</li>
              <li>• Earn recurring revenue share</li>
              <li>• Track referrals via dashboard</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <h3 className="text-base font-semibold text-[#0E0E0E] mb-3">
              Strategic Partner
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• Industry associations</li>
              <li>• SME ecosystems</li>
              <li>• Payment providers &amp; business networks</li>
            </ul>
          </div>
        </div>
      </section>

      {/* WHY PARTNER WITH TELLACITY */}
      <section className="border-y border-neutral-200 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-semibold text-[#0E0E0E] mb-6 text-center">
            Why partner with Tellacity?
          </h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-sm text-gray-700">
            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E0E0E] mb-2">
                Recurring revenue share
              </h3>
              <p>
                Earn ongoing commission for every business you refer to Tellacity, for as long as they remain a customer.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E0E0E] mb-2">
                Co-marketing exposure
              </h3>
              <p>
                Get featured in our integrations and partner directory, and collaborate on case studies and joint
                campaigns.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E0E0E] mb-2">
                Dedicated partner support
              </h3>
              <p>
                Access onboarding support, enablement resources, and partner playbooks designed to help you succeed.
              </p>
            </div>

            <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#0E0E0E] mb-2">
                Global expansion support
              </h3>
              <p>
                Tellacity operates across South Africa, United Kingdom, United States, Australia, Canada, New Zealand,
                and Ireland-helping partners support clients in multiple regions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <h2 className="text-2xl font-semibold text-[#0E0E0E] mb-6 text-center">
          How it works
        </h2>
        <div className="grid gap-6 md:grid-cols-4 text-sm text-gray-700">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              1. Apply
            </p>
            <p>Submit your partner application.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              2. Get Approved
            </p>
            <p>Our team reviews and activates your partner account.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              3. Onboard
            </p>
            <p>Receive resources and onboarding guidance.</p>
          </div>
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
              4. Go Live
            </p>
            <p>Start onboarding clients and earning revenue.</p>
          </div>
        </div>
      </section>

      {/* FINAL CTA SECTION */}
      <section className="border-t border-neutral-200 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Ready to grow with Tellacity?
          </h2>
          <p className="mt-3 text-sm text-gray-600 max-w-2xl mx-auto">
            Join our partner ecosystem and help businesses turn reviews into measurable growth.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm">
            <Link href="/partner-program/apply">
              <button className="rounded-lg bg-black px-6 py-3 font-semibold text-white shadow-sm hover:opacity-90 transition">
                Apply Now
              </button>
            </Link>
            <Link href="/partner-program/contact">
              <button className="rounded-lg border border-neutral-300 px-6 py-3 font-semibold text-[#0E0E0E] hover:bg-neutral-50 transition">
                Contact Partnerships
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
