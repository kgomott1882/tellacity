import Link from "next/link";
import type { ReviewInvitationFeaturePage } from "@/lib/solutions/reviewInvitationFeatures";
import {
  REVIEW_INVITATIONS_HUB,
  getReviewInvitationSiblingLinks,
} from "@/lib/solutions/reviewInvitationFeatures";

const ACCENT = "#1FAF9E";
const ACCENT_BG = "#FBBF24";
const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

export default function SolutionFeaturePageLayout({
  content,
}: {
  content: ReviewInvitationFeaturePage;
}) {
  const siblings = getReviewInvitationSiblingLinks(content.slug);
  const canonical = `https://tellacity.com${REVIEW_INVITATIONS_HUB}/${content.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: content.metaTitle,
    description: content.metaDescription,
    url: canonical,
    isPartOf: {
      "@type": "WebPage",
      name: "Review Invitations",
      url: `https://tellacity.com${REVIEW_INVITATIONS_HUB}`,
    },
  };

  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="w-full bg-[#1a1a1a]">
        <div className="mx-auto w-full max-w-7xl px-6 py-14 md:py-16">
          <nav className="text-xs text-gray-400" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link
                  href="/solutions"
                  className="hover:text-white transition-colors"
                >
                  Solutions
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li>
                <Link
                  href={REVIEW_INVITATIONS_HUB}
                  className="hover:text-white transition-colors"
                >
                  Review Invitations
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-gray-300">{content.kicker}</li>
            </ol>
          </nav>

          <div className="mt-8 grid gap-10 md:grid-cols-2 md:items-center">
            <div className="max-w-xl">
              <p className="text-sm font-medium uppercase tracking-wider text-gray-400">
                {content.kicker}
              </p>
              <h1 className="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
                <span className="block">{content.headline.lead}</span>
                <span className="block" style={{ color: ACCENT }}>
                  {content.headline.accent}
                </span>
              </h1>
              <p className="mt-4 text-base leading-relaxed text-gray-300">
                {content.valueProp}
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href="/business/signup"
                  className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-black transition-all duration-300 hover:shadow-[0_0_20px_rgba(251,191,36,0.6),0_0_40px_rgba(251,191,36,0.3)] active:scale-[0.98]"
                  style={{ backgroundColor: ACCENT_BG }}
                >
                  Start free
                </Link>
                <Link
                  href="/business/dashboard"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:border-white/40 hover:bg-white/5"
                >
                  Open dashboard
                </Link>
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.heroImage.src}
                alt={content.heroImage.alt}
                className="w-full max-w-lg object-contain"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-gray-100 bg-[#F8FAFC] py-14 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-6">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Why teams use {content.kicker.toLowerCase()}
          </h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {content.benefits.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14 md:py-16">
        <div className="mx-auto w-full max-w-7xl px-6">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">How it works</h2>
          <ol className="mt-8 grid gap-6 md:grid-cols-3">
            {content.steps.map((step, index) => (
              <li
                key={step.title}
                className="rounded-2xl border border-gray-200 bg-white p-6"
              >
                <span
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {index + 1}
                </span>
                <h3 className="mt-4 text-base font-semibold text-[#0E0E0E]">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="border-t border-gray-100 bg-[#F8FAFC] py-14 md:py-16">
        <div className="mx-auto grid w-full max-w-7xl gap-10 px-6 lg:grid-cols-[1fr_minmax(240px,280px)]">
          <div>
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">FAQ</h2>
            <div className="mt-6 space-y-4">
              {content.faqs.map((faq) => (
                <details
                  key={faq.question}
                  className="group rounded-xl border border-gray-200 bg-white p-5"
                >
                  <summary className="cursor-pointer text-sm font-semibold text-[#0E0E0E]">
                    {faq.question}
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
            <p className="mt-8 text-sm text-gray-600">
              Explore the full{" "}
              <Link href={REVIEW_INVITATIONS_HUB} className={linkClass}>
                Review Invitations
              </Link>{" "}
              solution or read the{" "}
              <Link href="/help-center" className={linkClass}>
                Help Center
              </Link>
              .
            </p>
          </div>
          <aside className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
              More invitation features
            </h3>
            <ul className="mt-4 space-y-2 text-sm">
              {siblings.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className={linkClass}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </section>

      <section className="w-full bg-[#0E0E0E] text-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-14 text-center md:py-16">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ready to use {content.kicker.toLowerCase()}?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-gray-300 sm:text-base">
            Claim your profile, configure invitations, and start collecting
            verified reviews from one dashboard.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/business/signup"
              className="inline-flex items-center justify-center rounded-2xl px-6 py-3.5 text-sm font-semibold text-black"
              style={{ backgroundColor: ACCENT_BG }}
            >
              Start free
            </Link>
            <Link
              href={REVIEW_INVITATIONS_HUB}
              className="inline-flex items-center justify-center rounded-2xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/5"
            >
              All invitation features
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
