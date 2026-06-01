import SolutionPageLayout, {
  type SolutionPageContent,
} from "@/components/solutions/SolutionPageLayout";

export const metadata = {
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

const content: SolutionPageContent = {
  kicker: "Review Invitations",
  headline: {
    lead: "Turn every customer",
    accent: "into a verified review.",
  },
  valueProp:
    "Send branded review invitations automatically after purchases, appointments, or completed services. Tellacity handles delivery, reminders, verification, proof-of-purchase collection, and review attribution from one centralised dashboard. Built for businesses that need scalable, trustworthy review collection, not manual follow-ups and spreadsheets.",
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Open dashboard", href: "/business/dashboard" },
  heroImage: {
    src: "/brand/Tellacity%20Dash.png",
    alt: "Tellacity dashboard showing review invitations, delivery, and verification at a glance",
  },
  heroImageAlign: "edge",

  heroTrustStrip: [
    "Verified review workflows",
    "Proof-of-purchase support",
    "Smart reminders",
    "Anti-abuse protections",
    "Centralised invitation tracking",
  ],

  problemSectionKicker: "The challenge",
  problemSectionTitle: "Why most businesses lose reviews",
  problemSectionDescription:
    "Most reviews never get written, not because customers are unhappy, but because nothing prompts them. Without an automated, verified, centralised invitation flow, the same operational gaps keep showing up.",

  problems: [
    {
      icon: "🤫",
      title: "Most happy customers never leave a review",
      description:
        "Without a structured invitation, satisfied customers move on quietly and the loudest voices dominate your public profile.",
    },
    {
      icon: "🧮",
      title: "Manual outreach doesn't scale",
      description:
        "Asking for reviews by hand works for the first 10 customers and breaks at the hundredth. Spreadsheets and one-off emails create gaps and missed follow-ups.",
    },
    {
      icon: "🕵️",
      title: "Reviews without proof feel risky",
      description:
        "Without a verified transaction, every review is just a claim. Customers and search engines are increasingly looking for proof that a review is real.",
    },
    {
      icon: "⏰",
      title: "Reviews arrive too late",
      description:
        "By the time a customer remembers to leave feedback, the experience is cold. Delayed reviews reduce response rates and overrepresent negative experiences.",
    },
    {
      icon: "🗺️",
      title: "Teams lose visibility across locations",
      description:
        "When invitations are managed manually across branches or teams, businesses lose visibility into who was contacted, who responded, and where reputation gaps exist.",
    },
    {
      icon: "🧵",
      title: "No centralised workflow",
      description:
        "Without one system managing invitations, reminders, verification, and review status, customer feedback becomes fragmented across inboxes, spreadsheets, and teams.",
    },
  ],

  solution: {
    title: "How Tellacity turns every purchase into a verified review",
    description:
      "Tellacity's invitation engine sends a short, branded request shortly after the customer interaction, attaches their order or receipt as proof, and follows up only when it's useful. Every invitation routes through one shared dashboard, so the whole team works from one centralised source of truth.",
    bullets: [
      "Branded email invitations with your logo, sender name, and reply-to.",
      "Shareable invitation links and QR codes for in-store, packaging, and receipts.",
      "Optional proof-of-purchase upload for receipts, invoices, or order IDs.",
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
    title: "How automated review invitations work",
    description:
      "Every Tellacity invitation runs through the same six-stage pipeline, so review collection is repeatable, auditable, and easy to operate at scale.",
    steps: [
      {
        icon: "🛒",
        title: "Customer completes purchase",
        description:
          "The trigger fires the moment an order, appointment, or service is marked complete in your dashboard or via API. Capturing the moment of intent is what makes invitations feel timely instead of cold outreach.",
      },
      {
        icon: "✉️",
        title: "Invitation automatically sent",
        description:
          "A branded email (and optionally SMS) goes out within minutes, in the customer's language, from your verified sender. Automation removes the bottleneck of manual follow-ups so no completed transaction is forgotten.",
      },
      {
        icon: "✅",
        title: "Customer verifies experience",
        description:
          "Verified reviewer accounts and optional proof-of-purchase confirm the review comes from a real customer interaction. Verification reduces fake reviews and strengthens the SEO trust signals search engines look for.",
      },
      {
        icon: "📝",
        title: "Review submitted",
        description:
          "Customer rates, writes, and optionally uploads photos through a clean, mobile-friendly review form. A structured form keeps feedback rich, comparable, and useful for both customers and your internal teams.",
      },
      {
        icon: "🌐",
        title: "Review published",
        description:
          "The review goes live on your verified Tellacity profile and on your own site through widgets, with the verified badge attached. Public, verified content is what converts new visitors into customers.",
      },
      {
        icon: "📊",
        title: "Insights & analytics updated",
        description:
          "Trust score, conversion rates, channel attribution, and per-product performance refresh in your dashboard. A closed feedback loop is what turns reviews from a marketing artefact into operational intelligence.",
      },
    ],
  },

  featuresSectionKicker: "Built into the dashboard",
  featuresSectionTitle: "Key dashboard features at a glance",
  featuresSectionDescription:
    "Every feature below is part of the live Tellacity business dashboard and is available the moment you claim your profile. Built for businesses that want automated, verified, and centralised review workflows that scale.",

  featuresImage: {
    src: "/brand/Presentation.png",
    alt: "Tellacity review invitations dashboard with email and SMS delivery, reminders, and verification controls",
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
        "Audit-friendly timeline of every invitation sent, opened, completed, or ignored, with user and timestamp on each event.",
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
    title: "Why verified invitations matter for trust and SEO",
    description:
      "Proof-of-purchase is what turns a star rating into something a buyer (and a search engine) can rely on. Verified badges make it visible to the reader that the review is tied to a real transaction, not just an anonymous opinion. That same audit trail backs you up when reviews are challenged, disputed, or referenced in compliance reporting.",
    image: {
      src: "/brand/Review%20Form.png",
      alt: "Tellacity verified review form completed by a customer after a verified purchase",
    },
    bullets: [
      "Reduce fake reviews through verified reviewer accounts and proof-of-purchase signals.",
      "Strengthen customer trust with a verified badge on reviews tied to real transactions.",
      "Support moderation workflows with transparent dispute and flagging tools.",
      "Improve review quality through structured forms and authenticated customer identity.",
      "Build transparent reputation signals that hold up under public, legal, and SEO scrutiny.",
      "Tie every invitation to a specific order, appointment, or service so each review has a documented origin.",
      "Throttle invitations per domain and per recipient so deliverability stays high and customers do not feel spammed.",
      "Capture review language and country alongside the rating, so analytics show how trust varies across markets.",
      "Keep a permanent audit trail of every invitation sent, opened, completed, or ignored for compliance and reporting.",
      "Make verification visible to customers reading reviews, so the verified badge actually means something to a buyer.",
    ],
  },

  trust: {
    title: "Built for scale: From local shops to multi-location brands",
    description:
      "Whether you run a single storefront or a multi-location brand, Tellacity's invitation infrastructure is designed for high-volume, verified review collection without losing visibility or control. Delivery, reminders, verification, moderation, and analytics all live on one centralised, scalable platform.",
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
    title: "Designed for modern teams (Marketing, Support, Ops, Leadership)",
    description:
      "Tellacity is not just a tool for the marketing team. The same automated, verified, centralised invitation pipeline serves support, operations, and leadership, each with the right slice of data and the right level of access.",
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
    title: "More than review collection: Building measurable trust",
    description:
      "Every part of the invitation pipeline is designed to convert customer interactions into durable, public, business outcomes, not just stars on a profile.",
    items: [
      {
        icon: "📈",
        title: "Increasing verified review volume",
        description:
          "Move from ad-hoc manual follow-ups to a steady, automated invitation engine that runs continuously.",
      },
      {
        icon: "📍",
        title: "Improving local search visibility",
        description:
          "More verified reviews drive better local search, discovery, and category visibility for your business.",
      },
      {
        icon: "🏗",
        title: "Centralising reputation operations",
        description:
          "One platform for invitations, replies, moderation, analytics, and team access, with no more tool sprawl.",
      },
      {
        icon: "🛡",
        title: "Improve public trust",
        description:
          "Verified reviewer accounts and proof-of-purchase signals make every star carry more weight.",
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
          "Consistent, structured feedback that customers and partners actually trust when deciding.",
      },
    ],
  },

  faqSectionTitle: "Common questions about review invitations",
  faqSectionDescription:
    "Short answers to the most common questions about how Tellacity's automated, verified review invitations work.",

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
        "Yes. Upload a CSV with at least an email column. Name, purchase reference, and language are optional. Tellacity queues the invitations, throttles per domain to protect deliverability, and skips suppression and bounced addresses.",
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
        "Yes. Invite teammates as Admin, Manager, or Viewer with role-based access. Every action (invitation, reply, moderation) is attributable in the audit log.",
    },
  ],
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
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Customer completes purchase",
      text: "The trigger fires the moment an order, appointment, or service is marked complete in your Tellacity dashboard or via API.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Invitation automatically sent",
      text: "A branded email (and optionally SMS) goes out within minutes, in the customer's language, from your verified sender.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Customer verifies experience",
      text: "Verified reviewer accounts and optional proof-of-purchase confirm the review comes from a real customer interaction.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Review submitted",
      text: "The customer rates, writes, and optionally uploads photos through a clean, mobile-friendly verified review form.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Review published",
      text: "The review goes live on your verified Tellacity profile and on your own site through widgets, with the verified badge attached.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Insights and analytics updated",
      text: "Trust score, conversion rates, channel attribution, and per-product performance refresh in your dashboard.",
    },
  ],
};

export default function ReviewInvitationsSolutionPage() {
  return (
    <SolutionPageLayout
      content={content}
      jsonLd={
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
        </>
      }
    />
  );
}
