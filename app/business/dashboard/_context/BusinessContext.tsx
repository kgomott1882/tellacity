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
  setSelectedBusiness: (b: DashboardBusiness | null) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  pageLoading: boolean;
  setPageLoading: (value: boolean) => void;
  navRefreshKey: number;
  bumpNavRefresh: () => void;
};

const BusinessContext = createContext<Ctx | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<DashboardBusiness[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<DashboardBusiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pageLoading, setPageLoading] = useState(false);
  const [navRefreshKey, setNavRefreshKey] = useState(0);

  const bumpNavRefresh = React.useCallback(() => {
    setNavRefreshKey((k) => k + 1);
  }, []);

  const value = useMemo(
    () => ({
      businesses,
      setBusinesses,
      selectedBusiness,
      setSelectedBusiness,
      isLoading,
      setIsLoading,
      pageLoading,
      setPageLoading,
      navRefreshKey,
      bumpNavRefresh,
    }),
    [businesses, selectedBusiness, isLoading, pageLoading, navRefreshKey, bumpNavRefresh]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusinessContext must be used inside BusinessProvider");
  return ctx;
}
