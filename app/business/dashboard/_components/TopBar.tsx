"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Bell, Info, LogOut, Settings, CreditCard } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { isAbortError } from "@/lib/authErrors";

const TOPBAR_USER_CACHE = "tellacity_dashboard_topbar_user";

type CachedUser = {
  id: string;
  email: string | null;
  display_name: string | null;
  business_name: string | null;
};

function readCachedUser(): CachedUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(TOPBAR_USER_CACHE);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<CachedUser>;
    if (!p?.id) return null;
    return {
      id: p.id,
      email: p.email ?? null,
      display_name: p.display_name ?? null,
      business_name: p.business_name ?? null,
    };
  } catch {
    return null;
  }
}

function writeCachedUser(u: CachedUser) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(TOPBAR_USER_CACHE, JSON.stringify(u));
  } catch {
    // ignore
  }
}

function pickDisplayName(row: {
  display_name: string | null;
  business_name: string | null;
  email: string | null;
}): string {
  const a = row.display_name?.trim();
  if (a) return a;
  const b = row.business_name?.trim();
  if (b) return b;
  const e = row.email?.trim();
  if (e) return e.split("@")[0] || "User";
  return "User";
}

function initialsFromRow(row: {
  display_name: string | null;
  business_name: string | null;
  email: string | null;
}): string {
  const primary =
    row.display_name?.trim() ||
    row.business_name?.trim() ||
    row.email?.trim() ||
    "";
  if (!primary) return "U";
  if (primary.includes("@")) {
    const local = primary.split("@")[0];
    if (local.length >= 2) return local.slice(0, 2).toUpperCase();
    return primary[0]?.toUpperCase() || "U";
  }
  const words = primary.split(/\s+/).filter((w) => /^[A-Za-z]/.test(w));
  if (words.length >= 2) {
    return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase().slice(0, 2);
  }
  if (words.length === 1) {
    const w = words[0];
    return w.slice(0, Math.min(2, w.length)).toUpperCase();
  }
  return primary.slice(0, 2).toUpperCase();
}

type TopBarProps = {
  /** From `useBusinessAuth` — always set when the dashboard shell renders the bar. */
  sessionUserId?: string | null;
  sessionEmail?: string | null;
};

