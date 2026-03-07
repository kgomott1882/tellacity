"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function BusinessLoginPage() {
  const router = useRouter();
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
    const { data: signInData, error: signInError } = await supabaseBrowser().auth.signInWithPassword({
      email,
      password,
    });
    
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    // Business is determined by user id or by email (profile may exist under a different auth user id).
    const supabase = supabaseBrowser();
    let { data: existingProfile } = await supabase
      .from("business_profiles")
      .select("id")
      .eq("id", signInData.user.id)
      .maybeSingle();

    if (!existingProfile) {
      // Check by email: this email may have a business profile under a different user id (e.g. from another signup).
      const { data: profileByEmail } = await supabase
        .from("business_profiles")
        .select("id, email")
        .eq("email", email.trim().toLowerCase())
        .maybeSingle();

      if (profileByEmail && profileByEmail.id !== signInData.user.id) {
        // Migrate: assign this business profile and its businesses to the currently signed-in user.
        const oldUserId = profileByEmail.id;
        const tempEmail = `${email.trim().toLowerCase()}.old.${Date.now()}`;
        await supabase
          .from("business_profiles")
          .update({ email: tempEmail })
          .eq("id", oldUserId);

        await supabase
          .from("business_profiles")
          .upsert({
            id: signInData.user.id,
            email: email.trim().toLowerCase(),
            business_name: email.trim().split("@")[0] || "Business",
          }, { onConflict: "id" });

        // Reassign any businesses owned by the old user to the current user
        await supabase
          .from("businesses")
          .update({ owner_id: signInData.user.id })
          .eq("owner_id", oldUserId);

        existingProfile = { id: signInData.user.id };
      }
    }

    setLoading(false);

    if (!existingProfile) {
      setError(
        "No business account found for this email. You are signed in, but this email does not have a Tellacity Business profile yet."
      );
      return;
    }

    router.push("/business/dashboard");
  };

  return (
    <main className="min-h-screen bg-[#F8F4F0] px-4 py-10 flex flex-col items-center justify-center">
      <Link href="/for-business" className="mb-8 flex items-center justify-center">
        <img
          src="/brand/Tellacity%20-Business%20Logo.png"
          alt="Tellacity Business"
          className="h-8 w-auto"
        />
      </Link>

      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Sign in</h1>
          <p className="mt-2 text-sm text-gray-600">
            Access Your Tellacity Business Dashboard
          </p>
          <div className="mt-6 space-y-3">
            <button
              type="button"
              disabled={loading}
              onClick={async () => {
                setError("");
                try {
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem(
                      "tellacity_auth_redirect",
                      "true"
                    );
                  }
                  const supabase = supabaseBrowser();
                  const { error: oauthError } = await supabase.auth.signInWithOAuth(
                    {
                      provider: "google",
                      options: {
                        redirectTo:
                          typeof window !== "undefined"
                            ? `${window.location.origin}/business/dashboard`
                            : undefined,
                      },
                    }
                  );
                  if (oauthError) {
                    setError(oauthError.message);
                  }
                } catch (oauthErr) {
                  setError(
                    oauthErr instanceof Error
                      ? oauthErr.message
                      : "Unable to start Google sign-in. Please try again."
                  );
                }
              }}
              className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#1FAF9E] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path
                  d="M23.49 12.27c0-.81-.07-1.6-.2-2.36H12v4.48h6.47a5.54 5.54 0 01-2.4 3.64v3.02h3.88c2.27-2.09 3.54-5.18 3.54-8.78z"
                  fill="#4285F4"
                />
                <path
                  d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.88-3.02c-1.08.72-2.46 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.12A12 12 0 0012 24z"
                  fill="#34A853"
                />
                <path
                  d="M5.25 14.25a7.2 7.2 0 010-4.5V6.63H1.25a12 12 0 000 10.74l4-3.12z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 4.78c1.76 0 3.35.6 4.6 1.77l3.45-3.45C17.96 1.14 15.23 0 12 0 7.3 0 3.22 2.69 1.25 6.63l4 3.12C6.2 6.9 8.86 4.78 12 4.78z"
                  fill="#EA4335"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          </div>

          <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            OR
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
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
