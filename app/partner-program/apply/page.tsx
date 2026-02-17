"use client";

import { FormEvent, useState } from "react";

type FormState = {
  fullName: string;
  companyName: string;
  email: string;
  partnerType: string;
  website: string;
  referrals: string;
  message: string;
};

const initialState: FormState = {
  fullName: "",
  companyName: "",
  email: "",
  partnerType: "",
  website: "",
  referrals: "",
  message: "",
};

export default function PartnerApplyPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(
    field: keyof FormState,
    value: string
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    // In a real implementation this would post to an API.
    // For now we just log for debugging.
    console.log("Partner application submitted:", form);
    setSubmitted(true);
  }

  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 text-left">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
            Partner Application
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold text-[#0E0E0E]">
            Apply to Become a Tellacity Partner
          </h1>
          <p className="mt-3 text-sm md:text-base text-gray-600 max-w-xl">
            Tell us about your business and how you&apos;d like to collaborate.
          </p>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 shadow-sm">
          {submitted ? (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-[#0E0E0E]">
                Application received
              </h2>
              <p className="text-sm text-gray-600">
                Our partnerships team will contact you within 48 hours. If you need to share additional context,
                simply reply to the email you&apos;ll receive from us.
              </p>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-800" htmlFor="fullName">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={form.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    placeholder="Your name"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-800" htmlFor="companyName">
                    Company Name
                  </label>
                  <input
                    id="companyName"
                    type="text"
                    required
                    value={form.companyName}
                    onChange={(e) => handleChange("companyName", e.target.value)}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    placeholder="Your company"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-800" htmlFor="email">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    placeholder="you@company.com"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-800" htmlFor="website">
                    Website
                  </label>
                  <input
                    id="website"
                    type="text"
                    value={form.website}
                    onChange={(e) => handleChange("website", e.target.value)}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-800" htmlFor="partnerType">
                    Partner Type
                  </label>
                  <select
                    id="partnerType"
                    required
                    value={form.partnerType}
                    onChange={(e) => handleChange("partnerType", e.target.value)}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
                  >
                    <option value="">Select partner type</option>
                    <option value="Agency">Agency</option>
                    <option value="Integration">Integration</option>
                    <option value="Referral">Referral</option>
                    <option value="Strategic">Strategic</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-800" htmlFor="referrals">
                    Estimated Monthly Referrals
                  </label>
                  <select
                    id="referrals"
                    required
                    value={form.referrals}
                    onChange={(e) => handleChange("referrals", e.target.value)}
                    className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
                  >
                    <option value="">Select range</option>
                    <option value="1–5">1–5</option>
                    <option value="5–20">5–20</option>
                    <option value="20+">20+</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-800" htmlFor="message">
                  Message
                </label>
                <textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={(e) => handleChange("message", e.target.value)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                  placeholder="Share a short overview of your business, clients, and how you would like to partner with Tellacity."
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition"
                >
                  Submit Application
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

