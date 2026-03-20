import type { Metadata } from "next";
import Link from "next/link";
import { sanitizeText } from "@/lib/sanitizeText";
function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

import { notFound } from "next/navigation";
import {
  getAllReviewSeoPages,
  getReviewSeoPageBySlug,
  type ReviewSeoPage,
} from "../../../data/reviewSeoPages";

const SITE_URL = "https://tellacity.com";

const COMMON_TOPICS = [
  "Customer service",
  "Billing and payments",
  "Product or service quality",
  "Delivery or turnaround time",
  "Communication and updates",
  "Refund and dispute handling",
  "Overall trust and transparency",
];

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const pages = getAllReviewSeoPages();
  return pages.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const { slug } = await props.params;
  const safeSlug = slug.trim().toLowerCase();
  if (!isValidSlug(safeSlug)) {
    return { title: "Review guide not found | Tellacity" };
  }
  const page = getReviewSeoPageBySlug(safeSlug);
  if (!page) {
    return { title: "Review guide not found | Tellacity" };
  }
  const url = `${SITE_URL}/b/${safeSlug}`;
  return {
    title: page.metaTitle,
    description: page.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: page.metaTitle,
      description: page.metaDescription,
      url,
      type: "website",
    },
  };
}

function buildJsonLd(page: ReviewSeoPage) {
  const url = `${SITE_URL}/reviews/${page.slug}`;

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: page.metaTitle,
    description: page.metaDescription,
    url,
    publisher: {
      "@type": "Organization",
      name: "Tellacity",
      url: SITE_URL,
    },
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Reviews", item: `${SITE_URL}/reviews` },
      { "@type": "ListItem", position: 3, name: page.brandName, item: url },
    ],
  };

  const faq =
    page.faqs && page.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: page.faqs.map((f) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
        }
      : null;

  return [webPage, breadcrumb, faq].filter(Boolean);
}

