"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RecoverWithCodeForm from "@/components/auth/RecoverWithCodeForm";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";
import { clearPendingRecoveryEmail } from "@/lib/pendingRecoveryEmail";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        if (code) {
          await supabaseBrowser().auth.exchangeCodeForSession(code);
          window.history.replaceState({}, "", url.pathname);
        }

        const hashParams = new URLSearchParams(
          window.location.hash.replace(/^#/, "")
        );
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          await supabaseBrowser().auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          window.history.replaceState({}, "", url.pathname);
        }
      }

      let sessionData: { session: unknown } | null = null;
      try {
        const result = await supabaseBrowser().auth.getSession();
        sessionData = result.data;
      } catch (e) {
        if (isAbortError(e)) {
          if (isMounted) {
            setReady(false);
            setChecking(false);
          }
          return;
        }
        throw e;
      }
      if (isMounted) {
        setReady(Boolean(sessionData?.session));
        setChecking(false);
      }
    };
    checkSession();
    const { data: subscription } = supabaseBrowser().auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          setReady(Boolean(session));
          setChecking(false);
        }
      }
    );
    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!password || !confirmPassword) {
      setError("Please enter and confirm your password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error: updateError } = await supabaseBrowser().auth.updateUser({
      password,
    });
    setLoading(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    // After a successful password reset, sign the user out and
    // send them back to the login screen so they authenticate
    // explicitly with the new credentials.
    const supabase = supabaseBrowser();
    clearPendingRecoveryEmail();
    await supabase.auth.signOut();
    router.push("/auth/login?reset=success");
  };

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-md px-4 py-16">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">
            Set a new password
          </h1>
          {checking ? (
            <p className="mt-2 text-sm text-gray-600">
              Checking your reset link…
            </p>
          ) : !ready ? (
            <>
              <p className="mt-2 text-sm text-gray-600">
                If you followed a link from your email and saw an error, the link may already have been
                used (for example by a mail security scanner). Use the 6-digit code from the email, or
                request a new reset.
              </p>
              <RecoverWithCodeForm
                onVerified={() => setReady(true)}
                forgotPasswordHref="/auth/forgot-password"
                loginHref="/auth/login"
                inputFocusClass="focus:border-black focus:ring-black/15"
                submitButtonClass="bg-black hover:bg-neutral-800"
              />
            </>
          ) : (
            <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm font-medium text-[#0E0E0E]">
                  New password
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
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {loading ? "Saving..." : "Update password"}
              </button>
              <Link
                href="/auth/login"
                className="mt-4 inline-flex text-sm font-semibold text-[#1FAF9E]"
              >
                Back to sign in
              </Link>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}
