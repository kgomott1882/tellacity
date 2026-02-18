"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getActiveCountry, setActiveCountry } from "@/lib/getActiveCountry";

const COUNTRIES = [
  {
    code: "US",
    name: "United States",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/US.svg",
  },
  {
    code: "UK",
    name: "United Kingdom",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/GB.svg",
  },
  {
    code: "ZA",
    name: "South Africa",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/ZA.svg",
  },
  {
    code: "AU",
    name: "Australia",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/AU.svg",
  },
  {
    code: "CA",
    name: "Canada",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/CA.svg",
  },
  {
    code: "NZ",
    name: "New Zealand",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/NZ.svg",
  },
  {
    code: "IE",
    name: "Ireland",
    flagUrl: "https://purecatamphetamine.github.io/country-flag-icons/3x2/IE.svg",
  },
];

export default function Footer() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [countryCode, setCountryCode] = useState("");
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCountry =
    COUNTRIES.find((item) => item.code === countryCode) ?? COUNTRIES[0];

  useEffect(() => {
    const fromUrl = searchParams.get("country");
    if (fromUrl) {
      setCountryCode(fromUrl);
      return;
    }
    setCountryCode(getActiveCountry() ?? "");
  }, [searchParams]);

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

  const handleCountrySelect = (code: string) => {
    setCountryCode(code);
    // Persist and notify listeners (home sections, etc.)
    setActiveCountry(code);

    const params = new URLSearchParams(searchParams.toString());
    params.set("country", code);
    router.push(`${pathname}?${params.toString()}`);
    setIsCountryOpen(false);
  };

  const reopenCookies = () => {
    localStorage.removeItem("tellacity_cookie_consent");
    window.dispatchEvent(new Event("reopen-cookie-modal"));
  };

  return (
    <footer className="w-full bg-[#0E0E0E] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="flex items-center">
          <img
            src="/brand/TELLACITY%20LOGO%202A.png"
            alt="Tellacity"
            className="h-5 w-auto"
          />
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-6">
          <div className="space-y-6 lg:col-span-1">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70">
                Follow us on
              </p>
              <div className="mt-4 flex items-center gap-3">
              <a
                href="https://x.com/TellacityApp"
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-[#1FAF9E] hover:text-[#1FAF9E]"
                aria-label="X"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 5l14 14" />
                  <path d="M19 5L5 19" />
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@tellacity"
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-[#1FAF9E] hover:text-[#1FAF9E]"
                aria-label="TikTok"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M14 5v9a4 4 0 11-4-4" />
                  <path d="M14 5a6 6 0 004 2" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/tellacity"
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-[#1FAF9E] hover:text-[#1FAF9E]"
                aria-label="Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="4" y="4" width="16" height="16" rx="4" />
                  <circle cx="12" cy="12" r="3" />
                  <circle cx="17" cy="7" r="1" />
                </svg>
              </a>
              <a
                href="https://www.youtube.com/@Tellacity"
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white/80 hover:border-[#1FAF9E] hover:text-[#1FAF9E]"
                aria-label="YouTube"
                target="_blank"
                rel="noreferrer"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="7" width="18" height="10" rx="3" />
                  <path d="M10 9l5 3-5 3z" />
                </svg>
              </a>
              </div>
            </div>
          </div>

          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4">
            <div>
              <h3 className="text-sm font-semibold tracking-wide">ABOUT</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <Link href="/about" className="hover:text-white">
                    About Tellacity
                  </Link>
                </li>
                <li>
                  <Link href="/how-tellacity-works" className="hover:text-white">
                    How Tellacity Works
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="hover:text-white">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/press" className="hover:text-white">
                    Press
                  </Link>
                </li>
                <li>
                  <Link href="/careers" className="hover:text-white">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/investor-relations" className="hover:text-white">
                    Investor Relations
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide">COMMUNITY</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <Link href="/write-review" className="hover:text-white">
                    Write a Review
                  </Link>
                </li>
                <li>
                  <Link href="/categories" className="hover:text-white">
                    Browse Categories
                  </Link>
                </li>
                <li>
                  <Link href="/reviewer-guidelines" className="hover:text-white">
                    Reviewer Guidelines
                  </Link>
                </li>
                <li>
                  <Link href="/safety-trust" className="hover:text-white">
                    Safety &amp; Trust
                  </Link>
                </li>
                <li>Log In</li>
                <li>Sign Up</li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide">
                FOR BUSINESSES
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <Link href="/for-business" className="hover:text-white">
                    Tellacity for Business
                  </Link>
                </li>
                <li>
                  <Link href="/for-business" className="hover:text-white">
                    Features &amp; Integrations
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-white">
                    Plans &amp; Pricing
                  </Link>
                </li>
                <li>Business Login</li>
                <li>
                  <Link href="/api-data-solutions" className="hover:text-white">
                    API &amp; Data Solutions
                  </Link>
                </li>
                <li>
                  <Link href="/resources" className="hover:text-white">
                    Business Resources
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide">
                HELP &amp; LEGAL
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <Link href="/help-center" className="hover:text-white">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/faq" className="hover:text-white">
                    FAQ
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-white">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms-of-service" className="hover:text-white">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="hover:text-white">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/cookie-policy" className="hover:text-white">
                    Cookie Policy
                  </Link>
                </li>
                <li>
                  <Link href="/data-protection" className="hover:text-white">
                    Data Protection
                  </Link>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={reopenCookies}
                    className="text-sm text-gray-500 hover:text-gray-700 transition"
                  >
                    Cookie Settings
                  </button>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-1">
            <div>
              <h3 className="text-sm font-semibold tracking-wide">COUNTRY</h3>
              <div
                className="mt-4 relative inline-flex"
                onMouseEnter={openCountryMenu}
                onMouseLeave={scheduleCountryClose}
              >
                <button
                  type="button"
                  className="inline-flex min-w-[220px] items-center gap-3 rounded-full border border-white/20 px-4 py-2 text-sm text-gray-300 hover:border-white/40"
                  onClick={() => setIsCountryOpen((prev) => !prev)}
                >
                  <img
                    src={activeCountry.flagUrl}
                    alt={activeCountry.name}
                  className="h-4 w-6 object-cover"
                  />
                  <span className="whitespace-nowrap">{activeCountry.name}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className="h-4 w-4 text-gray-300"
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
                <div className="absolute left-0 top-12 z-50 w-56 rounded-lg border border-gray-200 bg-white py-2 text-xs text-[#0E0E0E] shadow-lg">
                    {COUNTRIES.map((item) => (
                      <button
                        key={item.code}
                        type="button"
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-gray-50"
                        onClick={() => handleCountrySelect(item.code)}
                      >
                        <img
                          src={item.flagUrl}
                          alt={item.name}
                          className="h-4 w-6 object-cover"
                        />
                      <span className="flex-1 whitespace-nowrap">{item.name}</span>
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
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-xs text-gray-300">
          © 2026 Tellacity. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
  