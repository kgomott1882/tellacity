"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import { PricingPageContent } from "@/components/pricing/PricingPageContent";

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  grow: "Grow",
  premium: "Premium",
  elite: "Elite",
};

const PRICING_SCROLL_REASONS = new Set(["limit", "analytics", "widget", "team"]);

type UpgradeVerifyState = "idle" | "checking" | "ok";

/** URL query flags often vary in casing or value across clients. */
function queryFlagTrue(value: string | null | undefined): boolean {
  const v = (value ?? "").trim().toLowerCase();
  return v === "true" || v === "1" || v === "yes";
}

/**
 * After SPA navigation, `useSearchParams()` can briefly omit the query string while
 * `window.location` is already correct. On the billing route, prefer the address bar.
 */
function billingPathMatch(pathname: string | null): boolean {
  const p = (pathname ?? "").replace(/\/$/, "") || "";
  return p === "/business/dashboard/billing";
}

function useBillingSearchParams() {
  const pathname = usePathname();
  const nextSp = useSearchParams();
  const nextSpString = nextSp.toString();
  const q = useMemo(() => {
    if (typeof window !== "undefined" && billingPathMatch(pathname)) {
      return new URLSearchParams(window.location.search);
    }
    return new URLSearchParams(nextSpString);
  }, [pathname, nextSpString]);
  return q;
}

export default function BillingPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const { user } = useBusinessAuth();
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
    !success &&
    parsedCheckoutPlan &&
    isPaidPlanForConfirm(parsedCheckoutPlan)
      ? parsedCheckoutPlan
      : null;
  const dashboardInitialBillingMode = parsedCycle;

  const pricingSectionRef = useRef<HTMLElement | null>(null);
  const [upgradeVerifyState, setUpgradeVerifyState] =
    useState<UpgradeVerifyState>("idle");

  const businessId = selectedBusiness?.id ?? null;
  const planKey = normalizePlanCodeToKey(selectedBusiness?.plan);
  const shouldScrollToPricing =
    Boolean(businessId) && reason != null && PRICING_SCROLL_REASONS.has(reason);
  const emphasizePremiumAnchor = shouldScrollToPricing;

  useEffect(() => {
    if (!shouldScrollToPricing || !pricingSectionRef.current) return;
    const id = window.requestAnimationFrame(() => {
      pricingSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [shouldScrollToPricing]);

  useEffect(() => {
    if (!dashboardCheckoutPlanFromUrl) return;
    const id = window.requestAnimationFrame(() => {
      document
        .getElementById(`plan-card-${dashboardCheckoutPlanFromUrl}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    return () => window.cancelAnimationFrame(id);
  }, [dashboardCheckoutPlanFromUrl]);

  /** Legacy URLs: ?upgrade=true&plan=&cycle= → dedicated checkout page. */
  useEffect(() => {
    if (!upgrade || !parsedCheckoutPlan || !isPaidPlanForConfirm(parsedCheckoutPlan)) {
      return;
    }
    const qs = new URLSearchParams({
      plan: parsedCheckoutPlan,
      cycle: parsedCycle,
    });
    router.replace(`/business/dashboard/billing/checkout?${qs.toString()}`);
  }, [upgrade, parsedCheckoutPlan, parsedCycle, router]);

  useEffect(() => {
    if (!showSuccess || !successPlan || !businessId) {
      setUpgradeVerifyState("idle");
      return;
    }

    let cancelled = false;
    setUpgradeVerifyState("checking");

    void (async () => {
      try {
        const res = await fetch(
          `/api/billing/plan?businessId=${encodeURIComponent(businessId)}`
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
  }, [showSuccess, successPlan, businessId, router]);

  if (!businessId || !selectedBusiness) return null;

  if (upgrade && parsedCheckoutPlan && isPaidPlanForConfirm(parsedCheckoutPlan)) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
        <div
          className="h-9 w-9 animate-spin rounded-full border-2 border-[#124541] border-t-transparent"
          role="status"
          aria-label="Opening checkout"
        />
        <p className="mt-4 text-sm text-gray-600">Opening checkout…</p>
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

  const dashboardEmail = user?.email?.trim() ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 pb-12">
      {showSuccess && successPlan ? (
        upgradeVerifyState === "checking" || upgradeVerifyState === "idle" ? (
          <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
            <div
              className="h-10 w-10 animate-spin rounded-full border-2 border-[#124541] border-t-transparent"
              role="status"
              aria-label="Verifying upgrade"
            />
            <p className="mt-4 text-sm text-gray-600">Verifying your upgrade…</p>
          </div>
        ) : upgradeVerifyState === "ok" ? (
          <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-6">
            <div
              className="w-full rounded-2xl border border-emerald-100 bg-white p-10 text-center shadow-[0_8px_30px_-12px_rgba(18,69,65,0.12)]"
              role="status"
            >
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                <span className="text-xl" aria-hidden>
                  ✓
                </span>
              </div>
              <h2 className="text-xl font-semibold text-[#0E0E0E]">
                You&apos;re now on {PLAN_LABELS[successPlan]}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-gray-600">
                Your upgrade was successful. Your new features are now available.
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
          <div className="max-w-2xl space-y-6">
            <SimplePage
              title="Billing & Plans"
              subtitle="Manage your subscription and usage for this workspace."
            />

            {reasonMessage ? (
              <div
                className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
                role="status"
              >
                {reasonMessage}
              </div>
            ) : null}
          </div>

          <section
            ref={pricingSectionRef}
            id="dashboard-pricing-compare"
            aria-label="Plans and pricing"
            className="scroll-mt-24 border-t border-gray-200 pt-10"
          >
            <PricingPageContent
              variant="dashboard"
              dashboardBusinessId={selectedBusiness.id}
              dashboardUserEmail={dashboardEmail}
              dashboardCurrentPlanKey={planKey}
              emphasizePremiumAnchor={emphasizePremiumAnchor}
              embedInDashboard
              dashboardHideMarketingHero
              dashboardInitialBillingMode={dashboardInitialBillingMode}
            />
          </section>
        </>
      )}
    </div>
  );
}
