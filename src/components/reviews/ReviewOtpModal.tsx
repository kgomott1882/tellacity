"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type ReviewOtpModalProps = {
  reviewId: string;
  email: string;
  open?: boolean;
  onSuccess: () => void;
  onClose: () => void;
};

export default function ReviewOtpModal({
  reviewId,
  email,
  open = true,
  onSuccess,
  onClose,
}: ReviewOtpModalProps) {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  useEffect(() => {
    if (!successToast) return;
    const t = setTimeout(() => {
      setSuccessToast(false);
    }, 3000);
    return () => clearTimeout(t);
  }, [successToast]);

  if (!open) {
    return null;
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const next = event.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(next);
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!code || code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId, code }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data || data.success !== true) {
        const message = (data && data.error) || "Invalid verification code";

        if (typeof message === "string") {
          if (message.toLowerCase().includes("expired")) {
            setError("Code expired");
          } else if (message.toLowerCase().includes("too many")) {
            setError("Too many attempts. Please try again later.");
          } else {
            setError("Invalid verification code");
          }
        } else {
          setError("Invalid verification code");
        }

        return;
      }

      setSuccessToast(true);
      onSuccess();
      onClose();
    } catch (e) {
      console.error("Failed to verify OTP:", e);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Verify your email
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              We sent a 6-digit verification code to{" "}
              <span className="font-medium text-gray-700">{email}</span>.
              Enter the code below to publish your review.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600"
            disabled={submitting}
          >
            Finish later
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="review-otp-code"
              className="text-xs font-medium text-gray-700"
            >
              Verification code
            </label>
            <div className="mt-2">
              <input
                id="review-otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={handleChange}
                disabled={submitting}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-lg tracking-[0.5em] text-gray-900 focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                placeholder="••••••"
              />
            </div>
            {error && (
              <p className="mt-1 text-xs text-red-600">
                {error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full rounded-full bg-[#1FAF9E] text-sm font-semibold hover:bg-[#169786]"
              disabled={submitting || code.length !== 6}
            >
              {submitting ? "Publishing…" : "Publish Review"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-xs font-medium text-[#1FAF9E] hover:text-[#169786]"
              // Resend behavior can be wired up later when backend exists
              disabled={submitting}
            >
              Resend code
            </button>
          </div>
        </form>

        {successToast && (
          <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            Review published successfully
          </div>
        )}
      </div>
    </div>
  );
}

