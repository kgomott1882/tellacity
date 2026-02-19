"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CookieConsent({ onClose }: any) {
  const [analytics, setAnalytics] = useState(true);
  const [functionality, setFunctionality] = useState(true);
  const [marketing, setMarketing] = useState(false);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
      >
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 30, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-xl bg-white rounded-2xl p-8 shadow-2xl"
        >
          <h2 className="text-xl font-semibold text-[#124541] mb-4">
            Privacy Preferences
          </h2>

          <p className="text-gray-600 mb-6">
            Cookies help Tellacity stay secure and improve your experience.
            You can change these anytime.
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
              onClick={() => {
                localStorage.setItem("tellacity_cookie_consent", "custom");
                onClose();
              }}
              className="flex-1 text-gray-600 hover:underline"
            >
              Reject Non-Essential
            </button>

            <button
              type="button"
              onClick={() => {
                localStorage.setItem("tellacity_cookie_consent", "custom");
                onClose();
              }}
              className="flex-1 bg-[#124541] text-white py-3 rounded-xl shadow-md hover:bg-[#0f3a36] transition"
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
}: any) {
  return (
    <div className="border-t border-gray-200 py-4 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-800">{title}</h4>
          {locked && (
            <span className="text-xs bg-gray-200 px-2 py-0.5 rounded-full text-gray-600">
              Mandatory
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">{description}</p>
      </div>

      <button
        type="button"
        disabled={locked}
        onClick={() => setEnabled && setEnabled(!enabled)}
        className={`w-12 h-6 flex items-center rounded-full transition
          ${
            locked
              ? "bg-[#124541]"
              : enabled
              ? "bg-[#124541]"
              : "bg-gray-300"
          }`}
      >
        <div
          className={`w-5 h-5 bg-white rounded-full shadow-md transform transition
            ${enabled || locked ? "translate-x-6" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}

