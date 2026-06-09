export const PRESS_HERO_UNSPLASH =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=2400&q=80";

export const PRESS_CONTACT_IMAGE = `/brand/${encodeURIComponent("Customer Support.png")}`;

export const ARTICLE_SLUGS: Record<string, string> = {
  "How the Tellacity Trust Score Works in 2025": "/articles/trust-score-2025",
  "Why Every Business Should Claim Its Tellacity Profile": "/articles/claim-tellacity-profile",
  "Bringing Your Reviews to Tellacity: A Complete Import Guide": "/articles/import-reviews",
  "The Most Common Online Shopping Scams and How to Avoid Them": "/articles/online-shopping-scams-2025",
  "Shopping Online Safely in 2025: A Complete Consumer Guide": "/articles/shopping-online-safely-2025",
  "How to Check If a Business Is Legit Before Buying in 2025": "/articles/check-business-legit-2025",
  "What Is a Verified Review? The Complete 2025 Guide": "/articles/verified-review-2025",
  "What Makes a Review Useful? The Complete 2025 Breakdown": "/articles/what-makes-a-review-useful-2025",
  "Tellacity 2025 Platform Update: New Dashboards, Analytics & Mobile App Beta":
    "/articles/platform-update-2025",
  "How to Check If a Business Is Legit in 2026 (Before You Spend Your Money)":
    "/articles/check-business-legit-2026",
};

export type PressItem = {
  category: string;
  title: string;
  image: string;
  postedAt: string;
};

export const pressItems: PressItem[] = [
  {
    category: "For Consumers",
    title: "How the Tellacity Trust Score Works in 2025",
    image: "/brand/Asian Apple.png",
    postedAt: "2025-02-05",
  },
  {
    category: "For Businesses",
    title: "Why Every Business Should Claim Its Tellacity Profile",
    image: "/brand/Astonished woman.png",
    postedAt: "2025-02-06",
  },
  {
    category: "For Businesses",
    title: "Bringing Your Reviews to Tellacity: A Complete Import Guide",
    image: "/brand/laptom with review platforms.png",
    postedAt: "2025-02-07",
  },
  {
    category: "Trust & Safety",
    title: "The Most Common Online Shopping Scams and How to Avoid Them",
    image: "/brand/woman and scammer.png",
    postedAt: "2025-02-08",
  },
  {
    category: "Guides & Reports",
    title: "Shopping Online Safely in 2025: A Complete Consumer Guide",
    image: "/brand/Shopping Safety.png",
    postedAt: "2025-02-09",
  },
  {
    category: "Platform Updates",
    title: "How to Check If a Business Is Legit Before Buying in 2025",
    image: "/brand/woman on laptop.png",
    postedAt: "2025-02-10",
  },
  {
    category: "Trust & Safety",
    title: "What Is a Verified Review? The Complete 2025 Guide",
    image: "/brand/Izabela.png",
    postedAt: "2025-02-11",
  },
  {
    category: "For Consumers",
    title: "What Makes a Review Useful? The Complete 2025 Breakdown",
    image: "/brand/write a review.png",
    postedAt: "2025-02-12",
  },
  {
    category: "Platform Updates",
    title: "Tellacity 2025 Platform Update: New Dashboards, Analytics & Mobile App Beta",
    image: "/brand/Tellacity Phone.png",
    postedAt: "2025-02-13",
  },
  {
    category: "For Consumers",
    title: "How to Check If a Business Is Legit in 2026 (Before You Spend Your Money)",
    image: "/brand/first tellacity blog post.png",
    postedAt: "2026-01-15",
  },
];

export const ITEMS_PER_PAGE = 6;

export function formatPressDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatPressDateShort(iso: string): string {
  return new Date(iso)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    .toUpperCase();
}

export function getArticleHref(title: string): string {
  return ARTICLE_SLUGS[title] ?? "/articles";
}

export function getSortedPressItems(): PressItem[] {
  return [...pressItems].sort((a, b) => b.postedAt.localeCompare(a.postedAt));
}

export function categoryPillClass(category: string): string {
  if (category === "For Consumers") return "press-pill press-pill--amber";
  if (category === "Guides & Reports") return "press-pill press-pill--teal";
  return "press-pill press-pill--forest";
}

/** 3 + 2 + 2 asymmetric rows for press grid */
export function chunkPressRows<T>(items: T[]): T[][] {
  const pattern = [3, 2, 2];
  const rows: T[][] = [];
  let i = 0;
  for (const size of pattern) {
    if (i >= items.length) break;
    rows.push(items.slice(i, i + size));
    i += size;
  }
  while (i < items.length) {
    rows.push(items.slice(i, i + 3));
    i += 3;
  }
  return rows;
}
