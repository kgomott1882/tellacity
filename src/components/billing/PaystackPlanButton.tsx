"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { paystackCurrencyPublic } from "@/lib/billingPaystack";
import type { PaidPlanKey } from "@/lib/billingPlanConfirm";

type PreviewJson = {
  currency?: string;
  approx_settle_major?: number | null;
  fx_usd_zar?: number | null;
};

type Props = {
  businessId: string;
  plan: PaidPlanKey;
  cycle?: "monthly" | "annual";
  className?: string;
  children: ReactNode;
};

export default function PaystackPlanButton({
  businessId,
  plan,
  cycle = "monthly",
  className,
  children,
}: Props) {
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<PreviewJson | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(
          `/api/billing/paystack/preview?plan=${encodeURIComponent(plan)}&cycle=${encodeURIComponent(cycle)}`
        );
        const j = (await res.json().catch(() => ({}))) as PreviewJson;
        if (!cancelled && res.ok) setPreview(j);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [plan, cycle]);

  const handlePayment = useCallback(async () => {
    setBusy(true);
    try {
      const initRes = await fetch("/api/billing/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ businessId, plan, cycle }),
      });
      const initJson = (await initRes.json().catch(() => ({}))) as {
        error?: string;
        authorization_url?: string;
      };
      if (!initRes.ok) {
        window.alert(
          typeof initJson.error === "string" ? initJson.error : "Could not start checkout."
        );
        setBusy(false);
        return;
      }
      const url = initJson.authorization_url?.trim();
      if (!url) {
        window.alert("Paystack did not return a checkout URL. Try again.");
        setBusy(false);
        return;
      }
      window.location.assign(url);
    } catch {
      window.alert("Could not start payment. Check your connection and try again.");
      setBusy(false);
    }
  }, [businessId, cycle, plan]);

  const zarNote =
    preview?.currency === "ZAR" &&
    typeof preview.approx_settle_major === "number" &&
    Number.isFinite(preview.approx_settle_major) &&
    typeof preview.fx_usd_zar === "number" &&
    Number.isFinite(preview.fx_usd_zar) ? (
      <p className="mt-2 max-w-md text-xs leading-relaxed text-gray-600">
        Listed in <span className="font-medium">USD</span>; Paystack collects about{" "}
        <span className="font-medium">
          {new Intl.NumberFormat("en-ZA", {
            style: "currency",
            currency: "ZAR",
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(preview.approx_settle_major)}
        </span>{" "}
        (≈1 USD = {preview.fx_usd_zar.toFixed(2)} ZAR).
      </p>
    ) : preview?.currency && preview.currency !== "ZAR" ? (
      <p className="mt-2 max-w-md text-xs text-gray-600">
        Processed in <span className="font-medium">{paystackCurrencyPublic()}</span> on Paystack.
      </p>
    ) : null;

  return (
    <div>
      <button type="button" disabled={busy} onClick={() => void handlePayment()} className={className}>
        {busy ? "Redirecting…" : children}
      </button>
      {zarNote}
    </div>
  );
}
