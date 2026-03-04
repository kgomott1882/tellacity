export const runtime = "nodejs";

import { supabaseServer } from "@/lib/supabaseServer";
import { redirect } from "next/navigation";

type VerifyPageProps = {
  // Next.js 16 can pass these as Promises in Server Components
  searchParams: Promise<{ token?: string }> | { token?: string };
};

function isPromise<T>(v: any): v is Promise<T> {
  return typeof v?.then === "function";
}

export default async function ReviewVerifyPage({
  searchParams,
}: VerifyPageProps) {
  const sp = isPromise<{ token?: string }>(searchParams)
    ? await searchParams
    : searchParams;

  const token = sp?.token?.toString().trim();

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Invalid verification link</h1>
        <p className="mb-4 text-gray-500">The verification token is missing.</p>
        <a href="/" className="text-[#1FAF9E] hover:underline">
          Back to home
        </a>
      </div>
    );
  }

  // 1) Fetch the review by token first (so we can handle expiry + already-published properly)
  const { data: found, error: foundErr } = await supabaseServer
    .from("reviews")
    .select("id,business_id,status,draft,draft_token_expires_at")
    .eq("draft_token", token)
    .maybeSingle();

  if (foundErr) {
    // If something is wrong (env key missing etc), show a clean error UI (not “not found”)
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Verification error</h1>
        <p className="mb-4 text-gray-500">
          We couldn’t verify this review right now. Please try again later.
        </p>
        <a href="/" className="text-[#1FAF9E] hover:underline">
          Back to home
        </a>
      </div>
    );
  }

  if (!found) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Review not found</h1>
        <p className="mb-4 text-gray-500">
          This verification link may be invalid or expired.
        </p>
        <a href="/" className="text-[#1FAF9E] hover:underline">
          Back to home
        </a>
      </div>
    );
  }

  // 2) If already published, redirect cleanly (repeat clicks)
  if (found.status === "published") {
    redirect(`/b/${found.business_id}?review=already-published`);
  }

  // 3) Must be a draft review in the guest flow
  // NOTE: We do NOT support "pending" for reviews in this flow.
  if (found.status !== "draft" || found.draft !== true) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Review not found</h1>
        <p className="mb-4 text-gray-500">
          This verification link may be invalid or expired.
        </p>
        <a href="/" className="text-[#1FAF9E] hover:underline">
          Back to home
        </a>
      </div>
    );
  }

  // 4) Expiry check
  if (found.draft_token_expires_at) {
    const expiresAt = new Date(found.draft_token_expires_at).getTime();
    const now = Date.now();
    if (Number.isFinite(expiresAt) && expiresAt <= now) {
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
          <h1 className="mb-2 text-2xl font-semibold">Verification link expired</h1>
          <p className="mb-4 text-gray-500">
            This link has expired. Please submit your review again to receive a
            new verification email.
          </p>
          <a href="/" className="text-[#1FAF9E] hover:underline">
            Back to home
          </a>
        </div>
      );
    }
  }

  // 5) Publish atomically by ID + token + draft status
  const nowIso = new Date().toISOString();

  const { data: published, error: publishErr } = await supabaseServer
    .from("reviews")
    .update({
      status: "published",
      draft: false,
      verification_status: "verified",
      verified_at: nowIso,
      // KEEP draft_token so repeat clicks can redirect to already-published
      // If you want maximum security later, store used tokens in a separate table and then clear this.
    })
    .eq("id", found.id)
    .eq("draft_token", token)
    .eq("status", "draft")
    .eq("draft", true)
    .select("business_id,status")
    .maybeSingle();

  if (publishErr || !published) {
    // If publish failed due to race condition (already published in parallel),
    // re-check status and redirect properly.
    const { data: recheck } = await supabaseServer
      .from("reviews")
      .select("business_id,status")
      .eq("id", found.id)
      .maybeSingle();

    if (recheck?.status === "published") {
      redirect(`/b/${recheck.business_id}?review=already-published`);
    }

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-2 text-2xl font-semibold">Verification error</h1>
        <p className="mb-4 text-gray-500">
          We couldn’t publish this review right now. Please try again.
        </p>
        <a href="/" className="text-[#1FAF9E] hover:underline">
          Back to home
        </a>
      </div>
    );
  }

  // 6) Success redirect
  redirect(`/b/${published.business_id}?review=published`);
}
