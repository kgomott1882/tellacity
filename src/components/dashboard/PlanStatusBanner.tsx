"use client";

import Link from "next/link";
import type { PlanKey } from "@/lib/plans";

type Props = {
  plan: PlanKey;
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

export default function PlanStatusBanner({ plan }: Props) {
  const label = PLAN_LABELS[plan] ?? PLAN_LABELS.free;
  const badgeClass = PLAN_BADGE_CLASSES[plan] ?? PLAN_BADGE_CLASSES.free;
  const isElite = plan === "elite";

  return (
    <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-xs sm:text-sm">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}
        >
          {label}
          {isElite && <span className="ml-1 text-[10px]">✓</span>}
        </span>
      </div>
      {!isElite && (
        <Link
          href="/business/dashboard/billing"
          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md bg-[#278D82] text-white hover:bg-[#217a70] transition-colors"
        >
          Upgrade
        </Link>
      )}
    </div>
  );
}

