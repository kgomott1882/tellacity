import { PLAN_ARTICLE_LIMITS } from "@/lib/plans";

export type FaqSegment =
  | { type: "text"; value: string }
  | { type: "link"; href: string; label: string };

export type FaqItem = {
  question: string;
  segments: FaqSegment[];
};

export function faqPlainText(segments: FaqSegment[]): string {
  return segments
    .map((segment) => (segment.type === "text" ? segment.value : segment.label))
    .join("")
    .replace(/\s+/g, " ")
    .trim();
}

export const faqItems: FaqItem[] = [
  {
    question: "What is Tellacity?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity is an independent platform that connects consumers with businesses through verified customer reviews and feedback. ",
      },
      {
        type: "text",
        value:
          "Consumers can share honest experiences, and businesses can use Tellacity to build trust with transparent reviews, Trust Scores, and reputation tools. ",
      },
      {
        type: "text",
        value:
          "It focuses on authenticity, moderation, and clear signals rather than generic star ratings. ",
      },
      { type: "text", value: "Learn more on the " },
      { type: "link", href: "/about", label: "About page" },
      { type: "text", value: " and the " },
      { type: "link", href: "/for-business", label: "Tellacity for Business" },
      { type: "text", value: " page." },
    ],
  },
  {
    question: "How does Tellacity ensure reviews are trustworthy?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity uses multiple layers of verification and moderation, from proof of purchase and identity checks to AI-driven fraud detection and human review, to keep reviews authentic and fair. ",
      },
      {
        type: "text",
        value:
          "Reviews are checked for authenticity, policy compliance, and suspicious behavior patterns before being published publicly. ",
      },
      {
        type: "text",
        value:
          "This reduces spam, fake reviews, and attempts to manipulate reputation. ",
      },
      { type: "text", value: "See more in " },
      { type: "link", href: "/how-tellacity-works", label: "How Tellacity Works" },
      { type: "text", value: " and " },
      { type: "link", href: "/safety-trust", label: "Safety & Trust" },
      { type: "text", value: "." },
    ],
  },
  {
    question: "Can businesses respond to reviews?",
    segments: [
      {
        type: "text",
        value:
          "Yes, businesses can respond to reviews directly on Tellacity in a transparent, public thread. ",
      },
      {
        type: "text",
        value:
          "Owners can reply, explain, or offer to resolve issues, and all responses appear under the same review so customers can see the full context. ",
      },
      {
        type: "text",
        value:
          "This helps build openness and trust while keeping the conversation visible to everyone. ",
      },
      { type: "text", value: "Learn more about " },
      { type: "link", href: "/how-tellacity-works", label: "business collaboration" },
      { type: "text", value: " and " },
      {
        type: "link",
        href: "/solutions/reputation-management",
        label: "reputation management",
      },
      { type: "text", value: "." },
    ],
  },
  {
    question: "What is a ‘Verified Review’?",
    segments: [
      {
        type: "text",
        value:
          "A Verified Review is a review tied to a confirmed customer-business relationship, such as proof of purchase, identity verification, or platform-linked behaviour. ",
      },
      {
        type: "text",
        value:
          "It indicates that the review likely comes from a real customer who has actually interacted with the business, which makes it more trustworthy for readers. ",
      },
      {
        type: "text",
        value:
          "Verified Reviews are one of the main signals that feed into the business’s Trust Score. ",
      },
      { type: "text", value: "Learn more about " },
      {
        type: "link",
        href: "/how-tellacity-works",
        label: "verification and Trust Scores",
      },
      { type: "text", value: " and the " },
      { type: "link", href: "/for-business", label: "Tellacity for Business" },
      { type: "text", value: "." },
    ],
  },
  {
    question: "How can I claim my business on Tellacity?",
    segments: [
      {
        type: "text",
        value:
          "Business owners can claim their profile by submitting a verification request through the Tellacity business-onboarding flow. ",
      },
      {
        type: "text",
        value:
          "The process usually involves confirming contact details, business ownership, and, where possible, supporting documents or proof of operation. ",
      },
      {
        type: "text",
        value:
          "Once claimed, the business can manage its profile, respond to reviews, and access analytics in the business dashboard. ",
      },
      { type: "text", value: "Visit " },
      { type: "link", href: "/for-business", label: "Tellacity for Business" },
      { type: "text", value: " and the " },
      { type: "link", href: "/for-business", label: "Tellacity for Business" },
      { type: "text", value: " to start." },
    ],
  },
  {
    question: "Is Tellacity free to use?",
    segments: [
      {
        type: "text",
        value: "Yes, consumers can use Tellacity for free to read and write reviews. ",
      },
      {
        type: "text",
        value:
          "Businesses can also claim and manage profiles at no upfront cost, while advanced features like Reputation Management, analytics, and custom widgets are available through paid plans. ",
      },
      {
        type: "text",
        value: "Specific product features and pricing tiers are outlined on the ",
      },
      { type: "link", href: "/pricing", label: "Plans & Pricing" },
      { type: "text", value: " page." },
    ],
  },
  {
    question: "How do I report a fake or inappropriate review?",
    segments: [
      {
        type: "text",
        value:
          "Users can report a fake or inappropriate review by clicking the “Report” button on the review page and selecting the reason. ",
      },
      {
        type: "text",
        value:
          "Reports are reviewed by Tellacity’s moderation and fraud-detection systems, and may be escalated to human reviewers if needed. ",
      },
      {
        type: "text",
        value:
          "The platform removes content that violates its guidelines while keeping the process transparent and appeal-friendly. ",
      },
      { type: "text", value: "See more details in " },
      { type: "link", href: "/safety-trust", label: "Safety & Trust" },
      { type: "text", value: " and " },
      { type: "link", href: "/business-guidelines", label: "Business Guidelines" },
      { type: "text", value: "." },
    ],
  },
  {
    question: "Do I need an account to write a review?",
    segments: [
      {
        type: "text",
        value:
          "Yes, you need a Tellacity account to write a review, but registration is free and simple. ",
      },
      {
        type: "text",
        value:
          "Having an account allows Tellacity to verify reviewers, enforce guidelines, and reduce fake or abusive reviews. ",
      },
      {
        type: "text",
        value:
          "It also lets you manage your review history and receive notifications if a business replies. ",
      },
      { type: "text", value: "Visit " },
      { type: "link", href: "/write-review", label: "Write a Review" },
      { type: "text", value: " to get started." },
    ],
  },
  {
    question: "Can I edit or delete my review?",
    segments: [
      {
        type: "text",
        value:
          "Yes, you can usually edit or delete your review within a limited window after publishing, subject to platform rules. ",
      },
      {
        type: "text",
        value:
          "Changes are tracked to keep the review history transparent, and some edits may be logged for moderation and integrity purposes. ",
      },
      {
        type: "text",
        value:
          "In some cases, after a certain period, edits or deletions may be restricted to maintain the integrity of the feedback record. ",
      },
      { type: "text", value: "See the " },
      { type: "link", href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
      { type: "text", value: " for more detail." },
    ],
  },
  {
    question: "Will the business see my contact details?",
    segments: [
      {
        type: "text",
        value:
          "Generally, businesses do not automatically see your personal contact details when you leave a review. ",
      },
      {
        type: "text",
        value:
          "Tellacity keeps personal data private where possible, and only exposes contact information if you explicitly choose to share it or if required by law or platform policy. ",
      },
      {
        type: "text",
        value: "The platform prioritises both transparency and privacy in its design. ",
      },
      { type: "text", value: "Learn more in the " },
      { type: "link", href: "/privacy-policy", label: "Privacy Policy" },
      { type: "text", value: " and " },
      { type: "link", href: "/data-protection", label: "Data Protection" },
      { type: "text", value: " pages." },
    ],
  },
  {
    question: "What benefits do businesses get by claiming their profile?",
    segments: [
      {
        type: "text",
        value:
          "Claiming a profile lets businesses manage their presence, respond to feedback, and showcase verified reviews and Trust Scores. ",
      },
      {
        type: "text",
        value:
          "It unlocks analytics, review-request tools, and widgets that help improve visibility, trust, and conversion. ",
      },
      {
        type: "text",
        value:
          "It also connects the business to the broader Tellacity Tellacity for Business, including moderation, insights, and reputation-management tools. ",
      },
      { type: "text", value: "See " },
      { type: "link", href: "/for-business", label: "Tellacity for Business" },
      { type: "text", value: " and the " },
      { type: "link", href: "/for-business", label: "Tellacity for Business" },
      { type: "text", value: " pages for details." },
    ],
  },
  {
    question: "What payment methods does Tellacity support?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity supports common online payment methods, such as credit/debit cards and major payment gateways, for business-related plans and add-ons. ",
      },
      {
        type: "text",
        value:
          "The exact options may vary by region and product, and are listed on the ",
      },
      { type: "link", href: "/pricing", label: "Plans & Pricing" },
      {
        type: "text",
        value: " page or in the business-onboarding flow. ",
      },
      {
        type: "text",
        value: "Contact ",
      },
      { type: "link", href: "/help-center", label: "support" },
      { type: "text", value: " if you have specific payment-method questions." },
    ],
  },
  {
    question: "Can multiple team members manage one business account?",
    segments: [
      {
        type: "text",
        value:
          "Yes, businesses can give multiple team members access to a single business account, each with role-based permissions. ",
      },
      {
        type: "text",
        value:
          "This lets support, marketing, and operations teams collaborate on review responses and reputation management without sharing one login. ",
      },
      { type: "text", value: "See the " },
      { type: "link", href: "/business-guidelines", label: "Business Guidelines" },
      { type: "text", value: " and " },
      { type: "link", href: "/resources", label: "Business Resources" },
      { type: "text", value: " pages for details." },
    ],
  },
  {
    question: "How are disputes handled?",
    segments: [
      {
        type: "text",
        value:
          "Disputes are handled through a clear, documented process that involves both automated checks and, when needed, human review. ",
      },
      {
        type: "text",
        value:
          "Businesses and reviewers can escalate issues, and Tellacity aims to balance transparency, fairness, and integrity in every decision. ",
      },
      {
        type: "text",
        value:
          "The process is designed to reduce abuse while protecting genuine feedback. ",
      },
      { type: "text", value: "See " },
      { type: "link", href: "/safety-trust", label: "Safety & Trust" },
      { type: "text", value: " and the " },
      { type: "link", href: "/terms-of-service", label: "Terms of Service" },
      { type: "text", value: " for more detail." },
    ],
  },
  {
    question: "What happens if a business tries to delete negative reviews?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity prevents businesses from arbitrarily deleting negative reviews to protect the integrity of the feedback ecosystem. ",
      },
      {
        type: "text",
        value:
          "Reviews can only be removed or heavily edited if they violate platform rules, after formal review and appeal processes. ",
      },
      {
        type: "text",
        value:
          "This ensures that businesses cannot simply hide negative feedback, which builds trust with consumers. ",
      },
      { type: "text", value: "See " },
      { type: "link", href: "/safety-trust", label: "Safety & Trust" },
      { type: "text", value: " and " },
      { type: "link", href: "/business-guidelines", label: "Business Guidelines" },
      { type: "text", value: "." },
    ],
  },
  {
    question: "How does Tellacity protect against manipulation?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity uses a mix of AI-driven fraud detection, suspicious-behaviour checks, identity verification, and manual moderation to protect against manipulation. ",
      },
      {
        type: "text",
        value:
          "Patterns such as duplicate reviews, bot-like behaviour, and bulk review-bombing are flagged and reviewed, and coordinated attempts to manipulate scores are restricted. ",
      },
      {
        type: "text",
        value:
          "The goal is to keep the platform a fair, credible source of feedback for consumers and businesses. ",
      },
      { type: "text", value: "Learn more in " },
      { type: "link", href: "/safety-trust", label: "Safety & Trust" },
      { type: "text", value: " and " },
      { type: "link", href: "/how-tellacity-works", label: "How Tellacity Works" },
      { type: "text", value: "." },
    ],
  },
  {
    question: "What are Blogs & Case Studies on Tellacity?",
    segments: [
      {
        type: "text",
        value:
          "Blogs & Case Studies let verified businesses publish articles and case studies on Tellacity after editorial review. ",
      },
      {
        type: "text",
        value:
          "Approved content appears on the public Articles section and on your business profile. It is business-authored content — not Tellacity's editorial Blog. ",
      },
      { type: "text", value: "Full rules are in the " },
      { type: "link", href: "/business-guidelines", label: "Business Guidelines" },
      { type: "text", value: " (Blogs & Case Studies section) and on " },
      { type: "link", href: "/articles", label: "Articles" },
      { type: "text", value: "." },
    ],
  },
  {
    question: "How many blogs or case studies can my business publish?",
    segments: [
      {
        type: "text",
        value:
          `Monthly submission limits depend on your plan: Free accounts can save drafts only; Grow, Premium, and Elite include a set number of submissions per month (${PLAN_ARTICLE_LIMITS.grow}, ${PLAN_ARTICLE_LIMITS.premium}, and ${PLAN_ARTICLE_LIMITS.elite} respectively at current limits). `,
      },
      {
        type: "text",
        value:
          "A credit is used when you submit for review, not when you save a draft. Credits are returned if Tellacity rejects the submission. Updates to already-published articles do not use an extra credit. ",
      },
      { type: "text", value: "See " },
      { type: "link", href: "/pricing", label: "Plans & Pricing" },
      { type: "text", value: " and " },
      { type: "link", href: "/business-guidelines", label: "Business Guidelines" },
      { type: "text", value: "." },
    ],
  },
  {
    question: "Why was my article rejected?",
    segments: [
      {
        type: "text",
        value:
          "Tellacity reviews every blog and case study before publication. Common rejection reasons include policy violations, misleading claims, spammy links, or breaking article link rules (such as too many external links or affiliate URLs). ",
      },
      {
        type: "text",
        value:
          "The rejection reason is emailed to the business owner and shown in the Blogs & Case Studies dashboard when you click the rejected status. Edit your draft, address the feedback, and submit again. ",
      },
      { type: "text", value: "Read the full standards in " },
      { type: "link", href: "/business-guidelines", label: "Business Guidelines" },
      { type: "text", value: "." },
    ],
  },
];

export function buildFaqJsonLd(items: FaqItem[] = faqItems) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faqPlainText(item.segments),
      },
    })),
  };
}
