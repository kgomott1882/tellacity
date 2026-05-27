import type { Metadata } from "next";
import { Suspense } from "react";
import SuggestBusinessForm from "./SuggestBusinessForm";

const PAGE_URL = "https://tellacity.com/suggest-business";

export const metadata: Metadata = {
  title: "Suggest a Missing Business | Tellacity",
  description:
    "Suggest a missing business for Tellacity review. Submit business details and we'll verify and add the listing if it meets our standards.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Suggest a Missing Business | Tellacity",
    description:
      "Suggest a missing business for Tellacity review. Submit business details and we'll verify and add the listing if it meets our standards.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Suggest a Missing Business | Tellacity",
    description:
      "Suggest a missing business for Tellacity review. Submit business details and we'll verify and add the listing if it meets our standards.",
  },
  robots: { index: true, follow: true },
};

const suggestBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Suggest a Missing Business | Tellacity",
  description:
    "Suggest a missing business for Tellacity review. Submit business details and we'll verify and add the listing if it meets our standards.",
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
        name: "Suggest a Missing Business",
        item: PAGE_URL,
      },
    ],
  },
};

export default function SuggestBusinessPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(suggestBusinessJsonLd),
        }}
      />
      <Suspense fallback={null}>
        <SuggestBusinessForm />
      </Suspense>
    </>
  );
}
