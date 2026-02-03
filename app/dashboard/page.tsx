"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizeLogoUrl } from "@/lib/logo";

type ReviewItem = {
  id: string;
  title: string | null;
  body: string;
  created_at: string;
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
  const [userEmail, setUserEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [country, setCountry] = useState("");
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [marketingEmails, setMarketingEmails] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const loadUser = async () => {
      let data: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null } | null = null;
      try {
        const result = await supabaseBrowser.auth.getUser();
        data = result.data;
      } catch (e) {
        if (e && typeof e === "object" && (e as { name?: string }).name === "AbortError") {
          if (isMounted) {
            setLoadingUser(false);
            router.push("/auth/login");
          }
          return;
        }
        throw e;
      }
      if (!isMounted) return;
      if (!data?.user) {
        router.push("/auth/login");
        return;
      }
      
      // If this email has a business profile (by id or by email), redirect to business dashboard only.
      const { data: businessProfileById } = await supabase
        .from("business_profiles")
        .select("id")
        .eq("id", data.user.id)
        .maybeSingle();

      if (!isMounted) return;
      if (businessProfileById) {
        router.push("/business/dashboard");
        return;
      }

      const emailNorm = data.user.email?.trim().toLowerCase();
      if (emailNorm) {
        const { data: businessProfileByEmail } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("email", emailNorm)
          .maybeSingle();
        if (!isMounted) return;
        if (businessProfileByEmail) {
          router.push("/business/dashboard");
          return;
        }
      }
      
      setUserEmail(data.user.email ?? "");
      setDisplayName(
        (data.user.user_metadata?.display_name as string | undefined) ?? ""
      );
      setCountry(
        (data.user.user_metadata?.country as string | undefined) ?? ""
      );
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
      if (!userEmail) return;
      setLoadingReviews(true);
      setReviewsError("");
      const { data, error } = await supabaseBrowser
        .from("reviews")
        .select(
          "id, title, body, created_at, rating, status, business:businesses(name, slug, logo_url, website, website_display)"
        )
        .eq("guest_email", userEmail)
        .order("created_at", { ascending: false });
      if (!isMounted) return;
      if (error) {
        setReviewsError("Unable to load your reviews.");
        setLoadingReviews(false);
        return;
      }
      setReviews((data as ReviewItem[]) ?? []);
      setLoadingReviews(false);
    };
    fetchReviews();
    return () => {
      isMounted = false;
    };
  }, [userEmail]);

  const handleSaveProfile = async () => {
    setProfileMessage("");
    setSavingProfile(true);
      const { error } = await supabaseBrowser.auth.updateUser({
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
    await supabase.auth.signOut();
    router.push("/");
  };

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
                  <Link
                    href="/search"
                    className="rounded-full bg-[#1FAF9E] px-5 py-2 text-sm font-semibold text-white hover:bg-[#169786]"
                  >
                    Write a review
                  </Link>
                  <Link
                    href="/categories"
                    className="rounded-full border border-[#1FAF9E] px-5 py-2 text-sm font-semibold text-[#1FAF9E] hover:bg-[#1FAF9E]/10"
                  >
                    Find a business
                  </Link>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[#0E0E0E]">
                    Recent activity
                  </h2>
                  <ul className="mt-4 space-y-3 text-sm text-gray-600">
                    <li>You reviewed Makro</li>
                    <li>You edited your review for ABSA</li>
                    <li>You liked a review on Uber Eats</li>
                  </ul>
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
                              {(review.business?.logo_url ?? review.business?.resolved_logo_url) ? (
                                <img
                                  src={normalizeLogoUrl(review.business.logo_url ?? review.business.resolved_logo_url ?? "") ?? (review.business.logo_url ?? review.business.resolved_logo_url ?? "")}
                                  alt={review.business?.name ?? "Business"}
                                  className="h-full w-full object-contain"
                                />
                              ) : null}
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
                          <button type="button">Edit</button>
                          <button type="button">Delete</button>
                          {review.business?.slug && (
                            <Link href={`/b/${review.business.slug}`}>View</Link>
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
    </main>
  );
}
