"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ForgotPasswordMultiStep from "@/components/auth/ForgotPasswordMultiStep";

function BusinessForgotPasswordInner() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";
  const fromAdminClaim = searchParams.get("from") === "admin-claim";

  return (
    <ForgotPasswordMultiStep
      variant="business"
      loginHref="/business/login"
      initialEmail={email}
      flow={fromAdminClaim ? "setup" : "reset"}
      headerExtra={
        fromAdminClaim ? (
          <p className="mb-4 rounded-lg border border-[#1FAF9E]/25 bg-[#F4FBF9] px-3 py-2 text-sm text-[#124541]">
            Your business has been added to Tellacity. Create a password below to sign in to your
            dashboard.
          </p>
        ) : undefined
      }
    />
  );
}

export default function BusinessForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-[#F8F4F0] px-4 py-10 flex flex-col items-center justify-center">
      <Link href="/for-business" className="mb-8 flex items-center justify-center">
        <img
          src="/brand/TELLACITY%20-Line%20Icon.png"
          alt="Tellacity Business"
          className="h-16 w-auto sm:h-[4.5rem]"
        />
      </Link>

      <section className="w-full max-w-md">
        <Suspense
          fallback={
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm text-sm text-gray-600">
              Loading…
            </div>
          }
        >
          <BusinessForgotPasswordInner />
        </Suspense>
        <p className="mt-6 text-center text-xs text-gray-500">
          <Link href="/privacy-policy" className="hover:underline hover:text-[#0E0E0E]">
            Privacy notice
          </Link>
          <span className="mx-1">|</span>
          <Link href="/cookie-policy" className="hover:underline hover:text-[#0E0E0E]">
            Cookie notice
          </Link>
        </p>
      </section>
    </main>
  );
}
