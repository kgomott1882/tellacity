import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center animate-fade-up">
          <span className="inline-block rounded-full border px-4 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-50">
            Trusted reviews. Real experiences.
          </span>

          <h1 className="mt-6 text-5xl font-bold tracking-tight text-gray-900">
            Trust businesses with confidence
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
            Tellacity helps people make informed decisions and helps businesses
            earn trust through transparent customer feedback.
          </p>

          <div className="mx-auto mt-10 max-w-xl">
            <input
              type="text"
              placeholder="Search for a business…"
              disabled
              className="w-full rounded-lg border px-5 py-4 text-base shadow-sm
                         transition-all duration-200
                         focus:border-black focus:outline-none
                         focus:ring-2 focus:ring-black/10"
            />
            <p className="mt-2 text-sm text-gray-400">
              Search coming next
            </p>
          </div>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/write-review"
              className="rounded-md bg-black px-6 py-3 text-white
                         transition-all duration-200
                         hover:bg-gray-800 hover:-translate-y-0.5"
            >
              Write a review
            </Link>

            <Link
              href="/for-business"
              className="rounded-md border px-6 py-3 text-gray-800
                         transition-all duration-200
                         hover:bg-gray-100 hover:-translate-y-0.5"
            >
              For businesses
            </Link>
          </div>
        </div>
      </section>

      <section className="border-y bg-gray-50">
        <div className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          <Stat value="150k+" label="Businesses listed" />
          <Stat value="1M+" label="Monthly views" />
          <Stat value="Verified" label="Review system" />
          <Stat value="Global" label="Multi-country" />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24">
        <h2 className="text-3xl font-bold text-gray-900">
          What people are saying
        </h2>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Review business="Makro" rating="★★★★★" />
          <Review business="Uber Eats" rating="★★★★☆" />
          <Review business="ABSA" rating="★★★☆☆" />
        </div>
      </section>

      <section className="bg-black text-white">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center animate-fade-up">
          <h2 className="text-4xl font-bold">
            Start building trust today
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-gray-300">
            Share your experience or claim your business profile.
          </p>

          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/write-review"
              className="rounded-md bg-white px-6 py-3 text-black
                         transition-all duration-200
                         hover:bg-gray-200 hover:-translate-y-0.5"
            >
              Write a review
            </Link>

            <Link
              href="/for-business"
              className="rounded-md border border-white px-6 py-3
                         transition-all duration-200
                         hover:bg-white hover:text-black hover:-translate-y-0.5"
            >
              For business
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="transition-transform duration-200 hover:-translate-y-0.5">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-gray-600">{label}</p>
    </div>
  );
}

function Review({ business, rating }: { business: string; rating: string }) {
  return (
    <div className="rounded-lg border bg-white p-6 shadow-sm
                    transition-all duration-200
                    hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{business}</h3>
        <span className="text-sm">{rating}</span>
      </div>
      <p className="mt-4 text-sm text-gray-600">
        Sample customer feedback.
      </p>
    </div>
  );
}
