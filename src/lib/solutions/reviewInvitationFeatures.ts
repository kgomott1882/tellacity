export const REVIEW_INVITATIONS_HUB = "/solutions/review-invitations";

export type ReviewInvitationFeatureSlug =
  | "email-invitations"
  | "invite-links-and-qr-codes"
  | "smart-reminders"
  | "proof-of-purchase"
  | "bulk-customer-imports"
  | "multi-location-invites";

export type ReviewInvitationFeaturePage = {
  slug: ReviewInvitationFeatureSlug;
  navLabel: string;
  metaTitle: string;
  metaDescription: string;
  kicker: string;
  headline: { lead: string; accent: string };
  valueProp: string;
  heroImage: { src: string; alt: string };
  benefits: { title: string; description: string }[];
  steps: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
};

const BASE = REVIEW_INVITATIONS_HUB;

export const REVIEW_INVITATION_FEATURE_PAGES: ReviewInvitationFeaturePage[] = [
  {
    slug: "email-invitations",
    navLabel: "Email invitations",
    metaTitle: "Email Review Invitations for Businesses | Tellacity",
    metaDescription:
      "Send branded, verified review invitations by email from one dashboard. Batch sends, delivery tracking, and reminders built in.",
    kicker: "Email invitations",
    headline: {
      lead: "Branded review requests",
      accent: "in every inbox.",
    },
    valueProp:
      "Send individual or batched review invitations from your Tellacity dashboard with your branding, clear calls to action, and automatic routing into verified review workflows.",
    heroImage: {
      src: "/brand/Branded_review_requests.jpeg",
      alt: "Tellacity branded email review invitation",
    },
    benefits: [
      {
        title: "On-brand every send",
        description:
          "Use your business name and messaging so invitations feel like a natural follow-up, not a generic survey blast.",
      },
      {
        title: "Batch when you need scale",
        description:
          "Upload customer lists or trigger sends after transactions without composing one-off emails by hand.",
      },
      {
        title: "Delivery you can trust",
        description:
          "Track sends, bounces, and engagement so your team knows which invitations reached customers and which need a follow-up.",
      },
    ],
    steps: [
      {
        title: "Choose your audience",
        description:
          "Select customers from recent orders, appointments, or an imported list inside the invitation workspace.",
      },
      {
        title: "Send a branded invite",
        description:
          "Tellacity delivers a short, mobile-friendly email that links customers into your verified review form.",
      },
      {
        title: "Reviews flow into one feed",
        description:
          "Completed reviews attach to your business profile and power widgets, analytics, and reputation tools.",
      },
    ],
    faqs: [
      {
        question: "Can I send invitations in batches?",
        answer:
          "Yes. Upload customer lists or trigger invitation batches after purchases or service completion, with throttling to protect deliverability.",
      },
      {
        question: "Do emails include verification?",
        answer:
          "Invitations route customers into Tellacity verified review flows, including optional proof-of-purchase when you enable it.",
      },
    ],
  },
  {
    slug: "invite-links-and-qr-codes",
    navLabel: "Invite links & QR codes",
    metaTitle: "Review Invite Links & QR Codes | Tellacity",
    metaDescription:
      "Share unique review invite links and QR codes on receipts, packaging, signage, and follow-up messages.",
    kicker: "Invite links & QR codes",
    headline: {
      lead: "Collect reviews",
      accent: "where customers already are.",
    },
    valueProp:
      "Generate a unique invite link or QR code for your business and place it on receipts, packaging, tables, invoices, or post-service messages so customers can leave verified feedback in seconds.",
    heroImage: {
      src: "/brand/Invite_links_QR_codes_collect.jpeg",
      alt: "Tellacity invite link and QR code for in-store review collection",
    },
    benefits: [
      {
        title: "No app required",
        description:
          "Customers scan or tap and land directly in your branded review experience on mobile or desktop.",
      },
      {
        title: "Perfect for in-person moments",
        description:
          "Capture feedback right after a sale, appointment, or delivery while the experience is still fresh.",
      },
      {
        title: "Trackable per channel",
        description:
          "Use different links or codes per location or campaign to see which touchpoints drive the most reviews.",
      },
    ],
    steps: [
      {
        title: "Create your link or QR",
        description:
          "Generate assets from the dashboard in one click, ready for print, email, or SMS.",
      },
      {
        title: "Place them on touchpoints",
        description:
          "Add to receipts, packaging inserts, table tents, checkout screens, or thank-you messages.",
      },
      {
        title: "Measure conversions",
        description:
          "See scans, opens, and completed reviews so you know which placements perform best.",
      },
    ],
    faqs: [
      {
        question: "Can each location have its own QR code?",
        answer:
          "Yes. Multi-location businesses can issue location-specific invite assets while managing everything centrally.",
      },
      {
        question: "Do links expire?",
        answer:
          "Your core invite link stays available for ongoing use. Campaign-specific links can be rotated when you run promotions.",
      },
    ],
  },
  {
    slug: "smart-reminders",
    navLabel: "Smart reminders",
    metaTitle: "Smart Review Invitation Reminders | Tellacity",
    metaDescription:
      "Automatic, configurable review invitation reminders for customers who have not yet left feedback.",
    kicker: "Smart reminders",
    headline: {
      lead: "Follow up automatically",
      accent: "without chasing manually.",
    },
    valueProp:
      "Configure polite, timed reminders for invitations that were not opened or completed. Tellacity handles the schedule so your team stops copying follow-up emails into spreadsheets.",
    heroImage: {
      src: "/brand/Follow_up_without_chasing.jpeg",
      alt: "Tellacity dashboard showing invitation reminder settings",
    },
    benefits: [
      {
        title: "Higher completion rates",
        description:
          "A well-timed reminder recovers reviews from satisfied customers who intended to respond but got distracted.",
      },
      {
        title: "Configurable cadence",
        description:
          "Set how many reminders to send and how far apart they should be to match your brand tone and industry norms.",
      },
      {
        title: "Stops when not needed",
        description:
          "Reminders pause once a review is submitted or an invitation is suppressed, so customers are not nagged.",
      },
    ],
    steps: [
      {
        title: "Send the first invitation",
        description:
          "Start with your primary email, link, or QR-driven invite after the customer interaction.",
      },
      {
        title: "Reminders run on schedule",
        description:
          "Tellacity sends follow-ups only when the invitation is still open and within your configured limits.",
      },
      {
        title: "Track outcomes centrally",
        description:
          "See which reminders converted and adjust timing based on real completion data.",
      },
    ],
    faqs: [
      {
        question: "Will reminders hurt deliverability?",
        answer:
          "Reminders respect per-recipient limits and suppression lists. You control volume and timing from the dashboard.",
      },
      {
        question: "Can I turn reminders off for certain customers?",
        answer:
          "Yes. Suppress individual addresses or pause campaigns when a customer has already reviewed or opted out.",
      },
    ],
  },
  {
    slug: "proof-of-purchase",
    navLabel: "Proof of purchase",
    metaTitle: "Proof-of-Purchase Verified Reviews | Tellacity",
    metaDescription:
      "Collect verified reviews tied to real transactions with receipt, invoice, or order ID proof-of-purchase.",
    kicker: "Proof of purchase",
    headline: {
      lead: "Reviews buyers",
      accent: "can actually trust.",
    },
    valueProp:
      "Ask customers to attach a receipt, invoice, or order reference when they review so feedback carries a verified badge tied to a real transaction, not anonymous noise.",
    heroImage: {
      src: "/brand/Proof%20of%20Purchase.png",
      alt: "Tellacity proof of purchase verification for customer reviews",
    },
    benefits: [
      {
        title: "Stronger trust signals",
        description:
          "Verified badges show future customers that feedback came from someone who actually bought or booked.",
      },
      {
        title: "Better moderation context",
        description:
          "Your team can reference purchase proof when resolving disputes or investigating unusual review patterns.",
      },
      {
        title: "SEO-friendly structure",
        description:
          "Consistent, verifiable review data supports richer trust presentation across your profile and onsite widgets.",
      },
    ],
    steps: [
      {
        title: "Enable proof collection",
        description:
          "Turn on proof-of-purchase in your invitation and review form settings for the channels you choose.",
      },
      {
        title: "Customer submits review",
        description:
          "Reviewers attach order details or upload documentation alongside their rating and comments.",
      },
      {
        title: "Verified badge publishes",
        description:
          "Approved reviews display verification on your Tellacity profile and embedded widgets.",
      },
    ],
    faqs: [
      {
        question: "Is proof-of-purchase required for every review?",
        answer:
          "You decide per workflow. Many businesses require proof for product reviews and keep service feedback flexible.",
      },
      {
        question: "How is sensitive receipt data handled?",
        answer:
          "Tellacity is built for verification, not public receipt display. Proof supports moderation and trust signals under your policies.",
      },
    ],
  },
  {
    slug: "bulk-customer-imports",
    navLabel: "Bulk customer imports",
    metaTitle: "Bulk Customer Review Invitation Imports | Tellacity",
    metaDescription:
      "Upload CSV customer lists and launch verified review invitation campaigns in minutes with throttling built in.",
    kicker: "Bulk customer imports",
    headline: {
      lead: "Launch campaigns",
      accent: "in minutes, not days.",
    },
    valueProp:
      "Import customer lists via CSV, map fields once, and start invitation campaigns with per-domain throttling so large sends stay deliverable and compliant.",
    heroImage: {
      src: "/brand/Launch_campaigns_in_minutes.jpeg",
      alt: "Tellacity bulk customer import for review invitations",
    },
    benefits: [
      {
        title: "Scale past manual outreach",
        description:
          "Move from dozens of one-off emails to thousands of structured invitations without leaving the dashboard.",
      },
      {
        title: "Field mapping that sticks",
        description:
          "Save column mappings for repeat imports so monthly or quarterly campaigns take less setup time.",
      },
      {
        title: "Built-in throttling",
        description:
          "Control send pace per domain to protect reputation and avoid sudden spikes that trigger spam filters.",
      },
    ],
    steps: [
      {
        title: "Upload your CSV",
        description:
          "Bring in names, emails, and optional order metadata from your CRM, POS, or export.",
      },
      {
        title: "Validate and preview",
        description:
          "Tellacity flags duplicates, invalid addresses, and suppressed contacts before anything sends.",
      },
      {
        title: "Start the campaign",
        description:
          "Invitations and reminders run automatically with full visibility in invitation analytics.",
      },
    ],
    faqs: [
      {
        question: "What columns does the import support?",
        answer:
          "At minimum an email address. You can include names, order IDs, and location tags when your file provides them.",
      },
      {
        question: "Can I reuse the same list later?",
        answer:
          "Yes. Save imports and exclude customers who already reviewed to keep campaigns focused on new feedback.",
      },
    ],
  },
  {
    slug: "multi-location-invites",
    navLabel: "Multi-location invites",
    metaTitle: "Multi-Location Review Invitations | Tellacity",
    metaDescription:
      "Manage review invitations across branches, stores, and departments from one centralised Tellacity dashboard.",
    kicker: "Multi-location invites",
    headline: {
      lead: "One dashboard",
      accent: "for every location.",
    },
    valueProp:
      "Run invitation workflows across branches, franchises, or departments while keeping attribution, permissions, and reporting centralised so leadership sees the full picture.",
    heroImage: {
      src: "/brand/smallbusiness.png",
      alt: "Multi-location business managing Tellacity review invitations",
    },
    benefits: [
      {
        title: "Location-level attribution",
        description:
          "See which stores or teams drive the highest invitation-to-review conversion.",
      },
      {
        title: "Consistent brand standards",
        description:
          "Share templates and policies from HQ while allowing local managers to operate day to day.",
      },
      {
        title: "Role-based access",
        description:
          "Give each location the visibility they need without exposing unrelated customer data.",
      },
    ],
    steps: [
      {
        title: "Add your locations",
        description:
          "Structure branches or departments in Tellacity so invitations route to the right profile context.",
      },
      {
        title: "Assign managers",
        description:
          "Invite teammates with roles that match how each site sends and monitors invitations.",
      },
      {
        title: "Compare performance",
        description:
          "Use invitation and review analytics to coach underperforming locations and replicate what works.",
      },
    ],
    faqs: [
      {
        question: "Does each location need its own account?",
        answer:
          "No. One business account can manage many locations with scoped access for local teams.",
      },
      {
        question: "Can customers review a specific branch?",
        answer:
          "Yes. Invitations and profile structure can attribute feedback to the location where the experience happened.",
      },
    ],
  },
];

export const REVIEW_INVITATION_FEATURE_SLUGS = REVIEW_INVITATION_FEATURE_PAGES.map(
  (page) => page.slug,
);

export function getReviewInvitationFeaturePath(
  slug: ReviewInvitationFeatureSlug,
): string {
  return `${BASE}/${slug}`;
}

export function getReviewInvitationFeature(
  slug: string,
): ReviewInvitationFeaturePage | undefined {
  return REVIEW_INVITATION_FEATURE_PAGES.find((page) => page.slug === slug);
}

/** Sibling links for feature sub-pages (excludes current slug). */
export function getReviewInvitationSiblingLinks(
  currentSlug?: ReviewInvitationFeatureSlug,
): { label: string; href: string }[] {
  const hub = { label: "Review invitations overview", href: REVIEW_INVITATIONS_HUB };
  const features = REVIEW_INVITATION_FEATURE_PAGES.filter(
    (page) => page.slug !== currentSlug,
  ).map((page) => ({
    label: page.navLabel,
    href: getReviewInvitationFeaturePath(page.slug),
  }));
  return [hub, ...features];
}
