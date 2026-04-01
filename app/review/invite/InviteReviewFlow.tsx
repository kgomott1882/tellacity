"use client";

import { useState } from "react";
import Link from "next/link";
import { InviteFinalReviewForm } from "@/components/reviews/InviteFinalReviewForm";

type InviteReviewFlowProps = {
  inviteId: string;
  initialBusinessId: string;
  initialBusinessSlug: string | null;
  initialBusinessName: string | null;
  reviewerEmail: string;
};

export default function InviteReviewFlow({
  inviteId,
  initialBusinessId,
  initialBusinessSlug,
  initialBusinessName,
  reviewerEmail,
}: InviteReviewFlowProps) {
  const [step, setStep] = useState<"form" | "success">("form");

  const businessSlug = initialBusinessSlug ?? "";
  const businessName = initialBusinessName?.trim() || "Business";

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
      <div className="mx-auto w-full max-w-lg">
        <InviteFinalReviewForm
          businessId={initialBusinessId}
          businessName={businessName}
          reviewerEmail={reviewerEmail}
          inviteId={inviteId}
          onSuccess={() => setStep("success")}
        />
      </div>
    </div>
  );
}
