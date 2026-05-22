import SolutionPageLayout, {
  type SolutionPageContent,
} from "@/components/solutions/SolutionPageLayout";

export const metadata = {
  title:
    "Business Analytics | Customer Reputation Intelligence | Tellacity",
  description:
    "Tellacity Business Analytics is a centralised customer reputation intelligence dashboard. Track trust score trends, sentiment, response performance, location-level reputation, review attribution, and verified-review quality signals in one operational system.",
  alternates: {
    canonical: "https://tellacity.com/solutions/business-analytics",
  },
  openGraph: {
    title: "Business Analytics | Tellacity",
    description:
      "Centralised customer reputation intelligence — trust score trends, sentiment, response performance, and multi-location visibility.",
    url: "https://tellacity.com/solutions/business-analytics",
    siteName: "Tellacity",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Business Analytics | Tellacity",
    description:
      "Customer reputation intelligence and trust analytics infrastructure for modern teams.",
  },
};

const content: SolutionPageContent = {
  kicker: "Business Analytics",
  headline: {
    lead: "See exactly what's",
    accent: "driving your trust score.",
  },
  valueProp:
    "Tellacity Business Analytics transforms verified customer reviews, response activity, sentiment patterns, and operational feedback into a centralised reputation intelligence dashboard. Track trust score movement, customer satisfaction trends, response performance, review attribution, location-level reputation, and review quality signals from one unified system.",
  primaryCta: { label: "Start free", href: "/business/signup" },
  secondaryCta: { label: "Open dashboard", href: "/business/dashboard" },
  heroImage: {
    src: "/brand/Man%20at%20Office.png",
    alt: "Business owner reviewing Tellacity analytics at the office",
  },

  heroTrustStrip: [
    "Verified review analytics",
    "Live dashboard refresh",
    "Reputation trend tracking",
    "Multi-location visibility",
    "Export-ready reporting",
  ],

  problems: [
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
        "Without proper analytics, businesses struggle to identify which products, locations, campaigns, or support channels are improving — or hurting — customer trust.",
    },
  ],

  solution: {
    title: "Every review metric, ready in one dashboard.",
    description:
      "The analytics view in the Tellacity dashboard plots your trust score over time, breaks reviews down by rating, channel, and product, and surfaces response performance — so you can see the story behind every change.",
    bullets: [
      "Trust score trend with rolling 7-, 30-, and 90-day views.",
      "Review volume by rating, category, and country.",
      "Response rate and median response time per channel.",
      "Top-performing products, locations, and listings.",
      "Exportable CSV reports for leadership and BI tools.",
    ],
    screenshot: {
      src: "/brand/analysis%20trust.jpg",
      alt: "Tellacity trust analysis dashboard",
    },
  },

  workflow: {
    kicker: "How the analytics system works",
    title: "From verified review to operational insight — automatically.",
    description:
      "Every metric in the analytics dashboard is generated from the same verified review infrastructure that powers your public Tellacity profile, so leadership, marketing, support, and operations all read from one consistent source.",
    steps: [
      {
        icon: "📥",
        title: "Reviews collected",
        description:
          "Verified reviews flow in from invitations, profile submissions, and authenticated review forms — tied to a customer record.",
      },
      {
        icon: "✅",
        title: "Reviews verified & categorised",
        description:
          "Identity checks, proof-of-purchase signals, and moderation classify each review by product, location, language, and rating.",
      },
      {
        icon: "🧮",
        title: "Metrics aggregated",
        description:
          "Trust score, sentiment, response performance, and channel attribution are computed from the live review pipeline.",
      },
      {
        icon: "📈",
        title: "Trends analysed",
        description:
          "Rolling 7-, 30-, and 90-day trends, plus event overlays, surface patterns that one review can't show on its own.",
      },
      {
        icon: "🖥",
        title: "Dashboard updates live",
        description:
          "The analytics view refreshes continuously so leadership, marketing, support, and ops see the same numbers in real time.",
      },
      {
        icon: "🎯",
        title: "Teams act on insights",
        description:
          "Alerts, filters, and exports help teams move from data to action without leaving the Tellacity platform.",
      },
    ],
  },

  features: [
    {
      badge: "📊",
      title: "Trust score trends",
      description:
        "Plot your live trust score over time and overlay key events like campaigns or product launches.",
    },
    {
      badge: "🧮",
      title: "Review breakdowns",
      description:
        "Slice by 1–5 star rating, time window, country, category, and product.",
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
        "Understand which invitation channels — email, QR, link — bring the highest-quality reviews.",
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

  verifiedTrust: {
    kicker: "Why verified analytics matter",
    title: "Reliable signal you can build decisions on.",
    description:
      "Analytics are only useful when the underlying feedback is trustworthy. Tellacity analytics are built on verified customer reviews, structured invitation workflows, moderation systems, and review attribution signals — helping businesses make decisions using cleaner, more reliable reputation data.",
    bullets: [
      "Verified review sources, not anonymous or unattributed feedback.",
      "Structured reputation signals across rating, sentiment, and context.",
      "Trend monitoring with rolling windows and event overlays.",
      "Customer sentiment visibility across products, branches, and time.",
      "Trust score intelligence with movement explanations and alerts.",
      "Centralised reputation reporting across the entire organisation.",
    ],
    surface: "analytics",
  },

  trust: {
    title: "Customer intelligence infrastructure, built for scale.",
    description:
      "From local businesses to multi-location brands, Tellacity Analytics is designed to surface trustworthy customer intelligence across high-volume review environments. Every metric updates from the same live review infrastructure that powers your public reputation presence.",
    stats: [
      { value: "Real-time", label: "Live dashboard refresh" },
      { value: "Verified", label: "Reviews only" },
      { value: "CSV", label: "One-click exports" },
      { value: "600K+", label: "Active business profiles" },
      { value: "200+", label: "Industry categories" },
    ],
  },

  controlPlane: {
    kicker: "One source of truth",
    title: "Every team reads the same reputation data.",
    description:
      "Every Tellacity analytics view is powered by the same verified review infrastructure that customers see publicly — helping teams work from one consistent reputation dataset across marketing, support, operations, and leadership.",
    tagline: "One dataset. Every team.",
    capabilities: [
      {
        icon: "🧾",
        title: "Unified reputation data",
        description:
          "One verified review pipeline feeds every chart, KPI, and export — no parallel spreadsheets, no drift.",
      },
      {
        icon: "📐",
        title: "Dashboard consistency",
        description:
          "The same definitions of trust score, response rate, and sentiment apply across every view and report.",
      },
      {
        icon: "🔄",
        title: "Review synchronisation",
        description:
          "Moderation, replies, and review status changes flow into analytics instantly with no manual reconciliation.",
      },
      {
        icon: "📏",
        title: "Analytics standardisation",
        description:
          "Standardised metric definitions mean leadership, marketing, and ops all measure the same thing.",
      },
      {
        icon: "📊",
        title: "Centralised reporting",
        description:
          "One reporting surface for board decks, leadership updates, BI exports, and operational reviews.",
      },
      {
        icon: "👥",
        title: "Cross-team visibility",
        description:
          "Role-based access keeps the right people in the right view without splintering the data.",
      },
      {
        icon: "🎯",
        title: "Operational alignment",
        description:
          "Every team works from the same numbers, so trade-offs and priorities are easier to align on.",
      },
    ],
  },

  decisions: {
    kicker: "Designed for decision making",
    title: "Move beyond stars. Understand the story behind them.",
    description:
      "Tellacity Analytics helps teams move beyond star ratings and understand the operational story behind customer trust — so decisions are grounded in evidence, not assumptions.",
    items: [
      {
        icon: "🩺",
        title: "Identify customer pain points",
        description:
          "Sentiment, keyword, and category breakdowns surface the issues that hurt trust before they spread.",
      },
      {
        icon: "❤️‍🩹",
        title: "Monitor reputation health",
        description:
          "Track trust score health, response rate, and review volume the way you track uptime and revenue.",
      },
      {
        icon: "🚀",
        title: "Improve support performance",
        description:
          "Measure response speed, queue depth, and resolution quality across your customer support workflows.",
      },
      {
        icon: "🏢",
        title: "Evaluate operational consistency",
        description:
          "Compare branches, locations, and service regions to find variability and tighten standards.",
      },
      {
        icon: "🧪",
        title: "Track product & service quality",
        description:
          "Product-level analytics reveal which SKUs and services are driving — or dragging — your reputation.",
      },
      {
        icon: "📨",
        title: "Monitor review response workflows",
        description:
          "Track how reviews move through reply, dispute, and moderation queues to remove bottlenecks.",
      },
      {
        icon: "📡",
        title: "Understand customer trust trends",
        description:
          "Long-horizon trend analysis turns reviews into a leading indicator of customer behaviour.",
      },
    ],
  },

  teams: {
    kicker: "Designed for modern teams",
    title: "One analytics platform, every team it serves.",
    description:
      "Tellacity Analytics is not just a tool for the marketing team. Marketing, support, operations, leadership, and product all use the same data — each with the right slice and the right level of access.",
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
  },

  outcomes: {
    kicker: "More than reporting",
    title: "Customer feedback as operational visibility.",
    description:
      "Tellacity Analytics turns customer feedback into operational visibility businesses can actually act on — not a slide for the monthly review.",
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
          "Every team sees the same trust health every day — not just at quarterly reviews.",
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
  },

  related: [
    {
      title: "Review Invitations",
      href: "/solutions/review-invitations",
      description:
        "Feed the analytics with structured, verified reviews from every customer.",
    },
    {
      title: "Review Widgets",
      href: "/solutions/review-widgets",
      description:
        "Show the same trust signals on your website, updated in real time.",
    },
    {
      title: "Reputation Management",
      href: "/solutions/reputation-management",
      description:
        "Act on what analytics surface with replies, moderation, and disputes.",
    },
    {
      title: "Photo Uploads",
      href: "/solutions/photo-uploads",
      description:
        "Capture verified photos and structured feedback so analytics has more than just a star rating to work with.",
    },
  ],

  faqs: [
    {
      question: "Which metrics does Tellacity Analytics track?",
      answer:
        "Trust score trends, rating distribution, response rate, time-to-reply, channel attribution, country breakdown, sentiment signals, and product-level performance — all from a single dashboard.",
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
        "Yes. Filters work across product, service, country, branch, invitation channel, language, and review status — and combinations can be saved as views.",
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
        "Yes. Invite teammates with role-based permissions — Admin, Manager, or Viewer. All access is logged in the audit trail for governance.",
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
};

const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Tellacity Business Analytics",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description:
    "Centralised customer reputation intelligence dashboard. Trust score trends, sentiment, response performance, multi-location reputation, review attribution, and verified-review quality signals in one operational system.",
  brand: { "@type": "Organization", name: "Tellacity" },
  url: "https://tellacity.com/solutions/business-analytics",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    availability: "https://schema.org/InStock",
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
      name: "Business Analytics",
      item: "https://tellacity.com/solutions/business-analytics",
    },
  ],
};

