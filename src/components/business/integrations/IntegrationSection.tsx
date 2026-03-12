"use client";

import IntegrationCard from "./IntegrationCard";
import type { IntegrationWithState } from "@/lib/integrationsCatalog";

type Props = {
  title: string;
  description?: string;
  integrations: IntegrationWithState[];
  emptyLabel?: string;
};

export default function IntegrationSection({
  title,
  description,
  integrations,
  emptyLabel,
}: Props) {
  if (integrations.length === 0 && !emptyLabel) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-[#0E0E0E]">{title}</h2>
          {description && (
            <p className="mt-1 text-xs text-gray-600 max-w-xl">{description}</p>
          )}
        </div>
      </div>

      {integrations.length > 0 ? (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((integration) => (
            <IntegrationCard key={integration.slug} integration={integration} />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-gray-500">
          {emptyLabel ?? "No integrations to show yet."}
        </p>
      )}
    </section>
  );
}

