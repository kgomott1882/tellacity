"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Group = { name: string; group_slug: string };
type Category = { name: string; slug: string; group_slug: string };

export default function SuggestBusinessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nameParam = searchParams.get("name") ?? "";

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

  const [groups, setGroups] = useState<Group[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName((prev) => (prev === "" && nameParam ? nameParam : prev));
  }, [nameParam]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setCategoriesLoading(true);
      const supabase = supabaseBrowser();

      const { data: groupsData, error: groupsErr } = await supabase
        .from("category_groups")
        .select("name, slug")
        .order("name");

      if (!mounted) return;
      if (groupsErr) {
        setGroups([]);
        setCategories([]);
        setCategoriesLoading(false);
        return;
      }

      const groupList = (groupsData ?? []).map((r: { name: string; slug: string }) => ({
        name: r.name,
        group_slug: r.slug,
      }));
      setGroups(groupList);

      const { data: categoriesData, error: catErr } = await supabase
        .from("categories")
        .select("name, slug, group")
        .order("name");

      if (!mounted) return;
      if (catErr) {
        setCategories([]);
        setCategoriesLoading(false);
        return;
      }

      const categoryList = (categoriesData ?? []).map((r: { name: string; slug: string; group: string | null }) => ({
        name: r.name,
        slug: r.slug,
        group_slug: r.group ?? "",
      }));
      setCategories(categoryList);
      setCategoriesLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const filteredCategories = primaryGroupSlug
    ? categories.filter((c) => c.group_slug === primaryGroupSlug)
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const trimmedName = name.trim();
    const trimmedWebsite = website.trim();
    const trimmedCountry = countryCode.trim().toUpperCase().slice(0, 2);
    const trimmedCategory = categorySlug.trim();
    const trimmedGroup = primaryGroupSlug.trim();

    if (!trimmedName || !trimmedWebsite || !trimmedCountry || !trimmedCategory || !trimmedGroup) {
      setError("Please fill in all required fields: Business Name, Website, Country Code, Category, and Primary Group.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/business/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          website: trimmedWebsite,
          country_code: trimmedCountry,
          category_slug: trimmedCategory,
          primary_group_slug: trimmedGroup,
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

  const inputClass =
    "w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20";
  const labelClass = "block text-sm font-medium text-[#0E0E0E] mb-1.5";

  return (
    <main className="min-h-screen bg-[#F8F4F0]">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Suggest a missing business</h1>
        <p className="mt-2 text-sm text-gray-600">
          Can&apos;t find your business? Submit it for review. We&apos;ll add it once verified.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          )}

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

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-full bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting…" : "List This Business"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
