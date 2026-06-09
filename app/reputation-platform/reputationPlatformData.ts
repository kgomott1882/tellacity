export type PlatformCard = {
  badge: string;
  title: string;
  tagline: string;
  description: string;
  detail: string;
  href: string;
  image?: string;
  imageAlt?: string;
  imageTop?: string;
  /** Controls thumbnail crop in module grid on for-business page. */
  imageFit?: "cover" | "contain" | "contain-2x";
  icon: "mail" | "star" | "barChart2" | "shield" | "camera" | "award";
  iconAccent: "teal" | "forest";
};

export const PLATFORM_CARDS: PlatformCard[] = [
  {
    badge: "✉",
    title: "Review Invitations",
    tagline: "Collect verified reviews from every customer interaction.",
    description:
      "Send branded, automated review invitations after every purchase, appointment, or completed service, with reminders, proof-of-purchase, and per-channel attribution built in.",
    detail:
      "Branded, automated invites after purchase or service completion help you collect feedback consistently, not only when customers remember to leave a review on their own.",
    href: "/solutions/review-invitations",
    imageTop: "/brand/Branded_review_requests.jpeg",
    icon: "mail",
    iconAccent: "teal",
  },
  {
    badge: "⭐",
    title: "Review Widgets",
    tagline: "Show real trust on every page of your site.",
    description:
      "Embed live, verified review widgets on product, pricing, checkout, and marketing pages, all reading from one centralised feed and updating automatically.",
    detail:
      "Live, verified widgets on product and marketing pages show the same proof customers see on your Tellacity profile, without copying static testimonials by hand.",
    href: "/solutions/review-widgets",
    imageTop: "/brand/Widgets.png",
    icon: "star",
    iconAccent: "forest",
  },
  {
    badge: "📊",
    title: "Business Analytics",
    tagline: "See exactly what's driving your trust score.",
    description:
      "Track verified review trends, sentiment, response performance, and multi-location reputation from one centralised analytics dashboard.",
    detail:
      "Trends, sentiment, response performance, and multi-location views help teams understand what is improving trust, and what needs attention.",
    href: "/solutions/business-analytics",
    imageTop: "/brand/Analytics%20PC.jpeg",
    icon: "barChart2",
    iconAccent: "teal",
  },
  {
    badge: "🛡",
    title: "Reputation Management",
    tagline: "Own your brand across every customer touchpoint.",
    description:
      "Reply, moderate, dispute, and protect your verified profile from one operational dashboard, with audit logs and fraud detection built in.",
    detail:
      "Reply publicly, moderate content, dispute inaccurate feedback, and protect your verified profile from one operational dashboard, not scattered inboxes.",
    href: "/solutions/reputation-management",
    imageTop: "/brand/Invite_links_QR_codes_collect.jpeg",
    imageFit: "contain",
    icon: "shield",
    iconAccent: "forest",
  },
  {
    badge: "📷",
    title: "Photo Uploads",
    tagline: "Real photos, real feedback, real proof.",
    description:
      "Capture verified, moderated customer photos with product attribution, threaded follow-ups, and ImageObject schema for richer search snippets.",
    detail:
      "Moderated customer photos with product attribution add visual proof to reviews and support richer, structured presentation where policies allow.",
    href: "/solutions/photo-uploads",
    imageTop: "/brand/Gallery%20Photos.png",
    icon: "camera",
    iconAccent: "teal",
  },
  {
    badge: "🏆",
    title: "Your Reputation",
    tagline: "One verified profile customers can trust.",
    description:
      "Your Tellacity profile brings verified reviews, responses, photos, and trust signals into one public home customers can find, share, and cite.",
    detail:
      "Instead of scattered proof across sites and screenshots, your reputation lives in one place that stays current as new feedback comes in.",
    href: "/for-business",
    image: "/brand/Your%20Reputation.png",
    imageAlt: "Your Tellacity reputation profile with verified reviews and trust signals",
    imageTop: "/brand/Your%20Reputation.png",
    imageFit: "contain-2x",
    icon: "award",
    iconAccent: "forest",
  },
];

