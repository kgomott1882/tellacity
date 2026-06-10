"use client";

import Link from "next/link";
import { sanitizeText } from "@/lib/sanitizeText";
import type { BusinessProfileResponseEntry } from "@/lib/businessProfileResponses";

type Props = {
  businessName: string;
  entries: BusinessProfileResponseEntry[];
  awaitingResponseCount?: number;
};

export default function BusinessProfileResponses({
  businessName,
  entries,
  awaitingResponseCount = 0,
}: Props) {
  const latestEntry = entries[0] ?? null;
  const hasResponses = latestEntry != null;
  const review = latestEntry?.review;
  const latestReply =
    latestEntry?.replies[latestEntry.replies.length - 1] ??
    latestEntry?.replies[0] ??
    null;

  return (
    <section className="biz-responses-section" aria-labelledby="business-responses-heading">
      <h2 id="business-responses-heading" className="biz-section-title text-lg">
        <span className="biz-section-accent">Business</span> responses
      </h2>
      <p className="biz-section-sub mt-2 text-sm">
        Official replies from {sanitizeText(businessName)} to customer reviews.
      </p>

      {!hasResponses ? (
        <div className="mt-4 rounded-xl border border-gray-200 bg-white px-4 py-5">
          <p className="text-sm text-gray-600">
            {awaitingResponseCount === 1
              ? "This business has not responded to a customer review yet."
              : `This business has not responded to ${awaitingResponseCount.toLocaleString("en-US")} customer reviews yet.`}
          </p>
        </div>
      ) : (
        <article className="mt-4 rounded-xl border border-[#1FAF9E]/20 bg-[#1FAF9E]/5 px-4 py-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#0E4E45]">
            Latest response from {sanitizeText(businessName)}
          </p>
          {latestReply?.createdAt ? (
            <p className="mt-0.5 text-xs text-gray-500">{latestReply.createdAt}</p>
          ) : null}
          {latestReply ? (
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-gray-800">
              {sanitizeText(latestReply.body)}
            </p>
          ) : null}
          {review ? (
            <Link
              href={`/review/id/${encodeURIComponent(review.id)}`}
              className="biz-link-teal mt-4 inline-flex text-sm font-semibold hover:underline"
            >
              View full review and response →
            </Link>
          ) : null}
        </article>
      )}
    </section>
  );
}
