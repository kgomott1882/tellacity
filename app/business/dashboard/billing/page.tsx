"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import SimplePage from "../_components/SimplePage";
import { useBusinessContext } from "../_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import {
  parseBillingCycleQuery,
  parseBillingPlanQuery,
  isPaidPlanForConfirm,
} from "@/lib/billingPlanConfirm";
import { stashBillingCheckoutBackPath } from "@/lib/billingCheckoutBack";
import { billingCheckoutPickerPath } from "@/lib/billingCheckoutPaths";
import {
  BILLING_UPGRADE_SESSION_KEY,
  clearBillingUpgradeContext,
  clearUpgradeFlowLocalStorage,
  consumeUpgradeFlowFromLocalStorage,
  isUpgradeFlowContext,
  readUpgradeSourceFromSearchParams,
  type UpgradeFlowContext,
  UPGRADE_FLOW_QUERY_PARAM,
  UPGRADE_SOURCE_QUERY_PARAM,
} from "@/lib/upgradeFlow";
import {
  BILLING_PLAN_ORDER,
  BILLING_PLAN_ARTICLES_LABEL,
  BILLING_PLAN_PHOTOS_LABEL,
  BILLING_PLAN_SECTIONS_LABEL,
  conversionHighlightPlanForContext,
  highlightedPlanForBilling,
} from "@/lib/billingPlanPhotoSummary";
import {
  PLAN_PHOTO_LIMITS,
  normalizePlanCodeToKey,
  type PlanKey,
} from "@/lib/plans";
import { cn } from "@/lib/utils";
import type { BillingOverviewHistoryRow, BillingOverviewResponse } from "@/lib/billingOverview";
import PaymentHistory from "./_components/PaymentHistory";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";
import { startGrowTrial } from "@/lib/startGrowTrialClient";
import { trialDaysRemaining } from "@/lib/trialDaysRemaining";
import { ChevronDown } from "lucide-react";

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  grow: "Grow",
  premium: "Premium",
  elite: "Elite",
};

const PRICING_SCROLL_REASONS = new Set(["limit", "analytics", "widget", "team"]);

type UpgradeVerifyState = "idle" | "checking" | "ok";

