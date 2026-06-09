import type { Metadata } from "next";
import CareersClient from "./CareersClient";
import { JOBS } from "./jobs";
import {
  PAGE_URL,
  buildJobPostingJsonLd,
  careersJsonLd,
} from "./careersData";

export const metadata: Metadata = {
  title: "Careers | Tellacity",
  description:
    "Join Tellacity and help build transparent, trustworthy products. Explore open roles in engineering, design, trust, moderation, and business development.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Careers | Tellacity",
    description:
      "Join Tellacity and help build transparent, trustworthy products. Explore open roles in engineering, design, trust, moderation, and business development.",
    url: PAGE_URL,
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Careers | Tellacity",
    description:
      "Join Tellacity and help build transparent, trustworthy products. Explore open roles in engineering, design, trust, moderation, and business development.",
  },
  robots: { index: true, follow: true },
};

export default function CareersPage() {
  const jobPostingJsonLd = buildJobPostingJsonLd(JOBS);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(careersJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": jobPostingJsonLd,
          }),
        }}
      />
      <CareersClient jobs={JOBS} />
    </>
  );
}
