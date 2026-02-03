"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  Home,
  MessageSquare,
  Send,
  Share2,
  BarChart2,
  Plug,
  Settings,
  ChevronRight,
} from "lucide-react";

import NavItem from "./NavItem";
import BusinessSwitcher from "./BusinessSwitcher";

const NAV = {
  top: [
    { label: "Home", icon: Home, path: "/business/dashboard" },
    { label: "Manage reviews", icon: MessageSquare, path: "/business/dashboard/manage-reviews" },
  ],
  sections: [
    {
      label: "Get reviews",
      icon: Send,
      key: "get-reviews",
      items: [
        { label: "Overview", path: "/business/dashboard/get-reviews/overview" },
        { label: "Invitation methods", path: "/business/dashboard/get-reviews/invitation-methods" },
        { label: "Email templates", path: "/business/dashboard/get-reviews/email-templates" },
        { label: "Invitation status", path: "/business/dashboard/get-reviews/invitation-status" },
      ],
    },
    {
      label: "Share & promote",
      icon: Share2,
      key: "share",
      items: [
        { label: "Website widgets", path: "/business/dashboard/share/widgets" },
        { label: "Email widgets", path: "/business/dashboard/share/email" },
        { label: "Social", path: "/business/dashboard/share/social" },
        { label: "Marketing assets", path: "/business/dashboard/share/assets" },
      ],
    },
    {
      label: "Analytics",
      icon: BarChart2,
      key: "analytics",
      items: [
        { label: "Performance", path: "/business/dashboard/analytics/performance" },
        { label: "Review insights", path: "/business/dashboard/analytics/reviews" },
        { label: "Engagement", path: "/business/dashboard/analytics/engagement" },
      ],
    },
    {
      label: "Integrations",
      icon: Plug,
      key: "integrations",
      items: [
        { label: "Ecommerce", path: "/business/dashboard/integrations/ecommerce" },
        { label: "Payment & CRM", path: "/business/dashboard/integrations/payments" },
        { label: "Developers", path: "/business/dashboard/integrations/dev" },
        { label: "Marketing", path: "/business/dashboard/integrations/marketing" },
        { label: "Customer support", path: "/business/dashboard/integrations/support" },
      ],
    },
    {
      label: "Settings",
      icon: Settings,
      key: "settings",
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
  ],
};

function sectionKeyFromPath(pathname: string) {
  if (pathname.includes("/get-reviews/")) return "get-reviews";
  if (pathname.includes("/share/")) return "share";
  if (pathname.includes("/analytics/")) return "analytics";
  if (pathname.includes("/integrations/")) return "integrations";
  if (pathname.includes("/settings/")) return "settings";
  return "";
}

export default function Sidebar({
  pathname,
  bizLoading,
  onSectionSelect,
  activeSection,
}: {
  pathname: string;
  bizLoading: boolean;
  onSectionSelect?: (key: string | null) => void;
  activeSection?: string | null;
}) {
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

  return (
    <div className="flex">
      <aside className="w-80 bg-[#2fb2a8] text-white flex flex-col shrink-0">
        {/* Business nav bar: subdivision line is its bottom border, aligned with bottom of this section */}
        <div className="border-b border-white/15">
          <BusinessSwitcher loading={bizLoading} />
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
        {NAV.top.map((item) => {
          const isActive = pathname === item.path;
          return (
            <NavItem
              key={item.path}
              href={item.path}
              icon={<item.icon size={18} />}
              label={item.label}
              active={isActive}
            />
          );
        })}

        <div className="h-3" />

        {NAV.sections.map((section: any) => {
          const isActive = activeSection === section.key;
          const hasItems = !!(section.items || section.groups);

          // For sections with items, clicking toggles the secondary sidebar
          if (hasItems) {
            return (
              <button
                key={section.key}
                onClick={() => handleSectionClick(section.key, true)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition text-left ${
                  isActive
                    ? "bg-[#124541] text-white"
                    : "text-white/90 hover:bg-white/10"
                }`}
              >
                <section.icon size={18} />
                <span className="flex-1">{section.label}</span>
                <ChevronRight
                  size={16}
                  className={`transition-transform ${isActive ? "rotate-90" : ""}`}
                />
              </button>
            );
          }

          // Fallback for sections without items (shouldn't happen in our NAV structure)
          return (
            <NavItem
              key={section.key}
              href={`/business/dashboard/${section.key}`}
              icon={<section.icon size={18} />}
              label={section.label}
              active={pathname?.includes(`/${section.key}`)}
            />
          );
        })}
      </nav>

      {/* Subdivision line in line with bottom of nav bar (main sidebar only), same colour as nav */}
      <div className="border-t border-white/15" aria-hidden />
      </aside>
    </div>
  );
}
