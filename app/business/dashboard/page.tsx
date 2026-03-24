"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import UpgradeButton from "@/components/billing/UpgradeButton";
import { useBusinessContext } from "./_context/BusinessContext";
import { useBusinessAuth } from "@/lib/useBusinessAuth";

/**
 * Business dashboard root: redirect to the default tab (Analytics).
 * Client-side redirect ensures the route always renders and avoids 404s
 * that can occur with server redirect() in some Next.js setups.
 */
export default function BusinessDashboardPage() {
  const router = useRouter();
  const { selectedBusiness: business } = useBusinessContext();
  const { user } = useBusinessAuth();
  if (!business?.id) return null;

  useEffect(() => {
    router.replace("/business/dashboard/analytics/performance");
  }, [router]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4">
      {user?.email ? (
        <UpgradeButton
          businessId={business.id}
          planCode="premium"
          amount={5000}
          email={user.email}
        />
      ) : null}
      <p className="text-sm text-neutral-500">Taking you to your dashboard…</p>
    </div>
  );
}
