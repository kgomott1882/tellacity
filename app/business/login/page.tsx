"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { handleRedirect } from "@/lib/postLoginRedirect";

export default function BusinessLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setLoading(true);
    try {
      const { data: signInData, error: signInError } = await supabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      const userId = signInData.user.id;

      // Business profile may exist under a different auth user id — migrate to this session.
      const supabase = supabaseBrowser();
      let { data: existingProfile } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("id", userId)
        .maybeSingle();

      if (!existingProfile) {
        const { data: profileByEmail } = await supabase
          .from("business_profiles")
          .select("id, email")
          .eq("email", email.trim().toLowerCase())
          .maybeSingle();

        if (profileByEmail && profileByEmail.id !== userId) {
          const oldUserId = profileByEmail.id;
          const tempEmail = `${email.trim().toLowerCase()}.old.${Date.now()}`;
          await supabase
            .from("business_profiles")
            .update({ email: tempEmail })
            .eq("id", oldUserId);

          await supabase
            .from("business_profiles")
            .upsert({
              id: userId,
              email: email.trim().toLowerCase(),
              business_name: email.trim().split("@")[0] || "Business",
            }, { onConflict: "id" });

          await supabase
            .from("businesses")
            .update({ owner_id: userId })
            .eq("owner_id", oldUserId);

          existingProfile = { id: userId };
        }
      }

      await handleRedirect(userId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
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
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Sign in</h1>
          <p className="mt-2 text-sm text-gray-600">
            Access Your Tellacity Business Dashboard
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
            <div>
              <label className="text-sm font-medium text-[#0E0E0E]">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
          <div className="mt-6 flex items-center justify-between text-sm">
            <Link href="/business/forgot-password" className="text-[#1FAF9E]">
              Forgot password?
            </Link>
            <Link href="/business/signup" className="font-semibold text-[#1FAF9E]">
              Create account
            </Link>
          </div>
          <p className="mt-6 text-center text-xs text-gray-500">
            <Link
              href="/privacy-policy"
              className="hover:underline hover:text-[#0E0E0E]"
            >
              Privacy notice
            </Link>
            <span className="mx-1">|</span>
            <Link
              href="/cookie-policy"
              className="hover:underline hover:text-[#0E0E0E]"
            >
              Cookie notice
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
