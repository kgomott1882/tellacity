"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getBaseUrl } from "@/lib/getBaseUrl";
import { isAbortError } from "@/lib/authErrors";
import RatingStars from "@/components/RatingStars";
import { Button } from "@/components/ui/button";
import { HelpCircle } from "lucide-react";
import BusinessSearchInput, {
  BusinessSearchResult,
} from "@/components/search/BusinessSearchInput";
import ReviewOtpModal from "@/components/reviews/ReviewOtpModal";
import { reviewErrorMessages } from "@/lib/errorMessages";
import { getSafeReviewGuestDisplayName } from "@/lib/reviewGuestDisplayName";

type WriteReviewFormProps = {
  inviteId?: string | null;
  inviteToken?: string | null;
  initialRating?: number;
  reviewerEmail?: string;
  initialBusinessId?: string | null;
  initialBusinessSlug?: string | null;
  initialBusinessName?: string | null;
  businessSlug: string;
  /** Invite page: submit creates server draft + OTP; parent handles OTP step. */
  inviteTwoStepOtp?: boolean;
  onInviteDraftCreated?: (draftId: string) => void;
  /** Clear with null when starting a new submit attempt. */
  onInviteDraftFlowError?: (message: string | null) => void;
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
  receipt_url?: string | null;
};

const GUEST_EMAIL_KEY = "tellacity_review_guest_email";
const GUEST_NAME_KEY = "tellacity_review_guest_name";
const PENDING_REVIEW_KEY = "tellacity_pending_review";
const PENDING_REVIEW_DRAFT_ID_KEY = "pendingReviewDraftId";
const PENDING_REVIEW_DRAFT_EMAIL_KEY = "pendingReviewDraftEmail";
const GOOGLE_REVIEW_EMAIL_KEY = "google_review_email";
const WRITE_REVIEW_GOOGLE_MODE_KEY = "write_review_google_mode";

function clearGoogleReviewEmail() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(GOOGLE_REVIEW_EMAIL_KEY);
    window.sessionStorage.removeItem(WRITE_REVIEW_GOOGLE_MODE_KEY);
  }
}

