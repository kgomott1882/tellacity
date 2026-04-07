"use client";

import { useState } from "react";
import RatingStars from "@/components/RatingStars";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export type InviteFinalReviewFormProps = {
  businessId: string;
  businessName: string;
  reviewerEmail: string;
  inviteId: string;
  /** Called after the review is published to `reviews` (includes new `review_id` when returned). */
  onSuccess?: (reviewId: string | null) => void;
};

const PROOF_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"];
const MAX_PROOF_BYTES = 10 * 1024 * 1024;

function todayIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultGuestName(email: string): string {
  const local = email.trim().split("@")[0]?.trim() ?? "";
  return local || "Guest";
}

function humanizeApiError(payload: { error?: string }): string {
  const e = payload.error;
  if (!e) return "Something went wrong. Please try again.";
  if (e === "unexpected_error") return "Something went wrong. Please try again.";
  if (e === "Invalid request") return "Please check your review and try again.";
  if (e === "Invalid rating") return "Please choose a rating from 1 to 5.";
  if (e === "Invalid email") return "This invite email is not valid.";
  if (e === "This invite has already been used.")
    return "This invite has already been used.";
  if (e === "Invite expired") return "This invite has expired.";
  if (
    e ===
    "This review must be submitted with the invited email address."
  ) {
    return "Use the same email address this invite was sent to.";
  }
  if (e === "You have already reviewed this business.") {
    return "You have already reviewed this business.";
  }
  if (
    e ===
    "You already reviewd this businesses before. Review not accepted."
  ) {
    return e;
  }
  return e;
}

