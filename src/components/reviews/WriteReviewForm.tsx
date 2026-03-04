"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { supabase } from "@/lib/supabaseClient";
import { isAbortError } from "@/lib/authErrors";
import RatingStars from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import BusinessSearchInput, {
  BusinessSearchResult,
} from "@/components/search/BusinessSearchInput";

type WriteReviewFormProps = {
  inviteId?: string | null;
  inviteToken?: string | null;
  initialBusinessId?: string | null;
  initialBusinessSlug?: string | null;
  initialBusinessName?: string | null;
  businessSlug: string;
};

const REFERENCE_TYPES = ["order", "invoice", "booking", "customer", "generic", "custom"] as const;
type ReferenceType = (typeof REFERENCE_TYPES)[number];

function referenceFieldLabel(
  type: ReferenceType | null,
  customLabel: string | null
): string {
  if (!type) return "Reference number";
  if (type === "custom" && customLabel?.trim()) return customLabel.trim();
  const labels: Record<ReferenceType, string> = {
    order: "Order",
    invoice: "Invoice",
    booking: "Booking",
    customer: "Customer",
    generic: "Generic",
    custom: "Reference number",
  };
  return labels[type] ?? "Reference number";
}

type Business = {
  id: string;
  name: string;
  slug: string;
  website: string | null;
  reference_number_enabled?: boolean;
  reference_number_type?: ReferenceType | null;
  reference_number_label_custom?: string | null;
};

type PendingReviewDraft = {
  business_id: string | null;
  business_name: string | null;
  business_slug: string | null;
  rating: number;
  title: string;
  body: string;
  date_of_experience: string;
  guest_email: string;
  guest_name: string;
  marketing_opt_in: boolean;
  reference_number?: string | null;
};

const GUEST_EMAIL_KEY = "tellacity_review_guest_email";
const GUEST_NAME_KEY = "tellacity_review_guest_name";
const PENDING_REVIEW_KEY = "tellacity_pending_review";

