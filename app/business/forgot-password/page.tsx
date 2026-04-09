"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getBaseUrl } from "@/lib/getBaseUrl";

export default function BusinessForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email) {
      setError("Please enter your email.");
      return;
    }
    setLoading(true);
    const { error: resetError } = await supabaseBrowser().auth.resetPasswordForEmail(
      email.trim(),
      { redirectTo: `${getBaseUrl()}/business/reset-password` }
    );
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  };

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
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          {sent ? (
            <>
              <h1 className="text-2xl font-semibold text-[#0E0E0E]">
                Check your email
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                We sent a password reset link to{" "}
                <strong>{email}</strong>.
              </p>
              <p className="mt-3 text-sm text-gray-600">
                {"Didn't receive the email? Check your spam or junk folder."}
              </p>
              <Link
                href="/business/login"
                className="mt-6 inline-flex text-sm font-semibold text-[#1FAF9E]"
              >
                Back to sign in
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-[#0E0E0E]">
                Reset your password
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Enter your email to receive a reset link for your
                Tellacity Business account.
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="text-sm font-medium text-[#0E0E0E]">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
              <Link
                href="/business/login"
                className="mt-6 inline-flex text-sm font-semibold text-[#1FAF9E]"
              >
                Back to sign in
              </Link>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

