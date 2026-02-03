import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="bg-white">
      <section className="bg-[#F6EAE5]">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-4xl font-semibold text-[#0E3B36] sm:text-5xl">
            Where Truth Meets Trust
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-[#2F3B3A]">
            Your platform for real voices, verified experiences, and transparent
            connections between consumers and businesses.
          </p>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-[#4B5857]">
            Tellacity began with a simple but powerful vision: to become the
            universal platform of trust. We connect consumers and businesses
            through verified reviews, empowering confident decisions and
            fostering fair competition.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/write-review"
              className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-6 py-2.5 text-sm font-semibold text-white"
            >
              Write a Review
            </Link>
            <Link
              href="/for-business"
              className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-6 py-2.5 text-sm font-semibold text-[#0E3B36]"
            >
              Tellacity for Business
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="overflow-hidden rounded-3xl bg-gray-100">
            <div className="h-56 w-full bg-gray-200 sm:h-72" />
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-6 py-12 text-center">
        <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
          Our Mission
        </h2>
        <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
          To be the most trusted source of information about businesses
          globally. We empower consumers to share their experiences and help
          businesses build trust through transparency, fairness, and open
          communication. We ensure a more trustworthy and sustainable online
          experience for everyone.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-left">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">For Consumers</h3>
            <p className="mt-2 text-sm text-gray-600">
              Share your real experiences. Help others make informed choices and
              hold businesses accountable.
            </p>
            <Link
              href="/write-review"
              className="mt-4 inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-4 py-2 text-xs font-semibold text-white"
            >
              Write a Review
            </Link>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-left">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">
              For Businesses
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Build trust with verified reviews, respond openly, and grow a
              reputation customers can rely on.
            </p>
            <Link
              href="/for-business"
              className="mt-4 inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-4 py-2 text-xs font-semibold text-[#0E3B36]"
            >
              Tellacity for Business
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 pb-16 text-center">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Our Values
          </h2>
          <p className="mt-2 text-xs text-gray-500">
            The principles that guide our every decision.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Unwavering Trust",
                copy:
                  "We earn trust by keeping the platform credible, fair, and transparent.",
              },
              {
                title: "Community First",
                copy:
                  "We listen to our community and build what helps people make better choices.",
              },
              {
                title: "Radical Integrity",
                copy:
                  "We stand for honesty, accountability, and respectful dialogue.",
              },
              {
                title: "Purposeful Transparency",
                copy:
                  "We believe openness creates confidence and long-term trust.",
              },
              {
                title: "Bold Innovation",
                copy:
                  "We keep improving to make trust easier to establish and maintain.",
              },
              {
                title: "Enduring Growth",
                copy:
                  "We focus on sustainable impact for businesses and consumers.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5F3] text-xs font-semibold text-[#0E3B36]">
                  •
                </div>
                <p className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </p>
                <p className="mt-2 text-xs text-gray-600">{item.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
