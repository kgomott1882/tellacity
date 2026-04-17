"use client";

import SimplePage from "../../_components/SimplePage";

export default function UnsubscribePageSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <div className="max-w-2xl">
        <SimplePage
          title="Unsubscribe Page"
          subtitle="Manage the unsubscribe experience for your workspace communications."
        />
      </div>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0E0E0E]">Unsubscribe page</h2>
        <p className="mt-2 text-sm text-gray-500">
          This tab is reserved for future unsubscribe-page configuration. The layout is in place so the page fits naturally into the new tab system.
        </p>
      </section>
    </div>
  );
}
