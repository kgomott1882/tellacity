"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, useState, type ReactNode } from "react";
import {
  normalizeCountryCode,
} from "@/lib/country";
import { useUnifiedCountry } from "@/lib/useUnifiedCountry";
import { openCookieConsentManager } from "@/lib/cookieConsent";

const FOOTER_LINK_BASE =
  "inline-block text-gray-300 transition hover:text-white";
const EGG_YOLK_UNDERLINE =
  "pointer-events-none absolute bottom-0 left-0 right-0 h-2 rounded-sm bg-[#FBBF24]/70";

function isFooterLinkActive(pathname: string, href: string): boolean {
  const pathOnly = href.split("?")[0] ?? href;
  if (pathOnly.startsWith("/categories")) {
    return pathname === "/categories" || pathname.startsWith("/categories/");
  }
  if (pathOnly.startsWith("/companies/")) {
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
  }
  if (pathOnly.startsWith("/solutions/")) {
    return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
  }
  if (pathOnly === "/business/login") {
    return pathname === pathOnly || pathname.startsWith("/business/login/");
  }
  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`);
}

function FooterNavLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const pathname = usePathname() ?? "";
  const isActive = isFooterLinkActive(pathname, href);

  return (
    <Link
      href={href}
      className={`${FOOTER_LINK_BASE} ${isActive ? "text-white" : ""} ${className}`}
      aria-current={isActive ? "page" : undefined}
    >
      <span className="relative inline-block">
        <span className="relative z-10">{children}</span>
        {isActive ? <span className={EGG_YOLK_UNDERLINE} aria-hidden /> : null}
      </span>
    </Link>
  );
}

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

export default function Footer() {
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const { countryCode, setCountryAndSync } = useUnifiedCountry({
    initialCountry: "US",
  });
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeCountry =
    COUNTRIES.find((item) => item.code === countryCode) ?? COUNTRIES[0];
  const companiesCountrySegment = countryCode === "GB" ? "uk" : countryCode.toLowerCase();
  const categoriesHref = `/categories?country=${countryCode}`;
  const companiesHref = `/companies/${companiesCountrySegment}?country=${countryCode}`;

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
    const normalized = normalizeCountryCode(code);
    setCountryAndSync(normalized);
    setIsCountryOpen(false);
  };

  const reopenCookies = () => {
    openCookieConsentManager();
  };

  return (
    <footer className="w-full bg-[#0A0A0A] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-6">
          <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-5">
            <div>
              <h3 className="text-sm font-semibold tracking-wide">ABOUT</h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <FooterNavLink href="/about">About Tellacity</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/how-tellacity-works">
                    How Tellacity Works
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/articles">Articles</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/press">Press</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/careers">Careers</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/investor-relations">
                    Investor Relations
                  </FooterNavLink>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold">PRODUCT</h4>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <FooterNavLink href="/write-review">Write a Review</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href={categoriesHref}>
                    Browse Categories
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href={companiesHref}>
                    Browse Businesses by Country
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/suggest-business">
                    Suggest a Business
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/reviewer-guidelines">
                    Reviewer Guidelines
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/safety-trust">
                    Safety &amp; Trust
                  </FooterNavLink>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide">
                FOR BUSINESSES
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <FooterNavLink href="/for-business">
                    Tellacity for Business
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/pricing">Plans &amp; Pricing</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/business/signup">
                    Business Sign Up
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/business/login">
                    Business Login
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/resources">
                    Business Resources
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/business-guidelines">
                    Business Guidelines
                  </FooterNavLink>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wide">
                HELP &amp; LEGAL
              </h3>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <FooterNavLink href="/help-center">Help Center</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/faq">FAQ</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/contact">Contact Us</FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/terms-of-service">
                    Terms of Service
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/privacy-policy">
                    Privacy Policy
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/cookie-policy">
                    Cookie Policy
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/data-protection">
                    Data Protection
                  </FooterNavLink>
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
            <div>
              <h4 className="mb-4 text-sm font-semibold">SOLUTIONS</h4>
              <ul className="mt-4 space-y-3 text-sm text-gray-300 whitespace-nowrap">
                <li>
                  <FooterNavLink href="/solutions/review-invitations">
                    Review Invitations
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/solutions/review-widgets">
                    Review Widgets
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/solutions/business-analytics">
                    Business Analytics
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/solutions/reputation-management">
                    Reputation Management
                  </FooterNavLink>
                </li>
                <li>
                  <FooterNavLink href="/solutions/photo-uploads">
                    Photo Uploads
                  </FooterNavLink>
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

        <div className="mt-16 border-t border-neutral-800 pt-10 flex flex-col items-center text-center space-y-6">
          <div className="flex justify-center">
            <img
              src="/brand/TELLACITY%20LOGO%202A.png"
              alt="Tellacity"
              className="h-5 w-auto"
            />
          </div>
          <p className="text-xs tracking-widest text-neutral-500">
            FOLLOW US ON
          </p>
          <div className="flex items-center gap-4">
            <a
              href="https://x.com/TellacityApp"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-white/80 hover:border-white transition"
              aria-label="X"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 5l14 14" />
                <path d="M19 5L5 19" />
              </svg>
            </a>
            <a
              href="https://www.tiktok.com/@tellacity"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-white/80 hover:border-white transition"
              aria-label="TikTok"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 5v9a4 4 0 11-4-4" />
                <path d="M14 5a6 6 0 004 2" />
              </svg>
            </a>
            <a
              href="https://www.instagram.com/tellacity"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-white/80 hover:border-white transition"
              aria-label="Instagram"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="4" y="4" width="16" height="16" rx="4" />
                <circle cx="12" cy="12" r="3" />
                <circle cx="17" cy="7" r="1" />
              </svg>
            </a>
            <a
              href="https://www.youtube.com/@Tellacity"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-neutral-700 text-white/80 hover:border-white transition"
              aria-label="YouTube"
              target="_blank"
              rel="noreferrer"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="7" width="18" height="10" rx="3" />
                <path d="M10 9l5 3-5 3z" />
              </svg>
            </a>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-neutral-500">
          © 2026 Tellacity. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
  