"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import type { PaidPlanKey, PlanConfirmPresentation } from "@/lib/billingPlanConfirm";

type Props = {
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
  presentation: PlanConfirmPresentation;
};

export default function UpgradeCheckoutCard({ plan, cycle, presentation }: Props) {
  const { selectedBusiness } = useBusinessContext();
  const { user } = useBusinessAuth();
  const [payBusy, setPayBusy] = useState(false);

  const openPaystack = useCallback(async () => {
    if (!selectedBusiness?.id) return;

    setPayBusy(true);
    try {
      const initRes = await fetch("/api/billing/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          plan,
          cycle,
        }),
      });

      let initJson: {
        error?: string;
        authorization_url?: string;
      } = {};
      try {
        initJson = (await initRes.json()) as typeof initJson;
      } catch {
        /* ignore */
      }

      if (!initRes.ok) {
        const errorMessage =
          typeof initJson.error === "string" ? initJson.error.trim() : "";
        const isConfigError =
          initRes.status >= 500 ||
          /paystack is not configured correctly/i.test(errorMessage) ||
          /paystack_secret_key|sk_test_|sk_live_|invalid key/i.test(errorMessage);
        window.alert(
          isConfigError
            ? "Payment system is temporarily unavailable"
            : errorMessage || "Could not start checkout."
        );
        setPayBusy(false);
        return;
      }

      const url = initJson.authorization_url?.trim();
      if (!url) {
        window.alert("Paystack did not return a checkout URL. Try again or check server logs.");
        setPayBusy(false);
        return;
      }

      window.location.assign(url);
    } catch {
      window.alert("Could not start payment. Check your connection and try again.");
      setPayBusy(false);
    }
  }, [cycle, plan, selectedBusiness?.id]);

  if (!selectedBusiness?.id) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
        Select a workspace to continue checkout.
      </div>
    );
  }

  const payerEmail = user?.email?.trim() ?? "";
  const canPay = Boolean(payerEmail);

  return (
    <div className="rounded-2xl border border-emerald-100/80 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(18,69,65,0.12)]">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-emerald-800/80">
        Checkout
      </p>
      <h1 className="mt-2 text-center text-2xl font-semibold capitalize tracking-tight text-[#0E0E0E]">
        {presentation.title}
      </h1>
      <p className="mt-4 text-center text-3xl font-semibold text-[#124541]">{presentation.priceLine}</p>
      {presentation.priceSubLine ? (
        <p className="mt-2 text-center text-sm leading-snug text-gray-600">{presentation.priceSubLine}</p>
      ) : null}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="text-sm font-medium text-gray-700">Includes</p>
        <ul className="mt-3 space-y-2.5 text-sm text-gray-600">
          {presentation.bullets.map((line) => (
            <li key={line} className="flex gap-2">
              <span
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700"
                aria-hidden
              >
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      {!canPay ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
          Add an email address to your Tellacity account to pay with Paystack.
        </p>
      ) : null}
      <button
        type="button"
        disabled={payBusy || !canPay}
        className="mt-8 w-full rounded-xl bg-[#124541] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void openPaystack()}
      >
        {payBusy ? "Redirecting…" : "Proceed to payment"}
      </button>
      <Link
        href="/business/dashboard/billing"
        className="mt-4 block text-center text-sm text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
      >
        Back to plans
      </Link>
    </div>
  );
}
