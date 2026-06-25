"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  Crown,
  Gift,
  RefreshCw,
  ShieldCheck,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import HomeScrollProgress from "@/components/home/HomeScrollProgress";
import CinematicPricingCards from "@/components/pricing/CinematicPricingCards";
import { FadeUp } from "@/components/ui/MotionWrapper";
import { isPlanDowngrade, isPlanUpgrade } from "@/lib/billingPlanRank";
import {
  formatPlanArticleLimitForDisplay,
  formatPlanArticleLimitTableCell,
  formatPlanInviteLimitForDisplay,
  formatPlanInviteLimitTableCell,
  formatPlanPhotoLimitForDisplay,
  formatPlanPhotoLimitTableCell,
  formatPlanWebsiteWidgetLimitForDisplay,
  formatPlanWebsiteWidgetLimitTableCell,
  PLAN_INVITE_LIMITS,
  nextTierUpgradeCtaLabel,
  type PlanKey,
} from "@/lib/plans";
import type { UpgradeFlowContext } from "@/lib/upgradeFlow";
import {
  PAID_PLAN_USD,
  getAnnualTotalDueUsd,
  isPaidPlanForConfirm,
} from "@/lib/billingPlanConfirm";
import { billingCheckoutPickerPath } from "@/lib/billingCheckoutPaths";
import { startGrowTrial } from "@/lib/startGrowTrialClient";
import { trialDaysRemaining } from "@/lib/trialDaysRemaining";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  priceSub?: string;
  description: string;
  features: string[];
  highlight?: boolean;
};

const CUSTOM_PLAN_REVIEW_VOLUME_OPTIONS = [
  { value: "5,000-10,000", label: "5,000–10,000" },
  { value: "10,001-25,000", label: "10,001–25,000" },
  { value: "25,001-50,000", label: "25,001–50,000" },
  { value: "50,000+", label: "50,000+" },
] as const;

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    description: "Get started with verified reviews at no cost.",
    features: [
      formatPlanInviteLimitForDisplay("free"),
      "Claim your business profile",
      "Verified Business Dashboard access",
      "Receive unlimited consumer reviews",
      formatPlanPhotoLimitForDisplay("free"),
      formatPlanArticleLimitForDisplay("free"),
      formatPlanWebsiteWidgetLimitForDisplay("free"),
      "Basic email review invitations",
    ],
  },
  {
    name: "Grow",
    price: `$${PAID_PLAN_USD.grow.monthly}`,
    priceSub: "/ month",
    description: "Collect reviews consistently and build trust faster.",
    features: [
      formatPlanInviteLimitForDisplay("grow"),
      "Email review invitations",
      "Customisable email templates",
      "QR code reviews",
      formatPlanPhotoLimitForDisplay("grow"),
      formatPlanArticleLimitForDisplay("grow"),
      formatPlanWebsiteWidgetLimitForDisplay("grow"),
      "Performance analytics",
    ],
  },
  {
    name: "Premium",
    price: `$${PAID_PLAN_USD.premium.monthly}`,
    priceSub: "/ month",
    description: "Powerful automation for growing teams.",
    features: [
      formatPlanInviteLimitForDisplay("premium"),
      "Everything in Grow",
      "Automated review invitation flows",
      formatPlanWebsiteWidgetLimitForDisplay("premium"),
      "Advanced analytics & sentiment analysis",
      "Team alerts & notifications",
      "Premium Credibility Badge",
      "Up to 10 team users",
      formatPlanPhotoLimitForDisplay("premium"),
      formatPlanArticleLimitForDisplay("premium"),
    ],
    highlight: true,
  },
  {
    name: "Elite",
    price: `$${PAID_PLAN_USD.elite.monthly}`,
    priceSub: "/ month",
    description: "Advanced reputation management at scale.",
    features: [
      formatPlanInviteLimitForDisplay("elite"),
      "Everything in Premium",
      "Bulk uploads & automation rules",
      "White-label options",
      "Strategic insights & benchmarking",
      "Featured placement",
      "Custom enterprise integrations",
      "Scheduled exports",
      "Dedicated account manager",
      formatPlanPhotoLimitForDisplay("elite"),
      formatPlanArticleLimitForDisplay("elite"),
      formatPlanWebsiteWidgetLimitForDisplay("elite"),
    ],
  },
];

const pricingButtonClass =
  "w-full mt-6 rounded-xl bg-black text-white py-3 font-semibold shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95";

const PRICING_IO = 0.12;

function cinematicPlanCardClass(planName: string, isPremiumPopular: boolean): string {
  if (planName === "Free") return "pricing-card pricing-card--free";
  if (planName === "Grow") return "pricing-card pricing-card--grow";
  if (planName === "Premium" && isPremiumPopular) return "pricing-card pricing-card--premium";
  if (planName === "Premium") return "pricing-card pricing-card--grow";
  return "pricing-card pricing-card--elite";
}

function cinematicPlanNameClass(planName: string): string {
  if (planName === "Grow" || planName === "Premium") return "pricing-card-name pricing-card-name--teal";
  if (planName === "Elite") return "pricing-card-name pricing-card-name--forest";
  return "pricing-card-name";
}

function cinematicPlanAccentClass(planName: string, isPremiumPopular: boolean): string {
  if (planName === "Free") return "pricing-card-accent pricing-card-accent--free";
  if (planName === "Grow") return "pricing-card-accent pricing-card-accent--grow";
  if (planName === "Premium" && isPremiumPopular) {
    return "pricing-card-accent pricing-card-accent--premium";
  }
  if (planName === "Premium") return "pricing-card-accent pricing-card-accent--grow";
  return "pricing-card-accent pricing-card-accent--elite";
}

function cinematicPlanCtaClass(planName: string): string {
  if (planName === "Free") return "pricing-card-cta pricing-card-cta--free";
  if (planName === "Grow") return "pricing-card-cta pricing-card-cta--grow";
  if (planName === "Premium") return "pricing-card-cta pricing-card-cta--premium";
  return "pricing-card-cta pricing-card-cta--elite";
}

function featureCheckClass(planName: string): string {
  if (planName === "Free") return "pricing-card-feature-check pricing-card-feature-check--muted";
  if (planName === "Elite") return "pricing-card-feature-check pricing-card-feature-check--forest";
  return "pricing-card-feature-check pricing-card-feature-check--teal";
}

function isPremiumBoldFeature(feature: string): boolean {
  return (
    feature === "Automated review invitation flows" ||
    feature === "Advanced analytics & sentiment analysis" ||
    feature === "Premium Credibility Badge"
  );
}

const PREMIUM_TABLE_HIGHLIGHTS = new Set([
  "Premium Badge",
  "Team alerts",
  "Expanded",
  "Advanced",
  "Sentiment",
]);

function renderComparisonCell(value: string, colIndex: number) {
  if (value === "✓") {
    return (
      <CheckCircle2
        className="mx-auto h-[18px] w-[18px] fill-[#00B4A6] text-[#00B4A6]"
        aria-label="Included"
      />
    );
  }
  if (value === "–") {
    return <span className="text-gray-400">–</span>;
  }
  if (colIndex === 2 && PREMIUM_TABLE_HIGHLIGHTS.has(value)) {
    return <span className="pricing-table-premium-val">{value}</span>;
  }
  return <span className="text-[13px]">{value}</span>;
}

function getPaidMonthlyUsd(planName: string): number | null {
  if (planName === "Grow") return PAID_PLAN_USD.grow.monthly;
  if (planName === "Premium") return PAID_PLAN_USD.premium.monthly;
  if (planName === "Elite") return PAID_PLAN_USD.elite.monthly;
  return null;
}

/** Feature row: [Feature label, Free, Grow, Premium, Elite] */
type FeatureRow = [string, string, string, string, string];

