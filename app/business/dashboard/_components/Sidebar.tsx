"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  MessageSquare,
  Send,
  Share2,
  BarChart2,
  Plug,
  Settings,
  ChevronRight,
  LayoutTemplate,
  CreditCard,
} from "lucide-react";

import NavItem from "./NavItem";
import BusinessSwitcher from "./BusinessSwitcher";
import { useBusinessContext } from "../_context/BusinessContext";

// Single flat array - rendered in this exact order, no splits (exported for mobile drawer)
export const NAV_ITEMS = [
  {
    label: "Analytics",
    icon: BarChart2,
    key: "analytics",
    path: null,
    items: [
      { label: "Performance", path: "/business/dashboard/analytics/performance" },
    ],
  },
  {
    label: "Reviews",
    icon: MessageSquare,
    key: "manage-reviews",
    path: null,
    items: [
      { label: "Review Inbox", path: "/business/dashboard/manage-reviews" },
    ],
  },
  {
    label: "Invitations",
    icon: Send,
    key: "get-reviews",
    path: null,
    items: [
      { label: "Overview", path: "/business/dashboard/get-reviews/overview" },
      { label: "Send Invitations", path: "/business/dashboard/get-reviews/invitation-methods" },
      { label: "Email templates", path: "/business/dashboard/get-reviews/email-templates" },
    ],
  },
  {
    label: "Widgets",
    icon: LayoutTemplate,
    key: "widgets",
    path: null,
    items: [
      { label: "Website widgets", path: "/business/dashboard/share/widgets" },
      { label: "Email widgets",   path: "/business/dashboard/share/email" },
    ],
  },
  {
    label: "Promote Reviews",
    icon: Share2,
    key: "share",
    path: null,
    items: [
      { label: "Social", path: "/business/dashboard/share/social" },
    ],
  },
  {
    label: "Integrations",
    icon: Plug,
    key: "integrations",
    path: null,
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
  {
    label: "Settings",
    icon: Settings,
    key: "settings",
    path: null,
    items: [
      { label: "Business Profile", path: "/business/dashboard/settings/business-profile" },
      { label: "Team Access",      path: "/business/dashboard/settings/team-access" },
      { label: "Notifications",    path: "/business/dashboard/settings/notifications" },
      { label: "Account",          path: "/business/dashboard/settings/account" },
    ],
  },
  {
    label: "Billing",
    icon: CreditCard,
    key: "billing",
    path: "/business/dashboard/billing",
  },
];

function sectionKeyFromPath(pathname: string) {
  if (pathname.includes("/business/dashboard/billing")) return "";
  if (pathname.includes("/analytics")) return "analytics";
  if (pathname.includes("/manage-reviews")) return "manage-reviews";
  if (pathname.includes("/get-reviews")) return "get-reviews";
  if (pathname.includes("/share/widgets") || pathname.includes("/share/email")) return "widgets";
  if (pathname.includes("/share")) return "share";
  if (pathname.includes("/integrations")) return "integrations";
  if (pathname.includes("/settings")) return "settings";
  return "";
}

export default function Sidebar({
  pathname,
  onSectionSelect,
  activeSection,
}: {
  pathname: string;
  onSectionSelect?: (key: string | null) => void;
  activeSection?: string | null;
}) {
  const { bumpNavRefresh } = useBusinessContext() as any;

  useEffect(() => {
    const key = sectionKeyFromPath(pathname);
    if (key && onSectionSelect) {
      onSectionSelect(key);
    }
  }, [pathname, onSectionSelect]);

  const handleSectionClick = (key: string, hasItems: boolean) => {
    if (hasItems) {
      if (onSectionSelect) {
        onSectionSelect(activeSection === key ? null : key);
      }
    }
  };

  const handleTopNavClick = () => {
    bumpNavRefresh();
  };

  return (
    <div className="flex">
      <aside className="w-80 bg-[#2fb2a8] text-white flex flex-col shrink-0">
        {/* Business nav bar: subdivision line is its bottom border, aligned with bottom of this section */}
        <div className="border-b border-white/15">
          <BusinessSwitcher />
        </div>

      <div className="px-4 pt-5 pb-3">
        <Link href="/business/dashboard" className="flex items-center">
          <img
            src="/brand/Tellacity%20-Business%20Logo.png"
            alt="Tellacity"
            className="h-[2.4rem] w-auto object-contain"
          />
        </Link>
      </div>

      <nav className="flex-1 px-3 space-y-1 text-sm overflow-y-auto flex flex-col">
        {NAV_ITEMS.map((item) => {
          // Direct-link item (no sub-panel)
          if (item.path) {
            const isActive = pathname === item.path || pathname.startsWith(item.path + "/");
            return (
              <NavItem
                key={item.key}
                href={item.path}
                icon={<item.icon size={18} />}
                label={item.label}
                active={isActive}
                onClick={handleTopNavClick}
              />
            );
          }

          // Section item - clicking opens secondary sidebar
          const isActive = activeSection === item.key;
          return (
            <button
              key={item.key}
              onClick={() => handleSectionClick(item.key, true)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition text-left ${
                isActive
                  ? "bg-[#124541] text-white"
                  : "text-white/90 hover:bg-white/10"
              }`}
            >
              <item.icon size={18} />
              <span className="flex-1">{item.label}</span>
              <ChevronRight
                size={16}
                className={`transition-transform ${isActive ? "rotate-90" : ""}`}
              />
            </button>
          );
        })}
      </nav>

      {/* Subdivision line in line with bottom of nav bar (main sidebar only), same colour as nav */}
      <div className="border-t border-white/15" aria-hidden />
      </aside>
    </div>
  );
}
