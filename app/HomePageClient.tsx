"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import RecentReviewCard from "@/components/reviews/RecentReviewCard";
import RotatingBestCategorySection from "@/components/home/RotatingBestCategorySection";
import BusinessSearchInput from "@/components/search/BusinessSearchInput";
import { motion } from "framer-motion";
import { FadeUp } from "@/components/ui/MotionWrapper";
import { getActiveCountry } from "@/lib/getActiveCountry";
import { isAbortError } from "@/lib/authErrors";
import {
  sortedPosts as blogSortedPosts,
  getPostHref as getBlogPostHref,
} from "@/app/blog/data";

type HomeReview = {
  review_id: string;
  rating: number | null;
  title?: string | null;
  body: string | null;
  created_at: string | null;
  guest_name: string | null;
  reviewer_name?: string | null;
  business_name: string | null;
  business_slug: string | null;
  website: string | null;
  resolved_logo_url: string | null;
};

const cleanDomain = (value: string | null | undefined) =>
  value ? value.replace(/^https?:\/\//, "").replace(/^www\./, "") : "";

type CategoryCard = {
  id: string;
  name: string;
  slug: string;
};

const LOOKING_FOR_CATEGORIES = [
  { label: "Banking", slug: "banking" },
  { label: "Travel Agencies", slug: "travel-agencies" },
  { label: "Cars & Trucks", slug: "cars-and-trucks" },
  { label: "Furniture Stores", slug: "furniture-stores" },
  { label: "Jewelry & Watches", slug: "jewelry-and-watches" },
  { label: "Clothing & Underwear", slug: "clothing-and-underwear" },
  { label: "Appliances & Electronics", slug: "appliances-and-electronics" },
  { label: "Fitness & Gyms", slug: "fitness-and-gyms" },
];

type BestInBusiness = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  website_display?: string | null;
  resolved_logo_url?: string | null;
  trust_score?: number | null;
  review_count?: number | null;
};

type HomePageClientProps = {
  initialSelectedCountry: string | null;
  rotatingCategorySlugs: string[];
  bestInByCategory: Record<string, BestInBusiness[]>;
  bestInCategoryLabels: Record<string, string>;
  rpcDebug?: Record<
    string,
    { country: string; error: string | null; count: number }
  >;
};