const comparisonTableRows: Array<{ type: "section"; label: string } | { type: "feature"; row: FeatureRow }> = [
  { type: "section", label: "COLLECT" },
  {
    type: "feature",
    row: [
      "Review invitations / month",
      formatPlanInviteLimitTableCell("free"),
      formatPlanInviteLimitTableCell("grow"),
      formatPlanInviteLimitTableCell("premium"),
      formatPlanInviteLimitTableCell("elite"),
    ],
  },
  {
    type: "feature",
    row: [
      "Photo uploads (total)",
      formatPlanPhotoLimitTableCell("free"),
      formatPlanPhotoLimitTableCell("grow"),
      formatPlanPhotoLimitTableCell("premium"),
      formatPlanPhotoLimitTableCell("elite"),
    ],
  },
  { type: "feature", row: ["Email invites", "✓", "✓", "✓", "✓"] },
  { type: "feature", row: ["Customisable email templates", "–", "✓", "✓", "✓"] },
  { type: "feature", row: ["QR code reviews", "–", "✓", "✓", "✓"] },
  { type: "section", label: "VERIFY" },
  { type: "feature", row: ["Credibility & visibility", "Profile", "Verified Badge", "Premium Badge", "Featured placement"] },
  { type: "section", label: "MANAGE" },
  { type: "feature", row: ["Multi-location management", "–", "–", "–", "✓"] },
  { type: "feature", row: ["Notifications & alerts", "Basic", "Standard", "Team alerts", "Custom enterprise"] },
  { type: "feature", row: ["Team access", "1 User", "3 Users", "10 Users", "Unlimited (SSO)"] },
  { type: "section", label: "SHOWCASE" },
  {
    type: "feature",
    row: [
      "On-site widgets",
      formatPlanWebsiteWidgetLimitTableCell("free"),
      formatPlanWebsiteWidgetLimitTableCell("grow"),
      formatPlanWebsiteWidgetLimitTableCell("premium"),
      formatPlanWebsiteWidgetLimitTableCell("elite"),
    ],
  },
  {
    type: "feature",
    row: [
      "Blogs & case studies / month",
      formatPlanArticleLimitTableCell("free"),
      formatPlanArticleLimitTableCell("grow"),
      formatPlanArticleLimitTableCell("premium"),
      formatPlanArticleLimitTableCell("elite"),
    ],
  },
  { type: "feature", row: ["White-label solution", "–", "–", "–", "✓"] },
  { type: "section", label: "UNDERSTAND" },
  { type: "feature", row: ["Reviews & invite analytics", "Basic", "Standard", "Advanced", "Advanced + exports"] },
  { type: "feature", row: ["Strategic insights", "–", "–", "Sentiment", "Sentiment + Benchmarks"] },
  { type: "feature", row: ["Data exports", "–", "CSV", "CSV + JSON", "Scheduled auto-exports"] },
  { type: "section", label: "INTEGRATE" },
  { type: "feature", row: ["Supports integrations", "–", "✓", "✓", "✓"] },
  { type: "feature", row: ["Custom enterprise integrations", "–", "–", "–", "✓"] },
];

const linkClass =
  "font-medium text-[#124541] underline underline-offset-2 hover:text-[#1FAF9E]";

const CUSTOM_PLAN_GUIDANCE =
  "For organisations with unique volume, integration, or compliance needs beyond standard plan limits.";

const PLAN_INCLUSIONS = [
  {
    title: "Free Plan",
    summary: `Claim your profile, access your dashboard, receive unlimited reviews, ${formatPlanPhotoLimitForDisplay("free").toLowerCase()}, save blog and case study drafts (${formatPlanArticleLimitTableCell("free").toLowerCase()}), and send up to ${PLAN_INVITE_LIMITS.free.toLocaleString("en-US")} review invitations per month.`,
  },
  {
    title: "Grow Plan",
    summary: `Everything required to collect reviews consistently, including ${PLAN_INVITE_LIMITS.grow.toLocaleString("en-US")} monthly invites, ${formatPlanArticleLimitForDisplay("grow").toLowerCase()}, QR codes, widgets, analytics, custom email templates, and ${formatPlanPhotoLimitForDisplay("grow").toLowerCase()}.`,
  },
  {
    title: "Premium Plan",
    summary: `Adds automation, advanced analytics, sentiment insights, team collaboration, expanded widgets, ${formatPlanArticleLimitForDisplay("premium").toLowerCase()}, ${formatPlanPhotoLimitForDisplay("premium").toLowerCase()}, and up to ${PLAN_INVITE_LIMITS.premium.toLocaleString("en-US")} review invitations per month.`,
  },
  {
    title: "Elite Plan",
    summary: `Unlocks enterprise-grade automation, benchmarking, white-label capabilities, custom integrations, dedicated support, ${formatPlanArticleLimitForDisplay("elite").toLowerCase()}, ${formatPlanPhotoLimitForDisplay("elite").toLowerCase()}, and up to ${PLAN_INVITE_LIMITS.elite.toLocaleString("en-US")} review invitations per month.`,
  },
];

const COMPARISON_CATEGORY_EXPLAIN: Record<string, string> = {
  COLLECT:
    "How your business invites customers to leave reviews, via email, QR codes, templates, and monthly invite limits.",
  VERIFY:
    "Trust signals and badges that show customers your profile and feedback meet Tellacity verification standards.",
  MANAGE:
    "Notifications, team access, and multi-location controls for staying on top of reviews across your organisation.",
  SHOWCASE:
    "Widgets, blogs and case studies, branding, and white-label tools for displaying verified social proof and publishing business stories on your profile and marketing channels.",
  UNDERSTAND:
    "Analytics, sentiment insights, and exports that help you track reputation performance and act on trends.",
  INTEGRATE:
    "Direct integrations on paid plans and custom enterprise integrations on Elite for fitting Tellacity into your stack.",
};

const faqs = [
  {
    question: "Can I start on the Free plan and upgrade later?",
    answer:
      "Yes. You can start on the Free plan to claim your profile and collect initial reviews, then upgrade to Grow, Premium, or Elite whenever your review volume or team needs grow. Plan changes are designed to match how your business scales, there is no requirement to pick a paid plan on day one.",
  },
  {
    question: "Do you charge extra fees for integrations?",
    answer:
      "Paid plans support integrations from Tellacity at no additional platform fee. Third-party tools you connect may bill separately according to their own pricing. Custom enterprise integrations on Elite are scoped individually when requirements go beyond standard connectors.",
  },
  {
    question: "Is there a long‑term contract?",
    answer:
      "There is no long-term contract required for standard plans. You can pay monthly and switch to annual billing when you want longer-term optimisation and the 20% annual savings. Terms for custom enterprise agreements are discussed separately when you request a Custom Plan.",
  },
];

export type PricingPageContentProps = {
  /** `dashboard` = logged-in user: paid plans open Paystack (same as Plans & billing), not signup. */
  variant?: "public" | "dashboard";
  dashboardBusinessId?: string;
  dashboardUserEmail?: string;
  /** Current workspace plan (your-plan card + upgrade CTA copy on dashboard). */
  dashboardCurrentPlanKey?: PlanKey;
  /** Owner-only: free workspace eligible for a one-time Grow trial. */
  dashboardTrialEligible?: boolean;
  /** Dashboard: subscription status from billing/plans context. */
  dashboardSubscriptionStatus?: string | null;
  /** Dashboard: trial end when status is trialing. */
  dashboardTrialEndsAt?: string | null;
  /** Called after a successful start-trial (refresh dashboard plan context). */
  onTrialStarted?: () => void;
  /** Stronger Premium card emphasis (e.g. billing deep-link with upgrade reason). */
  emphasizePremiumAnchor?: boolean;
  /** Dashboard: smart card highlight from upgrade flow (photos vs sections). */
  dashboardPricingHighlightContext?: Extract<UpgradeFlowContext, "upload_limit" | "section_locked"> | null;
  /** Use a div root when embedding inside the dashboard (avoids nested main landmark). */
  embedInDashboard?: boolean;
  /** When opening checkout from billing, match monthly vs annual from URL. */
  dashboardInitialBillingMode?: "monthly" | "annual";
  /** Billing dashboard only: hide the marketing hero (headline + animated plans preview). */
  dashboardHideMarketingHero?: boolean;
};

function recommendedPlanNameForDashboard(plan: PlanKey | undefined): string | null {
  if (!plan) return null;
  if (plan === "free") return "Grow";
  if (plan === "grow") return "Premium";
  if (plan === "premium") return "Elite";
  return null;
}

