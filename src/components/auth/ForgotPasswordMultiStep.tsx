"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import PasswordInput from "@/components/ui/PasswordInput";

type Variant = "consumer" | "business";

type Props = {
  variant: Variant;
  loginHref: string;
  headerExtra?: ReactNode;
};

const consumerBtn =
  "w-full rounded-full bg-black px-6 py-3 text-sm font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-gray-300";
const businessBtn =
  "w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300";

const consumerInput =
  "mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-black focus:outline-none focus:ring-2 focus:ring-black/15";
const businessInput =
  "mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20";

const linkClass = (v: Variant) =>
  v === "consumer"
    ? "font-semibold text-black hover:underline"
    : "font-semibold text-[#1FAF9E] hover:underline";

export default function ForgotPasswordMultiStep({ variant, loginHref, headerExtra }: Props) {
  const btn = variant === "consumer" ? consumerBtn : businessBtn;
  const input = variant === "consumer" ? consumerInput : businessInput;

  const [step, setStep] = useState<"email" | "password" | "otp" | "done">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const goPassword = (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const em = email.trim();
    if (!em) {
      setError("Please enter your email.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
      setError("Please enter a valid email address.");
      return;
    }
    setEmail(em.toLowerCase());
    setStep("password");
  };

  const goOtp = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (!password || !confirmPassword) {
      setError("Please enter and confirm your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Could not send the code.");
        return;
      }
      setOtp("");
      setStep("otp");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSave = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    const digits = otp.replace(/\D/g, "");
    if (digits.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: digits,
          newPassword: password,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string; ok?: boolean };
      if (!res.ok) {
        setError(data.error ?? "Could not reset password.");
        return;
      }
      setStep("done");
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/password-reset/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Could not resend.");
        return;
      }
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const otpModal =
    step === "otp" ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-8">
        <div
          className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgot-otp-title"
        >
          <h1 id="forgot-otp-title" className="text-2xl font-semibold text-[#0E0E0E]">
            Enter verification code
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below to save your new
            password.
          </p>
          <p className="mt-2 text-sm text-gray-600">
            {"Didn't receive the email? Check your spam or junk folder."}
          </p>
          <form className="mt-6 space-y-4" onSubmit={verifyAndSave}>
            <div>
              <label className="text-sm font-medium text-[#0E0E0E]">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={otp}
                onChange={(ev) => setOtp(ev.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${input} text-center text-lg tracking-[0.35em]`}
                placeholder="000000"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Verifying…" : "Verify and save password"}
            </button>
            <button
              type="button"
              onClick={() => void resendOtp()}
              disabled={loading}
              className={`w-full text-sm font-semibold ${variant === "consumer" ? "text-black" : "text-[#1FAF9E]"} hover:underline disabled:opacity-50`}
            >
              Resend code
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep("password");
              }}
              className="w-full text-sm text-gray-600 hover:text-[#0E0E0E]"
            >
              ← Back
            </button>
          </form>
        </div>
      </div>
    ) : null;

  return (
    <>
      {otpModal}
      {step !== "otp" ? (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
        {headerExtra}
        {step === "email" ? (
        <>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Reset your password</h1>
          <p className="mt-2 text-sm text-gray-600">Enter your email to continue.</p>
          <form className="mt-6 space-y-4" onSubmit={goPassword}>
            <div>
              <label className="text-sm font-medium text-[#0E0E0E]">Email</label>
              <input
                type="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                className={input}
                autoComplete="email"
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" className={btn}>
              Continue
            </button>
          </form>
          <Link href={loginHref} className={`mt-6 inline-flex text-sm ${linkClass(variant)}`}>
            Back to sign in
          </Link>
        </>
      ) : null}

      {step === "password" ? (
        <>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Choose a new password</h1>
          <p className="mt-2 text-sm text-gray-600">
            Next we&apos;ll email a 6-digit code to <strong>{email}</strong> to confirm it&apos;s you.
          </p>
          <form className="mt-6 space-y-4" onSubmit={goOtp}>
            <div>
              <label className="text-sm font-medium text-[#0E0E0E]">New password</label>
              <PasswordInput
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                className={input}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#0E0E0E]">Confirm password</label>
              <PasswordInput
                value={confirmPassword}
                onChange={(ev) => setConfirmPassword(ev.target.value)}
                className={input}
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <button type="submit" disabled={loading} className={btn}>
              {loading ? "Sending code…" : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => {
                setError("");
                setStep("email");
              }}
              className="w-full text-sm text-gray-600 hover:text-[#0E0E0E]"
            >
              ← Back
            </button>
          </form>
        </>
      ) : null}

        {step === "done" ? (
        <>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Password updated</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your new password is active. Sign in with your email and new password.
          </p>
          <Link
            href={loginHref}
            className={`mt-6 inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white ${variant === "consumer" ? "bg-black hover:bg-neutral-800" : "bg-[#1FAF9E] hover:bg-[#169786]"}`}
          >
            Go to sign in
          </Link>
        </>
        ) : null}
      </div>
      ) : null}
    </>
  );
}
