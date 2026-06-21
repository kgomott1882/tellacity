"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getBaseUrl } from "@/lib/getBaseUrl";
import RatingStars from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import ReviewOtpModal from "@/components/reviews/ReviewOtpModal";
import {
  GOOGLE_REVIEW_ITEM_CONTEXT_KEY,
  WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY,
} from "@/lib/writeReviewItemGoogleSession";
import { PRODUCT_REVIEW_RATE_LIMIT_MESSAGE } from "@/lib/productReviewRateLimits";
import { recordRecentBusinessReviewPublished } from "@/lib/firstPartyCookies";
type ItemContextResponse = {
  business: { id: string; name: string; slug: string };
  item: {
    photoId: string;
    name: string;
    imageUrl: string | null;
    section: string;
  };
  canSubmitItemReview?: boolean;
};

export type WriteReviewItemContentProps = {
  businessSlug: string;
  photoId: string;
  variant?: "page" | "modal";
  /** Modal only: header close, thank-you Done, error dismiss */
  onRequestClose?: () => void;
};

function todayIsoDate(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapItemCreateDraftError(data: {
  error?: string;
  message?: string;
  error_code?: string;
}): string {
  if (data.error_code === "product_review_rate_limit") {
    return PRODUCT_REVIEW_RATE_LIMIT_MESSAGE;
  }
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message.trim();
  }
  const code = data.error ?? "";
  if (
    code === "duplicate_item_review" ||
    code === "duplicate_review"
  ) {
    return "You've already reviewed this product.";
  }
  if (code === "already_reviewed_business") {
    return "You've already submitted a review for this business.";
  }
  if (code === "draft_exists") {
    return "You already have a verification in progress. Check your email for the code, or try again shortly.";
  }
  if (code === "unexpected_error") {
    return "Something went wrong. Please try again.";
  }
  if (code.trim()) {
    return code;
  }
  return "Could not start verification.";
}

