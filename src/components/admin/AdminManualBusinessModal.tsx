"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import AdminBusinessSearchInput, {
  type AdminBusinessSearchResult,
} from "@/components/admin/AdminBusinessSearchInput";
import {
  filterCategoriesByPrimaryGroup,
  useCategoryGroupCatalog,
} from "@/hooks/useCategoryGroupCatalog";
import { COUNTRIES } from "@/lib/adminCountries";

type Props = {
  open: boolean;
  onClose: () => void;
};

type Mode = "create" | "claim";

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400";

const readOnlyClass =
  "w-full rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700";

function emptyFormState() {
  return {
    name: "",
    website: "",
    countryCode: "US",
    primaryGroupSlug: "",
    categorySlug: "",
    address: "",
    city: "",
    phone: "",
    publicEmail: "",
    ownerFirstName: "",
    ownerLastName: "",
    ownerEmail: "",
  };
}

export default function AdminManualBusinessModal({ open, onClose }: Props) {
  const router = useRouter();
  const { groups, categories, loading: categoriesLoading, loadError } =
    useCategoryGroupCatalog(open);

  const [mode, setMode] = useState<Mode>("create");
  const [selectedBusiness, setSelectedBusiness] = useState<AdminBusinessSearchResult | null>(
    null,
  );
  const [name, setName] = useState("");
  const [website, setWebsite] = useState("");
  const [countryCode, setCountryCode] = useState("US");
  const [primaryGroupSlug, setPrimaryGroupSlug] = useState("");
  const [categorySlug, setCategorySlug] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [phone, setPhone] = useState("");
  const [publicEmail, setPublicEmail] = useState("");
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCategories = useMemo(
    () => filterCategoriesByPrimaryGroup(categories, primaryGroupSlug),
    [categories, primaryGroupSlug],
  );

  const countryOptions = useMemo(() => {
    const codes = new Set(COUNTRIES.map((c) => c.code));
    if (countryCode && !codes.has(countryCode)) {
      return [{ code: countryCode, label: countryCode }, ...COUNTRIES];
    }
    return COUNTRIES;
  }, [countryCode]);

  const selectedIsClaimed = Boolean(selectedBusiness?.isClaimed);

  useEffect(() => {
    if (!open) return;
    const initial = emptyFormState();
    setMode("create");
    setSelectedBusiness(null);
    setName(initial.name);
    setWebsite(initial.website);
    setCountryCode(initial.countryCode);
    setPrimaryGroupSlug(initial.primaryGroupSlug);
    setCategorySlug(initial.categorySlug);
    setAddress(initial.address);
    setCity(initial.city);
    setPhone(initial.phone);
    setPublicEmail(initial.publicEmail);
    setOwnerFirstName(initial.ownerFirstName);
    setOwnerLastName(initial.ownerLastName);
    setOwnerEmail(initial.ownerEmail);
    setError(null);
    setSubmitting(false);
  }, [open]);

  if (!open) return null;

  const resetAndClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  const switchMode = (next: Mode) => {
    if (submitting) return;
    setMode(next);
    setError(null);
    if (next === "create") {
      setSelectedBusiness(null);
      const initial = emptyFormState();
      setName(initial.name);
      setWebsite(initial.website);
      setCountryCode(initial.countryCode);
      setPrimaryGroupSlug(initial.primaryGroupSlug);
      setCategorySlug(initial.categorySlug);
      setAddress(initial.address);
      setCity(initial.city);
      setPhone(initial.phone);
      setPublicEmail(initial.publicEmail);
    }
  };

  const populateFromBusiness = (business: AdminBusinessSearchResult) => {
    setSelectedBusiness(business);
    setName(business.name?.trim() ?? "");
    setWebsite(business.website_display ?? business.website ?? "");
    setCountryCode((business.country_code ?? "US").toUpperCase().slice(0, 2));
    setPrimaryGroupSlug(business.primary_group_slug?.trim() ?? "");
    setCategorySlug(business.category_slug?.trim() ?? "");
    setAddress(business.address?.trim() ?? "");
    setCity(business.city?.trim() ?? "");
    setPhone(business.phone?.trim() ?? "");
    setPublicEmail(business.email?.trim() ?? "");
    setError(null);
  };

  const clearSelectedBusiness = () => {
    setSelectedBusiness(null);
    const initial = emptyFormState();
    setName(initial.name);
    setWebsite(initial.website);
    setCountryCode(initial.countryCode);
    setPrimaryGroupSlug(initial.primaryGroupSlug);
    setCategorySlug(initial.categorySlug);
    setAddress(initial.address);
    setCity(initial.city);
    setPhone(initial.phone);
    setPublicEmail(initial.publicEmail);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === "claim") {
      if (!selectedBusiness?.id) {
        setError("Search and select an existing business first.");
        return;
      }
      if (selectedIsClaimed) {
        setError("This business is already claimed. Choose another listing or open it in admin.");
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === "claim" && selectedBusiness?.id) {
        const res = await fetch(
          `/api/admin/businesses/${encodeURIComponent(selectedBusiness.id)}/claim`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              ownerFirstName,
              ownerLastName,
              ownerEmail,
            }),
          },
        );
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
          businessId?: string;
          ownerCreated?: boolean;
          passwordSetupEmailSent?: boolean;
          emailError?: string;
        };
        if (!res.ok) {
          setError(data.error ?? "Could not claim business.");
          return;
        }
        const businessId = data.businessId ?? selectedBusiness.id;
        router.push(`/admin/businesses/${encodeURIComponent(businessId)}`);
        router.refresh();
        return;
      }

      const res = await fetch("/api/admin/businesses/create-and-claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name,
          website,
          countryCode,
          primaryGroupSlug,
          categorySlug,
          address,
          city,
          phone,
          publicEmail,
          ownerFirstName,
          ownerLastName,
          ownerEmail,
          claimImmediately: true,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        businessId?: string;
        ownerCreated?: boolean;
        passwordSetupEmailSent?: boolean;
        emailError?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not create business.");
        return;
      }
      if (data.businessId) {
        router.push(`/admin/businesses/${encodeURIComponent(data.businessId)}`);
        router.refresh();
      } else {
        router.refresh();
        resetAndClose();
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const businessFieldsReadOnly = mode === "claim";
  const fieldClass = businessFieldsReadOnly ? readOnlyClass : inputClass;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-create-business-title"
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-xl">
        <div className="border-b border-neutral-100 px-5 py-4">
          <h2 id="admin-create-business-title" className="text-base font-semibold text-neutral-900">
            Add business &amp; assign owner
          </h2>
          <p className="mt-1 text-sm text-neutral-600">
            Create a new listing or claim an existing one for an owner. Owner email does not need to
            match the website domain.
          </p>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6 px-5 py-4">
          {error ? (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
              {error}
            </p>
          ) : null}
          {loadError ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              {loadError}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => switchMode("create")}
              disabled={submitting}
              className={
                mode === "create"
                  ? "rounded-md border border-[#124541] bg-[#124541] px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              }
            >
              Create new business
            </button>
            <button
              type="button"
              onClick={() => switchMode("claim")}
              disabled={submitting}
              className={
                mode === "claim"
                  ? "rounded-md border border-[#124541] bg-[#124541] px-3 py-1.5 text-xs font-semibold text-white"
                  : "rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50"
              }
            >
              Claim existing business
            </button>
          </div>

          {mode === "claim" ? (
            <section className="space-y-3 rounded-lg border border-[#1FAF9E]/25 bg-[#F4FBF9] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-[#124541]">
                Find business
              </h3>
              <p className="text-xs text-neutral-600">
                Search the database by name or website, then assign an owner below.
              </p>
              {!selectedBusiness ? (
                <AdminBusinessSearchInput
                  onSelect={populateFromBusiness}
                  disabled={submitting}
                />
              ) : (
                <div className="rounded-md border border-neutral-200 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900">
                        {selectedBusiness.name?.trim() || "Business"}
                      </p>
                      <p className="mt-0.5 text-xs text-neutral-500">
                        {selectedBusiness.website_display ??
                          selectedBusiness.website ??
                          "No website"}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="shrink-0 text-xs font-medium text-[#124541] hover:underline"
                      onClick={clearSelectedBusiness}
                      disabled={submitting}
                    >
                      Change
                    </button>
                  </div>
                  {selectedIsClaimed ? (
                    <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      This business is already claimed. You cannot assign a new owner from here.
                    </p>
                  ) : (
                    <p className="mt-2 text-xs text-emerald-800">
                      Unclaimed — ready to assign an owner below.
                    </p>
                  )}
                </div>
              )}
            </section>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Business
              {businessFieldsReadOnly ? (
                <span className="ml-2 font-normal normal-case text-neutral-400">
                  (from selected listing)
                </span>
              ) : null}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Business name *
                </span>
                <input
                  className={fieldClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={mode === "create"}
                  readOnly={businessFieldsReadOnly}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Website *</span>
                <input
                  className={fieldClass}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="example.com"
                  required={mode === "create"}
                  readOnly={businessFieldsReadOnly}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Country *</span>
                <select
                  className={fieldClass}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  required={mode === "create"}
                  disabled={businessFieldsReadOnly}
                >
                  {countryOptions.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">City</span>
                <input
                  className={fieldClass}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  readOnly={businessFieldsReadOnly}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Street address
                </span>
                <input
                  className={fieldClass}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  readOnly={businessFieldsReadOnly}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Primary group *
                </span>
                <select
                  className={fieldClass}
                  value={primaryGroupSlug}
                  onChange={(e) => {
                    setPrimaryGroupSlug(e.target.value);
                    setCategorySlug("");
                  }}
                  required={mode === "create"}
                  disabled={businessFieldsReadOnly || categoriesLoading}
                >
                  <option value="">Select group</option>
                  {groups.map((g) => (
                    <option key={g.group_slug} value={g.group_slug}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Category *</span>
                <select
                  className={fieldClass}
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  required={mode === "create"}
                  disabled={businessFieldsReadOnly || !primaryGroupSlug || categoriesLoading}
                >
                  <option value="">Select category</option>
                  {filteredCategories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Phone</span>
                <input
                  className={fieldClass}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  readOnly={businessFieldsReadOnly}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Public email
                </span>
                <input
                  className={fieldClass}
                  type="email"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
                  readOnly={businessFieldsReadOnly}
                />
              </label>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Owner (claim)
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  First name *
                </span>
                <input
                  className={inputClass}
                  value={ownerFirstName}
                  onChange={(e) => setOwnerFirstName(e.target.value)}
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Last name</span>
                <input
                  className={inputClass}
                  value={ownerLastName}
                  onChange={(e) => setOwnerLastName(e.target.value)}
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Owner email *
                </span>
                <input
                  className={inputClass}
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  required
                />
                <span className="mt-1 block text-xs text-neutral-500">
                  Any email is allowed. A new account is created if this address is not registered.
                </span>
              </label>
            </div>
          </section>

          <div className="flex flex-wrap justify-end gap-2 border-t border-neutral-100 pt-4">
            <button
              type="button"
              className="rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:bg-neutral-50 disabled:opacity-50"
              onClick={resetAndClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[#124541] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3834] disabled:opacity-50"
              disabled={
                submitting ||
                categoriesLoading ||
                (mode === "claim" && (!selectedBusiness || selectedIsClaimed))
              }
            >
              {submitting
                ? mode === "claim"
                  ? "Claiming…"
                  : "Creating…"
                : mode === "claim"
                  ? "Claim for owner"
                  : "Create & claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
