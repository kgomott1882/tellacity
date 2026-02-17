"use client";

import { useActionState } from "react";
import { submitGeneralContactForm } from "./actions";

const initialState = {
  success: false,
  message: "",
};

export default function ContactPage() {
  const [state, formAction] = useActionState(
    submitGeneralContactForm,
    initialState
  );

  return (
    <main className="min-h-screen py-20 px-6">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>

        {state.message && (
          <div
            className={`mb-6 p-4 rounded ${
              state.success
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {state.message}
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <input
            name="name"
            placeholder="Full Name"
            className="w-full border p-3 rounded"
            required
          />

          <input
            name="email"
            type="email"
            placeholder="Email Address"
            className="w-full border p-3 rounded"
            required
          />

          <input
            name="subject"
            placeholder="Subject"
            className="w-full border p-3 rounded"
            required
          />

          <textarea
            name="message"
            placeholder="Your Message"
            className="w-full border p-3 rounded"
            rows={5}
            required
          />

          <button
            type="submit"
            className="bg-black text-white px-6 py-3 rounded shadow hover:opacity-90 transition"
          >
            Send Message
          </button>
        </form>
      </div>
    </main>
  );
}
