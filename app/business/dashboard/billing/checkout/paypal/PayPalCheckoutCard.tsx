"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBusinessContext } from "../../../_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import type { PaidPlanKey, PlanConfirmPresentation } from "@/lib/billingPlanConfirm";
import { POST_CHECKOUT_REDIRECT_SESSION_KEY } from "@/lib/upgradeFlow";

type Props = {
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
  presentation: PlanConfirmPresentation;
  returnTo?: string | null;
  pickerHref: string;
};

type CreditPreview = {
  currency: string;
  list_amount_minor: number;
  credit_applied_usd_minor: number;
  credit_applied_amount_minor: number;
  net_amount_minor: number;
  previous_plan_code?: string;
};

function formatCurrencyMinor(minor: number, currency: string): string {
  const amount = Math.max(0, minor) / 100;
  try {
    return amount.toLocaleString("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    });
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export default function PayPalCheckoutCard({
  plan,
  cycle,
  presentation,
  returnTo,
  pickerHref,
}: Props) {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const { user } = useBusinessAuth();
  const [payBusy, setPayBusy] = useState(false);
  const [preview, setPreview] = useState<CreditPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const safeReturnTo =
    returnTo &&
    returnTo.startsWith("/business/dashboard/") &&
    !returnTo.includes("..") &&
    !returnTo.includes("//")
      ? returnTo
      : null;

  const handleBack = useCallback(() => {
    router.push(pickerHref);
  }, [router, pickerHref]);

  const businessId = selectedBusiness?.id ?? null;
  const chargeCurrency = useMemo(() => "USD", []);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setPreviewLoading(true);
    (async () => {
      try {
        const qs = new URLSearchParams({
          plan,
          cycle,
          businessId,
        });
        const res = await fetch(`/api/billing/paypal/preview?${qs.toString()}`, {
          credentials: "same-origin",
        });
        if (!res.ok) {
          if (!cancelled) setPreview(null);
          return;
        }
        const data = (await res.json()) as CreditPreview;
        if (!cancelled) setPreview(data);
      } catch {
        if (!cancelled) setPreview(null);
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, plan, cycle]);

  const openPayPal = useCallback(async () => {
    if (!selectedBusiness?.id) return;

    setPayBusy(true);
    try {
      let paypalReturnTo: string | undefined;
      if (safeReturnTo) {
        paypalReturnTo = safeReturnTo;
      } else {
        try {
          const stored = window.sessionStorage
            .getItem(POST_CHECKOUT_REDIRECT_SESSION_KEY)
            ?.trim();
          if (stored?.startsWith("/business/dashboard/")) {
            paypalReturnTo = stored;
          }
        } catch {
          /* ignore */
        }
      }

      const initRes = await fetch("/api/billing/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          plan,
          cycle,
          ...(paypalReturnTo ? { returnTo: paypalReturnTo } : {}),
        }),
      });

      let initJson: {
        error?: string;
        approvalUrl?: string;
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
          /paypal is not configured correctly/i.test(errorMessage);
        window.alert(
          isConfigError
            ? "Payment system is temporarily unavailable"
            : errorMessage || "Could not start checkout."
        );
        setPayBusy(false);
        return;
      }

      const url = initJson.approvalUrl?.trim();
      if (!url) {
        window.alert("PayPal did not return a checkout URL. Try again or check server logs.");
        setPayBusy(false);
        return;
      }

      try {
        window.sessionStorage.removeItem(POST_CHECKOUT_REDIRECT_SESSION_KEY);
      } catch {
        /* ignore */
      }

      window.location.assign(url);
    } catch {
      window.alert("Could not start payment. Check your connection and try again.");
      setPayBusy(false);
    }
  }, [cycle, plan, safeReturnTo, selectedBusiness?.id]);

  if (!selectedBusiness?.id) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-600">
        Select a workspace to continue checkout.
      </div>
    );
  }

  const payerEmail = user?.email?.trim() ?? "";
  const canPay = Boolean(payerEmail);
  const previewCurrency = preview?.currency ?? chargeCurrency;
  const hasCredit = !!preview && preview.credit_applied_amount_minor > 0;
  const listLine = preview
    ? formatCurrencyMinor(preview.list_amount_minor, previewCurrency)
    : null;
  const creditLine = preview
    ? formatCurrencyMinor(preview.credit_applied_amount_minor, previewCurrency)
    : null;
  const netLine = preview
    ? formatCurrencyMinor(preview.net_amount_minor, previewCurrency)
    : null;

  return (
    <div className="rounded-2xl border border-blue-100/80 bg-white p-8 shadow-[0_8px_30px_-12px_rgba(0,48,135,0.12)]">
      <div className="mb-2 flex items-center justify-start">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-[#003087]"
        >
          <span aria-hidden>←</span>
          Back
        </button>
      </div>
      <p className="text-center text-xs font-medium uppercase tracking-wide text-[#003087]/80">
        PayPal checkout · USD
      </p>
      <h1 className="mt-2 text-center text-2xl font-semibold capitalize tracking-tight text-[#0E0E0E]">
        {presentation.title}
      </h1>
      <p className="mt-4 text-center text-3xl font-semibold text-[#003087]">{presentation.priceLine}</p>
      {presentation.priceSubLine ? (
        <p className="mt-2 text-center text-sm leading-snug text-gray-600">{presentation.priceSubLine}</p>
      ) : null}
      <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="text-sm font-medium text-gray-700">Includes</p>
        <ul className="mt-3 space-y-2.5 text-sm text-gray-600">
          {presentation.bullets.map((line) => (
            <li key={line} className="flex gap-2">
              <span
                className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-[#003087]"
                aria-hidden
              >
                ✓
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </div>
      {preview ? (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/80 p-4 text-sm">
          <div className="flex items-baseline justify-between text-gray-700">
            <span>Plan list price</span>
            <span className="font-medium text-gray-900">{listLine}</span>
          </div>
          {hasCredit ? (
            <div className="mt-2 flex items-baseline justify-between text-emerald-700">
              <span>
                Credit applied{" "}
                <span className="text-xs text-emerald-700/70">
                  (unused days on current plan)
                </span>
              </span>
              <span className="font-medium">−{creditLine}</span>
            </div>
          ) : null}
          <div className="mt-3 flex items-baseline justify-between border-t border-gray-200 pt-3 text-base font-semibold text-[#0E0E0E]">
            <span>Due today</span>
            <span>{netLine}</span>
          </div>
          {hasCredit ? (
            <p className="mt-2 text-xs text-gray-500">
              You&apos;re upgrading mid-cycle, we subtracted the unused portion of
              your current plan from today&apos;s charge.
            </p>
          ) : null}
        </div>
      ) : previewLoading ? (
        <div className="mt-6 h-16 animate-pulse rounded-xl border border-gray-200 bg-gray-100" />
      ) : null}
      {!canPay ? (
        <p className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-center text-xs text-amber-900">
          Add an email address to your Tellacity account to pay with PayPal.
        </p>
      ) : null}
      <button
        type="button"
        disabled={payBusy || !canPay}
        className="mt-6 w-full rounded-xl bg-[#003087] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#001f5c] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void openPayPal()}
      >
        {payBusy
          ? "Redirecting…"
          : hasCredit && netLine
            ? `Pay ${netLine} with PayPal`
            : "Continue to PayPal"}
      </button>
      <button
        type="button"
        onClick={handleBack}
        className="mt-4 block w-full text-center text-sm text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
      >
        Choose another payment method
      </button>
      {safeReturnTo ? (
        <p className="mt-2 text-center text-[11px] text-gray-400">
          Your queued photos and categories are saved, Back returns you to
          them without losing a thing.
        </p>
      ) : null}
    </div>
  );
}