export default function WriteReviewItemContent({
  businessSlug,
  photoId,
  variant = "page",
  onRequestClose,
}: WriteReviewItemContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = businessSlug.trim();
  const pid = photoId.trim();

  const idSuffix = variant === "modal" ? "-modal" : "";

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
  const [successFromInitialUrl] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("success") === "1";
  });
  const googleHandledRef = useRef(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);

  const successFromUrl =
    variant === "page" && searchParams.get("success") === "1";
  const isSubmittedState = submitted || successFromInitialUrl || successFromUrl;

  const titleForReview = useMemo(() => {
    if (!ctx) return "";
    const n = ctx.item.name.trim();
    return n || "Item";
  }, [ctx]);

  /** Only after auth resolves: guest means no Supabase session. */
  const isGuest = authChecked && !userId;

  const isReviewCoreValid = useMemo(() => {
    if (!ctx) return false;
    if (rating < 1 || rating > 5) return false;
    if (!body.trim()) return false;
    if (!dateOfExperience) return false;
    const exp = new Date(dateOfExperience);
    if (Number.isNaN(exp.getTime()) || exp > new Date(todayIsoDate())) return false;
    return true;
  }, [ctx, rating, body, dateOfExperience]);

  useEffect(() => {
    const sb = supabaseBrowser();
    void sb.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id ?? null);
      setUserEmail(session?.user?.email?.trim() ?? null);
      setAuthChecked(true);
    });
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setUserEmail(session?.user?.email?.trim() ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (variant !== "page") return;
    if (!ctx) return;
    if (!isSubmittedState) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [variant, ctx, isSubmittedState]);

  useEffect(() => {
    if (!slug || !pid) {
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
          `/api/reviews/item-context?businessSlug=${encodeURIComponent(slug)}&photoId=${encodeURIComponent(pid)}`,
          { credentials: "include" }
        );
        const data = (await res.json().catch(() => null)) as Partial<ItemContextResponse> & {
          error?: string;
        };
        if (cancel) return;
        if (!res.ok || !data?.business || !data?.item) {
          setLoadError(typeof data?.error === "string" ? data.error : "Could not load this product.");
          setCtx(null);
          return;
        }
        const raw = data.item as ItemContextResponse["item"];
        setCtx({
          business: data.business,
          item: {
            photoId: raw.photoId,
            name: raw.name,
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
  }, [slug, pid]);

  const getCreateDraftHeaders = useCallback(async () => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const { data } = await supabaseBrowser().auth.getSession();
    const token = data.session?.access_token?.trim();
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, []);

  useEffect(() => {
    if (variant !== "page") return;
    if (typeof window === "undefined") return;
    if (searchParams.get("google_continue") !== "1") return;
    if (googleHandledRef.current) return;
    googleHandledRef.current = true;

    const raw = window.localStorage.getItem(GOOGLE_REVIEW_ITEM_CONTEXT_KEY);
    if (!raw) {
      const qs = new URLSearchParams();
      if (slug) qs.set("businessSlug", slug);
      if (pid) qs.set("photoId", pid);
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
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          error_code?: string;
        };
        if (!res.ok) {
          setSubmitError(
            data.error_code === "product_review_rate_limit"
              ? PRODUCT_REVIEW_RATE_LIMIT_MESSAGE
              : data.error || "Could not submit review",
          );
          return;
        }
        window.localStorage.removeItem(GOOGLE_REVIEW_ITEM_CONTEXT_KEY);
        window.sessionStorage.removeItem(WRITE_REVIEW_ITEM_GOOGLE_MODE_SESSION_KEY);
        recordRecentBusinessReviewPublished(slug);
        setSubmitted(true);
        const okQs = new URLSearchParams();
        if (slug) okQs.set("businessSlug", slug);
        if (pid) okQs.set("photoId", pid);
        okQs.set("success", "1");
        router.replace(`/write-review/item?${okQs.toString()}`);
      } catch {
        setSubmitError("Something went wrong");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [variant, searchParams, router, slug, pid]);

  const validateCoreFields = useCallback((): string | null => {
    if (!ctx) return "Missing context.";
    if (ctx.canSubmitItemReview === false) {
      return "Publish this photo first. Product reviews go live only for published photos.";
    }
    if (rating < 1 || rating > 5) return "Pick a star rating.";
    if (!body.trim()) return "Please write your review.";
    const exp = new Date(dateOfExperience);
    if (Number.isNaN(exp.getTime()) || exp > new Date(todayIsoDate())) {
      return "Date of experience cannot be in the future.";
    }
    return null;
  }, [ctx, rating, body, dateOfExperience]);

  const submitLoggedIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ctx || isGuest) return;
    const err = validateCoreFields();
    if (err) {
      setSubmitError(err);
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const {
        data: { session },
      } = await supabaseBrowser().auth.getSession();
      const accessToken = session?.access_token?.trim();
      if (!accessToken) {
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
          business_id: ctx.business.id,
          rating: Math.max(1, Math.min(5, Math.round(rating))),
          title: titleForReview.trim() || null,
          body: body.trim(),
          date_of_experience: dateOfExperience,
          product_photo_id: ctx.item.photoId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        error_code?: string;
      };
      if (!res.ok) {
        setSubmitError(
          data.error_code === "product_review_rate_limit"
            ? PRODUCT_REVIEW_RATE_LIMIT_MESSAGE
            : data.error || "Could not submit review.",
        );
        return;
      }
      setSubmitted(true);
      recordRecentBusinessReviewPublished(businessSlug);
      if (variant === "page") {
        const okQs = new URLSearchParams();
        if (slug) okQs.set("businessSlug", slug);
        if (pid) okQs.set("photoId", pid);
        okQs.set("success", "1");
        router.replace(`/write-review/item?${okQs.toString()}`);
      }
    } catch {
      setSubmitError("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const signInWithGoogle = async () => {
    if (!ctx) return;
    setSubmitError(null);
    const err = validateCoreFields();
    if (err) {
      setSubmitError(err);
      return;
    }
    try {
      window.localStorage.setItem(
        GOOGLE_REVIEW_ITEM_CONTEXT_KEY,
        JSON.stringify({
          business_id: ctx.business.id,
          business_slug: ctx.business.slug,
          product_photo_id: ctx.item.photoId,
          photo_id: ctx.item.photoId,
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

  const submitGuestEmailDraft = async () => {
    if (!ctx) return;
    setSubmitError(null);
    const coreErr = validateCoreFields();
    if (coreErr) {
      setSubmitError(coreErr);
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
          marketing_opt_in: marketingOptIn,
          product_photo_id: ctx.item.photoId,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        requiresOtp?: boolean;
        draft_id?: string;
        verification_email?: string;
        published?: boolean;
        error?: string;
        message?: string;
        error_code?: string;
        requiresUpdate?: boolean;
      };
      if (!res.ok) {
        setSubmitError(mapItemCreateDraftError(data));
        return;
      }
      if (data.requiresUpdate) {
        setSubmitError(
          "You've already submitted a general review for this business. Use edit review if you need to update it.",
        );
        return;
      }
      if (data.requiresOtp && data.draft_id) {
        setShowEmailModal(false);
        setOtpDraftId(data.draft_id);
        setOtpEmail(data.verification_email ?? em);
        return;
      }
      if (data.published) {
        setShowEmailModal(false);
        setSubmitted(true);
        recordRecentBusinessReviewPublished(businessSlug);
      }
    } catch {
      setSubmitError("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const openGuestEmailModal = () => {
    setSubmitError(null);
    const err = validateCoreFields();
    if (err) {
      setSubmitError(err);
      return;
    }
    setShowEmailModal(true);
  };

  const shellMainClass =
    variant === "modal" ? "bg-white" : "min-h-[50vh] bg-white px-4 py-16 text-center text-gray-600";

  if (loading) {
    return (
      <main className={variant === "modal" ? "bg-white px-4 py-10 text-center text-gray-600" : shellMainClass}>
        Loading…
      </main>
    );
  }
  if (loadError || !ctx) {
    return (
      <main className={variant === "modal" ? "bg-white px-4 py-8" : "mx-auto max-w-lg bg-white px-4 py-16"}>
        {variant === "modal" ? (
          <div className="flex items-start justify-between gap-3 border-b border-gray-200 pb-3">
            <h2 className="text-lg font-semibold text-[#0E0E0E]">Review this product</h2>
            {onRequestClose ? (
              <button
                type="button"
                onClick={() => onRequestClose()}
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
              >
                <X className="h-5 w-5" strokeWidth={2} aria-hidden />
              </button>
            ) : null}
          </div>
        ) : null}
        <p className={variant === "modal" ? "mt-4 text-gray-800" : "text-gray-800"}>
          {loadError ?? "Not found."}
        </p>
        {variant === "page" ? (
          <Link href="/write-review" className="mt-4 inline-block text-[#1FAF9E] underline">
            Write a general review
          </Link>
        ) : onRequestClose ? (
          <Button type="button" variant="ghost" className="mt-4 border border-gray-300 bg-white hover:bg-gray-50" onClick={() => onRequestClose()}>
            Close
          </Button>
        ) : null}
      </main>
    );
  }

  if (isSubmittedState) {
    if (variant === "page") {
      return (
        <main className="relative min-h-[min(100dvh,52rem)] bg-[#F8F4F0]">
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/25 p-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`item-review-thanks${idSuffix}`}
          >
            <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-[0_25px_80px_-12px_rgba(15,23,42,0.35)]">
              <h1
                id={`item-review-thanks${idSuffix}`}
                className="text-2xl font-semibold text-[#0E0E0E]"
              >
                Thank you
              </h1>
              <p className="mt-2 text-sm text-gray-600">Your review was submitted.</p>
              <Link
                href={`/b/${encodeURIComponent(ctx.business.slug)}`}
                className="mt-6 inline-block font-medium text-[#124541] underline"
              >
                View business
              </Link>
            </div>
          </div>
        </main>
      );
    }

    return (
      <main className="bg-white px-4 pb-8 pt-6 text-center">
        <div className="mb-4 flex items-start justify-between gap-3 border-b border-gray-200 pb-3 text-left">
          <h2 className="text-lg font-semibold text-[#0E0E0E]">Review this product</h2>
          {onRequestClose ? (
            <button
              type="button"
              onClick={() => onRequestClose()}
              aria-label="Close"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
          ) : null}
        </div>
        <h1 className="text-xl font-semibold text-[#0E0E0E]">Thank you</h1>
        <p className="mt-2 text-gray-600">Your review was submitted.</p>
        {onRequestClose ? (
          <Button type="button" className="mt-6 w-full max-w-xs bg-[#124541] hover:bg-[#0f3a35]" onClick={() => onRequestClose()}>
            Done
          </Button>
        ) : (
          <Link
            href={`/b/${encodeURIComponent(ctx.business.slug)}`}
            className="mt-6 inline-block font-medium text-[#124541] underline"
          >
            View business
          </Link>
        )}
      </main>
    );
  }

  const headerRow =
    variant === "modal" && onRequestClose ? (
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-gray-200 px-4 pb-3 pt-1">
        <div>
          <h2 className="text-lg font-semibold text-[#0E0E0E]">Review this product</h2>
          <p className="mt-0.5 text-xs text-gray-500">Share feedback about a specific product photo.</p>
        </div>
        <button
          type="button"
          onClick={() => onRequestClose()}
          aria-label="Close"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
        >
          <X className="h-5 w-5" strokeWidth={2} aria-hidden />
        </button>
      </div>
    ) : null;

  const itemReviewCardStyle: CSSProperties = {
    border: "2px solid #1FAF9E",
    boxShadow:
      "0 0 0 1px rgba(31, 175, 158, 0.2), 0 0 24px rgba(31, 175, 158, 0.28), 0 0 52px rgba(31, 175, 158, 0.15)",
  };

  const innerSection = (
    <section className={`mx-auto w-full max-w-lg ${variant === "modal" ? "px-4 pb-8 pt-4" : "px-4 py-10"}`}>
      {variant === "page" ? (
        <>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Review this product</h1>
          <p className="mt-1 text-sm text-gray-500">Share feedback about a specific product photo.</p>
        </>
      ) : null}

      <div
        className={`space-y-6 rounded-2xl bg-white p-6 ${variant === "page" ? "mt-6" : "mt-0"}`}
        style={itemReviewCardStyle}
      >
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase text-gray-500">Business</p>
            <p className="truncate text-lg font-semibold text-gray-900">{ctx.business.name}</p>
            <p className="mt-3 text-xs font-semibold uppercase text-gray-500">Product</p>
            <p className="truncate text-base font-medium text-gray-800">{ctx.item.name}</p>
          </div>
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-white">
            {ctx.item.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={ctx.item.imageUrl}
                alt={ctx.item.name ? `${ctx.item.name} preview` : "Product preview"}
                className="h-full w-full object-contain bg-gray-50"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-gray-400">
                No image
              </div>
            )}
          </div>
        </div>
      </div>

      {ctx.canSubmitItemReview === false ? (
        <div
          role="status"
          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-950"
        >
          This photo is still a <strong>draft</strong>. Publish it to your profile first; then customers can use{" "}
          <strong>Review this product</strong> and reviews will link to this product photo.
        </div>
      ) : null}

      <form
        onSubmit={isGuest ? (e) => e.preventDefault() : (e) => void submitLoggedIn(e)}
        className="space-y-6"
      >
        <div>
          <p className="text-sm font-medium text-gray-700">Your rating</p>
          <div className="mt-2">
            <RatingStars rating={rating} editable onChange={setRating} size={22} />
          </div>
        </div>
        <div>
          <label htmlFor={`item-review-body${idSuffix}`} className="text-sm font-medium text-gray-700">
            Your review
          </label>
          <textarea
            id={`item-review-body${idSuffix}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            placeholder="What did you think?"
          />
        </div>
        <div>
          <label htmlFor={`item-review-date${idSuffix}`} className="text-sm font-medium text-gray-700">
            Date of experience
          </label>
          <input
            id={`item-review-date${idSuffix}`}
            type="date"
            value={dateOfExperience}
            max={todayIsoDate()}
            onChange={(e) => setDateOfExperience(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>

        {!authChecked && (
          <p className="text-sm text-gray-500" aria-live="polite">
            Verifying your session…
          </p>
        )}

        {isGuest && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <h3 className="text-sm font-semibold text-[#0E0E0E]">3. Tell us who you are</h3>
            <p className="mb-1 text-center text-sm text-gray-600">Choose how you&apos;d like to continue</p>
            <div className="space-y-3">
              <Button
                type="button"
                onClick={() => openGuestEmailModal()}
                className="w-full rounded-full bg-[#1FAF9E] text-sm font-semibold hover:bg-[#169786]"
                disabled={submitting || ctx.canSubmitItemReview === false || !isReviewCoreValid}
              >
                Continue with Email
              </Button>
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                disabled={submitting || ctx.canSubmitItemReview === false || !isReviewCoreValid}
                className="inline-flex w-full items-center justify-center gap-3 rounded-2xl border border-[#B8B8B8] bg-white px-5 py-3 text-lg font-medium text-[#202124] hover:bg-[#f8f9fa] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" className="h-8 w-8 shrink-0" aria-hidden="true">
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
                Continue with Google
              </button>
            </div>
          </div>
        )}

        {!isGuest && authChecked && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
            Posting as{" "}
            <span className="font-semibold">{userEmail ?? "Tellacity user"}</span>. Your review will be published
            immediately.
          </div>
        )}

        <div className="space-y-3">
          <label className="flex items-start gap-3 text-xs text-gray-700">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1FAF9E] focus:ring-[#1FAF9E]"
              checked={marketingOptIn}
              onChange={(e) => setMarketingOptIn(e.target.checked)}
              disabled={submitting}
            />
            <span>I agree to receive occasional updates and insights from Tellacity (optional)</span>
          </label>

          <p className="text-[11px] leading-relaxed text-gray-500">
            By continuing, you agree to Tellacity&apos;s{" "}
            <a
              href="/terms-of-service"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#1FAF9E] hover:underline"
            >
              Terms and Conditions
            </a>{" "}
            and{" "}
            <a
              href="/privacy-policy"
              target="_blank"
              rel="noreferrer"
              className="font-semibold text-[#1FAF9E] hover:underline"
            >
              Privacy Policy
            </a>
            .
          </p>
        </div>

        {!isGuest && authChecked && (
          <Button
            type="submit"
            className="w-full rounded-full bg-[#1FAF9E] text-sm font-semibold hover:bg-[#169786]"
            disabled={submitting || ctx.canSubmitItemReview === false || !isReviewCoreValid}
          >
            {submitting ? "Submitting your review…" : "Submit review"}
          </Button>
        )}
      </form>

      {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      </div>

      {showEmailModal ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`email-modal-title${idSuffix}`}
          onClick={() => {
            setShowEmailModal(false);
            setSubmitError(null);
          }}
        >
          <div
            className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                setShowEmailModal(false);
                setSubmitError(null);
              }}
              className="absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-100"
              aria-label="Close"
            >
              <X className="h-5 w-5" strokeWidth={2} aria-hidden />
            </button>
            <h2 id={`email-modal-title${idSuffix}`} className="pr-10 text-lg font-semibold text-[#0E0E0E]">
              Continue with email
            </h2>
            <p className="mt-1 text-sm text-gray-500">We&apos;ll send a 6-digit code to verify your email.</p>
            {submitError ? (
              <div
                className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {submitError}
              </div>
            ) : null}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor={`guest-name-item${idSuffix}`} className="text-xs font-medium text-[#0E0E0E]">
                  Your name
                </label>
                <input
                  id={`guest-name-item${idSuffix}`}
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  autoComplete="name"
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor={`guest-email-item${idSuffix}`} className="text-xs font-medium text-[#0E0E0E]">
                  Email
                </label>
                <input
                  id={`guest-email-item${idSuffix}`}
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  autoComplete="email"
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                />
                <p className="mt-1 text-xs text-gray-500">
                  We&apos;ll send a one-time code to verify your review. Your email won&apos;t be shown publicly.
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="mt-5 w-full rounded-full bg-[#124541] text-sm font-semibold hover:bg-[#0f3a35]"
              disabled={submitting}
              onClick={() => void submitGuestEmailDraft()}
            >
              {submitting ? "Sending…" : "Send verification code"}
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowEmailModal(false);
                setSubmitError(null);
              }}
              className="mt-3 w-full text-center text-xs font-medium text-[#1FAF9E] hover:underline"
            >
              ← Back to sign-in options
            </button>
          </div>
        </div>
      ) : null}

      {otpDraftId && otpEmail ? (
        <ReviewOtpModal
          draftId={otpDraftId}
          verificationEmail={otpEmail}
          onClose={() => {
            setOtpDraftId(null);
            setOtpEmail(null);
          }}
          onSuccess={() => {
            setShowEmailModal(false);
            setSubmitted(true);
            recordRecentBusinessReviewPublished(businessSlug);
          }}
        />
      ) : null}
    </section>
  );

  if (variant === "modal") {
    return (
      <div className="flex max-h-[min(92vh,880px)] flex-col overflow-hidden bg-white">
        {headerRow}
        <div className="min-h-0 flex-1 overflow-y-auto">{innerSection}</div>
      </div>
    );
  }

  return <main className="bg-white">{innerSection}</main>;
}
