"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { billingCheckoutPickerPath } from "@/lib/billingCheckoutPaths";
import { nextTierUpgradeCtaLabel, type PlanKey } from "@/lib/plans";
import { startGrowTrial } from "@/lib/startGrowTrialClient";
import { trialDaysRemaining } from "@/lib/trialDaysRemaining";
import { cn } from "@/lib/utils";

type Props = {
  plan: PlanKey;
  businessId: string;
  trialEligible?: boolean;
  subscriptionStatus?: string | null;
  trialEndsAt?: string | null;
  onTrialStarted?: () => void;
};

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free Plan",
  grow: "Grow Plan",
  premium: "Premium Plan",
  elite: "Elite Plan",
};

const PLAN_BADGE_CLASSES: Record<PlanKey, string> = {
  free: "bg-gray-100 text-gray-800",
  grow: "bg-blue-100 text-blue-800",
  premium: "bg-purple-100 text-purple-800",
  elite: "bg-emerald-100 text-emerald-800",
};

export default function PlanStatusBanner({
  plan,
  businessId,
  trialEligible = false,
  subscriptionStatus = null,
  trialEndsAt = null,
  onTrialStarted,
}: Props) {
  const pathname = usePathname();
  const [starting, setStarting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isTrialing = subscriptionStatus === "trialing";
  const daysLeft = trialDaysRemaining(trialEndsAt);
  const showTrialCountdown = isTrialing && daysLeft != null;
  const trialUrgent = showTrialCountdown && daysLeft <= 3;

  const label = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const badgeLabel = showTrialCountdown
    ? `Grow trial · ${daysLeft} day${daysLeft === 1 ? "" : "s"} left`
    : label;
  const badgeClass = showTrialCountdown
    ? trialUrgent
      ? "bg-amber-100 text-amber-900"
      : "bg-blue-100 text-blue-800"
    : PLAN_BADGE_CLASSES[plan] ?? PLAN_BADGE_CLASSES.free;

  const isElite = plan === "elite";
  const showTrialCta = trialEligible && plan === "free" && !successMessage && !isTrialing;
  const returnTo =
    pathname && pathname.startsWith("/business/dashboard/")
      ? pathname
      : "/business/dashboard";
  const keepGrowHref = billingCheckoutPickerPath("grow", "monthly", returnTo);

  async function handleStartTrial() {
    if (!businessId || starting) return;
    setStarting(true);
    setErrorMessage(null);
    const result = await startGrowTrial(businessId);
    if (result.ok) {
      setSuccessMessage("Your Grow trial is active — 14 days");
      onTrialStarted?.();
    } else {
      setErrorMessage(result.message);
    }
    setStarting(false);
  }

  return (
    <div className="mt-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
              badgeClass,
            )}
          >
            {badgeLabel}
            {isElite && !showTrialCountdown && (
              <span className="ml-1 text-[10px]">✓</span>
            )}
          </span>
          {successMessage ? (
            <span className="text-xs font-medium text-emerald-700">{successMessage}</span>
          ) : null}
        </div>
        {!isElite && !successMessage ? (
          showTrialCta ? (
            <div className="flex flex-col items-stretch gap-1 sm:items-end">
              <button
                type="button"
                onClick={() => void handleStartTrial()}
                disabled={starting}
                className="inline-flex items-center justify-center rounded-md bg-[#278D82] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#217a70] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {starting ? "Starting…" : "Start your 14-day free Grow trial"}
              </button>
              <span className="text-[10px] text-gray-500 sm:text-right">No card required</span>
            </div>
          ) : showTrialCountdown ? (
            <Link
              href={keepGrowHref}
              className={cn(
                "inline-flex items-center justify-center rounded-md px-3 py-1.5 text-sm font-medium text-white transition-colors",
                trialUrgent
                  ? "bg-amber-700 hover:bg-amber-800"
                  : "bg-[#278D82] hover:bg-[#217a70]",
              )}
            >
              Keep Grow
            </Link>
          ) : (
            <Link
              href="/business/dashboard/settings/usage"
              className="inline-flex items-center justify-center rounded-md bg-[#278D82] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#217a70]"
            >
              {nextTierUpgradeCtaLabel(plan)}
            </Link>
          )
        ) : null}
      </div>
      {errorMessage ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}
