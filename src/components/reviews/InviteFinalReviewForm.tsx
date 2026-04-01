"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export type InviteFinalReviewFormProps = {
  businessId: string;
  businessName: string;
  reviewerEmail: string;
  inviteId: string;
  onSuccess?: () => void;
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

      const payload: Record<string, unknown> = {
        business_id: businessId,
        rating,
        title: title.trim() || null,
        body: trimmedBody,
        guest_email: reviewerEmail.trim(),
        guest_name,
        date_of_experience,
        invite_id: inviteId,
      };
      if (receipt_url) {
        payload.receipt_url = receipt_url;
      }

      const res = await fetch("/api/reviews/create-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => ({}))) as {
        published?: boolean;
        error?: string;
      };

      if (!res.ok) {
        setSubmitError(humanizeApiError(data));
        return;
      }

      if (data.published === true) {
        onSuccess?.();
        return;
      }

      setSubmitError(
        "Your review could not be published from this form. Please try again or contact support.",
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
      className="space-y-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <div>
        <h2 className="text-lg font-semibold text-gray-900">Write your review</h2>
        <p className="mt-1 text-sm text-gray-600">{businessName}</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Rating</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setRating(n)}
              className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                rating === n
                  ? "border-gray-900 bg-gray-900 text-white"
                  : "border-gray-200 bg-white text-gray-800 hover:border-gray-300"
              }`}
            >
              {n} star{n === 1 ? "" : "s"}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="invite-review-title" className="block text-sm font-medium text-gray-700">
          Title <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="invite-review-title"
          type="text"
          value={title}
          onChange={(ev) => setTitle(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          maxLength={200}
          autoComplete="off"
        />
      </div>

      <div>
        <label htmlFor="invite-review-body" className="block text-sm font-medium text-gray-700">
          Your review
        </label>
        <textarea
          id="invite-review-body"
          required
          value={body}
          onChange={(ev) => setBody(ev.target.value)}
          rows={6}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          placeholder="Share your experience…"
        />
      </div>

      <div>
        <label htmlFor="invite-review-date" className="block text-sm font-medium text-gray-700">
          Date of experience <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="invite-review-date"
          type="date"
          value={dateOfExperience}
          onChange={(ev) => setDateOfExperience(ev.target.value)}
          max={todayIsoDate()}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
        />
      </div>

      <div>
        <label htmlFor="invite-review-proof" className="block text-sm font-medium text-gray-700">
          Proof upload <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="invite-review-proof"
          type="file"
          accept={PROOF_TYPES.join(",")}
          onChange={onProofChange}
          className="mt-1 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-800"
        />
        {proofError ? <p className="mt-1 text-xs text-red-600">{proofError}</p> : null}
      </div>

      <div>
        <label htmlFor="invite-review-display-name" className="block text-sm font-medium text-gray-700">
          Display name <span className="font-normal text-gray-500">(optional)</span>
        </label>
        <input
          id="invite-review-display-name"
          type="text"
          value={guestName}
          onChange={(ev) => setGuestName(ev.target.value)}
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
          maxLength={200}
          placeholder={defaultGuestName(reviewerEmail)}
          autoComplete="name"
        />
        <p className="mt-1 text-xs text-gray-500">
          If left blank, we use the part of your email before @.
        </p>
      </div>

      <div>
        <span className="block text-sm font-medium text-gray-700">Email</span>
        <p className="mt-1 rounded-lg border border-dashed border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800">
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
        className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting…" : "Submit review"}
      </button>
    </form>
  );
}
