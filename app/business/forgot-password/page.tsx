"use client";

import Link from "next/link";
import ForgotPasswordMultiStep from "@/components/auth/ForgotPasswordMultiStep";

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
        <ForgotPasswordMultiStep variant="business" loginHref="/business/login" />
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
