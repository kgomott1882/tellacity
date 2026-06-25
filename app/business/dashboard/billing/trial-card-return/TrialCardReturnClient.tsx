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

export default function TrialCardReturnClient() {
  const sp = useSearchParams();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("verifying");
  const [message, setMessage] = useState<string | null>(null);

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
        const res = await fetch("/api/billing/start-trial/card/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ businessId, reference }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          ok?: boolean;
        };
        if (cancelled) return;
        if (!res.ok || data.ok !== true) {
          setPhase("verify_failed");
          setMessage(
            typeof data.error === "string" && data.error.trim()
              ? data.error.trim()
              : "Could not verify your card. Your trial was not started.",
          );
          return;
        }

        setPhase("done");
        window.setTimeout(() => {
          const returnTo = (sp.get("return_to") ?? "").trim();
          if (isSafeDashboardReturnPath(returnTo)) {
            const next = new URL(returnTo, window.location.origin);
            next.searchParams.set("trial_started", "1");
            router.replace(`${next.pathname}${next.search}`);
          } else {
            router.replace("/business/dashboard/billing?trial_started=1");
          }
        }, 1200);
      } catch {
        if (!cancelled) {
          setPhase("verify_failed");
          setMessage("Could not verify your card. Check your connection and try again.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, sp]);

  if (phase === "missing_params") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Missing payment details</h1>
        <p className="mt-2 text-sm text-gray-600">
          Return from Paystack without a reference. Your trial was not started.
        </p>
        <Link
          href="/business/dashboard/billing"
          className="mt-6 inline-flex text-sm font-semibold text-[#124541] underline-offset-2 hover:underline"
        >
          Back to billing
        </Link>
      </div>
    );
  }

  if (phase === "verify_failed") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Card verification failed</h1>
        <p className="mt-2 text-sm text-gray-600">{message}</p>
        <Link
          href="/business/dashboard/billing"
          className="mt-6 inline-flex text-sm font-semibold text-[#124541] underline-offset-2 hover:underline"
        >
          Back to billing
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-emerald-200 bg-white p-8 text-center">
        <h1 className="text-lg font-semibold text-[#0E0E0E]">Grow trial started</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your card is saved. You have 14 days of Grow access.
        </p>
        <p className="mt-4 text-xs text-gray-500">Redirecting…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center py-24 text-center">
      <div
        className="h-9 w-9 animate-spin rounded-full border-2 border-[#124541] border-t-transparent"
        role="status"
        aria-label="Verifying card"
      />
      <p className="mt-4 text-sm text-gray-600">Verifying your card and starting your trial…</p>
    </div>
  );
}
