"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import type { PaidPlanKey, PlanConfirmPresentation } from "@/lib/billingPlanConfirm";
import type { PaystackChargeResolution } from "@/lib/billingPaystack";

type Props = {
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
  presentation: PlanConfirmPresentation;
  chargePreview: PaystackChargeResolution;
};

export default function BillingCheckoutClient({
  plan,
  cycle,
  presentation,
  chargePreview,
}: Props) {
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
        window.alert(
          typeof initJson.error === "string"
            ? initJson.error
            : "Could not start checkout. Check Paystack keys on the server (PAYSTACK_SECRET_KEY)."
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
    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-gray-500">
        Checkout
      </p>
      <h1 className="mt-2 text-center text-xl font-semibold text-[#0E0E0E]">Complete your upgrade</h1>
      <p className="mt-1 text-center text-sm text-gray-500">{presentation.title}</p>
      <p className="mt-4 text-center text-2xl font-semibold text-[#124541]">{presentation.priceLine}</p>
      {presentation.priceSubLine ? (
        <p className="mt-2 text-center text-sm leading-snug text-gray-600">{presentation.priceSubLine}</p>
      ) : null}
      {chargePreview.currency === "ZAR" &&
      chargePreview.settleMajor != null &&
      chargePreview.fxUsdZar != null ? (
        <p className="mt-4 rounded-lg border border-emerald-100/80 bg-emerald-50/40 px-3 py-3 text-center text-xs leading-relaxed text-gray-700">
          Prices on Tellacity are in <span className="font-medium">USD</span>. Paystack (South Africa)
          collects in <span className="font-medium">ZAR</span>. At about{" "}
          <span className="font-medium">1 USD = {chargePreview.fxUsdZar.toFixed(2)} ZAR</span>, expect
          roughly{" "}
          <span className="font-medium">
            {new Intl.NumberFormat("en-ZA", {
              style: "currency",
              currency: "ZAR",
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(chargePreview.settleMajor)}
          </span>{" "}
          for this plan — that matches the amount on Paystack’s full checkout page. If you pay
          from outside South Africa (for example with a Canadian card), your bank may show{" "}
          <span className="font-medium">CAD</span> or another currency on your statement; that
          conversion and any extra fee are set by your card issuer, not Tellacity.
        </p>
      ) : (
        <p className="mt-4 rounded-lg border border-gray-100 bg-gray-50/80 px-3 py-3 text-center text-xs leading-relaxed text-gray-600">
          This payment is processed in{" "}
          <span className="font-medium">{chargePreview.currency}</span> on the Paystack checkout page.
        </p>
      )}
      <p className="mt-6 text-xs font-medium text-gray-600">Includes</p>
      <ul className="mt-2 space-y-2 text-sm text-gray-600">
        {presentation.bullets.slice(0, 4).map((line) => (
          <li key={line} className="flex gap-2">
            <span
              className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-semibold text-emerald-700"
              aria-hidden
            >
              ✓
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      {!canPay ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
          Add an email address to your Tellacity account to pay with Paystack.
        </p>
      ) : null}
      <button
        type="button"
        disabled={payBusy || !canPay}
        className="mt-8 w-full rounded-xl bg-[#124541] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void openPaystack()}
      >
        {payBusy ? "Redirecting to Paystack…" : "Continue to Paystack checkout"}
      </button>
      <p className="mt-3 text-center text-[11px] leading-relaxed text-gray-500">
        You will leave this site for a secure, full-page Paystack payment step, then return here to
        finish.
      </p>
      <p className="mt-2 text-center text-[11px] leading-relaxed text-gray-500">
        Webhook URL in Paystack:{" "}
        <span className="break-all font-mono text-[10px]">/api/webhooks/paystack</span>
      </p>
      <Link
        href="/business/dashboard/billing"
        className="mt-4 block text-center text-sm text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
      >
        Back to plans
      </Link>
    </div>
  );
}
