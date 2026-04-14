"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import BusinessSearchInput, {
  type BusinessSearchResult,
} from "@/components/search/BusinessSearchInput";
import {
  filterCategoriesByPrimaryGroup,
  useCategoryGroupCatalog,
} from "@/hooks/useCategoryGroupCatalog";
import {
  mergeOnboardingPrefill,
  readSignupBusinessSessionStorage,
  type AccountApiOnboarding,
} from "@/lib/businessOnboardingPrefill";
import { emailDomainToBusinessSearchHint } from "@/lib/emailDomainBusinessHint";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

function sanitizeClaimSearchToken(q: string): string {
  return q
    .trim()
    .replace(/[%_,]/g, " ")
    .replace(/\s+/g, " ");
}

function stripWebsiteInput(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "");
}

const createFormInputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20";
const createFormLabelClass = "block text-sm font-medium text-[#0E0E0E] mb-1.5";

type Step =
  | "choice"
  | "create_form"
  | "create_otp"
  | "claim_search"
  | "claim_confirm"
  | "claim_otp";

type SearchHit = {
  id: string;
  name: string;
  website: string | null;
  slug: string | null;
};

type Props = {
  open: boolean;
  onClose: () => void;
  userEmail: string;
  onCompleted: () => void | Promise<void>;
};

