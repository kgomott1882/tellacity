"use client";

/**
 * Business Profile - consolidated settings page.
 * Sections: Basic Info · Description · Contact Info · Categories
 */

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { ExternalLink, Upload } from "lucide-react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";
import PageLoadingOverlay from "../../_components/PageLoadingOverlay";
import { getActiveCountry } from "@/lib/getActiveCountry";
import { normalizeLogoUrl } from "@/lib/logo";

// ─── Constants ────────────────────────────────────────────────────────────────

const COUNTRY_OPTIONS = [
  "South Africa","United States","United Kingdom","Australia","Canada",
  "Germany","France","Netherlands","Ireland","New Zealand",
  "India","Nigeria","Kenya","Ghana","Zimbabwe","Botswana","Namibia","Other",
];

const COUNTRY_CODE_TO_NAME: Record<string, string> = {
  ZA:"South Africa",US:"United States",GB:"United Kingdom",AU:"Australia",
  CA:"Canada",DE:"Germany",FR:"France",NL:"Netherlands",IE:"Ireland",
  NZ:"New Zealand",IN:"India",NG:"Nigeria",KE:"Kenya",GH:"Ghana",
  ZW:"Zimbabwe",BW:"Botswana",NA:"Namibia",
};

const COUNTRY_TO_CODE: Record<string, string> = {
  "South Africa":"ZA","United States":"US","United Kingdom":"GB","Australia":"AU",
  "Canada":"CA","Germany":"DE","France":"FR","Netherlands":"NL","Ireland":"IE",
  "New Zealand":"NZ","India":"IN","Nigeria":"NG","Kenya":"KE","Ghana":"GH",
  "Zimbabwe":"ZW","Botswana":"BW","Namibia":"NA",
};

/** Do not map "Other" or unknown labels to ZA — preserves DB ISO code (e.g. US) when the dropdown shows Other. */
function resolvePersistedCountryCode(
  selectedCountryLabel: string,
  loadedIsoFromDb: string,
): string {
  const fromDropdown = COUNTRY_TO_CODE[selectedCountryLabel];
  if (fromDropdown) return fromDropdown;
  const l = loadedIsoFromDb.trim().toUpperCase();
  if (l === "UK") return "GB";
  if (/^[A-Z]{2}$/.test(l)) return l;
  return "ZA";
}

// ─── Section heading ──────────────────────────────────────────────────────────

