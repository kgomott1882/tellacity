"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WriteReviewForm from "@/components/reviews/WriteReviewForm";
import ReviewOtpModal from "@/components/reviews/ReviewOtpModal";

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
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  /** False until we validate (or skip) sessionStorage restore — avoids OTP with a stale draft_id. */
  const [otpRestoreChecked, setOtpRestoreChecked] = useState(false);

  const businessSlug = initialBusinessSlug ?? "";

  const otpStorageKey = `tellacity_invite_otp_${inviteId}`;

  // Restore OTP step only if draft + OTP row still exist (create-draft deletes prior drafts per invite).
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const raw = sessionStorage.getItem(otpStorageKey);
        if (!raw) {
          return;
        }
        const parsed = JSON.parse(raw) as { draftId?: string; step?: string };
        if (
          parsed.step !== "otp" ||
          typeof parsed.draftId !== "string" ||
          !isDraftIdUuid(parsed.draftId)
        ) {
          return;
        }
        const id = parsed.draftId.trim();
        const res = await fetch(
          `/api/reviews/draft-otp-check?draft_id=${encodeURIComponent(id)}`,
        );
        const body = (await res.json().catch(() => ({}))) as { ok?: boolean };
        if (cancelled) return;
        if (res.ok && body.ok === true) {
          setDraftId(id);
          setStep("otp");
        } else {
          sessionStorage.removeItem(otpStorageKey);
        }
      } catch {
        try {
          sessionStorage.removeItem(otpStorageKey);
        } catch {
          // ignore
        }
      } finally {
        if (!cancelled) {
          setOtpRestoreChecked(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [otpStorageKey]);

  const persistOtpSession = (persistedDraftId: string) => {
    try {
      sessionStorage.setItem(
        otpStorageKey,
        JSON.stringify({ draftId: persistedDraftId, step: "otp" }),
      );
    } catch {
      // ignore
    }
  };

  const clearOtpSession = () => {
    try {
      sessionStorage.removeItem(otpStorageKey);
    } catch {
      // ignore
    }
  };

  if (!otpRestoreChecked) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading…</p>
      </div>
    );
  }

  if (step === "otp") {
    if (!draftId) {
      return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
          <p className="text-sm text-gray-600">Preparing verification…</p>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <ReviewOtpModal
          draftId={draftId}
          verificationEmail={reviewerEmail}
          open
          onSuccess={() => {
            clearOtpSession();
            setError(null);
            setStep("success");
          }}
          onClose={() => {
            setStep("form");
          }}
        />
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
          const clean = id.trim();
          setDraftId(clean);
          persistOtpSession(clean);
          setStep("otp");
          setError(null);
        }}
        onInviteDraftFlowError={(message) => {
          setError(message);
        }}
      />
    </div>
  );
}
