import SolutionPageLayout, {
  type SolutionPageContent,
} from "@/components/solutions/SolutionPageLayout";

export const metadata = {
  title: "Reputation Management for Verified Customer Trust | Tellacity",
  description:
    "Manage customer trust from one centralised reputation operations dashboard. Respond to reviews, handle disputes, monitor abuse, and protect your verified profile with Tellacity. Start free.",
  alternates: {
    canonical: "https://tellacity.com/solutions/reputation-management",
  },
  openGraph: {
    title: "Reputation Management for Verified Customer Trust | Tellacity",
    description:
      "Manage customer trust from one centralised reputation operations dashboard. Respond to reviews, handle disputes, monitor abuse, and protect your verified profile with Tellacity.",
    url: "https://tellacity.com/solutions/reputation-management",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Reputation Management for Verified Customer Trust | Tellacity",
    description:
      "Centralised reputation operations. Public replies, disputes, moderation, fraud detection, verified profiles, and audit logs in one dashboard.",
  },
};

const content: SolutionPageContent = {
  kicker: "Reputation Management",
  headline: {
    lead: "Reputation Management for",
    accent: "Verified Customer Trust",
  },
  valueProp:
    "Manage customer trust from one centralised reputation operations dashboard. Tellacity helps businesses respond to reviews, handle disputes, monitor abuse signals, maintain verified profiles, track moderation workflows, and protect public trust across every customer-facing surface.",
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Open dashboard", href: "/business/dashboard" },
  heroImage: {
    src: "/brand/smallbusiness.png",
    alt: "Small business owner managing their Tellacity reputation",
  },

  heroTrustStrip: [
    "Verified business profiles",
    "Transparent dispute workflows",
    "Fraud & abuse monitoring",
    "Moderation audit logs",
    "Team-based reputation management",
  ],

  problemSectionKicker: "The challenge",
  problemSectionTitle: "Why most teams struggle with reputation issues",
  problemSectionDescription:
    "Verified reputation only holds up when replies, flags, disputes, moderation, and profile updates all live in one centralised system. Without that, the same operational blind spots keep showing up where customer trust is decided.",

  problems: [
    {
      icon: "💬",
      title: "Reviews go unanswered",
      description:
        "Most customers want a response, not just a number. When negative reviews sit unaddressed for days, prospective customers assume the worst.",
    },
    {
      icon: "🎭",
      title: "Bad-faith reviews damage trust",
      description:
        "Without moderation, fake or off-policy reviews can sit on your profile and influence decisions for weeks before being challenged.",
    },
    {
      icon: "🗃️",
      title: "Your profile information goes stale",
      description:
        "Addresses change, hours shift, services expand. A profile that no longer matches reality erodes credibility faster than a single bad review.",
    },
    {
      icon: "🔥",
      title: "Reputation issues spread faster than teams can react",
      description:
        "When negative reviews, unresolved complaints, or misleading information remain public too long, customer trust can decline before teams even notice.",
    },
    {
      icon: "🧷",
      title: "Moderation workflows become fragmented",
      description:
        "When replies, disputes, flags, and moderation decisions happen across emails and spreadsheets, accountability and consistency break down.",
    },
    {
      icon: "🪟",
      title: "Customers expect transparency",
      description:
        "Modern customers increasingly expect visible owner responses, verified business information, and transparent moderation processes before they trust a platform.",
    },
    {
      icon: "🏢",
      title: "Multi-location businesses lose consistency",
      description:
        "Without centralised reputation management, different branches and teams respond inconsistently, creating uneven customer trust experiences.",
    },
  ],

  solution: {
    title: "How Tellacity turns reviews into structured trust management",
    description:
      "The Tellacity dashboard puts every public reply, flag, dispute, fraud signal, and profile update in a single centralised workflow. Your team works from one queue, customers get faster owner responses, and every policy decision is recorded in the audit log end-to-end.",
    bullets: [
      "Reply directly under any review with an Owner Responded badge.",
      "Flag and dispute reviews through a transparent, documented workflow.",
      "Built-in fraud signals: duplicate accounts, suspicious patterns, abuse.",
      "Keep your verified profile current with logo, address, categories, and hours.",
      "Audit log of every reply, status change, and moderator decision.",
    ],
    screenshot: {
      src: "/brand/woman%20on%20laptop.png",
      alt: "Business owner managing Tellacity reputation on her laptop",
    },
  },

  workflow: {
    kicker: "How the reputation system works",
    title: "How the reputation system works",
    description:
      "Every customer interaction on Tellacity flows through the same centralised operational pipeline, from review submission through verification, public reply, moderation, and reporting, so accountability is documented at every step.",
    steps: [
      {
        icon: "📥",
        title: "Reviews submitted",
        description:
          "Verified customers submit reviews through invitations, public profiles, and authenticated forms tied to a real account. Real, verified customer signal is the only kind worth defending.",
      },
      {
        icon: "🛂",
        title: "Reviews verified & monitored",
        description:
          "Identity checks, behavioural signals, and fraud detection screen every review before it appears publicly. Monitoring up front is what stops bad-faith and coordinated reviews from ever reaching your profile.",
      },
      {
        icon: "💬",
        title: "Businesses respond publicly",
        description:
          "Owners reply with a visible \"Owner Responded\" badge so customers see the full conversation in context. Public replies turn one review into a visible trust signal for every visitor that follows.",
      },
      {
        icon: "🚩",
        title: "Flags & disputes reviewed",
        description:
          "Flagged reviews and disputes move into a transparent workflow with clear states, owners, and timestamps. Transparent, documented dispute workflows help LLMs and search engines treat your brand as a trustworthy, accountable source.",
      },
      {
        icon: "🛡",
        title: "Moderation decisions applied",
        description:
          "Reviews that fail policy are actioned, decisions are documented, and the outcome is visible in the audit log. Documented moderation is what makes your reputation defensible when reviews are challenged or referenced later.",
      },
      {
        icon: "📊",
        title: "Reputation insights updated",
        description:
          "Every reply, flag, dispute, and edit flows into reporting so leadership sees reputation health live. A closed feedback loop is what turns reputation operations into compounding customer trust over time.",
      },
    ],
  },

  featuresSectionKicker: "Built into the dashboard",
  featuresSectionTitle: "Key reputation management features at a glance",
  featuresSectionDescription:
    "Every capability below is part of the live Tellacity business dashboard and is available the moment you claim your profile. Built for centralised reputation operations across public replies, moderation, fraud detection, verified profiles, and audit logs.",

  featuresImage: {
    src: "/brand/Reputation%20Management.png",
    alt: "Tellacity reputation management dashboard with replies, moderation queue, and verified profile controls",
  },

  features: [
    {
      badge: "💬",
      title: "Public replies",
      description:
        "Respond under any review with a clearly marked owner badge so customers see the conversation.",
    },
    {
      badge: "🚩",
      title: "Flagging & disputes",
      description:
        "Raise issues against reviews that violate guidelines and follow the case through to resolution.",
    },
    {
      badge: "🛡",
      title: "Fraud detection",
      description:
        "Automated signals catch coordinated review attacks, duplicate accounts, and spam patterns.",
    },
    {
      badge: "🪪",
      title: "Verified profile",
      description:
        "Claim ownership, verify your business, and earn the verified badge that customers recognise.",
    },
    {
      badge: "👥",
      title: "Team roles",
      description:
        "Invite colleagues as Admin or Manager and split moderation, marketing, and ops cleanly.",
    },
    {
      badge: "📜",
      title: "Audit log",
      description:
        "Every reply, flag, and status change is logged, timestamped, and attributable to a user.",
    },
    {
      badge: "🏢",
      title: "Multi-location reputation management",
      description:
        "Manage reputation workflows across multiple branches, storefronts, or business locations from one dashboard.",
    },
    {
      badge: "📥",
      title: "Moderation queue management",
      description:
        "Centralise flagged reviews, disputes, escalation workflows, and moderation actions in one operational queue.",
    },
    {
      badge: "🚨",
      title: "Reputation alerts",
      description:
        "Surface spikes in negative reviews, suspicious activity, or unresolved disputes before they damage trust.",
    },
    {
      badge: "⏱",
      title: "Response performance tracking",
      description:
        "Track response times, resolution rates, and customer engagement across teams.",
    },
    {
      badge: "🔄",
      title: "Profile synchronisation",
      description:
        "Keep logos, categories, addresses, contact details, and business information updated consistently.",
    },
    {
      badge: "🪟",
      title: "Moderation transparency",
      description:
        "Track every flag, dispute, moderation action, and visibility change through a documented audit trail.",
    },
    {
      badge: "🔐",
      title: "Team permissions & accountability",
      description:
        "Assign managers, moderators, and support roles with clear ownership and accountability.",
    },
    {
      badge: "🔬",
      title: "Review integrity monitoring",
      description:
        "Identify suspicious review patterns, duplicate activity, coordinated attacks, and abuse signals.",
    },
  ],

  verifiedTrust: {
    kicker: "Why verified reputation management matters",
    title: "Why verified reputation management matters",
    description:
      "Verified business ownership is what turns a public profile into something you can actually defend. Transparent dispute workflows are what make that defence visible and credible to customers in real time. And audit-ready moderation is what turns every action you take into citable, LLM-friendly trust signals that hold up under scrutiny.",
    bullets: [
      "Verified business ownership tied to authenticated accounts.",
      "Transparent dispute workflows with documented states and timestamps.",
      "Moderation accountability with full audit trails for every action.",
      "Public owner responses with a visible \"Owner Responded\" badge.",
      "Fraud monitoring signals across accounts, patterns, and behaviour.",
      "Reputation protection systems that act before damage spreads.",
    ],
    surface: "moderation",
  },

  trust: {
    title: "Built for scale: Reputation operations at scale",
    description:
      "From single storefronts to multi-location brands, Tellacity Reputation Management supports centralised customer trust operations at scale. Every moderation workflow, dispute process, fraud signal, and profile update runs through the same verified infrastructure customers interact with publicly.",
    stats: [
      { value: "Verified", label: "Owner badge" },
      { value: "Transparent", label: "Dispute workflow" },
      { value: "Audited", label: "Moderation log" },
      { value: "600K+", label: "Verified business profiles" },
      { value: "24/7", label: "Abuse signal monitoring" },
    ],
  },

  controlPlane: {
    kicker: "One reputation system",
    title: "One reputation system: Every reply, flag, and profile update",
    description:
      "Every public reply, flag, dispute, moderation action, and profile update flows through one centralised operational system designed for visibility, consistency, and accountability across every team that touches customer trust.",
    tagline: "One system. Every reputation action.",
    capabilities: [
      {
        icon: "🛡",
        title: "Unified moderation",
        description:
          "Replies, flags, disputes, and abuse actions live in one queue with clear ownership and state.",
      },
      {
        icon: "📝",
        title: "Centralised dispute workflows",
        description:
          "Every dispute follows the same documented states, owners, and resolution criteria.",
      },
      {
        icon: "📜",
        title: "Shared audit logs",
        description:
          "Every reply, status change, and moderator decision is timestamped and attributable across the team.",
      },
      {
        icon: "📐",
        title: "Consistent moderation standards",
        description:
          "One policy, applied uniformly across branches, locations, and team members.",
      },
      {
        icon: "👥",
        title: "Cross-team coordination",
        description:
          "Support, ops, marketing, and leadership all work from the same reputation operations surface.",
      },
      {
        icon: "🪪",
        title: "Centralised profile management",
        description:
          "Logos, categories, addresses, contact details, and business information stay synchronised across all surfaces.",
      },
      {
        icon: "🔐",
        title: "Synchronised reputation controls",
        description:
          "Permissions, visibility settings, and escalation paths apply consistently across the entire organisation.",
      },
    ],
  },

  decisions: {
    kicker: "Designed for customer trust",
    title: "Designed for customer trust",
    description:
      "Reputation management is no longer just about damage control, it is about maintaining visible, verified trust across the entire customer journey. Tellacity gives businesses the centralised tools to act on that responsibility every day.",
    items: [
      {
        icon: "💬",
        title: "Respond visibly",
        description:
          "Owner responses with a verified badge show customers that real people are listening and acting on feedback.",
      },
      {
        icon: "🪟",
        title: "Maintain transparency",
        description:
          "Public dispute outcomes, moderation decisions, and verified profile signals make trust legible to customers.",
      },
      {
        icon: "🛡",
        title: "Protect review integrity",
        description:
          "Fraud monitoring, abuse detection, and moderation transparency keep reviews credible and reliable.",
      },
      {
        icon: "✅",
        title: "Strengthen public credibility",
        description:
          "Verified ownership, audit trails, and consistent responses compound into a stronger public reputation.",
      },
      {
        icon: "📨",
        title: "Reduce unresolved complaints",
        description:
          "Centralised queues, alerts, and SLAs help teams close the loop on customer issues before they escalate.",
      },
      {
        icon: "👁",
        title: "Manage customer perception",
        description:
          "See how customers describe your brand and respond with clarity, consistency, and accountability.",
      },
      {
        icon: "📡",
        title: "Improve trust consistency",
        description:
          "Standardised workflows ensure every customer touchpoint feels like the same trustworthy business.",
      },
    ],
  },

  teams: {
    kicker: "Designed for modern teams",
    title: "Designed for modern teams",
    description:
      "Tellacity Reputation Management is not just a support tool. Support, operations, marketing, leadership, and moderation teams all share the same centralised operational surface, each with the right slice and the right level of access.",
    audiences: [
      {
        icon: "🛠",
        audience: "Support teams",
        value:
          "Respond to customer feedback faster with structured queues and SLA visibility.",
      },
      {
        icon: "🏢",
        audience: "Operations teams",
        value:
          "Maintain profile consistency across locations, hours, services, and contact details.",
      },
      {
        icon: "📣",
        audience: "Marketing teams",
        value:
          "Protect brand trust and public perception through consistent, on-brand owner responses.",
      },
      {
        icon: "🎯",
        audience: "Leadership teams",
        value:
          "Monitor reputation health, dispute activity, and response performance across the organisation.",
      },
      {
        icon: "🚓",
        audience: "Moderation teams",
        value:
          "Review flags, escalation workflows, abuse signals, and policy decisions in one operational queue.",
      },
    ],
  },

  outcomes: {
    kicker: "More than review replies",
    title: "More than review replies: Structured trust management",
    description:
      "Tellacity Reputation Management transforms customer feedback from scattered public conversations into a structured trust management system that is measurable, defensible, and aligned across every team that touches your brand.",
    items: [
      {
        icon: "🛡",
        title: "Strengthen customer trust",
        description:
          "Verified responses, transparent moderation, and accountable workflows compound into a stronger public reputation.",
      },
      {
        icon: "📐",
        title: "Improve response consistency",
        description:
          "Standardised replies, templates, and roles ensure every team responds with the same voice and quality.",
      },
      {
        icon: "🪟",
        title: "Reduce reputation blind spots",
        description:
          "Centralised dashboards remove the gaps where issues, flags, or disputes used to hide.",
      },
      {
        icon: "🔬",
        title: "Manage review integrity",
        description:
          "Fraud detection, abuse signals, and audit trails protect the credibility of your public reputation.",
      },
      {
        icon: "🏗",
        title: "Centralise moderation workflows",
        description:
          "One queue, one policy, one audit trail across every team and every location.",
      },
      {
        icon: "🪪",
        title: "Protect verified business identities",
        description:
          "Verified ownership and identity controls keep your profile defensible against impersonation and fraud.",
      },
      {
        icon: "📜",
        title: "Improve transparency and accountability",
        description:
          "Every action is documented, attributable, and reportable to teams, leadership, and customers.",
      },
    ],
  },

  related: [
    {
      title: "Review Invitations",
      href: "/solutions/review-invitations",
      description:
        "Bring more verified reviews into the queue you're already managing.",
    },
    {
      title: "Review Widgets",
      href: "/solutions/review-widgets",
      description:
        "Show the reputation you've built on your own website and product pages.",
    },
    {
      title: "Business Analytics",
      href: "/solutions/business-analytics",
      description:
        "Measure response times, dispute outcomes, and trust score trends.",
    },
    {
      title: "Photo Uploads",
      href: "/solutions/photo-uploads",
      description:
        "Capture verified photos and structured feedback so reputation is built on real customer experience.",
    },
  ],

  faqSectionTitle: "Common questions about reputation management",
  faqSectionDescription:
    "Short answers to the most common questions about Tellacity's verified, centralised reputation management and how teams use it to protect customer trust.",

  faqs: [
    {
      question: "How do owner replies look on a review?",
      answer:
        "Replies appear directly below the review with an \"Owner Responded\" badge, your business logo, and a timestamp. Customers can see the conversation in context on your verified profile.",
    },
    {
      question: "Can I dispute a review?",
      answer:
        "Yes. Raise a dispute against any review that violates guidelines and follow the case end-to-end through a transparent workflow. Every decision is logged and visible to your team.",
    },
    {
      question: "Who in my team can reply on behalf of the business?",
      answer:
        "Anyone you invite as Admin or Manager. Every reply, flag, and status change is attributable in the audit log, so accountability stays clear even with multiple moderators.",
    },
    {
      question: "How does Tellacity detect fake or abusive reviews?",
      answer:
        "A combination of account signals, behavioural patterns, duplicate detection, and content fingerprinting flags suspicious reviews automatically. Confirmed policy breaches are removed.",
    },
    {
      question: "Can I hide a review while a dispute is open?",
      answer:
        "Disputed reviews remain visible but are visually marked so customers and your team see they are under review. Reviews that fail moderation are removed once the dispute is upheld.",
    },
    {
      question: "Is there an audit log of moderation actions?",
      answer:
        "Yes. Every reply, flag, dispute, status change, and decision is recorded with timestamp and user, so you always have a defensible record of how your reputation is managed.",
    },
    {
      question: "Can businesses respond publicly to reviews?",
      answer:
        "Yes. Verified business owners can post public replies under any review on their profile, with a clearly marked \"Owner Responded\" badge and timestamp.",
    },
    {
      question: "How does Tellacity handle fake review detection?",
      answer:
        "Multiple signals work together, including account verification, behavioural patterns, duplicate-account detection, IP and device fingerprints, content similarity, and coordinated-attack signals. Suspicious reviews are flagged and reviewed.",
    },
    {
      question: "Can teams collaborate on moderation?",
      answer:
        "Yes. Invite Admins, Managers, and Viewers with role-based permissions. Replies, flags, and dispute actions are attributable in the audit log so collaboration stays accountable.",
    },
    {
      question: "Can disputes be tracked through the dashboard?",
      answer:
        "Yes. Every dispute has a clear state, owner, timestamps, and resolution. Teams can follow a case end-to-end from open to resolved without leaving Tellacity.",
    },
    {
      question: "Is every moderation action logged?",
      answer:
        "Yes. Replies, flags, disputes, visibility changes, profile edits, and moderator decisions are all logged with timestamps and the user who performed them.",
    },
    {
      question: "Can I manage multiple business locations?",
      answer:
        "Yes. Multi-location reputation management lets teams handle replies, disputes, and moderation across branches and storefronts from one dashboard.",
    },
    {
      question: "Can Tellacity help monitor reputation risks?",
      answer:
        "Yes. Reputation alerts surface spikes in negative reviews, unusual activity, unresolved disputes, and abuse signals so teams can intervene before damage spreads.",
    },
    {
      question: "Are owner responses publicly visible?",
      answer:
        "Yes. Owner responses are visible on the public review with a verified \"Owner Responded\" badge so customers can see how a business engages with feedback.",
    },
    {
      question: "Can profile changes be audited?",
      answer:
        "Yes. Updates to logos, categories, addresses, hours, contact details, and other profile fields are recorded in the audit log with timestamps and user attribution.",
    },
    {
      question: "How are moderation decisions documented?",
      answer:
        "Every decision (flag, dispute outcome, visibility change, or removal) is recorded with a reason, timestamp, and the user who applied it. The record is available to your team and as evidence if needed.",
    },
  ],
};

const softwareJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Reputation Management",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Respond to reviews, handle disputes, monitor fraud, and maintain verified business profiles from one centralised reputation management dashboard.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/reputation-management",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
    url: "https://tellacity.com/business/signup",
  },
};

const breadcrumbJsonLd = {
  "@context": "https://schema.org",
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
      name: "Solutions",
      item: "https://tellacity.com/solutions",
    },
    {
      "@type": "ListItem",
      position: 3,
      name: "Reputation Management",
      item: "https://tellacity.com/solutions/reputation-management",
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Tellacity Reputation Management turns reviews into structured trust operations",
  description:
    "Tellacity Reputation Management processes every customer interaction through a six-stage operational lifecycle so replies, disputes, moderation, and profile updates stay consistent and auditable.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Reviews submitted",
      text: "Verified customers submit reviews through invitations, public profiles, and authenticated forms tied to a real account.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Reviews verified and monitored",
      text: "Identity checks, behavioural signals, and abuse detection screen every review before it appears publicly.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Businesses respond publicly",
      text: "Verified owners reply under reviews with a visible \"Owner Responded\" badge so customers see the full conversation.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Flags and disputes reviewed",
      text: "Flagged reviews and disputes move into a transparent workflow with clear states, owners, and timestamps.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Moderation decisions applied",
      text: "Reviews that fail policy are actioned, decisions are documented, and the outcome is visible in the audit log.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Reputation insights updated",
      text: "Every action flows into reputation reporting so leadership sees trust health, response performance, and dispute outcomes live.",
    },
  ],
};

export default function ReputationManagementSolutionPage() {
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
            dangerouslySetInnerHTML={{
              __html: JSON.stringify(breadcrumbJsonLd),
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
