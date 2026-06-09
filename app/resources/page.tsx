import type { Metadata } from "next";
import ResourcesClient from "./ResourcesClient";

const PAGE_URL = "https://tellacity.com/resources";

export const metadata: Metadata = {
  title: "Resources Hub | Tellacity",
  description:
    "Guides, Help Center, blog, articles, integrations, customer stories, and Tellacity for Business — everything you need to build verified trust.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Resources Hub | Tellacity",
    description:
      "Guides, Help Center, blog, articles, integrations, customer stories, and Tellacity for Business — everything you need to build verified trust.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Resources Hub | Tellacity",
    description:
      "Guides, Help Center, blog, articles, integrations, customer stories, and Tellacity for Business — everything you need to build verified trust.",
  },
  robots: { index: true, follow: true },
};

const resourcesJsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: "Resources Hub | Tellacity",
  description:
    "Guides, Help Center, blog, articles, integrations, customer stories, and Tellacity for Business — everything you need to build verified trust.",
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
        name: "Resources",
        item: PAGE_URL,
      },
    ],
  },
};

export default function ResourcesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(resourcesJsonLd) }}
      />
      <ResourcesClient />
    </>
  );
}
