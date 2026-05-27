"use client";

import { openCookieConsentManager } from "@/lib/cookieConsent";

type OpenCookieConsentButtonProps = {
  className?: string;
  children: React.ReactNode;
};

export default function OpenCookieConsentButton({
  className,
  children,
}: OpenCookieConsentButtonProps) {
  return (
    <button
      type="button"
      onClick={openCookieConsentManager}
      className={className}
    >
      {children}
    </button>
  );
}
