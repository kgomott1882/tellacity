import Link from "next/link";
import Image from "next/image";

export default function ResourcesPage() {
  return (
    <main className="relative bg-gradient-to-b from-[#F4F9F8] to-white">
      <section className="relative mx-auto w-full max-w-7xl px-6 py-16">
        <div
          className="pointer-events-none absolute -top-20 left-1/2 h-64 w-96 -translate-x-1/2 rounded-full bg-[#1FAF9E]/10 blur-3xl"
          aria-hidden
        />
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#0E3B36]">
            Knowledge &amp; Resources
          </p>
          <h1 className="mt-3 text-4xl font-semibold text-[#0E0E0E] md:text-5xl">
            <span className="relative inline-block">
              <span className="relative z-10">Resources Hub</span>
              <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
            </span>
          </h1>
          <p className="mt-3 text-sm text-gray-600">
            Everything you need to get the most out of Tellacity — from
            understanding trust to applying it in your business.
          </p>
        </div>

        <div className="relative mt-10 rounded-xl border border-[#2fb2a8]/20 bg-white p-8 shadow-md">
          <h2 className="text-xl font-semibold text-[#0E0E0E]">
            Featured Resource
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-gray-600">
            Start with our most popular guides and tools to build trust and
            grow with Tellacity.
          </p>
          <button
            type="button"
            className="mt-6 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white shadow transition-opacity hover:opacity-90"
          >
            Explore featured content
          </button>
        </div>

        <Link
          href="/resources/trust-transparency-report"
          className="relative mt-10 block overflow-hidden rounded-xl shadow-md"
        >
          <img
            src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2000"
            alt="Trust and transparency"
            className="w-full h-[280px] object-cover"
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
            aria-hidden
          />
          <div className="absolute bottom-0 left-0 p-6 text-white">
            <h2 className="text-xl font-semibold sm:text-2xl">
              The 2026 Trust Transparency Report
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/90">
              Key insights on how trust and verification are shaping the future of reviews.
            </p>
            <span className="mt-4 inline-block rounded-lg bg-white px-4 py-2 text-sm font-medium text-black shadow transition-opacity hover:opacity-90">
              Read the report
            </span>
          </div>
        </Link>
      </section>

      <section className="mx-auto w-full max-w-7xl space-y-16 border-t border-gray-100 pt-12 px-6 pb-16">
        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">
            Learn &amp; Understand
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Build clarity around reviews, trust, and transparency.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                title: "Blog",
                copy: "Practical articles, updates, and insights from the Tellacity team.",
                href: "/blog",
                image: "/Resources/Blog.jpg",
              },
              {
                title: "Guides & Reports",
                copy: "In-depth guides and industry reports to help you grow with trust.",
                href: "/guides",
                image: "/Resources/Guides.jpg",
              },
              {
                title: "Badges Guide",
                copy: "Learn what Tellacity badges mean and how they signal trust and transparency.",
                href: "/badges-guide",
                image: "/Resources/Badges.jpg",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden rounded-t-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                  <Link
                    href={item.href}
                    className="inline-block mt-4 bg-black text-white px-5 py-2 rounded-lg text-sm font-medium shadow hover:opacity-90 transition"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">Apply &amp; Use</h2>
          <p className="mt-2 text-sm text-gray-600">
            Put Tellacity into action in your business.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Help Center",
                copy: "Find answers, documentation, and step-by-step support.",
                href: "/help-center",
                image: "/brand/Help%20Center.png",
              },
              {
                title: "Integrations",
                copy: "Connect Tellacity with the tools you already use.",
                href: "/integrations",
                image: "/brand/Intergrations.png",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 overflow-hidden"
              >
                <div className="relative aspect-video overflow-hidden rounded-t-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                  <Link
                    href={item.href}
                    className="inline-block mt-4 bg-black text-white px-5 py-2 rounded-lg text-sm font-medium shadow hover:opacity-90 transition"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-8">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">
            Grow &amp; Partner
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Scale credibility and expand your impact.
          </p>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[
              {
                title: "Customer Stories",
                copy: "See how real businesses build trust and succeed with Tellacity.",
                href: "/customer-stories",
                image: "/Resources/Customer Stories.jpg",
              },
              {
                title: "Partner Program",
                copy: "Join our partner ecosystem and grow alongside Tellacity.",
                href: "/partner-program",
                image: "/Resources/Partner Program.jpg",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden rounded-t-xl">
                  <Image
                    src={item.image}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6">
                  <p className="text-base font-semibold text-[#0E0E0E]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm text-gray-600">{item.copy}</p>
                  <Link
                    href={item.href}
                    className="inline-block mt-4 bg-black text-white px-5 py-2 rounded-lg text-sm font-medium shadow hover:opacity-90 transition"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
