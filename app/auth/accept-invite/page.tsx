"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

async function lookupInvite(
  token: string
): Promise<{ email: string; role: string; businessName: string } | null> {
  try {
    const res = await fetch(`/api/business/team-access/invite-info?token=${encodeURIComponent(token)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [inviteInfo, setInviteInfo] = useState<{
    email: string;
    role: string;
    businessName: string;
  } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError, setInviteError] = useState("");

  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [step, setStep] = useState<"set-password" | "verify-email" | "done">("set-password");

  const [otpCode, setOtpCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    if (!token) {
      setInviteError("No invite token found. Please use the link from your email.");
      setInviteLoading(false);
      return;
    }
    lookupInvite(token).then((info) => {
      if (!info) {
        setInviteError("This invite link is invalid or has already been used.");
      } else {
        setInviteInfo(info);
      }
      setInviteLoading(false);
    });
  }, [token]);

  async function sendVerificationEmail(accessToken: string): Promise<{ ok: boolean; error?: string }> {
    const res = await fetch("/api/business/team-access/send-verify-code", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return { ok: false, error: body.error ?? `Could not send code (${res.status}).` };
    }
    return { ok: true };
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Please enter your full name.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const email = inviteInfo!.email;

      const { data: signInData, error: signInErr } = await supabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });

      let session = signInData?.session ?? null;

      if (signInErr) {
        const { data: signUpData, error: signUpErr } = await supabaseBrowser().auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name.trim(),
              account_kind: "business",
            },
            emailRedirectTo: undefined,
          },
        });

        if (signUpErr) {
          setFormError(signUpErr.message);
          setSubmitting(false);
          return;
        }

        session = signUpData?.session ?? null;

        if (!session) {
          const { data: retryData, error: retryErr } = await supabaseBrowser().auth.signInWithPassword({
            email,
            password,
          });
          if (retryErr || !retryData.session) {
            setStep("done");
            setSubmitting(false);
            return;
          }
          session = retryData.session;
        }
      }

      if (!session) {
        setFormError("Could not create a session. Please try again.");
        setSubmitting(false);
        return;
      }

      const sent = await sendVerificationEmail(session.access_token);
      if (!sent.ok) {
        setFormError(sent.error ?? "Could not send verification email.");
        setSubmitting(false);
        return;
      }

      setOtpCode("");
      setStep("verify-email");
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setFormError("");
    setResending(true);
    try {
      const { data: { session } } = await supabaseBrowser().auth.getSession();
      if (!session?.access_token) {
        setFormError("Your session expired. Go back and sign in again.");
        setResending(false);
        return;
      }
      const sent = await sendVerificationEmail(session.access_token);
      if (!sent.ok) {
        setFormError(sent.error ?? "Could not resend the code.");
      }
    } finally {
      setResending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const digits = otpCode.replace(/\D/g, "");
    if (digits.length !== 6) {
      setFormError("Enter the 6-digit code from your email.");
      return;
    }

    setVerifying(true);
    try {
      const { data: { session } } = await supabaseBrowser().auth.getSession();
      if (!session?.access_token) {
        setFormError("Your session expired. Refresh the page and try again.");
        setVerifying(false);
        return;
      }

      const res = await fetch("/api/business/team-access/verify-and-accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token, code: digits }),
      });

      const body = (await res.json().catch(() => ({}))) as { error?: string; success?: boolean };

      if (!res.ok) {
        setFormError(body.error ?? "Verification failed. Try again.");
        setVerifying(false);
        return;
      }

      if (typeof window !== "undefined") {
        window.location.href = `${window.location.origin}/business/dashboard`;
      }
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : "Something went wrong.");
      setVerifying(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#0A1A18] px-4 py-10">
      <Link href="/" className="mb-8 flex items-center justify-center">
        <img
          src="/brand/TELLACITY%20LOGO%202A.png"
          alt="Tellacity"
          className="h-7 w-auto brightness-0 invert"
        />
      </Link>

      <section className="w-full max-w-md">
        <div className="rounded-2xl border border-white/10 bg-[#111F1D] p-8 shadow-2xl">
          {inviteLoading && (
            <div className="space-y-3">
              <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-64 animate-pulse rounded bg-white/5" />
            </div>
          )}

          {!inviteLoading && inviteError && (
            <>
              <h1 className="text-2xl font-semibold text-white">Invalid invite</h1>
              <p className="mt-3 text-sm text-red-400">{inviteError}</p>
              <Link href="/business/login" className="mt-6 inline-block text-sm text-[#1FAF9E] hover:underline">
                Go to business sign in
              </Link>
            </>
          )}

          {!inviteLoading && !inviteError && step === "done" && (
            <>
              <h1 className="text-2xl font-semibold text-white">Check your email</h1>
              <p className="mt-3 text-sm text-neutral-400">
                We sent a confirmation link to <strong className="text-white">{inviteInfo?.email}</strong>.
                Click it to verify your email, then sign in to access the dashboard.
              </p>
              <Link
                href="/business/login"
                className="mt-6 inline-block rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
              >
                Go to sign in
              </Link>
            </>
          )}

          {!inviteLoading && !inviteError && step === "set-password" && inviteInfo && (
            <>
              <h1 className="text-2xl font-semibold text-white">Accept your invitation</h1>
              <p className="mt-2 text-sm text-neutral-400">
                You have been invited to join <strong className="text-white">{inviteInfo.businessName}</strong> as{" "}
                <strong className="text-[#1FAF9E] capitalize">{inviteInfo.role}</strong>.
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Signing in as <strong className="text-neutral-300">{inviteInfo.email}</strong>
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                After you create your password, we&apos;ll email a 6-digit code to confirm it&apos;s you before you
                join the team.
              </p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Your full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                    placeholder="Jane Smith"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Create a password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    minLength={8}
                    placeholder="At least 8 characters"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">Confirm password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    placeholder="Repeat password"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-neutral-500 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>

                {formError && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {submitting ? "Continuing…" : "Continue"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-neutral-600">
                Already have an account?{" "}
                <Link href="/business/login" className="text-[#1FAF9E] hover:underline">
                  Sign in instead
                </Link>
              </p>
            </>
          )}

          {!inviteLoading && !inviteError && step === "verify-email" && inviteInfo && (
            <>
              <h1 className="text-2xl font-semibold text-white">Enter verification code</h1>
              <p className="mt-2 text-sm text-neutral-400">
                We sent a <strong className="text-white">6-digit code</strong> to{" "}
                <strong className="text-white">{inviteInfo.email}</strong>. Enter it below to join{" "}
                <strong className="text-white">{inviteInfo.businessName}</strong>.
              </p>
              <p className="mt-3 text-sm text-neutral-500">
                {"Didn't receive the email? Check your spam or junk folder."}
              </p>

              <form className="mt-8 space-y-4" onSubmit={handleVerifyOtp}>
                <div>
                  <label className="block text-sm font-medium text-neutral-300" htmlFor="team-invite-otp">
                    6-digit code
                  </label>
                  <input
                    id="team-invite-otp"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="mt-2 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-white placeholder-neutral-600 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>

                {formError && (
                  <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
                    {formError}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={verifying || otpCode.replace(/\D/g, "").length !== 6}
                  className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifying ? "Verifying…" : "Verify and join team"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => void handleResendCode()}
                disabled={resending}
                className="mt-4 w-full text-center text-sm text-[#1FAF9E] hover:underline disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            </>
          )}
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

export default function AcceptInvitePage() {
  return (
    <Suspense>
      <AcceptInviteInner />
    </Suspense>
  );
}
