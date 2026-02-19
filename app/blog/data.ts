export const BLOG_CATEGORIES = [
  "All",
  "For Consumers",
  "For Businesses",
  "Trust & Safety",
  "Platform Updates",
  "Guides & Reports",
] as const;

export type BlogCategory = (typeof BLOG_CATEGORIES)[number];

export const featuredPost = {
  category: "For Businesses" as const,
  title:
    "A Business Owner's Guide to Responding to Negative Reviews (2025 Guide)",
  description:
    "Learn how to professionally handle negative reviews, protect your reputation, and turn unhappy customers into loyal fans with clear, respectful responses.",
  image: "/brand/Block%20Cover.png",
  href: "/blog/trust-score-2025",
};

export const posts = [
  {
    category: "For Consumers" as const,
    title: "How the Tellacity Trust Score Works in 2025",
    description:
      "Understand the signals that shape trust scores and how verified reviews improve clarity for everyone.",
    image: "/brand/Asian Apple.png",
    postedAt: "2025-02-05",
  },
  {
    category: "For Businesses" as const,
    title: "Why Every Business Should Claim Its Tellacity Profile",
    description:
      "Claiming your profile helps you respond publicly, build credibility, and grow trust over time.",
    image: "/brand/Astonished woman.png",
    postedAt: "2025-02-06",
  },
  {
    category: "For Businesses" as const,
    title: "Bringing Your Reviews to Tellacity: A Complete Import Guide",
    description:
      "Import reviews from Google, Facebook, Yelp, or CSV. Consolidate your reputation and boost your Trust Score from day one.",
    image: "/brand/laptom with review platforms.png",
    postedAt: "2025-02-07",
  },
  {
    category: "Trust & Safety" as const,
    title: "The Most Common Online Shopping Scams and How to Avoid Them",
    description:
      "Learn the red flags and how verified reviews protect consumers from bad actors.",
    image: "/brand/woman and scammer.png",
    postedAt: "2025-02-08",
  },
  {
    category: "Guides & Reports" as const,
    title: "Shopping Online Safely in 2025: A Complete Consumer Guide",
    description:
      "Practical tips for evaluating businesses and making confident online purchases.",
    image: "/brand/Shopping Safety.png",
    postedAt: "2025-02-09",
  },
  {
    category: "Platform Updates" as const,
    title: "How to Check If a Business Is Legit Before Buying in 2025",
    description:
      "Use verified signals, transparency markers, and review quality to assess trust.",
    image: "/brand/woman on laptop.png",
    postedAt: "2025-02-10",
  },
  {
    category: "For Consumers" as const,
    title: "What Makes a Review Useful? The Complete 2025 Breakdown",
    description:
      "Clear, specific feedback helps others make better decisions and improves trust.",
    image: "/brand/write a review.png",
    postedAt: "2025-02-12",
  },
  {
    category: "Trust & Safety" as const,
    title: "What Is a Verified Review? The Complete 2025 Guide",
    description:
      "Learn what verification means, how it works, and why verified reviews are the gold standard for trust.",
    image: "/brand/Izabela.png",
    postedAt: "2025-02-11",
  },
  {
    category: "Platform Updates" as const,
    title:
      "Tellacity 2025 Platform Update: New Dashboards, Analytics & Mobile App Beta",
    description:
      "Redesigned dashboards, enhanced analytics, and the Mobile App Beta. Streamline your workflow and connect with customers like never before.",
    image: "/brand/Tellacity Phone.png",
    postedAt: "2025-02-13",
  },
  {
    category: "For Consumers" as const,
    title:
      "How to Check If a Business Is Legit in 2026 (Before You Spend Your Money)",
    description:
      "A simple, practical guide to verifying whether a company is real, trustworthy, and worth your time before you spend.",
    image: "/brand/first tellacity blog post.png",
    postedAt: "2026-01-15",
  },
];

const hrefMap: Record<string, string> = {
  "How the Tellacity Trust Score Works in 2025": "/blog/trust-score-2025",
  "Why Every Business Should Claim Its Tellacity Profile":
    "/blog/claim-tellacity-profile",
  "Bringing Your Reviews to Tellacity: A Complete Import Guide":
    "/blog/import-reviews",
  "The Most Common Online Shopping Scams and How to Avoid Them":
    "/blog/online-shopping-scams-2025",
  "Shopping Online Safely in 2025: A Complete Consumer Guide":
    "/blog/shopping-online-safely-2025",
  "How to Check If a Business Is Legit Before Buying in 2025":
    "/blog/check-business-legit-2025",
  "What Is a Verified Review? The Complete 2025 Guide":
    "/blog/verified-review-2025",
  "What Makes a Review Useful? The Complete 2025 Breakdown":
    "/blog/what-makes-a-review-useful-2025",
  "Tellacity 2025 Platform Update: New Dashboards, Analytics & Mobile App Beta":
    "/blog/platform-update-2025",
  "How to Check If a Business Is Legit in 2026 (Before You Spend Your Money)":
    "/blog/check-business-legit-2026",
};

export function getPostHref(title: string): string {
  return hrefMap[title] ?? "/blog";
}

export const sortedPosts = [...posts].sort((a, b) =>
  (b.postedAt as string).localeCompare(a.postedAt as string)
);
