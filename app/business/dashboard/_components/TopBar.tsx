"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Info, LogOut, Settings, CreditCard, RefreshCw } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";

const TOPBAR_USER_CACHE = "tellacity_dashboard_topbar_user";

function readCachedUser(): { id: string; email: string | null; display_name: string | null } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TOPBAR_USER_CACHE);
    if (!raw) return null;
    const p = JSON.parse(raw) as { id?: string; email?: string | null; display_name?: string | null };
    if (!p?.id) return null;
    return { id: p.id, email: p.email ?? null, display_name: p.display_name ?? null };
  } catch {
    return null;
  }
}

function writeCachedUser(u: { id: string; email: string | null; display_name: string | null }) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TOPBAR_USER_CACHE, JSON.stringify(u));
  } catch {
    // ignore
  }
}

function initialsFromUser(u: { email: string | null; display_name: string | null }): string {
  const name = u.display_name?.trim();
  if (name) {
    return name
      .split(/\s+/)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }
  const email = u.email?.trim();
  if (email) {
    const local = email.split("@")[0];
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return email[0]?.toUpperCase() || "U";
  }
  return "U";
}

export default function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string | null; display_name: string | null } | null>(null);
  const [userInitials, setUserInitials] = useState<string>("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const handleHardRefresh = () => {
    setIsRefreshing(true);
    // Ctrl+Shift+R equivalent: bypass cache and reload
    window.location.reload();
  };

  useEffect(() => {
    const applySessionUser = (sessionUser: {
      id: string;
      email?: string | null;
      user_metadata?: Record<string, unknown>;
    }) => {
      const displayName = (sessionUser.user_metadata?.display_name as string | undefined) ?? null;
      const row = {
        id: sessionUser.id,
        email: sessionUser.email ?? null,
        display_name: displayName,
      };
      setUser(row);
      writeCachedUser(row);
      setUserInitials(initialsFromUser(row));
    };

    const loadUser = async () => {
      const supabase = supabaseBrowser();
      const cached = readCachedUser();
      if (cached?.email) {
        setUser(cached);
        setUserInitials(initialsFromUser(cached));
      }

      let session: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"]["session"] = null;
      try {
        const { data } = await supabase.auth.getSession();
        session = data.session;
      } catch (e) {
        if (isAbortError(e)) {
          await new Promise((r) => setTimeout(r, 250));
          try {
            const { data } = await supabase.auth.getSession();
            session = data.session;
          } catch {
            return;
          }
        } else {
          console.error("[TopBar] getSession", e);
          return;
        }
      }

      if (session?.user) {
        applySessionUser(session.user);
        return;
      }

      try {
        const { data: userData } = await supabase.auth.getUser();
        const u = userData?.user;
        if (u) {
          applySessionUser({
            id: u.id,
            email: u.email,
            user_metadata: u.user_metadata as Record<string, unknown>,
          });
        }
      } catch (e) {
        if (isAbortError(e)) {
          await new Promise((r) => setTimeout(r, 300));
          const { data } = await supabase.auth.getSession();
          if (data.session?.user) applySessionUser(data.session.user);
        }
      }
    };

    loadUser();

    const { data: authListener } = supabaseBrowser().auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        setUser(null);
        setUserInitials("");
        try {
          sessionStorage.removeItem(TOPBAR_USER_CACHE);
        } catch {
          // ignore
        }
        return;
      }
      applySessionUser(session.user);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    try {
      await supabaseBrowser().auth.signOut();
    } catch (error) {
      if (!isAbortError(error)) {
        console.error("Error during logout:", error);
      }
      // Even if sign-out fails, continue redirect so the user is taken
      // out of the dashboard and a new session can be established.
    }

    try {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("selectedBusinessId");
      }
    } catch {
      // ignore storage errors
    }

    router.replace("/business/login");
  };

  const displayName = user?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
      <div className="h-16 flex items-center justify-end px-10 gap-3">
        <button
          type="button"
          onClick={handleHardRefresh}
          disabled={isRefreshing}
          title="Hard refresh (Ctrl+Shift+R)"
          className="inline-flex items-center gap-2 rounded-lg border-2 border-[#2fb2a8] bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-[#2fb2a8]/5 disabled:opacity-50 transition"
        >
          <RefreshCw
            size={14}
            className={`transition-transform duration-500 ${isRefreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </button>

        <button className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center">
          <Info size={18} className="text-gray-500" />
        </button>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center relative"
          >
            <Bell size={18} className="text-gray-500" />
            <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              6
            </span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <button className="text-xs text-[#124541] hover:underline">Mark all as read</button>
              </div>
              <div className="py-2">
                {[
                  {
                    title: "You've logged in 5 times!",
                    description: "Let reviews run themselves by automating your requests. Want to learn more? Head to our support articles.",
                    time: "4 minutes ago",
                  },
                  {
                    title: "Your public profile is incomplete",
                    description: "Add a logo and company description",
                    time: "4 minutes ago",
                  },
                  {
                    title: "Manage your company's categories",
                    description: "Select categories for your business",
                    time: "4 minutes ago",
                  },
                  {
                    title: "Confirm your business registration address",
                    description: "Adding your registration address helps us bring you the best experience on Tellacity.",
                    time: "4 minutes ago",
                  },
                ].map((notif, idx) => (
                  <div key={idx} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm text-gray-900">{notif.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{notif.description}</div>
                        <div className="text-xs text-gray-400 mt-1">{notif.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="h-10 w-10 rounded-full bg-[#124541] text-white flex items-center justify-center font-semibold hover:ring-2 hover:ring-[#124541]/20 transition"
          >
            {userInitials || "U"}
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#124541] text-white flex items-center justify-center font-semibold">
                    {userInitials || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{displayName}</div>
                    <div className="text-xs text-gray-500 truncate">{user?.email}</div>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/business/dashboard/settings/public/profile");
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <CreditCard size={16} className="text-gray-400" />
                  Plans & billing
                </button>
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/business/dashboard/settings/personal/details");
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Settings size={16} className="text-gray-400" />
                  Settings
                </button>
              </div>
              <div className="border-t border-gray-200 py-2">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <LogOut size={16} className="text-gray-400" />
                  Log out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
