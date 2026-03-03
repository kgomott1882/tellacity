"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function BusinessLoginInner() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const nextPath     = searchParams.get("next") ?? "/business/dashboard";

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    const { error: signInError } = await supabaseBrowser().auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push(nextPath);
  };

  return (
    <main className="min-h-screen bg-[#0A1A18] px-4 py-10 flex flex-col items-center justify-center">
      <Link href="/" className="mb-8 flex items-center justify-center">
        <img
          src="/brand/TELLACITY%20LOGO%202A.png"
          alt="Tellacity"
          className="h-7 w-auto brightness-0 invert"
        />
      </Link>

      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-[#111F1D] p-8 shadow-2xl">
          <h1 className="text-2xl font-semibold text-white">Business sign in</h1>
          <p className="mt-2 text-sm text-neutral-400">
            Access your Tellacity business dashboard.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
              />
            </div>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-between text-sm">
            <Link
              href="/auth/forgot-password"
              className="text-[#1FAF9E] hover:underline"
            >
              Forgot password?
            </Link>
            <Link
              href="/for-business"
              className="text-neutral-400 hover:text-white"
            >
              Register your business
            </Link>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-neutral-600">
          <Link href="/privacy-policy" className="hover:text-neutral-400">
            Privacy notice
          </Link>
          <span className="mx-1">|</span>
          <Link href="/cookie-policy" className="hover:text-neutral-400">
            Cookie notice
          </Link>
        </p>
      </section>
    </main>
  );
}

export default function BusinessLoginPage() {
  return (
    <Suspense>
      <BusinessLoginInner />
    </Suspense>
  );
}
