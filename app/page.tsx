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
import {
  sortedPosts as blogSortedPosts,
  getPostHref as getBlogPostHref,
} from "@/app/blog/data";

type HomeReview = {
  review_id: string;
  rating: number | null;
  body: string | null;
  created_at: string | null;
  guest_name: string | null;
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

export default function HomePage() {
  const router = useRouter();
  const [reviews, setReviews] = useState<HomeReview[]>([]);
  const [categoryCards, setCategoryCards] = useState<CategoryCard[]>([]);
  const [visibleCategories, setVisibleCategories] = useState<CategoryCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewPage, setReviewPage] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [openFaqKey, setOpenFaqKey] = useState<string | null>(null);
  const categoryScrollRef = useRef<HTMLDivElement | null>(null);

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
  const rotatingCategorySlugs = useMemo(
    () => [
      "banking",
      "insurance",
      "restaurants-and-bars",
      "internet-and-software",
      "banking-and-money",
      "cars-and-trucks",
    ],
    []
  );
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
  const faqColumns = [
    faqItems.slice(0, faqMidpoint),
    faqItems.slice(faqMidpoint),
  ];
  const reviewsPerPage = 8;
  const totalReviewPages = Math.max(1, Math.ceil(reviews.length / reviewsPerPage));
  const visibleReviews = reviews.slice(
    reviewPage * reviewsPerPage,
    reviewPage * reviewsPerPage + reviewsPerPage
  );

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

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const country = getActiveCountry();
      setIsLoading(true);

      let query = supabaseBrowser
        .from("home_feed_v1")
        .select("*")
        .order("created_at", { ascending: false });

      if (country) {
        query = query.eq("country_code", country);
      }

      const { data, error } = await query.limit(54);

      if (!isMounted) return;

      if (error) {
        setError(error.message);
      } else {
        setReviews(data ?? []);
      }

      setIsLoading(false);
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

    const fetchCategories = async () => {
      const { data, error } = await supabaseBrowser
        .from("categories")
        .select("id, name, slug")
        .order("name", { ascending: true });

      if (!isMounted) return;

      if (error) {
        setCategoryCards([]);
        setVisibleCategories([]);
        return;
      }

      const items =
        (data as CategoryCard[] | null | undefined)?.filter(
          (item) => item.slug && item.name
        ) ?? [];

      // temporarily disable country filtering
      const countryFilter = null;
      if (countryFilter) {
        const { data: countryBusinesses } = await supabaseBrowser
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

    if (value.includes("hotel") || value.includes("lodging") || value.includes("accommodation")) {
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

    if (value.includes("agriculture") || value.includes("produce") || value.includes("farm")) {
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
          <path d="M12 21v-7" />
          <path d="M8 14c-3-1-4-4-4-7 3 0 6 1 8 4" />
          <path d="M16 13c3-1 5-4 5-7-4 0-7 1-9 4" />
        </svg>
      );
    }

    if (value.includes("accounting") || value.includes("tax") || value.includes("bookkeeping")) {
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
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M8 7h8" />
          <path d="M8 11h8" />
          <path d="M8 15h5" />
        </svg>
      );
    }

    if (value.includes("bicycle") || value.includes("bike") || value.includes("cycling")) {
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
          <circle cx="6" cy="17" r="3" />
          <circle cx="18" cy="17" r="3" />
          <path d="M6 17l4-7h4l2 4" />
          <path d="M10 10l-1-3h3" />
        </svg>
      );
    }

    if (value.includes("coffee") || value.includes("tea") || value.includes("cafe")) {
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
          <path d="M4 9h10v6a4 4 0 01-4 4H8a4 4 0 01-4-4V9z" />
          <path d="M14 10h3a3 3 0 010 6h-3" />
          <path d="M8 5c0 1-1 1-1 2" />
          <path d="M12 5c0 1-1 1-1 2" />
        </svg>
      );
    }

    if (value.includes("bank") || value.includes("finance")) {
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
          <path d="M3 10h18" />
          <path d="M5 10V7l7-4 7 4v3" />
          <path d="M6 10v8" />
          <path d="M10 10v8" />
          <path d="M14 10v8" />
          <path d="M18 10v8" />
          <path d="M3 18h18" />
        </svg>
      );
    }

    if (value.includes("travel") || value.includes("agency") || value.includes("flight")) {
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
          <path d="M3 11l18-6" />
          <path d="M6 19l3-1.5" />
          <path d="M11 17l4-2" />
          <path d="M15 14l6-2" />
          <path d="M6 19l-2-4 2-1 4 2" />
          <path d="M12 16l-2-6 2-1 4 4" />
        </svg>
      );
    }

    if (value.includes("car") || value.includes("auto") || value.includes("truck")) {
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
          <path d="M5 16l1.5-5h11L19 16" />
          <path d="M3 16h18" />
          <circle cx="7" cy="18" r="2" />
          <circle cx="17" cy="18" r="2" />
        </svg>
      );
    }

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
          <rect x="4" y="10" width="16" height="4" rx="1.5" />
          <path d="M6 10V8a2 2 0 012-2h8a2 2 0 012 2v2" />
          <path d="M6 14v4" />
          <path d="M18 14v4" />
        </svg>
      );
    }

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
          <path d="M12 3l8 6-8 12L4 9l8-6z" />
          <path d="M4 9h16" />
          <path d="M8 9l4 12" />
          <path d="M16 9l-4 12" />
        </svg>
      );
    }

    if (value.includes("clothing") || value.includes("underwear") || value.includes("fashion")) {
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
          <path d="M6 7l4-3h4l4 3" />
          <path d="M4 9l4-2v10" />
          <path d="M20 9l-4-2v10" />
          <path d="M8 17h8" />
        </svg>
      );
    }

    if (
      value.includes("appliance") ||
      value.includes("electronic") ||
      value.includes("technology") ||
      value.includes("tech")
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
          <rect x="3" y="5" width="18" height="12" rx="2" />
          <path d="M8 21h8" />
          <path d="M12 17v4" />
        </svg>
      );
    }

    if (value.includes("fitness") || value.includes("gym") || value.includes("nutrition")) {
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
          <path d="M3 10v4" />
          <path d="M7 8v8" />
          <path d="M10 9h4" />
          <path d="M14 9h4" />
          <path d="M17 8v8" />
          <path d="M21 10v4" />
        </svg>
      );
    }

    if (value.includes("health") || value.includes("clinic")) {
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
          <path d="M5 9h4V5h6v4h4v6h-4v4H9v-4H5V9z" />
        </svg>
      );
    }

    if (value.includes("pet") || value.includes("animal") || value.includes("dog") || value.includes("cat")) {
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
          <path d="M7 13c0-2.8 2.2-5 5-5s5 2.2 5 5" />
          <path d="M9 18c1 .8 2 .9 3 .9s2-.1 3-.9" />
          <circle cx="8" cy="9" r="1" />
          <circle cx="16" cy="9" r="1" />
          <path d="M6 7l2-2" />
          <path d="M18 7l-2-2" />
        </svg>
      );
    }

    if (value.includes("restaurant") || value.includes("bar") || value.includes("food")) {
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
          <path d="M7 3v8" />
          <path d="M10 3v8" />
          <path d="M8.5 3v8" />
          <path d="M16 3v8" />
          <path d="M16 21V3" />
          <path d="M7 21v-7" />
        </svg>
      );
    }

    if (value.includes("insurance")) {
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
          <path d="M12 3l7 4v5c0 4.5-3 8-7 9-4-1-7-4.5-7-9V7l7-4z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    }

    if (value.includes("home") || value.includes("service")) {
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
          <path d="M3 11l9-7 9 7" />
          <path d="M5 10v9h14v-9" />
          <path d="M9 19v-6h6v6" />
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
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="text-4xl font-semibold text-[#F9FAFB] md:text-5xl lg:text-[3.25rem]"
          >
            Customer Feedback & Reviews
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mt-4 text-base sm:text-lg !text-[#2fb2a8]/90 font-medium tracking-wide"
          >
            Business insights. Transparency at scale.
          </motion.p>
          <FadeUp delay={0.2}>
          <div className="mx-auto mt-10 w-full max-w-3xl">
            <BusinessSearchInput
              placeholder="Find businesses you can trust..."
              heroLayout
              heroButtonLabel="Find a business"
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
              className="relative inline-flex items-center gap-2 overflow-visible rounded-full bg-[#124541] px-6 py-3 text-sm font-semibold text-white shadow-[0_0_16px_rgba(18,69,65,0.55)] animate-glow-ring transition-all duration-300 hover:shadow-[0_0_25px_rgba(47,178,168,0.4)] active:scale-95"
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
                <path d="M11.48 3.5a.6.6 0 011.04 0l2.11 4.27a.6.6 0 00.45.33l4.71.69a.6.6 0 01.33 1.02l-3.41 3.32a.6.6 0 00-.17.53l.8 4.69a.6.6 0 01-.87.63l-4.22-2.22a.6.6 0 00-.56 0l-4.22 2.22a.6.6 0 01-.87-.63l.8-4.69a.6.6 0 00-.17-.53L3.88 10.1a.6.6 0 01.33-1.02l4.71-.69a.6.6 0 00.45-.33l2.11-4.27z" />
              </svg>
              Write a Review
            </Link>
          </div>
        </div>
      </section>

      <RotatingBestCategorySection categorySlugs={rotatingCategorySlugs} />

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-semibold text-[#0E0E0E]">
                <span className="relative inline-block">
                  <span className="relative z-10">What are you looking for?</span>
                  <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                </span>
            </h2>
              <p className="mt-2 text-sm text-gray-600">
                Browse trusted businesses by category
              </p>
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
                className="rounded-full border border-[#1FAF9E] px-4 py-2 text-sm font-semibold text-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40"
              >
                See more →
              </Link>
            </div>
          </div>
        <div
          ref={categoryScrollRef}
          className="mt-8 flex gap-6 overflow-x-hidden overflow-y-visible pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
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
                className="group relative flex h-[120px] w-[160px] shrink-0 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 text-center text-gray-600 shadow-sm transition-all duration-300 ease-out hover:shadow-lg hover:scale-[1.02] hover:border-[#2fb2a8]/40"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center text-gray-500">
                  {getCategoryIcon(category.name)}
                </span>
                <span className="leading-tight text-sm font-medium text-[#0E0E0E]">
                  {category.name}
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
      </section>

      {/* RECENT REVIEWS */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-[#0E0E0E]">
              <span className="relative inline-block">
                <span className="relative z-10">What people are saying right now</span>
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

        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {!isLoading &&
            visibleReviews.map((review) => (
              <div key={review.review_id} className="transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-xl">
                <RecentReviewCard
                  review={review}
                />
              </div>
            ))}
        </div>
      </section>

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
          <div>
            <h2 className="text-3xl font-semibold text-[#0E0E0E]">
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

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {faqColumns.map((column, columnIndex) => (
              <div key={`faq-column-${columnIndex}`} className="flex flex-col gap-4">
                {column.map((item) => {
                  const isOpen = openFaqKey === item.question;
                  return (
                    <div
                      key={item.question}
                      className={`rounded-md border border-gray-200 bg-white transition-all duration-200 hover:bg-[#2fb2a8]/5 hover:border-[#2fb2a8] ${isOpen ? "shadow-md border-[#2fb2a8]" : ""}`}
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
                          className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isOpen ? "rotate-180 text-[#2fb2a8]" : ""}`}
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
                        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"}`}
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

      <motion.section
        className="bg-white"
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true, amount: 0.2 }}
      >
        <div className="mx-auto w-full max-w-7xl px-6 py-16">
          <div>
            <h2 className="text-3xl font-semibold text-[#0E0E0E]">
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

          <div className="mt-8">
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
                    <h3 className="mt-4 text-2xl font-semibold text-[#0E0E0E]">
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

      <section className="bg-white">
        <div className="mx-auto w-full max-w-7xl px-6 pb-16">
          <div className="rounded-[28px] bg-[#D9FAEF] px-8 py-8 sm:px-10 sm:py-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-3xl">
                <h3 className="text-3xl font-semibold text-[#0E0E0E]">
                  <span className="relative inline-block">
                    <span className="relative z-10">Looking to grow your business?</span>
                    <span className="absolute left-0 right-0 bottom-1 h-2 bg-[#1FAF9E]/30" />
                  </span>
                </h3>
                <p className="mt-3 text-sm text-[#0E0E0E]/80">
                  Build trust and stand out with verified customer reviews on
                  Tellacity a transparent platform where real customers share
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
