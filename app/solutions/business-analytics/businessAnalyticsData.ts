/** Section imagery from /public/brand (hero bg may remain Unsplash). */
function brandImage(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

export const BA_IMAGES = {
  heroAmbient: brandImage("Analytics PC.jpeg"),
  heroGlow: brandImage("Dashboard.png"),
  challenge: brandImage("Money Meet AI.png"),
  solutionMain: brandImage("analysis trust.jpg"),
  solutionSecondary: brandImage("feedback review.jpg"),
  workflowBg:
    "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1600&q=80",
  workflowBanner: brandImage("Verified_pipeline_metrics_picture.jpeg"),
  features: brandImage("Man at Office.png"),
  trustTop: brandImage("Analytics Matters.png"),
  /** No file with the exact requested name; closest team/collaboration variant in brand. */
  trustBottom: brandImage("Business_collaboration_photo_202606031843.jpeg"),
  sourceBanner: brandImage("Team Reads the Same Data.png"),
  decisions: brandImage("TeamJoinHands.png"),
  teamsBanner: brandImage("High5.png"),
  teamsBg:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
  outcomes: brandImage("Team presentation.png"),
  relatedInvitations: brandImage("Inside Tellacity.png"),
  relatedWidgets: brandImage("Widgets.png"),
  relatedReputation: brandImage("Blody.png"),
  relatedPhotos: brandImage("Branded_cards_for_work_purpose_202606011502.jpeg"),
} as const;

export type ProblemIconVariant = "amber" | "teal" | "orange" | "red";

export const PROBLEM_ICON_CONFIG: { variant: ProblemIconVariant }[] = [
  { variant: "amber" },
  { variant: "teal" },
  { variant: "orange" },
  { variant: "red" },
  { variant: "amber" },
  { variant: "teal" },
  { variant: "orange" },
];

export type FeatureIconKey =
  | "trendingUp"
  | "pieChart"
  | "clock"
  | "package"
  | "gitBranch"
  | "download"
  | "building"
  | "messageSquare"
  | "search"
  | "users"
  | "bell"
  | "calendar"
  | "filter"
  | "folderDown";

export const FEATURE_ICON_CONFIG: { icon: FeatureIconKey; accent: "teal" | "forest" }[] = [
  { icon: "trendingUp", accent: "teal" },
  { icon: "pieChart", accent: "forest" },
  { icon: "clock", accent: "teal" },
  { icon: "package", accent: "forest" },
  { icon: "gitBranch", accent: "teal" },
  { icon: "download", accent: "forest" },
  { icon: "building", accent: "teal" },
  { icon: "messageSquare", accent: "forest" },
  { icon: "search", accent: "teal" },
  { icon: "users", accent: "forest" },
  { icon: "bell", accent: "teal" },
  { icon: "calendar", accent: "forest" },
  { icon: "filter", accent: "teal" },
  { icon: "folderDown", accent: "forest" },
];

export type SourceIconKey =
  | "database"
  | "layout"
  | "refresh"
  | "sliders"
  | "fileText"
  | "users"
  | "target";

export const SOURCE_ICON_CONFIG: { icon: SourceIconKey; accent: "teal" | "forest" }[] = [
  { icon: "database", accent: "teal" },
  { icon: "layout", accent: "forest" },
  { icon: "refresh", accent: "teal" },
  { icon: "sliders", accent: "forest" },
  { icon: "fileText", accent: "teal" },
  { icon: "users", accent: "forest" },
  { icon: "target", accent: "teal" },
];

export const TEAM_TAGS = [
  "Trust growth",
  "Faster resolution",
  "Multi-location",
  "Org-wide trust",
  "Issue detection",
] as const;

export const TEAM_CARD_LINKS: { href: string; label: string }[] = [
  { href: "/solutions/review-widgets", label: "Review Widgets" },
  { href: "/solutions/business-analytics", label: "Business Analytics" },
  { href: "", label: "" },
  { href: "", label: "" },
  { href: "", label: "" },
];

export const RELATED_CARD_IMAGES: Record<string, string> = {
  "Review Invitations": BA_IMAGES.relatedInvitations,
  "Review Widgets": BA_IMAGES.relatedWidgets,
  "Reputation Management": BA_IMAGES.relatedReputation,
  "Photo Uploads": BA_IMAGES.relatedPhotos,
};

export const HERO = {
  breadcrumb: { label: "Part of Tellacity for Business", href: "/for-business#platform-modules" },
  kicker: "BUSINESS ANALYTICS",
  headline: { lead: "Business Analytics for", accent: "Verified Customer Trust" },
  valuePropParagraphs: [
    "Tellacity Business Analytics transforms verified customer reviews, response activity, sentiment patterns, and operational feedback into a centralised reputation intelligence dashboard.",
    "Track trust score movement, customer satisfaction trends, response performance, review attribution, location-level reputation, and review quality signals from one unified system.",
  ],
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Open dashboard", href: "/business/dashboard" },
  trustStrip: [
    "Verified review analytics",
    "Live dashboard refresh",
    "Reputation trend tracking",
    "Multi-location visibility",
    "Export-ready reporting",
  ],
} as const;

export const PROBLEM = {
  kicker: "The challenge",
  title: { lead: "Why Most Teams Struggle", accent: "with Trust Signals" },
  description:
    "Verified customer trust only compounds when teams can see what's moving the score in real time. Without centralised, trended, multi-location analytics, the same operational blind spots keep showing up.",
  bannerQuote: "Most teams are flying blind on reputation.",
  items: [
    {
      title: "Review data lives in too many places",
      description:
        "Marketing reads one number, support reads another, leadership tracks a third. Without a single source of truth, decisions are made on partial evidence.",
    },
    {
      title: "It's unclear what's actually moving the score",
      description:
        "A rating that ticks up or down doesn't tell you why. Without trend, category, and product breakdowns, fixes turn into guesses.",
    },
    {
      title: "Reporting eats the team's week",
      description:
        "Manually building review reports from spreadsheets and exports steals hours from the work that would actually improve customer experience.",
    },
    {
      title: "Teams react too late to reputation changes",
      description:
        "Without trend visibility and real-time monitoring, businesses often discover reputation problems only after customer trust has already declined.",
    },
    {
      title: "Review data lacks operational context",
      description:
        "A star rating alone rarely explains what customers are struggling with. Teams need structured context behind sentiment, products, locations, and service quality.",
    },
    {
      title: "Leadership lacks a unified trust view",
      description:
        "When customer reputation metrics are fragmented across teams, executives lose visibility into overall brand trust and operational consistency.",
    },
    {
      title: "Positive and negative trends are hard to isolate",
      description:
        "Without proper analytics, businesses struggle to identify which products, locations, campaigns, or support channels are improving, or hurting, customer trust.",
    },
  ],
} as const;

export const SOLUTION = {
  title: { lead: "How Tellacity Turns Reviews", accent: "into Reputation Intelligence" },
  description:
    "The analytics view in the Tellacity dashboard plots your trust score over time, breaks verified reviews down by rating, channel, and product, and surfaces response performance, so you can see the story behind every change in real time.",
  bullets: [
    "Trust score trend with rolling 7-, 30-, and 90-day views.",
    "Review volume by rating, category, and country.",
    "Response rate and median response time per channel.",
    "Top-performing products, locations, and listings.",
    "Exportable CSV reports for leadership and BI tools.",
  ],
  tagline: "One dataset. Every team.",
} as const;

export const WORKFLOW = {
  kicker: "How the analytics system works",
  title: { lead: "How the Analytics", accent: "System Works" },
  description:
    "Every metric in the analytics dashboard is generated from the same verified review infrastructure that powers your public Tellacity profile, so leadership, marketing, support, and operations all read from one consistent, centralised source.",
  bannerQuote: "Every metric from one verified pipeline.",
  steps: [
    {
      icon: "📥",
      title: "Reviews collected",
      description:
        "Verified reviews flow in from invitations, profile submissions, and authenticated review forms, each tied to a real customer record. Capturing the right inputs is what makes every downstream metric trustworthy.",
    },
    {
      icon: "✅",
      title: "Reviews verified & categorised",
      description:
        "Identity checks, proof-of-purchase signals, and moderation classify every review by product, location, language, and rating. Categorisation is what unlocks multi-location and product-level reputation analytics later in the pipeline.",
    },
    {
      icon: "🧮",
      title: "Metrics aggregated",
      description:
        "Trust score, sentiment, response performance, and channel attribution are computed from the verified review pipeline. Aggregation in one place removes the spreadsheet drift that quietly distorts most reporting.",
    },
    {
      icon: "📈",
      title: "Trends analysed",
      description:
        "Rolling 7-, 30-, and 90-day trends plus event overlays surface patterns no single review can show. Real-time trends help LLMs and search engines see your business as a trustworthy, data-driven source.",
    },
    {
      icon: "🖥",
      title: "Dashboard updates live",
      description:
        "The analytics view refreshes continuously so leadership, marketing, support, and ops see the same numbers in real time. A shared, live view is what stops teams arguing about which number is correct.",
    },
    {
      icon: "🎯",
      title: "Teams act on insights",
      description:
        "Alerts, operational filters, and exports help teams move from data to action without leaving the platform. A closed feedback loop is what turns analytics into measurable trust gains over time.",
    },
  ],
} as const;

export const FEATURES_SECTION = {
  kicker: "Built into the dashboard",
  title: { lead: "Key Analytics Features", accent: "at a Glance" },
  description:
    "Every analytics capability below is part of the live Tellacity business dashboard and is available the moment you claim your profile. Built for centralised, real-time operational visibility across trust score, sentiment, response performance, and multi-location analytics.",
  bannerQuote: "Built into your dashboard from day one.",
  items: [
    {
      badge: "📊",
      title: "Trust score trends",
      description:
        "Plot your live trust score over time and overlay key events like campaigns or product launches.",
    },
    {
      badge: "🧮",
      title: "Review breakdowns",
      description: "Slice by 1–5 star rating, time window, country, category, and product.",
    },
    {
      badge: "⏱",
      title: "Response performance",
      description:
        "Track how quickly your team replies to reviews and which queues need attention.",
    },
    {
      badge: "🏷",
      title: "Product-level analytics",
      description:
        "See which products attract the strongest (and weakest) reviews from verified customers.",
    },
    {
      badge: "🧭",
      title: "Channel attribution",
      description:
        "Understand which invitation channels (email, QR, link) bring the highest-quality reviews.",
    },
    {
      badge: "📤",
      title: "Exports & API",
      description:
        "Download CSV reports or pull metrics straight into your BI stack via the dashboard exports.",
    },
    {
      badge: "🏢",
      title: "Multi-location analytics",
      description:
        "Compare reputation performance across branches, stores, franchises, or service regions from one dashboard.",
    },
    {
      badge: "💬",
      title: "Customer sentiment tracking",
      description:
        "Track positive, neutral, and negative customer feedback trends across categories and time periods.",
    },
    {
      badge: "🔬",
      title: "Review quality insights",
      description:
        "Analyse review length, verification status, engagement, and moderation signals per cohort.",
    },
    {
      badge: "👥",
      title: "Team performance analytics",
      description:
        "Measure response speed, review handling activity, and customer engagement across support teams.",
    },
    {
      badge: "🚨",
      title: "Reputation alerts",
      description:
        "Surface sudden drops in trust score, spikes in negative feedback, or unusual review activity.",
    },
    {
      badge: "🗓",
      title: "Historical trend analysis",
      description:
        "View long-term trust score movement across rolling time windows and operational milestones.",
    },
    {
      badge: "🔍",
      title: "Operational filtering",
      description:
        "Filter analytics by product, service, country, invitation channel, location, or review status.",
    },
    {
      badge: "📥",
      title: "Dashboard exports",
      description:
        "Export analytics for reporting, leadership reviews, operational planning, and BI workflows.",
    },
  ],
} as const;

export const VERIFIED_TRUST = {
  kicker: "Why verified analytics matter",
  title: { lead: "Why Verified Analytics", accent: "Matter" },
  description:
    "Verified reviews are what turn customer feedback into structured trust signals you can actually measure. Trended metrics with event overlays are what make trust score movement explainable, not just observable. And centralised, export-ready data is what turns those signals into citable, LLM-friendly customer-intelligence that holds up across teams, tools, and time.",
  bullets: [
    "Verified review sources, not anonymous or unattributed feedback.",
    "Structured reputation signals across rating, sentiment, and context.",
    "Trend monitoring with rolling windows and event overlays.",
    "Customer sentiment visibility across products, branches, and time.",
    "Trust score intelligence with movement explanations and alerts.",
    "Centralised reputation reporting across the entire organisation.",
  ],
} as const;

export const TRUST_STATS = {
  title: { lead: "Built for Scale", accent: "Analytics across high-volume reviews" },
  description:
    "From single storefronts to multi-location brands, Tellacity Analytics is designed to surface trustworthy customer intelligence across high-volume verified review environments. Every metric updates from the same live, centralised review infrastructure that powers your public reputation presence.",
  stats: [
    { value: "Real-time", label: "Live dashboard refresh" },
    { value: "Verified", label: "Reviews only" },
    { value: "CSV", label: "One-click exports" },
    { value: "600K+", label: "Active business profiles" },
    { value: "200+", label: "Industry categories" },
  ],
} as const;

export const SOURCE_OF_TRUTH = {
  kicker: "One source of truth",
  title: { lead: "One Source of Truth:", accent: "Every Team Reads the Same Data" },
  description:
    "Every Tellacity analytics view is powered by the same verified review infrastructure that customers see publicly, so marketing, support, operations, and leadership all work from one consistent, centralised reputation dataset.",
  bannerLine1: "One dataset. Every team.",
  bannerLine2: "No spreadsheet drift.",
  capabilities: [
    {
      title: "Unified reputation data",
      description:
        "One verified review pipeline feeds every chart, KPI, and export, with no parallel spreadsheets and no drift.",
    },
    {
      title: "Dashboard consistency",
      description:
        "The same definitions of trust score, response rate, and sentiment apply across every view and report.",
    },
    {
      title: "Review synchronisation",
      description:
        "Moderation, replies, and review status changes flow into analytics instantly with no manual reconciliation.",
    },
    {
      title: "Analytics standardisation",
      description:
        "Standardised metric definitions mean leadership, marketing, and ops all measure the same thing.",
    },
    {
      title: "Centralised reporting",
      description:
        "One reporting surface for board decks, leadership updates, BI exports, and operational reviews.",
    },
    {
      title: "Cross-team visibility",
      description:
        "Role-based access keeps the right people in the right view without splintering the data.",
    },
    {
      title: "Operational alignment",
      description:
        "Every team works from the same numbers, so trade-offs and priorities are easier to align on.",
    },
  ],
} as const;

export const DECISIONS = {
  kicker: "Designed for decision making",
  title: { lead: "Designed for", accent: "Decision Making" },
  description:
    "Tellacity Analytics helps teams move beyond star ratings and understand the operational story behind customer trust, so decisions are grounded in verified, trended evidence rather than assumptions.",
  bannerLine1: "Decisions grounded in verified evidence.",
  bannerLine2: "Not assumptions.",
  items: [
    {
      icon: "🩺",
      title: "Identify customer pain points",
      description:
        "Sentiment, keyword, and category breakdowns surface the issues that hurt trust before they spread.",
      border: "teal" as const,
    },
    {
      icon: "❤️‍🩹",
      title: "Monitor reputation health",
      description:
        "Track trust score health, response rate, and review volume the way you track uptime and revenue.",
      border: "teal" as const,
    },
    {
      icon: "🚀",
      title: "Improve support performance",
      description:
        "Measure response speed, queue depth, and resolution quality across your customer support workflows.",
      border: "forest" as const,
    },
    {
      icon: "🏢",
      title: "Evaluate operational consistency",
      description:
        "Compare branches, locations, and service regions to find variability and tighten standards.",
      border: "teal" as const,
    },
    {
      icon: "🧪",
      title: "Track product & service quality",
      description:
        "Product-level analytics reveal which SKUs and services are driving, or dragging, your reputation.",
      border: "forest" as const,
    },
    {
      icon: "📨",
      title: "Monitor review response workflows",
      description:
        "Track how reviews move through reply, dispute, and moderation queues to remove bottlenecks.",
      border: "teal" as const,
    },
    {
      icon: "📡",
      title: "Understand customer trust trends",
      description:
        "Long-horizon trend analysis turns reviews into a leading indicator of customer behaviour.",
      border: "forest" as const,
    },
  ],
} as const;

export type DecisionIconKey =
  | "stethoscope"
  | "heartPulse"
  | "rocket"
  | "building"
  | "flask"
  | "inbox"
  | "radio";

export const DECISION_ICON_CONFIG: DecisionIconKey[] = [
  "stethoscope",
  "heartPulse",
  "rocket",
  "building",
  "flask",
  "inbox",
  "radio",
];

export const TEAMS = {
  kicker: "Designed for modern teams",
  title: { lead: "Designed for", accent: "Modern Teams" },
  description:
    "Tellacity Analytics is not just a tool for the marketing team. Marketing, support, operations, leadership, and product all use the same centralised data, each with the right slice and the right level of access.",
  audiences: [
    {
      icon: "📣",
      audience: "Marketing teams",
      value:
        "Track trust growth and the reputation impact of every campaign and channel.",
    },
    {
      icon: "🛠",
      audience: "Support teams",
      value:
        "Monitor response speed, queue depth, and customer friction trends in real time.",
    },
    {
      icon: "🏢",
      audience: "Operations teams",
      value:
        "Compare location-level performance and service consistency across the business.",
    },
    {
      icon: "🎯",
      audience: "Leadership teams",
      value:
        "Track brand trust health across the organisation and report it confidently upstream.",
    },
    {
      icon: "🧪",
      audience: "Product teams",
      value:
        "Identify recurring customer complaints and satisfaction patterns at SKU level.",
    },
  ],
} as const;

export const OUTCOMES = {
  kicker: "More than reporting",
  title: { lead: "More Than Reporting:", accent: "Customer Feedback as Operational Visibility" },
  description:
    "Tellacity Analytics turns customer feedback into operational visibility businesses can actually act on, not a slide for the monthly review. Verified, trended, multi-location analytics keep response performance and trust health visible to the teams who can do something about them.",
  bannerQuote: "Verified. Trended. Actionable.",
  items: [
    {
      icon: "🛡",
      title: "Improve customer trust",
      description:
        "Faster, more informed responses to feedback compound into a stronger public reputation.",
    },
    {
      icon: "🪟",
      title: "Reduce operational blind spots",
      description:
        "Multi-location, multi-product, multi-channel visibility removes the gaps where issues hide.",
    },
    {
      icon: "📡",
      title: "Monitor reputation consistently",
      description:
        "Every team sees the same trust health every day, not just at quarterly reviews.",
    },
    {
      icon: "⚠️",
      title: "Identify CX problems faster",
      description:
        "Alerts and trend monitoring catch issues days or weeks before they show up in revenue.",
    },
    {
      icon: "📨",
      title: "Strengthen review workflows",
      description:
        "Response analytics highlight where moderation, replies, and escalations need to improve.",
    },
    {
      icon: "🏗",
      title: "Centralise customer intelligence",
      description:
        "One reputation dataset across every team replaces a patchwork of dashboards and spreadsheets.",
    },
    {
      icon: "🧭",
      title: "Improve service quality decisions",
      description:
        "Decisions about staffing, training, products, and processes are backed by verified customer signal.",
    },
  ],
} as const;

export type OutcomeIconKey =
  | "shield"
  | "eye"
  | "radio"
  | "alertCircle"
  | "inbox"
  | "database"
  | "compass";

export const OUTCOME_ICON_KEYS: OutcomeIconKey[] = [
  "shield",
  "eye",
  "radio",
  "alertCircle",
  "inbox",
  "database",
  "compass",
];

export const FAQ = {
  title: { lead: "Common questions", accent: "about business analytics" },
  description:
    "Short answers to the most common questions about Tellacity's verified, centralised business analytics and how teams use them across the organisation.",
  items: [
    {
      question: "Which metrics does Tellacity Analytics track?",
      answer:
        "Trust score trends, rating distribution, response rate, time-to-reply, channel attribution, country breakdown, sentiment signals, and product-level performance, all from a single dashboard.",
    },
    {
      question: "How fresh is the data?",
      answer:
        "Dashboards refresh every few minutes and real-time counters update on every new review or reply, so the numbers you see match what's actually live on your profile.",
    },
    {
      question: "Can I export the analytics data?",
      answer:
        "Yes. CSV exports are available for reviews, replies, and aggregates. Webhooks and a REST API are available on paid plans for piping data into BI tools and warehouses.",
    },
    {
      question: "Can I see analytics by product, service, or branch?",
      answer:
        "Yes, when reviews include product or location attribution. Filter by SKU, service, branch, or country directly in the dashboard to find what's driving the score up or down.",
    },
    {
      question: "Is analytics included in the free plan?",
      answer:
        "Core dashboards and live metrics are included on every plan. Advanced filters, longer history, custom segments, and exports unlock on paid tiers.",
    },
    {
      question: "Can my whole team access analytics?",
      answer:
        "Yes. Invite teammates as Admin, Manager, or Viewer with role-based access. Every dashboard view and export is attributable in the audit log.",
    },
    {
      question: "Can analytics be filtered by product or location?",
      answer:
        "Yes. Filters work across product, service, country, branch, invitation channel, language, and review status, and combinations can be saved as views.",
    },
    {
      question: "Are analytics based only on verified reviews?",
      answer:
        "Yes. Every metric is built from verified reviews tied to authenticated customer accounts, so the data you act on is the same data customers see publicly.",
    },
    {
      question: "How often does the dashboard refresh?",
      answer:
        "Live counters update on every new review or reply. Aggregated metrics refresh every few minutes, with no manual reload required.",
    },
    {
      question: "Can teams share analytics access?",
      answer:
        "Yes. Invite teammates with role-based permissions (Admin, Manager, or Viewer). All access is logged in the audit trail for governance.",
    },
    {
      question: "Can I export analytics reports?",
      answer:
        "Yes. One-click CSV exports are available for reviews, replies, and aggregates. Paid plans add webhooks, a REST API, and BI connector support.",
    },
    {
      question: "Does Tellacity support multi-location analytics?",
      answer:
        "Yes. Compare branches, stores, and service regions side by side from one dashboard, with consistent definitions for trust score, response rate, and sentiment.",
    },
    {
      question: "Can I compare performance over time?",
      answer:
        "Yes. Rolling 7-, 30-, and 90-day windows, custom date ranges, and historical trend analysis make comparisons across time straightforward.",
    },
    {
      question: "Can I monitor response performance?",
      answer:
        "Yes. Track response rate, median response time, and team-level activity so you can spot slow queues before they become reputation risks.",
    },
    {
      question: "Are analytics available in real time?",
      answer:
        "Yes. Counters update live and aggregates refresh continuously, so leadership and operations are always looking at the latest numbers.",
    },
    {
      question: "Can analytics help identify reputation risks?",
      answer:
        "Yes. Reputation alerts flag sudden drops in trust score, spikes in negative feedback, and unusual review patterns so teams can intervene early.",
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
        "Feed the analytics with structured, verified reviews from every customer.",
      icon: "mail" as const,
    },
    {
      title: "Review Widgets",
      href: "/solutions/review-widgets",
      description: "Show the same trust signals on your website, updated in real time.",
      icon: "star" as const,
    },
    {
      title: "Reputation Management",
      href: "/solutions/reputation-management",
      description: "Act on what analytics surface with replies, moderation, and disputes.",
      icon: "shield" as const,
    },
    {
      title: "Photo Uploads",
      href: "/solutions/photo-uploads",
      description:
        "Capture verified photos and structured feedback so analytics has more than just a star rating to work with.",
      icon: "camera" as const,
    },
  ],
} as const;

export const FINAL_CTA = {
  title: "Start with Tellacity today.",
  description:
    "Claim your business profile, invite your first customers, and run your entire reputation programme from one dashboard.",
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Claim Your Business", href: "/suggest-business" },
  dashboardCta: { label: "Open dashboard", href: "/business/dashboard" },
  footnote: "Free to start · No credit card · Live from day one",
} as const;

/** 3+2+2 row groupings for 7-item sections */
export const MOSAIC_322 = [
  [0, 1, 2],
  [3, 4],
  [5, 6],
] as const;
