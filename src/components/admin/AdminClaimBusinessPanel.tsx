"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  businessId: string;
  businessName: string;
};

const inputClass =
  "w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900";

export default function AdminClaimBusinessPanel({ businessId, businessName }: Props) {
  const router = useRouter();
  const [ownerFirstName, setOwnerFirstName] = useState("");
  const [ownerLastName, setOwnerLastName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const res = await fetch(
        `/api/admin/businesses/${encodeURIComponent(businessId)}/claim`,
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
        ownerCreated?: boolean;
        passwordSetupEmailSent?: boolean;
        emailError?: string;
      };
      if (!res.ok) {
        setError(data.error ?? "Could not claim business.");
        return;
      }
      const emailNote = data.passwordSetupEmailSent
        ? " A password-setup email was sent to the owner."
        : data.emailError
          ? ` Claim succeeded but the password-setup email could not be sent (${data.emailError}).`
          : "";
      setSuccess(
        (data.ownerCreated
          ? "Business claimed. A new owner account was created for this email."
          : "Business claimed for the existing owner account.") + emailNote,
      );
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={(e) => void handleSubmit(e)}
      className="mt-4 rounded-lg border border-[#1FAF9E]/30 bg-[#F4FBF9] p-4"
    >
      <h4 className="text-sm font-semibold text-[#124541]">Manually claim for owner</h4>
      <p className="mt-1 text-xs text-neutral-600">
        Assign <span className="font-medium">{businessName}</span> to a user. Email does not need to
        match the business website.
      </p>

      {error ? (
        <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </p>
      ) : null}
      {success ? (
        <p className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {success}
        </p>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-neutral-700">First name *</span>
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
          <span className="mb-1 block text-xs font-medium text-neutral-700">Owner email *</span>
          <input
            className={inputClass}
            type="email"
            value={ownerEmail}
            onChange={(e) => setOwnerEmail(e.target.value)}
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="mt-3 rounded-md bg-[#124541] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f3834] disabled:opacity-50"
      >
        {submitting ? "Claiming…" : "Claim business"}
      </button>
    </form>
  );
}
