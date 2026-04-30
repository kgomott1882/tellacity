"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getBaseUrl } from "@/lib/getBaseUrl";
import RatingStars from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import ReviewOtpModal from "@/components/reviews/ReviewOtpModal";
import {
  GOOGLE_REVIEW_ITEM_CONTEXT_KEY,
  WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY,
} from "@/lib/writeReviewItemGoogleSession";
import { formatProductPrice } from "@/lib/productCurrency";

type ItemContextResponse = {
  business: { id: string; name: string; slug: string };
  item: {
    photoId: string;
    name: string;
    /** SKU / product code (from `business_photos.product_description`). */
    productCode: string | null;
    price: number | null;
    /** ISO 4217; defaults to USD when omitted (older API responses). */
    currency?: string;
    imageUrl: string | null;
    section: string;
  };
  canSubmitItemReview?: boolean;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function WriteReviewItemClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = (searchParams.get("businessSlug") || searchParams.get("slug") || "").trim();
  const photoId = (searchParams.get("photoId") || "").trim();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ItemContextResponse | null>(null);

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [dateOfExperience, setDateOfExperience] = useState(todayIsoDate);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [otpDraftId, setOtpDraftId] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const googleHandledRef = useRef(false);

  const success = searchParams.get("success") === "1";

  const titleForReview = useMemo(() => {
    if (!ctx) return "";
    const n = ctx.item.name.trim();
    return n || "Item";
  }, [ctx]);

  useEffect(() => {
    if (!slug || !photoId) {
      setLoading(false);
      setLoadError("Missing business or photo.");
      return;
    }
    let cancel = false;
    void (async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const res = await fetch(
          `/api/reviews/item-context?businessSlug=${encodeURIComponent(slug)}&photoId=${encodeURIComponent(photoId)}`,
          { credentials: "include" }
        );
        const data = (await res.json().catch(() => null)) as Partial<ItemContextResponse> & {
          error?: string;
        };
        if (cancel) return;
        if (!res.ok || !data?.business || !data?.item) {
          setLoadError(typeof data?.error === "string" ? data.error : "Could not load this item.");
          setCtx(null);
          return;
        }
        const raw = data.item as ItemContextResponse["item"] & { description?: string | null };
        const productCode =
          typeof raw.productCode === "string" && raw.productCode.trim()
            ? raw.productCode.trim()
            : typeof raw.description === "string" && raw.description.trim()
              ? raw.description.trim()
              : null;
        setCtx({
          business: data.business,
          item: {
            photoId: raw.photoId,
            name: raw.name,
            productCode,
            price: raw.price ?? null,
            currency: raw.currency,
            imageUrl: raw.imageUrl ?? null,
            section: raw.section,
          },
          canSubmitItemReview: data.canSubmitItemReview !== false,
        });
      } catch {
        if (!cancel) setLoadError("Network error.");
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [slug, photoId]);

  const getCreateDraftHeaders = useCallback(async () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (searchParams.get("google_continue") !== "1") return;
    if (googleHandledRef.current) return;
    googleHandledRef.current = true;

    const raw = window.localStorage.getItem(GOOGLE_REVIEW_ITEM_CONTEXT_KEY);
    if (!raw) {
      const qs = new URLSearchParams();
      if (slug) qs.set("businessSlug", slug);
      if (photoId) qs.set("photoId", photoId);
      const s = qs.toString();
      router.replace(s ? `/write-review/item?${s}` : "/write-review/item");
      return;
    }

    let payload: {
      business_id?: string;
      product_photo_id?: string;
      rating?: number;
      title?: string;
      body?: string;
      date_of_experience?: string;
    };
    try {
      payload = JSON.parse(raw) as typeof payload;
    } catch {
      router.replace("/write-review/item");
      return;
    }

    void (async () => {
      setSubmitting(true);
      setSubmitError(null);
      try {
        const {
          data: { session },
        } = await supabaseBrowser().auth.getSession();
        const accessToken = session?.access_token?.trim();
        if (!accessToken || !payload.business_id) {
          setSubmitError("Not authenticated");
          return;
        }
        const res = await fetch("/api/reviews/create", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          credentials: "include",
          body: JSON.stringify({
            business_id: payload.business_id,
            rating: Math.max(1, Math.min(5, Math.round(Number(payload.rating) || 1))),
            title: payload.title?.trim() || null,
            body: String(payload.body ?? "").trim(),
            date_of_experience: payload.date_of_experience || null,
            product_photo_id: payload.product_photo_id || undefined,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) {
          setSubmitError(data.error || "Could not submit review");
          return;
        }
        window.localStorage.removeItem(GOOGLE_REVIEW_ITEM_CONTEXT_KEY);
        window.sessionStorage.removeItem(WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY);
        setSubmitted(true);
        const okQs = new URLSearchParams();
        if (slug) okQs.set("businessSlug", slug);
        if (photoId) okQs.set("photoId", photoId);
        okQs.set("success", "1");
        router.replace(`/write-review/item?${okQs.toString()}`);
      } catch {
        setSubmitError("Something went wrong");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [searchParams, router, slug, photoId]);

  const signInWithGoogle = async () => {
    if (!ctx) return;
    if (ctx.canSubmitItemReview === false) {
      setSubmitError("Publish this photo first — item reviews go live only for published photos.");
      return;
    }
    if (rating < 1 || rating > 5) {
      setSubmitError("Pick a star rating.");
      return;
    }
    if (!body.trim()) {
      setSubmitError("Please write your review.");
      return;
    }
    const exp = new Date(dateOfExperience);
    if (Number.isNaN(exp.getTime()) || exp > new Date(todayIsoDate())) {
      setSubmitError("Date of experience cannot be in the future.");
      return;
    }
    try {
      window.localStorage.setItem(
        GOOGLE_REVIEW_ITEM_CONTEXT_KEY,
        JSON.stringify({
          business_id: ctx.business.id,
          product_photo_id: ctx.item.photoId,
          rating,
          title: titleForReview,
          body: body.trim(),
          date_of_experience: dateOfExperience,
        })
      );
      window.sessionStorage.setItem(WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY, "1");
      const baseUrl = getBaseUrl();
      await supabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${baseUrl}/auth/callback` },
      });
    } catch {
      setSubmitError("Something went wrong");
    }
  };

  const submitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctx) return;
    if (ctx.canSubmitItemReview === false) {
      setSubmitError("Publish this photo first — item reviews go live only for published photos.");
      return;
    }
    setSubmitError(null);
    if (rating < 1 || rating > 5) {
      setSubmitError("Pick a star rating.");
      return;
    }
    if (!body.trim()) {
      setSubmitError("Please write your review.");
      return;
    }
    const em = guestEmail.trim().toLowerCase();
    if (!em.includes("@")) {
      setSubmitError("Enter a valid email.");
      return;
    }
    const gn = guestName.trim() || em.split("@")[0] || "Customer";
    setSubmitting(true);
    try {
      const res = await fetch("/api/reviews/create-draft", {
        method: "POST",
        headers: await getCreateDraftHeaders(),
        credentials: "include",
        body: JSON.stringify({
          business_id: ctx.business.id,
          rating,
          title: titleForReview,
          body: body.trim(),
          guest_email: em,
          guest_name: gn,
          date_of_experience: dateOfExperience,
          marketing_opt_in: false,
          product_photo_id: ctx.item.photoId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        requiresOtp?: boolean;
        draft_id?: string;
        verification_email?: string;
        published?: boolean;
        error?: string;
      };
      if (!res.ok) {
        setSubmitError(data.error || "Could not start verification.");
        return;
      }
      if (data.requiresOtp && data.draft_id) {
        setOtpDraftId(data.draft_id);
        setOtpEmail(data.verification_email ?? em);
        return;
      }
      if (data.published) {
        setSubmitted(true);
      }
    } catch {
      setSubmitError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-[50vh] bg-white px-4 py-16 text-center text-gray-600">Loading…</main>
    );
  }
  if (loadError || !ctx) {
    return (
      <main className="mx-auto max-w-lg bg-white px-4 py-16">
        <p className="text-gray-800">{loadError ?? "Not found."}</p>
        <Link href="/write-review" className="mt-4 inline-block text-[#1FAF9E] underline">
          Write a general review
        </Link>
      </main>
    );
  }

  if (submitted || success) {
    return (
      <main className="mx-auto max-w-lg bg-white px-4 py-16 text-center">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Thank you</h1>
        <p className="mt-2 text-gray-600">Your review was submitted.</p>
        <Link
          href={`/b/${encodeURIComponent(ctx.business.slug)}`}
          className="mt-6 inline-block font-medium text-[#124541] underline"
        >
          View business
        </Link>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-lg px-4 py-10">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Review this item</h1>
        <p className="mt-1 text-sm text-gray-500">Share feedback about a specific product photo.</p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-semibold uppercase text-gray-500">Business</p>
          <p className="text-lg font-semibold text-gray-900">{ctx.business.name}</p>
          <p className="mt-3 text-xs font-semibold uppercase text-gray-500">Item</p>
          <p className="text-base font-medium text-gray-800">{ctx.item.name}</p>
          {ctx.item.productCode ? (
            <p className="mt-1 text-sm text-gray-600">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Product code
              </span>
              <span className="mt-0.5 block font-mono text-[13px] text-gray-800">
                {ctx.item.productCode}
              </span>
            </p>
          ) : null}
          {ctx.item.price != null ? (
            <p className="mt-1 text-sm text-[#124541]">
              {formatProductPrice(ctx.item.price, ctx.item.currency ?? "USD") ??
                String(ctx.item.price)}
            </p>
          ) : null}
        </div>

        {ctx.canSubmitItemReview === false ? (
          <div
            role="status"
            className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
          >
            This photo is still a <strong>draft</strong>. Publish it to your profile first; then
            customers can use <strong>Review this item</strong> and reviews will link to this product
            photo.
          </div>
        ) : null}

        <form onSubmit={(e) => void submitEmail(e)} className="mt-8 space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700">Your rating</p>
            <div className="mt-2">
              <RatingStars rating={rating} editable onChange={setRating} size={28} />
            </div>
          </div>
          <div>
            <label htmlFor="item-review-body" className="text-sm font-medium text-gray-700">
              Your review
            </label>
            <textarea
              id="item-review-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={5}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="What did you think?"
            />
          </div>
          <div>
            <label htmlFor="item-review-date" className="text-sm font-medium text-gray-700">
              Date of experience
            </label>
            <input
              id="item-review-date"
              type="date"
              value={dateOfExperience}
              max={todayIsoDate()}
              onChange={(e) => setDateOfExperience(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="rounded-xl border border-gray-200 p-4">
            <p className="text-sm font-medium text-gray-800">Continue with email</p>
            <input
              type="text"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              placeholder="Your name"
              className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              autoComplete="name"
            />
            <input
              type="email"
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              placeholder="Email"
              className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              autoComplete="email"
            />
            <Button
              type="submit"
              className="mt-3 w-full"
              disabled={submitting || ctx.canSubmitItemReview === false}
            >
              {submitting ? "Sending…" : "Continue with email"}
            </Button>
          </div>
        </form>

        <div className="mt-4">
          <p className="text-center text-sm text-gray-500">or</p>
          <Button
            type="button"
            variant="ghost"
            className="mt-3 w-full border border-gray-300 bg-white hover:bg-gray-50"
            onClick={() => void signInWithGoogle()}
            disabled={submitting || ctx.canSubmitItemReview === false}
          >
            Continue with Google
          </Button>
        </div>

        {submitError ? <p className="mt-4 text-sm text-red-600">{submitError}</p> : null}

        {otpDraftId && otpEmail ? (
          <ReviewOtpModal
            draftId={otpDraftId}
            verificationEmail={otpEmail}
            onClose={() => {
              setOtpDraftId(null);
              setOtpEmail(null);
            }}
            onSuccess={() => setSubmitted(true)}
          />
        ) : null}
      </section>
    </main>
  );
}
