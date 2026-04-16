"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import CookieConsent from "./CookieConsent";

export default function CookieBar() {
  const pathname = usePathname();
  const isWidgetRoute = pathname?.startsWith("/widgets");
  const [mounted, setMounted] = useState(false);
  const [hasConsent, setHasConsent] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return !!window.localStorage.getItem("tellacity_cookie_consent");
  });
  const [showModal, setShowModal] = useState(false);
  const visible = !isWidgetRoute && !hasConsent && !showModal;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isWidgetRoute) return;
    if (visible || showModal) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [visible, showModal, isWidgetRoute]);

  const closeAll = () => {
    localStorage.setItem("tellacity_cookie_consent", "accepted");
    setHasConsent(true);
    setShowModal(false);
  };

  if (isWidgetRoute) return null;

  return (
    <>
      {mounted && (visible || showModal) && (
        <div className="fixed inset-0 z-30 backdrop-blur-md bg-black/30 pointer-events-none"></div>
      )}

      {showModal && (
        <CookieConsent
          onClose={closeAll}
        />
      )}

      {visible && !showModal && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-md px-6 py-4 flex items-center justify-between">
          <div className="max-w-3xl text-sm text-gray-600">
            We use cookies to personalize content and analyze traffic.
            You can manage your preferences anytime.
          </div>

          <div className="flex items-center gap-3 ml-6">
            <button
              type="button"
              onClick={() => {
                setShowModal(true);
              }}
              className="border border-gray-300 px-4 py-2 rounded-lg text-sm transition-all duration-150 hover:border-gray-400 hover:bg-gray-50 hover:shadow-sm hover:-translate-y-0.5"
            >
              Cookie preferences
            </button>

            <button
              type="button"
              onClick={closeAll}
              className="bg-[#124541] text-white px-4 py-2 rounded-lg shadow transition-all duration-150 hover:bg-[#0f3a36] hover:shadow-md hover:-translate-y-0.5 active:scale-95"
            >
              Accept cookies
            </button>
          </div>
        </div>
      )}
    </>
  );
}

