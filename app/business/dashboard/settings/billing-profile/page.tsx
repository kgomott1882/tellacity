"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { dashboardApiGet } from "@/lib/dashboardApiFetch";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import { normalizePlanCodeToKey, type PlanKey } from "@/lib/plans";
import type { BillingOverviewResponse } from "@/lib/billingOverview";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";

const PLAN_LABELS: Record<PlanKey, string> = {
  free: "Free",
  grow: "Grow",
  premium: "Premium",
  elite: "Elite",
};

const PLAN_DESCRIPTIONS: Record<PlanKey, string> = {
  free: "Basic review collection for getting started.",
  grow: "Growth tools for steady review volume and stronger visibility.",
  premium: "Advanced automation and analytics for scaling teams.",
  elite: "Enterprise-grade review management with strategic oversight.",
};

const BILLING_COUNTRY_OPTIONS = [
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
] as const;

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

const COUNTRY_NAME_TO_CODE: Record<string, string> = {
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
};

type InlineMessage = { type: "success" | "error"; text: string } | null;

type BusinessProfileResponse = {
  business?: {
    email?: string | null;
    address?: string | null;
    country_code?: string | null;
  };
};

function resolveCountryLabel(countryCode: string | null | undefined): string {
  const code = String(countryCode ?? "").trim().toUpperCase();
  return COUNTRY_CODE_TO_NAME[code] ?? "Other";
}

function resolveCountryCode(countryLabel: string): string | null {
  return COUNTRY_NAME_TO_CODE[countryLabel] ?? null;
}

function inputClasses() {
  return "mt-1 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-[#0E0E0E] outline-none transition focus:border-[#124541] focus:ring-2 focus:ring-[#124541]/10";
}

function messageClasses(type: "success" | "error"): string {
  return type === "success"
    ? "rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-sm text-emerald-800"
    : "rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-800";
}