function SectionHeading({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-5 border-b border-gray-200 pb-3">
      <h2 className="text-base font-semibold text-[#0E0E0E]">{title}</h2>
      {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BusinessProfilePage() {
  const { selectedBusiness } = useBusinessContext();
  const businessId = selectedBusiness?.id ?? null;
  const publicProfileHref = selectedBusiness?.slug ? `/b/${selectedBusiness.slug}` : null;

  const [loading,       setLoading]       = useState(!!businessId);
  const [saving,        setSaving]        = useState(false);
  const [message,       setMessage]       = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [refreshKey,    setRefreshKey]    = useState(0);
  const [logoUrl,       setLogoUrl]       = useState<string | null>(null);
  const [logoPreview,   setLogoPreview]   = useState<string | null>(null);
  const [logoUploading, setLogoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const loadedCountryCodeRef = useRef<string>("");

  // Profile form
  const [form, setForm] = useState({
    name: "", website: "", description: "",
    address: "", city: "", postcode: "", country: "South Africa",
    email: "", phone: "",
  });

  // ── Fetch (server session + RLS via route — avoids client getSession / empty rows on refresh) ──

  useEffect(() => {
    if (!businessId) {
      setLoading(false);
      return;
    }
    let mounted = true;
    const isRefetchAfterSave = refreshKey > 0;
    (async () => {
      if (!isRefetchAfterSave) setLoading(true);
      try {
        const json = await dashboardApiGet<{ business: Record<string, unknown> }>(
          `/api/business/${encodeURIComponent(businessId)}/business-profile`
        );
        if (!mounted) return;
        const row = json.business;
        const code = (row.country_code as string) ?? getActiveCountry() ?? "";
        const normalizedCode =
          code.trim().toUpperCase() === "UK" ? "GB" : code.trim().toUpperCase();
        loadedCountryCodeRef.current = /^[A-Z]{2}$/.test(normalizedCode)
          ? normalizedCode
          : "";
        const countryName =
          normalizedCode.length === 2
            ? (COUNTRY_CODE_TO_NAME[normalizedCode] ?? "Other")
            : code;
        const cityVal = (row.city as string) ?? "";

        setForm((p) => ({
          ...p,
          name: (row.name as string) ?? "",
          website: ((row.website_display as string) ?? (row.website as string) ?? "").trim(),
          description: (row.description as string) ?? "",
          address: (row.address as string) ?? "",
          city: cityVal !== "[unknown]" ? cityVal : "",
          postcode: "",
          country: countryName,
          email: (row.email as string) ?? "",
          phone: (row.phone as string) ?? "",
        }));

        const logo = (row.logo_url as string) ?? null;
        if (logo) setLogoUrl(normalizeLogoUrl(logo) ?? null);
        else setLogoUrl(null);
      } catch (e) {
        console.error("[BusinessProfile] load", e);
        if (mounted) {
          setMessage({ type: "error", text: "Could not load business profile. Refresh the page or try again." });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [businessId, refreshKey]);

  // ── Logo upload ────────────────────────────────────────────────────────────

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;
    if (file.size > 2 * 1024 * 1024) { setMessage({ type: "error", text: "Logo must be under 2 MB." }); return; }

    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
    setLogoUploading(true);

    const ext  = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${businessId}/logo.${ext}`;

    const supabase = supabaseBrowser();
    let uploadError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { error } = await supabase.storage.from("business_logos").upload(path, file, { upsert: true, contentType: file.type });
      if (!error) { uploadError = null; break; }
      uploadError = error;
      await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }

    if (uploadError) {
      setLogoUploading(false);
      setMessage({ type: "error", text: `Logo upload failed: ${uploadError.message}` });
      return;
    }

    const { data: urlData } = supabase.storage.from("business_logos").getPublicUrl(path);
    const publicUrl = urlData?.publicUrl ? `${urlData.publicUrl}?v=${Date.now()}` : null;

    if (publicUrl) {
      const supabase = supabaseBrowser();
      await supabase.from("businesses").update({ logo_url: publicUrl }).eq("id", businessId);
      setLogoUrl(publicUrl);
    }
    setLogoUploading(false);
    setMessage({ type: "success", text: "Logo uploaded." });
  };

  // ── Save profile ───────────────────────────────────────────────────────────

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    setMessage(null); setSaving(true);

    const websiteNorm = form.website.trim()
      ? form.website.trim().startsWith("http") ? form.website.trim() : `https://${form.website.trim()}`
      : null;
    const displayDomain = websiteNorm
      ? websiteNorm.replace(/^https?:\/\//i,"").replace(/^www\./i,"").split("/")[0]?.trim() ?? ""
      : "";

    const payload: Record<string, string | boolean | null> = {
      name:             form.name.trim() || null,
      website:          websiteNorm,
      website_display:  displayDomain || null,
      address:          form.address.trim() || null,
      city:             form.city.trim() || null,
      country_code:     resolvePersistedCountryCode(
        form.country,
        loadedCountryCodeRef.current,
      ),
      description:      form.description.trim() || null,
      phone:            form.phone.trim() || null,
      email:            form.email.trim() || null,
    };

    const supabase = supabaseBrowser();
    let { error } = await supabase.from("businesses").update(payload).eq("id", businessId);

    const colMissing = error && (
      String((error as any).code) === "PGRST204" ||
      String((error as any).code) === "42703" ||
      (error as any).message?.toLowerCase().includes("does not exist")
    );
    if (colMissing) {
      const minPayload = { name: payload.name, website: payload.website, website_display: payload.website_display, address: payload.address, city: payload.city, country_code: payload.country_code, description: payload.description };
      const res = await supabase.from("businesses").update(minPayload).eq("id", businessId);
      error = res.error;
    }

    setSaving(false);
    if (error) { setMessage({ type: "error", text: error.message }); return; }
    const savedCc = String(payload.country_code ?? "").trim().toUpperCase();
    if (/^[A-Z]{2}$/.test(savedCc)) {
      loadedCountryCodeRef.current = savedCc === "UK" ? "GB" : savedCc;
    }
    setMessage({ type: "success", text: "Saved." });
    setRefreshKey((k) => k + 1);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!businessId) return null;
  if (loading) return <PageLoadingOverlay />;

  return (
    <div className="max-w-3xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Business Profile</h1>
          <p className="mt-0.5 text-sm text-gray-500">Manage your public profile and categories.</p>
        </div>
        {publicProfileHref && (
          <a href={publicProfileHref} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-[#124541] px-4 py-2 text-sm font-medium text-[#124541] hover:bg-[#124541]/5">
            <ExternalLink size={15} /> View public profile
          </a>
        )}
      </div>

      {message && (
        <div className={`mb-5 rounded-lg border px-4 py-3 text-sm ${message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">

        {/* ── Section 1: Basic Info ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <SectionHeading title="Basic Info" sub="Your business name, domain, logo, and description." />
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#0E0E0E]">Company name</label>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                placeholder="Acme Ltd" />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E0E0E]">Domain</label>
              <input type="text" value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                placeholder="example.com" />
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-medium text-[#0E0E0E]">Logo</label>
              <div className="mt-2 flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-[#FCF7F6]">
                  {(logoPreview || logoUrl) ? (
                    <img src={logoPreview || logoUrl || ""} alt="Logo" className="h-full w-full object-contain rounded-lg"
                      onError={() => { if (!logoPreview) setLogoUrl(null); }} />
                  ) : logoUploading ? (
                    <svg className="h-6 w-6 animate-spin text-[#124541]" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="32" strokeDashoffset="12" />
                    </svg>
                  ) : <Upload size={20} className="text-gray-300" />}
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleLogoChange} className="hidden" />
                  <button type="button" disabled={logoUploading}
                    onClick={() => { if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); } }}
                    className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50">
                    <Upload size={16} className="text-gray-400" />
                    {logoUploading ? "Uploading…" : (logoUrl || logoPreview) ? "Change logo" : "Upload logo (JPG/PNG, max 2 MB)"}
                  </button>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[#0E0E0E]">Description</label>
              <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={4}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                placeholder="Tell your customers what makes you unique." />
              <p className="mt-1 text-xs text-gray-500">
                Word count: {form.description.trim().split(/\s+/).filter(Boolean).length}
              </p>
            </div>
          </div>
        </div>

        {/* ── Section 2: Contact Info ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <SectionHeading title="Contact Info" sub="How customers and reviewers can reach you." />
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">
                  Public Email <span className="text-gray-400">(optional)</span>
                </label>
                <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  placeholder="contact@example.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">
                  Phone Number <span className="text-gray-400">(optional)</span>
                </label>
                <input type="tel" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  placeholder="+1 234 567 8900" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E0E0E]">Address</label>
              <input type="text" value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                placeholder="Street address" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">City</label>
                <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">Country</label>
                <select value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20">
                  {COUNTRY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#0E0E0E]">Postcode</label>
                <input type="text" value={form.postcode} onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
                  placeholder="Optional" />
                <p className="mt-1 text-xs text-gray-400">Not stored.</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Categories (link to dedicated page) ── */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <SectionHeading title="Categories" sub="Control how your business is discovered." />
          <p className="text-sm text-gray-600 mb-4">
            Manage your primary and secondary categories to improve discoverability.
          </p>
          <Link href="/business/dashboard/settings/categories"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2fb2a8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91]">
            Manage Categories →
          </Link>
        </div>

        {/* Save */}
        <div className="flex gap-3 pb-8">
          <button type="submit" disabled={saving}
            className="rounded-lg bg-[#2fb2a8] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
