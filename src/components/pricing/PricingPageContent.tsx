"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, TrendingUp, BarChart3 } from "lucide-react";
import { isPlanDowngrade, isPlanUpgrade } from "@/lib/billingPlanRank";
import { nextTierUpgradeCtaLabel, type PlanKey } from "@/lib/plans";
import type { UpgradeFlowContext } from "@/lib/upgradeFlow";
import {
  PAID_PLAN_USD,
  getAnnualTotalDueUsd,
  isPaidPlanForConfirm,
} from "@/lib/billingPlanConfirm";
import { cn } from "@/lib/utils";

type Plan = {
  name: string;
  price: string;
  priceSub?: string;
  description: string;
  features: string[];
  /** Paid plans show a simple "Supports integrations" line; Free plan omits it. */
  supportsIntegrations?: boolean;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Free",
    price: "$0",
    description: "Everything you need to get your first reviews.",
    features: [
      "Claim your business profile",
      "Verified Business Dashboard access",
      "Receive unlimited consumer reviews",
      "Photo upload",
      "20 review invites per month",
      "Basic Email review invitations",
    ],
  },
  {
    name: "Grow",
    price: "$49",
    priceSub: "/ month",
    description: "Start collecting reviews consistently and build trust.",
    features: [
      "150 review invites per month",
      "Email review invitations",
      "Customisable email invite templates",
      "QR code reviews",
      "Photo upload",
      "On-site widget library & performance analytics",
    ],
    supportsIntegrations: true,
  },
  {
    name: "Premium",
    price: "$179",
    priceSub: "/ month",
    description: "Best for growing businesses ready to scale.",
    features: [
      "Everything in Grow",
      "500 review invites per month",
      "Automated review invitation flows",
      "Expanded widget library (customisable)",
      "Advanced analytics & sentiment analysis",
      "Team alerts & notifications",
      "Premium Credibility Badge",
      "Multi-user logins (10 users)",
      "Photo upload",
    ],
    supportsIntegrations: true,
    highlight: true,
  },
  {
    name: "Elite",
    price: "$349",
    priceSub: "/ month",
    description: "Advanced tools for high-growth and enterprise teams.",
    features: [
      "Everything in Premium",
      "2,000 review invites per month",
      "Bulk upload & automation rules",
      "White-label solution options",
      "Strategic insights & benchmarking",
      'Priority placement ("Featured")',
      "Custom enterprise integrations",
      "Scheduled auto-exports",
      "Dedicated account manager",
      "Photo upload",
    ],
    supportsIntegrations: true,
  },
];

const pricingButtonClass =
  "w-full mt-6 rounded-xl bg-black text-white py-3 font-semibold shadow-lg shadow-black/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 active:scale-95";

/** Feature row: [Feature label, Free, Grow, Premium, Elite] */
type FeatureRow = [string, string, string, string, string];

const comparisonTableRows: Array<{ type: "section"; label: string } | { type: "feature"; row: FeatureRow }> = [
  { type: "section", label: "COLLECT" },
  { type: "feature", row: ["Review invitations / month", "20", "150", "500", "2,000"] },
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
  { type: "feature", row: ["On-site widget library", "Basic", "Standard", "Expanded", "Full + Custom CSS"] },
  { type: "feature", row: ["White-label solution", "–", "–", "–", "✓"] },
  { type: "section", label: "UNDERSTAND" },
  { type: "feature", row: ["Reviews & invite analytics", "Basic", "Standard", "Advanced", "Advanced + exports"] },
  { type: "feature", row: ["Strategic insights", "–", "–", "Sentiment", "Sentiment + Benchmarks"] },
  { type: "feature", row: ["Data exports", "–", "CSV", "CSV + JSON", "Scheduled auto-exports"] },
  { type: "section", label: "INTEGRATE" },
  { type: "feature", row: ["Supports integrations", "–", "✓", "✓", "✓"] },
  { type: "feature", row: ["Custom enterprise integrations", "–", "–", "–", "✓"] },
];

const faqs = [
  {
    question: "Can I start on the Free plan and upgrade later?",
    answer:
      "Yes. Many businesses start on the Free plan to establish their profile and move to Grow, Premium, or Elite as their review volume and requirements increase.",
  },
  {
    question: "Do you charge extra fees for integrations?",
    answer:
      "Paid plans support integrations at no additional cost from Tellacity. Any third‑party platform fees are billed separately by those providers.",
  },
  {
    question: "Is there a long‑term contract?",
    answer:
      "Plans are available on flexible terms. You can start monthly and move to an annual agreement when your team is ready for longer‑term optimisation.",
  },
];