export default function BusinessOnboardingModal({
  open,
  onClose,
  userEmail,
  onCompleted,
}: Props) {
  const [step, setStep] = useState<Step>("choice");
  const [businessName, setBusinessName] = useState("");
  const [createWebsiteHost, setCreateWebsiteHost] = useState("");
  const [country, setCountry] = useState("");
  const [primaryGroupSlug, setPrimaryGroupSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [createBusinessId, setCreateBusinessId] = useState<string | null>(null);
  const [claimBusinessId, setClaimBusinessId] = useState<string | null>(null);
  const [selectedHit, setSelectedHit] = useState<SearchHit | null>(null);
  const [claimSearchKey, setClaimSearchKey] = useState(0);
  /** Pre-filled from work email domain when user picks “listed on Tellacity”. */
  const [claimSearchInitialQuery, setClaimSearchInitialQuery] = useState("");
  const [claimExpandedResults, setClaimExpandedResults] = useState<BusinessSearchResult[] | null>(null);
  const [claimExpandedLoading, setClaimExpandedLoading] = useState(false);
  const [claimEligibilityLoading, setClaimEligibilityLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [duplicateOverlay, setDuplicateOverlay] = useState<{
    message: string;
  } | null>(null);
  const [prefillSummary, setPrefillSummary] = useState<string | null>(null);
  const createFormPrefillLoadedRef = useRef(false);

  const reset = useCallback(() => {
    setStep("choice");
    setBusinessName("");
    setCreateWebsiteHost("");
    setCountry("");
    setPrimaryGroupSlug("");
    setCategorySlug("");
    setCity("");
    setStreetAddress("");
    setPhone("");
    setPublicEmail("");
    setNotes("");
    setCreateBusinessId(null);
    setClaimBusinessId(null);
    setSelectedHit(null);
    setClaimEligibilityLoading(false);
    setOtp("");
    setError("");
    setInfo("");
    setLoading(false);
    setDuplicateOverlay(null);
    setPrefillSummary(null);
    createFormPrefillLoadedRef.current = false;
    setClaimSearchInitialQuery("");
    setClaimExpandedResults(null);
    setClaimExpandedLoading(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  useEffect(() => {
    if (!open) {
      createFormPrefillLoadedRef.current = false;
      return;
    }
    if (step !== "create_form") {
      createFormPrefillLoadedRef.current = false;
      return;
    }
    if (createFormPrefillLoadedRef.current) return;
    createFormPrefillLoadedRef.current = true;

    void (async () => {
      try {
        const res = await fetch("/api/dashboard/account", { credentials: "include" });
        const data = (await res.json().catch(() => ({}))) as {
          onboarding?: AccountApiOnboarding;
        };
        const sessionRaw = readSignupBusinessSessionStorage();
        const merged = mergeOnboardingPrefill(data.onboarding, sessionRaw, userEmail);

        setBusinessName((prev) => prev || merged.businessName);
        setCreateWebsiteHost((prev) => prev || merged.websiteHost);
        setCountry((prev) => prev || merged.countryCode);
        setPhone((prev) => prev || merged.phone);
        setPublicEmail((prev) => prev || merged.publicEmail);

        const person = [merged.firstName, merged.lastName].filter(Boolean).join(" ").trim();
        const bits: string[] = [];
        if (person) bits.push(person);
        if (merged.jobTitle) bits.push(merged.jobTitle);
        if (userEmail.trim()) bits.push(userEmail.trim());
        setPrefillSummary(bits.length > 0 ? bits.join(" · ") : null);
      } catch {
        createFormPrefillLoadedRef.current = false;
      }
    })();
  }, [open, step, userEmail]);

  const {
    groups,
    categories,
    loading: categoriesLoading,
    loadError: categoryCatalogError,
  } = useCategoryGroupCatalog(open && step === "create_form");

  const filteredCreateCategories = filterCategoriesByPrimaryGroup(
    categories,
    primaryGroupSlug
  );

  async function postJson(url: string, body: Record<string, unknown>) {
    const res = await fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = (await res.json().catch(() => ({}))) as {
      error?: string;
      message?: string;
      businessId?: string;
      success?: boolean;
    };
    return { res, data };
  }

  async function submitCreateDraft() {
    setError("");
    setInfo("");

    const nameTrim = businessName.trim();
    const host = stripWebsiteInput(createWebsiteHost);
    const websiteFull = host ? `https://${host}` : "";
    const cc = country.trim().toUpperCase().slice(0, 2);
    const groupTrim = primaryGroupSlug.trim();
    const catTrim = categorySlug.trim();

    if (!nameTrim || !websiteFull || cc.length !== 2 || !groupTrim || !catTrim) {
      setError(
        "Fill in all required fields: business name, website, country, primary group, and category."
      );
      return;
    }

    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        name: nameTrim,
        website: websiteFull,
        country_code: cc,
        primary_group_slug: groupTrim,
        category_slug: catTrim,
        city: city.trim() || undefined,
        street_address: streetAddress.trim() || undefined,
        phone: phone.trim() || undefined,
        public_email: publicEmail.trim() || undefined,
        notes: notes.trim() || undefined,
      };

      const { res, data } = await postJson("/api/business/create-draft", body);

      if (
        res.status === 409 &&
        (data.error === "duplicate" ||
          data.error === "already_claimed" ||
          data.error === "website_in_use")
      ) {
        setDuplicateOverlay({
          message:
            data.message ||
            (data.error === "already_claimed"
              ? "Business already claimed"
              : data.error === "website_in_use"
                ? "A listing for this website already exists on Tellacity. Use Claim to connect your account."
                : "A business with this website already exists on Tellacity. If you own it, use Claim instead."),
        });
        return;
      }

      if (!res.ok) {
        setDuplicateOverlay(null);
        setError(
          data.message || data.error || "Could not create draft. Please try again."
        );
        return;
      }

      setDuplicateOverlay(null);
      if (data.success !== true || !data.businessId) {
        setError("Invalid server response");
        return;
      }

      setCreateBusinessId(data.businessId);
      setOtp("");

      setStep("create_otp");
      setInfo("We sent a 6-digit code to your email. It must match your website domain.");
    } catch (e) {
      setDuplicateOverlay(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyCreateOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!createBusinessId) return;
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/business/verify-domain", {
        businessId: createBusinessId,
        code,
      });
      if (!res.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }
      await onCompleted();
      onClose();
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  function selectHit(hit: SearchHit) {
    setSelectedHit(hit);
    setClaimBusinessId(hit.id);
    setStep("claim_confirm");
    setError("");
    setOtp("");
    setInfo("");
  }

  async function loadExpandedClaimResults(rawQuery: string) {
    const q = sanitizeClaimSearchToken(rawQuery);
    if (q.length < 1) return;
    setClaimExpandedLoading(true);
    setClaimExpandedResults(null);
    setError("");
    try {
      const supabase = supabaseBrowser();
      const { data, error: sbError } = await supabase
        .from("businesses")
        .select("id, name, slug, website, website_display, status")
        .eq("status", "active")
        .or(`name.ilike.%${q}%,website_display.ilike.%${q}%,website.ilike.%${q}%`)
        .order("trust_score", { ascending: false, nullsFirst: false })
        .order("review_count", { ascending: false })
        .limit(50);

      if (sbError || !data) {
        setClaimExpandedResults([]);
        return;
      }
      const rows = data as {
        id: string;
        name?: string | null;
        slug: string;
        website?: string | null;
        website_display?: string | null;
      }[];
      setClaimExpandedResults(
        rows.map((row) => ({
          id: row.id,
          name: row.name ?? "Business",
          slug: row.slug,
          website: row.website_display ?? row.website ?? null,
        }))
      );
    } catch {
      setClaimExpandedResults([]);
    } finally {
      setClaimExpandedLoading(false);
    }
  }

  async function handleHeroBusinessSelect(business: BusinessSearchResult) {
    setClaimExpandedResults(null);
    setError("");
    setClaimEligibilityLoading(true);
    try {
      const res = await fetch(
        `/api/business/eligible-for-claim?businessId=${encodeURIComponent(business.id)}`,
        { credentials: "include" }
      );
      const data = (await res.json().catch(() => ({}))) as {
        eligible?: boolean;
        message?: string;
      };
      if (!res.ok || !data.eligible) {
        setError(
          data.message ??
            "This listing cannot be claimed. It may already be linked to another account."
        );
        return;
      }
      selectHit({
        id: business.id,
        name: business.name,
        website: business.website,
        slug: business.slug,
      });
    } catch {
      setError("Could not verify this listing. Try again.");
    } finally {
      setClaimEligibilityLoading(false);
    }
  }

  async function handleClaimThisBusiness() {
    if (!claimBusinessId) return;
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const claim = await postJson("/api/business/claim-request", {
        businessId: claimBusinessId,
      });
      if (!claim.res.ok) {
        throw new Error(
          claim.data.message || claim.data.error || "Cannot claim this business"
        );
      }

      const send = await postJson("/api/business/verify-domain", {
        businessId: claimBusinessId,
      });
      if (!send.res.ok) {
        throw new Error(
          send.data.message || send.data.error || "Could not send verification code"
        );
      }

      setStep("claim_otp");
      setInfo("We sent a 6-digit code to your email. It must match this business website domain.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyClaimOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!claimBusinessId) return;
    const code = otp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/business/verify-domain", {
        businessId: claimBusinessId,
        code,
      });
      if (!res.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }
      await onCompleted();
      onClose();
      reset();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp(businessId: string) {
    setLoading(true);
    setError("");
    try {
      const { res, data } = await postJson("/api/business/verify-domain", { businessId });
      if (!res.ok) {
        throw new Error(data.message || data.error || "Could not resend code");
      }
      setInfo("A new code was sent to your email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend");
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <>
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-8">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={() => !loading && onClose()}
      />
      <div className="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={() => !loading && onClose()}
          className="absolute right-4 top-4 text-2xl leading-none text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>

        {step === "choice" && (
          <div className="pt-2">
            <h2 className="text-center text-xl font-semibold text-gray-900">
              How would you like to continue?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Signed in as <span className="font-medium text-gray-900">{userEmail}</span>
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setClaimSearchInitialQuery(
                    emailDomainToBusinessSearchHint(userEmail)
                  );
                  setClaimSearchKey((k) => k + 1);
                  setStep("claim_search");
                  setError("");
                }}
                className="rounded-xl border-2 border-gray-200 bg-[#F8F4F0] p-5 text-left transition hover:border-[#1FAF9E] hover:bg-white"
              >
                <span className="text-sm font-semibold text-gray-900">
                  I have a business listed on Tellacity
                </span>
                <p className="mt-2 text-xs text-gray-600">
                  Search by name or website like on the homepage, then claim your listing. We&apos;ll
                  verify your work email matches the business website.
                </p>
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("create_form");
                  setError("");
                  setDuplicateOverlay(null);
                }}
                className="rounded-xl border-2 border-gray-200 bg-[#F8F4F0] p-5 text-left transition hover:border-[#1FAF9E] hover:bg-white"
              >
                <span className="text-sm font-semibold text-gray-900">
                  I do not have a business listed on Tellacity
                </span>
                <p className="mt-2 text-xs text-gray-600">
                  Add your business profile (category, website, and more). We&apos;ll email a code to
                  verify your domain.
                </p>
              </button>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 w-full text-sm font-medium text-gray-500 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        )}

        {step === "create_form" && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("choice");
                setError("");
                setDuplicateOverlay(null);
              }}
              className="mb-4 text-sm font-medium text-[#1FAF9E] hover:underline"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">Create your business</h2>
            <p className="mt-1 text-sm text-gray-600">
              Your signed-in work email domain must match this website so we can verify ownership.
              We&apos;ll email a code to <span className="font-medium">{userEmail}</span>.
            </p>
            {prefillSummary ? (
              <p className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm text-gray-800">
                <span className="font-medium text-emerald-900">From your signup profile:</span>{" "}
                {prefillSummary}
              </p>
            ) : null}

            <div className="mt-6 space-y-4">
              {categoryCatalogError ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                  {categoryCatalogError}
                </div>
              ) : null}
              {error ? (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </div>
              ) : null}

              <div>
                <label htmlFor="onb-create-name" className={createFormLabelClass}>
                  Business name <span className="text-red-500">*</span>
                </label>
                <input
                  id="onb-create-name"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className={createFormInputClass}
                  placeholder="e.g. Acme Ltd"
                  autoComplete="organization"
                />
              </div>

              <div>
                <span className={createFormLabelClass}>
                  Website <span className="text-red-500">*</span>
                </span>
                <div className="flex w-full overflow-hidden rounded-lg border border-gray-300 bg-white focus-within:border-[#1FAF9E] focus-within:ring-2 focus-within:ring-[#1FAF9E]/20">
                  <span className="shrink-0 border-r border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 select-none">
                    https://
                  </span>
                  <input
                    id="onb-create-website"
                    type="text"
                    value={createWebsiteHost}
                    onChange={(e) => setCreateWebsiteHost(stripWebsiteInput(e.target.value))}
                    className="min-w-0 flex-1 border-0 bg-transparent py-2.5 pr-3 pl-2 text-sm text-[#0E0E0E] outline-none focus:ring-0"
                    placeholder="example.com"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="url"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="onb-create-country" className={createFormLabelClass}>
                  Country code (2-letter) <span className="text-red-500">*</span>
                </label>
                <input
                  id="onb-create-country"
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 2))}
                  maxLength={2}
                  className={`${createFormInputClass} uppercase`}
                  placeholder="e.g. US, ZA, GB"
                />
              </div>

              <div>
                <label htmlFor="onb-create-group" className={createFormLabelClass}>
                  Primary Group <span className="text-red-500">*</span>
                </label>
                <select
                  id="onb-create-group"
                  value={primaryGroupSlug}
                  onChange={(e) => {
                    setPrimaryGroupSlug(e.target.value);
                    setCategorySlug("");
                  }}
                  className={createFormInputClass}
                  disabled={categoriesLoading}
                  required
                >
                  <option value="">Select a group</option>
                  {groups.map((g) => (
                    <option key={g.group_slug} value={g.group_slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="onb-create-category" className={createFormLabelClass}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="onb-create-category"
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className={createFormInputClass}
                  disabled={!primaryGroupSlug || categoriesLoading}
                  required
                >
                  <option value="">Select a category</option>
                  {filteredCreateCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="onb-create-city" className={createFormLabelClass}>
                  City <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="onb-create-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={createFormInputClass}
                  placeholder="e.g. Cape Town"
                />
              </div>

              <div>
                <label htmlFor="onb-create-street" className={createFormLabelClass}>
                  Street address <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="onb-create-street"
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className={createFormInputClass}
                  placeholder="e.g. 123 Main St"
                />
              </div>

              <div>
                <label htmlFor="onb-create-phone" className={createFormLabelClass}>
                  Phone number <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="onb-create-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={createFormInputClass}
                  placeholder="e.g. +1 234 567 8900"
                />
              </div>

              <div>
                <label htmlFor="onb-create-pubemail" className={createFormLabelClass}>
                  Public email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="onb-create-pubemail"
                  type="email"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  className={createFormInputClass}
                  placeholder="contact@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label htmlFor="onb-create-notes" className={createFormLabelClass}>
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="onb-create-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={createFormInputClass}
                  rows={3}
                  placeholder="Any extra details for our team"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => void submitCreateDraft()}
              disabled={loading || categoriesLoading || !!categoryCatalogError}
              className="mt-6 w-full rounded-lg bg-[#1FAF9E] py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Please wait…" : "Create this business"}
            </button>
          </div>
        )}

        {step === "create_otp" && createBusinessId && (
          <form onSubmit={handleVerifyCreateOtp} className="pt-2">
            <h2 className="text-xl font-semibold text-gray-900">Verify your email</h2>
            <p className="mt-2 text-sm text-gray-600">{info}</p>
            <p className="mt-2 text-xs text-gray-500">
              {"Didn't receive the email? Check your spam or junk folder."}
            </p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="mt-4 w-full rounded-lg border border-gray-300 py-3 text-center text-lg tracking-[0.35em]"
            />
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-[#1FAF9E] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify and finish"}
            </button>
            <button
              type="button"
              onClick={() => resendOtp(createBusinessId)}
              disabled={loading}
              className="mt-3 w-full text-sm font-semibold text-[#1FAF9E] hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </form>
        )}

        {step === "claim_search" && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setStep("choice");
                setError("");
                setClaimExpandedResults(null);
                setClaimExpandedLoading(false);
              }}
              className="mb-4 text-sm font-medium text-[#1FAF9E] hover:underline"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Find your business</h2>
            <p className="mt-1 text-sm text-gray-600">
              This is the same search as the Tellacity home page. Select your listing, then
              we&apos;ll check that it&apos;s still available to claim. Your work email must match
              the business website when you continue.
            </p>
            {claimSearchInitialQuery.trim() ? (
              <p className="mt-2 rounded-lg border border-emerald-100 bg-emerald-50/90 px-3 py-2 text-sm text-emerald-900">
                We pre-filled the search from your email domain , edit it if needed, then use{" "}
                <span className="font-semibold">FIND A BUSINESS</span> or pick a result below.
              </p>
            ) : null}
            <div className="relative mt-4 w-full max-w-3xl mx-auto">
              {claimEligibilityLoading ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70">
                  <p className="text-sm font-medium text-gray-600">Checking listing…</p>
                </div>
              ) : null}
              <BusinessSearchInput
                key={claimSearchKey}
                inputId="dashboard-claim-business-search"
                className="w-full"
                placeholder="Find businesses you can trust..."
                initialQuery={claimSearchInitialQuery}
                heroLayout
                heroButtonLabel="FIND A BUSINESS"
                hideSuggestMissing
                externalError={error || null}
                onSearchChange={() => {
                  setError("");
                  setClaimExpandedResults(null);
                }}
                onSelect={handleHeroBusinessSelect}
                onSubmitQuery={(query) => {
                  if (!query.trim()) return;
                  void loadExpandedClaimResults(query);
                }}
              />
              {claimExpandedLoading ? (
                <p className="mt-3 text-center text-sm text-gray-500">Loading more results…</p>
              ) : null}
              {claimExpandedResults !== null && !claimExpandedLoading ? (
                <div className="mt-3 max-h-96 overflow-y-auto rounded-2xl border border-gray-200 bg-white text-sm shadow-lg">
                  {claimExpandedResults.length === 0 ? (
                    <p className="px-4 py-3 text-gray-500">No businesses found.</p>
                  ) : (
                    <ul>
                      {claimExpandedResults.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="flex w-full flex-col items-start px-4 py-2 text-left hover:bg-gray-50"
                            onClick={() => void handleHeroBusinessSelect(item)}
                          >
                            <span className="text-sm font-semibold text-[#124541]">{item.name}</span>
                            {item.website ? (
                              <span className="mt-1 text-xs text-gray-500">{item.website}</span>
                            ) : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {step === "claim_confirm" && selectedHit && (
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setClaimSearchKey((k) => k + 1);
                setStep("claim_search");
                setSelectedHit(null);
                setClaimBusinessId(null);
                setError("");
                setClaimExpandedResults(null);
                setClaimExpandedLoading(false);
              }}
              className="mb-4 text-sm font-medium text-[#1FAF9E] hover:underline"
            >
              ← Back
            </button>
            <h2 className="text-xl font-semibold text-gray-900">Claim this business</h2>
            <div className="mt-4 rounded-xl border border-gray-200 bg-[#F8F4F0] p-4">
              <p className="font-semibold text-gray-900">{selectedHit.name}</p>
              {selectedHit.website ? (
                <p className="mt-1 text-sm text-gray-600">{selectedHit.website}</p>
              ) : null}
            </div>
            <p className="mt-4 text-sm text-gray-600">
              We&apos;ll send a code to <strong>{userEmail}</strong>. Your email domain must match
              this business website.
            </p>
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <button
              type="button"
              onClick={handleClaimThisBusiness}
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-[#1FAF9E] py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:opacity-50"
            >
              {loading ? "Please wait…" : "Claim this business"}
            </button>
          </div>
        )}

        {step === "claim_otp" && claimBusinessId && (
          <form onSubmit={handleVerifyClaimOtp} className="pt-2">
            <h2 className="text-xl font-semibold text-gray-900">Verify your email</h2>
            <p className="mt-2 text-sm text-gray-600">{info}</p>
            <p className="mt-2 text-xs text-gray-500">
              {"Didn't receive the email? Check your spam or junk folder."}
            </p>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              placeholder="000000"
              className="mt-4 w-full rounded-lg border border-gray-300 py-3 text-center text-lg tracking-[0.35em]"
            />
            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full rounded-lg bg-[#1FAF9E] py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {loading ? "Verifying…" : "Verify and claim"}
            </button>
            <button
              type="button"
              onClick={() => resendOtp(claimBusinessId)}
              disabled={loading}
              className="mt-3 w-full text-sm font-semibold text-[#1FAF9E] hover:underline disabled:opacity-50"
            >
              Resend code
            </button>
          </form>
        )}
      </div>
    </div>

    {duplicateOverlay ? (
      <div
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 py-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dup-overlay-title"
        onClick={() => !loading && setDuplicateOverlay(null)}
      >
        <div
          className="relative w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => !loading && setDuplicateOverlay(null)}
            className="absolute right-3 top-3 text-2xl leading-none text-gray-400 hover:text-gray-800"
            aria-label="Close"
          >
            ×
          </button>
          <h3 id="dup-overlay-title" className="pr-8 text-lg font-semibold text-[#0E0E0E]">
            Website already in use
          </h3>
          <p className="mt-3 text-sm text-gray-700">{duplicateOverlay.message}</p>
          <button
            type="button"
            disabled={loading}
            onClick={() => setDuplicateOverlay(null)}
            className="mt-3 w-full rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Close
          </button>
        </div>
      </div>
    ) : null}
    </>
  );
}
