"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

const TITLES: Record<string, { title: string }> = {
  "/admin": { title: "Overview" },
  "/admin/users": { title: "Users" },
  "/admin/businesses": { title: "Businesses" },
  "/admin/customers": { title: "Business Customers" },
  "/admin/reviews": { title: "Reviews" },
  "/admin/blogs-and-articles": { title: "Blogs and Articles" },
  "/admin/system-status": { title: "System status" },
};

function titleForPath(pathname: string): string {
  if (pathname.includes("/admin/blogs-and-articles/") && pathname.endsWith("/edit")) {
    return "Edit article";
  }
  return TITLES[pathname]?.title ?? "Admin";
}

type AdminHeaderProps = {
  userEmail: string;
  onToggleSidebar?: () => void;
};

export default function AdminHeader({ userEmail, onToggleSidebar }: AdminHeaderProps) {
  const pathname = usePathname();
  const meta = { title: titleForPath(pathname) };
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      const supabase = supabaseBrowser();
      await supabase.auth.signOut();
    } finally {
      window.location.href = "/auth/login";
    }
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-3 sm:px-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 hover:bg-neutral-50 lg:hidden"
          aria-label="Toggle sidebar"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-5 w-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 6h18" />
            <path d="M3 12h18" />
            <path d="M3 18h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-base font-semibold text-neutral-900">{meta.title}</h1>
          <p className="hidden text-xs text-neutral-500 sm:block">Operations console</p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        {userEmail ? (
          <p className="hidden max-w-[220px] truncate text-xs text-neutral-600 sm:block" title={userEmail}>
            {userEmail}
          </p>
        ) : null}
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="inline-flex items-center rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? "Logging out..." : "Log out"}
        </button>
      </div>
    </header>
  );
}
