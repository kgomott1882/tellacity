"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "verifying" | "done" | "missing_params" | "verify_failed";

function isSafeDashboardReturnPath(path: string): boolean {
  return (
    path.startsWith("/business/dashboard/") && !path.includes("..") && !path.includes("//")
  );
}

export default function PaystackReturnClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState<string | null>(null);
  const [successPlan, setSuccessPlan] = useState<string | null>(null);
  const [redirectsToDashboard, setRedirectsToDashboard] = useState(false);

  useEffect(() => {
    const reference =
      sp.get("reference")?.trim() ||
      sp.get("trxref")?.trim() ||
      sp.get("txref")?.trim();
    const businessId = sp.get("business_id")?.trim();

    if (!reference || !businessId) {
      setPhase("missing_params");
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch("/api/billing/paystack/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ reference, businessId }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          plan?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          const errorMessage = typeof data.error === "string" ? data.error.trim() : "";
          const isConfigError =
            res.status >= 500 ||
            /paystack is not configured correctly/i.test(errorMessage) ||
            /paystack_secret_key|sk_test_|sk_live_|invalid key/i.test(errorMessage);
          setPhase("verify_failed");
          setMessage(
            isConfigError
              ? "Payment system is temporarily unavailable"
              : errorMessage || "Payment not successful. Please try again from billing."
          );
          return;
        }
        const plan = typeof data.plan === "string" ? data.plan.trim().toLowerCase() : "";
        setSuccessPlan(plan || null);
        const returnToPreview = (sp.get("return_to") ?? "").trim();
        setRedirectsToDashboard(isSafeDashboardReturnPath(returnToPreview));
        setPhase("done");
        window.setTimeout(() => {
          const returnTo = (sp.get("return_to") ?? "").trim();
          const safeReturn = isSafeDashboardReturnPath(returnTo);
          if (safeReturn) {
            const next = new URL(returnTo, window.location.origin);
            next.searchParams.set("upgrade_success", "1");
            next.searchParams.set("plan", plan || "grow");
            router.replace(`${next.pathname}${next.search}`);
          } else {
            router.replace(
              `/business/dashboard/billing?success=true&plan=${encodeURIComponent(plan || "grow")}`
            );
          }
        }, 1400);
      } catch {
        if (!cancelled) {
          setPhase("verify_failed");
          setMessage("Payment not successful. Network error while confirming payment.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, sp]);

  if (phase === "done") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
          <span className="text-xl" aria-hidden>
            ✓
          </span>
        </div>
        <h1 className="text-lg font-semibold text-[#0E0E0E]">
          Payment successful, congratulations for your upgrade.
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {successPlan ? `Your ${successPlan} plan is now active. ` : ""}
          {redirectsToDashboard ? "Taking you to your dashboard…" : "Taking you back to billing…"}
        </p>
      </div>
    );
  }

  if (phase === "missing_params") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Payment not completed</h1>
        <p className="mt-2 text-sm text-gray-600">
          This page needs a valid Paystack reference. If you closed the payment window, you can try
          again from billing.
        </p>
        <Link
          href="/business/dashboard/billing"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#124541] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f3a35]"
        >
          Back to billing
        </Link>
      </div>
    );
  }

  if (phase === "verify_failed") {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md flex-col justify-center px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">
          Payment not successful. Please try again.
        </h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <p className="mt-3 text-xs text-gray-500">
          If you were charged, contact support with your Paystack reference from your email receipt.
        </p>
        <Link
          href="/business/dashboard/billing"
          className="mt-8 inline-flex items-center justify-center rounded-xl bg-[#124541] px-5 py-3 text-sm font-semibold text-white hover:bg-[#0f3a35]"
        >
          Back to billing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <div
        className="h-10 w-10 animate-spin rounded-full border-2 border-[#124541] border-t-transparent"
        role="status"
        aria-label="Verifying payment"
      />
      <p className="mt-4 text-sm text-gray-600">Confirming your payment with Paystack…</p>
    </div>
  );
}