export const KEY_BENEFITS = [
  {
    title: "One Source of Truth",
    detail:
      "Reviews, replies, photos, and analytics draw from the same verified pipeline instead of conflicting spreadsheets and tools.",
    icon: "database" as const,
    accent: "teal" as const,
  },
  {
    title: "Verified Reviews",
    detail:
      "Collect and display feedback tied to real customer interactions, not disconnected ratings copied from elsewhere.",
    icon: "badgeCheck" as const,
    accent: "forest" as const,
  },
  {
    title: "All-in-One Workflow",
    detail:
      "Invite customers, respond publicly, embed proof, and measure performance without switching systems.",
    icon: "workflow" as const,
    accent: "teal" as const,
  },
  {
    title: "Better Visibility",
    detail:
      "Structured, consistent proof on your profile and site is easier to understand, cite, and defend over time.",
    icon: "search" as const,
    accent: "forest" as const,
  },
  {
    title: "Long-term Growth",
    detail:
      "Trust compounds as verified feedback, responses, and insights accumulate, not as one-off campaign assets.",
    icon: "trendingUp" as const,
    accent: "teal" as const,
  },
];

export const PLATFORM_FEATURES = [
  {
    title: "One verified pipeline",
    detail:
      "Reviews collected through invitations feed the widgets on your site and power analytics leadership tracks.",
  },
  {
    title: "One centralised dashboard",
    detail:
      "Replies, disputes, and photo uploads run through the same operational system your team uses every day.",
  },
  {
    title: "Every module shares same data",
    detail:
      "Each module works on its own, but together they turn feedback into a measurable, defensible trust signal.",
  },
  {
    title: "Audit trails and moderation aligned",
    detail:
      "Moderation and audit trails align to our Safety & Trust framework — one policy layer across the platform.",
  },
];

export const PROBLEM_POINTS = [
  {
    label: "Reviews scattered across disconnected tools",
    detail: "Feedback lives in third-party sites, inboxes, and spreadsheets — never one source of truth.",
  },
  {
    label: "Teams see conflicting trust scores",
    detail: "Leadership, support, and marketing read different numbers and stale testimonials.",
  },
  {
    label: "Search engines see fragmented signals",
    detail: "Without one verified, structured source, reputation is harder to cite and defend.",
  },
];

export const WORKFLOW_STEPS = [
  {
    title: "Invite customers",
    detail:
      "Send branded review invitations after purchases, appointments, or completed services through email, SMS, or QR workflows.",
  },
  {
    title: "Collect verified feedback",
    detail:
      "Customers submit reviews through Tellacity's verified review path; proof and moderation standards apply before content is published.",
  },
  {
    title: "Moderate and manage responses",
    detail:
      "Your team replies, flags issues, and resolves disputes from one dashboard aligned with our trust policies.",
  },
  {
    title: "Publish widgets and photos",
    detail:
      "Verified reviews and moderated photos appear on your profile, widgets, and marketing touchpoints from the same feed.",
  },
  {
    title: "Track analytics and improve",
    detail:
      "Analytics show trends, sentiment, and response performance so you can act on feedback, not just collect it.",
  },
];

