"use client";

import { useEffect, useState } from "react";

export default function CookieConsentModal() {
  const [visible, setVisible] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    const checkConsent = () => {
      const consent = localStorage.getItem("tellacity_cookie_consent");
      if (!consent) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    checkConsent();

    window.addEventListener("reopen-cookie-modal", checkConsent);

    return () => {
      window.removeEventListener("reopen-cookie-modal", checkConsent);
    };
  }, []);

  const saveConsent = (type) => {
    let preferences = {
      required: true,
      analytics,
      marketing,
    };

    if (type === "accept_all") {
      preferences = {
        required: true,
        analytics: true,
        marketing: true,
      };
    }

    if (type === "reject") {
      preferences = {
        required: true,
        analytics: false,
        marketing: false,
      };
    }

    localStorage.setItem(
      "tellacity_cookie_consent",
      JSON.stringify(preferences)
    );

    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl p-6">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-2xl">🍪</span>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              We Value Your Privacy
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              We use cookies to enhance your browsing experience and analyze traffic.
              You can customize your preferences below.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <CookieRow
            title="Required Cookies"
            description="These cookies are essential for the website to function."
            checked={true}
            disabled
          />

          <CookieRow
            title="Analytics Cookies"
            description="These cookies allow us to analyze traffic and improve services."
            checked={analytics}
            onChange={() => setAnalytics(!analytics)}
          />

          <CookieRow
            title="Marketing Cookies"
            description="Used to deliver relevant advertising and measure campaigns."
            checked={marketing}
            onChange={() => setMarketing(!marketing)}
          />
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={() => saveConsent("save")}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
          >
            Save Choices
          </button>

          <button
            onClick={() => saveConsent("reject")}
            className="px-4 py-2 rounded-md bg-teal-600 text-white hover:bg-teal-700 transition"
          >
            Reject Non-Essential
          </button>

          <button
            onClick={() => saveConsent("accept_all")}
            className="px-4 py-2 rounded-md bg-emerald-700 text-white hover:bg-emerald-800 transition"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
}

function CookieRow({ title, description, checked, onChange, disabled }) {
  return (
    <div className="flex items-center justify-between border rounded-lg p-4">
      <div>
        <h4 className="font-medium text-gray-900">{title}</h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>

      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-teal-600 peer-disabled:bg-gray-300 transition"></div>
        <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition peer-checked:translate-x-5"></div>
      </label>
    </div>
  );
}
