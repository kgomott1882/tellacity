"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "./Sidebar";
import SecondarySidebar from "./SecondarySidebar";
import TopBar from "./TopBar";
import BusinessSwitcher from "./BusinessSwitcher";
import { NAV_ITEMS } from "./Sidebar";
import {
  BusinessProvider,
  useBusinessContext,
  type DashboardBusiness,
} from "../_context/BusinessContext";
import { useBusinesses } from "../_hooks/useBusinesses";
import { useBusinessAuth } from "@/lib/useBusinessAuth";
import { ensureSessionFresh } from "@/lib/ensureSessionFresh";
import { getPostLoginPath } from "@/lib/postLoginRedirect";
import PageLoadingOverlay from "./PageLoadingOverlay";
import BusinessOnboardingModal from "./BusinessOnboardingModal";
import { logDashboardActivityClient } from "@/lib/logDashboardActivityClient";

function dashboardViewActionFromPath(pathname: string): string | null {
  if (pathname.includes("/analytics")) return "analytics_viewed";
  if (pathname.includes("/manage-reviews")) return "reviews_viewed";
  if (pathname.includes("/get-reviews")) return "invitations_viewed";
  if (pathname.includes("/share/widgets") || pathname.includes("/share/email")) return "widgets_viewed";
  if (pathname.includes("/integrations")) return "integrations_viewed";
  if (pathname.includes("/billing")) return "billing_viewed";
  if (pathname.includes("/settings")) return "settings_viewed";
  return null;
}

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
      { label: "Overview", path: "/business/dashboard/get-reviews/overview" },
      { label: "Send invitation", path: "/business/dashboard/get-reviews/invitation-methods" },
      { label: "Email templates", path: "/business/dashboard/get-reviews/email-templates" },
    ],
  },
  widgets: {
    title: "WIDGETS",
    items: [
      { label: "Website widgets", path: "/business/dashboard/share/widgets" },
      { label: "Email widgets", path: "/business/dashboard/share/email" },
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
    groups: [
      {
        title: "BUSINESS",
        items: [
          { label: "Business Profile", path: "/business/dashboard/settings/business-profile" },
          { label: "Team Access", path: "/business/dashboard/settings/team-access" },
          { label: "Notifications", path: "/business/dashboard/settings/notifications" },
        ],
      },
      {
        title: "ACCOUNT",
        items: [
          { label: "User Account", path: "/business/dashboard/settings/account" },
        ],
      },
      {
        title: "BILLING",
        items: [
          { label: "Pricing Plans", path: "/business/dashboard/settings/usage" },
          { label: "Billing Settings", path: "/business/dashboard/settings/billing-profile" },
          { label: "Payment History", path: "/business/dashboard/billing" },
        ],
      },
    ],
  },
};

function DashboardMainSkeleton() {
  return (
    <div
      className="mx-auto max-w-4xl space-y-4 py-2"
      aria-busy="true"
      aria-label="Loading workspace"
    >
      <div className="h-9 w-56 animate-pulse rounded-lg bg-gray-200/90" />
      <div className="h-48 animate-pulse rounded-xl bg-gray-100" />
      <div className="h-32 animate-pulse rounded-xl bg-gray-100" />
    </div>
  );
}

function InnerShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading: authLoading, user } = useBusinessAuth();
  const {
    setBusinesses,
    selectedBusiness,
    setSelectedBusiness,
    navRefreshKey,
    bumpNavRefresh,
  } = useBusinessContext();
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [mobileNavView, setMobileNavView] = useState<"main" | "sub">("main");
  const [mobileSubSection, setMobileSubSection] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const {
    businesses: ownedBusinesses,
    loading: bizLoading,
    error: bizError,
  } = useBusinesses(user?.id ?? null, navRefreshKey);

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

  const prevUserIdRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      prevUserIdRef.current = null;
      return;
    }
    if (prevUserIdRef.current !== null && prevUserIdRef.current !== user.id) {
      setSelectedBusiness(null);
      setBusinesses([]);
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("tc_selected_business");
          window.localStorage.removeItem("selectedBusiness");
          window.localStorage.removeItem("selectedBusinessId");
        }
      } catch (_) {}
    }
    prevUserIdRef.current = user.id;
  }, [user?.id, setSelectedBusiness, setBusinesses]);

  useEffect(() => {
    if (bizLoading) return;

    setBusinesses(ownedBusinesses);

    if (ownedBusinesses.length === 0) {
      setSelectedBusiness(null);
      return;
    }

    setSelectedBusiness((prev: DashboardBusiness | null) => {
      if (prev) {
        const match = ownedBusinesses.find((b) => b.id === prev.id);
        if (match) return match;
      }
      return ownedBusinesses[0];
    });
  }, [ownedBusinesses, bizLoading, setBusinesses, setSelectedBusiness]);

  // Redirect to login only after auth has settled and there is no session (don't redirect while loading).
  useEffect(() => {
    if (
      !authLoading &&
      !user &&
      !pathname?.includes("/integrations/connect-shopify") &&
      !pathname?.includes("/business/dashboard/billing/paystack-return")
    ) {
      router.replace("/business/login");
    }
  }, [authLoading, user, router, pathname]);

  // Consumer accounts (account_kind) must not stay on business URLs — same rule as post-login redirect.
  useEffect(() => {
    if (authLoading || !user?.id) return;
    let cancelled = false;
    void (async () => {
      const path = await getPostLoginPath(user.id);
      if (cancelled || path !== "/dashboard") return;
      window.location.href = `${window.location.origin}/dashboard`;
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user?.id]);

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
      setActiveSection("settings");
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

  const prevViewLogKey = React.useRef<string>("");

  // One `dashboard_login` row per Supabase sign-in × business (bell + admin counts use this).
  // Dedupe with sessionStorage so refreshes don't spam. Key includes `last_sign_in_at` so each
  // new sign-in gets a new row; without it we fell back to one log per tab (legacy key).
  useEffect(() => {
    if (!selectedBusiness?.id || !user?.id || !pathname?.startsWith("/business/dashboard")) return;
    const signAt = user.last_sign_in_at?.trim() || "";
    try {
      const key = signAt
        ? `tc_dash_login_${selectedBusiness.id}_${user.id}_${signAt}`
        : `tc_dash_login_${selectedBusiness.id}_${user.id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
      logDashboardActivityClient({
        businessId: selectedBusiness.id,
        action: "dashboard_login",
      });
    } catch {
      /* ignore */
    }
  }, [selectedBusiness?.id, user?.id, user?.last_sign_in_at, pathname]);

  useEffect(() => {
    if (!selectedBusiness?.id || !user?.id || !pathname) return;
    if (!pathname.startsWith("/business/dashboard")) return;
    const dedupeKey = `${selectedBusiness.id}|${pathname}`;
    if (prevViewLogKey.current === dedupeKey) return;
    prevViewLogKey.current = dedupeKey;
    const act = dashboardViewActionFromPath(pathname);
    if (!act) return;
    logDashboardActivityClient({
      businessId: selectedBusiness.id,
      action: act,
    });
  }, [pathname, selectedBusiness?.id, user?.id]);

  const isConnectShopifyPage = pathname?.includes("/integrations/connect-shopify");
  const normalizedPath = (pathname ?? "").replace(/\/$/, "") || "";
  const isBillingCheckoutPage = normalizedPath === "/business/dashboard/billing/checkout";
  const isBillingPaystackReturnPage =
    normalizedPath === "/business/dashboard/billing/paystack-return";
  const emailStr = user?.email?.trim() ?? "";
  const needsOnboarding = !selectedBusiness;

  // Session only: full-screen loader. Business list loads inside the shell so navigation is not blocked for minutes.
  if (!isConnectShopifyPage && !isBillingPaystackReturnPage) {
    if (authLoading) {
      return <PageLoadingOverlay />;
    }
    if (!user) {
      return <PageLoadingOverlay />;
    }
  }

  const secondarySidebarData = activeSection ? NAV_SECTIONS[activeSection] : null;

  /** Pay step: no dashboard chrome so the checkout card is the only focus. */
  if (isBillingCheckoutPage) {
    if (authLoading || !user) {
      return <PageLoadingOverlay />;
    }
    return (
      <div className="flex min-h-screen flex-col bg-[#F8F4F0]">
        <BusinessOnboardingModal
          open={onboardingOpen}
          onClose={() => setOnboardingOpen(false)}
          userEmail={emailStr}
          onCompleted={async () => {
            await ensureSessionFresh();
            bumpNavRefresh();
          }}
        />
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          {children}
        </main>
      </div>
    );
  }

  // Return from Paystack should not force dashboard auth redirect mid-verify.
  if (isBillingPaystackReturnPage) {
    return (
      <div className="flex min-h-screen flex-col bg-[#F8F4F0]">
        <main className="flex flex-1 flex-col items-center justify-center px-4 py-10">
          {children}
        </main>
      </div>
    );
  }

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
      <BusinessOnboardingModal
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        userEmail={emailStr}
        onCompleted={async () => {
          await ensureSessionFresh();
          bumpNavRefresh();
        }}
      />
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
            {isConnectShopifyPage ? (
              <div key={pathname} className="min-w-0">
                {children}
              </div>
            ) : (
              <>
                {bizError && !bizLoading ? (
                  <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 sm:flex-row sm:items-center sm:justify-between">
                    <p className="min-w-0">{bizError}</p>
                    <button
                      type="button"
                      onClick={() => bumpNavRefresh()}
                      className="shrink-0 rounded-lg bg-amber-900/90 px-4 py-2 font-medium text-white hover:bg-amber-900"
                    >
                      Retry
                    </button>
                  </div>
                ) : null}
                {bizLoading ? (
                  <DashboardMainSkeleton />
                ) : needsOnboarding && !bizError ? (
                  <div className="mx-auto max-w-lg rounded-xl border border-gray-200 bg-white px-6 py-10 text-center shadow-sm">
                    <div className="mb-6 flex justify-center">
                      <Image
                        src="/brand/Congrats.png"
                        alt="Welcome , your Tellacity Business journey starts here"
                        width={320}
                        height={240}
                        className="h-auto w-full max-w-[280px] object-contain"
                        priority
                      />
                    </div>
                    <p className="text-base font-semibold text-gray-900">Link or create a business</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Add a business to this account to use reviews, widgets, integrations, and settings.
                    </p>
                    <button
                      type="button"
                      onClick={() => setOnboardingOpen(true)}
                      className="mt-6 inline-flex rounded-lg bg-[#1FAF9E] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#169786]"
                    >
                      Get started
                    </button>
                  </div>
                ) : !needsOnboarding ? (
                  <div key={pathname} className="min-w-0">
                    {children}
                  </div>
                ) : null}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Mobile drawer overlay */}
      {mobileDrawerOpen && (
        <div className="fixed inset-x-0 bottom-0 top-[7.5rem] z-[190] lg:hidden">
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
                <nav className="flex-1 overflow-y-auto px-4 py-4">
                  {subData?.items?.length ? (
                    <div className="space-y-1">
                      {subData.items.map((item) => {
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
                    </div>
                  ) : null}
                  {subData?.groups?.length ? (
                    <div className="space-y-6">
                      {subData.groups.map((group: { title: string; items: { label: string; path: string }[] }) => (
                        <div key={group.title}>
                          <p className="px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/50">
                            {group.title}
                          </p>
                          <div className="mt-2 space-y-1">
                            {group.items.map((item: { label: string; path: string }) => {
                              const isActive = pathname === item.path;
                              return (
                                <Link
                                  key={item.path}
                                  href={item.path}
                                  onClick={handleMobileSubLinkClick}
                                  className={`flex items-center justify-between px-3 py-2.5 rounded-md transition ${
                                    isActive
                                      ? "bg-white/20 text-white font-medium"
                                      : "text-white/90 hover:bg-white/10"
                                  }`}
                                >
                                  <span>{item.label}</span>
                                  {!isActive && <ChevronRight size={16} className="text-white/60" />}
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}
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
