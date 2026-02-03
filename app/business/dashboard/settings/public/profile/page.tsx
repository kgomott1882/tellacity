"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Upload, ChevronDown, ChevronUp } from "lucide-react";
import { useBusinessContext } from "../../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { normalizeLogoUrl } from "@/lib/logo";

const COUNTRY_OPTIONS = [
  "South Africa",
  "United States",
  "United Kingdom",
  "Australia",
  "Canada",
  "Germany",
  "France",
  "Netherlands",
  "Ireland",
  "New Zealand",
  "India",
  "Nigeria",
  "Kenya",
  "Ghana",
  "Zimbabwe",
  "Botswana",
  "Namibia",
  "Other",
];

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  ZA: "South Africa",
  US: "United States",
  GB: "United Kingdom",
  AU: "Australia",
  CA: "Canada",
  DE: "Germany",
  FR: "France",
  NL: "Netherlands",
  IE: "Ireland",
  NZ: "New Zealand",
  IN: "India",
  NG: "Nigeria",
  KE: "Kenya",
  GH: "Ghana",
  ZW: "Zimbabwe",
  BW: "Botswana",
  NA: "Namibia",
};

export default function PublicProfileSetupPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    about: true,
    description: true,
    contact: true,
  });

  const [form, setForm] = useState({
    name: "",
    website: "",
    description: "",
    address: "",
    city: "",
    postcode: "",
    country: "South Africa",
    category_slug: "",
    email: "",
    phone: "",
  });
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string | null>(null); // local object URL for instant preview
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const businessId = selectedBusiness?.id ?? null;
  const publicProfileHref = selectedBusiness?.slug ? `/b/${selectedBusiness.slug}` : null;

  // Trustpilot-style: pre-fill name and website from sidebar so form shows data immediately
  useEffect(() => {
    if (!selectedBusiness) return;
    const raw = selectedBusiness.website?.trim() || "";
    const displayUrl = raw
      ? raw.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0]?.trim() || raw
      : "";
    setForm((prev) => ({
      ...prev,
      name: selectedBusiness.name ?? prev.name,
      website: displayUrl || prev.website,
    }));
    setLoading(false);
  }, [selectedBusiness?.id, selectedBusiness?.name, selectedBusiness?.website]);

  // Fetch profile from Supabase. No postcode – we never select/save it. Try address, city, contacts.
  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      setFetchError(null);
      setLogoUrl(null);
      return;
    }
    setFetchError(null);
    let mounted = true;
    (async () => {
      // 1) Try: name, website, website_display, description, address, city, country_code, phone, email, logo_url
      let selectCols = "id, name, website, website_display, description, address, city, country_code, phone, email, logo_url";
      let { data, error } = await supabaseBrowser
        .from("businesses")
        .select(selectCols)
        .eq("id", businessId)
        .single();

      const colMissing =
        error &&
        (String((error as { code?: string | number }).code) === "PGRST204" ||
          String((error as { code?: string | number }).code) === "42703" ||
          (error as { message?: string }).message?.toLowerCase().includes("does not exist"));

      if (colMissing) {
        // 2) Fallback: only columns that almost always exist (omit website_display if missing)
        selectCols = "id, name, website, description, address, city, country_code";
        const fallback = await supabaseBrowser
          .from("businesses")
          .select(selectCols)
          .eq("id", businessId)
          .single();
        data = fallback.data;
        error = fallback.error;
      }

      if (!mounted) return;
      if (error || !data) {
        setFetchError(
          error?.message ?? "Could not load profile. Make sure you're signed in and this business is linked to your account."
        );
        setLoading(false);
        return;
      }
      const row = data as Record<string, unknown>;
      const code = (row.country_code as string) ?? "ZA";
      const countryName =
        code.length === 2 ? COUNTRY_CODE_TO_NAME[code] ?? "South Africa" : code;
      const cityVal = (row.city as string) ?? "";
      const cityDisplay =
        cityVal && cityVal !== "[unknown]" ? cityVal : "";
      // Prefer website_display (clean domain) so form matches what we use for logo resolution everywhere
      const websiteVal = ((row.website_display as string) ?? (row.website as string) ?? "").toString().trim();
      setForm((prev) => ({
        ...prev,
        name: (row.name as string) ?? "",
        website: websiteVal,
        description: (row.description as string) ?? "",
        address: (row.address as string) ?? "",
        city: cityDisplay,
        postcode: "",
        country: countryName,
        category_slug: (row.category_slug as string) ?? prev.category_slug,
        phone: (row.phone as string) ?? "",
        email: (row.email as string) ?? "",
      }));
      const logo = (row.logo_url as string) ?? null;
      if (logo) setLogoUrl(normalizeLogoUrl(logo) ?? null);
      setFetchError(null);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [businessId, refreshKey]);

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const countryToCode: Record<string, string> = {
    "South Africa": "ZA",
    "United States": "US",
    "United Kingdom": "GB",
    Australia: "AU",
    Canada: "CA",
    Germany: "DE",
    France: "FR",
    Netherlands: "NL",
    Ireland: "IE",
    "New Zealand": "NZ",
    India: "IN",
    Nigeria: "NG",
    Kenya: "KE",
    Ghana: "GH",
    Zimbabwe: "ZW",
    Botswana: "BW",
    Namibia: "NA",
    Other: "ZA",
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setMessage(null);
    setSaving(true);
    const websiteNorm = form.website.trim()
      ? form.website.trim().startsWith("http")
        ? form.website.trim()
        : `https://${form.website.trim()}`
      : null;
    const displayDomain =
      websiteNorm != null
        ? websiteNorm.replace(/^https?:\/\//i, "").replace(/^www\./i, "").split("/")[0]?.trim() ?? ""
        : "";
    // Only store clean domain in website_display (never full URL) so logo resolution and RPCs work everywhere
    const websiteDisplayValue = (displayDomain && displayDomain.trim()) ? displayDomain.trim() : null;
    const countryCode = countryToCode[form.country] ?? "ZA";
    // Never send postcode – ignore it. Send name, website, website_display, address, city, country, description, phone, email.
    const payload: Record<string, string | null> = {
      name: form.name.trim() || null,
      website: websiteNorm,
      website_display: websiteDisplayValue,
      address: form.address.trim() || null,
      city: form.city.trim() || null,
      country_code: countryCode,
      description: form.description.trim() || null,
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
    };
    let updateResult = await supabaseBrowser
      .from("businesses")
      .update(payload)
      .eq("id", businessId)
      .select("id")
      .single();
    let error = updateResult.error;
    let updatedRow = updateResult.data;
    const colMissing =
      error &&
      (String((error as { code?: string | number }).code) === "PGRST204" ||
        String((error as { code?: string | number }).code) === "42703" ||
        (error as { message?: string }).message?.toLowerCase().includes("does not exist"));
    if (colMissing) {
      // Fallback if email/phone columns don't exist yet (migration not run)
      const minimalPayload: Record<string, string | null> = {
        name: form.name.trim() || null,
        website: websiteNorm,
        website_display: websiteDisplayValue,
        address: form.address.trim() || null,
        city: form.city.trim() || null,
        country_code: countryCode,
        description: form.description.trim() || null,
      };
      const res = await supabaseBrowser
        .from("businesses")
        .update(minimalPayload)
        .eq("id", businessId)
        .select("id")
        .single();
      error = res.error;
      updatedRow = res.data;
      setSaving(false);
      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }
      setMessage({
        type: "error",
        text: "Email and phone could not be saved. Run the database migration 'business_profile_columns' (adds email, phone to businesses) and try again.",
      });
      return;
    }
    setSaving(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    if (!updatedRow) {
      setMessage({
        type: "error",
        text: "Save did not apply. Make sure this business is linked to your account (business owners / owner_id).",
      });
      return;
    }
    setMessage({ type: "success", text: "Saved and published." });
  };

  const handleCancel = () => {
    router.push("/business/dashboard");
  };

  const LOGO_BUCKET = "business_logos";
  const LOGO_UPLOAD_TIMEOUT_MS = 20000;

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Please choose a JPG or PNG image." });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: "error", text: "Logo should be under 2MB." });
      return;
    }
    setMessage(null);
    if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl);
    const objectUrl = URL.createObjectURL(file);
    setLogoPreviewUrl(objectUrl);
    setLogoUploading(true);
    if (fileInputRef.current) fileInputRef.current.value = "";

    const ext = file.name.split(".").pop()?.toLowerCase() || "png";
    const path = `${businessId}/${Date.now()}.${ext}`;

    const runUpload = async (): Promise<{ ok: true; publicUrl: string } | { ok: false; error: string }> => {
      const { error: uploadError } = await supabase.storage
        .from(LOGO_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type });

      if (uploadError) {
        const msg = uploadError.message ?? "";
        const isBucketMissing =
          msg.toLowerCase().includes("bucket not found") ||
          msg.toLowerCase().includes("bucket does not exist") ||
          (uploadError as { statusCode?: number }).statusCode === 404;
        if (isBucketMissing) {
          return {
            ok: false,
            error:
              "Logo storage bucket is missing. In Supabase Dashboard go to Storage → New bucket → Name: business_logos → Public: ON → Create bucket. Then try uploading again.",
          };
        }
        return { ok: false, error: msg };
      }
      const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
      const publicUrl = data?.publicUrl ?? "";
      const { error: updateError } = await supabase
        .from("businesses")
        .update({ logo_url: publicUrl })
        .eq("id", businessId)
        .select("id")
        .single();
      if (updateError || !publicUrl) {
        return { ok: false, error: updateError?.message ?? "Could not save logo URL." };
      }
      return { ok: true, publicUrl };
    };

    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("Upload timed out. Check your connection and try again.")), LOGO_UPLOAD_TIMEOUT_MS);
    });

    try {
      const result = await Promise.race([runUpload(), timeoutPromise]);
      if (result.ok) {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
        setLogoPreviewUrl(null);
        const finalUrl = normalizeLogoUrl(result.publicUrl) ?? result.publicUrl;
        setLogoUrl(finalUrl ? `${finalUrl}${finalUrl.includes("?") ? "&" : "?"}t=${Date.now()}` : null);
        setMessage({ type: "success", text: "Logo updated. It appears on your public profile and everywhere else—refresh the public page to see it." });
      } else {
        setMessage({ type: "error", text: result.error });
        setLogoPreviewUrl(null);
        if (objectUrl) URL.revokeObjectURL(objectUrl);
      }
    } catch (err: unknown) {
      setMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Upload failed.",
      });
      setLogoPreviewUrl(null);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    } finally {
      setLogoUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const showSelectPrompt = !selectedBusiness;
  const showSkeleton = selectedBusiness && loading && !selectedBusiness?.name;
  const showForm = selectedBusiness && (!loading || !!selectedBusiness?.name);

  return (
    <>
      {showSelectPrompt && (
        <div>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Profile page</h1>
          <p className="mt-2 text-sm text-gray-600">Select a business from the sidebar to edit its public profile.</p>
          <Link
            href="/business/dashboard"
            className="mt-4 inline-block text-sm font-medium text-[#124541] hover:underline"
          >
            Back to dashboard
          </Link>
        </div>
      )}
      {showSkeleton && (
        <div>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Profile page</h1>
          <div className="mt-6 h-8 w-48 rounded bg-gray-100 animate-pulse" />
          <div className="mt-4 h-32 rounded bg-gray-100 animate-pulse" />
        </div>
      )}
      {showForm && (
    <div className="max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Profile page</h1>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            title="Reload profile from Supabase"
          >
            Refresh
          </button>
          <a
            href={publicProfileHref ?? "#"}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
              publicProfileHref
                ? "border-[#124541] text-[#124541] hover:bg-[#124541]/10"
                : "cursor-not-allowed border-gray-300 text-gray-400"
            }`}
          >
            <ExternalLink size={16} />
            Go to public profile
          </a>
        </div>
      </div>

      <p className="mt-2 text-sm text-gray-600">
        The details you provide are publicly shown on your Tellacity profile.
      </p>

      {fetchError && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <span>{fetchError}</span>
          <button
            type="button"
            onClick={() => { setFetchError(null); setRefreshKey((k) => k + 1); }}
            className="shrink-0 rounded-md border border-amber-300 bg-white px-3 py-1.5 font-medium text-amber-800 hover:bg-amber-100"
          >
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="mt-8 space-y-6">
        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Business information / About your business */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("about")}
            className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-[#0E0E0E] hover:bg-gray-50"
          >
            <span>About your business</span>
            {openSections.about ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {openSections.about && (
            <div className="border-t border-gray-200 px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                Add your logo, company name, and domain to your Tellacity profile.
              </p>
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">Company name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  placeholder="e.g. Viem"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">Company domain</label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  placeholder="https://example.com"
                />
                <p className="mt-1 text-xs text-gray-500">Your website URL as shown on your public profile.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">Logo</label>
                <div className="mt-2 flex flex-wrap items-center gap-4">
                  {/* Same frame as public business page; this logo is used everywhere (public profile, categories, etc.) */}
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#FCF7F6]">
                    {(logoPreviewUrl || logoUrl) ? (
                      <img
                        key={logoPreviewUrl || logoUrl || "logo"}
                        src={logoPreviewUrl || logoUrl || ""}
                        alt="Company logo"
                        className="h-full w-full object-contain"
                        onError={() => {
                          if (!logoPreviewUrl) setLogoUrl(null);
                        }}
                      />
                    ) : logoUploading ? (
                      <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                        <svg className="h-8 w-8 animate-spin text-[#124541]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                        </svg>
                        <span>Uploading…</span>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleLogoChange}
                      className="hidden"
                      aria-label="Upload logo"
                    />
                    <button
                      type="button"
                      disabled={logoUploading}
                      onClick={() => {
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                          fileInputRef.current.click();
                        }
                      }}
                      className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                    >
                      <Upload size={20} className="shrink-0 text-gray-400" />
                      {logoUploading ? "Uploading…" : logoUrl || logoPreviewUrl ? "Change logo" : "Upload logo (JPG or PNG, max 2MB)"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Company description */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("description")}
            className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-[#0E0E0E] hover:bg-gray-50"
          >
            <span>Company description</span>
            {openSections.description ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {openSections.description && (
            <div className="border-t border-gray-200 px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">
                Tell your customers what makes you unique. A longer description helps with search.
              </p>
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">Describe your company</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={5}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  placeholder="Tell your customers what makes you unique."
                />
                <p className="mt-1 text-xs text-gray-500">Word count: {form.description.trim().split(/\s+/).filter(Boolean).length}</p>
              </div>
            </div>
          )}
        </div>

        {/* Contact info */}
        <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("contact")}
            className="w-full flex items-center justify-between px-6 py-4 text-left font-semibold text-[#0E0E0E] hover:bg-gray-50"
          >
            <span>Contact info</span>
            {openSections.contact ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
          {openSections.contact && (
            <div className="border-t border-gray-200 px-6 py-5 space-y-4">
              <p className="text-sm text-gray-600">Tell your customers how to get in touch.</p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-[#0E0E0E]">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E0E0E]">Phone number</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                    placeholder="+27 11 123 4567"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">Address</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  placeholder="Street address"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-sm font-medium text-[#0E0E0E]">Postcode / ZIP</label>
                  <input
                    type="text"
                    value={form.postcode}
                    onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                    placeholder="Optional"
                  />
                  <p className="mt-1 text-xs text-gray-500">Optional; not stored in database.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E0E0E]">City</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#0E0E0E]">Country</label>
                  <select
                    value={form.country}
                    onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  >
                    {COUNTRY_OPTIONS.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-[#2fb2a8] px-6 py-3 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving…" : "Save and publish"}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          {publicProfileHref && (
            <a
              href={publicProfileHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-[#124541] px-6 py-3 text-sm font-semibold text-[#124541] hover:bg-[#124541]/10"
            >
              <ExternalLink size={16} />
              Go to public profile
            </a>
          )}
        </div>
      </form>
    </div>
      )}
    </>
  );
}
