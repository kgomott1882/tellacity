"use client";

import { FormEvent, useState } from "react";

type ContactForm = {
  name: string;
  email: string;
  company: string;
  message: string;
};

const initialState: ContactForm = {
  name: "",
  email: "",
  company: "",
  message: "",
};

export default function PartnerContactPage() {
  const [form, setForm] = useState<ContactForm>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  function handleChange(field: keyof ContactForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    setLoading(true);
    setError(null);

    const { name, email, company, message } = form;

    try {
      const res = await fetch("/api/partner-contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          company,
          message,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send message");
      }

      setSubmitted(true);
    } catch (err: any) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-white px-6 py-20">
        <section className="max-w-2xl mx-auto mt-16">
          <div className="bg-green-50 border border-green-200 rounded-xl p-8 text-center shadow-sm">
            <h2 className="text-2xl font-semibold mb-2">Message sent</h2>
            <p className="text-gray-600">
              Our team will reply shortly.
            </p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 py-20">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-[#0E0E0E]">
            Talk to Our Partnerships Team
          </h1>
          <p className="mt-3 text-sm md:text-base text-gray-600 max-w-xl">
            Have questions about partnering with Tellacity? Send us a message.
          </p>
        </header>

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 md:p-8 shadow-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1">
              <label htmlFor="name" className="text-sm font-medium text-gray-800">
                Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={form.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                placeholder="Your name"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-sm font-medium text-gray-800">
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
              <label htmlFor="company" className="text-sm font-medium text-gray-800">
                Company
              </label>
              <input
                id="company"
                type="text"
                value={form.company}
                onChange={(e) => handleChange("company", e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                placeholder="Your company"
              />
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="message" className="text-sm font-medium text-gray-800">
                Message
              </label>
              <textarea
                id="message"
                rows={4}
                required
                value={form.message}
                onChange={(e) => handleChange("message", e.target.value)}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-black focus:ring-1 focus:ring-black"
                placeholder="Share how you work with clients today and what you would like to explore with Tellacity."
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center rounded-lg bg-black px-6 py-3 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
              {error && (
                <p className="text-red-500 text-sm mt-2">{error}</p>
              )}
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

