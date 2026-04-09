"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

const SIGNUP_BUSINESS_KEY = "signup_business";

type StoredSignupBusiness = {
  business_name?: string;
  website?: string;
  country?: string;
};

function CreateBusinessForm() {
  const params = useSearchParams();
  const email = params.get("email") || "";

  const [businessName, setBusinessName] = useState("");
  const [website, setWebsite] = useState("");
  const [country, setCountry] = useState("");

  const [businessId, setBusinessId] = useState<string | null>(null);
  const [domainOtpModalOpen, setDomainOtpModalOpen] = useState(false);
  const [domainOtp, setDomainOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(SIGNUP_BUSINESS_KEY);
    if (!stored) return;

    try {
      const data = JSON.parse(stored) as StoredSignupBusiness;
      if (data.business_name) setBusinessName(data.business_name);
      if (data.website) setWebsite(data.website);
      if (data.country) setCountry(data.country);
    } catch (e) {
      console.error("Failed to parse signup_business", e);
    }
  }, []);

  async function sendDomainOtp(id: string) {
    const res = await fetch("/api/business/verify-domain", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessId: id }),
    });
    const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    if (!res.ok) {
      throw new Error(data.message || data.error || "Could not send verification code");
    }
  }

  async function handleCreateBusiness() {
    setLoading(true);
    setError("");
    setInfo("");

    const nameTrim = businessName.trim();
    const websiteTrim = website.trim();
    const countryTrim = country.trim().toUpperCase().slice(0, 2);

    if (!nameTrim || !websiteTrim || countryTrim.length !== 2) {
      setError("Enter business name, website, and a 2-letter country code.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/business/create-draft", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nameTrim,
          website: websiteTrim,
          country_code: countryTrim,
        }),
      });

      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        businessId?: string;
        error?: string;
        success?: boolean;
      };

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create draft");
      }

      const id = data.businessId;
      if (!id || data.success !== true) {
        throw new Error("Invalid response from server.");
      }

      setBusinessId(id);
      setDomainOtp("");
      setDomainOtpModalOpen(true);
      setInfo("We sent a 6-digit code to your work email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleResendDomainCode() {
    if (!businessId) return;
    setSendingCode(true);
    setError("");
    try {
      await sendDomainOtp(businessId);
      setInfo("A new code was sent to your email.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not resend code.");
    } finally {
      setSendingCode(false);
    }
  }

  async function handleVerifyDomainOtp(e: React.FormEvent) {
    e.preventDefault();
    if (!businessId) return;
    const code = domainOtp.trim();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit code from your email.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/business/verify-domain", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, code }),
      });
      const data = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.message || data.error || "Verification failed");
      }

      try {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(SIGNUP_BUSINESS_KEY);
        }
      } catch {
        /* ignore */
      }

      window.location.href = "/business/dashboard";
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed");
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-2">Create your business</h1>
      {email ? (
        <p className="text-sm text-gray-600 mb-6">Signed in as {email}</p>
      ) : (
        <p className="text-sm text-gray-600 mb-6">Complete your business profile to continue.</p>
      )}

      <input
        placeholder="Business name"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        className="w-full mb-4 p-3 border rounded"
        disabled={Boolean(businessId)}
      />

      <input
        placeholder="Website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        className="w-full mb-4 p-3 border rounded"
        disabled={Boolean(businessId)}
      />

      <input
        placeholder="Country (2-letter code, e.g. US)"
        value={country}
        onChange={(e) => setCountry(e.target.value.toUpperCase().slice(0, 2))}
        maxLength={2}
        className="w-full mb-4 p-3 border rounded"
        disabled={Boolean(businessId)}
      />

      {error ? <p className="text-red-500 mb-4">{error}</p> : null}
      {info && !domainOtpModalOpen ? (
        <p className="text-sm text-gray-700 mb-4">{info}</p>
      ) : null}

      {!businessId ? (
        <button
          type="button"
          onClick={handleCreateBusiness}
          disabled={loading}
          className="w-full bg-green-600 text-white p-3 rounded disabled:opacity-50"
        >
          {loading ? "Working…" : "Create business"}
        </button>
      ) : !domainOtpModalOpen ? (
        <button
          type="button"
          onClick={() => {
            setError("");
            setDomainOtpModalOpen(true);
          }}
          className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786]"
        >
          Enter verification code
        </button>
      ) : null}

      {domainOtpModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <button
              type="button"
              onClick={() => {
                setDomainOtpModalOpen(false);
                setDomainOtp("");
                setError("");
              }}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="text-center text-xl font-semibold text-[#0E0E0E]">
              Verify your domain
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter the 6-digit code we sent to your work email.
            </p>
            <p className="mt-3 text-center text-xs text-gray-500">
              {"Didn't receive the email? Check your spam or junk folder."}
            </p>
            <form onSubmit={handleVerifyDomainOtp} className="mt-6 space-y-4">
              <input
                placeholder="000000"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={domainOtp}
                onChange={(e) => setDomainOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                disabled={loading}
                className="w-full p-3 border rounded text-center text-lg tracking-[0.35em]"
              />
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              {info ? <p className="text-xs text-gray-600 text-center">{info}</p> : null}
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white hover:bg-[#169786] disabled:opacity-50"
              >
                {loading ? "Verifying…" : "Verify and continue"}
              </button>
              <button
                type="button"
                onClick={handleResendDomainCode}
                disabled={sendingCode || loading}
                className="w-full text-sm font-semibold text-[#1FAF9E] hover:underline disabled:opacity-50"
              >
                {sendingCode ? "Sending…" : "Resend code"}
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function CreateBusinessPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-10 px-4 text-gray-600">Loading…</div>
      }
    >
      <CreateBusinessForm />
    </Suspense>
  );
}
