import type { BlogPost } from "../../data/blogPosts";

export const PAGE_URL = "https://tellacity.com/blog";

function brandImage(filename: string): string {
  return `/brand/${encodeURIComponent(filename)}`;
}

export const BLOG_HERO_UNSPLASH =
  "https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&w=2400&q=80";

export const BLOG_BANNER_IMAGES = {
  reviews: brandImage("Turn feedback into growth..png"),
  trust: brandImage("Create_similar.jpeg"),
  platform: brandImage("Multimedia Hub.jpeg"),
  compare: brandImage("similar_different.jpeg"),
} as const;

export const FILTER_CATEGORIES = [
  "All",
  "Reviews",
  "Trust",
  "Consumer Safety",
  "Platform Updates",
  "Comparisons",
  "Business Growth",
] as const;

export type BlogFilterCategory = (typeof FILTER_CATEGORIES)[number];
export type PostTopic = Exclude<BlogFilterCategory, "All">;

export type PostMeta = { topic: PostTopic; whyRead: string };

export const POST_META: Record<string, PostMeta> = {
  "how-to-get-more-customer-reviews": {
    topic: "Reviews",
    whyRead: "Proven ways to collect more customer feedback.",
  },
  "why-customers-dont-leave-reviews-how-to-fix": {
    topic: "Reviews",
    whyRead: "Fix the blockers that stop customers from reviewing.",
  },
  "turn-reviews-into-growth-2026": {
    topic: "Business Growth",
    whyRead: "Turn feedback into product and revenue insights.",
  },
  "review-response-playbook-2026": {
    topic: "Reviews",
    whyRead: "Respond publicly with a repeatable playbook.",
  },
  "import-reviews": {
    topic: "Platform Updates",
    whyRead: "Bring existing reviews into Tellacity step by step.",
  },
  "claim-tellacity-profile": {
    topic: "Business Growth",
    whyRead: "Why claiming your profile matters for trust.",
  },
  "trust-score-2025": {
    topic: "Trust",
    whyRead: "Understand how Tellacity calculates trust.",
  },
  "check-business-legit-2026": {
    topic: "Consumer Safety",
    whyRead: "Check a business before you spend money.",
  },
  "check-business-legit-2025": {
    topic: "Consumer Safety",
    whyRead: "Spot red flags before you buy online.",
  },
  "what-makes-a-review-useful-2025": {
    topic: "Trust",
    whyRead: "Learn what separates useful reviews from noise.",
  },
  "verified-review-2025": {
    topic: "Trust",
    whyRead: "See what verified reviews mean in practice.",
  },
  "online-shopping-scams-2025": {
    topic: "Consumer Safety",
    whyRead: "Avoid the most common shopping scams.",
  },
  "shopping-online-safely-2025": {
    topic: "Consumer Safety",
    whyRead: "Shop online with a practical safety checklist.",
  },
  "platform-update-2025": {
    topic: "Platform Updates",
    whyRead: "See what changed in Tellacity for 2025.",
  },
  "best-trustpilot-alternatives-2026": {
    topic: "Comparisons",
    whyRead: "Compare Trustpilot alternatives side by side.",
  },
  "google-reviews-vs-trustpilot-2026": {
    topic: "Comparisons",
    whyRead: "Decide between Google Reviews and Trustpilot.",
  },
  "best-review-platforms-small-business-2026": {
    topic: "Comparisons",
    whyRead: "Find review platforms that fit small teams.",
  },
};

export const START_HERE_ITEMS = [
  {
    icon: "star" as const,
    title: "Want more reviews?",
    href: "/blog/how-to-get-more-customer-reviews",
    cta: "Start with the reviews guide →",
  },
  {
    icon: "barChart" as const,
    title: "Comparing platforms?",
    href: "/blog/google-reviews-vs-trustpilot-2026",
    cta: "Google Reviews vs Trustpilot →",
  },
  {
    icon: "shield" as const,
    title: "Building trust?",
    href: "/blog/verified-review-2025",
    cta: "Explore verified review guides →",
  },
  {
    icon: "settings" as const,
    title: "Using Tellacity?",
    href: "/blog/platform-update-2025",
    cta: "Check platform updates →",
  },
];

export const FEATURED_HERO_SLUG = "how-to-get-more-customer-reviews";
export const FEATURED_SMALL_SLUGS = [
  "best-trustpilot-alternatives-2026",
  "google-reviews-vs-trustpilot-2026",
  "check-business-legit-2026",
  "claim-tellacity-profile",
];

