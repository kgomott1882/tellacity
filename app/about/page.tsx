import type { Metadata } from "next";
import AboutClient from "./AboutClient";

const PAGE_URL = "https://tellacity.com/about";

export const metadata: Metadata = {
  title: "About Tellacity | Reputation Management Platform & Customer Reviews",
  description:
    "Learn about Tellacity, the independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "About Tellacity | Reputation Management Platform & Customer Reviews",
    description:
      "Learn about Tellacity, the independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "About Tellacity | Reputation Management Platform & Customer Reviews",
    description:
      "Learn about Tellacity, the independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
  },
  robots: { index: true, follow: true },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "About Tellacity | Reputation Management Platform & Customer Reviews",
  description:
    "Learn about Tellacity, the independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
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
        name: "About",
        item: PAGE_URL,
      },
    ],
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Tellacity",
  description:
    "Tellacity is an independent customer reviews and feedback platform and reputation management platform that helps consumers and businesses build trust.",
  url: "https://tellacity.com",
  mainEntityOfPage: PAGE_URL,
  sameAs: [
    "https://www.linkedin.com/company/tellacity",
    "https://x.com/tellacity",
  ],
};

export default function AboutPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <AboutClient />
    </>
  );
}
