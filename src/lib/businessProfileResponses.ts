import type { SupabaseClient } from "@supabase/supabase-js";

export type BusinessProfileResponseReview = {
  id: string;
  reviewerName: string;
  rating: number;
  title: string;
  body: string;
  createdAt: string;
};

export type BusinessProfileResponseReply = {
  id: string;
  reviewId: string;
  body: string;
  createdAt: string;
};

export type BusinessProfileResponseEntry = {
  review: BusinessProfileResponseReview;
  replies: BusinessProfileResponseReply[];
  latestResponseAt: string;
};

function formatDisplayDate(value: string | null | undefined): string {
  if (!value) return "";
  try {
    return new Date(value).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

function buildRepliesForReview(
  reviewId: string,
  ownerResponse: string | null | undefined,
  ownerResponseAt: string | null | undefined,
  tableReplies: BusinessProfileResponseReply[],
): BusinessProfileResponseReply[] {
  const replies = [...tableReplies];
  const ownerBody = String(ownerResponse ?? "").trim();
  if (ownerBody) {
    const alreadyPresent = replies.some(
      (reply) => reply.body.trim().toLowerCase() === ownerBody.toLowerCase(),
    );
    if (!alreadyPresent) {
      replies.unshift({
        id: `owner-${reviewId}`,
        reviewId,
        body: ownerBody,
        createdAt: formatDisplayDate(ownerResponseAt),
      });
    }
  }
  return replies;
}

export type BusinessProfileResponsesBundle = {
  entries: BusinessProfileResponseEntry[];
  awaitingResponseCount: number;
  totalReviewCount: number;
};

/**
 * Published reviews with a business reply (`reviews.owner_response` and/or `review_replies`),
 * plus counts for whether the public profile should show the responses block.
 */
export async function fetchBusinessProfileResponsesBundle(
  supabase: SupabaseClient,
  businessId: string,
): Promise<BusinessProfileResponsesBundle> {
  const empty: BusinessProfileResponsesBundle = {
    entries: [],
    awaitingResponseCount: 0,
    totalReviewCount: 0,
  };

  const { data: reviewRows, error } = await supabase
    .from("reviews")
    .select(
      "id, guest_name, rating, title, body, created_at, owner_response, owner_response_at",
    )
    .eq("business_id", businessId)
    .eq("status", "published")
    .in("visibility", ["visible", "landing_hidden"])
    .order("created_at", { ascending: false });

  if (error || !reviewRows?.length) return empty;

  const reviewIds = reviewRows.map((row) => String(row.id));
  const replyMap: Record<string, BusinessProfileResponseReply[]> = {};

  const { data: replyRows } = await supabase
    .from("review_replies")
    .select("id, review_id, body, created_at, author_role")
    .in("review_id", reviewIds)
    .eq("author_role", "business")
    .order("created_at", { ascending: true });

  for (const reply of replyRows ?? []) {
    const reviewId = String(reply.review_id);
    if (!replyMap[reviewId]) replyMap[reviewId] = [];
    replyMap[reviewId].push({
      id: String(reply.id),
      reviewId,
      body: String(reply.body ?? ""),
      createdAt: formatDisplayDate(reply.created_at),
    });
  }

  const entries: BusinessProfileResponseEntry[] = [];
  let awaitingResponseCount = 0;

  for (const row of reviewRows) {
    const reviewId = String(row.id);
    const replies = buildRepliesForReview(
      reviewId,
      row.owner_response,
      row.owner_response_at,
      replyMap[reviewId] ?? [],
    );
    if (replies.length === 0) {
      awaitingResponseCount += 1;
      continue;
    }

    const tableLatest = (replyRows ?? [])
      .filter((reply) => String(reply.review_id) === reviewId)
      .map((reply) => String(reply.created_at ?? ""))
      .sort()
      .at(-1);
    const latestResponseAt =
      String(row.owner_response_at ?? "").trim() ||
      tableLatest ||
      String(row.created_at ?? "");

    entries.push({
      review: {
        id: reviewId,
        reviewerName: String(row.guest_name ?? "Customer"),
        rating: Number(row.rating ?? 0),
        title: String(row.title ?? ""),
        body: String(row.body ?? ""),
        createdAt: formatDisplayDate(row.created_at),
      },
      replies,
      latestResponseAt,
    });
  }

  return {
    entries: entries
      .sort((a, b) => b.latestResponseAt.localeCompare(a.latestResponseAt))
      .slice(0, 1),
    awaitingResponseCount,
    totalReviewCount: reviewRows.length,
  };
}

/** @deprecated Use fetchBusinessProfileResponsesBundle */
export async function fetchBusinessProfileResponseEntries(
  supabase: SupabaseClient,
  businessId: string,
): Promise<BusinessProfileResponseEntry[]> {
  const bundle = await fetchBusinessProfileResponsesBundle(supabase, businessId);
  return bundle.entries;
}
