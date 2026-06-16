"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  filterCategoriesByPrimaryGroup,
  useCategoryGroupCatalog,
} from "@/hooks/useCategoryGroupCatalog";
import { COUNTRIES } from "@/lib/adminCountries";

type Props = {
  open: boolean;
  onClose: () => void;
};

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400";

export default function AdminManualBusinessModal({ open, onClose }: Props) {
  const router = useRouter();
  const { groups, categories, loading: categoriesLoading, loadError } =
    useCategoryGroupCatalog(open);

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

  if (!open) return null;

  const resetAndClose = () => {
    if (submitting) return;
    setError(null);
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
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
            Creates an active listing and claims it for the owner. Owner email does not need to match
            the website domain.
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

          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Business
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Business name *
                </span>
                <input
                  className={inputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Website *</span>
                <input
                  className={inputClass}
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="example.com"
                  required
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">Country *</span>
                <select
                  className={inputClass}
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  required
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">City</span>
                <input className={inputClass} value={city} onChange={(e) => setCity(e.target.value)} />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Street address
                </span>
                <input
                  className={inputClass}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Primary group *
                </span>
                <select
                  className={inputClass}
                  value={primaryGroupSlug}
                  onChange={(e) => {
                    setPrimaryGroupSlug(e.target.value);
                    setCategorySlug("");
                  }}
                  required
                  disabled={categoriesLoading}
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
                  className={inputClass}
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  required
                  disabled={!primaryGroupSlug || categoriesLoading}
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
                <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-neutral-700">
                  Public email
                </span>
                <input
                  className={inputClass}
                  type="email"
                  value={publicEmail}
                  onChange={(e) => setPublicEmail(e.target.value)}
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
              disabled={submitting || categoriesLoading}
            >
              {submitting ? "Creating…" : "Create & claim"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