const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How Tellacity Business Analytics turns reviews into operational insights",
  description:
    "Tellacity Business Analytics processes every verified review through a six-stage intelligence pipeline so teams get reliable customer reputation data they can act on.",
  totalTime: "PT5M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Reviews collected",
      text: "Verified reviews flow in from invitations, profile submissions, and authenticated review forms — each tied to a customer record.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Reviews verified and categorised",
      text: "Identity checks, proof-of-purchase signals, and moderation classify every review by product, location, language, and rating.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Metrics aggregated",
      text: "Trust score, sentiment, response performance, and channel attribution are computed from the verified review pipeline.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Trends analysed",
      text: "Rolling 7-, 30-, and 90-day windows and event overlays surface trust and sentiment patterns across the business.",
    },
    {
      "@type": "HowToStep",
      position: 5,
      name: "Dashboard updates live",
      text: "The analytics dashboard refreshes continuously so leadership, marketing, support, and operations all read the same numbers in real time.",
    },
    {
      "@type": "HowToStep",
      position: 6,
      name: "Teams act on insights",
      text: "Reputation alerts, operational filters, exports, and role-based access help teams turn analytics into operational improvements.",
    },
  ],
};

export default function BusinessAnalyticsSolutionPage() {
  return (
    <SolutionPageLayout
      content={content}
      jsonLd={
        <>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
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
