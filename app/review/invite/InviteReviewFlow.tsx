"use client";

import { useState } from "react";
import Link from "next/link";
import WriteReviewForm from "@/components/reviews/WriteReviewForm";
import { Button } from "@/components/ui/button";

/** review_drafts.id (UUID). Invite URL `token` is never used for /api/reviews/verify. */
function isDraftIdUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value.trim(),
  );
}

type InviteReviewFlowProps = {
  inviteId: string;
  inviteToken: string;
  initialRating?: number;
  initialBusinessId: string;
  initialBusinessSlug: string | null;
  initialBusinessName: string | null;
  reviewerEmail: string;
};

export default function InviteReviewFlow({
  inviteId,
  inviteToken,
  initialRating,
  initialBusinessId,
  initialBusinessSlug,
  initialBusinessName,
  reviewerEmail,
}: InviteReviewFlowProps) {
  const [step, setStep] = useState<"form" | "otp" | "success">("form");
  /** Set only from POST /api/reviews/create-draft response `draft_id` — never from URL `token`. */
  const [storedDraftId, setStoredDraftId] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const businessSlug = initialBusinessSlug ?? "";

  const handleVerify = async () => {
    const trimmed = otp.replace(/\D/g, "").slice(0, 6);
    if (!trimmed || trimmed.length !== 6) {
      setError("Enter valid 6-digit code");
      return;
    }
    if (!storedDraftId || !isDraftIdUuid(storedDraftId)) {
      setError("Something went wrong. Refresh the page and try again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/reviews/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draft_id: storedDraftId,
          code: trimmed,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };

      if (!res.ok) {
        setError(
          typeof data.error === "string" && data.error.trim()
            ? data.error
            : "Invalid code",
        );
        setLoading(false);
        return;
      }

      if (data.success === true) {
        setStep("success");
        setLoading(false);
        return;
      }

      setError("Invalid code");
      setLoading(false);
    } catch {
      setError("Something went wrong");
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto w-full max-w-md">
          <div
            className="rounded-2xl bg-white p-6"
            style={{
              border: "3px solid #124541",
              boxShadow:
                "0 0 20px rgba(18, 69, 65, 0.25), 0 0 40px rgba(18, 69, 65, 0.15)",
            }}
          >
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Verify your email
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Enter the 6-digit code sent to your email.
            </p>

            <div className="mt-6">
              <label
                htmlFor="invite-otp-code"
                className="text-sm font-medium text-[#0E0E0E]"
              >
                Verification code
              </label>
              <input
                id="invite-otp-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={otp}
                onChange={(e) => {
                  const next = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setOtp(next);
                  if (error) setError(null);
                }}
                maxLength={6}
                disabled={loading}
                className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-center text-lg tracking-[0.5em] text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                placeholder="••••••"
              />
            </div>

            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <Button
              type="button"
              className="mt-6 w-full rounded-full bg-[#1FAF9E] text-sm font-semibold hover:bg-[#169786]"
              onClick={() => void handleVerify()}
              disabled={loading || otp.replace(/\D/g, "").length !== 6}
            >
              {loading ? "Verifying…" : "Verify"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="mx-auto w-full max-w-md text-center">
          <div
            className="rounded-2xl bg-white p-8"
            style={{
              border: "3px solid #124541",
              boxShadow:
                "0 0 20px rgba(18, 69, 65, 0.25), 0 0 40px rgba(18, 69, 65, 0.15)",
            }}
          >
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Review submitted 🎉
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              Thank you for your feedback.
            </p>
            {businessSlug ? (
              <Link
                href={`/b/${businessSlug}`}
                className="mt-6 inline-flex rounded-full bg-[#1FAF9E] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#169786]"
              >
                View business profile
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {error ? (
        <div className="mx-auto mb-4 max-w-3xl rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}
      <WriteReviewForm
        inviteId={inviteId}
        inviteToken={inviteToken}
        initialRating={initialRating}
        initialBusinessId={initialBusinessId}
        initialBusinessSlug={initialBusinessSlug}
        initialBusinessName={initialBusinessName}
        reviewerEmail={reviewerEmail}
        businessSlug={businessSlug}
        inviteTwoStepOtp
        onInviteDraftCreated={(id) => {
          if (!isDraftIdUuid(id)) {
            setError("Invalid draft from server. Please try again.");
            return;
          }
          setStoredDraftId(id.trim());
          setStep("otp");
          setError(null);
          setOtp("");
        }}
        onInviteDraftFlowError={(message) => {
          setError(message);
        }}
      />
    </div>
  );
}
