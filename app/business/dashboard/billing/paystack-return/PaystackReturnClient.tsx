"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type Phase = "verifying" | "done" | "missing_params" | "verify_failed";

export default function PaystackReturnClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const reference = sp.get("reference")?.trim() || sp.get("trxref")?.trim();
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
          setPhase("verify_failed");
          setMessage(typeof data.error === "string" ? data.error : "Payment could not be verified.");
          return;
        }
        const plan = typeof data.plan === "string" ? data.plan.trim().toLowerCase() : "";
        setPhase("done");
        router.replace(
          `/business/dashboard/billing?success=true&plan=${encodeURIComponent(plan || "grow")}`
        );
      } catch {
        if (!cancelled) {
          setPhase("verify_failed");
          setMessage("Network error while confirming payment.");
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
        <div
          className="h-10 w-10 animate-spin rounded-full border-2 border-[#124541] border-t-transparent"
          role="status"
          aria-label="Redirecting"
        />
        <p className="mt-4 text-sm text-gray-600">Payment confirmed. Taking you to billing…</p>
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
        <h1 className="text-lg font-semibold text-[#0E0E0E]">We couldn&apos;t confirm that payment</h1>
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
