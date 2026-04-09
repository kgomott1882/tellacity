"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { clearPendingRecoveryEmail, peekPendingRecoveryEmail } from "@/lib/pendingRecoveryEmail";

type Props = {
  onVerified: () => void;
  forgotPasswordHref: string;
  loginHref: string;
  /** e.g. focus:border-black for consumer */
  inputFocusClass?: string;
  /** e.g. bg-black for consumer primary button */
  submitButtonClass?: string;
};

export default function RecoverWithCodeForm({
  onVerified,
  forgotPasswordHref,
  loginHref,
  inputFocusClass = "focus:border-[#1FAF9E] focus:ring-[#1FAF9E]/20",
  submitButtonClass = "bg-[#1FAF9E] hover:bg-[#169786]",
}: Props) {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const pre = peekPendingRecoveryEmail();
    if (pre) setEmail(pre);
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    const em = email.trim().toLowerCase();
    const token = code.replace(/\D/g, "");
    if (!em || token.length !== 6) {
      setErr("Enter the email you used and the 6-digit code from the reset email.");
      return;
    }
    setBusy(true);
    const { error } = await supabaseBrowser().auth.verifyOtp({
      email: em,
      token,
      type: "recovery",
    });
    setBusy(false);
    if (error) {
      setErr(error.message);
      return;
    }
    clearPendingRecoveryEmail();
    onVerified();
  };

  return (
    <form className="mt-6 space-y-4" onSubmit={submit}>
      <p className="text-sm text-gray-600">
        Some email apps open links automatically, which can use up a one-time reset link. If the link in
        your email does not work, enter the <strong>6-digit code</strong> from that same email below.
      </p>
      <div>
        <label className="text-sm font-medium text-[#0E0E0E]">Email</label>
        <input
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          className={`mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:outline-none focus:ring-2 ${inputFocusClass}`}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-[#0E0E0E]">6-digit code</label>
        <input
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChange={(ev) => setCode(ev.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className={`mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-center text-lg tracking-[0.35em] text-[#0E0E0E] focus:outline-none focus:ring-2 ${inputFocusClass}`}
        />
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className={`w-full rounded-full px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300 ${submitButtonClass}`}
      >
        {busy ? "Verifying…" : "Continue to new password"}
      </button>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm">
        <Link href={forgotPasswordHref} className="font-semibold text-[#1FAF9E]">
          Send a new code
        </Link>
        <Link href={loginHref} className="font-semibold text-[#1FAF9E]">
          Back to sign in
        </Link>
      </div>
    </form>
  );
}
