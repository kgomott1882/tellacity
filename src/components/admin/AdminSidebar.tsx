"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

// `badgeKey` identifies which live counter drives a notification dot next
// to the label.
//   - `photoUploads` fetches /api/admin/photo-uploads/count and shows the
//     number of photos still waiting on an approve/reject decision.
type NavItem = {
  href: string;
  label: string;
  badgeKey?: "photoUploads" | "articles";
};

const NAV_ITEMS: readonly NavItem[] = [
  { href: "/admin/business-activity", label: "Activity Feed" },
  { href: "/admin/users", label: "All Users" },
  { href: "/admin/articles", label: "Articles", badgeKey: "articles" },
  { href: "/admin/blogs-and-articles", label: "Blogs and Articles" },
  { href: "/admin/customers", label: "Business Customers" },
  { href: "/admin/business-insights", label: "Business Insights" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin", label: "Overview" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/photo-uploads", label: "Photo Uploads", badgeKey: "photoUploads" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/system-status", label: "System status" },
] as const;

const NAV = [...NAV_ITEMS].sort((a, b) =>
  a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
);

/** How often we re-check the pending photo queue count, in ms. */
const PHOTO_UPLOADS_POLL_MS = 60_000;
const ARTICLES_POLL_MS = 60_000;

type AdminSidebarProps = {
  isOpen?: boolean;
  onClose?: () => void;
};

export default function AdminSidebar({ isOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [pendingPhotoCount, setPendingPhotoCount] = useState<number>(0);
  const [pendingArticleCount, setPendingArticleCount] = useState<number>(0);

  // Poll the Photo Uploads queue count. The notification must stay on
  // while any photo is still awaiting a final decision, visiting the
  // page does NOT clear it, only approving/rejecting every pending photo
  // does, which will naturally drive this number to 0 on the next poll.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/photo-uploads/count", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const body = (await res.json()) as { pendingCount?: number };
        if (cancelled) return;
        setPendingPhotoCount(
          typeof body.pendingCount === "number" && body.pendingCount >= 0
            ? body.pendingCount
            : 0
        );
      } catch {
        // Silent, badge just won't update this tick.
      }
    };
    void load();
    const id = window.setInterval(load, PHOTO_UPLOADS_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pathname]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch("/api/admin/articles/count", { cache: "no-store" });
        if (!res.ok) return;
        const body = (await res.json()) as { pendingCount?: number };
        if (cancelled) return;
        setPendingArticleCount(
          typeof body.pendingCount === "number" && body.pendingCount >= 0
            ? body.pendingCount
            : 0,
        );
      } catch {
        /* silent */
      }
    };
    void load();
    const id = window.setInterval(load, ARTICLES_POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pathname]);

  const badgeCountFor = (key: NavItem["badgeKey"]): number => {
    if (key === "photoUploads") return pendingPhotoCount;
    if (key === "articles") return pendingArticleCount;
    return 0;
  };

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
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 lg:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden={!isOpen}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 transition-transform duration-200 lg:static lg:z-auto lg:w-56 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b border-zinc-800 px-4 py-5">
          <div className="flex items-center justify-between">
            <Link
              href="/admin"
              className="text-sm font-semibold tracking-tight text-white"
              onClick={onClose}
            >
              Tellacity Admin
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100 lg:hidden"
              aria-label="Close sidebar"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="mt-1 text-xs text-zinc-500">Internal</p>
        </div>
        <nav className="flex flex-col gap-0.5 p-2">
          {NAV.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            const badge = badgeCountFor(item.badgeKey);
            const displayBadge = badge > 99 ? "99+" : String(badge);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-100"
                }`}
              >
                <span>{item.label}</span>
                {badge > 0 ? (
                  <span
                    aria-label={`${badge} pending`}
                    className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-semibold leading-[1.25rem] text-white"
                  >
                    {displayBadge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-zinc-800 p-3">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-md border border-zinc-700 px-3 py-2 text-left text-xs font-medium text-zinc-300 hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
            <Link
              href="/"
              onClick={onClose}
              className="text-xs font-medium text-zinc-500 hover:text-zinc-300"
            >
              ← Back to site
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
