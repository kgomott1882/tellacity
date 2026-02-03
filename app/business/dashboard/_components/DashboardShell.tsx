"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import SecondarySidebar from "./SecondarySidebar";
import TopBar from "./TopBar";
import { BusinessProvider, useBusinessContext } from "../_context/BusinessContext";
import { useBusinesses } from "../_hooks/useBusinesses";
import { useBusinessAuth } from "@/lib/useBusinessAuth";

const NAV_SECTIONS: Record<string, { title: string; items?: any[]; groups?: any[] }> = {
  "get-reviews": {
    title: "GET REVIEWS",
    items: [
      { label: "Overview", path: "/business/dashboard/get-reviews/overview" },
      { label: "Invitation methods", path: "/business/dashboard/get-reviews/invitation-methods" },
      { label: "Email templates", path: "/business/dashboard/get-reviews/email-templates" },
      { label: "Invitation status", path: "/business/dashboard/get-reviews/invitation-status" },
    ],
  },
  share: {
    title: "SHARE & PROMOTE",
    items: [
      { label: "Website widgets", path: "/business/dashboard/share/widgets" },
      { label: "Email widgets", path: "/business/dashboard/share/email" },
      { label: "Social", path: "/business/dashboard/share/social" },
      { label: "Marketing assets", path: "/business/dashboard/share/assets" },
    ],
  },
  analytics: {
    title: "ANALYTICS",
    items: [
      { label: "Performance", path: "/business/dashboard/analytics/performance" },
      { label: "Review insights", path: "/business/dashboard/analytics/reviews" },
      { label: "Engagement", path: "/business/dashboard/analytics/engagement" },
    ],
  },
  integrations: {
    title: "INTEGRATIONS",
    items: [
      { label: "Ecommerce", path: "/business/dashboard/integrations/ecommerce" },
      { label: "Payment & CRM", path: "/business/dashboard/integrations/payments" },
      { label: "Developers", path: "/business/dashboard/integrations/dev" },
      { label: "Marketing", path: "/business/dashboard/integrations/marketing" },
      { label: "Customer support", path: "/business/dashboard/integrations/support" },
    ],
  },
  settings: {
    title: "SETTINGS",
    items: [
      { label: "Overview", path: "/business/dashboard/settings" },
    ],
    groups: [
      {
        title: "Invitation settings",
        items: [
          { label: "Email settings", path: "/business/dashboard/settings/invitations/email" },
          { label: "Time & delivery", path: "/business/dashboard/settings/invitations/time" },
          { label: "Legal notice", path: "/business/dashboard/settings/invitations/legal" },
          { label: "Consumer privacy", path: "/business/dashboard/settings/invitations/privacy" },
        ],
      },
      {
        title: "Business settings",
        items: [
          { label: "Users", path: "/business/dashboard/settings/business/users" },
          { label: "Data consent", path: "/business/dashboard/settings/business/consent" },
        ],
      },
      {
        title: "Public profile settings",
        items: [
          { label: "Profile page", path: "/business/dashboard/settings/public/profile" },
          { label: "Categories", path: "/business/dashboard/settings/public/categories" },
          { label: "Locations", path: "/business/dashboard/settings/public/locations" },
          { label: "Reference number", path: "/business/dashboard/settings/public/reference" },
        ],
      },
      {
        title: "Personal settings",
        items: [
          { label: "My details", path: "/business/dashboard/settings/personal/details" },
          { label: "Email notifications", path: "/business/dashboard/settings/personal/notifications" },
        ],
      },
    ],
  },
};

function InnerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user, isBusiness } = useBusinessAuth();
  const { setBusinesses, selectedBusiness, setSelectedBusiness } = useBusinessContext();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const { businesses, loading: bizLoading } = useBusinesses(user?.id ?? null);

  // Business dashboard is for business users only. Consumers must use consumer dashboard.
  useEffect(() => {
    if (!loading && user && !isBusiness) {
      router.replace("/dashboard");
    }
  }, [loading, user, isBusiness, router]);

  useEffect(() => {
    setBusinesses(businesses);

    // Default selection to first business
    if (!selectedBusiness && businesses.length > 0) {
      setSelectedBusiness(businesses[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/business/login");
    }
  }, [loading, user, router]);

  // Auto-detect active section from pathname
  useEffect(() => {
    if (pathname) {
      if (pathname.includes("/get-reviews/")) {
        setActiveSection("get-reviews");
      } else if (pathname.includes("/share/")) {
        setActiveSection("share");
      } else if (pathname.includes("/analytics/")) {
        setActiveSection("analytics");
      } else if (pathname.includes("/integrations/")) {
        setActiveSection("integrations");
      } else if (pathname.includes("/settings/")) {
        setActiveSection("settings");
      } else {
        // Only clear if we're not on a section page
        if (
          !pathname.includes("/get-reviews") &&
          !pathname.includes("/share") &&
          !pathname.includes("/analytics") &&
          !pathname.includes("/integrations") &&
          !pathname.includes("/settings")
        ) {
          setActiveSection(null);
        }
      }
    }
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F4F0] flex items-center justify-center text-black/60">
        Loading…
      </div>
    );
  }

  if (!user) return null;

  // Only business users (with business_profiles) may access; consumers are redirected above
  if (!isBusiness) return null;

  const secondarySidebarData = activeSection ? NAV_SECTIONS[activeSection] : null;

  return (
    <div className="min-h-screen flex bg-[#F8F4F0]">
      <div
        className="flex shrink-0"
        onMouseLeave={() => setActiveSection(null)}
      >
        <Sidebar
          pathname={pathname || ""}
          bizLoading={bizLoading}
          onSectionSelect={setActiveSection}
          activeSection={activeSection}
        />
        {secondarySidebarData && (
          <div className="shrink-0 flex flex-col min-h-screen self-stretch">
            <SecondarySidebar
              title={secondarySidebarData.title}
              items={secondarySidebarData.items}
              groups={secondarySidebarData.groups}
            />
          </div>
        )}
      </div>
      <main className="flex-1">
        <TopBar />
        <div className="px-10 py-8">{children}</div>
      </main>
    </div>
  );
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <BusinessProvider>
      <InnerShell>{children}</InnerShell>
    </BusinessProvider>
  );
}
