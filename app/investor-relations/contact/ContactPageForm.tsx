"use client";

import { useActionState } from "react";
import { submitInvestorContactForm, type ContactFormState } from "../actions";

const initialState: ContactFormState = {};

export default function ContactPageForm() {
  const [state, formAction] = useActionState(submitInvestorContactForm, initialState);

  if (state?.success) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-xl font-semibold text-[#0E0E0E]">Thank you</p>
        <p className="mt-2 text-sm text-gray-600">
          We&apos;ve received your message and will get back to you at the email you provided.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="mx-auto max-w-lg space-y-5 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
      {state?.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-800">
          {state.error}
        </p>
      )}
      <div>
        <label htmlFor="ir-contact-name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </span>
          <input
            id="ir-contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            placeholder="John Doe"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-[#0E0E0E] placeholder-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ir-contact-email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
            </svg>
          </span>
          <input
            id="ir-contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-[#0E0E0E] placeholder-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ir-contact-subject" className="block text-sm font-medium text-gray-700">
          Subject
        </label>
        <div className="relative mt-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          </span>
          <input
            id="ir-contact-subject"
            name="subject"
            type="text"
            autoComplete="off"
            placeholder="Regarding my account..."
            className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-[#0E0E0E] placeholder-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
          />
        </div>
      </div>
      <div>
        <label htmlFor="ir-contact-message" className="block text-sm font-medium text-gray-700">
          Message
        </label>
        <div className="relative mt-1">
          <span className="absolute left-3 top-3 text-gray-400">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.157.166 2.42.305 3.793.433V20.25l-1.427-1.418A6.962 6.962 0 0118 15.75c0-1.708-.476-3.305-1.302-4.623.627-.627 1.302-1.433 1.302-2.377 0-1.708-.476-3.305-1.302-4.623M6.75 8.25h.75v-.75h-.75v.75z" />
            </svg>
          </span>
          <textarea
            id="ir-contact-message"
            name="message"
            required
            rows={5}
            placeholder="Tell us what's on your mind..."
            className="w-full resize-y rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm text-[#0E0E0E] placeholder-gray-400 focus:border-[#1FAF9E] focus:outline-none focus:ring-1 focus:ring-[#1FAF9E]"
          />
        </div>
      </div>
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#1FAF9E] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#169786]"
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
        </svg>
        Send Message
      </button>
    </form>
  );
}