const isUuid = (value: string | null | undefined) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const todayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const callEdgeFunction = async (name: string, body: Record<string, unknown>) => {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!baseUrl || !anonKey) {
    throw new Error("Supabase configuration missing.");
  }

  const response = await fetch(`${baseUrl}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    body: JSON.stringify(body),
  });

  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      (payload && (payload.error || payload.message)) ||
      "Something went wrong. Please try again.";
    throw new Error(message);
  }

  return payload;
};

export default function WriteReviewForm({
  inviteId,
  inviteToken,
  initialBusinessId,
  initialBusinessSlug,
  initialBusinessName,
}: WriteReviewFormProps) {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const [rating, setRating] = useState(0);
  const [dateOfExperience, setDateOfExperience] = useState(todayIsoDate());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [checkEmailState, setCheckEmailState] = useState<{
    active: boolean;
    email: string;
  }>({ active: false, email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);

  // Load auth state
  useEffect(() => {
    let isMounted = true;
    const loadAuth = async () => {
      let data: { session: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } } | null } | null = null;
      try {
        const result = await supabaseBrowser().auth.getSession();
        data = result.data;
      } catch (e) {
        if (isAbortError(e)) {
          // Silently ignore; do not rethrow
        } else {
          console.error(e);
        }
      }
      if (!isMounted) return;
      const sessionUser = data?.session?.user ?? null;
      setUserId(sessionUser?.id ?? null);
      setUserEmail(sessionUser?.email ?? null);
      const displayName =
        (sessionUser?.user_metadata?.display_name as string | undefined) ?? null;
      setUserDisplayName(displayName);
      setAuthChecked(true);
    };
    loadAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // Restore guest info from localStorage
  useEffect(() => {
    if (userId) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    const storedEmail = window.localStorage.getItem(GUEST_EMAIL_KEY);
    const storedName = window.localStorage.getItem(GUEST_NAME_KEY);
    if (storedEmail && !guestEmail) {
      setGuestEmail(storedEmail);
    }
    if (storedName && !guestName) {
      setGuestName(storedName);
    }
  }, [userId, guestEmail, guestName]);

  // Persist guest info
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userId && guestEmail) {
      window.localStorage.setItem(GUEST_EMAIL_KEY, guestEmail);
    }
  }, [guestEmail, userId]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!userId && guestName) {
      window.localStorage.setItem(GUEST_NAME_KEY, guestName);
    }
  }, [guestName, userId]);

  // Initial business selection and fetch
  useEffect(() => {
    let isMounted = true;

    const loadBusiness = async () => {
      if (!initialBusinessId && !initialBusinessSlug) {
        setBusinessLoading(false);
        return;
      }

      setBusinessLoading(true);
      setBusinessError(null);

      // Optimistic selection
      setBusiness((prev) => {
        if (prev) return prev;
        return {
          id: initialBusinessId ?? "",
          name: inviteId ? (initialBusinessName ?? "Loading…") : (initialBusinessName ?? "Business"),
          slug: initialBusinessSlug ?? "",
          website: null,
        };
      });

      const sb = supabase();
      const query = sb
        .from("businesses")
        .select("id, name, slug, website, website_display, reference_number_enabled, reference_number_type, reference_number_label_custom")
        .eq("status", "active")
        .limit(1);

      if (initialBusinessId && isUuid(initialBusinessId)) {
        query.eq("id", initialBusinessId);
      } else if (initialBusinessSlug) {
        query.eq("slug", initialBusinessSlug);
      }

      const { data, error } = await query.maybeSingle();
      if (!isMounted) return;

      if (error || !data) {
        setBusinessError("We couldn’t load this business. You can search again.");
      } else {
        const row = data as {
          id: string;
          name: string | null;
          slug: string;
          website: string | null;
          website_display?: string | null;
          reference_number_enabled?: boolean;
          reference_number_type?: string | null;
          reference_number_label_custom?: string | null;
        };
        const refType = REFERENCE_TYPES.includes(row.reference_number_type as ReferenceType)
          ? (row.reference_number_type as ReferenceType)
          : null;
        setBusiness({
          id: row.id,
          name: row.name ?? (inviteId ? (initialBusinessName ?? "Loading…") : (initialBusinessName ?? "Business")),
          slug: row.slug,
          website: row.website_display ?? row.website ?? null,
          reference_number_enabled: Boolean(row.reference_number_enabled),
          reference_number_type: refType,
          reference_number_label_custom: row.reference_number_label_custom ?? null,
        });
      }
      setBusinessLoading(false);
    };

    loadBusiness();

    return () => {
      isMounted = false;
    };
  }, [initialBusinessId, initialBusinessSlug, initialBusinessName, inviteId]);

  // Restore draft saved before Google sign-in
  useEffect(() => {
    if (typeof window === "undefined" || hasRestoredDraft) return;
    const raw = window.localStorage.getItem(PENDING_REVIEW_KEY);
    if (!raw) {
      setHasRestoredDraft(true);
      return;
    }

    try {
      const draft: PendingReviewDraft = JSON.parse(raw);
      if (draft) {
        if (draft.business_id) {
          setBusiness((prev) => {
            if (prev && prev.id === draft.business_id) return prev;
            return {
              id: draft.business_id!,
              name: draft.business_name ?? (inviteId ? (initialBusinessName ?? "Loading…") : (initialBusinessName ?? "Business")),
              slug: draft.business_slug ?? initialBusinessSlug ?? "",
              website: null,
            };
          });
        }
        setRating(draft.rating || 0);
        setTitle(draft.title || "");
        setBody(draft.body || "");
        setDateOfExperience(
          draft.date_of_experience || todayIsoDate()
        );
        setGuestEmail((prev) => prev || draft.guest_email || "");
        setGuestName((prev) => prev || draft.guest_name || "");
        setMarketingOptIn(draft.marketing_opt_in || false);
        setReferenceNumber(draft.reference_number ?? "");
      }
    } catch {
      // ignore parsing errors
    } finally {
      window.localStorage.removeItem(PENDING_REVIEW_KEY);
      setHasRestoredDraft(true);
    }
  }, [
    hasRestoredDraft,
    initialBusinessName,
    initialBusinessSlug,
    inviteId,
  ]);

  const isGuest = !userId && authChecked;

  const isFormValid = useMemo(() => {
    if (!business) return false;
    if (rating <= 0) return false;
    if (!body.trim()) return false;
    if (!dateOfExperience) return false;

    const experienceDate = new Date(dateOfExperience);
    const today = new Date(todayIsoDate());
    if (Number.isNaN(experienceDate.getTime()) || experienceDate > today) {
      return false;
    }

    if (isGuest) {
      if (!guestEmail.trim() || !guestName.trim()) {
        return false;
      }
    }

    return true;
  }, [business, rating, body, dateOfExperience, isGuest, guestEmail, guestName]);

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    const file = event.target.files?.[0];
    if (!file) {
      setProofFile(null);
      return;
    }

    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/webp",
      "application/pdf",
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setProofError("Supported file types: PNG, JPG, WEBP, PDF.");
      setProofFile(null);
      return;
    }

    if (file.size > maxSize) {
      setProofError("File size must be 10MB or less.");
      setProofFile(null);
      return;
    }

    setProofFile(file);
  };

  const uploadProofIfNeeded = async (): Promise<string | null> => {
    if (!proofFile) {
      return null;
    }

    const uniqueName = `otp_proofs/${Date.now()}_${Math.random()
      .toString(36)
      .slice(2)}_${proofFile.name}`;

    const sb = supabase();
    const { error: uploadError } = await sb.storage
      .from("receipts")
      .upload(uniqueName, proofFile);

    if (uploadError) {
      throw new Error("Could not upload your proof. Please try again.");
    }

    const { data } = sb.storage
      .from("receipts")
      .getPublicUrl(uniqueName);

    return data.publicUrl || null;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!business) return;

    setSubmitError(null);
    setCheckEmailState({ active: false, email: "" });

    if (!isFormValid) {
      setSubmitError("Please complete all required fields.");
      return;
    }

    const experienceDate = new Date(dateOfExperience);
    const today = new Date(todayIsoDate());
    if (Number.isNaN(experienceDate.getTime()) || experienceDate > today) {
      setSubmitError("Date of experience cannot be in the future.");
      return;
    }

    setIsSubmitting(true);

    try {
      const receiptUrl = await uploadProofIfNeeded();

      if (userId) {
        const sb = supabase();
        const { error } = await sb.from("reviews").insert({
          business_id: business.id,
          user_id: userId,
          rating: Math.max(1, Math.min(5, Math.round(rating))),
          title: title.trim() || null,
          body: body.trim(),
          receipt_url: receiptUrl,
          date_of_experience: dateOfExperience,
          marketing_opt_in: marketingOptIn,
          guest_email: userEmail ?? guestEmail ?? null,
          guest_name:
            userDisplayName ||
            guestName ||
            (userEmail ? userEmail.split("@")[0] : null),
          reference_number: business.reference_number_enabled && referenceNumber.trim() ? referenceNumber.trim() : null,
          status: "published",
          draft: false,
        });

        if (error) {
          throw new Error("Something went wrong while publishing your review.");
        }

        const slugToUse = business.slug;
        router.push(`/b/${slugToUse}`);
        return;
      }

      const guestEmailTrimmed = guestEmail.trim().toLowerCase();
      const guestNameTrimmed = guestName.trim();

      await callEdgeFunction("create-review-draft", {
        business_id: business.id,
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        title: title.trim() || null,
        body: body.trim(),
        guest_email: guestEmailTrimmed,
        guest_name: guestNameTrimmed,
        receipt_url: receiptUrl,
        date_of_experience: dateOfExperience,
        marketing_opt_in: marketingOptIn,
        reference_number: business.reference_number_enabled && referenceNumber.trim() ? referenceNumber.trim() : null,
        invite_token: inviteToken ?? null,
      });

      setSubmittedEmail(guestEmailTrimmed);
      setSubmitted(true);
      setCheckEmailState({ active: true, email: guestEmailTrimmed });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleContinue = async () => {
    if (typeof window === "undefined") return;
    if (!business) {
      setSubmitError("Please choose a business before continuing with Google.");
      return;
    }

    const draft: PendingReviewDraft = {
      business_id: business.id,
      business_name: business.name,
      business_slug: business.slug,
      rating,
      title,
      body,
      date_of_experience: dateOfExperience,
      guest_email: guestEmail,
      guest_name: guestName,
      marketing_opt_in: marketingOptIn,
      reference_number: referenceNumber.trim() || null,
    };

    window.localStorage.setItem(PENDING_REVIEW_KEY, JSON.stringify(draft));

    const { error } = await supabaseBrowser().auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.href,
      },
    });

    if (error) {
      setSubmitError(error.message);
    }
  };

  const showBusinessSearch = !business && !inviteId;

  const handleWriteAnotherReview = () => {
    setSubmitted(false);
    setSubmittedEmail("");
    setRating(0);
    setTitle("");
    setBody("");
    setDateOfExperience(todayIsoDate());
    setReferenceNumber("");
    setGuestName("");
    setGuestEmail("");
    setMarketingOptIn(false);
    setProofFile(null);
    setProofError(null);
    setSubmitError(null);
    setCheckEmailState({ active: false, email: "" });
  };

  if (submitted) {
    return (
      <main className="bg-white">
        <div className="max-w-2xl mx-auto py-10">
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center shadow-sm">
            <h2 className="text-lg font-semibold text-green-800 mb-2">
              Check your email
            </h2>
            <p className="text-green-700">
              We&apos;ve sent a verification link to{" "}
              <span className="font-medium">{submittedEmail}</span>.
            </p>
            <p className="text-green-700 mt-1">
              Open it to publish your review.
            </p>
          </div>
          <div className="mt-5 flex justify-center">
            <Button
              type="button"
              onClick={handleWriteAnotherReview}
              className="rounded-full bg-[#1FAF9E] px-6 py-2.5 text-sm font-semibold hover:bg-[#169786]"
            >
              Write Another Review
            </Button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">
          Write a review
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Share your experience to help others make better decisions.
        </p>

        <div className="mt-6 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-sm font-semibold text-[#0E0E0E]">
              1. Choose a business
            </h2>

            {businessLoading && (
              <p className="mt-3 text-sm text-gray-500">Loading business…</p>
            )}

            {business && (
              <div className="mt-3 flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#0E0E0E]">
                    {business.name}
                  </p>
                  {business.website ? (
                    <p className="mt-1 text-xs text-gray-500">
                      {business.website}
                    </p>
                  ) : null}
                </div>
                {!inviteId && (
                  <button
                    type="button"
                    className="text-xs font-semibold text-[#1FAF9E] hover:text-[#169786]"
                    onClick={() => {
                      setBusiness(null);
                      setBusinessError(null);
                    }}
                  >
                    Change
                  </button>
                )}
              </div>
            )}

            {showBusinessSearch && (
              <div className="mt-4">
                <BusinessSearchInput
                  placeholder="Start typing the business name…"
                  label="Search for a business"
                  externalError={businessError}
                  onSelect={(item: BusinessSearchResult) => {
                    setBusiness({
                      id: item.id,
                      name: item.name,
                      slug: item.slug,
                      website: item.website,
                    });
                    setBusinessError(null);
                  }}
                />
              </div>
            )}
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <h2 className="text-sm font-semibold text-[#0E0E0E]">
                2. Rate your experience
              </h2>
              <div className="mt-3 flex items-center gap-3">
                <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
                  <RatingStars
                    rating={rating || 0}
                    editable
                    onChange={(value) => {
                      if (isSubmitting) return;
                      setRating(value);
                    }}
                  />
                </div>
                <span className="text-xs text-gray-600">
                  {rating > 0 ? `${rating} star${rating > 1 ? "s" : ""}` : "Select a rating"}
                </span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label
                  htmlFor="review-title"
                  className="text-sm font-medium text-[#0E0E0E]"
                >
                  Review title <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <input
                  id="review-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Summarise your experience in a few words"
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="review-body"
                  className="text-sm font-medium text-[#0E0E0E]"
                >
                  Your review
                </label>
                <textarea
                  id="review-body"
                  value={body}
                  onChange={(event) => setBody(event.target.value)}
                  disabled={isSubmitting}
                  placeholder="Tell us what happened, what worked well, and what could be better."
                  className="mt-2 min-h-[140px] w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                />
              </div>

              <div>
                <label
                  htmlFor="experience-date"
                  className="text-sm font-medium text-[#0E0E0E]"
                >
                  Date of experience
                </label>
                <input
                  id="experience-date"
                  type="date"
                  value={dateOfExperience}
                  max={todayIsoDate()}
                  onChange={(event) => setDateOfExperience(event.target.value)}
                  disabled={isSubmitting}
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  required
                />
              </div>

              {business?.reference_number_enabled && business?.reference_number_type && (
                <div className="sm:col-span-2">
                  <label
                    htmlFor="reference-number"
                    className="flex items-center gap-1.5 text-sm font-medium text-[#0E0E0E]"
                  >
                    {referenceFieldLabel(
                      business.reference_number_type,
                      business.reference_number_label_custom ?? null
                    )}{" "}
                    <span className="text-gray-400">(optional)</span>
                    <span
                      className="inline-flex cursor-help rounded-full text-gray-400 hover:text-gray-600"
                      title="This helps the business respond to your review and link it to your experience."
                    >
                      <HelpCircle size={14} />
                    </span>
                  </label>
                  <input
                    id="reference-number"
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    disabled={isSubmitting}
                    placeholder="e.g. order or booking ID"
                    className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="proof-upload"
                  className="text-sm font-medium text-[#0E0E0E]"
                >
                  Add proof (optional)
                </label>
                <input
                  id="proof-upload"
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.pdf"
                  onChange={handleProofChange}
                  disabled={isSubmitting}
                  className="mt-2 block w-full text-xs text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#0E0E0E] hover:file:bg-gray-200"
                />
                <p className="mt-1 text-xs text-gray-500">
                  PNG, JPG, WEBP, or PDF. Max 10MB.
                </p>
                {proofError && (
                  <p className="mt-1 text-xs text-red-600">{proofError}</p>
                )}
              </div>
            </div>

            {isGuest && (
              <div className="space-y-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  3. Tell us who you are
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="guest-name"
                      className="text-xs font-medium text-[#0E0E0E]"
                    >
                      Your name
                    </label>
                    <input
                      id="guest-name"
                      type="text"
                      value={guestName}
                      onChange={(event) => setGuestName(event.target.value)}
                      disabled={isSubmitting}
                      className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="guest-email"
                      className="text-xs font-medium text-[#0E0E0E]"
                    >
                      Email
                    </label>
                    <input
                      id="guest-email"
                      type="email"
                      value={guestEmail}
                      onChange={(event) => setGuestEmail(event.target.value)}
                      disabled={isSubmitting}
                      className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      We&apos;ll send a one-time code to verify your review. Your
                      email won&apos;t be shown publicly.
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 inline-flex items-center gap-2 border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  onClick={handleGoogleContinue}
                  disabled={isSubmitting || !business}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
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
                </Button>
              </div>
            )}

            {!isGuest && authChecked && (
              <div className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-600">
                Posting as{" "}
                <span className="font-semibold">
                  {userEmail ?? "Tellacity user"}
                </span>
                . Your review will be published immediately.
              </div>
            )}

            <div className="space-y-3">
              <label className="flex items-start gap-3 text-xs text-gray-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#1FAF9E] focus:ring-[#1FAF9E]"
                  checked={marketingOptIn}
                  onChange={(event) => setMarketingOptIn(event.target.checked)}
                  disabled={isSubmitting}
                />
                <span>
                  I&apos;m happy to receive email updates, including Tellacity
                  recommendations, tips, and news.
                </span>
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

            <div className="space-y-3">
              <Button
                type="submit"
                className="w-full rounded-full bg-[#1FAF9E] text-sm font-semibold hover:bg-[#169786]"
                disabled={isSubmitting || !isFormValid || !business}
              >
                {isSubmitting
                  ? "Submitting your review…"
                  : "Submit review"}
              </Button>

              {submitError && (
                <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {submitError}
                </div>
              )}

              {checkEmailState.active && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <p className="font-semibold">Check your email</p>
                  <p className="mt-1">
                    We&apos;ve sent a verification link to{" "}
                    <span className="font-semibold">
                      {checkEmailState.email}
                    </span>
                    . Open it to publish your review.
                  </p>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

