import SolutionPageLayout, {
  type SolutionPageContent,
} from "@/components/solutions/SolutionPageLayout";

export const metadata = {
  title:
    "Review Invitations | Verified Review Collection Infrastructure | Tellacity",
  description:
    "Tellacity is a verified review operations platform. Send branded invitations after purchases, appointments, or services, run delivery + reminders + verification + attribution, and manage every review workflow from one centralised dashboard.",
  alternates: {
    canonical: "https://tellacity.com/solutions/review-invitations",
  },
  openGraph: {
    title: "Review Invitations | Tellacity",
    description:
      "Verified review collection infrastructure — invitations, reminders, proof-of-purchase, attribution, and analytics from one dashboard.",
    url: "https://tellacity.com/solutions/review-invitations",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Review Invitations | Tellacity",
    description:
      "Verified review collection infrastructure with delivery, verification, attribution, and analytics built in.",
  },
};

const content: SolutionPageContent = {
  kicker: "Review Invitations",
  headline: {
    lead: "Turn every customer",
    accent: "into a verified review.",
  },
  valueProp:
    "Send branded review invitations automatically after purchases, appointments, or completed services. Tellacity handles delivery, reminders, verification, proof-of-purchase collection, and review attribution from one centralised dashboard. Built for businesses that need scalable, trustworthy review collection — not manual follow-ups and spreadsheets.",
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Open dashboard", href: "/business/dashboard" },
  heroImage: {
    src: "/brand/Review%20Form.png",
    alt: "Tellacity review invitation and submission form",
  },

  heroTrustStrip: [
    "Verified review workflows",
    "Proof-of-purchase support",
    "Smart reminders",
    "Anti-abuse protections",
    "Centralised invitation tracking",
  ],

  problems: [
    {
      title: "Most happy customers never leave a review",
      description:
        "Without a structured invitation, the customers who had a great experience usually move on quietly while the loudest voices dominate your public profile.",
    },
    {
      title: "Manual outreach doesn't scale",
      description:
        "Asking for reviews by hand works for the first 10 customers and breaks at the hundredth. Spreadsheets and one-off emails create gaps and missed follow-ups.",
    },
    {
      title: "Reviews without proof feel risky",
      description:
        "Without a verified transaction, every review is just a claim. Customers — and search engines — are increasingly looking for proof that a review is real.",
    },
    {
      title: "Reviews arrive too late",
      description:
        "By the time a customer remembers to leave feedback, the experience is already cold. Delayed reviews reduce response rates and often overrepresent negative experiences.",
    },
    {
      title: "Teams lose visibility across locations",
      description:
        "When invitations are managed manually across branches or teams, businesses lose visibility into who was contacted, which customers responded, and where reputation gaps exist.",
    },
    {
      title: "No centralised workflow",
      description:
        "Without one system managing invitations, reminders, verification, and review status, customer feedback becomes fragmented across inboxes, spreadsheets, and teams.",
    },
  ],

  solution: {
    title: "A repeatable invitation flow that respects your customers.",
    description:
      "Tellacity's invitation engine sends a short, branded request shortly after the customer interaction, attaches their order or receipt as proof, and follows up only when it's useful. Every invitation routes through one shared inbox you can manage from the dashboard.",
    bullets: [
      "Branded email invitations with your logo, sender name, and reply-to.",
      "Shareable invitation links and QR codes for in-store, packaging, and receipts.",
      "Optional proof-of-purchase upload — receipts, invoices, order IDs.",
      "Smart reminders that respect unsubscribe and quiet hours.",
      "One dashboard view of who was invited, who reviewed, and who's pending.",
    ],
    screenshot: {
      src: "/brand/Dashboard.png",
      alt: "Tellacity dashboard with review invitations queue and status",
    },
  },

  workflow: {
    kicker: "How it works",
    title: "From completed transaction to verified review — automatically.",
    description:
      "Every Tellacity invitation runs through the same six-stage pipeline so review collection is repeatable, auditable, and easy to operate at scale.",
    steps: [
      {
        icon: "🛒",
        title: "Customer completes purchase",
        description:
          "Trigger fires the moment an order, appointment, or service is marked complete in your dashboard or via API.",
      },
      {
        icon: "✉️",
        title: "Invitation automatically sent",
        description:
          "A branded email — and optionally SMS — goes out within minutes, in the customer's language, from your verified sender.",
      },
      {
        icon: "✅",
        title: "Customer verifies experience",
        description:
          "Verified reviewer accounts and optional proof-of-purchase confirm the review comes from a real customer interaction.",
      },
      {
        icon: "📝",
        title: "Review submitted",
        description:
          "Customer rates, writes, and optionally uploads photos through a clean, mobile-friendly review form.",
      },
      {
        icon: "🌐",
        title: "Review published",
        description:
          "Live on your verified Tellacity profile and on your own site through widgets, with the verified badge attached.",
      },
      {
        icon: "📊",
        title: "Insights & analytics updated",
        description:
          "Trust score, conversion rates, channel attribution, and per-product performance refresh in your dashboard.",
      },
    ],
  },

  features: [
    {
      badge: "✉",
      title: "Email invitations",
      description:
        "Send branded review requests directly from the dashboard, individually or in batches.",
    },
    {
      badge: "🔗",
      title: "Invite links & QR codes",
      description:
        "Drop a unique link or QR code into receipts, packaging, follow-up emails, or in-store signage.",
    },
    {
      badge: "🔁",
      title: "Smart reminders",
      description:
        "Automatic, configurable follow-ups for invitations that haven't been opened or actioned yet.",
    },
    {
      badge: "🧾",
      title: "Proof of purchase",
      description:
        "Customers can attach a receipt, invoice, or order ID so reviews carry a verified badge.",
    },
    {
      badge: "📈",
      title: "Invitation attribution",
      description:
        "See which invitations converted into reviews and the time-to-review per channel.",
    },
    {
      badge: "🛡",
      title: "Anti-spam controls",
      description:
        "Built-in deduplication, rate limiting, and abuse signals stop invitation channels from being misused.",
    },
    {
      badge: "🏢",
      title: "Multi-location management",
      description:
        "Manage invitations across multiple branches, stores, or departments from one centralised dashboard.",
    },
    {
      badge: "📥",
      title: "Bulk customer imports",
      description:
        "Upload CSV customer lists and launch invitation campaigns in minutes with per-domain throttling.",
    },
    {
      badge: "📊",
      title: "Invitation analytics",
      description:
        "Track open rates, delivery status, review conversion, and invitation performance per channel.",
    },
    {
      badge: "👥",
      title: "Team collaboration",
      description:
        "Give managers and staff role-based access to invitation workflows, review moderation, and analytics.",
    },
    {
      badge: "🕒",
      title: "Invitation history",
      description:
        "Audit-friendly timeline of every invitation sent, opened, completed, or ignored — by user and timestamp.",
    },
    {
      badge: "📬",
      title: "Delivery tracking",
      description:
        "Monitor delivery status, bounce handling, suppression, and customer engagement in real time.",
    },
  ],

  verifiedTrust: {
    kicker: "Why verified invitations matter",
    title: "Reviews customers — and search engines — can actually trust.",
    description:
      "Modern customers increasingly look for proof that reviews come from real experiences. Tellacity invitation workflows support proof-of-purchase collection, invitation attribution, and verification signals that help businesses build more trustworthy public profiles.",
    bullets: [
      "Reduce fake reviews through verified reviewer accounts and proof-of-purchase signals.",
      "Strengthen customer trust with a verified badge on reviews tied to real transactions.",
      "Support moderation workflows with transparent dispute and flagging tools.",
      "Improve review quality through structured forms and authenticated customer identity.",
      "Build transparent reputation signals that hold up under public, legal, and SEO scrutiny.",
    ],
  },

  trust: {
    title: "Built to scale across every business size.",
    description:
      "Whether you manage a local business or a multi-location brand, Tellacity's invitation infrastructure is designed to support high-volume review collection without losing visibility or control. From single review requests to automated invitation pipelines, you manage delivery, reminders, verification, moderation, and analytics from one platform.",
    stats: [
      { value: "600K+", label: "Businesses indexed" },
      { value: "200+", label: "Industry categories" },
      { value: "7", label: "Supported countries" },
      { value: "24/7", label: "Invitation delivery" },
      { value: "Audited", label: "Verification trail" },
    ],
  },

  teams: {
    kicker: "Designed for modern teams",
    title: "One invitation infrastructure, every team it touches.",
    description:
      "Tellacity is not just a tool for the marketing team. The same invitation pipeline serves support, operations, and leadership — each with the right slice of data and the right level of access.",
    audiences: [
      {
        icon: "📣",
        audience: "Marketing teams",
        value:
          "Grow verified review volume, strengthen public trust, and run measurable invitation campaigns.",
      },
      {
        icon: "🛠",
        audience: "Support teams",
        value:
          "Identify service issues and customer friction points the moment they appear in reviews.",
      },
      {
        icon: "🏢",
        audience: "Operations teams",
        value:
          "Monitor reputation across locations, branches, and product lines from one operational view.",
      },
      {
        icon: "🎯",
        audience: "Leadership teams",
        value:
          "Track customer trust trends, platform-wide outcomes, and reputation risk over time.",
      },
    ],
  },

  outcomes: {
    kicker: "More than review collection",
    title: "Tellacity helps businesses build measurable trust.",
    description:
      "Every part of the invitation pipeline is designed to convert customer interactions into durable, public, business outcomes — not just stars on a profile.",
    items: [
      {
        icon: "📈",
        title: "Increase verified review volume",
        description:
          "Move from ad-hoc manual follow-ups to a steady, automated invitation engine that runs continuously.",
      },
      {
        icon: "🛡",
        title: "Improve public trust",
        description:
          "Verified reviewer accounts and proof-of-purchase signals make every star carry more weight.",
      },
      {
        icon: "📍",
        title: "Strengthen local visibility",
        description:
          "More verified reviews drive better local search, discovery, and category visibility.",
      },
      {
        icon: "🏗",
        title: "Centralise reputation operations",
        description:
          "One platform for invitations, replies, moderation, analytics, and team access — no more tool sprawl.",
      },
      {
        icon: "🚫",
        title: "Reduce review fraud",
        description:
          "Behavioural signals, duplicate detection, and dispute workflows protect your brand from abuse.",
      },
      {
        icon: "🤝",
        title: "Improve customer confidence",
        description:
          "Consistent, structured feedback that customers — and partners — actually trust when deciding.",
      },
    ],
  },

  related: [
    {
      title: "Review Widgets",
      href: "/solutions/review-widgets",
      description:
        "Embed your verified reviews directly on your website and product pages.",
    },
    {
      title: "Business Analytics",
      href: "/solutions/business-analytics",
      description:
        "Track invitation conversion, trust score, and customer sentiment in one place.",
    },
    {
      title: "Reputation Management",
      href: "/solutions/reputation-management",
      description:
        "Reply, moderate, and protect your brand across every Tellacity touchpoint.",
    },
    {
      title: "Photo Uploads",
      href: "/solutions/photo-uploads",
      description:
        "Capture verified photos and structured feedback from every customer you invite.",
    },
  ],

  faqs: [
    {
      question: "How do customers actually receive a Tellacity review invitation?",
      answer:
        "Each invitation is sent by email (and SMS on plans that include it) from a branded sender, with a clear CTA that opens a verified Tellacity review form. The invitation is tied to the customer's record so the resulting review is marked verified automatically.",
    },
    {
      question: "Can I import my existing customer list in bulk?",
      answer:
        "Yes. Upload a CSV with at least an email column — name, purchase reference, and language are optional. Tellacity queues the invitations, throttles per domain to protect deliverability, and skips suppression and bounced addresses.",
    },
    {
      question: "Are reminders sent automatically?",
      answer:
        "Yes. If a customer hasn't reviewed within the cooldown window, Tellacity sends one or two configurable follow-ups. You can change the spacing, copy, and total number from the dashboard.",
    },
    {
      question: "Will reviews from invitations be marked as verified?",
      answer:
        "Yes. Because each invitation links back to a customer record, the resulting review carries the verified badge and is treated as a verified purchase/interaction signal in analytics.",
    },
    {
      question: "Do I have to write the email copy myself?",
      answer:
        "No. Tellacity ships with proven templates that use your business name, logo, and brand colour. You can override tone, language, and CTA per campaign without touching code.",
    },
    {
      question: "How is email deliverability protected?",
      answer:
        "Sending uses DKIM and SPF alignment from the Tellacity sending infrastructure, per-domain throttling, automatic suppression of bounces and unsubscribes, and engagement-based reputation management.",
    },
    {
      question: "Can businesses customise invitation branding?",
      answer:
        "Yes. Logo, sender name, reply-to, brand colour, button copy, signature, and language are all configurable per campaign without touching code.",
    },
    {
      question: "Can Tellacity support multiple locations?",
      answer:
        "Yes. Manage invitations and reviews across branches, stores, or departments from one centralised dashboard with per-location reporting and permissions.",
    },
    {
      question: "How does Tellacity help prevent fake reviews?",
      answer:
        "A combination of verified reviewer accounts, optional proof-of-purchase, behavioural signals, duplicate detection, and a transparent dispute workflow makes fake reviews harder to plant and easier to remove.",
    },
    {
      question: "Can I track invitation conversion rates?",
      answer:
        "Yes. Open rate, click rate, review submission rate, and time-to-review are tracked per invitation, per channel, and per campaign in the invitation analytics dashboard.",
    },
    {
      question: "Are invitation links unique per customer?",
      answer:
        "Yes. Every invitation link is uniquely scoped to one customer and one interaction, so reviews can be attributed accurately and links cannot be shared to game the system.",
    },
    {
      question: "What happens if customers unsubscribe?",
      answer:
        "Unsubscribes are honoured immediately and the customer is added to your suppression list. Future invitations to that address are skipped automatically.",
    },
    {
      question: "Can I send invitations after appointments or services, not just purchases?",
      answer:
        "Yes. Triggers support orders, appointments, completed services, and custom events. You can also send manually or in batches from the dashboard.",
    },
    {
      question: "Can teams collaborate inside the dashboard?",
      answer:
        "Yes. Invite teammates as Admin, Manager, or Viewer with role-based access. Every action — invitation, reply, moderation — is attributable in the audit log.",
    },
  ],
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Tellacity Review Invitations",
  description:
    "Verified review collection infrastructure with branded invitations, smart reminders, proof-of-purchase verification, multi-location management, and per-channel attribution.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/review-invitations",
};

export default function ReviewInvitationsSolutionPage() {
  return (
    <SolutionPageLayout
      content={content}
      jsonLd={
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      }
    />
  );
}
