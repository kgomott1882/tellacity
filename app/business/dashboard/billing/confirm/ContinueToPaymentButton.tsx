"use client";

import type { PaidPlanKey } from "@/lib/billingPlanConfirm";

type Props = {
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
};

export default function ContinueToPaymentButton({ plan, cycle }: Props) {
  return (
    <button
      type="button"
      className="mt-8 w-full rounded-xl bg-[#124541] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3a35]"
      onClick={() => {
        const qs = new URLSearchParams({ plan, cycle });
        window.location.assign(`/business/dashboard/billing/checkout?${qs.toString()}`);
      }}
    >
      Continue to Payment
    </button>
  );
}
