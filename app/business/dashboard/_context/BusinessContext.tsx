"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type DashboardBusiness = {
  id: string;
  name: string;
  slug: string | null;
  website: string | null;
};

type Ctx = {
  businesses: DashboardBusiness[];
  setBusinesses: (b: DashboardBusiness[]) => void;
  selectedBusiness: DashboardBusiness | null;
  setSelectedBusiness: (b: DashboardBusiness | null) => void;
};

const BusinessContext = createContext<Ctx | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<DashboardBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<DashboardBusiness | null>(null);

  const value = useMemo(
    () => ({ businesses, setBusinesses, selectedBusiness, setSelectedBusiness }),
    [businesses, selectedBusiness]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusinessContext must be used inside BusinessProvider");
  return ctx;
}
