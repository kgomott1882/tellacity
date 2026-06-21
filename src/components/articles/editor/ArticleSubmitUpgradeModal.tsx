"use client";

import { useEffect, type ReactNode } from "react";
import {
  openArticleSubmitPricingPage,
  type ArticleSubmitIntent,
} from "@/lib/articleSubmitFlow";
import { formatPlanArticleLimitModal, type PlanKey } from "@/lib/plans";
import {
  GrowUnlockButton,
  GrowUnlockError,
} from "@/components/dashboard/GrowUnlockCta";
import { useGrowUnlockCta } from "@/hooks/useGrowUnlockCta";

export type ArticleSubmitBlockReason = "plan" | "quota";

type UsageSnapshot = {
  plan?: string;
  used?: number;
  limit?: number;
  remaining?: number;
  upgradeCta?: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  reason: ArticleSubmitBlockReason;
  usage: UsageSnapshot | null;
  articleReturnPath: string;
  businessId?: string | null;
  trialEligible?: boolean;
  subscriptionStatus?: string | null;
  onTrialStarted?: () => void;
};

function planLabel(plan: string | undefined): string {
  const p = (plan ?? "free").trim().toLowerCase();
  if (!p || p === "free") return "Free";
  return p.charAt(0).toUpperCase() + p.slice(1);
}

export default function ArticleSubmitUpgradeModal({
  open,
  onClose,
  reason,
  usage,
  articleReturnPath,
  businessId,
  trialEligible,
  subscriptionStatus,
  onTrialStarted,
}: Props) {
  const planKey = (usage?.plan ?? "free").trim().toLowerCase() as PlanKey;
  const onPaidPlan = planKey !== "free";
  const limit = usage?.limit ?? 0;
  const used = usage?.used ?? 0;
  const remaining = usage?.remaining ?? 0;
  const intent: ArticleSubmitIntent = reason === "quota" ? "need_quota" : "need_plan";
  const isGrowPlanBlock = reason === "plan" && !onPaidPlan;

  const growUnlock = useGrowUnlockCta({
    businessId,
    currentPlan: planKey,
    trialEligible: trialEligible === true,
    subscriptionStatus,
    onTrialStarted,
    onTrialSuccess: onClose,
    paidDestination: {
      type: "action",
      run: () => {
        onClose();
        openArticleSubmitPricingPage(articleReturnPath, intent);
      },
    },
  });

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  let title = "Upgrade to publish";
  let body: ReactNode;
  let footnote: ReactNode = null;
  let primaryLabel = usage?.upgradeCta ?? "Upgrade to Grow";

  if (reason === "plan" && !onPaidPlan) {
    body = (
      <>
        Your workspace is on the <strong>Free</strong> plan, which does not include blog or case
        study submissions. You can keep writing and saving drafts, but you need at least{" "}
        <strong>Grow</strong> to submit for review.
      </>
    );
    footnote = `Grow includes ${formatPlanArticleLimitModal("grow").replace("/month", " per month")}.`;
    primaryLabel = growUnlock.label;
  } else if (reason === "quota" && onPaidPlan) {
    title = "Monthly submission limit reached";
    body = (
      <>
        You&apos;ve used <strong>{used}</strong> of <strong>{limit}</strong> blog and case study
        submissions this month on your <strong>{planLabel(usage?.plan)}</strong> plan (
        {formatPlanArticleLimitModal(planKey)}). Upgrade for a higher monthly allowance, or wait
        until your credits reset.
      </>
    );
    primaryLabel = usage?.upgradeCta ?? "View higher plans";
  } else if (onPaidPlan && remaining > 0) {
    title = "Ready to submit";
    body = (
      <>
        Your <strong>{planLabel(usage?.plan)}</strong> plan includes article submissions and you
        still have <strong>{remaining}</strong> credit{remaining === 1 ? "" : "s"} left this month.
        Close this dialog and click <strong>Submit</strong> again to send your draft for review.
      </>
    );
    primaryLabel = "Back to article";
  } else {
    body = (
      <>
        Article submissions aren&apos;t available on your current plan settings. Review your
        workspace plan or contact support if this looks wrong.
      </>
    );
    primaryLabel = "Review plans";
  }

  const goToPricing = () => {
    onClose();
    openArticleSubmitPricingPage(articleReturnPath, intent);
  };

  const handlePrimary = () => {
    if (onPaidPlan && remaining > 0) {
      onClose();
      return;
    }
    if (isGrowPlanBlock) {
      growUnlock.onClick();
      return;
    }
    goToPricing();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="article-submit-upgrade-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 id="article-submit-upgrade-title" className="text-lg font-semibold text-[#0E0E0E]">
          {title}
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-gray-600">{body}</p>
        {footnote ? <p className="mt-2 text-sm text-gray-500">{footnote}</p> : null}
        <GrowUnlockError message={isGrowPlanBlock ? growUnlock.errorMessage : null} className="mt-4" />
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 sm:w-auto"
          >
            Keep editing draft
          </button>
          {isGrowPlanBlock ? (
            <GrowUnlockButton
              {...growUnlock}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#1FAF9E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#169786] sm:w-auto"
            />
          ) : (
            <button
              type="button"
              onClick={handlePrimary}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#1FAF9E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#169786] sm:w-auto"
            >
              {primaryLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
