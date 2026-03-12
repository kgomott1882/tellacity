"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "./Sidebar";
import SecondarySidebar from "./SecondarySidebar";
import TopBar from "./TopBar";
import BusinessSwitcher from "./BusinessSwitcher";
import { NAV_ITEMS } from "./Sidebar";
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileNavView, setMobileNavView] = useState<"main" | "sub">("main");
  const [mobileSubSection, setMobileSubSection] = useState<string | null>(null);
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
      const supabase = supabaseBrowser();
      const { data } = await supabase
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

  // Close drawer when route changes (after user navigates via a sub-link). Must be before any early return.
  const prevPathRef = React.useRef(pathname);
  useEffect(() => {
    if (prevPathRef.current !== pathname) {
      prevPathRef.current = pathname;
      setMobileDrawerOpen(false);
      setMobileNavView("main");
      setMobileSubSection(null);
    }
  }, [pathname]);

  if (loading) {
    return <PageLoadingOverlay />;
  }

  if (!user) return null;

  // Only business users (with business_profiles) may access; consumers are redirected above
  if (!isBusiness) return null;

  const secondarySidebarData = activeSection ? NAV_SECTIONS[activeSection] : null;

  const closeDrawer = () => {
    setMobileDrawerOpen(false);
    setMobileNavView("main");
    setMobileSubSection(null);
  };

  const handleMobileSectionTap = (key: string) => {
    setMobileSubSection(key);
    setMobileNavView("sub");
  };

  const handleMobileSubLinkClick = () => {
    closeDrawer();
  };

  const subData = mobileSubSection ? NAV_SECTIONS[mobileSubSection] : null;

  return (
    <div className="min-h-screen flex bg-[#F8F4F0]">
      {/* Desktop: sidebars */}
      <div
        className="hidden lg:flex shrink-0"
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

      {/* Mobile: hamburger + main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="lg:hidden flex items-center gap-2 h-14 px-4 border-b border-gray-200 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            aria-label="Open menu"
          >
            <Menu size={24} />
          </button>
          <span className="text-sm font-medium text-gray-700 truncate">Menu</span>
        </div>
        <main className="flex-1 relative">
          <TopBar />
          <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8">{children}</div>
          {pageLoading && <PageLoadingOverlay />}
        </main>
      </div>

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeDrawer}
            aria-hidden
          />
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#2fb2a8] text-white flex flex-col shadow-xl">
            {mobileNavView === "main" ? (
              <>
                <div className="flex items-center justify-between px-4 h-14 border-b border-white/15 shrink-0">
                  <span className="font-semibold">Menu</span>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-2 rounded-lg text-white hover:bg-white/10"
                    aria-label="Close menu"
                  >
                    <X size={22} />
                  </button>
                </div>
                <div className="border-b border-white/15 px-4 py-3">
                  <BusinessSwitcher loading={bizLoading} />
                </div>
                <div className="px-4 pt-4 pb-2">
                  <Link href="/business/dashboard" onClick={closeDrawer} className="flex items-center">
                    <img
                      src="/brand/Tellacity%20-Business%20Logo.png"
                      alt="Tellacity"
                      className="h-[2rem] w-auto object-contain"
                    />
                  </Link>
                </div>
                <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const hasItems = item.items && item.items.length > 0;
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => hasItems && handleMobileSectionTap(item.key)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-white/90 hover:bg-white/10"
                      >
                        <Icon size={18} />
                        <span className="flex-1">{item.label}</span>
                        {hasItems && <ChevronRight size={16} className="text-white/80" />}
                      </button>
                    );
                  })}
                </nav>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 px-4 h-14 border-b border-white/15 shrink-0">
                  <button
                    type="button"
                    onClick={() => { setMobileNavView("main"); setMobileSubSection(null); }}
                    className="p-2 rounded-lg text-white hover:bg-white/10"
                    aria-label="Back"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <span className="flex-1 font-semibold uppercase tracking-wide text-sm">
                    {subData?.title ?? mobileSubSection}
                  </span>
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-2 rounded-lg text-white hover:bg-white/10"
                    aria-label="Close menu"
                  >
                    <X size={22} />
                  </button>
                </div>
                <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
                  {subData?.items?.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        href={item.path}
                        onClick={handleMobileSubLinkClick}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-md transition ${
                          isActive ? "bg-white/20 text-white font-medium" : "text-white/90 hover:bg-white/10"
                        }`}
                      >
                        <span>{item.label}</span>
                        {!isActive && <ChevronRight size={16} className="text-white/60" />}
                      </Link>
                    );
                  })}
                </nav>
              </>
            )}
          </div>
        </div>
      )}
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
