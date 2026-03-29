"use client";

import { useEffect, useState } from "react";
import {
  filterCategoriesByPrimaryGroup,
  useCategoryGroupCatalog,
} from "@/hooks/useCategoryGroupCatalog";

export type PostSignupBusinessDraft = {
  companyName: string;
  website: string;
  country: string;
  phoneNumber?: string;
  workEmail: string;
};

type Props = {
  open: boolean;
  draft: PostSignupBusinessDraft;
  onGoDashboard: () => void;
  /** Close without navigating (e.g. back to post-verify panel). */
  onDismiss?: () => void;
};

const inputClass =
  "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20";
const labelClass = "block text-sm font-medium text-[#0E0E0E] mb-1.5";

export default function PostSignupCreateBusinessModal({
  open,
  draft,
  onGoDashboard,
  onDismiss,
}: Props) {
  const [step, setStep] = useState<"form" | "success">("form");
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

  const {
    groups,
    categories,
    loading: categoriesLoading,
    loadError: categoryCatalogError,
  } = useCategoryGroupCatalog(open);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setStep("form");
    setError("");
    setName(draft.companyName.trim());
    setWebsite(draft.website.trim());
    setCountryCode(draft.country.trim().toUpperCase().slice(0, 2));
    setPhone(draft.phoneNumber?.trim() ?? "");
    setPublicEmail(draft.workEmail.trim());
    setPrimaryGroupSlug("");
    setCategorySlug("");
    setCity("");
    setStreetAddress("");
    setNotes("");
  }, [open, draft]);

  const filteredCategories = filterCategoriesByPrimaryGroup(
    categories,
    primaryGroupSlug
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedWebsite = website.trim();
    const trimmedCountry = countryCode.trim().toUpperCase().slice(0, 2);
    const trimmedCategory = categorySlug.trim();
    const trimmedGroup = primaryGroupSlug.trim();

    if (!trimmedName || !trimmedWebsite || !trimmedCountry || !trimmedCategory || !trimmedGroup) {
      setError(
        "Please fill in all required fields: Business Name, Website, Country Code, Category, and Primary Group."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/business/signup/complete-profile", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          website: trimmedWebsite,
          country_code: trimmedCountry,
          category_slug: trimmedCategory,
          primary_group_slug: trimmedGroup,
          city: city.trim() || null,
          street_address: streetAddress.trim() || null,
          phone: phone.trim() || null,
          public_email: publicEmail.trim() || null,
          notes: notes.trim() || null,
        }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : "Something went wrong. Please try again."
        );
        return;
      }

      setStep("success");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 px-4">
      <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <button
          type="button"
          onClick={() => (onDismiss ? onDismiss() : onGoDashboard())}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          ×
        </button>

        {step === "success" ? (
          <div className="space-y-4 py-4 text-center">
            <h2 className="text-xl font-semibold text-[#0E0E0E]">
              Your business profile has been created.
            </h2>
            <button
              type="button"
              onClick={onGoDashboard}
              className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
            >
              Go to dashboard
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-[#0E0E0E]">Create your business profile</h2>
            <p className="mt-1 text-sm text-gray-600">
              Add category details so customers can find you on Tellacity.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
                <label htmlFor="ps-name" className={labelClass}>
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="ps-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="ps-website" className={labelClass}>
                  Website <span className="text-red-500">*</span>
                </label>
                <input
                  id="ps-website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label htmlFor="ps-country" className={labelClass}>
                  Country Code (2-letter) <span className="text-red-500">*</span>
                </label>
                <input
                  id="ps-country"
                  type="text"
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value.toUpperCase().slice(0, 2))}
                  className={inputClass}
                  maxLength={2}
                  required
                />
              </div>

              <div>
                <label htmlFor="ps-group" className={labelClass}>
                  Primary Group <span className="text-red-500">*</span>
                </label>
                <select
                  id="ps-group"
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
                <label htmlFor="ps-cat" className={labelClass}>
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  id="ps-cat"
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
                <label htmlFor="ps-city" className={labelClass}>
                  City <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="ps-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="ps-street" className={labelClass}>
                  Street Address <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="ps-street"
                  type="text"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="ps-phone" className={labelClass}>
                  Phone <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="ps-phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="ps-pubemail" className={labelClass}>
                  Public email <span className="text-gray-400">(optional)</span>
                </label>
                <input
                  id="ps-pubemail"
                  type="email"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label htmlFor="ps-notes" className={labelClass}>
                  Notes <span className="text-gray-400">(optional)</span>
                </label>
                <textarea
                  id="ps-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className={inputClass}
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || categoriesLoading || !!categoryCatalogError}
                className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {submitting ? "Creating profile…" : "Create business profile"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
