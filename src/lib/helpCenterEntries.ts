import type { FaqSegment } from "@/lib/faqItems";
import { faqPlainText } from "@/lib/faqItems";

export type HelpEntry = {
  section: string;
  sectionDesc: string;
  title: string;
  segments: FaqSegment[];
};

export const HELP_CENTER_SECTIONS = [
  {
    section: "Getting Started",
    sectionDesc: "New to Tellacity? Start here.",
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
  },
  {
    section: "Businesses on Tellacity",
    sectionDesc: "Tools for business owners.",
  },
  {
    section: "Plans & Billing",
    sectionDesc: "Pricing, subscriptions, and payments.",
  },
  {
    section: "Platform & Global Reach",
    sectionDesc: "Availability and localization.",
  },
] as const;

export const HELP_ENTRIES: HelpEntry[] = [
  {
    section: "Getting Started",
    sectionDesc: "New to Tellacity? Start here.",
    title: "What is Tellacity?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity is a customer review and feedback platform designed to help people make informed decisions and help businesses build trust through transparency. ",
      },
      {
        type: "text",
        value:
          "Reviews are tied to real users and moderated to protect fairness for both customers and businesses. ",
      },
      {
        type: "text",
        value:
          "All reviews must come from independent customers, so the platform stays credible and useful. ",
      },
      { type: "text", value: "Learn more on " },
      { type: "link", href: "/how-tellacity-works", label: "How Tellacity Works" },
      { type: "text", value: " and " },
      { type: "link", href: "/about", label: "About Tellacity" },
      { type: "text", value: "." },
    ],
  },
  {
    section: "Getting Started",
    sectionDesc: "New to Tellacity? Start here.",
    title: "Who can use Tellacity?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity is open to consumers and businesses. ",
      },
      {
        type: "text",
        value:
          "Consumers can write and read reviews, while businesses can claim profiles, respond to feedback, and manage their reputation. ",
      },
      {
        type: "text",
        value:
          "Both groups follow the same trust and content rules, including our ",
      },
      { type: "link", href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
      { type: "text", value: "." },
    ],
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "How do I write a review?",
    segments: [
      {
        type: "text",
        value:
          "You can write a review by searching for a business and selecting Write a Review. ",
      },
      {
        type: "text",
        value:
          "You’ll be asked to rate your experience, describe what happened, and complete any verification steps before publication. ",
      },
      {
        type: "text",
        value:
          "You need a free Tellacity account so reviews can be linked to a real user. ",
      },
      { type: "text", value: "Start at " },
      { type: "link", href: "/write-review", label: "Write a Review" },
      { type: "text", value: "." },
    ],
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "What is a Verified Review?",
    segments: [
      {
        type: "text",
        value:
          "A Verified Review means Tellacity has taken steps to confirm the reviewer’s identity or experience. ",
      },
      {
        type: "text",
        value:
          "Verification helps prevent fake reviews and ensures the feedback reflects a real customer experience. ",
      },
      {
        type: "text",
        value:
          "Verified reviews are stronger trust signals than unverified ones. See ",
      },
      { type: "link", href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
      { type: "text", value: " and " },
      { type: "link", href: "/how-tellacity-works", label: "How Tellacity Works" },
      { type: "text", value: " for details." },
    ],
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "Can I edit or delete my review?",
    segments: [
      {
        type: "text",
        value:
          "You may be able to edit your review within a limited time after publishing. ",
      },
      {
        type: "text",
        value:
          "Reviews can only be removed if they violate Tellacity’s content guidelines or moderation rules. ",
      },
      {
        type: "text",
        value:
          "Removal is not based on disagreement alone, a negative but honest review will not be deleted because a business dislikes it. See ",
      },
      { type: "link", href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
      { type: "text", value: " for more." },
    ],
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "Can I review more than one product?",
    segments: [
      {
        type: "text",
        value:
          "Each product or service should be reviewed based on a real, separate experience. ",
      },
      {
        type: "text",
        value:
          "Reviews must reflect genuine interactions and should not be bulk-submitted or automated. ",
      },
      {
        type: "text",
        value:
          "If activity looks unusual, it may be temporarily restricted for review while moderators check for spam or manipulation.",
      },
    ],
  },
  {
    section: "Reviews",
    sectionDesc: "Writing, editing, and managing reviews.",
    title: "When are reviews removed?",
    segments: [
      {
        type: "text",
        value:
          "Reviews are removed only if they breach policies such as abuse, false information, spam, or conflicts of interest. ",
      },
      {
        type: "text",
        value:
          "Negative reviews are not removed simply because a business disagrees with them. ",
      },
      {
        type: "text",
        value:
          "Moderation focuses on rule violations, not opinions. Read ",
      },
      { type: "link", href: "/safety-trust", label: "Safety & Trust" },
      { type: "text", value: " for the full framework." },
    ],
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "How does the verification process work?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity uses verification checks to ensure reviews are linked to real people and genuine experiences. ",
      },
      {
        type: "text",
        value:
          "This may include identity checks, email confirmation, proof of purchase, or experience validation depending on the situation. ",
      },
      {
        type: "text",
        value:
          "Verification protects both reviewers and businesses. See ",
      },
      { type: "link", href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
      { type: "text", value: " and " },
      { type: "link", href: "/safety-trust", label: "Safety & Trust" },
      { type: "text", value: "." },
    ],
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "How does moderation work?",
    segments: [
      {
        type: "text",
        value:
          "Moderation focuses on content quality and fairness, not opinions. ",
      },
      {
        type: "text",
        value:
          "Tellacity does not remove reviews for being critical; moderation only applies when content breaks the rules. ",
      },
      {
        type: "text",
        value:
          "Some reviews may be temporarily restricted if activity patterns suggest unusual behavior or possible conflicts of interest. ",
      },
      {
        type: "text",
        value:
          "That does not necessarily mean the review is invalid, it may simply need additional checks.",
      },
    ],
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "Why can’t I submit a review?",
    segments: [
      {
        type: "text",
        value:
          "You may be unable to submit a review if you’ve already reviewed the business, if you’re submitting too quickly, if the activity looks unusual, or if there may be a conflict of interest. ",
      },
      {
        type: "text",
        value:
          "These safeguards help keep reviews fair, independent, and trustworthy. ",
      },
      {
        type: "text",
        value:
          "If you believe there is an error, check whether you already posted a review for that business or contact support through ",
      },
      { type: "link", href: "/contact", label: "Contact" },
      { type: "text", value: "." },
    ],
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "What happens during a dispute?",
    segments: [
      {
        type: "text",
        value:
          "If a review is disputed, Tellacity reviews the content against its guidelines. ",
      },
      {
        type: "text",
        value:
          "Both the reviewer and the business may be asked for clarification, and decisions are based on evidence and policy, not payment or influence. ",
      },
      {
        type: "text",
        value:
          "Factual disputes (e.g., whether someone was a customer) are handled differently from opinion disputes about service quality.",
      },
    ],
  },
  {
    section: "Trust, Verification & Moderation",
    sectionDesc: "How we keep the platform safe.",
    title: "Can businesses pay to remove reviews?",
    segments: [
      {
        type: "text",
        value:
          "No. Businesses cannot pay to remove, hide, or alter reviews. ",
      },
      {
        type: "text",
        value:
          "Trust on Tellacity is built through transparency and response, not suppression. ",
      },
      {
        type: "text",
        value:
          "Paid plans do not affect ratings or review visibility. Learn more on the ",
      },
      { type: "link", href: "/reputation-platform", label: "Reputation Platform" },
      { type: "text", value: " page." },
    ],
  },
  {
    section: "Businesses on Tellacity",
    sectionDesc: "Tools for business owners.",
    title: "How do I claim my business?",
    segments: [
      {
        type: "text",
        value:
          "Businesses can claim their profile by verifying ownership or association with the business. ",
      },
      {
        type: "text",
        value:
          "Once claimed, businesses can respond to reviews, update information, and access business tools. ",
      },
      { type: "text", value: "Visit " },
      { type: "link", href: "/for-business", label: "Tellacity for Business" },
      { type: "text", value: " or start at " },
      { type: "link", href: "/business/claim", label: "Claim a business" },
      { type: "text", value: "." },
    ],
  },
  {
    section: "Businesses on Tellacity",
    sectionDesc: "Tools for business owners.",
    title: "How should I respond to reviews?",
    segments: [
      {
        type: "text",
        value:
          "Businesses should respond professionally and constructively, especially to negative feedback. ",
      },
      {
        type: "text",
        value:
          "Public responses show accountability and help build trust with future customers. ",
      },
      {
        type: "text",
        value:
          "Avoid arguments, threats, or retaliation. See ",
      },
      { type: "link", href: "/business-guidelines", label: "Business Guidelines" },
      { type: "text", value: " and the " },
      { type: "link", href: "/reputation-platform", label: "Reputation Platform" },
      { type: "text", value: "." },
    ],
  },
  {
    section: "Businesses on Tellacity",
    sectionDesc: "Tools for business owners.",
    title: "Does Tellacity help with SEO?",
    segments: [
      {
        type: "text",
        value:
          "Public business profiles and reviews can improve visibility and credibility online. ",
      },
      {
        type: "text",
        value:
          "Tellacity does not guarantee rankings, but transparent feedback can support discoverability and trust. ",
      },
      {
        type: "text",
        value:
          "Structured profile data and verified reviews may help search engines and AI systems understand your reputation.",
      },
    ],
  },
  {
    section: "Plans & Billing",
    sectionDesc: "Pricing, subscriptions, and payments.",
    title: "Is Tellacity free?",
    segments: [
      {
        type: "text",
        value:
          "Yes. Tellacity offers free access for consumers and basic business profiles. ",
      },
      {
        type: "text",
        value:
          "Optional paid plans may include additional tools or features for businesses. ",
      },
      { type: "text", value: "See " },
      { type: "link", href: "/pricing", label: "Plans & Pricing" },
      { type: "text", value: " for current options." },
    ],
  },
  {
    section: "Plans & Billing",
    sectionDesc: "Pricing, subscriptions, and payments.",
    title: "Does paying affect my ratings?",
    segments: [
      {
        type: "text",
        value:
          "No. Ratings, review visibility, and trust indicators are never influenced by payment or subscription level. ",
      },
      {
        type: "text",
        value:
          "Trust Scores and review rankings reflect verified feedback and platform signals, not who pays for optional business tools.",
      },
    ],
  },
  {
    section: "Platform & Global Reach",
    sectionDesc: "Availability and localization.",
    title: "Is Tellacity available in my country?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity is available in multiple regions and continues to expand. ",
      },
      {
        type: "text",
        value:
          "Availability may vary depending on local regulations and rollout phases. ",
      },
      { type: "text", value: "Browse " },
      { type: "link", href: "/companies", label: "companies by country" },
      { type: "text", value: " to see supported markets." },
    ],
  },
  {
    section: "Platform & Global Reach",
    sectionDesc: "Availability and localization.",
    title: "What languages are supported?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity supports multiple languages, with additional languages added over time to improve accessibility. ",
      },
      {
        type: "text",
        value:
          "If your preferred language is not yet available, check back as we expand localization across the platform.",
      },
    ],
  },
];

export function helpEntryPlainText(entry: HelpEntry): string {
  return faqPlainText(entry.segments);
}

export function buildHelpCenterJsonLd() {
  const pageUrl = "https://tellacity.com/help-center";

  const webPage = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: "Help Center | Tellacity",
    description:
      "Find answers about reviews, verification, moderation, business profiles, billing, and Tellacity’s trust and support policies.",
    url: pageUrl,
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
          name: "Help Center",
          item: pageUrl,
        },
      ],
    },
  };

  const faqPage = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: HELP_ENTRIES.map((entry) => ({
      "@type": "Question",
      name: entry.title,
      acceptedAnswer: {
        "@type": "Answer",
        text: helpEntryPlainText(entry),
      },
    })),
  };

  return [webPage, faqPage];
}
