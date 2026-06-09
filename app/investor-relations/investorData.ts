export const PAGE_URL = "https://tellacity.com/investor-relations";

export function brandImage(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

export const IR_HERO_UNSPLASH =
  "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=2400&q=80";

export const IR_UNSPLASH = {
  statsBg:
    "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=2400&q=80",
  contact:
    "https://images.unsplash.com/photo-1521791055366-0d553872952f?auto=format&fit=crop&w=1200&q=80",
} as const;

export const IR_IMAGES = {
  investment: brandImage("Markets.png"),
  trustGap: brandImage("safe gurad.jpg"),
  whyInvest: brandImage("Why Tellacity.jpeg"),
  integrity: brandImage("Build Growth.jpeg"),
  milestones: brandImage("AI and partnership.png"),
  reports: brandImage("Sunset Beach Pips.jpeg"),
} as const;

export const HIGHLIGHTS = [
  {
    title: "Proprietary Verification",
    description: "Proof-first review verification at scale",
  },
  {
    title: "Scalable SaaS Model",
    description: "Recurring revenue from verified accounts",
  },
  {
    title: "Transparent Trust Metrics",
    description: "Auditable trust score system",
  },
  {
    title: "Global Market Opportunity",
    description: "Trust economy spans every industry",
  },
];

export const KEY_THEMES = [
  {
    title: "Verification-first SaaS model",
    detail:
      "Software built around verified feedback rather than unverified ratings alone.",
    icon: "layers" as const,
    variant: "teal" as const,
  },
  {
    title: "Transparent trust metrics",
    detail:
      "Auditable trust signals that support adoption by consumers and businesses.",
    icon: "barChart" as const,
    variant: "forest" as const,
  },
  {
    title: "Multi-market expansion",
    detail:
      "Geographic growth as verified reputation becomes a global purchase factor.",
    icon: "globe" as const,
    variant: "teal" as const,
  },
  {
    title: "Recurring revenue from business accounts",
    detail:
      "Subscription plans tied to review volume, analytics, and reputation tools.",
    icon: "refresh" as const,
    variant: "forest" as const,
  },
  {
    title: "Platform integrity and moderation moat",
    detail:
      "Verification, fraud detection, and fair moderation as durable differentiation.",
    icon: "shield" as const,
    variant: "teal" as const,
  },
];

export const TRUST_GAP_CARDS = [
  {
    title: "Wasted Spend",
    detail:
      "Economic loss from decisions made on manipulated or unverified feedback, including wasted spend and reduced conversion for honest businesses.",
    icon: "trendingDown" as const,
    accent: "red" as const,
  },
  {
    title: "Fraud & Deception",
    detail:
      "Fake reviews, AI-generated content, and paid endorsements undermine confidence and inflate the global trust gap.",
    icon: "alert" as const,
    accent: "amber" as const,
  },
  {
    title: "Tellacity's Solution",
    detail:
      "Verification-first infrastructure: proof-linked reviews, transparent moderation, and tools businesses use to showcase credible feedback at scale.",
    icon: "trendingUp" as const,
    accent: "teal" as const,
  },
];

export const INVESTMENT_REASONS = [
  {
    title: "Defensible Technology",
    body:
      "Verification-first review infrastructure with expanding trust signals. Proof-first verification and trust infrastructure are harder to replicate than generic review widgets, creating a product moat as signals and moderation mature.",
    icon: "lock" as const,
    accent: "teal" as const,
  },
  {
    title: "Efficient Growth",
    body:
      "Strong retention and organic acquisition powered by reputation flywheels. As businesses collect verified reviews and display social proof, reputation flywheels can improve retention and lower customer acquisition cost over time.",
    icon: "trendingUp" as const,
    accent: "forest" as const,
  },
  {
    title: "Resilient Fundamentals",
    body:
      "Trust remains essential across economic cycles and purchase categories. Consumers continue to rely on credible feedback when choosing providers; trust infrastructure remains relevant through market cycles.",
    icon: "shield" as const,
    accent: "teal" as const,
  },
  {
    title: "Network Effects",
    body:
      "More verified reviews improve transparency and attract more businesses. Each additional verified review strengthens platform utility for consumers researching businesses and for businesses benchmarking reputation.",
    icon: "network" as const,
    accent: "forest" as const,
  },
  {
    title: "Global Footprint",
    body:
      "Multi-market expansion brings verified reviews to new regions and sectors. Regional expansion opens new categories and geographies where reputation-driven purchase decisions are underserved by verified infrastructure.",
    icon: "globe" as const,
    accent: "teal" as const,
  },
  {
    title: "Brand Trust",
    body:
      "A credible, neutral platform that balances consumer and business needs. Neutrality, transparency, and fair treatment support Tellacity's credibility with consumers, businesses, and partners evaluating long-term alignment.",
    icon: "badgeCheck" as const,
    accent: "forest" as const,
  },
];

export const INTEGRITY_MILESTONES = [
  {
    title: "Proof-first verification engine launched",
    detail:
      "Core infrastructure for verified reviews at scale.",
    icon: "check" as const,
    variant: "teal" as const,
  },
  {
    title: "AI fraud detection system deployed",
    detail: "Automated flagging of suspicious patterns.",
    icon: "bot" as const,
    variant: "forest" as const,
  },
  {
    title: "Regional expansion into new markets",
    detail: "Seven markets, verified reputation globally.",
    icon: "globe" as const,
    variant: "teal" as const,
  },
  {
    title: "Enterprise partnerships with payment platforms",
    detail: "Trust signals connected to commerce at scale.",
    icon: "handshake" as const,
    variant: "forest" as const,
  },
];

export const PROGRESS_MILESTONES = [
  {
    number: "1",
    label: "Proof-first verification engine launched",
    detail:
      "Established the technical foundation for verified reviews at scale.",
    icon: "cpu" as const,
    pill: "Launched ✓",
    pillVariant: "teal" as const,
  },
  {
    number: "2",
    label: "AI fraud detection system deployed",
    detail:
      "Added automated protection against manipulation and suspicious review behaviour.",
    icon: "bot" as const,
    pill: "Deployed ✓",
    pillVariant: "forest" as const,
  },
  {
    number: "3",
    label: "Regional expansion into seven new markets",
    detail:
      "Demonstrated multi-market execution and demand for trust infrastructure globally.",
    icon: "globe" as const,
    pill: "7 Markets ✓",
    pillVariant: "teal" as const,
  },
  {
    number: "4",
    label: "Enterprise partnerships with payment platforms",
    detail:
      "Extended Tellacity's trust layer into enterprise and payments ecosystems.",
    icon: "handshake" as const,
    pill: "Live ✓",
    pillVariant: "forest" as const,
  },
];

export const STATS_BAND = [
  { display: "$4T+", value: 4, prefix: "$", suffix: "T+", label: "Trust gap addressed" },
  { display: "600K+", value: 600, suffix: "K+", label: "Businesses indexed" },
  { display: "7", value: 7, suffix: "", label: "Markets active" },
  { display: "200+", value: 200, suffix: "+", label: "Industry categories" },
] as const;

export const CONTACT_TOPICS = [
  {
    label: "Earnings Materials",
    desc: "Quarterly and annual performance reports",
    icon: "fileText" as const,
    variant: "teal" as const,
  },
  {
    label: "Strategic Updates",
    desc: "Product roadmap and market positioning",
    icon: "trendingUp" as const,
    variant: "forest" as const,
  },
  {
    label: "Partnership Discussions",
    desc: "Enterprise and strategic partnerships",
    icon: "handshake" as const,
    variant: "teal" as const,
  },
  {
    label: "Analyst Conversations",
    desc: "Schedule management or analyst meetings",
    icon: "calendar" as const,
    variant: "forest" as const,
  },
];

export const investorRelationsJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Investor Relations | Tellacity",
  description:
    "Explore Tellacity's investor relations page for earnings updates, annual reports, investor decks, growth strategy, and the trust economy opportunity.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tellacity.com/" },
      { "@type": "ListItem", position: 2, name: "Investor Relations", item: PAGE_URL },
    ],
  },
};
