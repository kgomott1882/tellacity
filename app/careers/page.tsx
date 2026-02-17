import Link from "next/link";
import Image from "next/image";
import ValuesTabs from "./ValuesTabs";
import { JOBS } from "./jobs";

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
                <Image
                  src="/brand/Happy Eployees.png"
                  alt="Happy employees at Tellacity"
                  width={600}
                  height={312}
                  className="h-52 w-full object-cover"
                />
              </div>
            </div>
            <ValuesTabs />
          </div>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="overflow-hidden rounded-2xl bg-gray-200">
              <Image
                src="/brand/Boardroom people.png"
                alt="Boardroom team at Tellacity"
                width={600}
                height={256}
                className="h-64 w-full object-cover"
              />
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
            We&apos;re growing quickly and building a team that cares about trust,
            transparency, and impact.
          </p>
          <div className="mt-8 space-y-3">
            {JOBS.map((job) => (
              <div
                key={job.slug}
                className="flex flex-col items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left text-sm text-gray-700 sm:flex-row"
              >
                <span className="font-medium">{job.title}</span>
                <Link
                  href={`/careers/${job.slug}`}
                  className="rounded-full border border-[#0E3B36] px-4 py-1.5 text-xs font-semibold text-[#0E3B36] transition-colors hover:bg-[#0E3B36] hover:text-white"
                >
                  Apply now →
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500">
            Don&apos;t see the right role?{" "}
            <Link href="/contact" className="font-medium text-[#0E3B36] underline hover:no-underline">
              Send us your profile
            </Link>
            .
          </p>
        </div>
      </section>

      <section className="bg-gray-50">
        <div className="mx-auto w-full max-w-5xl px-6 py-14">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="overflow-hidden rounded-2xl bg-gray-200">
              <Image
                src="/brand/Join Hands.png"
                alt="Team collaboration at Tellacity"
                width={600}
                height={224}
                className="h-56 w-full object-cover"
              />
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
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#0B3B36] px-6 py-2 text-sm font-semibold text-white hover:bg-[#0a302c]"
          >
            Contact Talent
          </Link>
        </div>
      </section>
    </main>
  );
}