function planNameToKey(name: string): PlanKey | null {
  const k = name.toLowerCase();
  if (k === "free" || k === "grow" || k === "premium" || k === "elite") {
    return k;
  }
  return null;
}

function BillingPeriodToggle({
  billing,
  onChange,
  className,
  theme = "default",
}: {
  billing: "monthly" | "annual";
  onChange: (mode: "monthly" | "annual") => void;
  className?: string;
  theme?: "default" | "hero" | "light";
}) {
  if (theme === "hero" || theme === "light") {
    const wrapClass =
      theme === "hero" ? "pricing-toggle pricing-toggle--hero" : "pricing-toggle pricing-toggle--light";
    return (
      <div className={cn("flex justify-center px-2", className)}>
        <div className={wrapClass} role="group" aria-label="Billing period">
          <span
            className={cn("pricing-toggle-pill", billing === "annual" && "is-annual")}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => onChange("monthly")}
            className={cn("pricing-toggle-btn", billing === "monthly" && "is-active")}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => onChange("annual")}
            className={cn("pricing-toggle-btn", billing === "annual" && "is-active")}
          >
            Annual<span className="pricing-toggle-save"> (Save 20%)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex justify-center px-2", className)}>
      <div
        className="inline-flex h-11 w-full max-w-[min(100%,22rem)] items-stretch rounded-full bg-[#E9E1D6] p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-stone-300/40"
        role="group"
        aria-label="Billing period"
      >
        <button
          type="button"
          onClick={() => onChange("monthly")}
          className={`relative z-10 flex flex-1 items-center justify-center rounded-full text-xs font-semibold transition-all duration-200 ${
            billing === "monthly"
              ? "bg-white text-neutral-900 shadow-sm ring-1 ring-stone-200/90"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange("annual")}
          className={`relative z-10 flex flex-1 items-center justify-center gap-1.5 rounded-full px-1.5 text-xs font-semibold transition-all duration-200 ${
            billing === "annual"
              ? "bg-white text-neutral-900 shadow-sm ring-1 ring-stone-200/90"
              : "text-neutral-600 hover:text-neutral-900"
          }`}
        >
          <span>Annual</span>
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
              billing === "annual"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-500/20 text-emerald-900"
            }`}
          >
            Save 20%
          </span>
        </button>
      </div>
    </div>
  );
}

