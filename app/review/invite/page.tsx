"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

type Validated = {
  inviteId: string;
  inviteToken: string;
  businessId: string;
  businessSlug: string | null;
  businessName: string | null;
} | null;

function InviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(!!token);
  const [error, setError] = useState<string | null>(null);
  const [validated, setValidated] = useState<Validated>(null);

  useEffect(() => {
    if (!token?.trim()) {
      setError("Invalid link");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/review-invites/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: token.trim() }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok && data.success === true) {
          setValidated({
            inviteId: data.inviteId ?? "",
            inviteToken: token.trim(),
            businessId: data.businessId ?? "",
            businessSlug: data.businessSlug ?? null,
            businessName: data.businessName ?? null,
          });
        } else {
          setError((data.error as string) || "Invalid or expired link");
        }
      } catch {
        if (!cancelled) setError("Something went wrong");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (!token?.trim()) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900">Invalid link</h1>
          <p className="mt-2 text-sm text-gray-600">This invite link is missing or invalid.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full text-center">
          <div className="h-8 w-8 mx-auto rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" aria-hidden />
          <p className="mt-4 text-sm text-gray-500">Loading…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900">Unable to open invite</h1>
          <p className="mt-2 text-sm text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (validated) {
    const params = new URLSearchParams({
      inviteId: validated.inviteId,
      inviteToken: validated.inviteToken,
      businessId: validated.businessId,
      businessSlug: validated.businessSlug ?? "",
      businessName: validated.businessName ?? "",
    });
    const writeReviewUrl = `/write-review?${params.toString()}`;

    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm max-w-md w-full text-center">
          <h1 className="text-xl font-semibold text-gray-900">Leave Your Review</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your feedback helps others make better decisions.
          </p>
          <Link
            href={writeReviewUrl}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-gray-900 active:scale-[0.98] w-full"
          >
            Continue to Review
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export default function InvitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
            <p className="text-sm text-gray-500">Loading…</p>
          </div>
        </div>
      }
    >
      <InviteContent />
    </Suspense>
  );
}
