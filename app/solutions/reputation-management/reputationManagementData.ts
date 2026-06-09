/** Section imagery from /public/brand where noted; workflow may use Unsplash. */
function brandImage(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

export const RM_IMAGES = {
  heroRight: brandImage("Reputation GOGO.jpeg"),
  challenge: brandImage("Team presentation.png"),
  solutionMain: brandImage("Review Shopping Girl.jpeg"),
  solutionSecondary: brandImage("Fully audited.png"),
  workflowBg:
    "https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1600&q=80",
  workflowBanner: brandImage("QR code Reviews.jpeg"),
  features: brandImage("Handshake.png"),
  trustTop: brandImage("smallbusiness.png"),
  trustBottom: brandImage("Steak_salad_restaurant_menu_picture_202606011551.jpeg"),
  controlBanner: brandImage("Office discussion.png"),
  decisions: brandImage("Happy Eployees 2.png"),
  teamsBg:
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80",
  teamsBanner: brandImage("Team Reads the Same Data.png"),
  outcomes: brandImage("Trust signals.png"),
  /** Same related card images as /solutions/business-analytics */
  relatedInvitations: brandImage("Inside Tellacity.png"),
  relatedWidgets: brandImage("Widgets.png"),
  relatedAnalytics: brandImage("analysis trust.jpg"),
  relatedPhotos: brandImage("Branded_cards_for_work_purpose_202606011502.jpeg"),
} as const;

export type ProblemIconVariant = "amber" | "orange" | "red" | "teal";

export const PROBLEM_ICON_CONFIG: { variant: ProblemIconVariant }[] = [
  { variant: "amber" },
  { variant: "red" },
  { variant: "orange" },
  { variant: "red" },
  { variant: "amber" },
  { variant: "teal" },
  { variant: "orange" },
];

export type FeatureIconKey =
  | "messageSquare"
  | "flag"
  | "shield"
  | "badgeCheck"
  | "users"
  | "scrollText"
  | "building"
  | "inbox"
  | "bell"
  | "timer"
  | "refresh"
  | "eye"
  | "lock"
  | "search";

export const FEATURE_ICON_CONFIG: { icon: FeatureIconKey; accent: "teal" | "forest" }[] = [
  { icon: "messageSquare", accent: "teal" },
  { icon: "flag", accent: "forest" },
  { icon: "shield", accent: "teal" },
  { icon: "badgeCheck", accent: "forest" },
  { icon: "users", accent: "teal" },
  { icon: "scrollText", accent: "forest" },
  { icon: "building", accent: "teal" },
  { icon: "inbox", accent: "forest" },
  { icon: "bell", accent: "teal" },
  { icon: "timer", accent: "forest" },
  { icon: "refresh", accent: "teal" },
  { icon: "eye", accent: "forest" },
  { icon: "lock", accent: "teal" },
  { icon: "search", accent: "forest" },
];

export const CONTROL_ICON_CONFIG: { icon: FeatureIconKey | "fileText" | "sliders"; accent: "teal" | "forest" }[] = [
  { icon: "shield", accent: "teal" },
  { icon: "fileText", accent: "forest" },
  { icon: "scrollText", accent: "teal" },
  { icon: "sliders", accent: "forest" },
  { icon: "users", accent: "teal" },
  { icon: "badgeCheck", accent: "forest" },
  { icon: "lock", accent: "teal" },
];

export const RELATED_CARD_IMAGES: Record<string, string> = {
  "Review Invitations": RM_IMAGES.relatedInvitations,
  "Review Widgets": RM_IMAGES.relatedWidgets,
  "Business Analytics": RM_IMAGES.relatedAnalytics,
  "Photo Uploads": RM_IMAGES.relatedPhotos,
};

export const HERO = {
  breadcrumb: { label: "Part of Tellacity for Business", href: "/for-business#platform-modules" },
  kicker: "REPUTATION MANAGEMENT",
  headline: { lead: "Reputation Management for", accent: "Verified Customer Trust" },
  valuePropParagraphs: [
    "Manage customer trust from one centralised reputation operations dashboard.",
    "Tellacity helps businesses respond to reviews, handle disputes, monitor abuse signals, maintain verified profiles, track moderation workflows, and protect public trust across every customer-facing surface.",
  ],
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Open dashboard", href: "/business/dashboard" },
  trustStrip: [
    "Verified business profiles",
    "Transparent dispute workflows",
    "Fraud & abuse monitoring",
    "Moderation audit logs",
    "Team-based reputation management",
  ],
} as const;

export const PROBLEM = {
  kicker: "The challenge",
  title: { lead: "Why Most Teams Struggle", accent: "with Reputation Issues" },
  description:
    "Verified reputation only holds up when replies, flags, disputes, moderation, and profile updates all live in one centralised system. Without that, the same operational blind spots keep showing up where customer trust is decided.",
  bannerQuote: "Reputation issues spread faster than teams can react.",
  items: [
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
} as const;

export const SOLUTION = {
  kicker: "The solution",
  title: { lead: "How Tellacity Turns Reviews into", accent: "Structured Trust Management" },
  description:
    "The Tellacity dashboard puts every public reply, flag, dispute, fraud signal, and profile update in a single centralised workflow. Your team works from one queue, customers get faster owner responses, and every policy decision is recorded in the audit log end-to-end.",
  bullets: [
    "Reply directly under any review with an Owner Responded badge.",
    "Flag and dispute reviews through a transparent, documented workflow.",
    "Built-in fraud signals: duplicate accounts, suspicious patterns, abuse.",
    "Keep your verified profile current with logo, address, categories, and hours.",
    "Audit log of every reply, status change, and moderator decision.",
  ],
  tagline: "One queue. Every reputation action. Fully audited.",
} as const;

export const WORKFLOW = {
  kicker: "How the reputation system works",
  title: { lead: "How the Reputation", accent: "System Works" },
  description:
    "Every customer interaction on Tellacity flows through the same centralised operational pipeline, from review submission through verification, public reply, moderation, and reporting, so accountability is documented at every step.",
  bannerQuote: "Every action documented. Every decision auditable.",
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
} as const;

export const FEATURES_SECTION = {
  kicker: "Built into the dashboard",
  title: { lead: "Key Reputation Management", accent: "Features at a Glance" },
  description:
    "Every capability below is part of the live Tellacity business dashboard and is available the moment you claim your profile. Built for centralised reputation operations across public replies, moderation, fraud detection, verified profiles, and audit logs.",
  banner: {
    lead: "Built for centralised reputation operations.",
    sub: "Available from day one in your dashboard.",
  },
  items: [
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
} as const;

export const VERIFIED_TRUST = {
  kicker: "Why verified reputation management matters",
  title: { lead: "Why Verified Reputation", accent: "Management Matters" },
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
} as const;

export const TRUST_STATS = {
  title: "Built for scale",
  subtitle: "Reputation operations at scale",
  stats: [
    { value: "Verified", label: "Owner badge" },
    { value: "Transparent", label: "Dispute workflow" },
    { value: "Audited", label: "Moderation log" },
    { value: "600K+", label: "Verified business profiles" },
    { value: "24/7", label: "Abuse signal monitoring" },
  ],
} as const;

export const CONTROL_PLANE = {
  kicker: "One reputation system",
  title: { lead: "One Reputation System:", accent: "Every Reply, Flag & Profile Update" },
  description:
    "Every public reply, flag, dispute, moderation action, and profile update flows through one centralised operational system designed for visibility, consistency, and accountability across every team that touches customer trust.",
  tagline: "One system. Every reputation action.",
  taglineAccent: "Fully auditable.",
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
} as const;

export const DECISIONS = {
  kicker: "Designed for customer trust",
  title: { lead: "Designed for", accent: "Customer Trust" },
  description:
    "Reputation management is no longer just about damage control, it is about maintaining visible, verified trust across the entire customer journey. Tellacity gives businesses the centralised tools to act on that responsibility every day.",
  banner: {
    lead: "Reputation management is no longer damage control.",
    accent: "It is visible, verified trust.",
  },
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
} as const;

export const TEAMS = {
  kicker: "Designed for modern teams",
  title: { lead: "Designed for", accent: "Modern Teams" },
  description:
    "Tellacity Reputation Management is not just a support tool. Support, operations, marketing, leadership, and moderation teams all share the same centralised operational surface, each with the right slice and the right level of access.",
  audiences: [
    {
      icon: "🛠",
      audience: "Support teams",
      tag: "Faster resolution",
      value:
        "Respond to customer feedback faster with structured queues and SLA visibility.",
    },
    {
      icon: "🏢",
      audience: "Operations teams",
      tag: "Profile consistency",
      value:
        "Maintain profile consistency across locations, hours, services, and contact details.",
    },
    {
      icon: "📣",
      audience: "Marketing teams",
      tag: "Brand protection",
      value:
        "Protect brand trust and public perception through consistent, on-brand owner responses.",
    },
    {
      icon: "🎯",
      audience: "Leadership teams",
      tag: "Org-wide visibility",
      value:
        "Monitor reputation health, dispute activity, and response performance across the organisation.",
    },
    {
      icon: "🚓",
      audience: "Moderation teams",
      tag: "Policy enforcement",
      value:
        "Review flags, escalation workflows, abuse signals, and policy decisions in one operational queue.",
    },
  ],
} as const;

export const OUTCOMES = {
  kicker: "More than review replies",
  title: { lead: "More Than Review Replies:", accent: "Structured Trust Management" },
  description:
    "Tellacity Reputation Management transforms customer feedback from scattered public conversations into a structured trust management system that is measurable, defensible, and aligned across every team that touches your brand.",
  bannerQuote: "Measurable. Defensible. Aligned.",
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
} as const;

export const RELATED = {
  title: { lead: "Explore More", accent: "Solutions" },
  items: [
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
} as const;

export const FAQ = {
  title: { lead: "Common Questions", accent: "About Reputation Management" },
  description:
    "Short answers to the most common questions about Tellacity's verified, centralised reputation management and how teams use it to protect customer trust.",
  items: [
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
} as const;

export const FINAL_CTA = {
  title: "Start with Tellacity today.",
  description:
    "Claim your business profile, invite your first customers, and run your entire reputation programme from one dashboard.",
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Claim your business", href: "/suggest-business" },
  dashboardCta: { label: "Open dashboard", href: "/business/dashboard" },
  footnote: "Free to start · No credit card · Cancel anytime",
} as const;
