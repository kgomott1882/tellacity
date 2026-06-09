import type { Metadata } from "next";
import ReviewerGuidelinesClient from "./ReviewerGuidelinesClient";

const PAGE_URL = "https://tellacity.com/reviewer-guidelines";

export const metadata: Metadata = {
  title: "Reviewer Guidelines | Tellacity",
  description:
    "Read Tellacity’s reviewer guidelines covering trust, transparency, fairness, verification, moderation, appeals, and enforcement for consumers and businesses.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Reviewer Guidelines | Tellacity",
    description:
      "Read Tellacity’s reviewer guidelines covering trust, transparency, fairness, verification, moderation, appeals, and enforcement for consumers and businesses.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reviewer Guidelines | Tellacity",
    description:
      "Read Tellacity’s reviewer guidelines covering trust, transparency, fairness, verification, moderation, appeals, and enforcement for consumers and businesses.",
  },
  robots: { index: true, follow: true },
};

const reviewerGuidelinesJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Reviewer Guidelines | Tellacity",
  description:
    "Tellacity’s reviewer guidelines covering trust, transparency, fairness, verification, moderation, appeals, and enforcement.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://tellacity.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Reviewer Guidelines",
        item: PAGE_URL,
      },
    ],
  },
};

export default function ReviewerGuidelinesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(reviewerGuidelinesJsonLd),
        }}
      />
      <ReviewerGuidelinesClient />
    </>
  );
}
