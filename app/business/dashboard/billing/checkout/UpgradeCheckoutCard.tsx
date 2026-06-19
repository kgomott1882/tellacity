"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import type { PaidPlanKey, PlanConfirmPresentation } from "@/lib/billingPlanConfirm";
import { navigateBillingCheckoutBack } from "@/lib/billingCheckoutBack";
import { POST_CHECKOUT_REDIRECT_SESSION_KEY } from "@/lib/upgradeFlow";
import { paystackCurrencyPublic } from "@/lib/billingPaystack";

type Props = {
  plan: PaidPlanKey;
  cycle: "monthly" | "annual";
  presentation: PlanConfirmPresentation;
  /**
   * Dashboard path to send the user back to if they cancel checkout. When
   * set (e.g. the "Upload more photos" staging flow), `Back` routes here
   * via Next.js SPA navigation so any in-memory dashboard state (staged
   * photos, custom categories, active chip) survives intact.
   */
  returnTo?: string | null;
  /** When set, Back returns to the payment method picker (Paystack route). */
  backHref?: string | null;
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

export default function UpgradeCheckoutCard({
  plan,
  cycle,
  presentation,
  returnTo,
  backHref,
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

  /**
   * "Back" always returns to the immediate previous screen so the user
   * lands in the exact state they left (e.g. the inline pricing panel
   * still expanded on the billing page, or the in-memory staging queue
   * on the "Upload more photos" page).
   *
   * - If the page was opened directly (no in-app history), router.back()
   *   would be a no-op; we fall back to an explicit `returnTo` when set,
   *   otherwise to the billing dashboard.
   * - We detect "opened directly" by checking window.history.length <= 1
   *   at click time; this keeps SSR-safe since it runs in the handler.
   */
  const handleBack = useCallback(() => {
    navigateBillingCheckoutBack(router, { returnTo: safeReturnTo, backHref });
  }, [router, safeReturnTo, backHref]);

  const businessId = selectedBusiness?.id ?? null;
  const chargeCurrency = useMemo(() => paystackCurrencyPublic(), []);

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
        const res = await fetch(`/api/billing/paystack/preview?${qs.toString()}`, {
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

  const openPaystack = useCallback(async () => {
    if (!selectedBusiness?.id) return;

    setPayBusy(true);
    try {
      // Prefer an explicit `returnTo` (prop), then the stashed session value,
      // then fall back to billing. Anything else could point off-dashboard.
      let paystackReturnTo: string | undefined;
      if (safeReturnTo) {
        paystackReturnTo = safeReturnTo;
      } else {
        try {
          const stored = window.sessionStorage
            .getItem(POST_CHECKOUT_REDIRECT_SESSION_KEY)
            ?.trim();
          if (stored?.startsWith("/business/dashboard/")) {
            paystackReturnTo = stored;
          }
        } catch {
          /* ignore */
        }
      }

      const initRes = await fetch("/api/billing/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          businessId: selectedBusiness.id,
          plan,
          cycle,
          ...(paystackReturnTo ? { returnTo: paystackReturnTo } : {}),
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
        Paystack checkout
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
          Add an email address to your Tellacity account to pay with Paystack.
        </p>
      ) : null}
      <button
        type="button"
        disabled={payBusy || !canPay}
        className="mt-6 w-full rounded-xl bg-[#124541] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60"
        onClick={() => void openPaystack()}
      >
        {payBusy
          ? "Redirecting…"
          : hasCredit && netLine
            ? `Pay ${netLine}`
            : "Proceed to payment"}
      </button>
      <button
        type="button"
        onClick={handleBack}
        className="mt-4 block w-full text-center text-sm text-gray-500 underline-offset-2 hover:text-gray-800 hover:underline"
      >
        Back
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