export default async function ReviewSeoPage(props: PageProps) {
  const { slug } = await props.params;
  const page = getReviewSeoPageBySlug(slug);
  if (!page) notFound();

  const related = getAllReviewSeoPages()
    .filter((p) => p.slug !== slug)
    .slice(0, 6);

  const jsonLd = buildJsonLd(page);

  return (
    <>
      {jsonLd.map((data, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}

      <main className="min-h-screen bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row lg:py-16">
          <article className="min-w-0 flex-1">
            {/* Hero */}
            <header className="border-b border-gray-200 pb-8">
              <h1 className="text-3xl font-semibold tracking-tight text-[#0E0E0E] sm:text-4xl">
                {sanitizeText(page.brandName)} Reviews, Complaints &amp; Customer Feedback
              </h1>
              <p className="mt-4 text-lg text-gray-700 leading-relaxed">
                {sanitizeText(page.summary)}
              </p>
              {(page.category || page.country) && (
                <p className="mt-3 text-sm text-gray-500">
                  {sanitizeText([page.category, page.country].filter(Boolean).join(" · "))}
                </p>
              )}
            </header>

            {/* Table of contents */}
            <nav className="mt-8 rounded-xl border border-gray-200 bg-gray-50 p-5" aria-label="Table of contents">
              <h2 className="text-sm font-semibold text-gray-900">On this page</h2>
              <ul className="mt-3 space-y-2 text-sm">
                <li><a href="#overview" className="text-gray-600 hover:text-[#0B3B36]">Overview</a></li>
                <li><a href="#why-people-search" className="text-gray-600 hover:text-[#0B3B36]">Why people search for {sanitizeText(page.brandName)}</a></li>
                <li><a href="#common-topics" className="text-gray-600 hover:text-[#0B3B36]">Common topics customers look for</a></li>
                <li><a href="#how-to-research" className="text-gray-600 hover:text-[#0B3B36]">How to research a business before buying</a></li>
                <li><a href="#related-guides" className="text-gray-600 hover:text-[#0B3B36]">Related review guides</a></li>
                <li><a href="#faq" className="text-gray-600 hover:text-[#0B3B36]">FAQs</a></li>
              </ul>
            </nav>

            {/* Section 1: Overview */}
            <section id="overview" className="mt-10 scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">Overview</h2>
              <div className="mt-4 space-y-4 text-gray-700 leading-relaxed">
                <p>
                  Customers often search for reviews, complaints, service quality, and real experiences before buying or signing up. Whether they are comparing banks, telecoms, or other services, review research helps set expectations and spot patterns.
                </p>
                <p>
                  Reviews can reveal service patterns, support quality, delivery or billing concerns, and positive experiences depending on the company. Looking at a range of feedback-and how the business responds-gives a clearer picture than a single opinion.
                </p>
              </div>
            </section>

            {/* Section 2: Why people search */}
            <section id="why-people-search" className="mt-12 scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                Why people search for {sanitizeText(page.brandName)}
              </h2>
              <p className="mt-4 text-gray-700 leading-relaxed">
                Common search intents include checking legitimacy, complaints, and customer experiences. People often look for phrases such as:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-6 text-gray-700">
                <li>“Is {sanitizeText(page.brandName)} legit?”</li>
                <li>“{sanitizeText(page.brandName)} complaints”</li>
                <li>“{sanitizeText(page.brandName)} customer service reviews”</li>
                <li>“{sanitizeText(page.brandName)} experiences”</li>
              </ul>
              <p className="mt-4 text-gray-700 leading-relaxed">
                These searches reflect a desire to research before committing. Understanding search intent helps you know what kind of information other customers are looking for when they evaluate {sanitizeText(page.brandName)}.
              </p>
            </section>

            {/* Section 3: Common topics */}
            <section id="common-topics" className="mt-12 scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                Common topics customers look for
              </h2>
              <p className="mt-4 text-gray-700 leading-relaxed">
                When researching a business, customers often focus on the following themes:
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-1">
                {COMMON_TOPICS.map((topic) => (
                  <li
                    key={topic}
                    className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700"
                  >
                    <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B3B36]" aria-hidden />
                    {sanitizeText(topic)}
                  </li>
                ))}
              </ul>
            </section>

            {/* Section 4: How to research */}
            <section id="how-to-research" className="mt-12 scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                How to research a business before buying
              </h2>
              <div className="mt-4 space-y-4 text-gray-700 leading-relaxed">
                <p>
                  When evaluating a company, consider the following:
                </p>
                <ul className="list-disc space-y-2 pl-6">
                  <li><strong>Review patterns over time</strong> - Are issues one-off or repeated? Has feedback improved or worsened?</li>
                  <li><strong>Complaint themes</strong> - Do the same topics (e.g. billing, support) come up often?</li>
                  <li><strong>Response quality</strong> - Does the business respond to negative reviews in a clear, constructive way?</li>
                  <li><strong>Transparency</strong> - Does the company share information about how it handles disputes or feedback?</li>
                  <li><strong>Independent sources</strong> - Cross-check with more than one platform or source to get a balanced view.</li>
                </ul>
                <p>
                  No single review or site tells the full story. Combining multiple sources and looking for patterns will give you a more reliable picture before you buy or sign up.
                </p>
              </div>
            </section>

            {/* Section 5: Related guides */}
            <section id="related-guides" className="mt-12 scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">
                Related review guides
              </h2>
              <p className="mt-4 text-gray-700 leading-relaxed">
                Other review guides you may find useful:
              </p>
              <ul className="mt-6 space-y-3">
                {related.map((p) => {
                  const safeSlug = (p.slug ?? "").trim().toLowerCase();
                  if (!isValidSlug(safeSlug)) return null;
                  return (
                    <li key={safeSlug}>
                      <Link
                        href={`/reviews/${safeSlug}`}
                        className="block rounded-lg border border-gray-200 bg-white px-4 py-3 text-[#0B3B36] font-medium hover:bg-gray-50 hover:border-gray-300"
                      >
                        {sanitizeText(p.brandName)} reviews &amp; feedback
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>

            {/* Section 6: FAQ */}
            <section id="faq" className="mt-12 scroll-mt-24">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">FAQs</h2>
              {page.faqs && page.faqs.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {page.faqs.map((faq, i) => (
                    <details
                      key={i}
                      className="group rounded-xl border border-gray-200 bg-white"
                    >
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 px-5 py-4 font-medium text-gray-900 [&::-webkit-details-marker]:hidden">
                        {sanitizeText(faq.question)}
                        <span className="shrink-0 text-gray-400 transition-transform group-open:rotate-180" aria-hidden>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </span>
                      </summary>
                      <div className="border-t border-gray-100 px-5 pb-4 pt-2 text-gray-700 leading-relaxed">
                        {sanitizeText(faq.answer)}
                      </div>
                    </details>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-gray-600">No FAQs available for this guide.</p>
              )}
            </section>

            {/* Bottom CTA */}
            <section className="mt-14 rounded-2xl border border-gray-200 bg-[#0B3B36] px-6 py-10 text-white">
              <h2 className="text-xl font-semibold">
                Turn customer feedback into business intelligence
              </h2>
              <p className="mt-3 text-sm text-gray-100">
                Collect reviews, understand patterns, and build trust with Tellacity.
              </p>
              <Link
                href="/business/signup"
                className="mt-5 inline-flex items-center rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-[#0B3B36]"
              >
                Get started
              </Link>
            </section>
          </article>

          {/* Right sidebar */}
          <aside className="w-full shrink-0 lg:w-72">
            <div className="lg:sticky lg:top-28 space-y-6">
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                <h3 className="text-sm font-semibold text-gray-900">
                  Looking for customer feedback tools?
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Turn customer reviews into business intelligence with Tellacity.
                </p>
                <Link
                  href="/business/signup"
                  className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-[#0B3B36] px-4 py-2.5 text-sm font-semibold text-white"
                >
                  Start collecting reviews
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </>
  );
}
