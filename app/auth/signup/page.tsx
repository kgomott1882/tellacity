"use client";

import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { handleRedirect } from "@/lib/postLoginRedirect";

export default function SignupPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const normalizeSignupError = (message: string) => {
    const normalized = message.toLowerCase();
    if (
      normalized.includes("already been registered") ||
      normalized.includes("already exists")
    ) {
      return "Account already exists. Please log in.";
    }
    return message;
  };

  const callEdgeFunction = async (name: string, body: Record<string, unknown>) => {
    const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!baseUrl || !anonKey) {
      throw new Error("Supabase configuration missing.");
    }
    const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    });
    let payload: any = null;
    try {
      payload = await response.json();
    } catch (_error) {
      payload = null;
    }
    if (!response.ok) {
      const message =
        (payload && payload.error) || "Something went wrong. Please try again.";
      throw new Error(message);
    }
    return payload;
  };

  const handleSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!displayName.trim() || !email || !password || !confirmPassword) {
      setError("Please complete all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await callEdgeFunction("send-signup-otp", { email, password });
      setLoading(false);
      setStep("otp");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setLoading(false);
      setError(normalizeSignupError(message));
      return;
    }
  };

  const handleVerify = async () => {
    setError("");
    if (otp.trim().length !== 4) {
      setError("Enter the 4-digit code.");
      return;
    }
    setLoading(true);
    try {
      const payload = await callEdgeFunction("verify-signup-otp", {
        email,
        code: otp.trim(),
      });
      setLoading(false);
      if (payload?.session?.access_token && payload?.session?.refresh_token) {
        await supabaseBrowser().auth.setSession({
          access_token: payload.session.access_token,
          refresh_token: payload.session.refresh_token,
        });
        const { error: profileError } = await supabaseBrowser().auth.updateUser({
          data: { display_name: displayName.trim() },
        });
        if (profileError) {
          setError(profileError.message);
          return;
        }
        // Consumer signup → consumer dashboard; if somehow business profile exists, go to business dashboard
        let user: { id: string } | null = null;
        try {
          const { data } = await supabaseBrowser().auth.getUser();
          user = data.user;
        } catch (e) {
          if (isAbortError(e)) {
            const { data: retry } = await supabaseBrowser().auth.getUser();
            if (retry.user?.id) {
              await handleRedirect(retry.user.id);
              return;
            }
            if (typeof window !== "undefined") {
              window.location.href = `${window.location.origin}/dashboard`;
            }
            return;
          }
          throw e;
        }
        if (user?.id) {
          await handleRedirect(user.id);
          return;
        }
        if (typeof window !== "undefined") {
          window.location.href = `${window.location.origin}/dashboard`;
        }
        return;
      }
      setError("Unable to create session. Please try again.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setLoading(false);
      setError(normalizeSignupError(message));
    }
  };

  const handleResend = async () => {
    setError("");
    setLoading(true);
    try {
      await callEdgeFunction("send-signup-otp", { email, password });
      setLoading(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setLoading(false);
      setError(normalizeSignupError(message));
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F4F0] px-4 py-10 flex flex-col items-center justify-center">
      <Link href="/" className="mb-8 flex items-center justify-center">
        <img
          src="/brand/TELLACITY%20LOGO%202A.png"
          alt="Tellacity"
          className="h-7 w-auto"
        />
      </Link>

      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          {step === "form" ? (
            <>
              <h1 className="text-2xl font-semibold text-[#0E0E0E]">
                Create your account
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                Sign up with your email to access your dashboard.
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
                      const baseUrl = getBaseUrl();
                      const { error: oauthError } =
                        await supabaseBrowser().auth.signInWithOAuth({
                          provider: "google",
                          options: {
                            redirectTo: `${baseUrl}/auth/callback`,
                          },
                        });
                      if (oauthError) {
                        setError(oauthError.message);
                      }
                    } catch (oauthErr) {
                      setError(
                        oauthErr instanceof Error
                          ? oauthErr.message
                          : "Unable to start Google sign-up. Please try again."
                      );
                    }
                  }}
                  className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#1FAF9E]"
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

              <form className="space-y-4" onSubmit={handleSignup}>
                <div>
                  <label className="text-sm font-medium text-[#0E0E0E]">
                    Full name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>
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
                <div>
                  <label className="text-sm font-medium text-[#0E0E0E]">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>
                {error && (
                  <p className="text-sm text-red-600">
                    {error}{" "}
                    {error.includes("log in") && (
                      <Link
                        href="/auth/login"
                        className="font-semibold underline underline-offset-2"
                      >
                        Log in
                      </Link>
                    )}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loading ? "Sending code..." : "Create account"}
                </button>
              </form>
              <p className="mt-6 text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/auth/login"
                  className="font-semibold text-[#1FAF9E]"
                >
                  Sign in
                </Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-semibold text-[#0E0E0E]">
                Verify your email
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                We’ve sent a 4-digit code to <strong>{email}</strong>.
              </p>
              <div className="mt-6 space-y-4">
                <div>
                  <label className="text-sm font-medium text-[#0E0E0E]">
                    4-digit code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    maxLength={4}
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-center text-lg tracking-[0.6em] text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>
                {error && <p className="text-sm text-red-600">{error}</p>}
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={loading}
                  className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loading ? "Verifying..." : "Verify code"}
                </button>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="w-full rounded-full border border-[#1FAF9E] px-6 py-3 text-sm font-semibold text-[#1FAF9E] hover:bg-[#1FAF9E]/10 disabled:cursor-not-allowed"
                >
                  Resend code
                </button>
              </div>
            </>
          )}
        </div>

        <p className="mt-8 text-center text-xs text-gray-500">
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
      </section>
    </main>
  );
}