export function InviteFinalReviewForm({
  businessId,
  businessName,
  reviewerEmail,
  inviteId,
  onSuccess,
}: InviteFinalReviewFormProps) {
  const [rating, setRating] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [guestName, setGuestName] = useState("");
  const [dateOfExperience, setDateOfExperience] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setProofFile(null);
      return;
    }
    if (!PROOF_TYPES.includes(file.type)) {
      setProofError("Supported file types: PNG, JPG, WEBP, PDF.");
      setProofFile(null);
      return;
    }
    if (file.size > MAX_PROOF_BYTES) {
      setProofError("File size must be 10MB or less.");
      setProofFile(null);
      return;
    }
    setProofFile(file);
  };

  const uploadProofIfNeeded = async (): Promise<string | null> => {
    if (!proofFile) return null;
    const uniqueName = `invite_proofs/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}_${proofFile.name}`;
    const sb = supabaseBrowser();
    const { error: uploadError } = await sb.storage
      .from("receipts")
      .upload(uniqueName, proofFile);
    if (uploadError) {
      throw new Error("Could not upload your proof. Please try again.");
    }
    const { data } = sb.storage.from("receipts").getPublicUrl(uniqueName);
    return data.publicUrl || null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (rating == null || rating < 1 || rating > 5) {
      setSubmitError("Please choose a rating from 1 to 5.");
      return;
    }
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setSubmitError("Please write your review.");
      return;
    }

    const guest_name =
      guestName.trim() || defaultGuestName(reviewerEmail);

    let date_of_experience: string | null = null;
    if (dateOfExperience.trim()) {
      const d = dateOfExperience.trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
        setSubmitError("Please use a valid date (YYYY-MM-DD).");
        return;
      }
      const parsed = new Date(d);
      if (Number.isNaN(parsed.getTime())) {
        setSubmitError("Please use a valid date.");
        return;
      }
      const today = new Date(todayIsoDate());
      if (parsed > today) {
        setSubmitError("Date of experience cannot be in the future.");
        return;
      }
      date_of_experience = d;
    }

    setIsSubmitting(true);
    try {
      let receipt_url: string | null = null;
      if (proofFile) {
        receipt_url = await uploadProofIfNeeded();
      }

      const payload = {
        business_id: businessId,
        rating,
        title: title.trim() || null,
        body: trimmedBody,
        guest_email: reviewerEmail.trim(),
        guest_name,
        invite_id: inviteId,
        date_of_experience,
        receipt_url,
      };

      const res = await fetch("/api/review-drafts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        success?: boolean;
        published?: boolean;
        review_id?: string | null;
        draft_id?: string | null;
        error?: string;
      };

      if (!res.ok) {
        setSubmitError(humanizeApiError(data));
        return;
      }

      if (data.success === true && data.published === true) {
        const rid =
          typeof data.review_id === "string" && data.review_id.trim()
            ? data.review_id.trim()
            : null;
        onSuccess?.(rid);
        return;
      }

      if (data.success === true) {
        setSubmitError(
          "Your review was saved but not published. Please contact support.",
        );
        return;
      }

      setSubmitError(
        "Your review could not be saved. Please try again or contact support.",
      );
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : "Something went wrong. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative -translate-y-1 space-y-6 rounded-2xl border-[3px] border-[#124541] bg-white p-6 sm:p-8"
      style={{
        boxShadow:
          "0 20px 50px -12px rgba(31, 175, 158, 0.35), 0 0 0 1px rgba(31, 175, 158, 0.12), 0 0 48px rgba(31, 175, 158, 0.28), 0 12px 32px rgba(18, 69, 65, 0.14)",
      }}
    >
      <div>
        <h2 className="text-xl font-semibold text-[#124541]">Write your review</h2>
        <p className="mt-1 text-sm text-[#0E0E0E]/80">{businessName}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#124541]">Rating</label>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
            <RatingStars
              rating={rating ?? 0}
              editable={!isSubmitting}
              size={20}
              onChange={(value) => {
                if (isSubmitting) return;
                setRating(value);
              }}
            />
          </div>
          <span className="text-sm text-neutral-600">
            {(rating ?? 0) > 0
              ? `${rating ?? 0} star${(rating ?? 0) > 1 ? "s" : ""}`
              : "Tap a star to rate"}
          </span>
        </div>
      </div>

      <div>
        <label htmlFor="invite-review-title" className="block text-sm font-medium text-[#124541]">
          Title <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input
          id="invite-review-title"
          type="text"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
          maxLength={200}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="invite-review-body" className="block text-sm font-medium text-[#124541]">
          Your review
        </label>
        <textarea
          id="invite-review-body"
          required
          value={body}
          onChange={(ev) => setBody(ev.target.value)}
          rows={6}
          className="mt-1 min-h-[140px] w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
          placeholder="Share your experience…"
        />
      </div>

      <div>
        <label htmlFor="invite-review-date" className="block text-sm font-medium text-[#124541]">
          Date of experience <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input
          id="invite-review-date"
          type="date"
          value={dateOfExperience}
          onChange={(ev) => setDateOfExperience(ev.target.value)}
          max={todayIsoDate()}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
        />
      </div>

      <div>
        <label htmlFor="invite-review-proof" className="block text-sm font-medium text-[#124541]">
          Proof upload <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input
          id="invite-review-proof"
          type="file"
          accept={PROOF_TYPES.join(",")}
          onChange={onProofChange}
          className="mt-1 block w-full text-sm text-neutral-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#1FAF9E]/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-[#124541] hover:file:bg-[#1FAF9E]/20"
        />
        {proofError ? <p className="mt-1 text-xs text-red-600">{proofError}</p> : null}
      </div>

      <div>
        <label htmlFor="invite-review-display-name" className="block text-sm font-medium text-[#124541]">
          Display name <span className="font-normal text-neutral-500">(optional)</span>
        </label>
        <input
          id="invite-review-display-name"
          type="text"
          value={guestName}
          onChange={(ev) => setGuestName(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
          maxLength={200}
          placeholder={defaultGuestName(reviewerEmail)}
          autoComplete="name"
        />
        <p className="mt-1 text-xs text-neutral-500">
          If left blank, we use the part of your email before @.
        </p>
      </div>

      <div>
        <span className="block text-sm font-medium text-[#124541]">Email</span>
        <p className="mt-1 rounded-lg border-2 border-dashed border-[#1FAF9E]/35 bg-[#1FAF9E]/[0.06] px-3 py-2 text-sm text-[#0E0E0E]">
          {reviewerEmail}
        </p>
      </div>

      {submitError ? (
        <p className="text-sm text-red-600" role="alert">
          {submitError}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-full bg-[#1FAF9E] px-4 py-3 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(31,175,158,0.45)] transition hover:bg-[#169786] hover:shadow-[0_6px_20px_rgba(31,175,158,0.5)] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
      >
        {isSubmitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
