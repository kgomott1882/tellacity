"use client";

import { useEffect, useState } from "react";
import { useBusinessContext } from "../_context/BusinessContext";
import { getOptionalAccessToken } from "@/lib/dashboardApiFetch";
import { supabase } from "@/lib/supabaseBrowser";
import PageLoadingOverlay from "../_components/PageLoadingOverlay";
import RatingStars from "@/components/RatingStars";
import { MessageCircle, Share2, Flag, Link2 } from "lucide-react";
import Image from "next/image";

type ReviewRow = {
  id: string;
  guest_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reference_number: string | null;
  owner_response: string | null;
  owner_response_at: string | null;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ManageReviewsPage() {
  const { selectedBusiness, navRefreshKey } = useBusinessContext() as any;
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeReplyReviewId, setActiveReplyReviewId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [replyError, setReplyError] = useState<string | null>(null);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [confirmDeleteReviewId, setConfirmDeleteReviewId] = useState<string | null>(null);
  const [shareReviewId, setShareReviewId] = useState<string | null>(null);
  const [flagReviewId, setFlagReviewId] = useState<string | null>(null);
  const [flagReason, setFlagReason] = useState("");
  const [flagSubmitting, setFlagSubmitting] = useState(false);
  const [flagError, setFlagError] = useState<string | null>(null);
  const [flagSuccess, setFlagSuccess] = useState(false);
  const [flaggedReviews, setFlaggedReviews] = useState<Record<string, string>>({});
  const [alreadyFlaggedPopup, setAlreadyFlaggedPopup] = useState(false);
  const [alreadyFlaggedMessage, setAlreadyFlaggedMessage] = useState("");
  const [inboxLoading, setInboxLoading] = useState(false);

  const businessId = selectedBusiness?.id ?? null;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!businessId) {
        setReviews([]);
        setFlaggedReviews({});
        setInboxLoading(false);
        return;
      }
      setInboxLoading(true);
      setError(null);
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          if (!cancelled) {
            setError("Could not load reviews.");
            setReviews([]);
            setFlaggedReviews({});
          }
          return;
        }

        const { data, error } = await supabase
          .from("reviews")
          .select(
            `
            id,
            rating,
            title,
            body,
            created_at,
            guest_name,
            reference_number,
            owner_response,
            owner_response_at
          `
          )
          .eq("business_id", businessId)
          .eq("status", "published")
          .eq("visibility", "visible")
          .order("created_at", { ascending: false });

        if (error) {
          if (!cancelled) {
            setError("Could not load reviews.");
            setReviews([]);
            setFlaggedReviews({});
          }
          return;
        }

        const list = (data ?? []) as ReviewRow[];
        if (cancelled) return;
        setReviews(list);

        const { data: flaggedData, error: flagErr } = await supabase
          .from("review_flags")
          .select("review_id, status")
          .eq("user_id", session.user.id);

        if (!cancelled) {
          const nextFlagged: Record<string, string> = {};
          if (!flagErr && flaggedData) {
            for (const f of flaggedData) {
              nextFlagged[f.review_id] = f.status;
            }
          }
          setFlaggedReviews(nextFlagged);
        }
      } catch {
        if (!cancelled) {
          setError("Could not load reviews.");
          setReviews([]);
          setFlaggedReviews({});
        }
      } finally {
        if (!cancelled) setInboxLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [businessId, navRefreshKey]);

  useEffect(() => {
    if (flagSuccess) {
      const timer = setTimeout(() => {
        setFlagSuccess(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [flagSuccess]);

  const handlePostReply = async (reviewId: string) => {
    const body = replyDrafts[reviewId]?.trim();

    if (!body) {
      setReplyError("Please enter a reply before posting.");
      return;
    }

    try {
      setReplySubmitting(true);
      setReplyError(null);

      const token = await getOptionalAccessToken();

      const res = await fetch(
        `/api/business/reviews/${reviewId}/reply`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ body }),
        }
      );

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to post reply.");
      }

      const rv = result.review as {
        owner_response: string | null;
        owner_response_at: string | null;
      };
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, owner_response: rv.owner_response, owner_response_at: rv.owner_response_at }
            : r
        )
      );

      setReplyDrafts((prev) => ({
        ...prev,
        [reviewId]: "",
      }));

      setActiveReplyReviewId(null);
    } catch (err: unknown) {
      setReplyError(err instanceof Error ? err.message : "Failed to post reply.");
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleReplyCancel = () => {
    if (activeReplyReviewId) {
      setReplyDrafts((prev) => ({ ...prev, [activeReplyReviewId]: "" }));
    }
    setActiveReplyReviewId(null);
    setReplyError(null);
  };

  const handleSaveEdit = async (reviewId: string) => {
    const token = await getOptionalAccessToken();

    const res = await fetch(`/api/business/reviews/${reviewId}/reply`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ body: editDraft }),
    });

    if (res.ok) {
      const json = (await res.json()) as {
        review?: { owner_response: string | null; owner_response_at: string | null };
      };
      if (json.review) {
        setReviews((prev) =>
          prev.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  owner_response: json.review!.owner_response,
                  owner_response_at: json.review!.owner_response_at,
                }
              : r
          )
        );
      }
      setEditingReviewId(null);
    }
  };

  const handleDeleteReply = async (reviewId: string) => {
    const token = await getOptionalAccessToken();

    const res = await fetch(`/api/business/reviews/${reviewId}/reply`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (res.ok) {
      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId
            ? { ...r, owner_response: null, owner_response_at: null }
            : r
        )
      );
    }
  };

  return (
    <div className="max-w-5xl space-y-6">
      {inboxLoading && businessId ? <PageLoadingOverlay /> : null}
      <h1 className="text-2xl font-semibold text-[#0E0E0E]">Manage reviews</h1>
      <p className="mt-2 text-sm text-gray-500">Monitor, moderate, and manage customer feedback.</p>

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0E0E0E]">Your review inbox</h2>
        <p className="mt-1 text-sm text-gray-500">New reviews and replies will appear here.</p>
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {!error && reviews.length === 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
          <p>No reviews yet for this business.</p>
          <p className="mt-1">Reviews will appear here once customers submit them.</p>
        </div>
      )}

      {!error && reviews.length > 0 && (
        <ul className="mt-6 space-y-4">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#124541] text-sm font-semibold text-white">
                    {(review.guest_name ?? "?").charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0E0E0E]">
                      {review.guest_name ?? "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <RatingStars rating={review.rating} size={16} editable={false} />
                  <span className="text-xs text-gray-500">
                    {review.rating} star{review.rating !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {review.title && (
                <p className="mt-3 text-sm font-medium text-[#0E0E0E]">
                  {review.title}
                </p>
              )}
              <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap">
                {review.body ?? ""}
              </p>

              {review.reference_number && (
                <p className="mt-3 inline-flex items-center rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  Reference number: {review.reference_number}
                </p>
              )}

              {review.owner_response && (
                <div className="mt-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <p className="text-xs font-medium text-[#124541] mb-2">Your reply</p>
                  {editingReviewId === review.id ? (
                    <>
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        className="w-full border rounded-md p-3 text-sm"
                        rows={4}
                      />
                      <div className="flex gap-2 mt-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(review.id)}
                          className="px-4 py-2 bg-[#124541] text-white rounded-md text-sm"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingReviewId(null)}
                          className="px-4 py-2 bg-gray-200 rounded-md text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="mt-0 text-sm text-[#124541] whitespace-pre-wrap">{review.owner_response}</p>
                      <div className="flex gap-4 mt-2 items-center">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingReviewId(review.id);
                            setEditDraft(review.owner_response ?? "");
                          }}
                          className="text-[#124541] hover:text-[#0b322f] transition-colors"
                          title="Edit reply"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M11 5h2M12 3v2m7 7l-9 9H5v-5l9-9 5 5z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteReviewId(review.id)}
                          className="text-[#124541] hover:text-[#0b322f] transition-colors"
                          title="Delete reply"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M6 7h12M9 7V4h6v3m-7 4v6m4-6v6m5 5H7a2 2 0 01-2-2V7h14v13a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                      {review.owner_response_at && (
                        <p className="mt-2 text-xs text-gray-500">
                          {formatDate(review.owner_response_at)}
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}

              <div className="mt-4 relative z-10 flex flex-wrap items-center gap-3">
                {!review.owner_response && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setActiveReplyReviewId(review.id);
                    setReplyError(null);
                  }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-2 border-[#124541] bg-white px-3 py-2 text-xs font-semibold text-[#124541] hover:bg-[#124541]/5 active:bg-[#124541]/10"
                >
                  <MessageCircle size={14} />
                  Reply
                </button>
                )}
                <button
                  type="button"
                  onClick={() => setShareReviewId(review.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const flagStatus = flaggedReviews[review.id];

                    if (flagStatus === "pending") {
                      setAlreadyFlaggedMessage(
                        "This review is already flagged and under review."
                      );
                      setAlreadyFlaggedPopup(true);
                      return;
                    }

                    if (flagStatus === "rejected") {
                      setAlreadyFlaggedMessage(
                        "This review cannot be flagged again!"
                      );
                      setAlreadyFlaggedPopup(true);
                      return;
                    }

                    setFlagReviewId(review.id);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium ${
                    (() => {
                      const flagStatus = flaggedReviews[review.id];
                      const isPending = flagStatus === "pending";
                      const isFinalized = flagStatus === "approved" || flagStatus === "rejected";
                      if (isPending) return "text-red-600";
                      if (isFinalized) return "text-gray-400";
                      return "text-gray-500 hover:text-red-600";
                    })()
                  }`}
                >
                  <Flag size={14} />
                  Flag
                </button>
              </div>

              {activeReplyReviewId === review.id && !review.owner_response && (
                <div className="relative z-20 mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <textarea
                    value={replyDrafts[review.id] || ""}
                    onChange={(e) =>
                      setReplyDrafts((prev) => ({
                        ...prev,
                        [review.id]: e.target.value,
                      }))
                    }
                    placeholder="Write your reply..."
                    rows={3}
                    className="w-full border rounded-md p-3"
                  />
                  {replyError && (
                    <p className="mt-2 text-xs text-red-600">{replyError}</p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handlePostReply(review.id);
                      }}
                      disabled={replySubmitting}
                      className={`px-4 py-2 rounded-md font-medium transition-all
                        ${
                          replySubmitting
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-[#124541] text-white hover:opacity-90 cursor-pointer"
                        }`}
                    >
                      {replySubmitting ? "Posting…" : "Post reply"}
                    </button>
                    <button
                      type="button"
                      onClick={handleReplyCancel}
                      disabled={replySubmitting}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {shareReviewId && selectedBusiness?.slug && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[360px] shadow-lg">

            <h3 className="font-semibold mb-4 text-sm">
              Share this review
            </h3>

            {(() => {
              const reviewUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/b/${selectedBusiness!.slug}?review=${shareReviewId}`;
              return (
                <div className="flex flex-col gap-3 text-sm">

                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(reviewUrl);
                      setShareReviewId(null);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md text-left"
                  >
                    <Link2 className="w-4 h-4 shrink-0 text-gray-600" />
                    Copy link
                  </button>

                  <a
                    href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(reviewUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md"
                  >
                    <Image src="/brand/LinkedIn.jpg" alt="" width={20} height={20} className="rounded shrink-0" />
                    Share on LinkedIn
                  </a>

                  <a
                    href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(reviewUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md"
                  >
                    <Image src="/brand/X.jpg" alt="" width={20} height={20} className="rounded shrink-0" />
                    Share on X
                  </a>

                  <a
                    href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(reviewUrl)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md"
                  >
                    <Image src="/brand/FACEBOOK.jpg" alt="" width={20} height={20} className="rounded shrink-0" />
                    Share on Facebook
                  </a>

                  <button
                    type="button"
                    onClick={() => setShareReviewId(null)}
                    className="mt-2 text-gray-500"
                  >
                    Cancel
                  </button>

                </div>
              );
            })()}

          </div>
        </div>
      )}

      {flagReviewId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg w-[400px] shadow-lg">

            <h3 className="font-semibold mb-3 text-sm">
              Flag this review
            </h3>

            <textarea
              value={flagReason}
              onChange={(e) => setFlagReason(e.target.value)}
              placeholder="Briefly describe what is wrong with this review..."
              className="w-full border rounded-md p-3 text-sm"
            />

            {flagError && (
              <p className="text-sm text-red-600 mt-2">
                {flagError}
              </p>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setFlagReviewId(null);
                  setFlagReason("");
                  setFlagError(null);
                }}
                className="px-3 py-1.5 bg-gray-100 rounded-md"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={flagSubmitting}
                onClick={async (e) => {
                  e.preventDefault();
                  e.stopPropagation();

                  if (!flagReason.trim()) {
                    setFlagError("Please provide a reason.");
                    return;
                  }

                  try {
                    setFlagSubmitting(true);
                    setFlagError(null);

                    const token = await getOptionalAccessToken();

                    const res = await fetch(
                      `/api/business/reviews/${flagReviewId}/flag`,
                      {
                        method: "POST",
                        credentials: "include",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ reason: flagReason }),
                      }
                    );

                    const result = await res.json();

                    if (!res.ok) {
                      throw new Error(result.error || "Failed to submit flag.");
                    }

                    setFlagReviewId(null);
                    setFlagReason("");

                    setFlagSuccess(true);
                    setFlaggedReviews((prev) => ({ ...prev, [flagReviewId!]: "pending" }));

                  } catch (err: unknown) {
                    setFlagError(err instanceof Error ? err.message : "Failed to submit flag.");
                  } finally {
                    setFlagSubmitting(false);
                  }
                }}
                className={`px-3 py-1.5 rounded-md text-white ${
                  flagSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {flagSubmitting ? "Submitting..." : "Submit Flag"}
              </button>
            </div>

          </div>
        </div>
      )}

      {alreadyFlaggedPopup && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg w-[340px] shadow-lg text-sm">
            <p className="mb-4">
              {alreadyFlaggedMessage}
            </p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setAlreadyFlaggedPopup(false)}
                className="px-3 py-1.5 bg-gray-100 rounded-md"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteReviewId && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-[340px]">
            <h3 className="text-sm font-semibold mb-3">
              Delete reply?
            </h3>

            <p className="text-sm text-gray-600 mb-5">
              Are you sure you want to delete this reply? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteReviewId(null)}
                className="px-3 py-1.5 text-sm bg-gray-100 rounded-md"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={async () => {
                  await handleDeleteReply(confirmDeleteReviewId!);
                  setConfirmDeleteReviewId(null);
                }}
                className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {flagSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999]">
          <div className="bg-green-50 border border-green-200 text-green-800 px-5 py-3 rounded-lg shadow-md text-sm">
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7" />
              </svg>

              <span>
                Review flagged. Our team will review it asap.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