export default function HomePageClient({
  initialSelectedCountry,
  rotatingCategorySlugs,
  bestInByCategory,
  bestInCategoryLabels,
  rpcDebug,
}: HomePageClientProps) {
  const router = useRouter();
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<CategoryCard[]>(() =>
    LOOKING_FOR_CATEGORIES.map(({ label, slug }) => ({
      id: `static-${slug}`,
      name: label,
      slug,
    }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return (
        window.localStorage.getItem("tellacity_country") ??
        initialSelectedCountry ??
        null
      );
    }
    return initialSelectedCountry ?? null;
  });
  const [openFaqKey, setOpenFaqKey] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);
  const [bestInIndex, setBestInIndex] = useState(0);

  const latestBlogPost = useMemo(() => {
    const post = blogSortedPosts[0];
    if (!post) return null;
    return {
      title: post.title,
      description: post.description,
      category: post.category,
      href: getBlogPostHref(post.title),
      imageSrc: post.image,
      imageAlt: post.title,
    };
  }, []);

  useEffect(() => {
    if (!rotatingCategorySlugs || rotatingCategorySlugs.length === 0) {
      return;
    }
    setBestInIndex(0);
    const id = window.setInterval(() => {
      setBestInIndex((prev) =>
        rotatingCategorySlugs.length === 0
          ? 0
          : (prev + 1) % rotatingCategorySlugs.length
      );
    }, 180000);
    return () => window.clearInterval(id);
  }, [rotatingCategorySlugs]);

  const faqItems = [
    {
      question: "What is Tellacity?",
      answer:
        "Tellacity is a global trust and reputation platform where consumers can share genuine experiences and businesses can build credibility. Unlike generic review sites, Tellacity uses proof-of-purchase verification and advanced fraud-prevention measures to ensure reviews are real. Businesses gain tools for analytics, engagement, and reputation growth, while consumers get a trusted place to make better decisions.",
    },
    {
      question: "How does Tellacity ensure reviews are trustworthy?",
      answer:
        "We use several layers of verification to maintain integrity: Proof of Purchase: Consumers can upload receipts, invoices, or order numbers to verify their reviews. Fraud Detection: AI-driven systems check for suspicious patterns, duplicate accounts, or spam behavior. Community Guidelines: Every review must follow strict fairness and respect standards. Moderation: Businesses can flag reviews, which are reviewed under our transparent dispute process.",
    },
    {
      question: "Can businesses respond to reviews?",
      answer:
        "Yes. We encourage open communication. Businesses can: Reply publicly to customer feedback (positive or negative). Address disputes by opening a moderated discussion with the reviewer. Show responsiveness with the “Owner Responded” badge. This creates a fair two-way conversation between customers and businesses.",
    },
    {
      question: "What is a ‘Verified Review’?",
      answer:
        "A Verified Review is marked with a badge indicating the consumer provided proof of transaction (invoice, booking number, receipt, or payment record). Verified Reviews carry more weight and rank higher in visibility compared to unverified ones, ensuring customers can trust what they read.",
    },
    {
      question: "How can I claim my business on Tellacity?",
      answer:
        "Claiming is simple and secure: Search for your business in our directory. Click “Claim Business” and follow the verification steps (email/domain match, official documents, or other approved proof). Once approved, you’ll unlock the Free Plan dashboard with tools for managing reviews, analytics, and promotional widgets. You can upgrade anytime to Grow, Premium, or Elite plans for advanced features.",
    },
    {
      question: "Is Tellacity free to use?",
      answer:
        "For consumers: It is 100% free to write, read, and share reviews. For businesses: We offer a robust Free Plan which includes claiming your profile, responding to reviews, and using our basic SEO widget. Paid Plans: Our Grow, Premium, and Elite plans unlock advanced analytics, deeper integrations (Shopify, etc.), and automated review collection tools.",
    },
    {
      question: "How do I report a fake or inappropriate review?",
      answer:
        "If you believe a review is fake, offensive, or violates our Community Guidelines, click the “Report Review” flag icon directly under the review. You'll need to select a reason (e.g., spam, offensive content, conflict of interest). Our moderation team will investigate, and the review may be temporarily labeled as “Under Review” during this process.",
    },
    {
      question: "Do I need an account to write a review?",
      answer:
        "Yes, you need a free Tellacity account. This requirement helps prevent spam, ensures reviews are linked to real people, and allows you to manage your own reviews later.",
    },
    {
      question: "Can I edit or delete my review?",
      answer:
        "Yes. You can edit your review for a short period after posting to correct typos or add details. You can delete your review at any time from your user dashboard if you no longer wish to share your experience.",
    },
    {
      question: "Will the business see my contact details?",
      answer:
        "No. Your email and phone number are private. Businesses only see your public profile name and the content of your review. If a dispute arises, you may choose to share details privately to resolve the issue, but that is entirely up to you.",
    },
    {
      question: "What benefits do businesses get by claiming their profile?",
      answer:
        "Reputation Control: Manage and respond to reviews directly. SEO Boost: Tellacity profile pages rank well on search engines, driving traffic to your brand. Analytics Dashboard: Track review trends, star ratings, and consumer sentiment over time. Integrations: Sync reviews and sales data with platforms like Shopify, Paystack, and others. Trust Badges: Display a Verified Business badge on your website to increase conversion rates.",
    },
    {
      question: "What payment methods does Tellacity support?",
      answer:
        "We support major credit cards and local payment methods via our payment partners, including Paystack, PayFast, and PayPal. We aim to make subscription management easy for businesses globally.",
    },
    {
      question: "Can multiple team members manage one business account?",
      answer:
        "Yes. Our platform allows you to invite team members and assign roles (such as Admin or Manager) so your support or marketing teams can help manage reviews and analytics without sharing a single login.",
    },
    {
      question: "How are disputes handled?",
      answer:
        "When a business disputes a review, our system places the review in a mediation state. We may ask the reviewer for proof of experience or clarification. Our moderation team reviews the evidence impartially. If the review violates guidelines, it is removed; otherwise, it remains visible.",
    },
    {
      question: "What happens if a business tries to delete negative reviews?",
      answer:
        "Businesses cannot delete legitimate consumer reviews. Transparency is our core value. Reviews remain visible unless they violate our content policies (e.g., hate speech, spam). This ensures consumers get an honest picture of the business.",
    },
    {
      question: "How does Tellacity protect against manipulation?",
      answer:
        "We actively monitor for manipulation attempts such as: Bulk fake reviews from the same IP address. Incentivized or paid positive reviews. Competitors leaving malicious negative reviews. Violations can result in content removal, account suspension, or a consumer warning badge placed on the business profile.",
    },
  ];
  const faqMidpoint = Math.ceil(faqItems.length / 2);
  const faqColumns = [faqItems.slice(0, faqMidpoint), faqItems.slice(faqMidpoint)];
  const reviewsPerPage = 8;
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));
  const visibleReviews = reviews.slice(
    reviewPage * reviewsPerPage,
    reviewPage * reviewsPerPage + reviewsPerPage
  );

  const activeBestInSlug =
    rotatingCategorySlugs && rotatingCategorySlugs.length > 0
      ? rotatingCategorySlugs[bestInIndex % rotatingCategorySlugs.length]
      : "banking";
  const activeBestInBusinesses = bestInByCategory[activeBestInSlug] ?? [];
  const activeBestInLabel =
    bestInCategoryLabels[activeBestInSlug] ??
    activeBestInSlug.replace(/-/g, " ");

  useEffect(() => {
    const stored = getActiveCountry();
    if (stored) {
      setSelectedCountry(stored);
    }

    const handleSync = () => {
      const updated = getActiveCountry();
      setSelectedCountry(updated || null);
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener("tellacity-country-change", handleSync);
    return () => {
      window.removeEventListener("storage", handleSync);
      window.removeEventListener("tellacity-country-change", handleSync);
    };
  }, []);

  // Reviews: 1) home_feed_v1 view (optional), 2) fallback = reviews table + businesses (join). No RPC.
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const country = getActiveCountry();
      setIsLoading(true);
      setError(null);

      const runFallbackReviews = async (): Promise<boolean> => {
        const supabase = supabaseBrowser();
        const { data: fallbackData, error: fallbackError } = await supabase
          .from("reviews")
          .select(
            "id, rating, title, body, created_at, guest_name, businesses(name, slug, website, logo_url)"
          )
          .or("status.is.null,status.eq.published")
          .order("created_at", { ascending: false })
          .limit(54);

        if (!isMounted) return false;
        if (fallbackError || !fallbackData || fallbackData.length === 0) return false;

        const mapped: HomeReview[] = fallbackData.map((row: Record<string, unknown>) => {
          const biz = row.businesses as {
            name?: string;
            slug?: string;
            website?: string;
            logo_url?: string;
          } | null;
          const guestName = (row.guest_name as string) ?? null;
          return {
            review_id: row.id as string,
            rating: (row.rating as number) ?? null,
            title: (row.title as string) ?? null,
            body: (row.body as string) ?? null,
            created_at: (row.created_at as string) ?? null,
            guest_name: guestName,
            business_name: biz?.name ?? null,
            business_slug: biz?.slug ?? null,
            website: biz?.website ?? null,
            resolved_logo_url: biz?.logo_url ?? null,
            reviewer_name: guestName,
          };
        });
        setReviews(mapped);
        return true;
      };

      try {
        let data: HomeReview[] | null = null;
        let err: unknown = null;

        try {
          const supabase = supabaseBrowser();
          let query = supabase
            .from("home_feed_v1")
            .select("*")
            .order("created_at", { ascending: false });

          if (country) {
            query = query.eq("country_code", country);
          }

          const result = await query.limit(54);
          if (!isMounted) return;
          err = result.error;
          if (!result.error && result.data && result.data.length > 0) {
            setReviews(result.data as HomeReview[]);
            return;
          }
          data = (result.data ?? null) as HomeReview[] | null;
        } catch (viewErr) {
          if (!isMounted) return;
          if (isAbortError(viewErr)) return;
          const ok = await runFallbackReviews();
          if (!ok)
            setError(viewErr instanceof Error ? viewErr.message : "Failed to load reviews.");
          return;
        }

        const ok = await runFallbackReviews();
        if (!ok && !err) setReviews(data ?? []);
        if (err && !isAbortError(err)) setError((err as Error).message);
      } catch (e) {
        if (!isMounted) return;
        if (!isAbortError(e)) {
          const ok = await runFallbackReviews();
          if (!ok)
            setError(e instanceof Error ? e.message : "Failed to load reviews.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  useEffect(() => {
    if (reviewPage >= totalReviewPages) {
      setReviewPage(0);
    }
  }, [reviewPage, totalReviewPages]);

  useEffect(() => {
    setReviewPage(0);
  }, [selectedCountry]);

  useEffect(() => {
    let isMounted = true;
    const staticFallback: CategoryCard[] = LOOKING_FOR_CATEGORIES.map(
      ({ label, slug }) => ({ id: `static-${slug}`, name: label, slug })
    );

    const fetchCategories = async () => {
      try {
        const supabase = supabaseBrowser();
        const { data, error } = await supabase
          .from("categories")
          .select("id, name, slug")
          .order("name", { ascending: true });

        if (!isMounted) return;

        if (error) {
          setCategoryCards(staticFallback);
          setVisibleCategories(staticFallback);
          return;
        }

        const items =
          (data as CategoryCard[] | null | undefined)?.filter(
            (item) => item.slug && item.name
          ) ?? [];

        // temporarily disable country filtering
        const countryFilter = null;
        if (countryFilter) {
          const supabase = supabaseBrowser();
          const { data: countryBusinesses } = await supabase
            .from("businesses")
            .select("category_slug")
            .eq("country_code", countryFilter)
            .not("category_slug", "is", null);

          if (!isMounted) return;

          const allowed = new Set(
            (countryBusinesses ?? [])
              .map((row) => row.category_slug)
              .filter(Boolean)
          );
          const filtered = items.filter((item) => allowed.has(item.slug));
          items.splice(0, items.length, ...filtered);
        }

        const bySlug = new Map(items.map((item) => [item.slug, item]));
        const ordered: CategoryCard[] = LOOKING_FOR_CATEGORIES.map(
          ({ label, slug }) => {
            const matched = bySlug.get(slug);
            if (matched) {
              return { ...matched, name: label };
            }
            return { id: `static-${slug}`, name: label, slug };
          }
        );

        setCategoryCards(ordered);
        setVisibleCategories(ordered);
      } catch {
        if (isMounted) {
          setCategoryCards(staticFallback);
          setVisibleCategories(staticFallback);
        }
      }
    };

    fetchCategories();

    return () => {
      isMounted = false;
    };
  }, [selectedCountry]);

  const scrollCategories = (direction: "left" | "right") => {
    const container = categoryScrollRef.current;
    if (!container) {
      return;
    }
    const scrollAmount = Math.min(520, container.clientWidth);
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const getCategoryIcon = (name: string) => {
    const value = name.toLowerCase();
    const iconClass = "h-7 w-7 text-[#124541]";

    // Hotels / accommodation
    if (
      value.includes("hotel") ||
      value.includes("lodging") ||
      value.includes("accommodation")
    ) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 18V8" />
          <path d="M3 12h18" />
          <rect x="7" y="9" width="6" height="3" rx="1" />
          <path d="M21 18V7" />
          <path d="M13 12h8" />
        </svg>
      );
    }

    // Banking / money
    if (value.includes("bank") || value.includes("money") || value.includes("finance")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 10h16" />
          <path d="M5 10V8.5L12 4l7 4.5V10" />
          <rect x="5" y="10" width="3" height="7" />
          <rect x="10.5" y="10" width="3" height="7" />
          <rect x="16" y="10" width="3" height="7" />
          <path d="M4 17h16" />
        </svg>
      );
    }

    // Travel agencies
    if (value.includes("travel")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4 10l4.5 1.5L12 9l-1.5 4.5L15 18l1.5-4.5L20 12" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    }

    // Cars & trucks
    if (value.includes("car") || value.includes("truck")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="5" rx="1" />
          <path d="M7 11l1.5-3h7L17 11" />
          <circle cx="7" cy="17" r="1.4" />
          <circle cx="17" cy="17" r="1.4" />
        </svg>
      );
    }

    // Furniture stores
    if (value.includes("furniture")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="4" y="9" width="16" height="6" rx="1.5" />
          <path d="M8 9V6h8v3" />
          <path d="M7 15v3" />
          <path d="M17 15v3" />
        </svg>
      );
    }

    // Jewelry & watches
    if (value.includes("jewel") || value.includes("watch")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="4.5" />
          <path d="M12 8v2.5l1.8 1.2" />
          <rect x="10" y="3" width="4" height="3" rx="1" />
          <rect x="10" y="18" width="4" height="3" rx="1" />
        </svg>
      );
    }

    // Clothing & underwear
    if (value.includes("clothing") || value.includes("underwear") || value.includes("clothes")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M8 4l4 2 4-2 2 3-3 2v9H9V9L6 7z" />
        </svg>
      );
    }

    // Appliances & electronics
    if (value.includes("appliance") || value.includes("electronic")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="4" width="14" height="14" rx="2" />
          <rect x="8" y="7" width="8" height="6" rx="1" />
          <path d="M9 17h6" />
          <path d="M9 14.5h.01" />
          <path d="M15 14.5h.01" />
        </svg>
      );
    }

    // Fitness & gyms
    if (value.includes("fitness") || value.includes("gym")) {
      return (
        <svg
          viewBox="0 0 24 24"
          className={iconClass}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 7v10" />
          <path d="M18 7v10" />
          <rect x="8" y="8" width="2" height="8" />
          <rect x="14" y="8" width="2" height="8" />
          <path d="M4 9v6" />
          <path d="M20 9v6" />
        </svg>
      );
    }

    return (
      <svg
        viewBox="0 0 24 24"
        className={iconClass}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="6" width="16" height="12" rx="2" />
        <path d="M8 12h8" />
        <path d="M12 9v6" />
      </svg>
    );
  };

  return (
    <main className="bg-white">
      {/* HERO */}
      <section
        className="bg-[#0E0E0E] bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            "url('/brand/Hero%20section-%20Binoculus(1)(1).png')",
        }}
      >
        <div className="mx-auto flex min-h-[440px] max-w-7xl flex-col items-center px-6 pb-14 pt-20 text-center sm:min-h-[520px] sm:pt-24 md:pt-32 md:pb-16">
          <div className="w-full max-w-md sm:max-w-lg md:max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-3xl font-semibold text-[#F9FAFB] sm:text-4xl md:text-5xl lg:text-[3.25rem]"
          >
            Customer{" "}
            <span className="relative inline-block cursor-default">
              <span className="relative z-[1]">Reviews &amp; Feedback</span>
              <span
                className="absolute left-0 right-0 bottom-[2px] h-[4px] rounded-sm bg-[#5dd4cc]"
                aria-hidden
              />
            </span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-3 text-sm font-medium tracking-wide text-[#F9FAFB]/80 sm:mt-4 sm:text-base"
          >
            Business insights. Transparency at scale.
          </motion.p>
          <FadeUp delay={0.2}>
            <div className="mt-8 w-full sm:mt-10">
              <BusinessSearchInput
                placeholder="Find businesses you can trust..."
                heroLayout
                heroButtonLabel="FIND A BUSINESS"
                onSelect={(business) => {
                  router.push(`/b/${business.slug}`);
                }}
                onSubmitQuery={(query) => {
                  if (!query.trim()) return;
                  router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                }}
              />
            </div>
          </FadeUp>
          <div className="mt-6">
            <Link
              href="/write-review"
              className="relative inline-flex items-center gap-1.5 rounded-full bg-[#0B9A6D] px-4 py-2 text-xs font-semibold text-white shadow-[0_0_0_rgba(239,68,68,0)] transition-all duration-300 sm:px-5 sm:py-2.5 sm:text-xs hover:shadow-[0_0_14px_rgba(239,68,68,0.85),0_0_26px_rgba(239,68,68,0.5)] active:scale-95"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-3 w-3 sm:h-4 sm:w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11.48 3.5a.6.6 0 011.04 0l2.11 4.27a.6.6 0 00.45.33l4.71.69a.6.6 0 01.33 1.02l-3.41 3.32a.6.6 0 00-.17.53l.8 4.69a.6.6 0 01-.87.63l-4.22-2.22a.6.6 0 00-.56 0l-4.22 2.22a.6.6 0 01-.87-.63l.8-4.69a.6.6 0 00-.17-.53L3.88 10.1a.6.6 0 01.33-1.02l4.71-.69a.6.6 0 00.45-.33l2.11-4.27z" />
              </svg>
              Write a Review
            </Link>
          </div>
          </div>
        </div>
      </section>

      <RotatingBestCategorySection
        categorySlug={activeBestInSlug}
        categoryLabel={activeBestInLabel}
        businesses={activeBestInBusinesses}
      />

      {/* WHAT ARE YOU LOOKING FOR? */}
      <section className="bg-white overflow-visible">
        <div className="mx-auto w-full max-w-7xl overflow-visible px-6 py-8 sm:py-10 md:py-12">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
                <span className="relative inline-block">
                  <span className="relative z-10">What are you looking for?</span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 sm:flex">
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                  onClick={() => scrollCategories("left")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
                  onClick={() => scrollCategories("right")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9 6l6 6-6 6" />
                  </svg>
                </button>
              </div>
              <Link
                href="/categories"
                className="rounded-full border border-[#1FAF9E] px-3 py-1.5 text-xs font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:px-4 sm:py-2 sm:text-sm"
              >
                See more →
              </Link>
            </div>
          </div>
          <div
            ref={categoryScrollRef}
            className="mt-6 flex gap-4 overflow-x-auto overflow-y-visible pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {visibleCategories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 60, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  duration: 0.6,
                  delay: index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Link
                  href={`/categories/${category.slug}`}
                  className="group relative flex h-[110px] w-[150px] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center text-gray-600 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-[#2fb2a8]/40 sm:h-[120px] sm:w-[160px]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center text-gray-500 sm:h-12 sm:w-12">
                    {getCategoryIcon(category.name)}
                  </span>
                  <span className="leading-tight text-xs font-medium text-[#0E0E0E] sm:text-sm">
                    {category.name}
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* RECENT REVIEWS */}
      <section className="mx-auto max-w-7xl px-6 py-8 sm:py-10 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
              <span className="relative inline-block">
                <span className="relative z-10">Recent reviews</span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Reviews are written by real customers and moderated for authenticity.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:border-gray-300"
              aria-label="Previous reviews"
              onClick={() =>
                setReviewPage((prev) =>
                  prev === 0 ? totalReviewPages - 1 : prev - 1
                )
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:border-gray-300"
              aria-label="Next reviews"
              onClick={() =>
                setReviewPage((prev) =>
                  prev === totalReviewPages - 1 ? 0 : prev + 1
                )
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile: horizontal swipe carousel */}
        <div className="mt-6 flex gap-4 overflow-x-auto pb-2 sm:hidden [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {isLoading &&
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 w-72 shrink-0 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
              />
            ))}
          {!isLoading &&
            visibleReviews.length > 0 &&
            visibleReviews.map((review) => (
              <div
                key={review.review_id}
                className="w-72 shrink-0 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-xl"
              >
                <RecentReviewCard review={review} showMoreAndReply={false} />
              </div>
            ))}
        </div>

        {/* Tablet / desktop: grid */}
        <div className="mt-6 hidden gap-6 sm:grid sm:grid-cols-2 lg:grid-cols-4">
          {isLoading &&
            [1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-64 rounded-xl border border-gray-200 bg-gray-50 animate-pulse"
              />
            ))}
          {!isLoading &&
            visibleReviews.length > 0 &&
            visibleReviews.map((review) => (
              <div
                key={review.review_id}
                className="transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl"
              >
                <RecentReviewCard review={review} showMoreAndReply={false} />
              </div>
            ))}
        </div>

        {!isLoading && visibleReviews.length === 0 && !error && (
          <p className="mt-8 text-center text-sm text-gray-500 py-8">
            No reviews to show yet. Check back soon.
          </p>
        )}
      </section>

      {/* FAQ SECTION */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10 md:py-12">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
              <span className="relative inline-block">
                <span className="relative z-10">Frequently Asked Questions</span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-3 max-w-2xl text-sm text-gray-600">
              Got questions? We've got answers. Delve into our Frequently Asked
              Questions (FAQs) section to find comprehensive information about
              your inquiries.
            </p>
          </div>

          {/* Mobile: show only a subset of FAQs */}
          <div className="mt-6 flex flex-col gap-4 lg:hidden">
            {faqItems.slice(0, 8).map((item) => {
              const isOpen = openFaqKey === item.question;
              return (
                <div
                  key={item.question}
                  className={`rounded-md border border-gray-200 bg-white transition-all duration-200 hover:bg-[#2fb2a8]/5 hover:border-[#2fb2a8] ${
                    isOpen ? "shadow-md border-[#2fb2a8]" : ""
                  }`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      setOpenFaqKey((prev) =>
                        prev === item.question ? null : item.question
                      )
                    }
                    className="flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left text-sm font-medium text-[#0E0E0E] [&::-webkit-details-marker]:hidden"
                  >
                    <span>{item.question}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-[#2fb2a8]" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="px-5 pb-4 text-sm text-gray-600">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop: full FAQ grid */}
          <div className="mt-8 hidden gap-4 lg:grid lg:grid-cols-2">
            {faqColumns.map((column, columnIndex) => (
              <div
                key={`faq-column-${columnIndex}`}
                className="flex flex-col gap-4"
              >
                {column.map((item) => {
                  const isOpen = openFaqKey === item.question;
                  return (
                    <div
                      key={item.question}
                      className={`rounded-md border border-gray-200 bg-white transition-all duration-200 hover:bg-[#2fb2a8]/5 hover:border-[#2fb2a8] ${
                        isOpen ? "shadow-md border-[#2fb2a8]" : ""
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setOpenFaqKey((prev) =>
                            prev === item.question ? null : item.question
                          )
                        }
                        className="flex w-full cursor-pointer items-center justify-between px-5 py-3 text-left text-sm font-medium text-[#0E0E0E] [&::-webkit-details-marker]:hidden"
                      >
                        <span>{item.question}</span>
                        <svg
                          viewBox="0 0 24 24"
                          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${
                            isOpen ? "rotate-180 text-[#2fb2a8]" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M6 9l6 6 6-6" />
                        </svg>
                      </button>
                      <div
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${
                          isOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
                        }`}
                      >
                        <div className="px-5 pb-4 text-sm text-gray-600">
                          {item.answer}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/faq"
              className="inline-flex items-center gap-2 rounded-md border border-[#1FAF9E] px-6 py-3 text-sm font-semibold text-[#1FAF9E]"
            >
              View All
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="M13 6l6 6-6 6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* LATEST BLOG POSTS */}
      <motion.section
        className="bg-white"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10 md:py-12">
          <div>
            <h2 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
              <span className="relative inline-block">
                <span className="relative z-10">Latest Blog Posts</span>
                <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
              </span>
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Insights, guides, and stories on building trust and growing your
              business.
            </p>
            <Link
              href="/blog"
              className="mt-3 inline-block text-sm font-semibold text-[#2fb2a8] hover:underline"
            >
              View all posts →
            </Link>
          </div>

          <div className="mt-6">
            {latestBlogPost && (
              <div
                key={latestBlogPost.title}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm lg:flex"
              >
                <motion.div
                  className="flex-1 p-8"
                  initial="hidden"
                  whileInView="show"
                  viewport={{ once: true }}
                  variants={{
                    hidden: {},
                    show: {
                      transition: {
                        staggerChildren: 0.12,
                      },
                    },
                  }}
                >
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <span className="inline-flex rounded-full bg-[#E6F6F1] px-3 py-1 text-xs font-semibold text-[#0B3B36]">
                      {latestBlogPost.category}
                    </span>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <h3 className="mt-4 text-base font-semibold text-[#0E0E0E] sm:text-lg md:text-xl">
                      {latestBlogPost.title}
                    </h3>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <p className="mt-3 text-sm text-gray-600">
                      {latestBlogPost.description}
                    </p>
                  </motion.div>
                  <motion.div
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      show: {
                        opacity: 1,
                        y: 0,
                        transition: { duration: 0.6 },
                      },
                    }}
                  >
                    <Link
                      href={latestBlogPost.href}
                      className="mt-6 inline-flex items-center rounded-lg bg-[#0B3B36] px-4 py-2 text-sm font-semibold text-white"
                    >
                      Read More
                    </Link>
                  </motion.div>
                </motion.div>
                <motion.div
                  className="h-64 w-full bg-gray-100 lg:h-auto lg:w-[46%]"
                  initial={{ opacity: 0, scale: 1.05 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9 }}
                  viewport={{ once: true }}
                >
                  <img
                    src={latestBlogPost.imageSrc}
                    alt={latestBlogPost.imageAlt}
                    className="h-full w-full object-cover"
                  />
                </motion.div>
              </div>
            )}
          </div>
        </div>
      </motion.section>

      {/* BUSINESS CTA */}
      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-8 sm:py-10 md:py-12">
          <div className="rounded-[28px] bg-[#D9FAEF] px-8 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <h3 className="text-xl font-semibold text-[#0E0E0E] sm:text-2xl md:text-3xl">
                  <span className="relative inline-block">
                    <span className="relative z-10">
                      Looking to grow your business?
                    </span>
                    <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                  </span>
                </h3>
                <p className="mt-3 text-sm text-[#0E0E0E]/80">
                  Build trust and stand out with verified customer reviews on
                  Tellacity, a transparent platform where real customers share
                  real experiences. Get discovered, earn authentic feedback,
                  and attract quality customers by showing why your business
                  deserves to be trusted and chosen.
                </p>
              </div>
              <Link
                href="/for-business"
                className="inline-flex items-center justify-center rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-1 active:scale-95"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