export function PricingPageContent({
  variant = "public",
  dashboardBusinessId,
  dashboardUserEmail,
  dashboardCurrentPlanKey,
  dashboardTrialEligible = false,
  dashboardSubscriptionStatus = null,
  dashboardTrialEndsAt = null,
  onTrialStarted,
  emphasizePremiumAnchor = false,
  dashboardPricingHighlightContext = null,
  embedInDashboard = false,
  dashboardInitialBillingMode,
  dashboardHideMarketingHero = false,
}: PricingPageContentProps = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [billing, setBilling] = useState<"monthly" | "annual">(
    () => dashboardInitialBillingMode ?? "monthly"
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isCustomPlanOpen, setIsCustomPlanOpen] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [customPlanLoading, setCustomPlanLoading] = useState(false);
  const [customPlanError, setCustomPlanError] = useState<string | null>(null);
  const [customPlanForm, setCustomPlanForm] = useState({
    fullName: "",
    companyName: "",
    email: "",
    volume: "",
    message: "",
  });
  const [growTrialStarting, setGrowTrialStarting] = useState(false);
  const [growTrialError, setGrowTrialError] = useState<string | null>(null);
  const isDashboardCheckout =
    variant === "dashboard" &&
    Boolean(dashboardBusinessId?.trim()) &&
    Boolean(dashboardUserEmail?.trim());
  const dashboardTrialDaysLeft = trialDaysRemaining(dashboardTrialEndsAt);
  const dashboardCheckoutReturnTo =
    pathname?.startsWith("/business/dashboard/") === true
      ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
      : "/business/dashboard/billing";

  const handleDashboardUpgrade = useCallback(
    (targetKey: PlanKey) => {
      const current = dashboardCurrentPlanKey ?? "free";
      if (targetKey === current) return;
      if (!isPlanUpgrade(targetKey, current)) return;
      if (!isPaidPlanForConfirm(targetKey)) return;
      const returnTo =
        pathname?.startsWith("/business/dashboard/") === true
          ? `${pathname}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`
          : null;
      router.push(billingCheckoutPickerPath(targetKey, billing, returnTo));
    },
    [billing, dashboardCurrentPlanKey, pathname, router, searchParams]
  );

  const handleStartGrowTrial = useCallback(async () => {
    const id = dashboardBusinessId?.trim();
    if (!id || growTrialStarting) return;
    setGrowTrialStarting(true);
    setGrowTrialError(null);
    const result = await startGrowTrial(id);
    if (result.ok) {
      onTrialStarted?.();
    } else {
      setGrowTrialError(result.message);
    }
    setGrowTrialStarting(false);
  }, [dashboardBusinessId, growTrialStarting, onTrialStarted]);

  const handlePublicPlanSignup = useCallback(
    (key: "free" | "grow" | "premium" | "elite") => {
      if (key === "grow") {
        router.push("/business/signup?plan=grow&trial=grow");
        return;
      }
      router.push(`/business/signup?plan=${encodeURIComponent(key)}`);
    },
    [router]
  );

  const isDashboardCurrentFree =
    variant === "dashboard" && dashboardCurrentPlanKey === "free";

  const recommendedPlanName =
    variant === "dashboard" && dashboardCurrentPlanKey
      ? recommendedPlanNameForDashboard(dashboardCurrentPlanKey)
      : null;

  const smartHighlightPlanKey: PlanKey | null =
    variant === "dashboard" && dashboardPricingHighlightContext === "upload_limit"
      ? "grow"
      : variant === "dashboard" && dashboardPricingHighlightContext === "section_locked"
        ? "premium"
        : null;

  const sparkles = Array.from({ length: 20 }).map((_, index) => ({
    id: index,
    top: (index * 17) % 100,
    left: (index * 31) % 100,
  }));

  const Root = embedInDashboard ? "div" : "main";
  const rootSurfaceClass =
    embedInDashboard && dashboardHideMarketingHero
      ? "bg-transparent"
      : "bg-[#F7F8FA]";

  const freeComparisonColClass = isDashboardCurrentFree
    ? "bg-gray-50 text-gray-500"
    : "";

  const showPublicSeo = variant === "public" && !embedInDashboard;
  const isCinematic = showPublicSeo;

  return (
    <Root className={isCinematic ? "pricing-cinematic" : rootSurfaceClass}>
      {isCinematic ? <HomeScrollProgress /> : null}
      {/* Page header (public /pricing only; dashboard billing uses cards + toggle below) */}
      {!dashboardHideMarketingHero ? (
        isCinematic ? (
          <section className="pricing-hero" aria-labelledby="pricing-hero-title">
            <div className="pricing-hero-inner">
              <span className="pricing-hero-badge">SIMPLE · TRANSPARENT · NO HIDDEN FEES</span>
              <h1 id="pricing-hero-title">
                <span className="pricing-hero-h1-line">Simple, Transparent</span>
                <span className="pricing-hero-h1-accent">Pricing</span>
              </h1>
              <p className="pricing-hero-sub">
                Start free and upgrade when you need more invites, blogs &amp; case studies, and
                tools. Compare plans below. Switch anytime as your review volume grows.
              </p>
              <div className="pricing-hero-toggle-wrap">
                <BillingPeriodToggle
                  billing={billing}
                  onChange={setBilling}
                  theme="hero"
                  className="w-full"
                />
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={billing}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18 }}
                  className="pricing-hero-note"
                >
                  {billing === "monthly"
                    ? "Prices shown are monthly. Switch to annual for savings."
                    : "Annual billing is charged once per year (~20% less than paying monthly)."}
                </motion.p>
              </AnimatePresence>
              <Link href="/for-business" className="pricing-hero-link">
                See Tellacity for business →
              </Link>
            </div>
          </section>
        ) : (
        <section className="mx-auto w-full max-w-6xl px-6 pt-10 pb-2 md:pt-12 md:pb-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mx-auto flex max-w-2xl flex-col items-center gap-4 text-center"
          >
            <h1 className="text-3xl font-semibold text-[#0E0E0E] md:text-4xl">
              Pricing
            </h1>
            <div className="space-y-2 text-sm text-gray-600 md:text-base">
              <p>
                Simple, transparent pricing. Start free and upgrade when you need
                more invites, blogs &amp; case studies, and tools.{" "}
                <Link href="/for-business" className={linkClass}>
                  See Tellacity for business
                </Link>
                .
              </p>
              {showPublicSeo ? (
                <p className="text-gray-500">
                  Compare plans below. Switch anytime as your review volume grows.
                </p>
              ) : null}
            </div>
            <BillingPeriodToggle
              billing={billing}
              onChange={setBilling}
              className="w-full pt-1"
            />
            <AnimatePresence mode="wait">
              <motion.p
                key={billing}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="min-h-[2.5rem] text-xs text-gray-500 md:text-sm"
              >
                {billing === "monthly"
                  ? "Prices shown are monthly. Switch to annual when you’re ready for longer-term savings."
                  : "Annual billing is charged once per year (~20% less than paying monthly)."}
              </motion.p>
            </AnimatePresence>
          </motion.div>
        </section>
        )
      ) : null}

      {/* PRICING CARDS */}
      <section
        className={
          isCinematic
            ? "pricing-cards-section"
            : `mx-auto w-full max-w-6xl px-6 pb-8 ${
                dashboardHideMarketingHero ? "pt-4 md:pt-6" : "pt-2 md:pt-4"
              }`
        }
      >
        {isCinematic ? (
          <CinematicPricingCards
            billing={billing}
            onBillingChange={setBilling}
            plans={plans}
            onChoosePlan={handlePublicPlanSignup}
            onCustomPlan={() => {
              setCustomPlanError(null);
              setIsCustomPlanOpen(true);
            }}
          />
        ) : (
        <>
        {dashboardHideMarketingHero ? (
          <BillingPeriodToggle
            billing={billing}
            onChange={setBilling}
            className="mb-6"
          />
        ) : null}

        <div className="grid items-stretch gap-6 lg:grid-cols-4">
          {plans.map((plan, index) => {
            const cardPlanKey = planNameToKey(plan.name);
            const isWorkspaceOnThisPlan =
              variant === "dashboard" &&
              isDashboardCheckout &&
              Boolean(dashboardCurrentPlanKey && cardPlanKey) &&
              cardPlanKey === dashboardCurrentPlanKey;
            const isRecommendedForYou =
              Boolean(recommendedPlanName) && plan.name === recommendedPlanName;
            const premiumAnchorBoost =
              emphasizePremiumAnchor && plan.name === "Premium" && plan.highlight;

            const isSmartRecommended =
              Boolean(smartHighlightPlanKey && cardPlanKey) &&
              smartHighlightPlanKey === cardPlanKey &&
              !isWorkspaceOnThisPlan;
            const isLegacyPopular =
              !smartHighlightPlanKey && Boolean(plan.highlight) && !isWorkspaceOnThisPlan;
            const showHighlightGlow =
              !isCinematic && (isSmartRecommended || isLegacyPopular);
            const isVisualPremiumAnchor =
              isLegacyPopular && Boolean(premiumAnchorBoost) && plan.name === "Premium";
            const isPremiumPopular = isLegacyPopular && plan.name === "Premium";

            /**
             * Dashboard embed renders the pricing cards inside a narrow
             * billing column. The public page uses `scale-*` and thicker
             * borders to visually pop the recommended card, but those
             * transforms break grid alignment in the embed. Neighbours
             * look shorter/narrower even though the grid cells are equal.
             * When embedded we keep highlights via border/glow only and
             * normalise border widths so every card occupies its grid
             * cell identically.
             */
            const cardBaseLayoutClass = isCinematic
              ? "relative flex h-full flex-col"
              : "relative flex h-full flex-col rounded-3xl p-6 transition-all duration-300";

            const cardVariantClass = isCinematic
              ? cinematicPlanCardClass(plan.name, isPremiumPopular)
              : embedInDashboard
              ? isWorkspaceOnThisPlan
                ? "border border-neutral-950 bg-neutral-50/95 text-neutral-800 shadow-sm"
                : isSmartRecommended
                  ? "border-2 border-[#1FAF9E] bg-white shadow-xl shadow-[#1FAF9E]/20 ring-2 ring-[#1FAF9E]/25"
                  : isLegacyPopular
                    ? isVisualPremiumAnchor
                      ? "border-2 border-[#0E3B36] bg-white shadow-2xl shadow-[#0E3B36]/15 ring-2 ring-[#1FAF9E]/30"
                      : "border-2 border-[#1FAF9E] bg-white shadow-xl"
                    : "border border-neutral-950 bg-white shadow-sm hover:shadow-md"
              : isWorkspaceOnThisPlan
                ? "border border-neutral-950 bg-neutral-50/95 text-neutral-800 shadow-sm hover:translate-y-0"
                : isSmartRecommended
                  ? "border-2 border-[#1FAF9E] bg-white shadow-xl shadow-[#1FAF9E]/20 ring-2 ring-[#1FAF9E]/25"
                  : isLegacyPopular
                    ? isVisualPremiumAnchor
                      ? "border-2 border-[#0E3B36] bg-white shadow-2xl shadow-[#0E3B36]/15 ring-2 ring-[#1FAF9E]/30"
                      : "border-2 border-[#1FAF9E] bg-white shadow-xl"
                    : "border border-neutral-950 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1";

            return (
            <motion.div
              key={plan.name}
              id={`plan-card-${plan.name.toLowerCase()}`}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className={cn(
                "relative h-full",
                isSmartRecommended && !embedInDashboard && "z-[1]"
              )}
            >
              {showHighlightGlow ? (
                <motion.div
                  className="absolute -inset-1 rounded-3xl bg-[#1FAF9E]/10 blur-xl"
                  animate={{ opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2.5, repeat: Infinity }}
                />
              ) : null}
              <div className={cn(cardBaseLayoutClass, cardVariantClass)}>
                {isWorkspaceOnThisPlan ? (
                  <div className="mb-3 rounded-lg border border-neutral-200/80 bg-neutral-100/80 px-3 py-2 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-600">
                      Your plan
                    </p>
                    <p className="mt-1 text-xs font-medium text-neutral-800">
                      {plan.name === "Free"
                        ? "You are on the Free plan."
                        : `This workspace is on ${plan.name}.`}
                    </p>
                  </div>
                ) : null}
                {isSmartRecommended ? (
                  <div className="absolute inset-x-0 -top-4 flex flex-col items-center gap-1.5">
                    <span className="rounded-full bg-gradient-to-r from-[#1FAF9E] to-[#0E3B36] px-4 py-1 text-[10px] font-semibold text-white shadow-sm">
                      Recommended
                    </span>
                  </div>
                ) : isLegacyPopular ? (
                  <div className="absolute inset-x-0 -top-4 flex flex-col items-center gap-1.5">
                    <span
                      className={
                        isCinematic
                          ? "pricing-card-badge"
                          : "rounded-full bg-gradient-to-r from-[#1FAF9E] to-[#0E3B36] px-4 py-1 text-[10px] font-semibold text-white shadow-sm"
                      }
                    >
                      Most Popular
                    </span>
                  </div>
                ) : null}
                {isCinematic ? (
                  <div
                    className={cinematicPlanAccentClass(plan.name, isPremiumPopular)}
                    aria-hidden
                  />
                ) : null}
                <div className={isCinematic ? "pricing-card-body" : "flex flex-1 flex-col"}>
                <h3
                  className={
                    isCinematic
                      ? cinematicPlanNameClass(plan.name)
                      : `text-sm font-semibold ${
                          isWorkspaceOnThisPlan ? "mt-2 text-neutral-800" : "mt-2 text-[#0E0E0E]"
                        }`
                  }
                >
                  {plan.name}
                </h3>
                <p
                  className={
                    isCinematic
                      ? "pricing-card-tagline"
                      : `mt-2 text-xs leading-relaxed ${
                          isWorkspaceOnThisPlan ? "text-neutral-600" : "text-gray-600"
                        }`
                  }
                >
                  {plan.description}
                </p>
                <div className={isCinematic ? "pricing-card-price-wrap" : "mt-5"}>
                  {plan.name === "Free" ? (
                    isCinematic ? (
                      <div className="pricing-card-price-row pricing-price-fade">
                        <span className="pricing-card-price-value">{plan.price}</span>
                        <span className="pricing-card-price-forever">forever</span>
                      </div>
                    ) : (
                    <div className="flex items-end gap-1">
                      <span
                        className={`text-3xl font-semibold ${
                          isWorkspaceOnThisPlan ? "text-neutral-600" : "text-[#0E0E0E]"
                        }`}
                      >
                        {plan.price}
                      </span>
                    </div>
                    )
                  ) : (
                    <>
                      <motion.div
                        key={billing}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 4 }}
                        transition={{ duration: 0.18 }}
                        className={
                          isCinematic ? "pricing-card-price-row pricing-price-fade" : "flex items-end gap-1"
                        }
                      >
                        {isCinematic && billing === "annual" ? (
                          <span className="pricing-card-save-badge">Save 20%</span>
                        ) : null}
                        {isCinematic && billing === "annual" && getPaidMonthlyUsd(plan.name) ? (
                          <span className="pricing-card-price-strike">
                            ${getPaidMonthlyUsd(plan.name)}
                          </span>
                        ) : null}
                        <span
                          className={
                            isCinematic
                              ? cn(
                                  "pricing-card-price-value",
                                  (plan.name === "Premium" || plan.name === "Elite") &&
                                    "pricing-card-price-value--forest"
                                )
                              : "text-3xl font-semibold text-[#0E0E0E]"
                          }
                        >
                          $
                          {plan.name === "Grow"
                            ? billing === "monthly"
                              ? PAID_PLAN_USD.grow.monthly
                              : PAID_PLAN_USD.grow.annualPerMonth
                            : plan.name === "Premium"
                              ? billing === "monthly"
                                ? PAID_PLAN_USD.premium.monthly
                                : PAID_PLAN_USD.premium.annualPerMonth
                              : billing === "monthly"
                                ? PAID_PLAN_USD.elite.monthly
                                : PAID_PLAN_USD.elite.annualPerMonth}
                        </span>
                        <span
                          className={
                            isCinematic
                              ? "pricing-card-price-suffix"
                              : "pb-1 text-sm font-normal text-gray-500"
                          }
                        >
                          /mo
                        </span>
                      </motion.div>
                      {billing === "annual" ? (
                        <>
                          <p
                            className={
                              isCinematic
                                ? "pricing-card-price-annual"
                                : "mt-1 text-xs text-gray-500"
                            }
                          >
                            {isCinematic && cardPlanKey && isPaidPlanForConfirm(cardPlanKey)
                              ? `(billed $${getAnnualTotalDueUsd(cardPlanKey).toLocaleString("en-US")}/yr)`
                              : "Billed annually"}
                          </p>
                          {cardPlanKey && isPaidPlanForConfirm(cardPlanKey) ? (
                            <p className={isCinematic ? "pricing-sr-detail" : "mt-2 text-xs font-semibold text-[#0E0E0E]"}>
                              Pay $
                              {getAnnualTotalDueUsd(cardPlanKey).toLocaleString("en-US")}{" "}
                              today (12 months at ${PAID_PLAN_USD[cardPlanKey].annualPerMonth}
                              /mo)
                            </p>
                          ) : null}
                        </>
                      ) : null}
                    </>
                  )}
                </div>
                <ul
                  className={
                    isCinematic
                      ? "pricing-card-features"
                      : `mt-5 flex-1 space-y-3 text-xs ${
                          isWorkspaceOnThisPlan ? "text-neutral-600" : "text-gray-600"
                        }`
                  }
                >
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={isCinematic ? "pricing-card-feature" : "flex items-start gap-2"}
                    >
                      {isCinematic ? (
                        <Check className={cn(featureCheckClass(plan.name), "h-4 w-4")} aria-hidden />
                      ) : (
                        <span
                          className={`mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-[10px] font-semibold ${
                            isWorkspaceOnThisPlan
                              ? "border-neutral-300 text-neutral-500"
                              : "border-[#1FAF9E] text-[#1FAF9E]"
                          }`}
                        >
                          ✓
                        </span>
                      )}
                      <span
                        className={
                          isCinematic && isPremiumBoldFeature(feature)
                            ? "pricing-card-feature--key"
                            : undefined
                        }
                      >
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
                {variant === "dashboard" && !isDashboardCheckout ? (
                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Select a business in the sidebar and ensure your account has an email address to use secure checkout."
                      )
                    }
                    className={pricingButtonClass}
                  >
                    Choose This Plan
                  </button>
                ) : isDashboardCheckout &&
                  plan.name === "Grow" &&
                  dashboardCurrentPlanKey === "free" &&
                  dashboardTrialEligible ? (
                  <div className="mt-6 space-y-2">
                    <button
                      type="button"
                      onClick={() => void handleStartGrowTrial()}
                      disabled={growTrialStarting}
                      className={cn(
                        pricingButtonClass,
                        "disabled:cursor-not-allowed disabled:opacity-60",
                      )}
                    >
                      {growTrialStarting ? "Starting…" : "Start free trial"}
                    </button>
                    <p className="text-center text-xs text-gray-500">
                      Cancel anytime
                    </p>
                    {growTrialError ? (
                      <p className="rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-center text-xs text-amber-900">
                        {growTrialError}
                      </p>
                    ) : null}
                  </div>
                ) : isDashboardCheckout &&
                  plan.name === "Grow" &&
                  dashboardSubscriptionStatus === "trialing" &&
                  dashboardTrialDaysLeft != null ? (
                  <Link
                    href={billingCheckoutPickerPath(
                      "grow",
                      billing,
                      dashboardCheckoutReturnTo,
                    )}
                    className={cn(
                      pricingButtonClass,
                      "inline-flex items-center justify-center",
                      dashboardTrialDaysLeft <= 3
                        ? "bg-amber-700 text-white hover:bg-amber-800"
                        : "",
                    )}
                  >
                    Keep Grow
                  </Link>
                ) : isDashboardCheckout && isWorkspaceOnThisPlan ? (
                  <button
                    type="button"
                    disabled
                    aria-current="true"
                    className="mt-6 w-full cursor-default rounded-xl border-2 border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-600"
                  >
                    Current plan
                  </button>
                ) : isDashboardCheckout && plan.name === "Free" ? (
                  dashboardCurrentPlanKey &&
                  isPlanDowngrade("free", dashboardCurrentPlanKey) ? (
                    <button
                      type="button"
                      disabled
                      className="mt-6 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 py-3 text-sm font-semibold text-gray-500"
                    >
                      Downgrade in Billing → Change plan
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        alert(
                          "You’re already signed in. The Free plan doesn’t require payment. Use Plans & billing to manage your subscription."
                        )
                      }
                      className={pricingButtonClass}
                    >
                      Choose This Plan
                    </button>
                  )
                ) : isDashboardCheckout ? (
                  (() => {
                    const targetKey = planNameToKey(plan.name);
                    if (!targetKey) return null;
                    const current = dashboardCurrentPlanKey ?? "free";
                    const down = isPlanDowngrade(targetKey, current);
                    const up = isPlanUpgrade(targetKey, current);
                    if (down) {
                      return (
                        <button
                          type="button"
                          disabled
                          className="mt-6 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 py-3 text-sm font-semibold text-gray-500"
                        >
                          Downgrade in Billing → Change plan
                        </button>
                      );
                    }
                    return (
                      <button
                        type="button"
                        onClick={() => handleDashboardUpgrade(targetKey)}
                        className={pricingButtonClass}
                      >
                        {up && isRecommendedForYou && dashboardCurrentPlanKey
                          ? nextTierUpgradeCtaLabel(dashboardCurrentPlanKey)
                          : up
                            ? `Upgrade to ${plan.name}`
                            : "Choose This Plan"}
                      </button>
                    );
                  })()
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      handlePublicPlanSignup(
                        plan.name.toLowerCase() as "free" | "grow" | "premium" | "elite"
                      )
                    }
                    className={isCinematic ? cinematicPlanCtaClass(plan.name) : pricingButtonClass}
                  >
                    Choose This Plan
                  </button>
                )}
                {isSmartRecommended ? (
                  <p className="mt-2 text-xs text-gray-500 text-center opacity-80">
                    Most businesses choose this plan to showcase more
                  </p>
                ) : plan.name === "Premium" && !isWorkspaceOnThisPlan && isLegacyPopular ? (
                  <p
                    className={
                      isCinematic
                        ? "pricing-card-note pricing-card-note--teal"
                        : "mt-2 text-xs text-gray-500 text-center opacity-70"
                    }
                  >
                    Most businesses choose this plan.
                  </p>
                ) : null}
                </div>
              </div>
            </motion.div>
            );
          })}
        </div>

        {showPublicSeo ? (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-6 text-xs text-gray-600 shadow-sm">
            <h3 className="text-base font-semibold text-[#0E0E0E]">
              Custom Plan
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {CUSTOM_PLAN_GUIDANCE}
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setCustomPlanError(null);
                  setIsCustomPlanOpen(true);
                }}
                className="rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-neutral-800"
              >
                Custom Plan
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-6 text-xs text-gray-600 shadow-sm">
            <p className="mb-1 text-center font-semibold text-[#0E0E0E]">
              Need custom pricing?
            </p>
            <p className="mt-1 text-center text-xs text-gray-600">
              For larger teams or unique enterprise needs, request a Custom Plan.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setCustomPlanError(null);
                  setIsCustomPlanOpen(true);
                }}
                className="rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-neutral-800"
              >
                Custom Plan
              </button>
            </div>
          </div>
        )}

        </>
        )}

      </section>

      {showPublicSeo ? (
        isCinematic ? (
          <FadeUp threshold={PRICING_IO}>
            <div className="pricing-section-inner">
              <h2 className="pricing-section-title">
                <span className="pricing-section-accent">What&apos;s Included </span>
                <span className="pricing-section-dark">in Each Plan</span>
              </h2>
              <p className="pricing-included-intro">
                Below is a plain-language summary of the most important inclusions across
                plans, review invites, blogs &amp; case studies, verified business tools, widgets,
                analytics, team access, integrations, and photo uploads. Use this section alongside
                the plan cards above and the detailed comparison table to see exactly where each tier
                adds capacity or capability.{" "}
                <Link href="/business/signup" className="pricing-inline-link pricing-inline-link--forest">
                  Create a free account
                </Link>{" "}
                to explore the dashboard before upgrading.
              </p>
              <div className="pricing-included-grid">
                {PLAN_INCLUSIONS.map((item, index) => {
                  const planKey = item.title.replace(" Plan", "");
                  const cardClass =
                    planKey === "Free"
                      ? "pricing-included-card"
                      : planKey === "Elite"
                        ? "pricing-included-card pricing-included-card--elite"
                        : "pricing-included-card pricing-included-card--grow";
                  const iconClass =
                    planKey === "Free"
                      ? "pricing-included-icon pricing-included-icon--grey"
                      : planKey === "Elite"
                        ? "pricing-included-icon pricing-included-icon--forest"
                        : "pricing-included-icon pricing-included-icon--teal";
                  const Icon =
                    planKey === "Free"
                      ? Gift
                      : planKey === "Grow"
                        ? TrendingUp
                        : planKey === "Premium"
                          ? Zap
                          : Crown;
                  const footerClass =
                    planKey === "Free"
                      ? "text-gray-500"
                      : planKey === "Elite"
                        ? "text-[#124541]"
                        : "text-[#00B4A6]";
                  const footerLabel =
                    planKey === "Free"
                      ? "Start Free →"
                      : planKey === "Grow"
                        ? "Start 14-day free trial →"
                        : planKey === "Premium"
                          ? "Choose Premium →"
                          : "Choose Elite →";
                  return (
                    <div key={item.title} className={cardClass}>
                      <span className={iconClass}>
                        <Icon className="h-4 w-4" aria-hidden />
                      </span>
                      <h3
                        className={`text-base font-bold ${
                          planKey === "Grow" || planKey === "Premium"
                            ? "text-[#00B4A6]"
                            : planKey === "Elite"
                              ? "text-[#124541]"
                              : "text-[#111827]"
                        }`}
                      >
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">{item.summary}</p>
                      {planKey === "Premium" ? (
                        <p className="mt-2 text-xs font-semibold text-[#00B4A6]">
                          Most businesses choose this
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={() =>
                          handlePublicPlanSignup(
                            planKey.toLowerCase() as "free" | "grow" | "premium" | "elite"
                          )
                        }
                        className={`pricing-included-footer ${footerClass}`}
                      >
                        {footerLabel}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </FadeUp>
        ) : (
        <section className="mx-auto w-full max-w-6xl px-6 pb-12">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            What&apos;s Included in Each Plan
          </h2>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Below is a plain-language summary of the most important inclusions
            across plans, review invites, blogs &amp; case studies, verified business tools,
            widgets, analytics, team access, integrations, and photo uploads.
          </p>
          <p className="mt-3 max-w-3xl text-sm text-gray-600">
            Use this section alongside the plan cards above and the detailed
            comparison table to see exactly where each tier adds capacity or
            capability.{" "}
            <Link href="/business/signup" className={linkClass}>
              Create a free account
            </Link>{" "}
            to explore the dashboard before upgrading.
          </p>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {PLAN_INCLUSIONS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">{item.summary}</p>
              </div>
            ))}
          </div>
        </section>
        )
      ) : null}

      {/* FEATURE COMPARISON */}
      {isCinematic ? (
        <FadeUp threshold={PRICING_IO} className="pricing-compare">
          <div className="pricing-section-inner">
            <div className="pricing-compare-header">
              <h2 className="pricing-section-title pricing-compare-title">
                <span className="pricing-section-dark">Detailed Feature </span>
                <span className="pricing-section-accent">Comparison</span>
              </h2>
              <p className="pricing-compare-sub">Compare all features and limits across plans</p>
            </div>
            <p className="pricing-sr-detail">
              Use the comparison below to see how review invites, blogs &amp; case studies,
              analytics, team access, and integrations differ by plan.
            </p>
            <div className="pricing-table-wrap">
              <div className="pricing-table-scroll">
                <table className="pricing-table">
                  <thead>
                    <tr>
                      <th className="pricing-table-sticky-corner">Feature</th>
                      <th>Free</th>
                      <th>Grow</th>
                      <th className="pricing-col-premium">Premium ★</th>
                      <th>Elite</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      let featureRowIndex = 0;
                      return comparisonTableRows.map((item) =>
                        item.type === "section" ? (
                          <tr key={item.label} className="pricing-table-section">
                            <td colSpan={5}>
                              <div className="pricing-table-section-label">{item.label}</div>
                              <div className="pricing-table-section-desc">
                                {COMPARISON_CATEGORY_EXPLAIN[item.label]}
                              </div>
                            </td>
                          </tr>
                        ) : (
                          (() => {
                            featureRowIndex += 1;
                            return (
                              <tr
                                key={item.row[0]}
                                className={cn(
                                  "pricing-feature-row",
                                  featureRowIndex % 2 === 0 && "pricing-feature-row--alt"
                                )}
                              >
                                <td className="pricing-table-sticky-feature">{item.row[0]}</td>
                                <td>{renderComparisonCell(item.row[1], 0)}</td>
                                <td>{renderComparisonCell(item.row[2], 1)}</td>
                                <td className="pricing-col-premium">
                                  {renderComparisonCell(item.row[3], 2)}
                                </td>
                                <td>{renderComparisonCell(item.row[4], 3)}</td>
                              </tr>
                            );
                          })()
                        )
                      );
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="pricing-table-footer">
                <p className="pricing-table-footnote">
                  The table is here to help you choose, not hide limits.
                </p>
                <div className="pricing-table-links">
                  <Link href="/help-center" className="pricing-inline-link">
                    Visit Help Center →
                  </Link>
                  <span className="pricing-table-links-sep" aria-hidden>
                    ·
                  </span>
                  <Link href="/faq" className="pricing-inline-link">
                    FAQ →
                  </Link>
                </div>
              </div>
            </div>
            <p className="pricing-sr-detail">
              If you need help interpreting a row, visit the Help Center or FAQ. The table is
              here to help you choose the right plan, not to hide limits in fine print.
            </p>
          </div>
        </FadeUp>
      ) : (
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Detailed Feature Comparison
          </h2>
          <p className="mt-2 text-xs text-gray-600">
            Compare all features and limits across plans
          </p>
          {showPublicSeo ? (
            <>
              <p className="mx-auto mt-4 max-w-3xl text-sm text-gray-600">
                Use the comparison below to see how review invites, blogs &amp; case studies,
                analytics, team access, and integrations differ by plan. Each category
                groups related capabilities so you can match limits to how your
                team collects, verifies, manages, showcases, and understands
                customer feedback.
              </p>
              <p className="mx-auto mt-3 max-w-3xl text-sm text-gray-600">
                The table is here to help you choose the right plan, not to hide
                limits in fine print. If you need help interpreting a row, visit
                the{" "}
                <Link href="/help-center" className={linkClass}>
                  Help Center
                </Link>{" "}
                or{" "}
                <Link href="/faq" className={linkClass}>
                  FAQ
                </Link>
                .
              </p>
            </>
          ) : null}
        </div>
        <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-[11px] font-semibold text-[#0E0E0E]">
                <tr>
                  <th className="px-4 py-3">Feature</th>
                  <th className={`px-4 py-3 ${freeComparisonColClass}`}>Free</th>
                  <th className="px-4 py-3">Grow</th>
                  <th className="px-4 py-3">Premium</th>
                  <th className="px-4 py-3">Elite</th>
                </tr>
              </thead>
              <tbody>
                {comparisonTableRows.map((item) =>
                  item.type === "section" ? (
                    <tr
                      key={item.label}
                      className="border-t border-gray-200 bg-gray-50"
                    >
                      <td colSpan={5} className="px-4 py-3">
                        {showPublicSeo ? (
                          <>
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#0E0E0E]">
                              {item.label.charAt(0) +
                                item.label.slice(1).toLowerCase()}
                            </h3>
                            <p className="mt-1 text-xs text-gray-600">
                              {COMPARISON_CATEGORY_EXPLAIN[item.label]}
                            </p>
                          </>
                        ) : (
                          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-600">
                            {item.label}
                          </span>
                        )}
                      </td>
                    </tr>
                  ) : (
                    <motion.tr
                      key={item.row[0]}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-gray-100 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-[#0E0E0E] md:sticky md:left-0 bg-white">
                        {item.row[0]}
                      </td>
                      <td className={`px-4 py-3 ${freeComparisonColClass}`}>{item.row[1]}</td>
                      <td className="px-4 py-3">{item.row[2]}</td>
                      <td className="px-4 py-3">{item.row[3]}</td>
                      <td className="px-4 py-3">{item.row[4]}</td>
                    </motion.tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
      )}

      {/* FAQ ACCORDION */}
      {isCinematic ? (
        <FadeUp threshold={PRICING_IO}>
          <div className="pricing-section-inner">
            <h2 className="pricing-section-title" style={{ textAlign: "center" }}>
              <span className="pricing-section-dark">Frequently Asked </span>
              <span className="pricing-section-accent">Questions</span>
            </h2>
            <p className="pricing-section-sub">
              Direct answers to common pricing questions. For broader platform topics, see
              the FAQ or Help Center.
            </p>
            <p className="pricing-sr-detail">
              Billing terms for standard plans are outlined in our{" "}
              <Link href="/terms-of-service">Terms of Service</Link>.
            </p>
            <div className="pricing-faq-list">
              {faqs.map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={item.question}
                    className={`pricing-faq-item${isOpen ? " is-open" : ""}`}
                  >
                    <button
                      type="button"
                      className="pricing-faq-trigger"
                      aria-expanded={isOpen}
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    >
                      {item.question}
                      <ChevronDown className="pricing-faq-chevron h-5 w-5" aria-hidden />
                    </button>
                    <div className="pricing-faq-panel">
                      <div className="pricing-faq-panel-inner">
                        <p className="pricing-faq-answer">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="pricing-faq-meta">
              Billing terms in our{" "}
              <Link href="/terms-of-service">Terms of Service</Link>.
              <br />
              More questions?{" "}
              <Link href="/faq">Visit the FAQ or Help Center →</Link>
            </p>
          </div>
        </FadeUp>
      ) : (
      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Frequently Asked Questions
            </h2>
            {showPublicSeo ? (
              <>
                <p className="mt-3 text-sm text-gray-600">
                  Direct answers to common pricing questions. For broader
                  platform topics, see the{" "}
                  <Link href="/faq" className={linkClass}>
                    FAQ
                  </Link>{" "}
                  or{" "}
                  <Link href="/help-center" className={linkClass}>
                    Help Center
                  </Link>
                  .
                </p>
                <p className="mt-2 text-xs text-gray-600">
                  Billing terms for standard plans are outlined in our{" "}
                  <Link href="/terms-of-service" className={linkClass}>
                    Terms of Service
                  </Link>
                  .
                </p>
              </>
            ) : (
              <p className="mt-2 text-xs text-gray-600">
                Our team is here to help you choose the right plan for your
                business needs.
              </p>
            )}
          </div>

          <div className="mx-auto mt-6 max-w-2xl space-y-3">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.question}
                  className="rounded-2xl border border-gray-200 bg-[#F7F8FA] p-3 text-xs text-gray-700 shadow-sm"
                >
                  <h3 className="text-sm font-semibold text-[#0E0E0E]">
                    <button
                      type="button"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      className="flex w-full items-center justify-between text-left"
                    >
                      <span>{item.question}</span>
                      <span className="ml-3 shrink-0 font-normal text-gray-400">
                        {isOpen ? "–" : "+"}
                      </span>
                    </button>
                  </h3>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.25 }}
                      >
                        <p className="mt-3 text-gray-600">
                          {item.answer}
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      )}

      {showPublicSeo ? (
        isCinematic ? (
          <FadeUp threshold={PRICING_IO} className="pricing-custom-split">
            <div className="pricing-section-inner">
              <h2 className="pricing-section-title">
                <span className="pricing-section-accent">Need Custom </span>
                <span className="pricing-section-dark">Pricing?</span>
              </h2>
              <p className="pricing-sr-detail">
                Custom pricing exists for teams that need more than standard plan limits,
                higher review volume, bespoke integrations, or enterprise compliance
                requirements. The custom path is for organisations whose needs outgrow Elite.
              </p>
              <div className="pricing-custom-panel">
                <div className="pricing-custom-panel-left">
                  <div className="pricing-custom-row">
                    <span className="pricing-custom-row-icon pricing-custom-row-icon--teal">
                      <Users className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[#124541]">Larger Teams</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        Multi-team or multi-brand organisations that need coordinated reputation
                        management, higher invite volumes, and tailored access controls may
                        benefit from a Custom Plan scoped to their structure.
                      </p>
                    </div>
                  </div>
                  <hr className="pricing-custom-divider" />
                  <div className="pricing-custom-row">
                    <span className="pricing-custom-row-icon pricing-custom-row-icon--forest">
                      <Building2 className="h-5 w-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-lg font-bold text-[#124541]">Enterprise Needs</h3>
                      <p className="mt-2 text-sm leading-relaxed text-gray-600">
                        Enterprise requirements, custom integrations, SSO, dedicated support,
                        or non-standard SLAs, are handled through a Custom Plan quote rather
                        than self-serve checkout.
                      </p>
                    </div>
                  </div>
                  <p className="pricing-custom-note">
                    Tellacity pricing is part of the broader{" "}
                    <Link href="/for-business" className="pricing-inline-link pricing-inline-link--forest">
                      Reputation Platform
                    </Link>
                    . Questions about fit?{" "}
                    <Link href="/contact" className="pricing-inline-link pricing-inline-link--forest">
                      Contact us
                    </Link>
                    .
                  </p>
                </div>
                <div className="pricing-custom-panel-right">
                  <Crown className="h-10 w-10 text-[#00B4A6]" aria-hidden />
                  <h3 className="pricing-custom-panel-right-title">Custom Plan</h3>
                  <p className="pricing-custom-panel-right-copy">
                    Scoped to your structure, volume, and compliance requirements.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCustomPlanError(null);
                      setIsCustomPlanOpen(true);
                    }}
                    className="pricing-custom-panel-cta"
                  >
                    Request a Custom Plan →
                  </button>
                  <Link href="/contact" className="pricing-custom-panel-link">
                    Contact us →
                  </Link>
                </div>
              </div>
            </div>
          </FadeUp>
        ) : (
        <section className="mx-auto w-full max-w-6xl px-6 pb-14">
          <div className="rounded-3xl border border-gray-200 bg-[#F7F8FA] p-8">
            <h2 className="text-2xl font-semibold text-[#0E0E0E]">
              Need Custom Pricing?
            </h2>
            <p className="mt-3 max-w-3xl text-sm text-gray-600">
              Custom pricing exists for teams that need more than standard plan
              limits, higher review volume, bespoke integrations, or enterprise
              compliance requirements. The custom path is for organisations whose
              needs outgrow Elite.
            </p>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  Larger teams
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Multi-team or multi-brand organisations that need coordinated
                  reputation management, higher invite volumes, and tailored
                  access controls may benefit from a Custom Plan scoped to their
                  structure.
                </p>
              </div>
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h3 className="text-base font-semibold text-[#0E0E0E]">
                  Enterprise needs
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Enterprise requirements, custom integrations, SSO, dedicated
                  support, or non-standard SLAs, are handled through a Custom Plan
                  quote rather than self-serve checkout.
                </p>
              </div>
            </div>
            <p className="mt-6 text-sm text-gray-600">
              Tellacity pricing is part of the broader{" "}
              <Link href="/for-business" className={linkClass}>
                Reputation Platform for businesses
              </Link>
              . Questions about fit?{" "}
              <Link href="/contact" className={linkClass}>
                Contact us
              </Link>
              .
            </p>
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setCustomPlanError(null);
                  setIsCustomPlanOpen(true);
                }}
                className="rounded-xl bg-black px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-neutral-800"
              >
                Request a Custom Plan
              </button>
            </div>
          </div>
        </section>
        )
      ) : null}

      {isCinematic ? (
        <FadeUp threshold={PRICING_IO} className="pricing-trust-bar">
          <div className="pricing-section-inner">
            <div className="pricing-trust-grid">
              <div className="pricing-trust-col">
                <ShieldCheck className="pricing-trust-icon mx-auto h-8 w-8" aria-hidden />
                <p className="pricing-trust-title">No hidden fees</p>
                <p className="pricing-trust-desc">Transparent pricing, always.</p>
              </div>
              <div className="pricing-trust-col">
                <RefreshCw className="pricing-trust-icon mx-auto h-8 w-8" aria-hidden />
                <p className="pricing-trust-title">Switch anytime</p>
                <p className="pricing-trust-desc">Upgrade or downgrade as you grow.</p>
              </div>
              <div className="pricing-trust-col">
                <CreditCard className="pricing-trust-icon mx-auto h-8 w-8" aria-hidden />
                <p className="pricing-trust-title">Start free</p>
                <p className="pricing-trust-desc">Start free — no card required.</p>
              </div>
            </div>
          </div>
        </FadeUp>
      ) : null}

      {/* CUSTOM PLAN MODAL */}
      {isCustomPlanOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#0E0E0E]">
                Request a Custom Plan
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomPlanOpen(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <form
              className="mt-4 space-y-3 text-xs"
              onSubmit={async (e) => {
                e.preventDefault();
                if (customPlanLoading) return;
                setCustomPlanLoading(true);
                setCustomPlanError(null);
                try {
                  const res = await fetch("/api/custom-plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      fullName: customPlanForm.fullName,
                      companyName: customPlanForm.companyName,
                      email: customPlanForm.email,
                      volume: customPlanForm.volume,
                      message: customPlanForm.message,
                    }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error || "Failed to send request.");
                  }
                  setIsCustomPlanOpen(false);
                  setRequestSent(true);
                  setCustomPlanForm({
                    fullName: "",
                    companyName: "",
                    email: "",
                    volume: "",
                    message: "",
                  });
                } catch (error: any) {
                  setCustomPlanError(error.message || "Something went wrong.");
                } finally {
                  setCustomPlanLoading(false);
                }
              }}
            >
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Full Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customPlanForm.fullName}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      fullName: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Company Name<span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customPlanForm.companyName}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      companyName: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Work Email<span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={customPlanForm.email}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Estimated Monthly Review Volume
                </label>
                <select
                  value={customPlanForm.volume}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      volume: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                >
                  <option value="">Select an option</option>
                  {CUSTOM_PLAN_REVIEW_VOLUME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-700">
                  Message
                </label>
                <textarea
                  rows={3}
                  value={customPlanForm.message}
                  onChange={(e) =>
                    setCustomPlanForm((prev) => ({
                      ...prev,
                      message: e.target.value,
                    }))
                  }
                  className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-xs outline-none focus:border-[#0E0E0E]"
                />
              </div>
              {customPlanError && (
                <p className="text-[11px] text-red-600">{customPlanError}</p>
              )}
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCustomPlanOpen(false)}
                  className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customPlanLoading}
                  className="rounded-lg bg-[#0E0E0E] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800 disabled:opacity-60"
                >
                  {customPlanLoading ? "Sending..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CUSTOM PLAN SUCCESS OVERLAY */}
      {requestSent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl text-center"
          >
            <p className="text-sm font-semibold text-[#0E0E0E]">
              ✅ Request Sent Successfully
            </p>
            <p className="mt-2 text-xs text-gray-600">
              Our sales team has received your request. We’ll contact you shortly at your work email.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setRequestSent(false)}
                className="rounded-xl bg-black px-5 py-2 text-xs font-semibold text-white shadow-md transition hover:bg-neutral-800"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FINAL CTA */}
      {isCinematic ? (
        <FadeUp threshold={PRICING_IO} className="pricing-final-cta">
          <div className="pricing-final-cta-inner">
            <h2 className="pricing-final-cta-title">
              Start Free.
              <br />
              <span className="pricing-final-cta-accent">Scale With Confidence.</span>
            </h2>
            <p className="pricing-final-cta-sub">
              Build trust before you pay. Create your business profile and start collecting
              verified reviews.
            </p>
            <div className="pricing-final-cta-btns">
              <Link href="/business/signup" className="pricing-btn-primary">
                Get Started
              </Link>
              <Link href="/for-business" className="pricing-btn-outline-white">
                Explore for Business →
              </Link>
            </div>
            <p className="pricing-final-cta-extra">
              Explore Tellacity for Business or compare plans above before you sign up.
            </p>
          </div>
        </FadeUp>
      ) : (
      <section className="relative overflow-hidden bg-gradient-to-r from-[#0E0E0E] via-[#0E3B36] to-[#1FAF9E] py-16">
        <motion.div
          initial={{ opacity: 0.4 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
          className="pointer-events-none absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),transparent_60%)]" />
          <div className="absolute inset-0 pointer-events-none">
            {sparkles.map((sparkle) => (
              <motion.span
                key={sparkle.id}
                className="absolute h-1 w-1 rounded-full bg-white/40"
                style={{
                  top: `${sparkle.top}%`,
                  left: `${sparkle.left}%`,
                }}
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  delay: sparkle.id * 0.1,
                }}
              />
            ))}
          </div>
        </motion.div>

        <div className="relative mx-auto w-full max-w-6xl px-6 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-semibold">
            Start Free. Scale With Confidence.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-100 md:text-base">
            Build trust before you pay. Create your business profile and start
            collecting verified reviews.
          </p>
          {showPublicSeo ? (
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-200">
              Explore{" "}
              <Link
                href="/for-business"
                className="font-medium text-white underline underline-offset-2 hover:text-[#1FAF9E]"
              >
                Tellacity for Business
              </Link>{" "}
              or compare plans above before you sign up.
            </p>
          ) : null}
          <div className="mt-6 flex justify-center">
            <Link
              href="/business/signup"
              className="inline-flex items-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-[#0E0E0E] shadow-sm hover:bg-gray-100 transition"
            >
              Get Started
            </Link>
          </div>
        </div>
      </section>
      )}

    </Root>
  );
}
