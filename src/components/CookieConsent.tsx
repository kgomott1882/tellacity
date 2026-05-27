"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getCookieConsent,
  rejectNonEssentialCookieConsent,
  saveCookieConsent,
} from "@/lib/cookieConsent";

type CookieConsentProps = {
  onClose: () => void;
};

export default function CookieConsent({ onClose }: CookieConsentProps) {
  const [analytics, setAnalytics] = useState(true);
  const [functionality, setFunctionality] = useState(true);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const existing = getCookieConsent();
    if (!existing) return;
    setAnalytics(existing.analytics);
    setFunctionality(existing.functional);
    setMarketing(existing.marketing);
  }, []);

  const handleReject = () => {
    rejectNonEssentialCookieConsent();
    onClose();
  };

  const handleSave = () => {
    saveCookieConsent({
      analytics,
      functional: functionality,
      marketing,
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cookie-consent-title"
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl rounded-2xl bg-white p-8 shadow-2xl"
        >
          <h2
            id="cookie-consent-title"
            className="mb-4 text-xl font-semibold text-[#124541]"
          >
            Privacy Preferences
          </h2>

          <p className="mb-6 text-gray-600">
            Cookies help Tellacity stay secure and improve your experience. You
            can change these anytime from the footer or cookie policy page.
          </p>

          <CookieSection
            title="Strictly Necessary"
            description="Essential for login, security and core features."
            locked
          />

          <CookieSection
            title="Performance Cookies"
            description="Help us measure traffic and improve performance."
            enabled={analytics}
            setEnabled={setAnalytics}
          />

          <CookieSection
            title="Functionality Cookies"
            description="Remember preferences and settings."
            enabled={functionality}
            setEnabled={setFunctionality}
          />

          <CookieSection
            title="Marketing Cookies"
            description="Used for relevant promotions."
            enabled={marketing}
            setEnabled={setMarketing}
          />

          <div className="flex gap-3 pt-6">
            <button
              type="button"
              onClick={handleReject}
              className="flex-1 text-gray-600 hover:underline"
            >
              Reject Non-Essential
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="flex-1 rounded-xl bg-[#124541] py-3 text-white shadow-md transition hover:bg-[#0f3a36]"
            >
              Save Preferences
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

function CookieSection({
  title,
  description,
  enabled,
  setEnabled,
  locked = false,
}: {
  title: string;
  description: string;
  enabled?: boolean;
  setEnabled?: (value: boolean) => void;
  locked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-200 py-4">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-800">{title}</h4>
          {locked && (
            <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
              Mandatory
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <button
        type="button"
        disabled={locked}
        aria-pressed={locked ? true : enabled}
        aria-label={`${title}${locked ? " (always on)" : enabled ? " on" : " off"}`}
        onClick={() => setEnabled && setEnabled(!enabled)}
        className={`flex h-6 w-12 items-center rounded-full transition ${
          locked ? "bg-[#124541]" : enabled ? "bg-[#124541]" : "bg-gray-300"
        }`}
      >
        <div
          className={`h-5 w-5 transform rounded-full bg-white shadow-md transition ${
            enabled || locked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