function queryFlagTrue(value: string | null | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

function billingPathMatch(pathname: string | null): boolean {
  const p = (pathname ?? "").replace(/\/$/, "") || "";
  return p === "/business/dashboard/billing";
}

function useBillingSearchParams() {
  const pathname = usePathname();
  const nextSp = useSearchParams();
  const nextSpString = nextSp.toString();
  return useMemo(() => {
    if (typeof window !== "undefined" && billingPathMatch(pathname)) {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(nextSpString);
  }, [pathname, nextSpString]);
}

export default function BillingPage() {
  const router = useRouter();
  const { selectedBusiness, navRefreshKey, bumpNavRefresh } = useBusinessContext();
  const { user, loading: authLoading } = useBusinessAuth();
  const searchParams = useBillingSearchParams();

  const reason = searchParams.get("reason");
  const upgrade = queryFlagTrue(searchParams.get("upgrade"));
  const success = queryFlagTrue(searchParams.get("success"));
  const checkoutPlanParam = searchParams.get("plan");
  const checkoutCycleParam = searchParams.get("cycle");
  const parsedCheckoutPlan = parseBillingPlanQuery(checkoutPlanParam ?? undefined);
  const parsedCycle = parseBillingCycleQuery(checkoutCycleParam ?? undefined);

  const successPlan =
    success && parsedCheckoutPlan && isPaidPlanForConfirm(parsedCheckoutPlan)
      ? parsedCheckoutPlan
      : null;
  const showSuccess = Boolean(successPlan);

  const dashboardCheckoutPlanFromUrl =
    !success && parsedCheckoutPlan && isPaidPlanForConfirm(parsedCheckoutPlan)
      ? parsedCheckoutPlan
      : null;

  const [upgradeVerifyState, setUpgradeVerifyState] =
    useState<UpgradeVerifyState>("idle");
  const [billingOverview, setBillingOverview] = useState<BillingOverviewResponse | null>(
    null
  );
  const [billingOverviewLoading, setBillingOverviewLoading] = useState(false);
  const [billingOverviewError, setBillingOverviewError] = useState<string | null>(null);
  const [cancelDowngradeBusy, setCancelDowngradeBusy] = useState(false);
  const [billingUpgradeContext, setBillingUpgradeContext] = useState<UpgradeFlowContext | null>(null);
  /**
   * Inline pricing disclosure. We intentionally avoid navigating to the
   * standalone pricing page (`/business/dashboard/settings/usage`) from
   * here, a full route change unmounts dashboard-scoped contexts like
   * the "Upload more photos" staging queue, which would lose queued files.
   * Rendering <PricingPageContent /> inline keeps every dashboard context
   * mounted while still giving the user the full comparison + checkout UX.
   */
  const [pricingOpen, setPricingOpen] = useState(false);
  const [growTrialStarting, setGrowTrialStarting] = useState(false);
  const [growTrialTableError, setGrowTrialTableError] = useState<string | null>(null);

  const businessId = selectedBusiness?.id ?? null;
  const trialEligible = selectedBusiness?.trialEligible === true;
  const subscriptionStatusRaw =
    billingOverview?.current?.status?.trim().toLowerCase() ??
    selectedBusiness?.subscriptionStatus?.trim().toLowerCase() ??
    null;
  const isTrialing = subscriptionStatusRaw === "trialing";
  const trialEndsAt = isTrialing
    ? billingOverview?.current?.current_period_end ??
      selectedBusiness?.trialEndsAt ??
      null
    : null;
  const trialDaysLeft = trialDaysRemaining(trialEndsAt);
  const showTrialStatus = isTrialing && trialDaysLeft != null;
  const trialEndsLabel = (() => {
    if (!trialEndsAt) return null;
    const d = new Date(trialEndsAt);
    if (!Number.isFinite(d.getTime())) return null;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  })();
  const keepGrowCheckoutHref = billingCheckoutPickerPath(
    "grow",
    "monthly",
    "/business/dashboard/billing",
  );
  const planKey = billingOverview?.current?.plan_code
    ? normalizePlanCodeToKey(billingOverview.current.plan_code)
    : normalizePlanCodeToKey(selectedBusiness?.plan);
  const currentPlanLabel = PLAN_LABELS[planKey] ?? planKey;
  const pendingPlanCode = billingOverview?.current?.pending_plan_code?.trim() || null;
  const pendingChangeAtRaw = billingOverview?.current?.pending_change_at?.trim() || null;
  const pendingChangeLabel = (() => {
    if (!pendingChangeAtRaw) return null;
    const d = new Date(pendingChangeAtRaw);
    if (!Number.isFinite(d.getTime())) return pendingChangeAtRaw;
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  })();
  const shouldPromotePlanChange =
    Boolean(businessId) && reason != null && PRICING_SCROLL_REASONS.has(reason);

  useEffect(() => {
    if (!dashboardCheckoutPlanFromUrl) return;
    const qs = new URLSearchParams({
      plan: dashboardCheckoutPlanFromUrl,
      cycle: parsedCycle,
    });
    router.replace(`/business/dashboard/settings/usage?${qs.toString()}`);
  }, [dashboardCheckoutPlanFromUrl, parsedCycle, router]);

  useEffect(() => {
    if (!upgrade || !parsedCheckoutPlan || !isPaidPlanForConfirm(parsedCheckoutPlan)) {
      return;
    }
    const returnTo = "/business/dashboard/billing";
    stashBillingCheckoutBackPath(returnTo);
    router.replace(
      billingCheckoutPickerPath(parsedCheckoutPlan, parsedCycle, returnTo)
    );
  }, [upgrade, parsedCheckoutPlan, parsedCycle, router]);

  useEffect(() => {
    if (authLoading) return;
    if (!showSuccess || !successPlan || !businessId || !user?.id) {
      setUpgradeVerifyState("idle");
      return;
    }

    let cancelled = false;
    setUpgradeVerifyState("checking");

    void (async () => {
      try {
        const res = await fetch(
          `/api/billing/plan?businessId=${encodeURIComponent(businessId)}`,
          { credentials: "same-origin" }
        );
        const data = (await res.json()) as { plan?: string; error?: string };
        if (cancelled) return;
        const current = typeof data.plan === "string" ? data.plan.trim().toLowerCase() : "";
        if (res.ok && current === successPlan) {
          setUpgradeVerifyState("ok");
        } else {
          router.replace("/business/dashboard/billing");
        }
      } catch {
        if (!cancelled) {
          router.replace("/business/dashboard/billing");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, showSuccess, successPlan, businessId, router, user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!businessId || showSuccess || !user?.id) return;

    let cancelled = false;
    setBillingOverviewLoading(true);
    setBillingOverviewError(null);

    void (async () => {
      try {
        const res = await fetch(
          `/api/billing/overview?businessId=${encodeURIComponent(businessId)}`,
          { credentials: "same-origin" }
        );
        const data = (await res.json()) as BillingOverviewResponse & { error?: string };
        if (cancelled) return;
        if (!res.ok) {
          setBillingOverview(null);
          setBillingOverviewError(
            typeof data.error === "string" ? data.error : "Could not load billing details."
          );
          return;
        }
        setBillingOverview(data);
      } catch {
        if (!cancelled) {
          setBillingOverview(null);
          setBillingOverviewError("Could not load billing details.");
        }
      } finally {
        if (!cancelled) setBillingOverviewLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, businessId, showSuccess, navRefreshKey, user?.id]);

  useEffect(() => {
    if (!businessId || showSuccess) return;

    const fromQuery = readUpgradeSourceFromSearchParams(searchParams);
    if (fromQuery) {
      try {
        window.sessionStorage.setItem(BILLING_UPGRADE_SESSION_KEY, fromQuery);
        clearUpgradeFlowLocalStorage();
      } catch {
        // ignore
      }
      setBillingUpgradeContext(fromQuery);
      const next = new URLSearchParams(searchParams.toString());
      next.delete(UPGRADE_SOURCE_QUERY_PARAM);
      next.delete(UPGRADE_FLOW_QUERY_PARAM);
      const path =
        next.toString().length > 0
          ? `/business/dashboard/billing?${next.toString()}`
          : "/business/dashboard/billing";
      router.replace(path, { scroll: false });
      return;
    }

    try {
      const fromSession = window.sessionStorage.getItem(BILLING_UPGRADE_SESSION_KEY);
      if (isUpgradeFlowContext(fromSession)) {
        setBillingUpgradeContext(fromSession);
        return;
      }
    } catch {
      // ignore
    }

    const fromLocal = consumeUpgradeFlowFromLocalStorage();
    if (fromLocal) {
      setBillingUpgradeContext(fromLocal);
      return;
    }

    setBillingUpgradeContext(null);
  }, [businessId, showSuccess, searchParams, router]);

  if (!businessId || !selectedBusiness) return null;

  if (upgrade && parsedCheckoutPlan && isPaidPlanForConfirm(parsedCheckoutPlan)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#124541] border-t-transparent"
          role="status"
          aria-label="Opening checkout"
        />
        <p className="mt-4 text-sm text-gray-600">Opening checkout...</p>
      </div>
    );
  }

  const reasonMessage =
    reason === "limit"
      ? "You're losing potential reviews. Upgrade to continue collecting feedback without interruption. New review requests will stop until you upgrade."
      : reason === "analytics"
        ? "Understand what's working and improve your review performance. Without insights, you may miss opportunities to improve."
        : reason === "widget"
          ? "Unlock powerful widgets to showcase more customer feedback and build trust. Showcasing reviews builds trust and increases conversions."
          : reason === "team"
            ? "Collaborate with your team and manage reviews more efficiently."
            : null;

  const paymentHistoryRows: BillingOverviewHistoryRow[] = billingOverview?.history ?? [];

  const highlightedPlan =
    conversionHighlightPlanForContext(billingUpgradeContext) ??
    highlightedPlanForBilling(planKey, billingUpgradeContext);
  const highlightColIndex = BILLING_PLAN_ORDER.indexOf(highlightedPlan);

  const billingHeaderTitle =
    billingUpgradeContext === "upload_limit"
      ? "Need more profile photos?"
      : billingUpgradeContext === "section_locked"
        ? "Unlock every photo section"
        : billingUpgradeContext === "general"
          ? "Upgrade your plan"
          : "Payment History";

  const billingHeaderSubtitle =
    billingUpgradeContext === "upload_limit"
      ? `Free includes ${PLAN_PHOTO_LIMITS.free} photos. Grow raises it to ${PLAN_PHOTO_LIMITS.grow}, Premium to ${PLAN_PHOTO_LIMITS.premium}, and Elite to ${PLAN_PHOTO_LIMITS.elite}, spread across any category you like.`
      : billingUpgradeContext === "section_locked"
        ? "Every plan can upload to any section (and add custom ones). Higher tiers simply give you more photo slots to fill them with."
        : billingUpgradeContext === "general"
          ? "Compare photo limits below, then open Pricing plans to change subscription."
          : "Review billing activity now and prepare for invoices and downloadable documents later. When you are ready, compare plans to unlock more features.";

  /**
   * Reveal the inline pricing panel on this same page and scroll it into
   * view. The previous implementation routed to the dedicated pricing
   * page; doing that from billing risks unmounting dashboard contexts
   * (e.g. the staged-photos queue on the staging page). Staying inline
   * preserves every in-memory dashboard state.
   */
  const openInlinePricing = () => {
    setPricingOpen(true);
    // Let the panel render first, then scroll it into view.
    window.setTimeout(() => {
      const el = document.getElementById("inline-pricing-panel");
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 30);
  };

  const pricingHighlightContext =
    billingUpgradeContext === "upload_limit" ||
    billingUpgradeContext === "section_locked"
      ? billingUpgradeContext
      : null;

  const dashboardEmail = user?.email?.trim() ?? "";

  const handleCancelDowngrade = async () => {
    if (!businessId) return;
    setCancelDowngradeBusy(true);
    try {
      const res = await fetch("/api/billing/cancel-downgrade", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setBillingOverviewError(
          typeof data.error === "string" ? data.error : "Could not cancel downgrade."
        );
        return;
      }
      bumpNavRefresh();
    } catch {
      setBillingOverviewError("Could not cancel downgrade.");
    } finally {
      setCancelDowngradeBusy(false);
    }
  };

  const handleStartGrowTrialFromTable = async () => {
    if (!businessId || growTrialStarting) return;
    setGrowTrialStarting(true);
    setGrowTrialTableError(null);
    const result = await startGrowTrial(businessId);
    if (result.ok) {
      bumpNavRefresh();
    } else {
      setGrowTrialTableError(result.message);
    }
    setGrowTrialStarting(false);
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 pb-12">
      {showSuccess && successPlan ? (
        upgradeVerifyState === "checking" || upgradeVerifyState === "idle" ? (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-[#124541] border-t-transparent"
              role="status"
              aria-label="Verifying upgrade"
            />
            <p className="mt-4 text-sm text-gray-600">Verifying your upgrade...</p>
          </div>
        ) : upgradeVerifyState === "ok" ? (
          <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-6">
            <div
              className="w-full rounded-2xl border border-emerald-100 bg-white p-10 text-center shadow-[0_8px_30px_-12px_rgba(18,69,65,0.12)]"
              role="status"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <span className="text-xl" aria-hidden>
                  OK
                </span>
              </div>
              <h2 className="text-xl font-semibold text-[#0E0E0E]">
                Payment successful, congratulations for your upgrade.
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                You are now on {PLAN_LABELS[successPlan]}. Your new features are available now.
              </p>
              <Link
                href="/business/dashboard"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-[#124541] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3a35]"
              >
                Go to dashboard
              </Link>
            </div>
          </div>
        ) : null
      ) : (
        <>
          <div className="space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <SimplePage title={billingHeaderTitle} subtitle={billingHeaderSubtitle} />
              {billingUpgradeContext ? (
                <button
                  type="button"
                  onClick={() => {
                    clearBillingUpgradeContext();
                    setBillingUpgradeContext(null);
                  }}
                  className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Dismiss
                </button>
              ) : null}
            </div>

            {showTrialStatus ? (
              <div
                className={cn(
                  "flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm",
                  trialDaysLeft <= 3
                    ? "border-amber-200 bg-amber-50 text-amber-950"
                    : "border-blue-100 bg-blue-50/80 text-[#0E0E0E]",
                )}
                role="status"
              >
                <div>
                  <p className="font-semibold">
                    Grow trial · {trialDaysLeft} day{trialDaysLeft === 1 ? "" : "s"} left
                  </p>
                  {trialEndsLabel ? (
                    <p className="mt-1 text-xs opacity-80">
                      Trial ends {trialEndsLabel}. Subscribe to keep Grow features.
                    </p>
                  ) : null}
                </div>
                <Link
                  href={keepGrowCheckoutHref}
                  className={cn(
                    "inline-flex shrink-0 items-center justify-center rounded-lg px-4 py-2 text-xs font-semibold text-white transition",
                    trialDaysLeft <= 3
                      ? "bg-amber-700 hover:bg-amber-800"
                      : "bg-[#124541] hover:bg-[#0f3a35]",
                  )}
                >
                  Keep Grow
                </Link>
              </div>
            ) : null}

            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
              <table className="w-full min-w-[560px] table-fixed border-collapse text-left text-sm">
                <caption className="border-b border-gray-100 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Photos, blogs &amp; case studies by plan
                </caption>
                {/*
                  table-fixed + explicit column widths force Free / Grow /
                  Premium / Elite to render at identical widths regardless
                  of which one carries the RECOMMENDED / Suggested badge
                  or a long CTA label like "Current plan".
                */}
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "18%" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-gray-100">
                    <th scope="col" className="px-4 py-3 font-medium text-gray-500" />
                    {BILLING_PLAN_ORDER.map((p, colIdx) => (
                      <th
                        key={p}
                        scope="col"
                        className={cn(
                          "px-3 py-3 text-center font-semibold text-[#0E0E0E]",
                          colIdx === highlightColIndex &&
                            "bg-[#1FAF9E]/10 ring-1 ring-inset ring-[#1FAF9E]/35"
                        )}
                      >
                        {PLAN_LABELS[p]}
                        {p === highlightedPlan ? (
                          <span className="mt-1 block text-[10px] font-normal uppercase tracking-wide text-[#1FAF9E]">
                            Suggested
                          </span>
                        ) : null}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="text-gray-800">
                  <tr className="border-b border-gray-100">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-700">
                      Profile photos
                    </th>
                    {BILLING_PLAN_ORDER.map((p, colIdx) => (
                      <td
                        key={p}
                        className={cn(
                          "px-3 py-3 text-center text-gray-800",
                          colIdx === highlightColIndex && "bg-[#1FAF9E]/8"
                        )}
                      >
                        {BILLING_PLAN_PHOTOS_LABEL[p]}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-gray-100">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-700">
                      Blogs &amp; case studies
                    </th>
                    {BILLING_PLAN_ORDER.map((p, colIdx) => (
                      <td
                        key={p}
                        className={cn(
                          "px-3 py-3 text-center text-gray-800",
                          colIdx === highlightColIndex && "bg-[#1FAF9E]/8"
                        )}
                      >
                        {BILLING_PLAN_ARTICLES_LABEL[p]}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <th scope="row" className="px-4 py-3 font-medium text-gray-700">
                      Photo sections (uploads)
                    </th>
                    {BILLING_PLAN_ORDER.map((p, colIdx) => (
                      <td
                        key={p}
                        className={cn(
                          "px-3 py-3 text-center text-gray-800",
                          colIdx === highlightColIndex && "bg-[#1FAF9E]/8"
                        )}
                      >
                        {BILLING_PLAN_SECTIONS_LABEL[p]}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-t border-gray-100 bg-gray-50/60">
                    <th scope="row" className="px-4 py-3 font-medium text-gray-700">
                      Choose plan
                    </th>
                    {BILLING_PLAN_ORDER.map((p, colIdx) => {
                      const tierRank: Record<PlanKey, number> = {
                        free: 0,
                        grow: 1,
                        premium: 2,
                        elite: 3,
                      };
                      const isCurrent = p === planKey;
                      const isTrialingGrow = showTrialStatus && p === "grow";
                      const isUpgrade = tierRank[p] > tierRank[planKey];
                      const isFree = p === "free";
                      return (
                        <td
                          key={p}
                          className={cn(
                            "px-3 py-3 text-center align-middle",
                            colIdx === highlightColIndex && "bg-[#1FAF9E]/8"
                          )}
                        >
                          {isTrialingGrow ? (
                            <Link
                              href={keepGrowCheckoutHref}
                              className={cn(
                                "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition",
                                trialDaysLeft <= 3
                                  ? "bg-amber-700 hover:bg-amber-800"
                                  : "bg-[#124541] hover:bg-[#0f3a35]",
                              )}
                            >
                              Keep Grow
                            </Link>
                          ) : isCurrent ? (
                            <span className="inline-flex items-center rounded-full border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                              Current plan
                            </span>
                          ) : isFree ? (
                            <span className="inline-flex items-center rounded-full border border-dashed border-gray-300 bg-white px-3 py-1 text-[11px] font-medium text-gray-500">
                              -
                            </span>
                          ) : p === "grow" &&
                            planKey === "free" &&
                            trialEligible ? (
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => void handleStartGrowTrialFromTable()}
                                disabled={growTrialStarting}
                                className={cn(
                                  "inline-flex items-center justify-center rounded-lg bg-[#124541] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60",
                                )}
                              >
                                {growTrialStarting ? "Starting…" : "Start free trial"}
                              </button>
                              <span className="text-[10px] text-gray-500">No card required</span>
                            </div>
                          ) : (
                            <Link
                              href={billingCheckoutPickerPath(
                                p as "grow" | "premium" | "elite",
                                "monthly",
                                "/business/dashboard/billing"
                              )}
                              className={cn(
                                "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                                isUpgrade
                                  ? "bg-[#124541] text-white hover:bg-[#0f3a35]"
                                  : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                              )}
                            >
                              {isUpgrade ? "Upgrade" : "Switch"}
                            </Link>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            {growTrialTableError ? (
              <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {growTrialTableError}
              </p>
            ) : null}

            {planKey !== "free" ? (
              <p className="text-xs text-gray-500">
                Upgrading mid-cycle? We credit the unused days on your current plan
                against today&apos;s charge, you only pay the difference.
              </p>
            ) : null}

            <p className="text-xs text-gray-500">
              You are on{" "}
              <span className="font-semibold text-[#0E0E0E]">
                {showTrialStatus ? `${currentPlanLabel} (trial)` : currentPlanLabel}
              </span>
              . Limits apply per business; paid plans use the same five sections with no upload cap in the app.
            </p>

            <button
              type="button"
              onClick={() => {
                if (pricingOpen) {
                  setPricingOpen(false);
                } else {
                  openInlinePricing();
                }
              }}
              aria-expanded={pricingOpen}
              aria-controls="inline-pricing-panel"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#124541] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f3a35]"
            >
              {pricingOpen ? "Hide pricing" : "View pricing & checkout"}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition",
                  pricingOpen ? "rotate-180" : ""
                )}
                aria-hidden
              />
            </button>

            {reasonMessage ? (
              <div
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="status"
              >
                {reasonMessage}
              </div>
            ) : null}

            {pendingPlanCode && pendingChangeLabel ? (
              <div
                className="rounded-lg border border-[#124541]/30 bg-[#124541]/5 px-4 py-3 text-sm text-[#0E0E0E]"
                role="status"
              >
                <p>
                  Your plan will change to{" "}
                  <span className="font-semibold">
                    {PLAN_LABELS[normalizePlanCodeToKey(pendingPlanCode)] ?? pendingPlanCode}
                  </span>{" "}
                  on <span className="font-semibold">{pendingChangeLabel}</span>.
                </p>
                <button
                  type="button"
                  disabled={cancelDowngradeBusy}
                  onClick={() => void handleCancelDowngrade()}
                  className="mt-3 inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-60"
                >
                  {cancelDowngradeBusy ? "Cancelling…" : "Cancel downgrade"}
                </button>
              </div>
            ) : null}

            {shouldPromotePlanChange ? (
              <button
                type="button"
                onClick={openInlinePricing}
                aria-expanded={pricingOpen}
                aria-controls="inline-pricing-panel"
                className="inline-flex items-center justify-center rounded-xl border border-[#124541] bg-white px-4 py-2.5 text-sm font-semibold text-[#124541] transition hover:bg-[#124541]/5"
              >
                Review available plans
              </button>
            ) : null}

            {pricingOpen ? (
              <section
                id="inline-pricing-panel"
                aria-label="Pricing plans"
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6"
              >
                <header className="flex flex-wrap items-start justify-between gap-3">
                  <div className="max-w-2xl">
                    <h2 className="text-lg font-semibold text-[#0E0E0E]">
                      Pricing plans
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      Compare plans, switch billing cadence, and choose the best
                      fit for your workspace, anything you&apos;re working on
                      elsewhere stays saved.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPricingOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    aria-expanded={pricingOpen}
                    aria-controls="inline-pricing-panel"
                  >
                    <ChevronDown
                      className="h-3.5 w-3.5 rotate-180"
                      aria-hidden
                    />
                    Hide pricing
                  </button>
                </header>
                <div className="mt-5">
                  <PricingPageContent
                    variant="dashboard"
                    dashboardBusinessId={businessId}
                    dashboardUserEmail={dashboardEmail}
                    dashboardCurrentPlanKey={planKey}
                    dashboardTrialEligible={trialEligible}
                    dashboardSubscriptionStatus={subscriptionStatusRaw}
                    dashboardTrialEndsAt={trialEndsAt}
                    onTrialStarted={bumpNavRefresh}
                    dashboardPricingHighlightContext={pricingHighlightContext}
                    embedInDashboard
                    dashboardHideMarketingHero
                    dashboardInitialBillingMode={parsedCycle}
                  />
                </div>
              </section>
            ) : null}
          </div>

          <section className="rounded-2xl border border-gray-200 bg-gray-50/80 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#0E0E0E]">Invoices and documents</h2>
            <p className="mt-1 text-sm text-gray-500">
              Downloadable invoices and billing documents will appear here when they are available.
            </p>
          </section>

          <PaymentHistory
            rows={paymentHistoryRows}
            loading={billingOverviewLoading}
            errorMessage={billingOverviewError}
          />
        </>
      )}
    </div>
  );
}