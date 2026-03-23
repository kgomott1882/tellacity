"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { REVIEWS_PUBLIC_VISIBILITY_OR } from "@/lib/reviewVisibility";
import RatingStars from "@/components/RatingStars";

type Review = {
  id: string;
  guest_name: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  created_at: string;
  business_id: string;
  businesses: { name: string | null; slug: string | null } | null;
};

type Reply = {
  id: string;
  body: string;
  created_at: string;
  author_role: string;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ReviewPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : null;
  const [review, setReview] = useState<Review | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      const supabase = supabaseBrowser();
      const { data: reviewData, error: reviewErr } = await supabase
        .from("reviews")
        .select("id, guest_name, rating, title, body, created_at, business_id, businesses(name, slug)")
        .eq("id", id)
        .or("status.is.null,status.eq.published")
        .or(REVIEWS_PUBLIC_VISIBILITY_OR)
        .single();

      if (!mounted) return;
      if (reviewErr || !reviewData) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      const normalized = {
        ...reviewData,
        businesses: Array.isArray((reviewData as any).businesses)
          ? ((reviewData as any).businesses[0] ?? null)
          : ((reviewData as any).businesses ?? null),
      };

      setReview(normalized as unknown as Review);

      const { data: replyData } = await supabase
        .from("review_replies")
        .select("id, body, created_at, author_role")
        .eq("review_id", id)
        .eq("author_role", "business")
        .order("created_at", { ascending: true });

      if (mounted) setReplies((replyData as Reply[]) ?? []);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="mx-auto max-w-2xl">
          <div className="h-8 w-48 rounded bg-gray-200 animate-pulse" />
          <div className="mt-6 h-32 rounded-xl bg-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  if (notFound || !review) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-xl font-semibold text-gray-900">Review not found</h1>
          <p className="mt-2 text-sm text-gray-600">This review may have been removed or the link is invalid.</p>
          <Link href="/" className="mt-6 inline-block text-sm font-medium text-[#1FAF9E] hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const business = review.businesses;
  const businessSlug = business?.slug;
  const businessName = business?.name ?? "Business";

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="mx-auto max-w-2xl">
        <Link
          href={businessSlug ? `/b/${businessSlug}` : "/"}
          className="text-sm font-medium text-[#1FAF9E] hover:underline"
        >
          ← {businessName}
        </Link>

        <article className="mt-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#124541] text-lg font-semibold text-white">
                {(review.guest_name ?? "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{review.guest_name ?? "Anonymous"}</p>
                <p className="text-sm text-gray-500">{formatDate(review.created_at)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <RatingStars rating={review.rating} size={20} editable={false} />
              <span className="text-sm text-gray-500">
                {review.rating} star{review.rating !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {review.title && (
            <h2 className="mt-4 text-lg font-semibold text-gray-900">{review.title}</h2>
          )}
          <p className="mt-2 whitespace-pre-wrap text-gray-700">{review.body ?? ""}</p>
        </article>

        {replies.length > 0 && (
          <section className="mt-6 space-y-4">
            <p className="font-semibold text-sm text-gray-800">
              Reply from {businessName}
            </p>
            {replies.map((reply) => (
              <div
                key={reply.id}
                className="rounded-2xl border border-[#124541]/20 bg-[#124541]/5 p-5"
              >
                <p className="whitespace-pre-wrap text-gray-800">{reply.body}</p>
                <p className="mt-3 text-xs text-gray-500">{formatDate(reply.created_at)}</p>
              </div>
            ))}
          </section>
        )}

        {replies.length === 0 && (
          <p className="mt-6 text-center text-sm text-gray-500">No response from the business yet.</p>
        )}
      </div>
    </div>
  );
}
