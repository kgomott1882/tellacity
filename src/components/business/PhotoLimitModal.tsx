"use client";

import { useEffect } from "react";
import Link from "next/link";
import { openUpgradeFlow } from "@/lib/upgradeFlow";

export type PhotoLimitModalProps = {
  open: boolean;
  onClose: () => void;
  /** If set, "Upgrade plan" is a normal link. If omitted, uses `openUpgradeFlow("upload_limit")`. */
  upgradeHref?: string;
};

/**
 * Shown when the photo upload API returns 403 with the Free-plan cap message.
 * Full-screen overlay; dismissible via backdrop, Escape, or "Maybe later". No auto-navigation.
 */
export default function PhotoLimitModal({
  open,
  onClose,
  upgradeHref,
}: PhotoLimitModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="photo-limit-modal-title"
        className="relative z-10 w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
      >
        <h2 id="photo-limit-modal-title" className="text-lg font-semibold text-[#0E0E0E]">
          You&apos;ve reached your photo limit
        </h2>
        <p className="mt-3 text-sm text-gray-600">
          You&apos;ve used all the photo slots on your current plan. Upgrade to add more images
          across any category — team, workspace, products, services, gallery, or your own custom
          sections. More photos help visitors recognize your business and build trust before they
          get in touch.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/30 sm:w-auto"
          >
            Maybe later
          </button>
          {upgradeHref ? (
            <Link
              href={upgradeHref}
              onClick={onClose}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#1FAF9E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#169786] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:w-auto"
            >
              Upgrade plan
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                openUpgradeFlow("upload_limit");
              }}
              className="inline-flex w-full items-center justify-center rounded-full bg-[#1FAF9E] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#169786] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1FAF9E]/40 sm:w-auto"
            >
              Upgrade plan
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
