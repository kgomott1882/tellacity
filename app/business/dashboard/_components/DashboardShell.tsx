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
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { normalizePlanCodeToKey } from "@/lib/plans";
import PageLoadingOverlay from "./PageLoadingOverlay";

const NAV_SECTIONS: Record<string, { title: string; items?: any[]; groups?: any[] }> = {
  "manage-reviews": {
    title: "REVIEWS",
    items: [
      { label: "Review Inbox", path: "/business/dashboard/manage-reviews" },
    ],
  },
  "get-reviews": {
    title: "INVITATIONS",
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
      { label: "All Integrations", path: "/business/dashboard/integrations" },
      { label: "Ecommerce", path: "/business/dashboard/integrations/ecommerce" },
      {
        label: "Marketing & Messaging",
        path: "/business/dashboard/integrations/marketing-and-messaging",
      },
      {
        label: "CRM & Sales",
        path: "/business/dashboard/integrations/crm-and-sales",
      },
      {
        label: "Support & Feedback Operations",
        path: "/business/dashboard/integrations/support-and-feedback-operations",
      },
      {
        label: "Enterprise Systems",
        path: "/business/dashboard/integrations/enterprise-systems",
      },
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
  const { loading: authLoading, user } = useBusinessAuth();
  const {
    setBusinesses,
    selectedBusiness,
    setSelectedBusiness,
    businesses,
  } = useBusinessContext() as any;
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileNavView, setMobileNavView] = useState<"main" | "sub">("main");
  const [mobileSubSection, setMobileSubSection] = useState<string | null>(null);

  const { businesses: ownedBusinesses, loading: bizLoading } = useBusinesses(user?.id ?? null);

  // Persist full selected business so we can restore it on back/forward
  useEffect(() => {
    if (typeof window === "undefined" || !selectedBusiness) return;
    try {
      window.localStorage.setItem("selectedBusinessId", selectedBusiness.id);
      window.localStorage.setItem("selectedBusiness", JSON.stringify(selectedBusiness));
    } catch (_) {}
  }, [selectedBusiness]);

  // Browser back/forward: restore business from localStorage
  useEffect(() => {
    const handlePopState = () => {
      try {
        const raw = typeof window !== "undefined" && window.localStorage.getItem("selectedBusiness");
        if (raw) {
          const parsed = JSON.parse(raw) as { id?: string; name?: string; slug?: string | null; website?: string | null; plan?: string | null };
          if (parsed?.id && parsed?.name) {
            setSelectedBusiness({
              id: parsed.id,
              name: parsed.name,
              slug: parsed.slug ?? null,
              website: parsed.website ?? null,
              plan: parsed.plan ?? null,
            });
          }
        }
      } catch (_) {}
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [setSelectedBusiness]);

  // Tab sleep / background: refresh JWT before user clicks around with an expired token.
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") {
        void ensureSessionFresh();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  // Do not auto-redirect when user is logged in. Let them stay so back button works; show message if not a business user.

  // Only sync context from hook after the businesses query settles. Avoid wiping the list with []
  // while bizLoading is true (race with localStorage restore / first paint).
  useEffect(() => {
    if (bizLoading) return;

    setBusinesses(ownedBusinesses);

    if (ownedBusinesses.length === 0) return;

    // Keep selection in sync: refresh from list if we have a matching business, or pick first if none selected
    if (selectedBusiness) {
      const match = ownedBusinesses.find((b) => b.id === selectedBusiness.id);
      if (match) setSelectedBusiness(match);
      return;
    }
    setSelectedBusiness(ownedBusinesses[0]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedBusinesses, bizLoading]);

  // Restore or auto-select business when none is selected (e.g. after full page load or back)
  useEffect(() => {
    const restoreBusiness = async () => {
      if (!user?.id) return;
      if (selectedBusiness) return;

      // 1) Restore from full object in localStorage immediately so the business name shows before the list loads
      if (typeof window !== "undefined") {
        const raw = window.localStorage.getItem("selectedBusiness");
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as { id?: string; name?: string; slug?: string | null; website?: string | null; plan?: string | null };
            if (parsed?.id && parsed?.name) {
              setSelectedBusiness({
                id: parsed.id,
                name: parsed.name,
                slug: parsed.slug ?? null,
                website: parsed.website ?? null,
                plan: parsed.plan ?? null,
              });
              return;
            }
          } catch (_) {}
        }
        // 2) If we have businesses list and stored id, use it
        const storedId = window.localStorage.getItem("selectedBusinessId");
        if (storedId && businesses?.length) {
          const match = businesses.find((b: any) => b.id === storedId);
          if (match) {
            setSelectedBusiness(match);
            return;
          }
        }
      }

      // 3) Fallback: fetch first business owned by user
      const supabase = supabaseBrowser();
      const { data } = await supabase
        .from("businesses")
        .select("id, name, slug, website")
        .eq("owner_id", user.id)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (data?.id) {
        const { data: subRows } = await supabase
          .from("subscriptions")
          .select("plan_code")
          .eq("business_id", data.id)
          .eq("status", "active")
          .limit(1);

        const autoBusiness = {
          id: data.id,
          name: data.name,
          slug: data.slug,
          website: data.website,
          plan: normalizePlanCodeToKey(subRows?.[0]?.plan_code ?? null),
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

  // Redirect to login only after auth has settled and there is no session (don't redirect while loading).
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/business/login");
    }
  }, [authLoading, user, router]);

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
    } else if (pathname.includes("/business/dashboard/billing")) {
      setActiveSection(null);
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

  const isConnectShopifyPage = pathname?.includes("/integrations/connect-shopify");

  // No session: full-screen loader until redirect to login (covers initial auth load + post-logout).
  if (!user && !isConnectShopifyPage) {
    return <PageLoadingOverlay />;
  }

  if (!selectedBusiness) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-sm text-gray-500">No business selected.</p>
      </div>
    );
  }

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
        className="hidden lg:flex shrink-0 sticky top-0 h-screen"
        onMouseLeave={() => setActiveSection(null)}
      >
        <Sidebar
          pathname={pathname || ""}
          onSectionSelect={setActiveSection}
          activeSection={activeSection}
        />
        {secondarySidebarData && (
          <div className="shrink-0 flex flex-col h-screen self-stretch">
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
          <TopBar sessionUserId={user?.id ?? null} sessionEmail={user?.email ?? null} />
          <div className="px-4 sm:px-6 lg:px-10 py-6 lg:py-8">
            <div
              key={pathname}
              className="min-w-0"
            >
              {children}
            </div>
          </div>
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
                  <BusinessSwitcher />
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
                    const hasItems = Boolean(item.items && item.items.length > 0);
                    if (item.path) {
                      const isActive =
                        pathname === item.path ||
                        pathname.startsWith(`${item.path}/`);
                      return (
                        <Link
                          key={item.key}
                          href={item.path}
                          onClick={closeDrawer}
                          className={`flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left ${
                            isActive
                              ? "bg-[#124541] font-medium text-white"
                              : "text-white/90 hover:bg-white/10"
                          }`}
                        >
                          <Icon size={18} />
                          <span className="flex-1">{item.label}</span>
                        </Link>
                      );
                    }
                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => hasItems && handleMobileSectionTap(item.key)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left text-white/90 hover:bg-white/10"
                      >
                        <Icon size={18} />
                        <span className="flex-1">{item.label}</span>
                        {hasItems ? <ChevronRight size={16} className="text-white/80" /> : null}
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
