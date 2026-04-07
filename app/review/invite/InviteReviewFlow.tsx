"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InviteFinalReviewForm } from "@/components/reviews/InviteFinalReviewForm";
import { primeHomeFeedHighlightReviewId } from "@/lib/homeFeedHighlight";

type InviteReviewFlowProps = {
  inviteId: string;
  initialBusinessId: string;
  initialBusinessSlug: string | null;
  initialBusinessName: string | null;
  reviewerEmail: string;
  /** From email widget rating ladder (?rating=1–5). */
  initialRating?: number;
};

export default function InviteReviewFlow({
  inviteId,
  initialBusinessId,
  initialBusinessSlug,
  initialBusinessName,
  reviewerEmail,
  initialRating,
}: InviteReviewFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "success">("form");
  const [showPublishedToast, setShowPublishedToast] = useState(false);
  const publishedReviewIdRef = useRef<string | null>(null);
  const redirectTimerRef = useRef<number | null>(null);

  const businessSlug = initialBusinessSlug ?? "";
  const businessName = initialBusinessName?.trim() || "Business";

  const goToBusiness = useCallback(
    (reviewId: string | null) => {
      const slug = businessSlug.trim();
      if (reviewId) {
        primeHomeFeedHighlightReviewId(reviewId);
      }
      if (slug) {
        router.push(`/b/${encodeURIComponent(slug)}`);
        router.refresh();
      } else {
        setStep("success");
        router.refresh();
      }
    },
    [businessSlug, router],
  );

  const clearRedirectTimer = () => {
    if (redirectTimerRef.current != null) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
  };

  const handleInviteSubmitSuccess = (reviewId: string | null) => {
    publishedReviewIdRef.current = reviewId;
    setShowPublishedToast(true);
  };

  useEffect(() => {
    if (!showPublishedToast) return;
    clearRedirectTimer();
    redirectTimerRef.current = window.setTimeout(() => {
      redirectTimerRef.current = null;
      setShowPublishedToast(false);
      goToBusiness(publishedReviewIdRef.current);
    }, 2800);
    return () => clearRedirectTimer();
  }, [showPublishedToast, goToBusiness]);

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
    <div className="relative min-h-screen bg-gray-50 py-10 px-4 pb-16">
      {showPublishedToast ? (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-black/35 px-4 pt-[20vh] sm:pt-[15vh]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invite-published-title"
        >
          <div
            className="w-full max-w-sm rounded-2xl border-2 border-[#1FAF9E]/40 bg-white p-6 text-center shadow-[0_20px_50px_-12px_rgba(31,175,158,0.45)]"
            style={{
              boxShadow:
                "0 20px 50px -12px rgba(31, 175, 158, 0.4), 0 0 0 1px rgba(18, 69, 65, 0.08)",
            }}
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#1FAF9E]/15 text-2xl">
              ✓
            </div>
            <h2
              id="invite-published-title"
              className="text-lg font-semibold text-[#124541]"
            >
              Thank you
            </h2>
            <p className="mt-2 text-sm text-[#0E0E0E]/85">
              Your review is published. You&apos;ll be taken to the business
              profile in a moment.
            </p>
            <button
              type="button"
              className="mt-5 w-full rounded-full bg-[#1FAF9E] py-2.5 text-sm font-semibold text-white hover:bg-[#169786]"
              onClick={() => {
                clearRedirectTimer();
                setShowPublishedToast(false);
                goToBusiness(publishedReviewIdRef.current);
              }}
            >
              {businessSlug ? "View business now" : "Continue"}
            </button>
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-lg px-1">
        <InviteFinalReviewForm
          businessId={initialBusinessId}
          businessName={businessName}
          reviewerEmail={reviewerEmail}
          inviteId={inviteId}
          initialRating={initialRating}
          onSuccess={handleInviteSubmitSuccess}
        />
      </div>
    </div>
  );
}