export const TEAM_USE_CASES = [
  {
    icon: "📣",
    team: "Marketing teams",
    benefit: "Main benefit: social proof and conversion at decision points.",
    body: "Surface verified customer trust where buyers actually make decisions, then turn authentic photo reviews into social proof across campaigns, widgets, and product pages.",
    links: [
      { label: "Review Widgets", href: "/solutions/review-widgets" },
      { label: "Photo Uploads", href: "/solutions/photo-uploads" },
    ],
  },
  {
    icon: "🛠",
    team: "Support teams",
    benefit: "Main benefit: faster issue resolution with full review context.",
    body: "Respond faster with one centralised queue for replies, flags, and disputes, while live analytics surface the issues hurting customer trust before they spread.",
    links: [
      { label: "Reputation Management", href: "/solutions/reputation-management" },
      { label: "Business Analytics", href: "/solutions/business-analytics" },
    ],
  },
  {
    icon: "🏢",
    team: "Operations teams",
    benefit: "Main benefit: multi-location consistency from one system.",
    body: "Compare locations, branches, and service regions side by side, then enforce consistent reputation workflows from one operational system.",
    links: [
      { label: "Business Analytics", href: "/solutions/business-analytics" },
      { label: "Reputation Management", href: "/solutions/reputation-management" },
    ],
  },
  {
    icon: "🎯",
    team: "Leadership teams",
    benefit: "Main benefit: visibility into trust performance across the org.",
    body: "Track verified trust score health, dispute outcomes, and response performance across the organisation from one centralised, export-ready dashboard.",
    links: [
      { label: "Business Analytics", href: "/solutions/business-analytics" },
      { label: "Reputation Management", href: "/solutions/reputation-management" },
    ],
  },
  {
    icon: "🧪",
    team: "Product teams",
    benefit: "Main benefit: spot recurring issues and quantify impact.",
    body: "Spot recurring product issues earlier with visual customer feedback, then quantify the impact with product-level analytics tied to verified reviews.",
    links: [
      { label: "Photo Uploads", href: "/solutions/photo-uploads" },
      { label: "Business Analytics", href: "/solutions/business-analytics" },
    ],
  },
];

export const PLATFORM_FAQS = [
  {
    question: "What is the Tellacity Reputation Management Platform?",
    answer:
      "The Tellacity Reputation Management Platform is one centralised system for building verified customer trust. It connects review invitations, review widgets, business analytics, reputation management, and photo uploads, so every part of your customer feedback workflow runs from the same verified review infrastructure. That connected design is what makes trust signals more defensible and easier to manage over time.",
  },
  {
    question: "Can I use only one part of the platform?",
    answer:
      "Yes. Every solution works on its own, many businesses start with Review Invitations or Reputation Management and add modules later. Because everything shares the same platform, turning on widgets, analytics, or photo uploads never means migrating data or reconciling conflicting sources.",
  },
  {
    question: "How quickly does the platform integrate with my site?",
    answer:
      "Most businesses are live in under a day: claim your verified Tellacity profile, send your first review invitations, and add a widget snippet to your site. Integration is designed to be fast and practical depending on your setup, there is no build step, no framework lock-in, and no separate logins between modules.",
  },
  {
    question: "Are all reviews and photos verified?",
    answer:
      "Tellacity is built around verified customer feedback. Reviews are tied to authenticated customer accounts, with optional proof-of-purchase, and photos pass through EXIF-stripping plus automated moderation before they go live. Verification status depends on the review and photo path, content must meet policy checks before it appears publicly, and every action is logged in an audit trail.",
  },
  {
    question: "How does the platform improve SEO and trust signals?",
    answer:
      "The platform keeps structured, current, and consistent proof on your profile, widgets, and review pages, including schema such as Review, AggregateRating, and ImageObject where applicable. That helps customers, search engines, and AI systems see the same citable trust signals instead of stale or fragmented copies. Results depend on your content and implementation, but one consistent source is easier to trust and defend.",
  },
];

export const RELATED_PAGES = [
  { href: "/for-business", label: "Tellacity for Business" },
  { href: "/pricing", label: "Pricing" },
  { href: "/help-center", label: "Help Center" },
  { href: "/faq", label: "FAQ" },
  { href: "/safety-trust", label: "Safety & Trust" },
  { href: "/reviewer-guidelines", label: "Reviewer Guidelines" },
  { href: "/how-tellacity-works", label: "How Tellacity Works" },
  { href: "/resources", label: "Resources" },
];
