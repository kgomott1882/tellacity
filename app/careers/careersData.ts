import type { JobSpec } from "./jobs";

export const PAGE_URL = "https://tellacity.com/careers";

export function brandImage(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

export const CAREERS_HERO_UNSPLASH =
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=2400&q=80";

export const CAREERS_UNSPLASH = {
  jobsBg:
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1600&q=80",
  globalTop:
    "https://images.unsplash.com/photo-1521791055366-0d553872952f?auto=format&fit=crop&w=1200&q=80",
} as const;

export const CAREERS_IMAGES = {
  valuesBanner: brandImage("happy Champs.jpeg"),
  boardroom: brandImage("Boardroom people.png"),
  howWeWorkOverlap: brandImage("Launch_campaigns_in_minutes.jpeg"),
  jobsBanner: brandImage("Team_pictures_work_attire_202606011500.jpeg"),
  whyJoinBanner: brandImage("Sunset Beach.jpeg"),
  officeDiscussion: brandImage("Office discussion.png"),
  contactMain: brandImage("cherry.png"),
} as const;

export const VALUES = [
  {
    title: "Integrity First",
    description:
      "We act with honesty and hold ourselves to high standards in every decision.",
    icon: "shield" as const,
    variant: "teal" as const,
  },
  {
    title: "Radical Transparency",
    description:
      "We communicate openly, share context, and build trust through clarity.",
    icon: "eye" as const,
    variant: "forest" as const,
  },
  {
    title: "Customer Empathy",
    description:
      "We listen closely to consumers and businesses to solve real problems.",
    icon: "heart" as const,
    variant: "teal" as const,
  },
  {
    title: "Own the Outcome",
    description:
      "We take responsibility, follow through, and deliver quality work.",
    icon: "target" as const,
    variant: "forest" as const,
  },
  {
    title: "Grow Together",
    description:
      "We invest in each other's growth, learning, and long-term success.",
    icon: "trendingUp" as const,
    variant: "teal" as const,
  },
];

export const HOW_WE_WORK = [
  {
    title: "Focused work",
    detail:
      "We protect time for deep work and thoughtful execution, clear priorities beat constant context-switching.",
    icon: "crosshair" as const,
    variant: "teal" as const,
  },
  {
    title: "Remote-first",
    detail:
      "Teams collaborate across regions with async-friendly communication; remote-first means location is not a barrier to ownership.",
    icon: "globe" as const,
    variant: "forest" as const,
  },
  {
    title: "Collaborative",
    detail:
      "Small, empowered teams share context openly and pair with product, design, and trust specialists when decisions cross functions.",
    icon: "users" as const,
    variant: "teal" as const,
  },
];

export const ROLE_SUMMARIES: Record<string, { work: string; fit: string }> = {
  "senior-software-engineer-fullstack": {
    work: "Build core product features and trust infrastructure.",
    fit: "Suited to experienced fullstack engineers who want ownership from spec to production.",
  },
  "product-designer": {
    work: "Design clear, usable experiences for consumers and businesses.",
    fit: "Ideal for product designers who care about trust, clarity, and end-to-end UX craft.",
  },
  "brand-trust-analyst": {
    work: "Help analyze trust signals, brand perception, and platform quality.",
    fit: "A strong fit for analytical thinkers interested in fraud patterns and reputation data.",
  },
  "community-moderation-specialist": {
    work: "Support safe, fair moderation and community standards.",
    fit: "Well suited to calm, detail-oriented people with moderation or community support experience.",
  },
  "business-development-manager": {
    work: "Grow partnerships and business adoption.",
    fit: "Best for B2B relationship builders motivated by trust-focused SaaS and long-term partnerships.",
  },
};

export const WHY_JOIN = [
  {
    title: "Collaborate with a purpose-driven team",
    detail:
      "You will work with people who care about fairness and impact, not vanity metrics or opaque growth tactics.",
    icon: "users" as const,
    accent: "teal" as const,
  },
  {
    title: "Build products that improve transparency",
    detail:
      "Your work connects directly to verified reviews, trust signals, and tools on the ",
    link: { href: "/for-business", label: "Reputation Platform" },
    suffix: ".",
    icon: "eye" as const,
    accent: "forest" as const,
  },
  {
    title: "Move fast with clarity and ownership",
    detail:
      "Teams are trusted to deliver with autonomy; expectations are clear and follow-through matters more than hierarchy.",
    icon: "zap" as const,
    accent: "teal" as const,
  },
  {
    title: "Work across markets and industries",
    detail:
      "Tellacity serves consumers and businesses globally, so you gain exposure to varied use cases and regional needs.",
    icon: "globe" as const,
    accent: "forest" as const,
  },
  {
    title: "Learn in a culture that values integrity",
    detail:
      "We invest in learning and honest feedback, aligned with the same integrity standards we apply to the product.",
    icon: "shield" as const,
    accent: "teal" as const,
  },
  {
    title: "One global team",
    detail:
      "Distributed collaboration helps us build a trust platform that is usable beyond a single geography or industry.",
    icon: "network" as const,
    accent: "forest" as const,
  },
];

export const GLOBAL_TEAM = [
  {
    title: "Shared mission",
    detail:
      "Every region works toward the same goal: making trust more transparent and accessible for everyone.",
  },
  {
    title: "Regional collaboration",
    detail:
      "Distributed teams share context across time zones so product decisions reflect diverse markets and users.",
  },
  {
    title: "Building trust globally",
    detail:
      "Remote collaboration helps us build a trust platform that is usable beyond a single geography or industry.",
  },
];

export const careersJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  name: "Careers | Tellacity",
  description:
    "Join Tellacity and help build transparent, trustworthy products. Explore open roles in engineering, design, trust, moderation, and business development.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tellacity.com/" },
      { "@type": "ListItem", position: 2, name: "Careers", item: PAGE_URL },
    ],
  },
};

export function isValidSlug(slug: string) {
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

export function buildJobPostingJsonLd(jobs: JobSpec[]) {
  return jobs.map((job) => ({
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description:
      ROLE_SUMMARIES[job.slug]?.work ?? `${job.title} at Tellacity. ${job.location}.`,
    hiringOrganization: {
      "@type": "Organization",
      name: "Tellacity",
      sameAs: "https://tellacity.com",
    },
    jobLocation: {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressCountry: "Worldwide" },
    },
    jobLocationType: "TELECOMMUTE",
    url: `${PAGE_URL}/${job.slug}`,
  }));
}

export function deptPillClass(department?: string) {
  if (department === "Product" || department === "Growth") {
    return "careers-pill careers-pill--forest";
  }
  return "careers-pill careers-pill--teal";
}

export function chunkJobRows<T>(items: T[]): T[][] {
  const pattern = [3, 2];
  const rows: T[][] = [];
  let i = 0;
  for (const size of pattern) {
    if (i >= items.length) break;
    rows.push(items.slice(i, i + size));
    i += size;
  }
  while (i < items.length) {
    rows.push(items.slice(i, i + 2));
    i += 2;
  }
  return rows;
}
