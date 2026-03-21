"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ThumbsUp } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type ReviewReactionButtonsProps = {
  reviewId: string | null | undefined;
  initialLikeCount?: number;
};

export default function ReviewReactionButtons({
  reviewId,
  initialLikeCount = 0,
}: ReviewReactionButtonsProps) {
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [hasVoted, setHasVoted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [guestStep, setGuestStep] = useState<"form" | "code">("form");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCode, setGuestCode] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setLikeCount(initialLikeCount);
  }, [initialLikeCount]);

  const refreshStatus = useCallback(async () => {
    if (!reviewId) return;
    try {
      const sb = supabaseBrowser();
      const { data: sessionData } = await sb.auth.getSession();
      const token = sessionData.session?.access_token;
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(
        `/api/reviews/helpful?reviewId=${encodeURIComponent(reviewId)}`,
        { headers }
      );
      if (!res.ok) return;
      const data = (await res.json()) as {
        likeCount?: number;
        hasVoted?: boolean;
      };
      if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
      if (data.hasVoted) setHasVoted(true);
    } catch {
      /* ignore */
    }
  }, [reviewId]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const closeModal = () => {
    setModalOpen(false);
    setGuestStep("form");
    setGuestName("");
    setGuestEmail("");
    setGuestCode("");
    setFormError(null);
  };

  const handleHelpfulClick = async () => {
    if (!reviewId || hasVoted || loading) return;

    let token: string | undefined;
    try {
      const sb = supabaseBrowser();
      const { data: sessionData } = await sb.auth.getSession();
      token = sessionData.session?.access_token;
    } catch {
      token = undefined;
    }

    if (token) {
      setLoading(true);
      try {
        const res = await fetch("/api/reviews/helpful", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ action: "vote_auth", reviewId }),
        });
        const data = (await res.json()) as {
          likeCount?: number;
          error?: string;
          alreadyVoted?: boolean;
        };
        if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
        if (res.ok || data.alreadyVoted) setHasVoted(true);
      } finally {
        setLoading(false);
      }
      return;
    }

    setFormError(null);
    setGuestStep("form");
    setModalOpen(true);
  };

  const handlePublishLike = async () => {
    if (!reviewId) return;
    setFormError(null);
    const name = guestName.trim();
    const email = guestEmail.trim();
    if (!name) {
      setFormError("Please enter your name.");
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setFormError("Please enter a valid email.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/reviews/helpful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "request_otp",
          reviewId,
          guestName: name,
          guestEmail: email,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        likeCount?: number;
        hasVoted?: boolean;
      };

      if (data.error === "already_voted") {
        if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
        setHasVoted(true);
        closeModal();
        setLoading(false);
        return;
      }

      if (!res.ok) {
        if (data.error === "email_unavailable") {
          setFormError("Email delivery is temporarily unavailable. Please try again later.");
        } else if (data.error === "email_failed") {
          setFormError("We couldn’t send the email. Please try again in a moment.");
        } else if (
          data.error === "helpful_db_missing" ||
          data.error === "helpful_db_permission"
        ) {
          setFormError(
            "We couldn’t send the verification code. Please try again later.",
          );
        } else if (data.error === "otp_failed") {
          setFormError("Verification isn’t available right now. Please try again later.");
        } else if (data.error === "invalid_name") {
          setFormError("Please enter a valid name (max 120 characters).");
        } else if (data.error === "invalid_email") {
          setFormError("Please enter a valid email.");
        } else {
          setFormError("Could not send the code. Please try again.");
        }
        setLoading(false);
        return;
      }

      setGuestStep("code");
      setLoading(false);
    } catch {
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const handleVerifyAndPublish = async () => {
    if (!reviewId) return;
    const code = guestCode.trim().replace(/\s/g, "");
    if (!/^[0-9]{6}$/.test(code)) {
      setFormError("Enter the 6-digit code from your email.");
      return;
    }

    setFormError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/reviews/helpful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "confirm_otp",
          reviewId,
          guestEmail: guestEmail.trim(),
          code,
        }),
      });
      const data = (await res.json()) as {
        likeCount?: number;
        error?: string;
        alreadyVoted?: boolean;
      };

      if (!res.ok) {
        if (data.error === "otp_expired") {
          setFormError("That code has expired. Close and start again.");
        } else if (data.error === "otp_invalid") {
          setFormError("Incorrect code. Please try again.");
        } else {
          setFormError("Verification failed. Please try again.");
        }
        setLoading(false);
        return;
      }

      if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
      setHasVoted(true);
      closeModal();
      setLoading(false);
    } catch {
      setFormError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  const disabled = !reviewId || hasVoted || loading;

  const modal =
    modalOpen && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="helpful-guest-title"
          >
            <button
              type="button"
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              aria-label="Close"
              onClick={() => !loading && closeModal()}
            />
            <div className="relative z-10 w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
              <h2
                id="helpful-guest-title"
                className="text-lg font-semibold text-[#0E0E0E]"
              >
                Mark review as helpful
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                {guestStep === "form"
                  ? "Enter your details. We’ll email you a short code to confirm."
                  : `We sent a 6-digit code to ${guestEmail.trim() || "your email"}.`}
              </p>

              {guestStep === "form" ? (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1FAF9E] focus:ring-2 focus:ring-[#1FAF9E]/30"
                      autoComplete="name"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Email
                    </label>
                    <input
                      type="email"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#1FAF9E] focus:ring-2 focus:ring-[#1FAF9E]/30"
                      autoComplete="email"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handlePublishLike}
                    disabled={loading}
                    className="mt-2 w-full rounded-full bg-[#124541] py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f3a36] disabled:opacity-50"
                  >
                    {loading ? "Sending…" : "Publish like"}
                  </button>
                </div>
              ) : (
                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700">
                      Verification code
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={guestCode}
                      onChange={(e) =>
                        setGuestCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm tracking-widest outline-none focus:border-[#1FAF9E] focus:ring-2 focus:ring-[#1FAF9E]/30"
                      placeholder="000000"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyAndPublish}
                    disabled={loading}
                    className="mt-2 w-full rounded-full bg-[#1FAF9E] py-2.5 text-sm font-semibold text-white transition hover:bg-[#169786] disabled:opacity-50"
                  >
                    {loading ? "Verifying…" : "Verify and publish like"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setGuestStep("form");
                      setGuestCode("");
                      setFormError(null);
                    }}
                    disabled={loading}
                    className="w-full text-center text-xs font-medium text-slate-500 hover:text-[#124541]"
                  >
                    ← Back
                  </button>
                </div>
              )}

              {formError ? (
                <p className="mt-3 text-sm text-red-600">{formError}</p>
              ) : null}

              <button
                type="button"
                onClick={() => !loading && closeModal()}
                className="mt-4 w-full text-center text-xs text-slate-500 hover:underline"
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={handleHelpfulClick}
        className={`inline-flex items-center gap-1.5 text-xs font-medium ${
          hasVoted
            ? "cursor-default text-[#124541]"
            : "text-slate-500 hover:text-[#124541]"
        } disabled:opacity-50`}
      >
        <ThumbsUp className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
        Helpful ({likeCount})
      </button>
      {modal}
    </>
  );
}