/** Reviews section: 3 + 2 + 2 asymmetric rows */
export const REVIEWS_CARD_SLUGS = [
  ["turn-reviews-into-growth-2026", "review-response-playbook-2026", "why-customers-dont-leave-reviews-how-to-fix"],
  ["import-reviews", "claim-tellacity-profile"],
  ["trust-score-2025", "how-to-get-more-customer-reviews"],
] as const;

export const TRUST_CARD_SLUGS = [
  "check-business-legit-2026",
  "check-business-legit-2025",
  "what-makes-a-review-useful-2025",
  "verified-review-2025",
  "online-shopping-scams-2025",
  "shopping-online-safely-2025",
];

export const COMPARE_CARD_SLUGS = [
  "best-trustpilot-alternatives-2026",
  "google-reviews-vs-trustpilot-2026",
  "best-review-platforms-small-business-2026",
];

export const SECTION_SLUGS: Record<string, string[]> = {
  featured: [
    FEATURED_HERO_SLUG,
    ...FEATURED_SMALL_SLUGS,
  ],
  "reviews-reputation": REVIEWS_CARD_SLUGS.flat(),
  "trust-safety": TRUST_CARD_SLUGS,
  "platform-updates": ["platform-update-2025"],
  "compare-platforms": COMPARE_CARD_SLUGS,
};

export const LEARN_MORE_LINKS = [
  { href: "/resources", label: "Resources", icon: "bookOpen" as const, variant: "teal" as const },
  { href: "/guides", label: "Guides", icon: "fileText" as const, variant: "forest" as const },
  {
    href: "/for-business",
    label: "Reputation Platform",
    icon: "barChart2" as const,
    variant: "teal" as const,
  },
  { href: "/for-business", label: "Tellacity for Business", icon: "briefcase" as const, variant: "forest" as const },
  { href: "/pricing", label: "Pricing", icon: "tag" as const, variant: "teal" as const },
  { href: "/help-center", label: "Help Center", icon: "helpCircle" as const, variant: "forest" as const },
  { href: "/safety-trust", label: "Safety & Trust", icon: "shield" as const, variant: "teal" as const },
  {
    href: "/business-guidelines",
    label: "Business Guidelines",
    icon: "scrollText" as const,
    variant: "forest" as const,
  },
  { href: "/about", label: "About Tellacity", icon: "info" as const, variant: "teal" as const },
];

export const blogJsonLd = {
  "@context": "https://schema.org",
  "@type": "Blog",
  name: "Tellacity Blog",
  description:
    "Read Tellacity's blog for practical guides on reviews, trust, consumer safety, platform comparisons, and business growth.",
  url: PAGE_URL,
  breadcrumb: {
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://tellacity.com/" },
      { "@type": "ListItem", position: 2, name: "Blog", item: PAGE_URL },
    ],
  },
};

export function isValidSlug(slug: string) {
  return /^[a-z0-9-]+$/.test(slug.trim().toLowerCase());
}

export function postsForSlugs(posts: BlogPost[], slugs: string[]) {
  const bySlug = new Map(
    posts.filter((p) => isValidSlug(p.slug)).map((p) => [p.slug.trim().toLowerCase(), p])
  );
  return slugs
    .map((s) => bySlug.get(s.trim().toLowerCase()))
    .filter((p): p is BlogPost => Boolean(p));
}

export function postMatchesFilter(slug: string, filter: BlogFilterCategory) {
  if (filter === "All") return true;
  return POST_META[slug.trim().toLowerCase()]?.topic === filter;
}

export function sectionHasMatches(sectionId: string, filter: BlogFilterCategory) {
  const slugs = SECTION_SLUGS[sectionId] ?? [];
  return slugs.some((s) => postMatchesFilter(s, filter));
}

export function formatBlogDate(date: string) {
  return new Date(date)
    .toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
    .toUpperCase();
}

export function topicPillClass(topic: PostTopic) {
  if (topic === "Consumer Safety") return "blog-pill blog-pill--amber";
  if (topic === "Platform Updates" || topic === "Comparisons") return "blog-pill blog-pill--forest";
  return "blog-pill blog-pill--teal";
}

export function cardHoverClass(section: "reviews" | "trust" | "compare" | "featured" | "platform") {
  if (section === "trust") return "blog-card--hover-amber";
  if (section === "compare") return "blog-card--hover-forest";
  return "blog-card--hover-teal";
}
