"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ThumbsUp } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { HELPFUL_SIGNOUT_EVENT } from "@/lib/helpfulSignoutEvent";

const MSG_ALREADY_LIKED_BUSINESS =
  "You already left a like for this business.";

const PENDING_HELPFUL_VOTE_KEY = "tellacity_pending_helpful_vote_review_id";
const HELPFUL_GOOGLE_EPHEMERAL_KEY = "tellacity_helpful_google_ephemeral";
function GoogleGIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M23.49 12.27c0-.81-.07-1.6-.2-2.36H12v4.48h6.47a5.54 5.54 0 01-2.4 3.64v3.02h3.88c2.27-2.09 3.54-5.18 3.54-8.78z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.88-3.02c-1.08.72-2.46 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.12A12 12 0 0012 24z"
        fill="#34A853"
      />
      <path
        d="M5.25 14.25a7.2 7.2 0 010-4.5V6.63H1.25a12 12 0 000 10.74l4-3.12z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.78c1.76 0 3.35.6 4.6 1.77l3.45-3.45C17.96 1.14 15.23 0 12 0 7.3 0 3.22 2.69 1.25 6.63l4 3.12C6.2 6.9 8.86 4.78 12 4.78z"
        fill="#EA4335"
      />
    </svg>
  );
}

type ReviewReactionButtonsProps = {
  reviewId: string | null | undefined;
  initialLikeCount?: number;
  /**
   * Skip the on-mount GET /api/reviews/helpful?reviewId=... refresh.
   * The landing page renders 60+ cards and used to fire 60+ requests
   * (around 1.3s each). Pass `false` there because `initialLikeCount` is
   * already accurate from SSR (home_feed_v2.like_count). The button still
   * refreshes after a vote and on the helpful-signout event.
   */
  refreshOnMount?: boolean;
};

