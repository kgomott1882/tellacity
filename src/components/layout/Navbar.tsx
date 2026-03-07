"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { supabase } from "@/lib/supabaseClient";
import { isAbortError } from "@/lib/authErrors";
import { getActiveCountry, setActiveCountry } from "@/lib/getActiveCountry";

const FLAG_BASE = "https://purecatamphetamine.github.io/country-flag-icons/3x2";
const COUNTRIES = [
  { code: "US", name: "United States", flagUrl: `${FLAG_BASE}/US.svg` },
  { code: "GB", name: "United Kingdom", flagUrl: `${FLAG_BASE}/GB.svg` },
  { code: "ZA", name: "South Africa", flagUrl: `${FLAG_BASE}/ZA.svg` },
  { code: "AU", name: "Australia", flagUrl: `${FLAG_BASE}/AU.svg` },
  { code: "CA", name: "Canada", flagUrl: `${FLAG_BASE}/CA.svg` },
  { code: "NZ", name: "New Zealand", flagUrl: `${FLAG_BASE}/NZ.svg` },
  { code: "IE", name: "Ireland", flagUrl: `${FLAG_BASE}/IE.svg` },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [loginStep, setLoginStep] = useState<"form" | "check-email">("form");
  const [signupStep, setSignupStep] = useState<"form" | "check-email">("form");
  const [isLoginSubmitting, setIsLoginSubmitting] = useState(false);
  const [isSignupSubmitting, setIsSignupSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [userInitials, setUserInitials] = useState<string | null>(null);
  const [dashboardHref, setDashboardHref] = useState<string>("/dashboard");
  const [loginStatus, setLoginStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [signupStatus, setSignupStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const [countryCode, setCountryCode] = useState<string>("ZA");

  const activeCountry =
    COUNTRIES.find((item) => item.code === countryCode) ?? COUNTRIES[0];
  const isBusinessNav =
    pathname?.startsWith("/for-business") ||
    pathname?.startsWith("/pricing") ||
    pathname?.startsWith("/solution") ||
    pathname?.startsWith("/resources") ||
    pathname?.startsWith("/business");
  const isHomeNav = pathname === "/";
  const isAuthFlow =
    pathname?.startsWith("/auth/") ||
    pathname?.startsWith("/business/reset-password");

  // Sync country from URL or stored preference on mount (same default ZA as Footer)
  useEffect(() => {
    const fromUrl = searchParams.get("country");
    if (fromUrl) {
      setCountryCode(fromUrl);
      return;
    }
    const stored = getActiveCountry();
    setCountryCode(stored ?? "ZA");
  }, [searchParams]);

  // Stay in sync when country is changed from Footer or elsewhere
  useEffect(() => {
    const handler = () => {
      const code = getActiveCountry();
      if (code) setCountryCode(code);
    };
    window.addEventListener("tellacity-country-change", handler);
    return () => window.removeEventListener("tellacity-country-change", handler);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    if (!isUserMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserMenuOpen]);

  // Skip auth on landing page and auth/reset flows so we never
  // show dashboard access while a user is in the middle of a
  // password reset or similar sensitive flow.
  useEffect(() => {
    if (pathname === "/" || isAuthFlow) {
      setUserInitials(null);
      setDashboardHref("/dashboard");
      return;
    }
    const loadUser = async () => {
      try {
        let data: { user: { id: string; email?: string | null; user_metadata?: Record<string, unknown> } | null } | null = null;
        try {
          const result = await supabaseBrowser().auth.getUser();
          data = result.data;
        } catch (e) {
          if (isAbortError(e)) return;
          return;
        }
        const user = data?.user ?? null;
        if (!user) {
          setUserInitials(null);
          setDashboardHref("/dashboard");
          return;
        }
        const name = user.user_metadata?.display_name as string | undefined;
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
          setUserInitials(user.email?.[0]?.toUpperCase() ?? "U");
        }

        const supabase = supabaseBrowser();
        const { data: byId } = await supabase
          .from("business_profiles")
          .select("id")
          .eq("id", user.id)
          .maybeSingle();

        setDashboardHref(byId ? "/business/dashboard" : "/dashboard");
      } catch (_) {
        setUserInitials(null);
        setDashboardHref("/dashboard");
      }
    };
    loadUser();
  }, [pathname]);

  useEffect(() => {
    if (isLoginOpen) {
      setLoginStatus(null);
      setLoginStep("form");
    }
  }, [isLoginOpen]);

  useEffect(() => {
    if (isSignupOpen) {
      setSignupStatus(null);
      setSignupStep("form");
    }
  }, [isSignupOpen]);

  useEffect(() => {
    const supabase = supabaseBrowser();
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null;

        // During password reset / auth flows we always behave as if
        // logged out in the navbar – no dashboard access.
        if (!session || isAuthFlow) {
          setUserInitials(null);
          setDashboardHref("/dashboard");
          return;
        }

        if (user) {
          const name = user.user_metadata?.display_name as string | undefined;
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
            setUserInitials(user.email?.[0]?.toUpperCase() ?? "U");
          }
          (async () => {
            const supabase = supabaseBrowser();
            const { data: byId } = await supabase
              .from("business_profiles")
              .select("id")
              .eq("id", user.id)
              .maybeSingle();
            if (byId) {
              setDashboardHref("/business/dashboard");
              return;
            }
            const emailNorm = user.email?.trim().toLowerCase();
            if (emailNorm) {
              const { data: byEmail } = await supabase
                .from("business_profiles")
                .select("id")
                .eq("email", emailNorm)
                .maybeSingle();
              setDashboardHref(byEmail ? "/business/dashboard" : "/dashboard");
            } else {
              setDashboardHref("/dashboard");
            }
          })();
        } else {
          setUserInitials(null);
          setDashboardHref("/dashboard");
        }
        const shouldRedirect =
          window.localStorage.getItem("tellacity_auth_redirect") === "true" ||
          isLoginOpen ||
          isSignupOpen;
        if (shouldRedirect) {
          window.localStorage.removeItem("tellacity_auth_redirect");
          setIsLoginOpen(false);
          setIsSignupOpen(false);
          
          // Redirect by account type: business (by id or email) → business dashboard, else consumer
          if (!user) return;

          (async () => {
            const supabase = supabaseBrowser();
            const { data: byId } = await supabase
              .from("business_profiles")
              .select("id")
              .eq("id", user.id)
              .maybeSingle();

            if (byId) {
              router.push("/business/dashboard");
            }
          })();
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [isLoginOpen, isSignupOpen, router]);

  useEffect(() => {
    if (!isLoginOpen && !isSignupOpen) {
      return;
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLoginOpen(false);
        setIsSignupOpen(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [isLoginOpen, isSignupOpen]);

  const openCountryMenu = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    setIsCountryOpen(true);
  };

  const scheduleCountryClose = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
    }
    closeTimeoutRef.current = setTimeout(() => {
      setIsCountryOpen(false);
      closeTimeoutRef.current = null;
    }, 150);
  };

  const handleCountryChange = (code: string) => {
    // Persist for other UIs that still read local storage,
    // and broadcast the custom event for listeners.
    setCountryCode(code);
    setActiveCountry(code);

    const params = new URLSearchParams(searchParams.toString());
    params.set("country", code);

    router.push(`${pathname}?${params.toString()}`);
  };

  if (isBusinessNav) {
    return (
      <>
        <header className="w-full">
          <div className="sticky top-0 z-40 w-full bg-[#1FAF9E]">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-[72px] md:gap-6 md:px-6">
              <Link href="/for-business" className="flex items-center">
                <img
                  src="/brand/Tellacity%20-Business%20Logo.png"
                  alt="Tellacity Business"
                  className="h-7 w-auto md:h-9"
                />
              </Link>

              <nav className="hidden flex-1 items-center justify-center gap-8 text-sm md:flex">
                <Link
                  href="/for-business"
                  className={`border-b-2 pb-1 ${
                    pathname === "/for-business"
                      ? "border-white text-white"
                      : "border-transparent text-white/90 hover:border-white"
                  }`}
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="border-b-2 border-transparent pb-1 text-white/90 hover:border-white"
                >
                  Pricing
                </Link>
                <Link
                  href="/solution"
                  className="border-b-2 border-transparent pb-1 text-white/90 hover:border-white"
                >
                  Solution
                </Link>
                <Link
                  href="/resources"
                  className="border-b-2 border-transparent pb-1 text-white/90 hover:border-white"
                >
                  Resources
                </Link>
              </nav>

              <div className="flex items-center gap-2 md:gap-3">
                <Link
                  href="/business/login"
                  className="hidden text-sm text-white/90 hover:text-white md:inline-flex"
                >
                  Log in
                </Link>
                <Link
                  href="/business/signup"
                  className="hidden rounded-full border border-white/60 px-5 py-2 text-sm text-white hover:border-white md:inline-flex"
                >
                  Get Started
                </Link>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  className="inline-flex items-center justify-center p-1.5 text-white md:hidden"
                  aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
                >
                  {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
              </div>
            </div>
          </div>
        </header>

        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-30 md:hidden">
            <div
              className="absolute inset-0 bg-black/60"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#0E0E0E] p-5 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <Link
                  href="/for-business"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center"
                >
                  <img
                    src="/brand/Tellacity%20-Business%20Logo.png"
                    alt="Tellacity Business"
                    className="h-6 w-auto"
                  />
                </Link>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white p-1"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="text-white">
                <div className="mb-4">
                  <button
                    type="button"
                    className="flex items-center gap-2 text-xs font-medium"
                    onClick={() => setIsCountryOpen((prev) => !prev)}
                  >
                    <img
                      src={activeCountry.flagUrl}
                      alt={activeCountry.name}
                      className="h-3 w-5 object-cover"
                    />
                    <span>{activeCountry.name}</span>
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3 w-3 text-white/70"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </button>
                  {isCountryOpen && (
                    <div className="mt-2 rounded-md border border-white/10 bg-[#111] text-xs">
                      {COUNTRIES.map((item) => (
                        <button
                          key={item.code}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5"
                          onClick={() => {
                            handleCountryChange(item.code);
                            setIsCountryOpen(false);
                          }}
                        >
                          <img
                            src={item.flagUrl}
                            alt={item.name}
                            className="h-3 w-5 object-cover"
                          />
                          <span className="flex-1">{item.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="mb-4 border-t border-white/10" />
                <nav className="flex flex-col gap-4 text-sm">
                  <Link
                    href="/for-business"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={pathname === "/for-business" ? "text-[#1FAF9E]" : ""}
                  >
                    Features
                  </Link>
                  <Link
                    href="/pricing"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={pathname === "/pricing" ? "text-[#1FAF9E]" : ""}
                  >
                    Pricing
                  </Link>
                  <Link
                    href="/solution"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={pathname === "/solution" ? "text-[#1FAF9E]" : ""}
                  >
                    Solution
                  </Link>
                  <Link
                    href="/resources"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={pathname === "/resources" ? "text-[#1FAF9E]" : ""}
                  >
                    Resources
                  </Link>

                  <div className="my-6 border-t border-white/10" />

                  {userInitials && !isAuthFlow ? (
                    <Link
                      href={dashboardHref}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg bg-[#1FAF9E] px-4 py-3 text-center font-medium text-black"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link
                        href="/business/login"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        Log in
                      </Link>
                      <Link
                        href="/business/signup"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="rounded-lg bg-[#1FAF9E] px-4 py-3 text-center font-medium text-black"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </nav>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      <header className="w-full">
        <div
          className={`sticky top-0 z-40 w-full ${
            isHomeNav ? "bg-black" : "bg-[#0E0E0E]"
          }`}
        >
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:h-[72px] md:gap-6 md:px-6">
            <Link href="/" className="flex items-center">
              <img
                src="/brand/TELLACITY%20LOGO%202A.png"
                alt="Tellacity"
                className="h-5 w-auto md:h-[22px]"
              />
            </Link>

            <nav className="hidden flex-1 items-center justify-center gap-8 text-sm md:flex">
              <div
                className="relative"
                onMouseEnter={openCountryMenu}
                onMouseLeave={scheduleCountryClose}
              >
                <button
                  type="button"
                  className="flex items-center gap-2 border-b-2 border-transparent pb-1 text-sm text-white/80 hover:border-[#1FAF9E] hover:text-white"
                  onClick={() => setIsCountryOpen((prev) => !prev)}
                >
                  <img
                    src={activeCountry.flagUrl}
                    alt={activeCountry.name}
                    className="h-4 w-6 object-cover"
                  />
                  <span>{activeCountry.name}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {isCountryOpen && (
                  <div className="absolute left-0 top-7 z-50 w-48 rounded-lg border border-gray-200 bg-white py-2 text-xs text-[#0E0E0E] shadow-lg">
                    {COUNTRIES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                        onClick={() => {
                          handleCountryChange(item.code);
                          setIsCountryOpen(false);
                        }}
                      >
                        <img
                          src={item.flagUrl}
                          alt={item.name}
                          className="h-4 w-6 object-cover"
                        />
                        <span className="flex-1">{item.name}</span>
                        {item.code === activeCountry.code && (
                          <svg
                            viewBox="0 0 24 24"
                            className="h-4 w-4 text-[#1FAF9E]"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M20 6L9 17l-5-5" />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Link
                href="/write-review"
                className={`border-b-2 pb-1 ${
                  pathname === "/write-review"
                    ? "border-[#1FAF9E] text-white"
                    : "border-transparent text-white/80 hover:border-[#1FAF9E] hover:text-white"
                }`}
              >
                Write a Review
              </Link>
              <Link
                href="/categories"
                className={`border-b-2 pb-1 ${
                  pathname === "/categories"
                    ? "border-[#1FAF9E] text-white"
                    : "border-transparent text-white/80 hover:border-[#1FAF9E] hover:text-white"
                }`}
              >
                Categories
              </Link>
              <Link
                href="/for-business"
                className="rounded-full bg-[#1FAF9E] px-5 py-2 text-sm text-white hover:bg-[#169786]"
              >
                For Business
              </Link>
            </nav>

            <div className="flex items-center gap-2 md:gap-3">
              {userInitials && !isAuthFlow ? (
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen((prev) => !prev)}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm text-white hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]"
                    aria-label="Open account menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    {userInitials}
                  </button>
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full z-50 mt-2 min-w-[10rem] rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                      <Link
                        href={dashboardHref}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-[#0E0E0E] hover:bg-gray-50"
                      >
                        Dashboard
                      </Link>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="hidden text-sm text-white/80 hover:text-white md:inline-flex"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="hidden rounded-full border border-white/30 px-5 py-2 text-sm text-white hover:border-[#1FAF9E] hover:text-[#1FAF9E] md:inline-flex"
                  >
                    Get Started
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                className="inline-flex items-center justify-center p-1.5 text-white md:hidden"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

        </div>
      </header>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-30 md:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[85%] max-w-sm bg-[#0E0E0E] p-5 shadow-xl">
            <div className="mb-6 flex justify-end">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-white"
                aria-label="Close menu"
              >
                <X size={24} />
              </button>
            </div>
            <div className="text-white">
              <div className="mb-4">
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs font-medium"
                  onClick={() => setIsCountryOpen((prev) => !prev)}
                >
                  <img
                    src={activeCountry.flagUrl}
                    alt={activeCountry.name}
                    className="h-3 w-5 object-cover"
                  />
                  <span>{activeCountry.name}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3 text-white/70"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
                {isCountryOpen && (
                  <div className="mt-2 rounded-md border border-white/10 bg-[#111] text-xs">
                    {COUNTRIES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5"
                        onClick={() => {
                          handleCountryChange(item.code);
                          setIsCountryOpen(false);
                        }}
                      >
                        <img
                          src={item.flagUrl}
                          alt={item.name}
                          className="h-3 w-5 object-cover"
                        />
                        <span className="flex-1">{item.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-4 border-t border-white/10" />
              <nav className="flex flex-col gap-4 text-sm">
                {userInitials && !isAuthFlow && (
                  <Link
                    href={dashboardHref}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="font-medium text-[#1FAF9E]"
                  >
                    Dashboard
                  </Link>
                )}
                <Link
                  href="/write-review"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Write a Review
                </Link>
                <Link
                  href="/categories"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Categories
                </Link>
                <Link
                  href="/for-business"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  For Business
                </Link>

                <div className="my-6 border-t border-white/10" />

                {userInitials && !isAuthFlow ? null : (
                  <>
                    <Link
                      href="/auth/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Log in
                    </Link>
                    <Link
                      href="/auth/signup"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="rounded-lg bg-[#1FAF9E] px-4 py-3 text-center font-medium text-black"
                    >
                      Get Started
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>
      )}

      {isLoginOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F4F0] px-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close login"
            onClick={() => setIsLoginOpen(false)}
          />
          <div className="absolute top-10 left-1/2 flex -translate-x-1/2 items-center">
            <img
              src="/brand/TELLACITY%20LOGO%202A.png"
              alt="Tellacity"
              className="h-7 w-auto"
            />
          </div>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <button
              type="button"
              onClick={() => setIsLoginOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">Sign in</h2>
              <p className="mt-2 text-sm text-gray-500">
                Use Google or receive a magic link by email
              </p>
            </div>

            {loginStep === "form" ? (
              <>
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setLoginStatus(null);
                      window.localStorage.setItem(
                        "tellacity_auth_redirect",
                        "true"
                      );
                      const { error } = await supabaseBrowser().auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/dashboard`,
                        },
                      });
                      if (error) {
                        setLoginStatus({
                          type: "error",
                          message: error.message,
                        });
                      }
                    }}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#1FAF9E]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M23.49 12.27c0-.81-.07-1.6-.2-2.36H12v4.48h6.47a5.54 5.54 0 01-2.4 3.64v3.02h3.88c2.27-2.09 3.54-5.18 3.54-8.78z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.88-3.02c-1.08.72-2.46 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.12A12 12 0 0012 24z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.25 14.25a7.2 7.2 0 010-4.5V6.63H1.25a12 12 0 000 10.74l4-3.12z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 4.78c1.76 0 3.35.6 4.6 1.77l3.45-3.45C17.96 1.14 15.23 0 12 0 7.3 0 3.22 2.69 1.25 6.63l4 3.12C6.2 6.9 8.86 4.78 12 4.78z"
                        fill="#EA4335"
                      />
                    </svg>
                    Sign in with Google
                  </button>
                </div>

                <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
                  <div className="h-px flex-1 bg-gray-200" />
                  OR
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <form
                  className="space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setLoginStatus(null);
                    const trimmedEmail = loginEmail.trim();
                    if (!trimmedEmail) {
                      setLoginStatus({
                        type: "error",
                        message: "Please enter your email to continue.",
                      });
                      return;
                    }
                    setIsLoginSubmitting(true);
                    window.localStorage.setItem(
                      "tellacity_auth_redirect",
                      "true"
                    );
                    const { error } = await supabaseBrowser().auth.signInWithOtp({
                      email: trimmedEmail,
                      options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                      },
                    });
                    setIsLoginSubmitting(false);
                    if (error) {
                      setLoginStatus({ type: "error", message: error.message });
                    } else {
                      setLoginStep("check-email");
                    }
                  }}
                >
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Email
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={(event) => setLoginEmail(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                      placeholder="you@example.com"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="submit"
                      className="rounded-md bg-[#0E5C56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B4B46]"
                      disabled={isLoginSubmitting}
                    >
                      {isLoginSubmitting ? "Sending link..." : "Log in"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        setLoginStatus(null);
                        const trimmedEmail = loginEmail.trim();
                        if (!trimmedEmail) {
                          setLoginStatus({
                            type: "error",
                            message:
                              "Enter your email to reset your password.",
                          });
                          return;
                        }
                        setIsResettingPassword(true);
                        const { error } =
                          await supabaseBrowser().auth.resetPasswordForEmail(
                            trimmedEmail
                          );
                        setIsResettingPassword(false);
                        if (error) {
                          setLoginStatus({
                            type: "error",
                            message: error.message,
                          });
                        } else {
                          setLoginStatus({
                            type: "success",
                            message: "Password reset email sent.",
                          });
                        }
                      }}
                      className="text-sm font-semibold text-[#0E5C56] hover:text-[#0B4B46]"
                    >
                      {isResettingPassword ? "Sending..." : "Forgot password?"}
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                <p className="font-semibold text-[#0E0E0E]">
                  Check your email
                </p>
                <p className="mt-2">
                  We sent a sign-in link to <span className="font-semibold">{loginEmail || "your inbox"}</span>.
                  Open it to finish logging in.
                </p>
                <button
                  type="button"
                  onClick={() => setLoginStep("form")}
                  className="mt-4 text-sm font-semibold text-[#0E5C56]"
                >
                  Use a different email
                </button>
              </div>
            )}

            {loginStatus && (
              <p
                className={`mt-4 text-sm ${
                  loginStatus.type === "success"
                    ? "text-[#0E5C56]"
                    : "text-red-600"
                }`}
              >
                {loginStatus.message}
              </p>
            )}

            <p className="mt-6 text-center text-xs text-gray-500">
              Don&apos;t have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsLoginOpen(false);
                  setSignupStatus(null);
                  setIsSignupOpen(true);
                }}
                className="font-semibold text-[#0E5C56]"
              >
                Sign up here
              </button>
            </p>
          </div>
        </div>
      )}

      {isSignupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#F8F4F0] px-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close sign up"
            onClick={() => setIsSignupOpen(false)}
          />
          <div className="absolute top-10 left-1/2 flex -translate-x-1/2 items-center">
            <img
              src="/brand/TELLACITY%20LOGO%202A.png"
              alt="Tellacity"
              className="h-7 w-auto"
            />
          </div>
          <div className="relative w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
            <button
              type="button"
              onClick={() => setIsSignupOpen(false)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              aria-label="Close"
            >
              ×
            </button>
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-[#0E0E0E]">Sign up</h2>
              <p className="mt-2 text-sm text-gray-500">
                Create your Tellacity account with Google or email
              </p>
            </div>

            {signupStep === "form" ? (
              <>
                <div className="mt-6 space-y-3">
                  <button
                    type="button"
                    onClick={async () => {
                      setSignupStatus(null);
                      window.localStorage.setItem(
                        "tellacity_auth_redirect",
                        "true"
                      );
                      const { error } = await supabaseBrowser().auth.signInWithOAuth({
                        provider: "google",
                        options: {
                          redirectTo: `${window.location.origin}/dashboard`,
                        },
                      });
                      if (error) {
                        setSignupStatus({
                          type: "error",
                          message: error.message,
                        });
                      }
                    }}
                    className="flex w-full items-center justify-center gap-3 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:border-[#1FAF9E]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        d="M23.49 12.27c0-.81-.07-1.6-.2-2.36H12v4.48h6.47a5.54 5.54 0 01-2.4 3.64v3.02h3.88c2.27-2.09 3.54-5.18 3.54-8.78z"
                        fill="#4285F4"
                      />
                      <path
                        d="M12 24c3.24 0 5.97-1.07 7.96-2.91l-3.88-3.02c-1.08.72-2.46 1.15-4.08 1.15-3.14 0-5.8-2.12-6.75-4.97H1.25v3.12A12 12 0 0012 24z"
                        fill="#34A853"
                      />
                      <path
                        d="M5.25 14.25a7.2 7.2 0 010-4.5V6.63H1.25a12 12 0 000 10.74l4-3.12z"
                        fill="#FBBC05"
                      />
                      <path
                        d="M12 4.78c1.76 0 3.35.6 4.6 1.77l3.45-3.45C17.96 1.14 15.23 0 12 0 7.3 0 3.22 2.69 1.25 6.63l4 3.12C6.2 6.9 8.86 4.78 12 4.78z"
                        fill="#EA4335"
                      />
                    </svg>
                    Continue with Google
                  </button>
                </div>

                <div className="my-6 flex items-center gap-3 text-xs text-gray-400">
                  <div className="h-px flex-1 bg-gray-200" />
                  OR
                  <div className="h-px flex-1 bg-gray-200" />
                </div>

                <form
                  className="space-y-4"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setSignupStatus(null);
                    const trimmedEmail = signupEmail.trim();
                    if (!trimmedEmail) {
                      setSignupStatus({
                        type: "error",
                        message: "Please enter your email to continue.",
                      });
                      return;
                    }
                    setIsSignupSubmitting(true);
                    window.localStorage.setItem(
                      "tellacity_auth_redirect",
                      "true"
                    );
                    const { error } = await supabaseBrowser().auth.signInWithOtp({
                      email: trimmedEmail,
                      options: {
                        emailRedirectTo: `${window.location.origin}/dashboard`,
                      },
                    });
                    setIsSignupSubmitting(false);
                    if (error) {
                      setSignupStatus({ type: "error", message: error.message });
                    } else {
                      setSignupStep("check-email");
                    }
                  }}
                >
                  <div>
                    <label className="text-xs font-semibold text-gray-600">
                      Email
                    </label>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(event) => setSignupEmail(event.target.value)}
                      className="mt-2 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-[#0E0E0E] focus:border-[#1FAF9E] focus:outline-none focus:ring-2 focus:ring-[#1FAF9E]/20"
                      placeholder="you@example.com"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full rounded-md bg-[#0E5C56] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0B4B46]"
                    disabled={isSignupSubmitting}
                  >
                    {isSignupSubmitting ? "Sending link..." : "Create account"}
                  </button>
                </form>
              </>
            ) : (
              <div className="mt-8 rounded-xl border border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-600">
                <p className="font-semibold text-[#0E0E0E]">
                  Check your email
                </p>
                <p className="mt-2">
                  We sent a verification link to{" "}
                  <span className="font-semibold">
                    {signupEmail || "your inbox"}
                  </span>
                  . Open it to finish creating your account.
                </p>
                <button
                  type="button"
                  onClick={() => setSignupStep("form")}
                  className="mt-4 text-sm font-semibold text-[#0E5C56]"
                >
                  Use a different email
                </button>
              </div>
            )}

            {signupStatus && (
              <p
                className={`mt-4 text-sm ${
                  signupStatus.type === "success"
                    ? "text-[#0E5C56]"
                    : "text-red-600"
                }`}
              >
                {signupStatus.message}
              </p>
            )}

            <p className="mt-6 text-center text-xs text-gray-500">
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => {
                  setIsSignupOpen(false);
                  setLoginStatus(null);
                  setIsLoginOpen(true);
                }}
                className="font-semibold text-[#0E5C56]"
              >
                Log in
              </button>
            </p>
          </div>
        </div>
      )}
    </>
  );
}
