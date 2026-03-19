"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
const isValidSlug = (slug: string) => {
  if (!slug || typeof slug !== "string") return false;
  const clean = slug.trim().toLowerCase();
  return /^[a-z0-9-]+$/.test(clean);
};

import { MapPin, Search, Building2, Shield, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getActiveCountry } from "@/lib/getActiveCountry";

type LocationRow = {
  id: string;
  name: string | null;
  address: string | null;
  city: string | null;
  postcode: string | null;
  country_code: string | null;
  external_id?: string | null;
  street_address_2?: string | null;
  state_region?: string | null;
  phone?: string | null;
  website?: string | null;
  headline?: string | null;
  description?: string | null;
};

export default function LocationsPage() {
  const { selectedBusiness } = useBusinessContext();
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddManualModal, setShowAddManualModal] = useState(false);
  const [editingLocation, setEditingLocation] = useState<LocationRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const businessId = selectedBusiness?.id ?? null;

  const filteredLocations = searchQuery.trim()
    ? locations.filter((loc) => {
        const q = searchQuery.toLowerCase();
        const name = (loc.name ?? "").toLowerCase();
        const address = (loc.address ?? "").toLowerCase();
        const city = (loc.city ?? "").toLowerCase();
        const id = loc.id.toLowerCase();
        return name.includes(q) || address.includes(q) || city.includes(q) || id.includes(q);
      })
    : locations;

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!businessId) {
        setLoading(false);
        return;
      }
      const supabase = supabaseBrowser();
      const { data, error } = await supabase
        .from("business_locations")
        .select("id, name, address, city, postcode, country_code, external_id, street_address_2, state_region, phone, website, headline, description")
        .eq("business_id", businessId)
        .order("created_at", { ascending: true });
      if (!mounted) return;
      if (!error && data) {
        setLocations((data as LocationRow[]) ?? []);
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [businessId]);

  const showSelectPrompt = !selectedBusiness;
  const showSkeleton = selectedBusiness && loading;
  const showContent = selectedBusiness && !loading;

  return (
    <>
      {showSelectPrompt && (
        <div>
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Locations</h1>
          <p className="mt-2 text-sm text-gray-600">Select a business from the sidebar to manage locations.</p>
          <Link href="/business/dashboard" className="mt-4 inline-block text-sm font-medium text-[#124541] hover:underline">
            Back to dashboard
          </Link>
        </div>
      )}
      {showSkeleton && (
        <div className="max-w-4xl">
          <h1 className="text-2xl font-semibold text-[#0E0E0E]">Locations</h1>
          <div className="mt-6 h-10 w-full max-w-md rounded bg-gray-100 animate-pulse" />
          <div className="mt-8 h-48 rounded bg-gray-100 animate-pulse" />
        </div>
      )}
      {showContent && (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold text-[#0E0E0E]">Locations</h1>

      <div className="mt-6 flex gap-4 lg:gap-8">
        {/* Left: search + main card / list */}
        <div className="min-w-0 flex-1">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name, ID or address"
              className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-[#0E0E0E] focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
            />
          </div>

          {locations.length === 0 ? (
            <div className="mt-8 rounded-xl border border-gray-200 bg-white p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E0F7F5] text-[#124541]">
                <MapPin size={28} />
              </div>
              <p className="mt-4 text-sm text-gray-700">
                Easily import all your locations and collect reviews for them right away
              </p>
              <Link
                href="/business/dashboard/settings/public/locations/import"
                className="mt-4 inline-block rounded-lg bg-[#2fb2a8] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#269a91]"
              >
                Import locations
              </Link>
              <p className="mt-3">
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(true)}
                  className="text-sm font-medium text-[#124541] hover:underline"
                >
                  Add locations manually
                </button>
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              {filteredLocations.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-[#0E0E0E]">{loc.name || "Unnamed location"}</p>
                    {(loc.address || loc.city) && (
                      <p className="text-sm text-gray-600">
                        {[loc.address, loc.city, loc.postcode].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {selectedBusiness?.slug && isValidSlug(selectedBusiness.slug) && (
                      <Link
                        href={`/b/${selectedBusiness.slug.trim().toLowerCase()}/l/${loc.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-[#124541]"
                        title="View public page"
                      >
                        <MapPin size={16} />
                      </Link>
                    )}
                    <button
                      type="button"
                      onClick={() => setEditingLocation(loc)}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50 hover:text-[#124541]"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm("Delete this location? This cannot be undone.")) {
                          const supabase = supabaseBrowser();
                          setDeletingId(loc.id);
                          supabase
                            .from("business_locations")
                            .delete()
                            .eq("id", loc.id)
                            .then(({ error }) => {
                              setDeletingId(null);
                              if (!error) setLocations((prev) => prev.filter((l) => l.id !== loc.id));
                            });
                        }
                      }}
                      disabled={deletingId === loc.id}
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex gap-2 pt-2">
                <Link
                  href="/business/dashboard/settings/public/locations/import"
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Import locations
                </Link>
                <button
                  type="button"
                  onClick={() => setShowAddManualModal(true)}
                  className="text-sm font-medium text-[#124541] hover:underline"
                >
                  Add locations manually
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: benefit panels */}
        <div className="hidden w-80 shrink-0 space-y-4 lg:block">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Rank higher in local search results</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Location-specific profile pages come with embedded rich snippets, allowing you to stand out in local search results.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <Shield size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Boost customer confidence on a local level</h3>
                <p className="mt-1 text-sm text-gray-600">
                  TrustScores for each of your locations give your customers even more confidence that you really are the best service in town.
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-600">
                <TrendingUp size={20} />
              </div>
              <div>
                <h3 className="font-semibold text-[#0E0E0E]">Manage your locations&apos; reputation</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Get a better understanding of the customer satisfaction level of all your individual locations.
                </p>
              </div>
            </div>
          </div>
          <a
            href="/help-center"
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-[#2fb2a8] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#269a91]"
          >
            Learn more
          </a>
        </div>
      </div>

      {(showAddManualModal || editingLocation) && (
        <AddLocationModal
          businessId={businessId!}
          existing={editingLocation ?? undefined}
          onClose={() => {
            setShowAddManualModal(false);
            setEditingLocation(null);
          }}
          onSaved={(loc) => {
            if (editingLocation) {
              setLocations((prev) => prev.map((l) => (l.id === loc.id ? { ...l, ...loc } : l)));
              setEditingLocation(null);
            } else {
              setLocations((prev) => [...prev, loc]);
            }
            setShowAddManualModal(false);
          }}
        />
      )}
    </div>
      )}
    </>
  );
}

const SELECT_COLS = "id, name, address, city, postcode, country_code, external_id, street_address_2, state_region, phone, website, headline, description";

function AddLocationModal({
  businessId,
  existing,
  onClose,
  onSaved,
}: {
  businessId: string;
  existing?: LocationRow;
  onClose: () => void;
  onSaved: (loc: LocationRow) => void;
}) {
  const isEdit = !!existing;
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    external_id: existing?.external_id ?? "",
    website: existing?.website ?? "",
    address: existing?.address ?? "",
    street_address_2: existing?.street_address_2 ?? "",
    city: existing?.city ?? "",
    postcode: existing?.postcode ?? "",
    state_region: existing?.state_region ?? "",
    country_code: existing?.country_code ?? getActiveCountry() ?? "",
    phone: existing?.phone ?? "",
    headline: existing?.headline ?? "",
    description: existing?.description ?? "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEdit && !confirmed) {
      setError("Please confirm that this location is valid and you are authorized to add it.");
      return;
    }
    setError("");
    setSaving(true);
    const payload = {
      name: form.name.trim() || null,
      external_id: form.external_id.trim() || null,
      website: form.website.trim() || null,
      address: form.address.trim() || null,
      street_address_2: form.street_address_2.trim() || null,
      city: form.city.trim() || null,
      postcode: form.postcode.trim() || null,
      state_region: form.state_region.trim() || null,
      country_code: form.country_code || getActiveCountry() || "",
      phone: form.phone.trim() || null,
      headline: form.headline.trim() || null,
      description: form.description.trim() || null,
    };
    const supabase = supabaseBrowser();

    if (isEdit && existing) {
      const { data, error: err } = await supabase
        .from("business_locations")
        .update(payload)
        .eq("id", existing.id)
        .select(SELECT_COLS)
        .single();
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (data) onSaved(data as LocationRow);
    } else {
      const { data, error: err } = await supabase
        .from("business_locations")
        .insert({ business_id: businessId, ...payload })
        .select(SELECT_COLS)
        .single();
      setSaving(false);
      if (err) {
        setError(err.message);
        return;
      }
      if (data) onSaved(data as LocationRow);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold text-[#0E0E0E]">{isEdit ? "Edit location" : "Add location manually"}</h3>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Location name *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="e.g. Downtown Branch"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Location ID</label>
            <input
              type="text"
              value={form.external_id}
              onChange={(e) => setForm((f) => ({ ...f, external_id: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="e.g. 001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Website</label>
            <input
              type="url"
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Headline</label>
            <input
              type="text"
              value={form.headline}
              onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="Match main profile or customize"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Description</label>
            <textarea
              rows={2}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="Optional location description"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Street address *</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="Street address"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Street address 2</label>
            <input
              type="text"
              value={form.street_address_2}
              onChange={(e) => setForm((f) => ({ ...f, street_address_2: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="Suite, floor, etc."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-[#0E0E0E]">City *</label>
              <input
                type="text"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0E0E0E]">ZIP / Postcode *</label>
              <input
                type="text"
                value={form.postcode}
                onChange={(e) => setForm((f) => ({ ...f, postcode: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">State / Province / Region</label>
            <input
              type="text"
              value={form.state_region}
              onChange={(e) => setForm((f) => ({ ...f, state_region: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Country code *</label>
            <input
              type="text"
              value={form.country_code}
              onChange={(e) => setForm((f) => ({ ...f, country_code: e.target.value }))}
              className="mt-1 w-full max-w-[6rem] rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="ZA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0E0E0E]">Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#124541] focus:outline-none focus:ring-2 focus:ring-[#124541]/20"
              placeholder="+27 11 123 4567"
            />
          </div>
          {!isEdit && (
            <label className="flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-[#124541] focus:ring-[#124541]"
              />
              <span className="text-sm text-gray-700">
                I confirm this location is valid and I am authorized to add it (e.g. as franchisor/franchisee).
              </span>
            </label>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="rounded-lg bg-[#2fb2a8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50">
              {saving ? "SavingÔÇª" : isEdit ? "Save changes" : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
