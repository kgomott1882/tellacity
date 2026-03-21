"use client";

import Link from "next/link";
import { useActionState, useEffect, useState } from "react";
import ContactSuccessModal from "../ContactSuccessModal";
import { submitSalesLeadForm } from "../actions";

const initialState = {
  success: false,
  message: "",
};

const inputClass =
  "w-full rounded-md border border-[#2A2A2A]/30 bg-white px-4 py-3 text-sm text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]";

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

export default function ContactSalesPage() {
  const [state, formAction] = useActionState(submitSalesLeadForm, initialState);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state.success) {
      setShowSuccess(true);
    }
  }, [state]);

  useEffect(() => {
    if (!showSuccess) return;
    const timer = setTimeout(() => setShowSuccess(false), 4000);
    return () => clearTimeout(timer);
  }, [showSuccess]);

  return (
    <>
    <div className="min-h-screen bg-[#F5F1EB] text-black">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <p className="mb-8 text-sm">
          <Link
            href="/contact"
            className="font-medium text-[#1FAF9E] transition hover:underline"
          >
            ← Back to contact options
          </Link>
        </p>

        {state.message && !state.success ? (
          <p className="mb-6 border-l-4 border-red-500 pl-4 text-sm text-red-700">
            {state.message}
          </p>
        ) : null}

        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-black md:text-[1.65rem]">
            Contact Sales
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Tell us about your business and we&apos;ll help you get started.
          </p>
        </header>

        <form action={formAction} className="space-y-0">
          <input type="hidden" name="type" value="sales" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="sales-first-name"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                First name<span className="text-red-600">*</span>
              </label>
              <input
                id="sales-first-name"
                name="first_name"
                type="text"
                autoComplete="given-name"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="sales-last-name"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Last name<span className="text-red-600">*</span>
              </label>
              <input
                id="sales-last-name"
                name="last_name"
                type="text"
                autoComplete="family-name"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="sales-business-email"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Business email<span className="text-red-600">*</span>
              </label>
              <input
                id="sales-business-email"
                name="business_email"
                type="email"
                autoComplete="email"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="sales-website"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Website URL<span className="text-red-600">*</span>
              </label>
              <input
                id="sales-website"
                name="website"
                type="text"
                inputMode="url"
                autoComplete="url"
                placeholder="https://example.com"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="sales-country"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Country<span className="text-red-600">*</span>
              </label>
              <select
                id="sales-country"
                name="country"
                required
                className={inputClass}
                defaultValue=""
              >
                <option value="" disabled>
                  Select country
                </option>
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="sales-phone"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Phone number<span className="text-red-600">*</span>
              </label>
              <input
                id="sales-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="sales-company"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Company name<span className="text-red-600">*</span>
              </label>
              <input
                id="sales-company"
                name="company_name"
                type="text"
                autoComplete="organization"
                required
                className={inputClass}
              />
            </div>
            <div>
              <label
                htmlFor="sales-job-title"
                className="mb-1.5 block text-sm font-medium text-black"
              >
                Job title<span className="text-red-600">*</span>
              </label>
              <input
                id="sales-job-title"
                name="job_title"
                type="text"
                autoComplete="organization-title"
                required
                className={inputClass}
              />
            </div>
          </div>

          <div className="mt-4">
            <label
              htmlFor="sales-message"
              className="mb-1.5 block text-sm font-medium text-black"
            >
              Message<span className="text-red-600">*</span>
            </label>
            <textarea
              id="sales-message"
              name="message"
              required
              className={`${inputClass} min-h-[120px] resize-y`}
            />
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-black py-3 text-sm font-medium text-white transition hover:bg-[#1FAF9E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E] focus-visible:ring-offset-2"
          >
            Submit
          </button>

          <p className="mt-4 text-center text-xs text-gray-500">
            By clicking above you accept our{" "}
            <Link
              href="/privacy-policy"
              className="text-[#1FAF9E] hover:underline"
            >
              Privacy Policy
            </Link>{" "}
            and agree to receive emails or calls from Tellacity about our
            products and services. You may unsubscribe at anytime by clicking
            the unsubscribe link at the bottom of the email or by contacting us
            at{" "}
            <a
              href="mailto:privacy@tellacity.com"
              className="text-[#1FAF9E] hover:underline"
            >
              privacy@tellacity.com
            </a>
            . Tellacity&apos;s calls may be recorded for training and quality
            purposes.
          </p>
        </form>
      </div>
    </div>

    <ContactSuccessModal
      open={showSuccess}
      onClose={() => setShowSuccess(false)}
    />
    </>
  );
}