const isUuid = (value: string | null | undefined) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const todayIsoDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function WriteReviewForm({
  inviteId,
  inviteToken,
  initialRating,
  reviewerEmail,
  initialBusinessId,
  initialBusinessSlug,
  initialBusinessName,
  businessSlug,
  inviteTwoStepOtp,
  onInviteDraftCreated,
  onInviteDraftFlowError,
}: WriteReviewFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editReviewId = searchParams.get("edit");

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userDisplayName, setUserDisplayName] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  const [business, setBusiness] = useState<Business | null>(null);
  const [businessLoading, setBusinessLoading] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);

  const normalizedInitialRating =
    typeof initialRating === "number" &&
    Number.isFinite(initialRating) &&
    initialRating >= 1 &&
    initialRating <= 5
      ? Math.round(initialRating)
      : undefined;

  const [rating, setRating] = useState(() => normalizedInitialRating ?? 0);
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
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [authMode, setAuthMode] = useState<"email" | "google">("email");
  const [googleUser, setGoogleUser] = useState<{
    email: string;
    name?: string;
  } | null>(null);
  const [checkEmailState, setCheckEmailState] = useState<{
    active: boolean;
    email: string;
  }>({ active: false, email: "" });
  const [submitted, setSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const [otpDraftId, setOtpDraftId] = useState<string | null>(null);
  const [otpEmail, setOtpEmail] = useState<string | null>(null);
  const [otpModalOpen, setOtpModalOpen] = useState(false);

  const [toast, setToast] = useState<{
    title: string;
    description: string;
    variant?: "destructive" | "success";
  } | null>(null);

  const [hasRestoredDraft, setHasRestoredDraft] = useState(false);
  /** Proof URL persisted across Google OAuth when the draft is created after sign-in. */
  const [restoredReceiptUrl, setRestoredReceiptUrl] = useState<string | null>(
    null,
  );

  const showToast = (opts: {
    title: string;
    description: string;
    variant?: "destructive" | "success";
  }) => {
    setToast(opts);
  };

  const resetReviewAuthFlow = useCallback(() => {
    clearGoogleReviewEmail();
    setAuthMode("email");
    setGoogleUser(null);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const businessId = business?.id;

  useEffect(() => {
    setShowDuplicateModal(false);
    setIsEditing(false);
    setSubmitError(null);
    resetReviewAuthFlow();
  }, [businessId, resetReviewAuthFlow]);

  // Prefill rating from URL-provided initial value (e.g. invite rating widget).
  useEffect(() => {
    if (normalizedInitialRating && rating === 0) {
      setRating(normalizedInitialRating);
    }
  }, [normalizedInitialRating, rating]);

  // Load existing review when in edit mode
  useEffect(() => {
    if (!editReviewId) return;

    let cancelled = false;

    const loadExistingReview = async () => {
      try {
        const sb = supabaseBrowser();
        const { data: review, error: reviewError } = await sb
          .from("reviews")
          .select("business_id,rating,title,body,date_of_experience")
          .eq("id", editReviewId)
          .maybeSingle();

        if (cancelled) return;

        if (reviewError || !review) {
          const mapped = reviewErrorMessages.review_edit_not_found;
          showToast({
            title: mapped.title,
            description: mapped.message,
            variant: "destructive",
          });
          return;
        }

        setRating(review.rating ?? 0);
        setTitle(review.title ?? "");
        setBody(review.body ?? "");
        setDateOfExperience(
          review.date_of_experience ?? todayIsoDate(),
        );

        if (review.business_id) {
          const { data: biz, error: bizError } = await sb
            .from("businesses")
            .select(
              "id,name,slug,website,website_display,reference_number_enabled,reference_number_type,reference_number_label_custom",
            )
            .eq("id", review.business_id)
            .maybeSingle();

          if (!cancelled && !bizError && biz) {
            setBusiness({
              id: biz.id,
              name:
                biz.name ??
                initialBusinessName ??
                "Business",
              slug: biz.slug,
              website: biz.website_display ?? biz.website ?? null,
              reference_number_enabled: Boolean(
                biz.reference_number_enabled,
              ),
              reference_number_type: (biz.reference_number_type ??
                null) as ReferenceType | null,
              reference_number_label_custom:
                biz.reference_number_label_custom ?? null,
            });
          }
        }
      } catch {
        if (cancelled) return;
        const mapped = reviewErrorMessages.review_edit_not_found;
        showToast({
          title: mapped.title,
          description: mapped.message,
          variant: "destructive",
        });
      }
    };

    loadExistingReview();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editReviewId]);

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
      const email = sessionUser?.email ?? null;
      setUserEmail(email);
      const meta = sessionUser?.user_metadata ?? {};
      const displayName =
        (meta.display_name as string | undefined) ??
        (meta.full_name as string | undefined) ??
        (meta.name as string | undefined) ??
        null;
      setUserDisplayName(displayName);
      const googleModePending =
        typeof window !== "undefined" &&
        window.sessionStorage.getItem(WRITE_REVIEW_GOOGLE_MODE_KEY) === "1";
      const googleStoredMatches =
        !!email &&
        typeof window !== "undefined" &&
        window.localStorage.getItem(GOOGLE_REVIEW_EMAIL_KEY)?.trim()
          .toLowerCase() === email.trim().toLowerCase();
      if (email && (googleModePending || googleStoredMatches)) {
        setAuthMode("google");
        setGoogleUser({
          email,
          name:
            (meta.full_name as string | undefined) ||
            (meta.name as string | undefined) ||
            displayName ||
            "",
        });
        window.localStorage.setItem(GOOGLE_REVIEW_EMAIL_KEY, email);
      }
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
      if (!initialBusinessId && !initialBusinessSlug && !businessSlug) {
        setBusinessLoading(false);
        return;
      }

      setBusinessLoading(true);
      setBusinessError(null);

      // Optimistic selection
      setBusiness((prev) => {
        if (prev) return prev;
        const slugToUse = initialBusinessSlug ?? businessSlug ?? "";
        return {
          id: initialBusinessId ?? "",
          name: inviteId ? (initialBusinessName ?? "Loading…") : (initialBusinessName ?? "Business"),
          slug: slugToUse,
          website: null,
        };
      });

      const sb = supabaseBrowser();
      const query = sb
        .from("businesses")
        .select(
          "id, name, slug, website, website_display, reference_number_enabled, reference_number_type, reference_number_label_custom"
        )
        .limit(1);

      if (initialBusinessId && isUuid(initialBusinessId)) {
        query.eq("id", initialBusinessId);
      } else if (initialBusinessSlug) {
        query.eq("slug", initialBusinessSlug);
      } else if (businessSlug) {
        query.eq("slug", businessSlug);
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
  }, [initialBusinessId, initialBusinessSlug, initialBusinessName, inviteId, businessSlug]);

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
        const ru = draft.receipt_url;
        if (typeof ru === "string" && ru.trim()) {
          setRestoredReceiptUrl(ru.trim());
        }
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

  // Resume after Google OAuth: /write-review?draft_id=…
  useEffect(() => {
    if (typeof window === "undefined") return;
    const draftId = searchParams.get("draft_id");
    if (!draftId || !isUuid(draftId)) return;

    setOtpDraftId(draftId);
    const googleStored =
      window.localStorage.getItem(GOOGLE_REVIEW_EMAIL_KEY)?.trim() ?? "";
    const storedEmail =
      googleStored ||
      window.localStorage.getItem(PENDING_REVIEW_DRAFT_EMAIL_KEY) ||
      "";
    if (storedEmail) {
      setOtpEmail(storedEmail);
      setSubmittedEmail(storedEmail);
    }
    setSubmitted(true);
    setCheckEmailState({
      active: true,
      email: storedEmail,
    });
    setOtpModalOpen(true);

    const params = new URLSearchParams(searchParams.toString());
    params.delete("draft_id");
    const qs = params.toString();
    router.replace(qs ? `/write-review?${qs}` : "/write-review", {
      scroll: false,
    });
  }, [router, searchParams]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const googleEmail = window.localStorage
      .getItem(GOOGLE_REVIEW_EMAIL_KEY)
      ?.trim();
    if (googleEmail) {
      setGuestEmail(googleEmail);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(WRITE_REVIEW_GOOGLE_MODE_KEY) === "1") {
      setAuthMode("google");
    }
  }, []);

  const isGuest = !userId && authChecked;

  const isReviewContentValid = useMemo(() => {
    if (!business) return false;
    if (rating <= 0) return false;
    if (!body.trim()) return false;
    if (!dateOfExperience) return false;

    const experienceDate = new Date(dateOfExperience);
    const today = new Date(todayIsoDate());
    if (Number.isNaN(experienceDate.getTime()) || experienceDate > today) {
      return false;
    }
    return true;
  }, [business, rating, body, dateOfExperience]);

  const isFormValid = useMemo(() => {
    if (!isReviewContentValid) return false;

    if (isGuest) {
      if (authMode === "email") {
        const emailToUse = reviewerEmail ?? guestEmail;
        if (!guestName.trim() || !emailToUse.trim()) return false;
      } else {
        if (!googleUser?.email?.trim()) return false;
      }
    }

    // Email invite pages pass reviewerEmail; require a display name even when logged in
    if (!isGuest && String(inviteToken ?? "").trim() && (reviewerEmail ?? "").trim()) {
      const nameOk =
        guestName.trim() ||
        (userDisplayName ?? "").trim() ||
        (userEmail ?? "").trim();
      if (!nameOk) return false;
    }

    return true;
  }, [
    isReviewContentValid,
    isGuest,
    guestEmail,
    guestName,
    reviewerEmail,
    inviteToken,
    userDisplayName,
    userEmail,
    authMode,
    googleUser,
  ]);

  const getFinalGuestEmailTrimmed = useCallback((): string => {
    const googleU = googleUser?.email?.trim().toLowerCase();
    if (googleU) return googleU;
    if (typeof window !== "undefined") {
      const g = window.localStorage
        .getItem(GOOGLE_REVIEW_EMAIL_KEY)
        ?.trim()
        .toLowerCase();
      if (g) return g;
    }
    return (reviewerEmail ?? guestEmail ?? userEmail ?? "").trim().toLowerCase();
  }, [googleUser, reviewerEmail, guestEmail, userEmail]);

  const getEffectiveGuestNameForSubmit = useCallback((): string => {
    if (authMode === "google" && googleUser) {
      return getSafeReviewGuestDisplayName(googleUser.name);
    }
    return getSafeReviewGuestDisplayName(
      guestName.trim() ||
        (!isGuest ? (userDisplayName ?? "").trim() : "") ||
        undefined,
    );
  }, [authMode, googleUser, guestName, isGuest, userDisplayName]);

  const handleProofChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setProofError(null);
    setRestoredReceiptUrl(null);
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

    const sb = supabaseBrowser();
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

    if (authMode === "google") {
      const {
        data: { session },
      } = await supabaseBrowser().auth.getSession();
      if (!session?.user?.email) {
        setSubmitError("Please sign in with Google first.");
        return;
      }
    }

    setIsSubmitting(true);
    if (inviteTwoStepOtp) {
      onInviteDraftFlowError?.(null);
    }

    if (isEditing) {
      try {
        const finalEmail = getFinalGuestEmailTrimmed();
        if (!finalEmail.includes("@")) {
          setSubmitError("A valid email is required to update your review.");
          return;
        }

        const res = await fetch("/api/reviews/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            business_id: business.id,
            guest_email: finalEmail,
            guest_name: getEffectiveGuestNameForSubmit(),
            rating: Math.max(1, Math.min(5, Math.round(rating))),
            title: title.trim() || null,
            body: body.trim(),
            date_of_experience: dateOfExperience,
          }),
        });

        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          success?: boolean;
        };

        if (!res.ok || data.error) {
          setSubmitError(
            typeof data.error === "string" ? data.error : "Update failed",
          );
          return;
        }

        setIsEditing(false);
        resetReviewAuthFlow();
        showToast({
          title: "Review updated",
          description: "Your changes have been saved.",
          variant: "success",
        });
        router.push(`/b/${business.slug}`);
        return;
      } catch {
        setSubmitError("Something went wrong");
        showToast({
          title: reviewErrorMessages.unexpected_error.title,
          description: reviewErrorMessages.unexpected_error.message,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      const receiptUrl =
        restoredReceiptUrl ?? (await uploadProofIfNeeded());
      const finalGuestEmailTrimmed = getFinalGuestEmailTrimmed();

      const processCreateReviewDraftResult = (
        response: Response,
        data: Record<string, unknown>,
        guestEmailTrimmed: string,
        isInviteGuest: boolean,
      ) => {
        if (!response.ok) {
          const errStr =
            data && typeof data.error === "string" ? data.error.trim() : "";
          if (errStr === "You have already reviewed this business.") {
            resetReviewAuthFlow();
            setShowDuplicateModal(true);
            setSubmitError(null);
            return;
          }
          if (
            !isInviteGuest &&
            data &&
            data.error === "draft_exists" &&
            typeof data.draft_id === "string"
          ) {
            const draftId = data.draft_id as string;
            setOtpDraftId(draftId);
            setOtpEmail(guestEmailTrimmed);
            setSubmittedEmail(guestEmailTrimmed);
            setSubmitted(true);
            setCheckEmailState({ active: true, email: guestEmailTrimmed });
            setOtpModalOpen(true);

            showToast({
              title: "Finish publishing your review",
              description:
                "You already started a review for this business. Check your email for the verification code to publish it.",
              variant: "success",
            });

            return;
          }

          const errorKey =
            (data && typeof data.error === "string" && data.error) ||
            "unexpected_error";
          const mapped =
            reviewErrorMessages[errorKey] ||
            reviewErrorMessages.unexpected_error;

          showToast({
            title: mapped.title,
            description: mapped.message,
            variant: "destructive",
          });
          return;
        }

        if (
          data &&
          data.published === true &&
          typeof data.reviewId === "string"
        ) {
          resetReviewAuthFlow();
          showToast({
            title: "Thank you",
            description: "Your review has been published.",
            variant: "success",
          });
          router.push(`/b/${business.slug}`);
          return;
        }

        if (
          data &&
          data.requiresUpdate === true &&
          typeof data.reviewId === "string"
        ) {
          resetReviewAuthFlow();
          setShowDuplicateModal(true);
          setSubmitError(null);
          return;
        }

        if (isInviteGuest) {
          const mapped = reviewErrorMessages.unexpected_error;
          showToast({
            title: mapped.title,
            description: mapped.message,
            variant: "destructive",
          });
          return;
        }

        if (
          !data ||
          typeof data.draft_id !== "string" ||
          data.requiresOtp !== true
        ) {
          const mapped = reviewErrorMessages.unexpected_error;
          showToast({
            title: mapped.title,
            description: mapped.message,
            variant: "destructive",
          });
          return;
        }

        const draftId = data.draft_id as string;
        setOtpDraftId(draftId);
        setOtpEmail(guestEmailTrimmed);
        setSubmittedEmail(guestEmailTrimmed);
        setSubmitted(true);
        setCheckEmailState({ active: true, email: guestEmailTrimmed });
        setOtpModalOpen(true);
      };

      // If editing an existing review, update instead of inserting
      if (editReviewId) {
        const sb = supabaseBrowser();
        const { error: updateError } = await sb
          .from("reviews")
          .update({
            rating: Math.max(1, Math.min(5, Math.round(rating))),
            title: title.trim() || null,
            body: body.trim(),
            date_of_experience: dateOfExperience,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editReviewId);

        if (updateError) {
          const mapped = reviewErrorMessages.unexpected_error;
          showToast({
            title: mapped.title,
            description: mapped.message,
            variant: "destructive",
          });
        } else {
          resetReviewAuthFlow();
          showToast({
            title: "Review updated",
            description:
              "Your review has been successfully updated.",
            variant: "success",
          });
          if (business) {
            const slugToUse = business.slug;
            router.push(`/b/${slugToUse}`);
          }
        }

        return;
      }

      const inviteTokenTrimmed = String(inviteToken ?? "").trim();
      const reviewerEmailNorm = (reviewerEmail ?? "").trim().toLowerCase();
      const sessionEmailNorm = (userEmail ?? "").trim().toLowerCase();

      // Email invite: always use the edge function (service role) so validation matches the
      // invite recipient and published state — even when the reviewer is logged in. The
      // logged-in direct insert path skipped invite logic and could false-positive duplicates.
      if (inviteTokenTrimmed && reviewerEmailNorm) {
        if (userId && sessionEmailNorm && sessionEmailNorm !== reviewerEmailNorm) {
          showToast({
            title: "Wrong account for this invite",
            description:
              "Sign out and open the link again, or sign in with the email address that received the invitation.",
            variant: "destructive",
          });
          return;
        }

        const guestNameForInvite = getEffectiveGuestNameForSubmit();

        if (inviteTwoStepOtp && onInviteDraftCreated) {
          const { data: inviteSessionData } = await supabaseBrowser().auth.getSession();
          const inviteAccessToken = inviteSessionData?.session?.access_token?.trim();
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (inviteAccessToken && inviteAccessToken.length > 0) {
            headers.Authorization = `Bearer ${inviteAccessToken}`;
          }

          const resDraft = await fetch("/api/reviews/create-draft", {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({
              business_id: business.id,
              rating: Math.max(1, Math.min(5, Math.round(rating))),
              title: title.trim() || null,
              body: body.trim(),
              guest_email: finalGuestEmailTrimmed,
              guest_name: guestNameForInvite,
              receipt_url: receiptUrl,
              date_of_experience: dateOfExperience,
              marketing_opt_in: marketingOptIn,
              reference_number:
                business.reference_number_enabled && referenceNumber.trim()
                  ? referenceNumber.trim()
                  : null,
              invite_token: inviteTokenTrimmed,
            }),
          });

          const dataDraft = (await resDraft.json().catch(() => ({}))) as {
            error?: string;
            draft_id?: string;
          };

          if (!resDraft.ok) {
            const msg =
              typeof dataDraft.error === "string" && dataDraft.error.trim()
                ? dataDraft.error
                : "Something went wrong";
            onInviteDraftFlowError?.(msg);
            showToast({
              title: "Couldn’t send code",
              description: msg,
              variant: "destructive",
            });
            return;
          }

          const did = dataDraft.draft_id;
          const draftIdOk =
            typeof did === "string" &&
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
              did.trim(),
            );
          if (draftIdOk) {
            onInviteDraftCreated(did.trim());
            return;
          }

          onInviteDraftFlowError?.("Something went wrong");
          showToast({
            title: "Something went wrong",
            description: "Please try again.",
            variant: "destructive",
          });
          return;
        }

        const baseUrlInvite = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKeyInvite = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!baseUrlInvite || !anonKeyInvite) {
          const mapped = reviewErrorMessages.unexpected_error;
          showToast({
            title: mapped.title,
            description: mapped.message,
            variant: "destructive",
          });
          return;
        }

        const { data: inviteSessionData } = await supabaseBrowser().auth.getSession();
        const inviteAccessToken = inviteSessionData?.session?.access_token?.trim();
        const authorizationInvite =
          inviteAccessToken && inviteAccessToken.length > 0
            ? `Bearer ${inviteAccessToken}`
            : `Bearer ${anonKeyInvite}`;

        const responseInvite = await fetch(
          `${baseUrlInvite}/functions/v1/create-review-draft`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: anonKeyInvite,
              Authorization: authorizationInvite,
            },
            body: JSON.stringify({
              business_id: business.id,
              rating: Math.max(1, Math.min(5, Math.round(rating))),
              title: title.trim() || null,
              body: body.trim(),
              guest_email: finalGuestEmailTrimmed,
              email: finalGuestEmailTrimmed,
              guest_name: guestNameForInvite,
              receipt_url: receiptUrl,
              date_of_experience: dateOfExperience,
              marketing_opt_in: marketingOptIn,
              reference_number:
                business.reference_number_enabled && referenceNumber.trim()
                  ? referenceNumber.trim()
                  : null,
              invite_token: inviteTokenTrimmed,
              is_invite: true,
            }),
          },
        );

        const dataInvite = (await responseInvite.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        processCreateReviewDraftResult(
          responseInvite,
          dataInvite,
          finalGuestEmailTrimmed,
          true,
        );
        return;
      }

      if (userId) {
        if (!finalGuestEmailTrimmed || !finalGuestEmailTrimmed.includes("@")) {
          showToast({
            title: "Email required",
            description: "Add your email so we can send a verification code.",
            variant: "destructive",
          });
          return;
        }

        const guestNameForAuth = getEffectiveGuestNameForSubmit();

        const resDraftAuth = await fetch("/api/reviews/create-draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            business_id: business.id,
            rating: Math.max(1, Math.min(5, Math.round(rating))),
            title: title.trim() || null,
            body: body.trim(),
            guest_email: finalGuestEmailTrimmed,
            guest_name: guestNameForAuth,
            receipt_url: receiptUrl,
            date_of_experience: dateOfExperience,
            marketing_opt_in: marketingOptIn,
            reference_number:
              business.reference_number_enabled && referenceNumber.trim()
                ? referenceNumber.trim()
                : null,
          }),
        });

        const dataDraftAuth = (await resDraftAuth.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        processCreateReviewDraftResult(
          resDraftAuth,
          dataDraftAuth,
          finalGuestEmailTrimmed,
          false,
        );
        return;
      }

      const isInviteGuest = Boolean(reviewerEmail?.trim());

      if (isInviteGuest && !String(inviteToken ?? "").trim()) {
        const mapped = reviewErrorMessages.invite_token_required;
        showToast({
          title: mapped.title,
          description: mapped.message,
          variant: "destructive",
        });
        return;
      }

      if (isInviteGuest) {
        const baseUrlInvite = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const anonKeyInvite = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!baseUrlInvite || !anonKeyInvite) {
          const mapped = reviewErrorMessages.unexpected_error;
          showToast({
            title: mapped.title,
            description: mapped.message,
            variant: "destructive",
          });
          return;
        }

        const responseInviteGuest = await fetch(
          `${baseUrlInvite}/functions/v1/create-review-draft`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              apikey: anonKeyInvite,
              Authorization: `Bearer ${anonKeyInvite}`,
            },
            body: JSON.stringify({
              business_id: business.id,
              rating: Math.max(1, Math.min(5, Math.round(rating))),
              title: title.trim() || null,
              body: body.trim(),
              guest_email: finalGuestEmailTrimmed,
              email: finalGuestEmailTrimmed,
              guest_name: getEffectiveGuestNameForSubmit(),
              receipt_url: receiptUrl,
              date_of_experience: dateOfExperience,
              marketing_opt_in: marketingOptIn,
              reference_number:
                business.reference_number_enabled && referenceNumber.trim()
                  ? referenceNumber.trim()
                  : null,
              invite_token: inviteToken ?? null,
              is_invite: true,
            }),
          },
        );

        const dataInviteGuest = (await responseInviteGuest.json().catch(
          () => ({}),
        )) as Record<string, unknown>;
        processCreateReviewDraftResult(
          responseInviteGuest,
          dataInviteGuest,
          finalGuestEmailTrimmed,
          true,
        );
        return;
      }

      const response = await fetch("/api/reviews/create-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          business_id: business.id,
          rating: Math.max(1, Math.min(5, Math.round(rating))),
          title: title.trim() || null,
          body: body.trim(),
          guest_email: finalGuestEmailTrimmed,
          guest_name: getEffectiveGuestNameForSubmit(),
          receipt_url: receiptUrl,
          date_of_experience: dateOfExperience,
          marketing_opt_in: marketingOptIn,
          reference_number:
            business.reference_number_enabled && referenceNumber.trim()
              ? referenceNumber.trim()
              : null,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      processCreateReviewDraftResult(
        response,
        data,
        finalGuestEmailTrimmed,
        false,
      );
    } catch (error) {
      if (!showDuplicateModal) {
        setSubmitError("Something went wrong");
        const keyFromError =
          error instanceof Error && error.message
            ? error.message
            : "unexpected_error";
        const mapped =
          reviewErrorMessages[keyFromError] ||
          reviewErrorMessages.unexpected_error;
        showToast({
          title: mapped.title,
          description: mapped.message,
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSelect = async () => {
    if (typeof window === "undefined") return;
    if (!business) {
      setSubmitError("Please choose a business before continuing with Google.");
      return;
    }

    if (!isReviewContentValid) {
      setSubmitError("Please complete all required fields.");
      return;
    }

    const experienceDate = new Date(dateOfExperience);
    const today = new Date(todayIsoDate());
    if (Number.isNaN(experienceDate.getTime()) || experienceDate > today) {
      setSubmitError("Date of experience cannot be in the future.");
      return;
    }

    setAuthMode("google");
    window.sessionStorage.setItem(WRITE_REVIEW_GOOGLE_MODE_KEY, "1");

    const emailForDraft = (reviewerEmail ?? guestEmail ?? "")
      .trim()
      .toLowerCase();
    const nameForDraft = getSafeReviewGuestDisplayName(
      guestName.trim() ||
        (!isGuest ? (userDisplayName ?? "").trim() : "") ||
        undefined,
    );

    const startGoogleOAuth = async () => {
      const baseUrl = getBaseUrl();
      const { error: oauthError } = await supabaseBrowser().auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${baseUrl}/auth/callback?next=${encodeURIComponent("/review/continue")}`,
        },
      });
      if (oauthError) {
        setSubmitError(oauthError.message);
        resetReviewAuthFlow();
      }
    };

    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const receiptUrl = await uploadProofIfNeeded();
      const pendingLocalDraft: PendingReviewDraft = {
        business_id: business.id,
        business_name: business.name,
        business_slug: business.slug,
        rating,
        title,
        body,
        date_of_experience: dateOfExperience,
        guest_email: emailForDraft,
        guest_name: nameForDraft,
        marketing_opt_in: marketingOptIn,
        reference_number: referenceNumber.trim() || null,
        receipt_url: receiptUrl,
      };

      if (!emailForDraft.includes("@")) {
        window.localStorage.setItem(
          PENDING_REVIEW_KEY,
          JSON.stringify(pendingLocalDraft),
        );
        await startGoogleOAuth();
        return;
      }

      const inviteTok = String(inviteToken ?? "").trim();
      const createDraftBody: Record<string, unknown> = {
        business_id: business.id,
        rating: Math.max(1, Math.min(5, Math.round(rating))),
        title: title.trim() || null,
        body: body.trim(),
        guest_email: emailForDraft,
        guest_name: nameForDraft,
        receipt_url: receiptUrl,
        date_of_experience: dateOfExperience,
        marketing_opt_in: marketingOptIn,
        reference_number:
          business.reference_number_enabled && referenceNumber.trim()
            ? referenceNumber.trim()
            : null,
      };
      if (inviteTok) {
        createDraftBody.invite_token = inviteTok;
      }

      const res = await fetch("/api/reviews/create-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(createDraftBody),
      });

      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

      if (!res.ok) {
        const errStr =
          typeof data.error === "string" ? data.error.trim() : "";
        if (errStr === "You have already reviewed this business.") {
          resetReviewAuthFlow();
          setShowDuplicateModal(true);
          setSubmitError(null);
          return;
        }
        if (
          errStr === "draft_exists" &&
          typeof data.draft_id === "string"
        ) {
          const did = String(data.draft_id).trim();
          window.localStorage.setItem(PENDING_REVIEW_DRAFT_ID_KEY, did);
          window.localStorage.setItem(
            PENDING_REVIEW_DRAFT_EMAIL_KEY,
            emailForDraft,
          );
          window.localStorage.setItem(
            PENDING_REVIEW_KEY,
            JSON.stringify(pendingLocalDraft),
          );

          await startGoogleOAuth();
          return;
        }

        const errorKey =
          (typeof data.error === "string" && data.error) || "unexpected_error";
        const mapped =
          reviewErrorMessages[errorKey] ||
          reviewErrorMessages.unexpected_error;
        setSubmitError(mapped.message);
        showToast({
          title: mapped.title,
          description: mapped.message,
          variant: "destructive",
        });
        resetReviewAuthFlow();
        return;
      }

      if (data.requiresUpdate === true) {
        resetReviewAuthFlow();
        setShowDuplicateModal(true);
        setSubmitError(null);
        return;
      }

      if (
        data.published === true &&
        typeof data.reviewId === "string" &&
        business.slug
      ) {
        resetReviewAuthFlow();
        showToast({
          title: "Thank you",
          description: "Your review has been published.",
          variant: "success",
        });
        router.push(`/b/${business.slug}`);
        return;
      }

      if (
        data.requiresOtp === true &&
        typeof data.draft_id === "string"
      ) {
        const did = String(data.draft_id).trim();
        window.localStorage.setItem(PENDING_REVIEW_DRAFT_ID_KEY, did);
        window.localStorage.setItem(
          PENDING_REVIEW_DRAFT_EMAIL_KEY,
          emailForDraft,
        );
        window.localStorage.setItem(
          PENDING_REVIEW_KEY,
          JSON.stringify(pendingLocalDraft),
        );

        await startGoogleOAuth();
        return;
      }

      const mapped = reviewErrorMessages.unexpected_error;
      setSubmitError(mapped.message);
      showToast({
        title: mapped.title,
        description: mapped.message,
        variant: "destructive",
      });
      resetReviewAuthFlow();
    } catch {
      setSubmitError("Something went wrong");
      showToast({
        title: reviewErrorMessages.unexpected_error.title,
        description: reviewErrorMessages.unexpected_error.message,
        variant: "destructive",
      });
      resetReviewAuthFlow();
    } finally {
      setIsSubmitting(false);
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
    setShowDuplicateModal(false);
    setIsEditing(false);
    setCheckEmailState({ active: false, email: "" });
    resetReviewAuthFlow();
    setRestoredReceiptUrl(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(PENDING_REVIEW_DRAFT_ID_KEY);
      window.localStorage.removeItem(PENDING_REVIEW_DRAFT_EMAIL_KEY);
    }
  };

  return (
    <main className="bg-white">
      <section className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">
          Write a review
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Share your experience to help others make better decisions.
        </p>

        {!showDuplicateModal && submitError && (
          <div
            className="error mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {submitError}
          </div>
        )}

        <div
          className="mt-6 space-y-6 rounded-2xl bg-white p-6"
          style={{
            border: "3px solid #124541",
            boxShadow:
              "0 0 20px rgba(18, 69, 65, 0.25), 0 0 40px rgba(18, 69, 65, 0.15)",
          }}
        >
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

                {authMode === "email" && (
                  <>
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
                        {reviewerEmail ? (
                          <div className="text-sm text-gray-600">
                            Posting as <strong>{reviewerEmail}</strong>
                          </div>
                        ) : (
                          <>
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
                              onChange={(event) =>
                                setGuestEmail(event.target.value)
                              }
                              disabled={isSubmitting}
                              className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                              We&apos;ll send a one-time code to verify your
                              review. Your email won&apos;t be shown publicly.
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleGoogleSelect()}
                      disabled={isSubmitting || !business || !isReviewContentValid}
                      className="mt-1 inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
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
                    </button>
                  </>
                )}

                {authMode === "google" && !googleUser && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 ease-in-out">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        Sign in with Google
                      </p>
                      <button
                        type="button"
                        onClick={() => resetReviewAuthFlow()}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Change method
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">
                      {isSubmitting
                        ? "Redirecting you to Google…"
                        : "Continue with Google to verify your review. Your email is not shown publicly."}
                    </p>
                    <button
                      type="button"
                      onClick={() => void handleGoogleSelect()}
                      disabled={isSubmitting || !business || !isReviewContentValid}
                      className="mt-3 w-full border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Continue with Google
                    </button>
                  </div>
                )}

                {authMode === "google" && googleUser && (
                  <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm transition-all duration-200 ease-in-out">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-gray-900">
                        Signed in with Google
                      </p>
                      <button
                        type="button"
                        onClick={() => resetReviewAuthFlow()}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Change method
                      </button>
                    </div>

                    <p className="text-sm text-gray-700">{googleUser.email}</p>

                    <button
                      type="button"
                      onClick={() => void handleGoogleSelect()}
                      disabled={isSubmitting || !business || !isReviewContentValid}
                      className="mt-3 w-full border border-gray-200 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                    >
                      Continue with Google
                    </button>
                  </div>
                )}
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
              {toast && (
                <div
                  className={`rounded-md border px-3 py-2 text-sm ${
                    toast.variant === "destructive"
                      ? "border-red-200 bg-red-50 text-red-800"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800"
                  }`}
                >
                  <p className="font-semibold">{toast.title}</p>
                  <p className="mt-1 text-xs">{toast.description}</p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full rounded-full bg-[#1FAF9E] text-sm font-semibold hover:bg-[#169786]"
                disabled={
                  isSubmitting ||
                  !isFormValid ||
                  !business ||
                  (authMode === "google" && !googleUser?.email?.trim())
                }
              >
                {isSubmitting
                  ? "Submitting your review…"
                  : "Submit review"}
              </Button>

              {checkEmailState.active && !reviewerEmail?.trim() && (
                <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
                  <p className="font-semibold">Check your email for a code</p>
                  <p className="mt-1">
                    We&apos;ve sent a 6-digit verification code to{" "}
                    <span className="font-semibold">
                      {checkEmailState.email}
                    </span>
                    . Enter this code in the verification window to publish your
                    review.
                  </p>
                </div>
              )}

              {otpDraftId &&
                otpEmail &&
                !otpModalOpen &&
                !inviteTwoStepOtp && (
                <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                  <p className="font-semibold text-emerald-800">
                    Finish publishing your review
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    We sent a verification code to your email. Enter the code to
                    publish your review.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setOtpModalOpen(true)}
                      className="w-fit rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Enter verification code
                    </button>
                    <p className="text-xs text-emerald-800">
                      Didn&apos;t get a code or it expired? Submit your review
                      again to receive a new one.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </form>
        </div>
      </section>
      {!inviteTwoStepOtp && otpDraftId && otpEmail && (
        <ReviewOtpModal
          draftId={otpDraftId}
          email={otpEmail}
          open={otpModalOpen}
          onSuccess={() => {
            resetReviewAuthFlow();
            if (typeof window !== "undefined") {
              window.localStorage.removeItem(PENDING_REVIEW_DRAFT_ID_KEY);
              window.localStorage.removeItem(PENDING_REVIEW_DRAFT_EMAIL_KEY);
            }
            if (business) {
              const slugToUse = business.slug;
              router.push(`/b/${slugToUse}`);
            }
          }}
          onClose={() => {
            setOtpModalOpen(false);
          }}
        />
      )}
      {showDuplicateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="animate-fadeIn relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <button
              type="button"
              onClick={() => setShowDuplicateModal(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ✕
            </button>

            <div className="text-center">
              <h2 className="mb-2 text-lg font-semibold text-gray-900">
                You’ve already reviewed this business
              </h2>

              <p className="mb-4 text-sm text-gray-600">
                We found a published review from this email on this business.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowDuplicateModal(false);
                  setIsEditing(true);
                }}
                className="text-sm font-medium text-green-600 hover:underline"
              >
                Update your review
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

