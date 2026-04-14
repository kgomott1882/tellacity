"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import BusinessSearchInput from "@/components/search/BusinessSearchInput";
function isValidSlug(slug: string) {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
}

import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";
import { normalizeLogoUrl } from "@/lib/logo";
import { getPostLoginPath } from "@/lib/postLoginRedirect";
import { getUserBusinesses } from "@/lib/getUserBusinesses";

type ReviewItem = {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
  updated_at?: string | null;
  rating: number;
  status: string | null;
  business?: {
    name: string | null;
    slug: string | null;
    logo_url?: string | null;
    resolved_logo_url?: string | null;
  } | null;
};

const tabs = ["Overview", "My Reviews", "Profile", "Settings"] as const;
type Tab = (typeof tabs)[number];

const formatDate = (value: string | null | undefined) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default function ConsumerDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [loadingUser, setLoadingUser] = useState(true);
  const [authUserId, setAuthUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [editingReview, setEditingReview] = useState<ReviewItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);
  const [showWriteReviewSearch, setShowWriteReviewSearch] = useState(false);
  /** Final ownership guard: keep consumer UI from flashing while sending owners to the business dashboard. */
  const [ownerRedirectActive, setOwnerRedirectActive] = useState(false);

  const recentActivities = useMemo(() => {
    return reviews.slice(0, 3).map((review) => {
      const businessName = review.business?.name?.trim() || "a business";
      const hasMeaningfulEdit =
        !!review.updated_at &&
        !!review.created_at &&
        new Date(review.updated_at).getTime() - new Date(review.created_at).getTime() > 60_000;
      return {
        id: review.id,
        text: hasMeaningfulEdit
          ? `You updated your review for ${businessName}`
          : `You reviewed ${businessName}`,
        date: formatDate(hasMeaningfulEdit ? review.updated_at : review.created_at),
      };
    });
  }, [reviews]);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      let data: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null } | null = null;
      try {
        const result = await supabaseBrowser().auth.getUser();
        data = result.data;
      } catch (e) {
        if (isAbortError(e)) {
          if (!isMounted) return;
          try {
            await new Promise((r) => setTimeout(r, 200));
            const retry = await supabaseBrowser().auth.getUser();
            data = retry.data;
          } catch (retryErr) {
            if (isMounted) setLoadingUser(false);
            return;
          }
          if (!isMounted) return;
        } else {
          throw e;
        }
      }
      if (!isMounted) return;
      if (!data?.user?.id) {
        router.push("/auth/login");
        return;
      }
      setAuthUserId(data.user.id);

      const destination = await getPostLoginPath(data.user.id);
      if (!isMounted) return;
      if (destination !== "/dashboard") {
        window.location.href = `${window.location.origin}${destination}`;
        return;
      }

      const businesses = await getUserBusinesses(data.user.id);
      if (!isMounted) return;
      if (businesses.length > 0) {
        window.location.replace(`${window.location.origin}/business/dashboard`);
        return;
      }

      setUserEmail(data.user.email ?? "");
      setDisplayName(
        (data.user.user_metadata?.display_name as string | undefined) ?? ""
      );
      setCountry(
        (data.user.user_metadata?.country as string | undefined) ?? ""
      );

      const ownedFinal = await getUserBusinesses(data.user.id);
      if (!isMounted) return;
      if (ownedFinal.length > 0) {
        setOwnerRedirectActive(true);
        window.location.replace(`${window.location.origin}/business/dashboard`);
        return;
      }

      setLoadingUser(false);
    };
    loadUser();
    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    let isMounted = true;
    const fetchReviews = async () => {
      if (!userEmail && !authUserId) return;
      setLoadingReviews(true);
      setReviewsError("");
      const supabase = supabaseBrowser();
      const safeEmail = userEmail.trim().toLowerCase();
      const { data, error } = await supabase
        .from("reviews")
        .select(
          "id, title, body, created_at, updated_at, rating, status, user_id, guest_email, business:businesses(name, slug, logo_url, website, website_display)"
        )
        .or(
          authUserId && safeEmail
            ? `user_id.eq.${authUserId},guest_email.ilike.${safeEmail}`
            : authUserId
              ? `user_id.eq.${authUserId}`
              : `guest_email.ilike.${safeEmail}`,
        )
        .order("created_at", { ascending: false });
      if (!isMounted) return;
      if (error) {
        setReviewsError("Unable to load your reviews.");
        setLoadingReviews(false);
        return;
      }
      setReviews(((data as unknown) as ReviewItem[]) ?? []);
      setLoadingReviews(false);
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [userEmail, authUserId]);

  const handleSaveProfile = async () => {
    setProfileMessage("");
    setSavingProfile(true);
      const { error } = await supabaseBrowser().auth.updateUser({
      data: {
        display_name: displayName,
        country,
      },
    });
    setSavingProfile(false);
    if (error) {
      setProfileMessage(error.message);
      return;
    }
    setProfileMessage("Profile updated.");
  };

  const handleSignOut = async () => {
    await supabaseBrowser().auth.signOut();
    router.push("/");
  };

  const openEditReview = (review: ReviewItem) => {
    setEditingReview(review);
    setEditTitle(review.title ?? "");
    setEditBody(review.body);
    setEditError("");
  };

  const handleSaveReview = async () => {
    if (!editingReview) return;
    const trimmedBody = editBody.trim();
    if (!trimmedBody) {
      setEditError("Your review text cannot be empty.");
      return;
    }

    setEditSaving(true);
    setEditError("");
    try {
      const supabase = supabaseBrowser();
      const { error } = await supabase
        .from("reviews")
        .update({
          title: editTitle.trim() || null,
          body: trimmedBody,
        })
        .eq("id", editingReview.id)
        .eq("guest_email", userEmail);

      if (error) {
        throw new Error(error.message || "Unable to save changes.");
      }

      setReviews((prev) =>
        prev.map((item) =>
          item.id === editingReview.id
            ? { ...item, title: editTitle.trim() || null, body: trimmedBody }
            : item
        )
      );
      setEditingReview(null);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : "Unable to save changes."
      );
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch("/api/reviews/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ review_id: id }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        success?: boolean;
      };
      if (!res.ok || data.success !== true) {
        throw new Error(
          typeof data.error === "string" ? data.error : "Unable to delete review.",
        );
      }

      setReviews((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setReviewsError(
        err instanceof Error ? err.message : "Unable to delete review."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (ownerRedirectActive) {
    return null;
  }

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-white">
        <section className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="h-6 w-48 rounded bg-gray-100" />
          <div className="mt-6 h-4 w-64 rounded bg-gray-100" />
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <aside className="space-y-2 text-sm">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`w-full rounded-lg px-3 py-2 text-left font-medium ${
                  activeTab === tab
                    ? "bg-[#1FAF9E]/10 text-[#0E0E0E]"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab}
              </button>
            ))}
            <button
              type="button"
              onClick={handleSignOut}
              className="w-full rounded-lg px-3 py-2 text-left font-medium text-gray-600 hover:bg-gray-50"
            >
              Log out
            </button>
          </aside>

          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            {activeTab === "Overview" && (
              <div className="space-y-6">
                <div>
                  <h1 className="text-2xl font-semibold text-[#0E0E0E]">
                    Welcome back, {displayName || "there"}
                  </h1>
                  <p className="mt-2 text-sm text-gray-600">
                    Manage your reviews and account details.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => setShowWriteReviewSearch(true)}
                    className="rounded-full bg-[#1FAF9E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#169786]"
                  >
                    Write a review
                  </button>
                </div>
                {showWriteReviewSearch && (
                  <div className="w-full max-w-2xl">
                    <BusinessSearchInput
                      placeholder="Find businesses you can trust..."
                      className="w-full"
                      heroLayout
                      heroButtonLabel="Find a business"
                      onSelect={(business) => {
                        if (business?.slug) {
                          router.push(`/write-review?businessSlug=${business.slug}`);
                        }
                      }}
                      onSubmitQuery={(query: string) => {
                        if (!query.trim()) return;
                        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
                      }}
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-lg font-semibold text-[#0E0E0E]">
                    Recent activity
                  </h2>
                  {loadingReviews ? (
                    <div className="mt-4 space-y-2">
                      <div className="h-4 w-52 rounded bg-gray-100" />
                      <div className="h-4 w-44 rounded bg-gray-100" />
                      <div className="h-4 w-48 rounded bg-gray-100" />
                    </div>
                  ) : recentActivities.length > 0 ? (
                    <ul className="mt-4 space-y-3 text-sm text-gray-600">
                      {recentActivities.map((activity) => (
                        <li key={activity.id} className="flex items-center justify-between gap-4">
                          <span>{activity.text}</span>
                          <span className="shrink-0 text-xs text-gray-400">{activity.date}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-gray-500">
                      No recent review activity yet.
                    </p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "My Reviews" && (
              <div>
                <h2 className="text-lg font-semibold text-[#0E0E0E]">
                  My Reviews
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  See the reviews you have submitted.
                </p>
                <div className="mt-6 space-y-4">
                  {loadingReviews && (
                    <div className="space-y-3">
                      <div className="h-20 rounded-xl bg-gray-100" />
                      <div className="h-20 rounded-xl bg-gray-100" />
                    </div>
                  )}
                  {!loadingReviews && reviews.length === 0 && (
                    <div className="rounded-xl border border-gray-200 p-6 text-sm text-gray-600">
                      <p>You haven’t written any reviews yet.</p>
                      <Link
                        href="/search"
                        className="mt-4 inline-flex rounded-full bg-[#1FAF9E] px-4 py-2 text-xs font-semibold text-white hover:bg-[#169786]"
                      >
                        Write your first review
                      </Link>
                    </div>
                  )}
                  {reviewsError && (
                    <p className="text-sm text-red-600">{reviewsError}</p>
                  )}
                  {!loadingReviews &&
                    reviews.map((review) => (
                      <div
                        key={review.id}
                        className="rounded-xl border border-gray-200 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-[#FCF7F6]">
                              {review.business?.logo_url ? (
                                <img
                                  src={normalizeLogoUrl(review.business.logo_url ?? "") ?? (review.business.logo_url ?? "")}
                                  alt={review.business?.name ?? "Business"}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <span className="text-sm font-semibold text-[#0E0E0E]">
                                  {(review.business?.name?.trim()?.charAt(0) || "B").toUpperCase()}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-[#0E0E0E]">
                                {review.business?.name ?? "Business"}
                              </p>
                              <p className="text-xs text-gray-500">
                                {review.status === "pending"
                                  ? "Pending verification"
                                  : "Published"}
                              </p>
                            </div>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(review.created_at)}
                          </span>
                        </div>
                        <div className="mt-3 text-sm text-gray-600">
                          <p className="font-semibold text-[#0E0E0E]">
                            {review.title || "Your review"}
                          </p>
                          <p className="mt-1 line-clamp-2">{review.body}</p>
                        </div>
                        <div className="mt-4 flex items-center gap-4 text-xs font-semibold text-[#1FAF9E]">
                          <button
                            type="button"
                            onClick={() => openEditReview(review)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteReview(review.id)}
                            disabled={deletingId === review.id}
                            className={
                              deletingId === review.id
                                ? "text-gray-400 cursor-not-allowed"
                                : ""
                            }
                          >
                            {deletingId === review.id ? "Deleting…" : "Delete"}
                          </button>
                          {review.business?.slug && isValidSlug(review.business.slug) && (
                            <Link href={`/b/${review.business.slug.trim().toLowerCase()}`}>View</Link>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {activeTab === "Profile" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#0E0E0E]">
                    Profile
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Update your personal information.
                  </p>
                </div>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-[#0E0E0E]">
                      Display name
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0E0E0E]">
                      Country (optional)
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(event) => setCountry(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-neutral-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#0E0E0E]">
                      Email address
                    </label>
                    <input
                      type="email"
                      value={userEmail}
                      readOnly
                      className="mt-2 w-full rounded-lg border border-neutral-300 bg-gray-50 px-4 py-3 text-sm text-gray-500"
                    />
                  </div>
                </div>
                {profileMessage && (
                  <p className="text-sm text-[#1FAF9E]">{profileMessage}</p>
                )}
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {savingProfile ? "Saving..." : "Save changes"}
                </button>
              </div>
            )}

            {activeTab === "Settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#0E0E0E]">
                    Settings
                  </h2>
                  <p className="mt-2 text-sm text-gray-600">
                    Manage your notification preferences.
                  </p>
                </div>
                <div className="space-y-4 text-sm text-gray-600">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={(event) =>
                        setEmailNotifications(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#1FAF9E] focus:ring-[#1FAF9E]"
                    />
                    Email notifications
                  </label>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={marketingEmails}
                      onChange={(event) =>
                        setMarketingEmails(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-gray-300 text-[#1FAF9E] focus:ring-[#1FAF9E]"
                    />
                    Marketing emails
                  </label>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="rounded-full border border-[#1FAF9E] px-6 py-2 text-sm font-semibold text-[#1FAF9E] hover:bg-[#1FAF9E]/10"
                  >
                    Log out
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-gray-200 px-6 py-2 text-sm font-semibold text-gray-500"
                  >
                    Delete account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {editingReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-lg font-semibold text-[#0E0E0E]">
              Edit your review
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Updates will replace your existing review for{" "}
              {editingReview.business?.name ?? "this business"}.
            </p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-[#0E0E0E]">
                  Title (optional)
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#0E0E0E]">
                  Your review
                </label>
                <textarea
                  value={editBody}
                  onChange={(e) => setEditBody(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                />
              </div>
              {editError && (
                <p className="text-xs text-red-600">{editError}</p>
              )}
              <div className="mt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  disabled={editSaving}
                  className="rounded-full border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={editSaving}
                  className="rounded-full bg-[#1FAF9E] px-5 py-2 text-xs font-semibold text-white hover:bg-[#169786] disabled:opacity-50"
                >
                  {editSaving ? "Saving…" : "Save changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
