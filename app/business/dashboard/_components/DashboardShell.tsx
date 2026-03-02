"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Sidebar from "./Sidebar";
import SecondarySidebar from "./SecondarySidebar";
import TopBar from "./TopBar";
import { BusinessProvider, useBusinessContext } from "../_context/BusinessContext";
import { useBusinesses } from "../_hooks/useBusinesses";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import PageLoadingOverlay from "./PageLoadingOverlay";

const NAV_SECTIONS: Record<string, { title: string; items?: any[]; groups?: any[] }> = {
  "manage-reviews": {
    title: "MANAGE REVIEWS",
    items: [
      { label: "Review Inbox", path: "/business/dashboard/manage-reviews" },
    ],
  },
  "get-reviews": {
    title: "GET REVIEWS",
    items: [
      { label: "Overview",         path: "/business/dashboard/get-reviews/overview" },
      { label: "Send invitation",  path: "/business/dashboard/get-reviews/invitation-methods" },
      { label: "Email templates",  path: "/business/dashboard/get-reviews/email-templates" },
    ],
  },
  widgets: {
    title: "WIDGETS",
    items: [
      { label: "Website widgets", path: "/business/dashboard/share/widgets" },
      { label: "Email widgets",   path: "/business/dashboard/share/email" },
    ],
  },
  share: {
    title: "PROMOTE REVIEWS",
    items: [
      { label: "Social Marketing", path: "/business/dashboard/share/social" },
    ],
  },
  analytics: {
    title: "ANALYTICS",
    items: [
      { label: "Performance", path: "/business/dashboard/analytics/performance" },
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
      { label: "Business Profile", path: "/business/dashboard/settings/business-profile" },
      { label: "Invite Settings",  path: "/business/dashboard/settings/invite-settings" },
      { label: "Team Access",      path: "/business/dashboard/settings/team-access" },
      { label: "Notifications",    path: "/business/dashboard/settings/notifications" },
      { label: "Account",          path: "/business/dashboard/settings/account" },
    ],
  },
};

function InnerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, user, isBusiness } = useBusinessAuth();
  const { setBusinesses, selectedBusiness, setSelectedBusiness, setIsLoading, businesses, pageLoading, setPageLoading } = useBusinessContext() as any;
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const prevPathnameRef = React.useRef<string | null>(null);

  const { businesses: ownedBusinesses, loading: bizLoading } = useBusinesses(user?.id ?? null);

  useEffect(() => {
    setIsLoading(bizLoading);
  }, [bizLoading, setIsLoading]);

  // Show page loading overlay on route change
  useEffect(() => {
    if (prevPathnameRef.current !== null && prevPathnameRef.current !== pathname) {
      setPageLoading(true);
      const timer = setTimeout(() => setPageLoading(false), 600);
      prevPathnameRef.current = pathname;
      return () => clearTimeout(timer);
    }
    prevPathnameRef.current = pathname;
  }, [pathname, setPageLoading]);

  // Business dashboard is for business users only. Consumers must use consumer dashboard.
  useEffect(() => {
    if (!loading && user && !isBusiness) {
      router.replace("/dashboard");
    }
  }, [loading, user, isBusiness, router]);

  useEffect(() => {
    setBusinesses(ownedBusinesses);

    // Default selection to first business
    if (!selectedBusiness && ownedBusinesses.length > 0) {
      setSelectedBusiness(ownedBusinesses[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedBusinesses]);

  // Restore or auto-select business when none is selected
  useEffect(() => {
    const restoreBusiness = async () => {
      if (!user?.id) return;
      if (selectedBusiness) return;

      // 1) Try localStorage
      if (typeof window !== "undefined") {
        const storedId = window.localStorage.getItem("selectedBusinessId");
        if (storedId) {
          const match = businesses?.find?.((b: any) => b.id === storedId);
          if (match) {
            setSelectedBusiness(match);
            return;
          }
        }
      }

      // 2) Fallback to first business owned by user
      const { data } = await supabaseBrowser
        .from("businesses")
        .select("id, name, slug, website, plan")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (data?.id) {
        const autoBusiness = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          website: data.website,
          plan: data.plan,
        };
        setSelectedBusiness(autoBusiness);
        setBusinesses((prev: any[]) =>
          Array.isArray(prev) && prev.some((b) => b.id === autoBusiness.id)
            ? prev
            : [autoBusiness, ...(prev || [])]
        );
        if (typeof window !== "undefined") {
          window.localStorage.setItem("selectedBusinessId", data.id);
        }
      }
    };

    restoreBusiness();
  }, [user?.id, selectedBusiness, setSelectedBusiness, setBusinesses, businesses]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/business/login");
    }
  }, [loading, user, router]);

  // Auto-detect active section from pathname
  useEffect(() => {
    if (!pathname) return;
    if (pathname.includes("/analytics")) {
      setActiveSection("analytics");
    } else if (pathname.includes("/get-reviews")) {
      setActiveSection("get-reviews");
    } else if (pathname.includes("/share/widgets") || pathname.includes("/share/email")) {
      setActiveSection("widgets");
    } else if (pathname.includes("/share")) {
      setActiveSection("share");
    } else if (pathname.includes("/integrations")) {
      setActiveSection("integrations");
    } else if (pathname.includes("/settings")) {
      setActiveSection("settings");
    } else if (pathname.includes("/manage-reviews")) {
      setActiveSection("manage-reviews");
    } else {
      // Default: highlight Analytics when landing on /business/dashboard
      setActiveSection("analytics");
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
      <main className="flex-1 relative">
        <TopBar />
        <div className="px-10 py-8">{children}</div>
        {pageLoading && <PageLoadingOverlay />}
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
