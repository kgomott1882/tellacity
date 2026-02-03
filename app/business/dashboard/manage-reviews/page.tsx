"use client";

import { useEffect, useState } from "react";
import { useBusinessContext } from "../_context/BusinessContext";
import { supabase } from "@/lib/supabaseBrowser";
import RatingStars from "@/components/RatingStars";
import { MessageCircle, Share2, Flag } from "lucide-react";

type ReviewRow = {
  id: string;
  guest_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  reference_number: string | null;
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
  const { selectedBusiness } = useBusinessContext();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const businessId = selectedBusiness?.id ?? null;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!businessId) {
        setReviews([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from("reviews")
        .select("id, guest_name, rating, title, body, created_at, reference_number")
        .eq("business_id", businessId)
        .in("status", ["published", "pending"])
        .order("created_at", { ascending: false });
      if (!mounted) return;
      if (err) {
        setError("Unable to load reviews.");
        setReviews([]);
      } else {
        setReviews((data as ReviewRow[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  if (!selectedBusiness) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Manage reviews</h1>
        <p className="mt-2 text-sm text-gray-600">
          Select a business from the sidebar to view and manage reviews.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-[#0E0E0E]">Manage reviews</h1>
      <p className="mt-2 text-sm text-gray-600">
        View submitted reviews, reply, share, or flag for moderation.
      </p>

      {loading && (
        <div className="mt-6 space-y-4">
          <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
          <div className="h-32 rounded-xl bg-gray-100 animate-pulse" />
        </div>
      )}

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && reviews.length === 0 && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-600">
          <p>No reviews yet for this business.</p>
          <p className="mt-1">Reviews will appear here once customers submit them.</p>
        </div>
      )}

      {!loading && !error && reviews.length > 0 && (
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

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-[#124541] hover:bg-gray-50"
                >
                  <MessageCircle size={14} />
                  Reply
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  <Share2 size={14} />
                  Share
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
                >
                  <Flag size={14} />
                  Flag
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
