"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import CookieConsent from "./CookieConsent";
import {
  acceptAllCookieConsent,
  COOKIE_CONSENT_OPEN_EVENT,
  COOKIE_CONSENT_UPDATED_EVENT,
  hasValidCookieConsent,
} from "@/lib/cookieConsent";

export default function CookieBar() {
  const pathname = usePathname();
  const isWidgetRoute = pathname?.startsWith("/widgets");
  const [mounted, setMounted] = useState(false);
  const [hasConsent, setHasConsent] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const refreshConsentState = useCallback(() => {
    setHasConsent(hasValidCookieConsent());
  }, []);

  useEffect(() => {
    refreshConsentState();
    setMounted(true);
  }, [refreshConsentState]);

  useEffect(() => {
    const openManager = () => setShowModal(true);
    const onUpdated = () => refreshConsentState();

    window.addEventListener(COOKIE_CONSENT_OPEN_EVENT, openManager);
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdated);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_OPEN_EVENT, openManager);
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, onUpdated);
    };
  }, [refreshConsentState]);

  useEffect(() => {
    if (isWidgetRoute) return;
    if ((!hasConsent && mounted) || showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [hasConsent, showModal, mounted, isWidgetRoute]);

  const handleAcceptAll = () => {
    acceptAllCookieConsent();
    setHasConsent(true);
    setShowModal(false);
  };

  const handleModalClose = () => {
    refreshConsentState();
    setShowModal(false);
  };

  if (isWidgetRoute) return null;

  const showBottomBar = mounted && !hasConsent && !showModal;

  return (
    <>
      {mounted && (showBottomBar || showModal) && (
        <div
          className="pointer-events-none fixed inset-0 z-30 bg-black/30 backdrop-blur-md"
          aria-hidden
        />
      )}

      {showModal && <CookieConsent onClose={handleModalClose} />}

      {showBottomBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-between border-t border-gray-200 bg-white px-6 py-4 shadow-md">
          <div className="max-w-3xl text-sm text-gray-600">
            We use cookies to personalize content and analyze traffic. You can
            manage your preferences anytime.
          </div>

          <div className="ml-6 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm"
            >
              Cookie preferences
            </button>

            <button
              type="button"
              onClick={handleAcceptAll}
              className="rounded-lg bg-[#124541] px-4 py-2 text-white shadow transition-all duration-150 hover:-translate-y-0.5 hover:bg-[#0f3a36] hover:shadow-md active:scale-95"
            >
              Accept cookies
            </button>
          </div>
        </div>
      )}
    </>
  );
}
