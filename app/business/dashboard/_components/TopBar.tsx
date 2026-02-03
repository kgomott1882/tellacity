"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Bell, Info, LogOut, Settings, CreditCard, ChevronDown, X } from "lucide-react";
import { supabase } from "@/lib/supabaseBrowser";

export default function TopBar() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email: string | null; display_name: string | null } | null>(null);
  const [userInitials, setUserInitials] = useState<string>("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUser = async () => {
      let data: { user: typeof user } | null = null;
      try {
        const result = await supabase.auth.getUser();
        data = result.data;
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") return;
        throw e;
      }
      if (data?.user) {
        setUser({
          id: data.user!.id,
          email: data.user!.email,
          display_name: data.user!.user_metadata?.display_name || null,
        });
        const name = data.user!.user_metadata?.display_name as string | undefined;
        if (name) {
          setUserInitials(
            name
              .split(" ")
              .map((part: string) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          );
        } else {
          setUserInitials(data.user!.email?.[0]?.toUpperCase() || "U");
        }
      }
    };
    loadUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null;
      if (sessionUser) {
        setUser({
          id: sessionUser.id,
          email: sessionUser.email,
          display_name: sessionUser.user_metadata?.display_name || null,
        });
        const name = sessionUser.user_metadata?.display_name as string | undefined;
        if (name) {
          setUserInitials(
            name
              .split(" ")
              .map((part: string) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase()
          );
        } else {
          setUserInitials(sessionUser.email?.[0]?.toUpperCase() || "U");
        }
      } else {
        setUser(null);
        setUserInitials("");
      }
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
    await supabase.auth.signOut();
    router.push("/business/login");
  };

  const displayName = user?.display_name || user?.email?.split("@")[0] || "User";

  return (
    <div className="sticky top-0 z-10 bg-[#F8F4F0] border-b border-black/10">
      <div className="h-16 flex items-center justify-end px-10 gap-4">
        <button className="h-9 w-9 rounded-full hover:bg-black/5 flex items-center justify-center">
          <Info size={18} className="text-black/70" />
        </button>

        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="h-9 w-9 rounded-full hover:bg-black/5 flex items-center justify-center relative"
          >
            <Bell size={18} className="text-black/70" />
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