export default function ReviewReactionButtons({
  reviewId,
  initialLikeCount = 0,
  refreshOnMount = true,
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
  const [helpfulError, setHelpfulError] = useState<string | null>(null);

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
      setHasVoted(Boolean(data.hasVoted));
    } catch {
      /* ignore */
    }
  }, [reviewId]);

  useEffect(() => {
    if (!refreshOnMount) return;
    refreshStatus();
  }, [refreshStatus, refreshOnMount]);

  useEffect(() => {
    const fn = () => {
      void refreshStatus();
    };
    window.addEventListener(HELPFUL_SIGNOUT_EVENT, fn);
    return () => window.removeEventListener(HELPFUL_SIGNOUT_EVENT, fn);
  }, [refreshStatus]);

  const runPendingGoogleHelpfulVote = useCallback(async () => {
    if (!reviewId || typeof window === "undefined") return;
    const pending = window.localStorage.getItem(PENDING_HELPFUL_VOTE_KEY);
    if (pending !== reviewId) return;

    // Claim immediately before any await , otherwise INITIAL_SESSION + effect + Strict Mode
    // can both see the same pending id and POST vote_auth twice (2nd → already_liked).
    window.localStorage.removeItem(PENDING_HELPFUL_VOTE_KEY);

    const ephemeral =
      window.localStorage.getItem(HELPFUL_GOOGLE_EPHEMERAL_KEY) === "1";

    let token: string | undefined;
    try {
      const sb = supabaseBrowser();
      const { data: sessionData } = await sb.auth.getSession();
      token = sessionData.session?.access_token;
    } catch {
      return;
    }
    if (!token) {
      if (ephemeral) {
        window.localStorage.removeItem(HELPFUL_GOOGLE_EPHEMERAL_KEY);
      }
      return;
    }

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
      };
      if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
      if (res.ok) {
        setHasVoted(true);
        setHelpfulError(null);
        setModalOpen(false);
      } else if (data.error === "already_liked_business") {
        setHelpfulError(MSG_ALREADY_LIKED_BUSINESS);
        setModalOpen(false);
      } else {
        setHelpfulError("Something went wrong. Please try again.");
      }
    } catch {
      setHelpfulError("Something went wrong. Please try again.");
    } finally {
      if (ephemeral && typeof window !== "undefined") {
        window.localStorage.removeItem(HELPFUL_GOOGLE_EPHEMERAL_KEY);
        try {
          await supabaseBrowser().auth.signOut();
        } catch {
          /* ignore */
        }
        window.dispatchEvent(new Event(HELPFUL_SIGNOUT_EVENT));
      }
    }
  }, [reviewId]);

  useEffect(() => {
    if (!reviewId) return;
    void runPendingGoogleHelpfulVote();
    const { data: sub } = supabaseBrowser().auth.onAuthStateChange(
      (event, session) => {
        if (
          session?.access_token &&
          (event === "SIGNED_IN" || event === "INITIAL_SESSION")
        ) {
          void runPendingGoogleHelpfulVote();
        }
      },
    );
    return () => sub.subscription.unsubscribe();
  }, [reviewId, runPendingGoogleHelpfulVote]);

  const closeModal = () => {
    setModalOpen(false);
    setGuestStep("form");
    setGuestName("");
    setGuestEmail("");
    setGuestCode("");
    setFormError(null);
  };

  const handleGoogleContinueInModal = async () => {
    if (typeof window === "undefined" || !reviewId) return;
    setFormError(null);
    try {
      window.localStorage.setItem(PENDING_HELPFUL_VOTE_KEY, reviewId);
      window.localStorage.setItem(HELPFUL_GOOGLE_EPHEMERAL_KEY, "1");
      const baseUrl = getBaseUrl();
      const nextPath = `${window.location.pathname}${window.location.search}`;
      const { error } = await supabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });
      if (error) {
        window.localStorage.removeItem(PENDING_HELPFUL_VOTE_KEY);
        window.localStorage.removeItem(HELPFUL_GOOGLE_EPHEMERAL_KEY);
        setFormError(error.message);
      }
    } catch {
      window.localStorage.removeItem(PENDING_HELPFUL_VOTE_KEY);
      window.localStorage.removeItem(HELPFUL_GOOGLE_EPHEMERAL_KEY);
      setFormError("Could not start Google sign-in.");
    }
  };

  const handleHelpfulClick = async () => {
    if (!reviewId || loading) return;

    const pendingId =
      typeof window !== "undefined"
        ? window.localStorage.getItem(PENDING_HELPFUL_VOTE_KEY)
        : null;
    const ephemeralOAuth =
      typeof window !== "undefined" &&
      window.localStorage.getItem(HELPFUL_GOOGLE_EPHEMERAL_KEY) === "1";
    const pendingForOtherReview = Boolean(pendingId && pendingId !== reviewId);

    let token: string | undefined;
    try {
      const sb = supabaseBrowser();
      const { data: sessionData } = await sb.auth.getSession();
      token = sessionData.session?.access_token;
    } catch {
      token = undefined;
    }

    if (token && !ephemeralOAuth && !pendingForOtherReview) {
      setHelpfulError(null);
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
        if (res.ok) {
          setHasVoted(true);
        } else if (data.error === "already_liked_business") {
          setHelpfulError(MSG_ALREADY_LIKED_BUSINESS);
        } else {
          setHelpfulError("Something went wrong. Please try again.");
        }
      } finally {
        setLoading(false);
      }
      return;
    }

    setHelpfulError(null);
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

      if (!res.ok) {
        if (data.error === "already_liked_business") {
          if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
          setFormError(MSG_ALREADY_LIKED_BUSINESS);
        } else if (data.error === "email_unavailable") {
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
        if (data.error === "already_liked_business") {
          if (typeof data.likeCount === "number") setLikeCount(data.likeCount);
          setFormError(MSG_ALREADY_LIKED_BUSINESS);
        } else if (data.error === "otp_expired") {
          setFormError("That code has expired. Close and start again.");
        } else if (data.error === "otp_invalid") {
          setFormError("Incorrect code. Please try again.");
        } else if (data.error === "vote_failed") {
          setFormError("We couldn’t save your like. Please try again.");
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

  const disabled = !reviewId || loading;

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
              {guestStep !== "form" ? (
                <p className="mt-2 text-xs text-slate-500">
                  {"Didn't receive the email? Check your spam or junk folder."}
                </p>
              ) : null}

              {guestStep === "form" ? (
                <div className="mt-4 space-y-3">
                  <button
                    type="button"
                    onClick={handleGoogleContinueInModal}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#1FAF9E] hover:bg-slate-50 disabled:opacity-50"
                  >
                    <GoogleGIcon className="h-4 w-4 shrink-0" />
                    Continue with Google
                  </button>
                  <p className="text-center text-[11px] text-slate-400">
                    or enter your details below
                  </p>
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
      <div className="inline-flex flex-col items-start gap-0.5">
        <button
          type="button"
          disabled={disabled}
          onClick={handleHelpfulClick}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#124541] disabled:opacity-50"
        >
          <ThumbsUp className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
          Helpful ({likeCount})
        </button>
        {helpfulError ? (
          <p className="max-w-[220px] text-[10px] leading-snug text-red-600">
            {helpfulError}
          </p>
        ) : null}
      </div>
      {modal}
    </>
  );
}
