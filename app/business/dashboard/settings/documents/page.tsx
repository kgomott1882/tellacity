"use client";

import SimplePage from "../../_components/SimplePage";

export default function DocumentsSettingsPage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 pb-12">
      <div className="max-w-2xl">
        <SimplePage
          title="Documents"
          subtitle="Store and manage workspace-level billing and policy documents."
        />
      </div>
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[#0E0E0E]">Documents</h2>
        <p className="mt-2 text-sm text-gray-500">
          This section is ready for future document uploads and references, keeping the new tab layout consistent across the workspace settings area.
        </p>
      </section>
    </div>
  );
}