export default function BillingProfilePage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const { user, loading: authLoading } = useBusinessAuth();
  const businessId = selectedBusiness?.id ?? null;

  const [billingOverview, setBillingOverview] = useState<BillingOverviewResponse | null>(null);
  const [billingOverviewLoading, setBillingOverviewLoading] = useState(false);
  const [billingEmail, setBillingEmail] = useState("");
  const [billingProfile, setBillingProfile] = useState({
    companyName: "",
    contactName: "",
    country: "South Africa",
    address: "",
    taxId: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<InlineMessage>(null);

  const planKey = billingOverview?.current?.plan_code
    ? normalizePlanCodeToKey(billingOverview.current.plan_code)
    : normalizePlanCodeToKey(selectedBusiness?.plan);
  const planLabel = PLAN_LABELS[planKey] ?? planKey;
  const planDescription =
    PLAN_DESCRIPTIONS[planKey] ?? "Manage the billing setup for this workspace.";
  const statusLabel = (() => {
    if (billingOverviewLoading) return "Loading...";
    const raw = billingOverview?.current?.status?.trim();
    if (!raw) return "--";
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  })();

  useEffect(() => {
    if (authLoading || !businessId || !user?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const data = await dashboardApiGet<BusinessProfileResponse>(
          `/api/business/${encodeURIComponent(businessId)}/business-profile`
        );
        if (cancelled) return;
        const business = data.business ?? {};
        setBillingEmail(String(business.email ?? "").trim() || user.email?.trim() || "");
        setBillingProfile((current) => ({
          ...current,
          companyName: selectedBusiness?.name ?? current.companyName,
          country: resolveCountryLabel(business.country_code),
          address: String(business.address ?? "").trim(),
        }));
      } catch {
        if (!cancelled) {
          setBillingEmail((current) => current.trim() || user.email?.trim() || "");
          setBillingProfile((current) => ({
            ...current,
            companyName: selectedBusiness?.name ?? current.companyName,
          }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, businessId, selectedBusiness?.name, user?.email, user?.id]);

  useEffect(() => {
    if (authLoading || !businessId || !user?.id) return;
    let cancelled = false;
    setBillingOverviewLoading(true);
    void (async () => {
      try {
        const data = await dashboardApiGet<BillingOverviewResponse>(
          `/api/billing/overview?businessId=${encodeURIComponent(businessId)}`
        );
        if (!cancelled) setBillingOverview(data);
      } catch {
        if (!cancelled) setBillingOverview(null);
      } finally {
        if (!cancelled) setBillingOverviewLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, businessId, user?.id]);

  if (!businessId) return null;

  const handleSave = async () => {
    setMessage(null);
    setSaving(true);
    try {
      const { error } = await supabaseBrowser()
        .from("businesses")
        .update({
          email: billingEmail.trim() || null,
          address: billingProfile.address.trim() || null,
          country_code: resolveCountryCode(billingProfile.country),
        })
        .eq("id", businessId);
      if (error) {
        setMessage({ type: "error", text: error.message });
        return;
      }
      setMessage({
        type: "success",
        text: "Billing profile saved. Company name, billing contact name, and tax ID remain UI-only for now.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <div className="max-w-2xl">
        <SimplePage
          title="Billing Settings"
          subtitle="Manage billing and company details for this workspace."
        />
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-[#124541]">
              Current subscription
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-[#0E0E0E]">
              {billingOverviewLoading ? "Loading..." : planLabel}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-gray-500">{planDescription}</p>
            <dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="font-medium text-gray-600">Status</dt>
                <dd className="mt-1 text-base font-semibold text-[#0E0E0E]">{statusLabel}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-600">Source of truth</dt>
                <dd className="mt-1 text-base text-[#0E0E0E]">Subscriptions</dd>
              </div>
            </dl>
          </div>
          <button
            type="button"
            onClick={() => router.push("/business/dashboard/billing/downgrade")}
            className="inline-flex shrink-0 items-center justify-center rounded-xl border border-[#124541] bg-white px-4 py-2.5 text-sm font-semibold text-[#124541] transition hover:bg-[#124541]/5"
          >
            Change plan
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#0E0E0E]">Billing Profile</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage billing and company details for this workspace.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-600" htmlFor="billing-email">
              Billing Email
            </label>
            <input
              id="billing-email"
              type="email"
              value={billingEmail}
              onChange={(event) => setBillingEmail(event.target.value)}
              placeholder={user?.email?.trim() || "billing@example.com"}
              className={inputClasses()}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600" htmlFor="billing-company-name">
              Company Name
            </label>
            <input
              id="billing-company-name"
              type="text"
              value={billingProfile.companyName}
              onChange={(event) =>
                setBillingProfile((current) => ({ ...current, companyName: event.target.value }))
              }
              placeholder="Your company or brand name"
              className={inputClasses()}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600" htmlFor="billing-contact-name">
              Billing Contact Name
            </label>
            <input
              id="billing-contact-name"
              type="text"
              value={billingProfile.contactName}
              onChange={(event) =>
                setBillingProfile((current) => ({ ...current, contactName: event.target.value }))
              }
              placeholder="Billing contact name"
              className={inputClasses()}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-600" htmlFor="billing-country">
              Country
            </label>
            <select
              id="billing-country"
              value={billingProfile.country}
              onChange={(event) =>
                setBillingProfile((current) => ({ ...current, country: event.target.value }))
              }
              className={inputClasses()}
            >
              {BILLING_COUNTRY_OPTIONS.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600" htmlFor="billing-address">
              Address
            </label>
            <input
              id="billing-address"
              type="text"
              value={billingProfile.address}
              onChange={(event) =>
                setBillingProfile((current) => ({ ...current, address: event.target.value }))
              }
              placeholder="Street address"
              className={inputClasses()}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-600" htmlFor="tax-id">
              Tax ID
            </label>
            <input
              id="tax-id"
              type="text"
              value={billingProfile.taxId}
              onChange={(event) =>
                setBillingProfile((current) => ({ ...current, taxId: event.target.value }))
              }
              placeholder="Enter tax identifier"
              className={inputClasses()}
            />
          </div>
        </div>

        {message ? <div className={`mt-4 ${messageClasses(message.type)}`}>{message.text}</div> : null}

        <div className="mt-4">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-xl bg-[#124541] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0f3a35] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </section>
    </div>
  );
}
