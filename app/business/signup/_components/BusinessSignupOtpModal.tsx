"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Props = {
  open: boolean;
  email: string;
  password: string;
  onClose: () => void;
  onResend: () => Promise<{ ok: boolean; error?: string }>;
};

export default function BusinessSignupOtpModal({
  open,
  email,
  password,
  onClose,
  onResend,
}: Props) {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  if (!open) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setVerifying(true);
    try {
      const res = await fetch("/api/business/signup/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, password }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!res.ok) {
        if (data.error === "wrong_code") {
          setError("That code is not correct. Try again or request a new code.");
        } else if (data.error === "code_expired") {
          setError("This code has expired. Tap Resend code for a new one.");
        } else {
          setError(data.message ?? data.error ?? "Verification failed. Please try again.");
        }
        return;
      }

      const supabase = supabaseBrowser();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(
          signInError.message ||
            "Account created but sign-in failed. Try logging in from the business login page."
        );
        return;
      }

      if (typeof window !== "undefined") {
        window.location.href = `${window.location.origin}/business/dashboard`;
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResend = async () => {
    setResendMessage(null);
    setError("");
    setResending(true);
    try {
      const result = await onResend();
      if (result.ok) {
        setResendMessage("We sent a new code to your email.");
      } else {
        setResendMessage(result.error ?? "Couldn’t resend the code. Try again.");
      }
    } catch {
      setResendMessage("Couldn’t resend the code. Try again.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>

        <h2 className="text-center text-2xl font-semibold text-[#0E0E0E]">
          Verify your email
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Enter the 6-digit code we sent to{" "}
          <span className="font-medium text-[#0E0E0E]">{email}</span>
        </p>

        <form onSubmit={handleVerify} className="mt-6 space-y-4">
          <div>
            <label htmlFor="signup-otp" className="text-sm font-medium text-[#0E0E0E]">
              Verification code
            </label>
            <input
              id="signup-otp"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              disabled={verifying}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-lg tracking-[0.35em] text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
              placeholder="000000"
            />
          </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {resendMessage ? (
            <p
              className={`text-center text-xs ${
                resendMessage.startsWith("We sent") ? "text-emerald-700" : "text-amber-700"
              }`}
            >
              {resendMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={verifying}
            className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {verifying ? "Verifying…" : "Verify"}
          </button>

          <button
            type="button"
            onClick={handleResend}
            disabled={verifying || resending}
            className="w-full text-sm font-semibold text-[#1FAF9E] hover:underline disabled:opacity-50"
          >
            {resending ? "Sending…" : "Resend code"}
          </button>
        </form>
      </div>
    </div>
  );
}
