import type { Metadata } from "next";
import ReviewInvitationsClient from "./ReviewInvitationsClient";
import { WORKFLOW } from "./reviewInvitationsData";

export const metadata: Metadata = {
  title: "Automated Verified Review Invitations for Businesses | Tellacity",
  description:
    "Automatically invite customers to leave verified, proof-of-purchase reviews. Turn every purchase into a trusted review with Tellacity's invitation engine. Start free.",
  alternates: {
    canonical: "https://tellacity.com/solutions/review-invitations",
  },
  openGraph: {
    title: "Automated Verified Review Invitations for Businesses | Tellacity",
    description:
      "Automatically invite customers to leave verified, proof-of-purchase reviews. Turn every purchase into a trusted review with Tellacity's invitation engine.",
    url: "https://tellacity.com/solutions/review-invitations",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Automated Verified Review Invitations for Businesses | Tellacity",
    description:
      "Verified, proof-of-purchase review invitations with delivery, verification, attribution, and analytics built in.",
  },
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Review Invitations",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Automated, verified review invitation engine. Send branded invitations after purchases, appointments, or services, with delivery, reminders, proof-of-purchase verification, multi-location management, and per-channel attribution from one centralised dashboard.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/review-invitations",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://tellacity.com/business/signup",
  },
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How automated Tellacity review invitations work",
  description:
    "A six-step automated flow that turns every completed customer interaction into a verified, proof-of-purchase review.",
  totalTime: "PT5M",
  step: WORKFLOW.steps.map((step, i) => ({
    "@type": "HowToStep",
    position: i + 1,
    name: step.title,
    text: step.description,
  })),
};

export default function ReviewInvitationsSolutionPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(softwareJsonLd),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <ReviewInvitationsClient />
    </>
  );
}
