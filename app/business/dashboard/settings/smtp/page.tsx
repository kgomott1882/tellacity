"use client";

import SimplePage from "../../_components/SimplePage";

export default function SmtpSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <div className="max-w-2xl">
        <SimplePage
          title="SMTP"
          subtitle="Configure outgoing mail settings for this workspace."
        />
      </div>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0E0E0E]">SMTP settings</h2>
        <p className="mt-2 text-sm text-gray-500">
          SMTP configuration will live here. This tab is ready for a dedicated setup flow without changing billing or payment logic.
        </p>
      </section>
    </div>
  );
}