export type PricingPageContentProps = {
  /** `dashboard` = logged-in user: paid plans open Paystack (same as Plans & billing), not signup. */
  variant?: "public" | "dashboard";
  dashboardBusinessId?: string;
  dashboardUserEmail?: string;
  /** Current workspace plan (your-plan card + upgrade CTA copy on dashboard). */
  dashboardCurrentPlanKey?: PlanKey;
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

export function PricingPageContent({
  variant = "public",
  dashboardBusinessId,
  dashboardUserEmail,
  dashboardCurrentPlanKey,
  emphasizePremiumAnchor = false,
  dashboardPricingHighlightContext = null,
  embedInDashboard = false,
  dashboardInitialBillingMode,
  dashboardHideMarketingHero = false,
}: PricingPageContentProps = {}) {
  const router = useRouter();
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
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const isDashboardCheckout =
    variant === "dashboard" &&
    Boolean(dashboardBusinessId?.trim()) &&
    Boolean(dashboardUserEmail?.trim());

  const handleDashboardUpgrade = useCallback(
    (targetKey: PlanKey) => {
      const current = dashboardCurrentPlanKey ?? "free";
      if (targetKey === current) return;
      if (!isPlanUpgrade(targetKey, current)) return;
      if (!isPaidPlanForConfirm(targetKey)) return;
      router.push(
        `/business/dashboard/billing/checkout?plan=${encodeURIComponent(targetKey)}&cycle=${encodeURIComponent(billing)}`
      );
    },
    [billing, dashboardCurrentPlanKey, router]
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

  return (
    <Root className={rootSurfaceClass}>
      {/* HERO (hidden on dashboard billing — cards + comparison only) */}
      {!dashboardHideMarketingHero ? (
      <section className="mx-auto w-full max-w-6xl px-6 py-16 grid gap-10 md:grid-cols-2 items-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="space-y-5"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Pricing
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-[#0E0E0E]">
            Simple, Transparent Pricing That Scales With Your Business.
          </h1>
          <p className="text-sm md:text-base text-gray-600 max-w-xl">
            Start free. Upgrade when you grow. No hidden fees.
          </p>

          <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-white p-1 shadow-sm">
            <div className="relative flex rounded-full bg-neutral-100">
              <motion.div
                className="absolute inset-y-0 w-1/2 rounded-full bg-[#0E0E0E]"
                animate={{ x: billing === "monthly" ? 0 : "100%" }}
                transition={{ type: "tween", duration: 0.25 }}
              />
              {["monthly", "annual"].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setBilling(mode as "monthly" | "annual")}
                  className={`relative z-10 px-4 py-2 text-xs font-semibold transition-colors ${
                    billing === mode ? "text-white" : "text-gray-600"
                  }`}
                >
                  {mode === "monthly" ? "Monthly" : "Annual"}
                </button>
              ))}
            </div>
            <span className="inline-flex items-center rounded-full bg-[#FCD34D]/30 px-3 py-1 text-[10px] font-semibold text-[#B45309]">
              Save 20% on annual billing
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.p
              key={billing}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] text-gray-500"
            >
              {billing === "monthly"
                ? "Prices shown are monthly. Switch to annual when you’re ready for longer-term optimisation."
                : "Annual agreements reflect approximately 20% savings vs month‑to‑month, billed yearly."}
            </motion.p>
          </AnimatePresence>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="relative hidden md:block"
        >
          <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[#1FAF9E]/10 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-[#0E3B36]/10 blur-3xl" />
          <motion.div
            animate={{ y: [-6, 6] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
            className="relative mx-auto max-w-md rounded-3xl border border-neutral-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-gray-600 mb-3">
              <span className="font-semibold text-[#0E0E0E]">Tellacity Plans</span>
              <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">
                Trusted pricing
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-[11px]">
              {plans
                .filter((plan) => plan.name !== "Free")
                .map((plan) => (
                  <div
                    key={plan.name}
                    className={`rounded-2xl p-3 ${
                      plan.name === "Premium"
                        ? "bg-[#0E0E0E] text-white"
                        : "bg-[#F7F8FA] text-[#0E0E0E]"
                    }`}
                  >
                    <p className={plan.name === "Premium" ? "text-gray-200" : "text-gray-500"}>
                      {plan.name}
                    </p>
                    <p
                      className={`mt-1 text-lg font-semibold ${
                        plan.name === "Premium" ? "" : "text-[#0E0E0E]"
                      }`}
                    >
                      {plan.price}
                    </p>
                    <p
                      className={`mt-1 text-[10px] ${
                        plan.name === "Premium" ? "text-gray-300" : "text-gray-500"
                      }`}
                    >
                      {plan.name === "Grow"
                        ? "Best for scaling"
                        : plan.name === "Premium"
                        ? "Advanced teams"
                        : "Enterprise support"}
                    </p>
                  </div>
                ))}
            </div>
            <div className="mt-4 rounded-2xl bg-[#F7F8FA] p-3 text-[11px] text-gray-600">
              <p className="font-semibold text-[#0E0E0E]">Predictable, usage‑based invites</p>
              <p className="mt-1">
                Move between plans as review volume changes. No setup fees or surprise line items.
              </p>
            </div>
          </motion.div>
        </motion.div>
      </section>
      ) : null}

      {/* PRICING CARDS */}
      <section
        className={`mx-auto w-full max-w-6xl px-6 pb-8 ${
          dashboardHideMarketingHero ? "pt-4 md:pt-6" : ""
        }`}
      >
        <div className="mb-8 flex justify-center px-2">
          <div
            className="inline-flex h-11 w-full max-w-[min(100%,22rem)] items-stretch rounded-full bg-[#E9E1D6] p-0.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-stone-300/40"
            role="group"
            aria-label="Billing period"
          >
            <button
              type="button"
              onClick={() => setBilling("monthly")}
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
              onClick={() => setBilling("annual")}
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

        <div className="grid gap-6 lg:grid-cols-4">
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
            const showHighlightGlow = isSmartRecommended || isLegacyPopular;
            const isVisualPremiumAnchor =
              isLegacyPopular && Boolean(premiumAnchorBoost) && plan.name === "Premium";

            /**
             * Dashboard embed renders the pricing cards inside a narrow
             * billing column. The public page uses `scale-*` and thicker
             * borders to visually pop the recommended card, but those
             * transforms break grid alignment in the embed — neighbours
             * look shorter/narrower even though the grid cells are equal.
             * When embedded we keep highlights via border/glow only and
             * normalise border widths so every card occupies its grid
             * cell identically.
             */
            const cardBaseLayoutClass =
              "relative flex h-full flex-col rounded-3xl p-6 transition-all duration-300";

            const cardVariantClass = embedInDashboard
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
                  ? "border-2 border-[#1FAF9E] bg-white shadow-xl shadow-[#1FAF9E]/20 ring-2 ring-[#1FAF9E]/25 scale-[1.04]"
                  : isLegacyPopular
                    ? isVisualPremiumAnchor
                      ? "border-[3px] border-[#0E3B36] bg-white shadow-2xl shadow-[#0E3B36]/15 ring-2 ring-[#1FAF9E]/30 scale-[1.03]"
                      : "border-[3px] border-[#1FAF9E] bg-white shadow-xl scale-[1.03]"
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
                    <span className="rounded-full bg-gradient-to-r from-[#1FAF9E] to-[#0E3B36] px-4 py-1 text-[10px] font-semibold text-white shadow-sm">
                      Most Popular
                    </span>
                  </div>
                ) : null}
                <h3
                  className={`text-sm font-semibold ${
                    isWorkspaceOnThisPlan ? "mt-2 text-neutral-800" : "mt-2 text-[#0E0E0E]"
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-2 text-xs ${
                    isWorkspaceOnThisPlan ? "text-neutral-600" : "text-gray-600"
                  }`}
                >
                  {plan.description}
                </p>
                <div className="mt-5">
                  {plan.name === "Free" ? (
                    <div className="flex items-end gap-1">
                      <span
                        className={`text-3xl font-semibold ${
                          isWorkspaceOnThisPlan ? "text-neutral-600" : "text-[#0E0E0E]"
                        }`}
                      >
                        {plan.price}
                      </span>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        key={billing}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex items-end gap-1"
                      >
                        <span className="text-3xl font-semibold text-[#0E0E0E]">
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
                        <span className="pb-1 text-sm font-normal text-gray-500">
                          /mo
                        </span>
                      </motion.div>
                      {billing === "annual" ? (
                        <>
                          <p className="mt-1 text-xs text-gray-500">Billed annually</p>
                          {cardPlanKey && isPaidPlanForConfirm(cardPlanKey) ? (
                            <p className="mt-2 text-xs font-semibold text-[#0E0E0E]">
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
                  className={`mt-5 flex-1 space-y-3 text-xs ${
                    isWorkspaceOnThisPlan ? "text-neutral-600" : "text-gray-600"
                  }`}
                >
                  {plan.features.map((feature) => (
                    <motion.li
                      key={feature}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3 }}
                      className="flex items-start gap-2"
                    >
                      <span
                        className={`mt-1 inline-flex h-4 w-4 items-center justify-center rounded-full border text-[10px] font-semibold ${
                          isWorkspaceOnThisPlan
                            ? "border-neutral-300 text-neutral-500"
                            : "border-[#1FAF9E] text-[#1FAF9E]"
                        }`}
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </motion.li>
                  ))}
                </ul>
                {plan.name !== "Free" && plan.supportsIntegrations && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-[#0E0E0E]">
                      Supports integrations
                    </p>
                  </div>
                )}
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
                    onClick={() => {
                      const key =
                        plan.name.toLowerCase() as "free" | "grow" | "premium" | "elite";
                      setSelectedPlan(key);
                      setShowUpgradeModal(true);
                    }}
                    className={pricingButtonClass}
                  >
                    Choose This Plan
                  </button>
                )}
                {isSmartRecommended ? (
                  <p className="mt-2 text-xs text-gray-500 text-center opacity-80">
                    Most businesses choose this plan to showcase more
                  </p>
                ) : plan.name === "Premium" && !isWorkspaceOnThisPlan && isLegacyPopular ? (
                  <p className="mt-2 text-xs text-gray-500 text-center opacity-70">
                    Most businesses choose this plan.
                  </p>
                ) : null}
              </div>
            </motion.div>
            );
          })}
        </div>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white px-6 py-6 text-xs text-gray-600 shadow-sm">
          <p className="font-semibold text-[#0E0E0E] text-center mb-1">
            Need custom pricing?
          </p>
          <p className="mt-1 text-xs text-gray-600 text-center">
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

      </section>

      {/* FEATURE COMPARISON */}
      <section className="mx-auto w-full max-w-6xl px-6 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-[#0E0E0E]">
            Detailed Feature Comparison
          </h2>
          <p className="mt-2 text-xs text-gray-600">
            Compare all features and limits across plans
          </p>
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
                      <td
                        colSpan={5}
                        className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-gray-600"
                      >
                        {item.label}
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

      {/* FAQ ACCORDION */}
      <section className="bg-white py-14">
        <div className="mx-auto w-full max-w-6xl px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-base font-semibold text-[#0E0E0E]">
              Still have questions?
            </h3>
            <p className="mt-2 text-xs text-gray-600">
              Our team is here to help you choose the right plan for your business needs.
            </p>
          </div>

          <div className="mx-auto mt-6 max-w-2xl space-y-3">
            {faqs.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={item.question}
                  className="rounded-2xl border border-gray-200 bg-[#F7F8FA] p-3 text-xs text-gray-700 shadow-sm"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <span className="font-semibold text-[#0E0E0E]">
                      {item.question}
                    </span>
                    <span className="ml-3 text-gray-400">
                      {isOpen ? "–" : "+"}
                    </span>
                  </button>
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
                  <option value="3,000-5,000">3,000–5,000</option>
                  <option value="5,001-10,000">5,001–10,000</option>
                  <option value="10,001-25,000">10,001–25,000</option>
                  <option value="25,001-50,000">25,001–50,000</option>
                  <option value="50,000+">50,000+</option>
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
          <p className="mt-3 text-sm md:text-base text-gray-100 max-w-2xl mx-auto">
            Build trust before you pay. Create your business profile and start collecting verified reviews.
          </p>
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

      {/* UPGRADE CONFIRMATION MODAL */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#2C2C2C] p-6 shadow-2xl sm:p-8">
            <h2 className="mb-2 text-2xl font-bold text-white">Confirm Your Plan</h2>
            <p className="mb-6 text-sm text-neutral-300 sm:text-base">
              You selected the{" "}
              <span className="font-semibold capitalize text-white">{selectedPlan}</span> plan.
            </p>

            <div className="mb-6 rounded-xl border border-stone-300 bg-[#F8F4F0] p-4">
              {selectedPlan === "free" && (
                <ul className="space-y-2 text-sm text-black">
                  <li>✓ 20 review invites/month</li>
                  <li>✓ Basic dashboard</li>
                  <li>✓ Email invites</li>
                </ul>
              )}

              {selectedPlan === "grow" && (
                <ul className="space-y-2 text-sm text-black">
                  <li>✓ 150 review invites/month</li>
                  <li>✓ Email invites</li>
                  <li>✓ Performance analytics</li>
                </ul>
              )}

              {selectedPlan === "premium" && (
                <ul className="space-y-2 text-sm text-black">
                  <li>✓ 500 review invites/month</li>
                  <li>✓ Automated review invitation flows</li>
                  <li>✓ Advanced analytics</li>
                  <li>✓ Premium credibility badge</li>
                </ul>
              )}

              {selectedPlan === "elite" && (
                <ul className="space-y-2 text-sm text-black">
                  <li>✓ 2,000 review invites/month</li>
                  <li>✓ White-label options</li>
                  <li>✓ Dedicated account manager</li>
                </ul>
              )}
            </div>

            <div className="flex flex-wrap justify-end gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="rounded-lg border border-white/25 bg-white px-5 py-2 text-sm font-medium text-black hover:bg-neutral-100"
              >
                Cancel
              </button>

              <a
                href={`/business/signup?plan=${selectedPlan ?? ""}`}
                className="inline-flex items-center justify-center rounded-lg bg-black px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-black/30 transition-all hover:bg-neutral-900 hover:shadow-xl"
              >
                Confirm &amp; Continue
              </a>
            </div>
          </div>
        </div>
      )}

    </Root>
  );
}
