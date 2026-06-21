"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  ARTICLE_SUBMIT_SOURCE,
  clearArticleSubmitContext,
  isArticleSubmitIntent,
  readArticleSubmitContext,
  type ArticleSubmitIntent,
} from "@/lib/articleSubmitFlow";
import { formatPlanArticleLimitModal, nextTierUpgradeCtaLabel, type PlanKey } from "@/lib/plans";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";

type ArticleUsage = {
  used: number;
  limit: number;
  remaining: number;
  plan?: string;
  canSubmit?: boolean;
  requiresPlanUpgrade?: boolean;
};

type Props = {
  businessId: string;
  currentPlanKey: PlanKey;
  source: string | null;
  intentFromQuery: string | null;
};

export default function ArticleSubmitPricingBanner({
  businessId,
  currentPlanKey,
  source,
  intentFromQuery,
}: Props) {
  const [returnPath, setReturnPath] = useState<string | null>(null);
  const [intent, setIntent] = useState<ArticleSubmitIntent | null>(null);
  const [usage, setUsage] = useState<ArticleUsage | null>(null);

  useEffect(() => {
    if (source !== ARTICLE_SUBMIT_SOURCE && !isArticleSubmitIntent(intentFromQuery)) {
      return;
    }
    const ctx = readArticleSubmitContext();
    setReturnPath(ctx.returnPath);
    setIntent(
      isArticleSubmitIntent(intentFromQuery)
        ? intentFromQuery
        : ctx.intent,
    );
  }, [source, intentFromQuery]);

  useEffect(() => {
    if (source !== ARTICLE_SUBMIT_SOURCE || !businessId) return;
    void (async () => {
      try {
        const res = await dashboardApiGet<ArticleUsage>(
          `/api/business/${encodeURIComponent(businessId)}/articles/usage`,
        );
        setUsage(res);
      } catch {
        setUsage(null);
      }
    })();
  }, [businessId, source]);

  if (source !== ARTICLE_SUBMIT_SOURCE) return null;

  const canSubmitNow =
    usage?.canSubmit === true ||
    ((usage?.limit ?? 0) > 0 && (usage?.remaining ?? 0) > 0);
  const onPaidPlan = currentPlanKey !== "free";
  const upgradeLabel = nextTierUpgradeCtaLabel(currentPlanKey);

  let headline = "Finish submitting your article";
  let detail: ReactNode;

  if (canSubmitNow && onPaidPlan) {
    headline = "You're ready to submit";
    detail = (
      <>
        Your workspace is on <strong className="capitalize">{currentPlanKey}</strong> (
        {formatPlanArticleLimitModal(currentPlanKey)}). You still have{" "}
        <strong>{usage?.remaining ?? "-"}</strong> submission
        {(usage?.remaining ?? 0) === 1 ? "" : "s"} left this month. Return to your draft and click{" "}
        <strong>Submit</strong> to send it for review.
      </>
    );
  } else if (intent === "need_quota" && onPaidPlan) {
    headline = "Monthly article limit reached";
    detail = (
      <>
        You&apos;ve used all blog and case study submissions included on{" "}
        <strong className="capitalize">{currentPlanKey}</strong> this month (
        {formatPlanArticleLimitModal(currentPlanKey)}). Upgrade to{" "}
        <strong>{upgradeLabel.replace("Upgrade to ", "")}</strong> for more, or return next month.
      </>
    );
  } else if (currentPlanKey === "free") {
    detail = (
      <>
        To publish blogs and case studies for review, upgrade from <strong>Free</strong> to at
        least <strong>Grow</strong> ({formatPlanArticleLimitModal("grow")}). Your draft is saved , 
        you can submit right after upgrading.
      </>
    );
  } else {
    detail = (
      <>
        Review your plan below, then return to your saved draft when you&apos;re ready to submit
        for review.
      </>
    );
  }

  return (
    <div className="rounded-2xl border border-[#1FAF9E]/30 bg-[#E8F7F5] px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#0E4E45]">
        Article submission
      </p>
      <h2 className="mt-1 text-lg font-semibold text-[#0E0E0E]">{headline}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-700">{detail}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        {returnPath ? (
          <Link
            href={returnPath}
            onClick={() => clearArticleSubmitContext()}
            className="inline-flex items-center rounded-full bg-[#124541] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3a35]"
          >
            ← Back to your article
          </Link>
        ) : null}
        <button
          type="button"
          onClick={() => clearArticleSubmitContext()}
          className="inline-flex items-center rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}
