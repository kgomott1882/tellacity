"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";

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
  navRefreshKey: number;
  bumpNavRefresh: () => void;
};

const STORAGE_KEY = "tc_selected_business";

const BusinessContext = createContext<Ctx | null>(null);

export function BusinessProvider({ children }: { children: React.ReactNode }) {
  const [businesses, setBusinesses] = useState<DashboardBusiness[]>([]);

  // ✅ Restore from localStorage on first load
  const [selectedBusiness, setSelectedBusinessState] = useState<DashboardBusiness | null>(() => {
    if (typeof window === "undefined") return null;

    try {
      let raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) raw = localStorage.getItem("selectedBusiness");
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  const [navRefreshKey, setNavRefreshKey] = useState(0);

  // ✅ Persist when changed
  const setSelectedBusiness = (b: DashboardBusiness | null) => {
    setSelectedBusinessState(b);

    if (typeof window !== "undefined") {
      if (b) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(b));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  // ✅ Auto-recover if lost after refresh
  useEffect(() => {
    if (!selectedBusiness && businesses.length > 0) {
      setSelectedBusiness(businesses[0]);
    }
  }, [businesses]);

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
    [businesses, selectedBusiness, navRefreshKey, bumpNavRefresh]
  );

  return <BusinessContext.Provider value={value}>{children}</BusinessContext.Provider>;
}

export function useBusinessContext() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error("useBusinessContext must be used inside BusinessProvider");
  return ctx;
}