import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
  return (
    <main className="bg-white">
      <section className="bg-[#F6EAE5]">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-16 text-left md:flex-row md:items-center">
          {/* Left copy */}
          <div className="md:w-1/2">
            <h1 className="text-3xl font-semibold text-[#0E3B36] sm:text-4xl lg:text-5xl">
              The independent platform for<br className="hidden sm:block" />
              real customer feedback
            </h1>
            <p className="mt-4 max-w-xl text-sm text-[#2F3B3A] sm:text-base">
              Tellacity helps people share verified experiences and helps
              businesses earn trust through transparent reviews and insights.
              Together we make every decision more confident.
            </p>
            <p className="mt-4 max-w-xl text-xs text-[#4B5857] sm:text-sm">
              From everyday services to global brands, Tellacity connects
              genuine voices with businesses who are ready to listen and
              improve.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/write-review"
                className="inline-flex items-center justify-center rounded-full bg-[#0E3B36] px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-black/20 hover:bg-[#0B302C] transition-colors"
              >
                Write a review
              </Link>
              <Link
                href="/for-business"
                className="inline-flex items-center justify-center rounded-full border border-[#0E3B36] px-6 py-2.5 text-sm font-semibold text-[#0E3B36] bg-transparent hover:bg-[#0E3B36]/5 transition-colors"
              >
                Tellacity for Business
              </Link>
            </div>
          </div>

          {/* Right visual collage */}
          <div className="md:w-1/2">
            <div className="relative mx-auto max-w-md">
              <div className="grid gap-4">
                <div className="flex gap-4">
                  <div className="h-24 flex-1 rounded-2xl bg-white/90 p-3 shadow-lg shadow-black/10">
                    <p className="text-xs font-semibold text-[#0E0E0E]">
                      Real teams, real feedback
                    </p>
                    <p className="mt-1 text-[11px] text-gray-600">
                      Turn everyday customer experiences into insights your
                      whole team can act on.
                    </p>
                  </div>
                  <div className="h-24 w-24 overflow-hidden rounded-2xl shadow-lg shadow-black/20">
                    <Image
                      src="/brand/woman on laptop.png"
                      alt="Woman working on a laptop"
                      width={96}
                      height={96}
                      className="h-full w-full object-cover"
                      priority
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="h-24 w-24 rounded-2xl bg-[#0E3B36] shadow-lg shadow-black/20" />
                  <div className="h-24 flex-1 rounded-2xl bg-white/95 p-3 shadow-lg shadow-black/10">
                    <p className="text-xs font-semibold text-[#0E0E0E]">
                      Category insights
                    </p>
                    <p className="mt-1 text-[11px] text-gray-600">
                      Compare businesses by rating, volume, and recent
                      sentiment in every category.
                    </p>
                  </div>
                </div>

                <div className="h-28 overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/15">
                  <img
                    src="https://images.unsplash.com/photo-1553877522-43269d4ea984?auto=format&fit=crop&w=1600&q=80"
                    alt="People collaborating in an office"
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="overflow-hidden rounded-3xl bg-gray-100">
            <Image
              src="/brand/Office discussion.png"
              alt="Office discussion"
              width={1600}
              height={560}
              className="h-56 w-full object-cover sm:h-72"
              priority
            />
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
                icon: "shield",
              },
              {
                title: "Community First",
                copy:
                  "We listen to our community and build what helps people make better choices.",
                icon: "users",
              },
              {
                title: "Radical Integrity",
                copy:
                  "We stand for honesty, accountability, and respectful dialogue.",
                icon: "scale",
              },
              {
                title: "Purposeful Transparency",
                copy:
                  "We believe openness creates confidence and long-term trust.",
                icon: "eye",
              },
              {
                title: "Bold Innovation",
                copy:
                  "We keep improving to make trust easier to establish and maintain.",
                icon: "spark",
              },
              {
                title: "Enduring Growth",
                copy:
                  "We focus on sustainable impact for businesses and consumers.",
                icon: "growth",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-5 text-left"
              >
                <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F5F3] text-[#0E3B36]">
                  {item.icon === "shield" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
                    </svg>
                  )}
                  {item.icon === "users" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="3" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a3 3 0 0 1 0 5.76" />
                    </svg>
                  )}
                  {item.icon === "scale" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M7 21h10" />
                      <path d="M12 3v18" />
                      <path d="M3 6h6l-3 7-3-7z" />
                      <path d="M15 6h6l-3 7-3-7z" />
                    </svg>
                  )}
                  {item.icon === "eye" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                  {item.icon === "spark" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 2v4" />
                      <path d="M12 18v4" />
                      <path d="M4.22 4.22l2.83 2.83" />
                      <path d="M16.95 16.95l2.83 2.83" />
                      <path d="M2 12h4" />
                      <path d="M18 12h4" />
                      <path d="M4.22 19.78l2.83-2.83" />
                      <path d="M16.95 7.05l2.83-2.83" />
                    </svg>
                  )}
                  {item.icon === "growth" && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M3 20h18" />
                      <path d="M5 16l4-4 3 3 5-7" />
                      <path d="M15 6h5v5" />
                    </svg>
                  )}
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