export default function TopBar({
  sessionUserId,
  sessionEmail,
}: TopBarProps) {
  const router = useRouter();
  const [user, setUser] = useState<CachedUser | null>(null);
  const [userInitials, setUserInitials] = useState<string>("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  const sessionEmailNorm = useMemo(
    () => (typeof sessionEmail === "string" ? sessionEmail.trim() : "") || null,
    [sessionEmail],
  );

  const displayName = useMemo(() => {
    if (!user) {
      if (sessionEmailNorm) return sessionEmailNorm.split("@")[0] || "User";
      return "User";
    }
    return pickDisplayName(user);
  }, [user, sessionEmailNorm]);

  const emailLine = user?.email ?? sessionEmailNorm;

  useEffect(() => {
    const applyRow = (row: CachedUser) => {
      setUser(row);
      writeCachedUser(row);
      setUserInitials(initialsFromRow(row));
    };

    const mergeMetadataAndProfile = async (
      sessionUser: {
        id: string;
        email?: string | null;
        user_metadata?: Record<string, unknown>;
      },
      existingBusinessName: string | null,
    ) => {
      const md = sessionUser.user_metadata ?? {};
      const fromMeta =
        (md.display_name as string | undefined)?.trim() ||
        (md.full_name as string | undefined)?.trim() ||
        (md.name as string | undefined)?.trim() ||
        null;

      let businessName = existingBusinessName;
      if (!businessName) {
        const { data: bp } = await supabaseBrowser()
          .from("business_profiles")
          .select("business_name, email")
          .eq("id", sessionUser.id)
          .maybeSingle();
        const bn =
          bp && typeof bp === "object" && "business_name" in bp
            ? (bp as { business_name: string | null }).business_name
            : null;
        businessName = bn?.trim() ? bn.trim() : null;
      }

      const email =
        (sessionUser.email && String(sessionUser.email).trim()) ||
        sessionEmailNorm ||
        null;

      applyRow({
        id: sessionUser.id,
        email,
        display_name: fromMeta,
        business_name: businessName,
      });
    };

    const loadUser = async () => {
      const supabase = supabaseBrowser();

      const cached = readCachedUser();
      const seedId = sessionUserId ?? cached?.id;
      const seedEmail = sessionEmailNorm ?? cached?.email ?? null;

      if (seedId && (seedEmail || cached?.display_name || cached?.business_name)) {
        applyRow({
          id: seedId,
          email: seedEmail,
          display_name: cached?.display_name ?? null,
          business_name: cached?.business_name ?? null,
        });
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
            // fall through to getUser
          }
        }
        // Do not return — try getUser below
      }

      if (session?.user) {
        await mergeMetadataAndProfile(session.user, cached?.business_name ?? null);
        return;
      }

      try {
        const { data: userData, error } = await supabase.auth.getUser();
        if (error) throw error;
        const u = userData?.user;
        if (u) {
          await mergeMetadataAndProfile(
            {
              id: u.id,
              email: u.email,
              user_metadata: u.user_metadata as Record<string, unknown>,
            },
            cached?.business_name ?? null,
          );
          return;
        }
      } catch (e) {
        if (isAbortError(e)) {
          await new Promise((r) => setTimeout(r, 300));
          try {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) {
              await mergeMetadataAndProfile(data.session.user, cached?.business_name ?? null);
            }
          } catch {
            /* ignore */
          }
        } else {
          console.error("[TopBar] getUser", e);
        }
      }

      if (seedId && sessionEmailNorm) {
        applyRow({
          id: seedId,
          email: sessionEmailNorm,
          display_name: cached?.display_name ?? null,
          business_name: cached?.business_name ?? null,
        });
      }
    };

    void loadUser();

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
      void mergeMetadataAndProfile(session.user, null);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [sessionUserId, sessionEmailNorm]);

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

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (logoutPending) return;
    setLogoutPending(true);
    setIsUserMenuOpen(false);
    setIsNotificationsOpen(false);

    const supabase = supabaseBrowser();
    try {
      const { error: globalErr } = await supabase.auth.signOut({ scope: "global" });
      if (globalErr && !isAbortError(globalErr)) {
        console.error("Error during logout (global):", globalErr);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.error("Error during logout:", error);
      }
    }
    try {
      await supabase.auth.signOut({ scope: "local" });
    } catch {
      /* ensure in-memory session cleared even if global sign-out was slow */
    }

    try {
      sessionStorage.removeItem(TOPBAR_USER_CACHE);
      window.localStorage.removeItem("selectedBusinessId");
      window.localStorage.removeItem("selectedBusiness");
    } catch {
      // ignore
    }

    window.location.assign("/business/login");
  };

  const initialsShown =
    userInitials ||
    initialsFromRow({
      display_name: null,
      business_name: null,
      email: sessionEmailNorm,
    });

  return (
    <div className="sticky top-0 z-[200] isolate bg-white border-b border-gray-200">
      <div className="h-16 flex items-center justify-end px-10 gap-3">
        <button
          type="button"
          className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center"
        >
          <Info size={18} className="text-gray-500" />
        </button>

        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="h-9 w-9 rounded-full hover:bg-gray-100 flex items-center justify-center relative"
          >
            <Bell size={18} className="text-gray-500" />
            <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center">
              6
            </span>
          </button>

          {isNotificationsOpen && (
            <div
              className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-[210]"
              onMouseDown={(ev) => ev.stopPropagation()}
            >
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-sm">Notifications</h3>
                <button type="button" className="text-xs text-[#124541] hover:underline">
                  Mark all as read
                </button>
              </div>
              <div className="py-2">
                {[
                  {
                    title: "You've logged in 5 times!",
                    description:
                      "Let reviews run themselves by automating your requests. Want to learn more? Head to our support articles.",
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
                    description:
                      "Adding your registration address helps us bring you the best experience on Tellacity.",
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
            type="button"
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="h-10 w-10 rounded-full bg-[#124541] text-white flex items-center justify-center font-semibold hover:ring-2 hover:ring-[#124541]/20 transition"
          >
            {initialsShown || "U"}
          </button>

          {isUserMenuOpen && (
            <div
              className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-[210]"
              onMouseDown={(ev) => ev.stopPropagation()}
              role="menu"
              aria-label="Account menu"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#124541] text-white flex items-center justify-center font-semibold">
                    {initialsShown || "U"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-gray-900 truncate">{displayName}</div>
                    <div className="text-xs text-gray-500 truncate">{emailLine || "—"}</div>
                  </div>
                </div>
              </div>
              <div className="py-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    router.push("/business/dashboard/billing");
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <CreditCard size={16} className="text-gray-400" />
                  Plans & billing
                </button>
                <button
                  type="button"
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
                  type="button"
                  disabled={logoutPending}
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 disabled:opacity-60"
                >
                  <LogOut size={16} className="text-gray-400" />
                  {logoutPending ? "Signing out…" : "Log out"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
