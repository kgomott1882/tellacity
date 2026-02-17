import Link from "next/link";
import { notFound } from "next/navigation";
import { getJobBySlug, JOBS } from "../jobs";
import CareerApplyForm from "./CareerApplyForm";

export async function generateStaticParams() {
  return JOBS.map((job) => ({ slug: job.slug }));
}

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const job = getJobBySlug(slug);
  if (!job) return { title: "Careers | Tellacity" };
  return {
    title: `${job.title} | Careers | Tellacity`,
    description: `${job.location} · ${job.whoWeAre.slice(0, 120)}…`,
  };
}

export default async function JobPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const job = getJobBySlug(slug);
  if (!job) notFound();

  return (
    <main className="bg-white">
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <Link
          href="/careers"
          className="text-sm font-medium text-[#0E3B36] hover:underline"
        >
          ← Back to careers
        </Link>

        <header className="mt-6">
          <h1 className="text-2xl font-semibold text-[#0E0E0E] sm:text-3xl">
            {job.title}
          </h1>
          <p className="mt-1 text-sm text-gray-500">{job.location}</p>
          {job.department && (
            <p className="mt-0.5 text-xs text-gray-500">{job.department}</p>
          )}
        </header>

        <div className="mt-8 space-y-8 text-sm text-gray-700">
          <section>
            <h2 className="text-lg font-semibold text-[#0E0E0E]">
              What you&apos;ll do
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {job.whatYouDo.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0E0E0E]">
              What you&apos;ll bring
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {job.whatYouBring.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0E0E0E]">
              Who we are
            </h2>
            <p className="mt-3">{job.whoWeAre}</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[#0E0E0E]">
              What we offer
            </h2>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              {job.whatWeOffer.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </section>

          {job.stillUnsure && (
            <section>
              <h2 className="text-lg font-semibold text-[#0E0E0E]">
                Still unsure?
              </h2>
              <p className="mt-3">{job.stillUnsure}</p>
            </section>
          )}

          <section>
            <h2 className="text-lg font-semibold text-[#0E0E0E]">
              About Tellacity
            </h2>
            <p className="mt-3">{job.aboutUs}</p>
            <p className="mt-3 text-xs text-gray-500">
              We are committed to inclusion, diversity, and data privacy. By
              applying, you agree to our{" "}
              <Link href="/privacy-policy" className="text-[#0E3B36] underline hover:no-underline">
                Privacy Policy
              </Link>
              .
            </p>
          </section>
        </div>

        <section className="mt-12 border-t border-gray-200 pt-10">
          <h2 className="text-xl font-semibold text-[#0E0E0E]">
            Apply for this job
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            * Indicates required field
          </p>
          <CareerApplyForm jobSlug={job.slug} jobTitle={job.title} />
        </section>
      </div>
    </main>
  );
}
