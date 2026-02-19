"use client";

import { useState, useEffect } from "react";
import CookieConsent from "./CookieConsent";

export default function CookieBar() {
  const [showBar, setShowBar] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (showBar) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [showBar]);

  if (!showBar) return null;

  return (
    <>
      {showBar && (
        <div className="fixed inset-0 z-30 backdrop-blur-md bg-black/20 pointer-events-none"></div>
      )}

      {showModal && (
        <CookieConsent
          onClose={() => {
            setShowModal(false);
            setShowBar(false);
          }}
        />
      )}

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-md px-6 py-4 flex items-center justify-between">
        <div className="max-w-3xl text-sm text-gray-600">
          We use cookies to personalize content and analyze traffic.
          You can manage your preferences anytime.
        </div>

        <div className="flex items-center gap-3 ml-6">
          <button
            onClick={() => setShowModal(true)}
            className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            Cookie preferences
          </button>

          <button
            onClick={() => setShowBar(false)}
            className="bg-[#124541] text-white px-4 py-2 rounded-lg shadow hover:scale-[1.02] transition"
          >
            Accept cookies
          </button>
        </div>
      </div>
    </>
  );
}


