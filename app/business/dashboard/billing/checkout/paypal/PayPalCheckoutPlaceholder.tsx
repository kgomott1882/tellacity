"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { PlanConfirmPresentation } from "@/lib/billingPlanConfirm";
import { billingCheckoutPickerPath } from "@/lib/billingCheckoutPaths";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";

type Props = {
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
  presentation: PlanConfirmPresentation;
  returnTo?: string | null;
  pickerHref: string;
};

export default function PayPalCheckoutPlaceholder({
  plan,
  cycle,
  presentation,
  returnTo,
  pickerHref,
}: Props) {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.push(pickerHref);
  }, [router, pickerHref]);

  return (
    <div className="rounded-2xl border border-emerald-100/80 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(18,69,65,0.12)]">
      <div className="mb-2 flex items-center justify-start">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#124541]"
        >
          <span aria-hidden>←</span>
          Back to payment methods
        </button>
      </div>
      <p className="text-center text-xs font-medium uppercase tracking-wide text-[#0070ba]">
        PayPal · USD
      </p>
      <h1 className="mt-2 text-center text-2xl font-semibold capitalize tracking-tight text-[#0E0E0E]">
        {presentation.title}
      </h1>
      <p className="mt-4 text-center text-3xl font-semibold text-[#124541]">{presentation.priceLine}</p>

      <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50/60 px-4 py-4 text-sm text-gray-700">
        <p className="font-medium text-[#0E0E0E]">PayPal checkout is being connected</p>
        <p className="mt-2 leading-relaxed">
          This route is ready. The next step wires your PayPal Sandbox credentials on the server
          so you can pay in <strong>USD</strong> here. Paystack stays on its own route unchanged.
        </p>
        <p className="mt-3 text-xs text-gray-500">
          Add <code className="rounded bg-white px-1">PAYPAL_CLIENT_ID</code> and{" "}
          <code className="rounded bg-white px-1">PAYPAL_CLIENT_SECRET</code> to{" "}
          <code className="rounded bg-white px-1">.env.local</code>. Do not paste secrets in chat.
        </p>
      </div>

      <Link
        href={billingCheckoutPickerPath(plan, cycle, returnTo)}
        className="mt-6 block w-full rounded-xl border border-gray-200 bg-white px-5 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
      >
        Choose another payment method
      </Link>
    </div>
  );
}
