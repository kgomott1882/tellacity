import Link from "next/link";

const values = [
  {
    title: "Integrity First",
    description:
      "We act with honesty and hold ourselves to high standards in every decision.",
  },
  {
    title: "Radical Transparency",
    description:
      "We communicate openly, share context, and build trust through clarity.",
  },
  {
    title: "Customer Empathy",
    description:
      "We listen closely to consumers and businesses to solve real problems.",
  },
  {
    title: "Own the Outcome",
    description:
      "We take responsibility, follow through, and deliver quality work.",
  },
  {
    title: "Grow Together",
    description:
      "We invest in each other’s growth, learning, and long-term success.",
  },
];

const opportunities = [
  "Senior Software Engineer (Fullstack)",
  "Product Designer",
  "Brand & Trust Analyst",
  "Community & Moderation Specialist",
  "Business Development Manager",
];

const reasons = [
  "Collaborate with a purpose-driven team",
  "Build products that improve transparency",
  "Move fast with clarity and ownership",
  "Work across markets and industries",
  "Learn in a culture that values integrity",
];

export default function CareersPage() {
  return (
    <main className="bg-white">
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16">
          <div className="grid gap-8 lg:grid-cols-[1.05fr_1.2fr] lg:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
                Our values guide how we work
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
                Build trust with purpose
              </h1>
              <p className="mt-3 text-sm text-gray-600">
                Tellacity is a place to do meaningful work with people who care
                about transparency, fairness, and real impact.
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl bg-gray-100">
                <div className="h-52 w-full bg-gray-200" />
              </div>
            </div>
            <div className="space-y-4">
              {values.map((item) => (
                <div
                  key={item.title}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-7 w-7 items-center justify-center rounded-full border border-[#CFEAE6] text-xs font-semibold text-[#0E3B36]">
                      ✓
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0E0E0E]">
                        {item.title}
                      </p>
                      <p className="mt-1 text-xs text-gray-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="rounded-2xl bg-gray-200">
              <div className="h-64 w-full rounded-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                How we work
              </h2>
              <p className="mt-3 text-sm text-gray-600">
                We value clear communication, thoughtful execution, and a healthy
                balance between focus and collaboration. Our teams are small,
                empowered, and trusted to deliver.
              </p>
              <p className="mt-4 text-xs text-gray-500">
                • Focused work · Remote-first · Collaborative
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Opportunity unlocked
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            We’re growing quickly and building a team that cares about trust,
            transparency, and impact.
          </p>
          <div className="mt-8 space-y-3">
            {opportunities.map((role) => (
              <div
                key={role}
                className="flex flex-col items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 sm:flex-row"
              >
                <span className="font-medium">{role}</span>
                <button
                  type="button"
                  className="rounded-full border border-gray-200 px-4 py-1 text-xs font-semibold text-gray-600"
                >
                  Apply now →
                </button>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Don’t see the right role? Send us your profile.
          </p>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="rounded-2xl bg-gray-200">
              <div className="h-56 w-full rounded-2xl" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                Why join Tellacity?
              </h2>
              <ul className="mt-4 space-y-3 text-sm text-gray-600">
                {reasons.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#1FAF9E]" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-[#CFEAE6] text-[#0E3B36]">
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3.6 9h16.8" />
              <path d="M3.6 15h16.8" />
              <path d="M12 3c2.5 2.7 2.5 14.3 0 18" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-semibold text-[#0E0E0E]">
            One global team
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
            We work across regions with a shared mission to make trust more
            transparent and accessible for everyone.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0B3B36] px-6 py-2 text-sm font-semibold text-white"
          >
            Contact Talent
          </Link>
        </div>
      </section>
    </main>
  );
}
