"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { navigateBillingCheckoutBack } from "@/lib/billingCheckoutBack";
import type { PaidPlanKey, PlanConfirmPresentation } from "@/lib/billingPlanConfirm";
import {
  billingCheckoutPaypalPath,
  billingCheckoutPaystackPath,
} from "@/lib/billingCheckoutPaths";
import { paystackCurrencyPublic } from "@/lib/billingPaystack";

type Props = {
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
  presentation: PlanConfirmPresentation;
  returnTo?: string | null;
};

export default function PaymentMethodPicker({
  plan,
  cycle,
  presentation,
  returnTo,
}: Props) {
  const router = useRouter();
  const paystackHref = billingCheckoutPaystackPath(plan, cycle, returnTo);
  const paypalHref = billingCheckoutPaypalPath(plan, cycle, returnTo);
  const chargeCurrency = paystackCurrencyPublic();

  const handleBack = useCallback(() => {
    navigateBillingCheckoutBack(router, { returnTo });
  }, [router, returnTo]);

  return (
    <div className="rounded-2xl border border-emerald-100/80 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(18,69,65,0.12)]">
      <div className="mb-2 flex items-center justify-start">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#124541]"
        >
          <span aria-hidden>←</span>
          Back
        </button>
      </div>
      <p className="text-center text-xs font-medium uppercase tracking-wide text-emerald-800/80">
        Choose payment method
      </p>
      <h1 className="mt-2 text-center text-2xl font-semibold capitalize tracking-tight text-[#0E0E0E]">
        {presentation.title}
      </h1>
      <p className="mt-4 text-center text-3xl font-semibold text-[#124541]">{presentation.priceLine}</p>
      {presentation.priceSubLine ? (
        <p className="mt-2 text-center text-sm leading-snug text-gray-600">{presentation.priceSubLine}</p>
      ) : null}

      <p className="mt-8 text-center text-sm text-gray-600">
        Select how you&apos;d like to pay. Your plan activates after payment is confirmed.
      </p>

      <div className="mt-6 grid gap-3">
        <Link
          href={paypalHref}
          className="group flex flex-col rounded-xl border-2 border-gray-200 bg-white p-5 text-left transition hover:border-[#0070ba]/40 hover:shadow-sm"
        >
          <span className="flex items-center gap-3">
            <Image
              src="/brand/paypal.jpg"
              alt=""
              width={88}
              height={32}
              className="h-8 w-auto max-w-[88px] object-contain object-left"
            />
            <span className="text-base font-semibold text-[#0E0E0E]">PayPal</span>
          </span>
          <span className="mt-1 text-sm text-gray-600">
            PayPal balance or card. Charged in USD.
          </span>
          <span className="mt-3 text-sm font-semibold text-[#0070ba] group-hover:underline">
            Continue with PayPal →
          </span>
        </Link>

        <Link
          href={paystackHref}
          className="group flex flex-col rounded-xl border-2 border-gray-200 bg-white p-5 text-left transition hover:border-[#124541]/40 hover:shadow-sm"
        >
          <span className="flex items-center gap-3">
            <Image
              src="/brand/Paystack-Logo.png"
              alt=""
              width={88}
              height={32}
              className="h-8 w-auto max-w-[88px] object-contain object-left"
            />
            <span className="text-base font-semibold text-[#0E0E0E]">Paystack</span>
          </span>
          <span className="mt-1 text-sm text-gray-600">
            Card or bank transfer. Charged in {chargeCurrency} (South Africa).
          </span>
          <span className="mt-3 text-sm font-semibold text-[#124541] group-hover:underline">
            Continue with Paystack →
          </span>
        </Link>
      </div>
    </div>
  );
}
