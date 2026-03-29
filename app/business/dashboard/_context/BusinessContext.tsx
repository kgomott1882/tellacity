"use client";

import React, { createContext, useContext, useMemo, useState } from "react";

export type DashboardBusiness = {
  id: string;
  name: string;
  slug: string | null;
  website: string | null;
  plan: string | null;
};

type Ctx = {
  businesses: DashboardBusiness[];
  setBusinesses: (b: DashboardBusiness[]) => void;
  selectedBusiness: DashboardBusiness | null;
  setSelectedBusiness: React.Dispatch<React.SetStateAction<DashboardBusiness | null>>;
  navRefreshKey: number;
  bumpNavRefresh: () => void;
};

const BusinessContext = createContext<Ctx | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<DashboardBusiness[]>([]);

  const [selectedBusiness, setSelectedBusinessState] = useState<DashboardBusiness | null>(null);

  const [navRefreshKey, setNavRefreshKey] = useState(0);

  const setSelectedBusiness = React.useCallback(
    (b: React.SetStateAction<DashboardBusiness | null>) => {
      setSelectedBusinessState(b);
    },
    []
  );

  const bumpNavRefresh = React.useCallback(() => {
    setNavRefreshKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      businesses,
      setBusinesses,
      selectedBusiness,
      setSelectedBusiness,
      navRefreshKey,
      bumpNavRefresh,
    }),
    [businesses, setBusinesses, selectedBusiness, setSelectedBusiness, navRefreshKey, bumpNavRefresh]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusinessContext must be used inside BusinessProvider");
  return ctx;
}