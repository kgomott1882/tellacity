"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// ── helpers ──────────────────────────────────────────────────────────────────

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

// ── inner component (needs useSearchParams) ───────────────────────────────────

function AcceptInviteInner() {
  const searchParams = useSearchParams();
  const token        = searchParams.get("token") ?? "";

  // invite meta
  const [inviteInfo, setInviteInfo] = useState<{
    email: string;
    role: string;
    businessName: string;
  } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(true);
  const [inviteError,   setInviteError]   = useState("");

  // form
  const [name,            setName]            = useState("");
  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting,      setSubmitting]      = useState(false);
  const [formError,       setFormError]       = useState("");
  const [step,            setStep]            = useState<"set-password" | "done">("set-password");

  // ── load invite info ────────────────────────────────────────────────────────

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

  // ── submit ──────────────────────────────────────────────────────────────────

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

      // 1. Try to sign in - if the account already exists, sign them in
      //    so they can accept with their existing credentials.
      const { data: signInData, error: signInErr } =
        await supabaseBrowser().auth.signInWithPassword({ email, password });

      let session = signInData?.session ?? null;

      if (signInErr) {
        // Account doesn't exist yet - create it
        const { data: signUpData, error: signUpErr } =
          await supabaseBrowser().auth.signUp({
            email,
            password,
            options: {
              data: { display_name: name.trim() },
              // Skip email confirmation - the invite itself is proof of email ownership
              emailRedirectTo: undefined,
            },
          });

        if (signUpErr) {
          setFormError(signUpErr.message);
          setSubmitting(false);
          return;
        }

        session = signUpData?.session ?? null;

        // Supabase may require email confirmation even with signUp.
        // If we have no session yet, sign in immediately (works when email confirm is off).
        if (!session) {
          const { data: retryData, error: retryErr } =
            await supabaseBrowser().auth.signInWithPassword({ email, password });
          if (retryErr || !retryData.session) {
            // Email confirmation is required - tell the user
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

      // 2. Accept the invite (server-side, uses the user's JWT)
      const res = await fetch("/api/business/team-access/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ token }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // "already used" is fine - the member row was already created
        if (!body?.error?.includes("already used")) {
          setFormError(body?.error ?? "Failed to accept invite. Please try again.");
          setSubmitting(false);
          return;
        }
      }

      // 3. Team invite completion → business app (not owner-based; invite flow only)
      if (typeof window !== "undefined") {
        window.location.href = `${window.location.origin}/business/dashboard`;
      }
    } catch (err: any) {
      setFormError(err?.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  // ── render ──────────────────────────────────────────────────────────────────

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

          {/* Loading */}
          {inviteLoading && (
            <div className="space-y-3">
              <div className="h-6 w-48 animate-pulse rounded bg-white/10" />
              <div className="h-4 w-64 animate-pulse rounded bg-white/5" />
            </div>
          )}

          {/* Invalid invite */}
          {!inviteLoading && inviteError && (
            <>
              <h1 className="text-2xl font-semibold text-white">Invalid invite</h1>
              <p className="mt-3 text-sm text-red-400">{inviteError}</p>
              <Link
                href="/auth/business-login"
                className="mt-6 inline-block text-sm text-[#1FAF9E] hover:underline"
              >
                Go to business sign in
              </Link>
            </>
          )}

          {/* Email confirmation required */}
          {!inviteLoading && !inviteError && step === "done" && (
            <>
              <h1 className="text-2xl font-semibold text-white">Check your email</h1>
              <p className="mt-3 text-sm text-neutral-400">
                We sent a confirmation link to{" "}
                <strong className="text-white">{inviteInfo?.email}</strong>.
                Click it to verify your email, then sign in to access the dashboard.
              </p>
              <Link
                href="/auth/business-login"
                className="mt-6 inline-block rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
              >
                Go to sign in
              </Link>
            </>
          )}

          {/* Set password form */}
          {!inviteLoading && !inviteError && step === "set-password" && inviteInfo && (
            <>
              <h1 className="text-2xl font-semibold text-white">
                Accept your invitation
              </h1>
              <p className="mt-2 text-sm text-neutral-400">
                You have been invited to join{" "}
                <strong className="text-white">{inviteInfo.businessName}</strong> as{" "}
                <strong className="text-[#1FAF9E] capitalize">{inviteInfo.role}</strong>.
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                Signing in as <strong className="text-neutral-300">{inviteInfo.email}</strong>
              </p>

              <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-neutral-300">
                    Your full name
                  </label>
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
                  <label className="block text-sm font-medium text-neutral-300">
                    Create a password
                  </label>
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
                  <label className="block text-sm font-medium text-neutral-300">
                    Confirm password
                  </label>
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
                  {submitting ? "Setting up your account..." : "Accept & get started"}
                </button>
              </form>

              <p className="mt-6 text-center text-xs text-neutral-600">
                Already have an account?{" "}
                <Link
                  href="/auth/business-login"
                  className="text-[#1FAF9E] hover:underline"
                >
                  Sign in instead
                </Link>
              </p>
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
