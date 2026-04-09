"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  filterCategoriesByPrimaryGroup,
  useCategoryGroupCatalog,
} from "@/hooks/useCategoryGroupCatalog";

type Step = 1 | 2 | 3;

export default function SuggestBusinessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameParam = searchParams.get("name") ?? "";

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [countryCode, setCountryCode] = useState("");
  const [primaryGroupSlug, setPrimaryGroupSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [city, setCity] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [suggesterName, setSuggesterName] = useState("");
  const [suggesterEmail, setSuggesterEmail] = useState("");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [otpCode, setOtpCode] = useState("");

  const {
    groups,
    categories,
    loading: categoriesLoading,
    loadError: categoryCatalogError,
  } = useCategoryGroupCatalog(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName((prev) => (prev === "" && nameParam ? nameParam : prev));
  }, [nameParam]);

  const filteredCategories = filterCategoriesByPrimaryGroup(categories, primaryGroupSlug);

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20";
  const labelClass = "block text-sm font-medium text-[#0E0E0E] mb-1.5";

  const businessPayload = () => ({
    name: name.trim(),
    website: website.trim(),
    country_code: countryCode.trim().toUpperCase().slice(0, 2),
    category_slug: categorySlug.trim(),
    primary_group_slug: primaryGroupSlug.trim(),
    city: city.trim() || null,
    street_address: streetAddress.trim() || null,
    phone: phone.trim() || null,
    public_email: publicEmail.trim() || null,
    notes: notes.trim() || null,
  });

  const validateBusinessStep = (): boolean => {
    const p = businessPayload();
    if (
      !p.name ||
      !p.website ||
      !p.country_code ||
      p.country_code.length !== 2 ||
      !p.category_slug ||
      !p.primary_group_slug
    ) {
      setError(
        "Please fill in all required fields: Business Name, Website, Country Code, Category, and Primary Group."
      );
      return false;
    }
    setError("");
    return true;
  };

  const goToVerifierStep = () => {
    if (!validateBusinessStep()) return;
    setStep(2);
  };

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!validateBusinessStep()) return;

    const sn = suggesterName.trim();
    const se = suggesterEmail.trim().toLowerCase();
    if (!sn) {
      setError("Please enter your name.");
      return;
    }
    if (!se || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(se)) {
      setError("Please enter a valid email address.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/business/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "send_code",
          suggester_name: sn,
          suggester_email: se,
          ...businessPayload(),
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      if (data.exists === true && data.slug) {
        router.push(`/b/${data.slug}`);
        return;
      }

      if (data.code_sent === true && typeof data.request_id === "string") {
        setRequestId(data.request_id);
        setOtpCode("");
        setStep(3);
        setSubmitting(false);
        return;
      }

      setError("Unexpected response. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = otpCode.replace(/\D/g, "").slice(0, 6);
    if (!requestId) {
      setError("Verification session missing. Go back and send the code again.");
      return;
    }
    if (code.length !== 6) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/business/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phase: "confirm",
          request_id: requestId,
          code,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }

      if (data.exists === true && data.slug) {
        router.push(`/b/${data.slug}`);
        return;
      }
      if (data.created === true && data.slug) {
        router.push(`/b/${data.slug}?new=1`);
        return;
      }

      setError("Unexpected response. Please try again.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const cardClass =
    "mt-8 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm";

  return (
    <main className="min-h-screen bg-[#F8F4F0]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Suggest a missing business</h1>
        <p className="mt-2 text-sm text-gray-600">
          Can&apos;t find your business? Submit it for review. We&apos;ll add it once verified.
        </p>

        <p className="mt-4 text-xs text-gray-500">
          Step {step} of 3:{" "}
          {step === 1
            ? "Business details"
            : step === 2
              ? "Your contact"
              : "Email verification"}
        </p>

        {categoryCatalogError ? (
          <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {categoryCatalogError}
          </div>
        ) : null}
        {error ? (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {step === 1 ? (
          <div className={cardClass}>
            <div>
              <label htmlFor="name" className={labelClass}>
                Business Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Acme Ltd"
                required
              />
            </div>

            <div>
              <label htmlFor="website" className={labelClass}>
                Website <span className="text-red-500">*</span>
              </label>
              <input
                id="website"
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                className={inputClass}
                placeholder="https://example.com"
                required
              />
            </div>

            <div>
              <label htmlFor="country_code" className={labelClass}>
                Country Code (2-letter) <span className="text-red-500">*</span>
              </label>
              <input
                id="country_code"
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                className={inputClass}
                placeholder="e.g. US, ZA, GB"
                maxLength={2}
                required
              />
            </div>

            <div>
              <label htmlFor="primary_group" className={labelClass}>
                Primary Group <span className="text-red-500">*</span>
              </label>
              <select
                id="primary_group"
                value={primaryGroupSlug}
                onChange={(e) => {
                  setPrimaryGroupSlug(e.target.value);
                  setCategorySlug("");
                }}
                className={inputClass}
                required
                disabled={categoriesLoading}
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
              <label htmlFor="category" className={labelClass}>
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                value={categorySlug}
                onChange={(e) => setCategorySlug(e.target.value)}
                className={inputClass}
                required
                disabled={!primaryGroupSlug || categoriesLoading}
              >
                <option value="">Select a category</option>
                {filteredCategories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="city" className={labelClass}>
                City <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={inputClass}
                placeholder="e.g. Cape Town"
              />
            </div>

            <div>
              <label htmlFor="street_address" className={labelClass}>
                Street Address <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="street_address"
                type="text"
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                className={inputClass}
                placeholder="e.g. 123 Main St"
              />
            </div>

            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone Number <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={inputClass}
                placeholder="e.g. +1 234 567 8900"
              />
            </div>

            <div>
              <label htmlFor="public_email" className={labelClass}>
                Public Email <span className="text-gray-400">(optional)</span>
              </label>
              <input
                id="public_email"
                type="email"
                value={publicEmail}
                onChange={(e) => setPublicEmail(e.target.value)}
                className={inputClass}
                placeholder="contact@example.com"
              />
            </div>

            <div>
              <label htmlFor="notes" className={labelClass}>
                Notes <span className="text-gray-400">(optional)</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className={inputClass}
                placeholder="Any extra details for our team"
                rows={3}
              />
            </div>

            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={goToVerifierStep}
                disabled={categoriesLoading || !!categoryCatalogError}
                className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:opacity-60 disabled:cursor-not-allowed sm:w-auto"
              >
                List This Business
              </button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <form onSubmit={handleSendCode} className={cardClass}>
            <p className="text-sm text-gray-600">
              We need your name and email to send a verification code. Your listing is only created after you
              confirm the code.
            </p>
            <div>
              <label htmlFor="suggester_name" className={labelClass}>
                Your name <span className="text-red-500">*</span>
              </label>
              <input
                id="suggester_name"
                type="text"
                value={suggesterName}
                onChange={(e) => setSuggesterName(e.target.value)}
                className={inputClass}
                placeholder="Jane Doe"
                autoComplete="name"
                required
              />
            </div>
            <div>
              <label htmlFor="suggester_email" className={labelClass}>
                Your email <span className="text-red-500">*</span>
              </label>
              <input
                id="suggester_email"
                type="email"
                value={suggesterEmail}
                onChange={(e) => setSuggesterEmail(e.target.value)}
                className={inputClass}
                placeholder="you@company.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="order-2 w-full rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-[#0E0E0E] hover:bg-gray-50 sm:order-1 sm:w-auto"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="order-1 w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:opacity-60 sm:order-2 sm:w-auto"
              >
                {submitting ? "Sending…" : "Send verification code"}
              </button>
            </div>
          </form>
        ) : null}

        {step === 3 ? (
          <form onSubmit={handleConfirmCode} className={cardClass}>
            <p className="text-sm text-gray-600">
              We sent a 6-digit code to <strong>{suggesterEmail.trim()}</strong>. Enter it below to publish your
              listing.
            </p>
            <p className="mt-3 text-sm text-gray-600">
              {"Didn't receive the email? Check your spam or junk folder."}
            </p>
            <div>
              <label htmlFor="otp" className={labelClass}>
                Verification code <span className="text-red-500">*</span>
              </label>
              <input
                id="otp"
                type="text"
                inputMode="numeric"
                pattern="\d*"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className={`${inputClass} tracking-[0.35em] text-center text-lg font-medium`}
                placeholder="000000"
                autoComplete="one-time-code"
                required
              />
            </div>
            <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep(2);
                  setOtpCode("");
                  setError("");
                }}
                className="order-2 w-full rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-[#0E0E0E] hover:bg-gray-50 sm:order-1 sm:w-auto"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={submitting || otpCode.replace(/\D/g, "").length !== 6}
                className="order-1 w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:opacity-60 sm:order-2 sm:w-auto"
              >
                {submitting ? "Submitting…" : "Confirm and list business"}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </main>
  );
}
