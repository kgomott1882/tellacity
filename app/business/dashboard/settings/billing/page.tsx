"use client";

import Link from "next/link";
import SimplePage from "../../_components/SimplePage";
import { useBusinessContext } from "../../_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import UpgradeButton from "@/components/billing/UpgradeButton";

/**
 * Plans & billing — linked from PlanStatusBanner "Upgrade" and TopBar.
 * (Previously missing route caused 404; back navigation then left dashboard pages blank.)
 */
export default function BillingSettingsPage() {
  const { selectedBusiness } = useBusinessContext();
  const { user } = useBusinessAuth();
  if (!selectedBusiness?.id) return null;

  return (
    <div className="max-w-2xl space-y-6">
      <SimplePage
        title="Plans & billing"
        subtitle="Manage your subscription and upgrade when you need more."
      />

      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-700">
          Compare features and pricing here in your dashboard, or upgrade in one step with secure
          checkout (Paystack).
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link
            href="/business/dashboard/pricing"
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50"
          >
            View pricing &amp; plans
          </Link>
        </div>
      </div>

      {selectedBusiness && user?.email ? (
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-6">
          <p className="text-sm font-medium text-gray-900">Upgrade this workspace</p>
          <p className="mt-1 text-xs text-gray-600">
            Business: {selectedBusiness.name}
          </p>
          <div className="mt-4">
            <UpgradeButton
              businessId={selectedBusiness.id}
              planCode="premium"
              amount={5000}
              email={user.email}
            />
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-600">
          Select a business from the sidebar switcher to show upgrade options.
        </p>
      )}
    </div>
  );
}
