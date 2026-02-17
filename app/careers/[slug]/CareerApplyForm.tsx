"use client";

import { useActionState, useState } from "react";
import { submitCareerApplication } from "../actions";

type Props = { jobSlug: string; jobTitle: string };

export default function CareerApplyForm({ jobSlug, jobTitle }: Props) {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  const [state, formAction, isPending] = useActionState(
    async (prev: { error?: string; success?: boolean }, formData: FormData) => {
      formData.set("jobSlug", jobSlug);
      formData.set("jobTitle", jobTitle);
      return submitCareerApplication(prev, formData);
    },
    {}
  );

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium text-[#0E0E0E]">
          Full name *
        </label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#0E3B36] focus:outline-none focus:ring-1 focus:ring-[#0E3B36]"
          placeholder="Your full name"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-[#0E0E0E]">
          Email *
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#0E3B36] focus:outline-none focus:ring-1 focus:ring-[#0E3B36]"
          placeholder="you@example.com"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-[#0E0E0E]">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#0E3B36] focus:outline-none focus:ring-1 focus:ring-[#0E3B36]"
          placeholder="+27 00 000 0000"
        />
      </div>

      <div>
        <label htmlFor="linkedin" className="block text-sm font-medium text-[#0E0E0E]">
          LinkedIn URL
        </label>
        <input
          id="linkedin"
          name="linkedin"
          type="url"
          autoComplete="url"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#0E3B36] focus:outline-none focus:ring-1 focus:ring-[#0E3B36]"
          placeholder="https://linkedin.com/in/yourprofile"
        />
      </div>

      <div>
        <label htmlFor="resume" className="block text-sm font-medium text-[#0E0E0E]">
          Resume / CV *
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Accepted: PDF, DOC, DOCX, TXT (max 5MB)
        </p>
        <input
          id="resume"
          name="resume"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          autoComplete="off"
          required
          onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#0E3B36] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:hover:bg-[#0a302c]"
        />
      </div>

      <div>
        <label htmlFor="coverLetter" className="block text-sm font-medium text-[#0E0E0E]">
          Cover letter
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Accepted: PDF, DOC, DOCX, TXT (max 5MB)
        </p>
        <input
          id="coverLetter"
          name="coverLetter"
          type="file"
          accept=".pdf,.doc,.docx,.txt"
          autoComplete="off"
          onChange={(e) => setCoverFile(e.target.files?.[0] ?? null)}
          className="mt-2 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700 file:hover:bg-gray-200"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-[#0E0E0E]">
          Why do you want to join Tellacity? (optional)
        </label>
        <textarea
          id="message"
          name="message"
          rows={4}
          autoComplete="off"
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#0E3B36] focus:outline-none focus:ring-1 focus:ring-[#0E3B36]"
          placeholder="A few lines about your motivation and fit for this role."
        />
      </div>

      {state?.error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.error}
        </div>
      )}

      {state?.success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Thank you. Your application has been submitted. We&apos;ll be in touch.
        </div>
      )}

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#0B3B36] px-6 py-3 text-sm font-semibold text-white hover:bg-[#0a302c] disabled:opacity-60"
        >
          {isPending ? "Submitting…" : "Submit application"}
        </button>
      </div>
    </form>
  );
}
