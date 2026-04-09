"use client";

import Link from "next/link";
import ForgotPasswordMultiStep from "@/components/auth/ForgotPasswordMultiStep";

export default function ForgotPasswordPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-md px-4 py-16">
        <ForgotPasswordMultiStep variant="consumer" loginHref="/auth/login" />
        <p className="mt-8 text-center text-xs text-gray-500">
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
