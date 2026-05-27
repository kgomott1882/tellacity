import type { Metadata } from "next";
import FaqAccordionList from "@/components/faq/FaqAccordionList";
import { buildFaqJsonLd } from "@/lib/faqItems";

export const metadata: Metadata = {
  title: "Frequently Asked Questions about Tellacity | Tellacity",
  description:
    "Everything you need to know about Tellacity, from writing reviews and verifying businesses to responding to feedback and protecting against manipulation.",
  alternates: { canonical: "https://tellacity.com/faq" },
  openGraph: {
    title: "Frequently Asked Questions | Tellacity",
    description:
      "Everything you need to know about Tellacity, from writing reviews and verifying businesses to responding to feedback and protecting against manipulation.",
    url: "https://tellacity.com/faq",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Frequently Asked Questions | Tellacity",
    description:
      "Everything you need to know about Tellacity, from writing reviews and verifying businesses to responding to feedback and protecting against manipulation.",
  },
  robots: { index: true, follow: true },
};

const faqJsonLd = buildFaqJsonLd();

export default function FaqPage() {
  return (
    <main className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <section className="bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-16 text-center">
          <h1 className="text-3xl font-semibold text-[#0E0E0E] sm:text-4xl">
            Frequently Asked Questions
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-base text-gray-600 sm:text-lg">
            Everything you need to know about Tellacity. Whether you&apos;re a
            consumer looking to share an experience or a business building
            trust, we&apos;re here to help.
          </p>
        </div>
      </section>

      <section className="bg-white" aria-label="FAQ list">
        <div className="mx-auto w-full max-w-6xl px-6 pb-16">
          <FaqAccordionList />
        </div>
      </section>
    </main>
  );
}
