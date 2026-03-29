"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBusinessContext } from "./_context/BusinessContext";

/**
 * `/business/dashboard` → default first tab (Analytics). Empty-state users stay here; the layout shell
 * shows onboarding with full nav. Business list comes from `useBusinesses` via context (owner_id + business_owners).
 */
export default function BusinessDashboardPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();

  useEffect(() => {
    if (selectedBusiness) {
      router.replace("/business/dashboard/analytics/performance");
    }
  }, [selectedBusiness, router]);

  return null;
}
