"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import RecoverWithCodeForm from "@/components/auth/RecoverWithCodeForm";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";
import { clearPendingRecoveryEmail } from "@/lib/pendingRecoveryEmail";
import { parseAccountKind } from "@/lib/accountKind";

export default function BusinessResetPasswordPage() {
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
          window.location.hash.replace(/^#/, ""),
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
    const { data: subscription } =
      supabaseBrowser().auth.onAuthStateChange((_event, session) => {
        if (isMounted) {
          setReady(Boolean(session));
          setChecking(false);
        }
      });
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

    clearPendingRecoveryEmail();

    let redirectPath = "/auth/login?reset=success";
    try {
      const { data } = await supabaseBrowser().auth.getUser();
      const user = data.user;
      if (user) {
        if (parseAccountKind(user.user_metadata) === "business") {
          redirectPath = "/business/login?reset=success";
        } else {
          const supabase = supabaseBrowser();
          const { data: businessProfile } = await supabase
            .from("business_profiles")
            .select("id")
            .eq("id", user.id)
            .maybeSingle();
          if (businessProfile) {
            redirectPath = "/business/login?reset=success";
          }
        }
      }
    } catch {
      // fall back to consumer login
    }

    const supabase = supabaseBrowser();
    await supabase.auth.signOut();
    router.push(redirectPath);
  };

  return (
    <main className="min-h-screen bg-[#F8F4F0] px-4 py-10 flex flex-col items-center justify-center">
      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">
            Set a new password
          </h1>
          {checking ? (
            <p className="mt-2 text-sm text-gray-600">Checking your reset link…</p>
          ) : !ready ? (
            <>
              <p className="mt-2 text-sm text-gray-600">
                If the link in your email failed, it may have been opened already by your mail provider.
                Use the 6-digit code from the same email, or request a new reset.
              </p>
              <RecoverWithCodeForm
                onVerified={() => setReady(true)}
                forgotPasswordHref="/business/forgot-password"
                loginHref="/business/login"
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
                  onChange={(event) =>
                    setConfirmPassword(event.target.value)
                  }
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
                {loading ? "Saving..." : "Update password"}
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  );
}

