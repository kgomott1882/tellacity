"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import WriteReviewForm from "@/components/reviews/WriteReviewForm";

/** review_drafts.id (UUID) from find-draft / preload create-draft. */
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
  const [step, setStep] = useState<"form" | "success">("form");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [preloadChecked, setPreloadChecked] = useState(false);

  const businessSlug = initialBusinessSlug ?? "";

  // Invite bootstrap: create/reuse draft_id on page load.
  useEffect(() => {
    let cancelled = false;
    if (step !== "form") {
      setPreloadChecked(true);
      return;
    }

    (async () => {
      try {
        const checkRes = await fetch(
          `/api/reviews/find-draft?invite_id=${encodeURIComponent(inviteId)}`,
          { credentials: "include" },
        );
        const checkData = (await checkRes.json().catch(() => ({}))) as {
          draft_id?: string;
        };
        if (cancelled) return;
        const existingId =
          typeof checkData.draft_id === "string"
            ? checkData.draft_id.trim()
            : "";
        if (existingId && isDraftIdUuid(existingId)) {
          setDraftId(existingId);
          return;
        }

        const res = await fetch("/api/reviews/create-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            business_id: initialBusinessId,
            invite_id: inviteId,
            invite_token: inviteToken || null,
            guest_email: reviewerEmail,
            guest_name:
              (reviewerEmail.includes("@") ? reviewerEmail.split("@")[0] : "") ||
              "Customer",
            rating: Math.max(1, Math.min(5, Math.round(initialRating ?? 5))),
            title: null,
            body: "Invite draft preload",
            date_of_experience: new Date().toISOString().slice(0, 10),
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          draft_id?: string;
          error?: string;
        };
        if (cancelled) return;
        if (!res.ok) {
          setError(
            typeof data.error === "string" && data.error.trim()
              ? data.error
              : "Could not start invite flow.",
          );
          return;
        }
        const did = typeof data.draft_id === "string" ? data.draft_id.trim() : "";
        if (!isDraftIdUuid(did)) {
          setError("Invalid draft from server. Please refresh and try again.");
          return;
        }
        setDraftId(did);
      } catch {
        if (!cancelled) {
          setError("Could not start invite flow.");
        }
      } finally {
        if (!cancelled) {
          setPreloadChecked(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    step,
    initialBusinessId,
    inviteId,
    inviteToken,
    reviewerEmail,
    initialRating,
  ]);

  if (step === "form" && !preloadChecked) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <p className="text-sm text-gray-600">Loading…</p>
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
        inviteDraftId={draftId}
        initialRating={initialRating}
        initialBusinessId={initialBusinessId}
        initialBusinessSlug={initialBusinessSlug}
        initialBusinessName={initialBusinessName}
        reviewerEmail={reviewerEmail}
        businessSlug={businessSlug}
        onInviteReviewPublished={() => setStep("success")}
      />
    </div>
  );
}
