"use client";

import { useEffect } from "react";

export type DashboardAlertModalProps = {
  open: boolean;
  title?: string;
  message: string;
  onClose: () => void;
  confirmLabel?: string;
};

/**
 * Simple dismissible warning/error dialog for dashboard flows.
 * Prefer this over surfacing raw Postgres / API text inline.
 */
export default function DashboardAlertModal({
  open,
  title = "Something went wrong",
  message,
  onClose,
  confirmLabel = "Got it",
}: DashboardAlertModalProps) {
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
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dashboard-alert-modal-title"
        aria-describedby="dashboard-alert-modal-desc"
        className="relative z-10 w-full max-w-md rounded-2xl border border-amber-200 bg-white p-6 shadow-xl"
      >
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-700"
            aria-hidden
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
              <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <h2
              id="dashboard-alert-modal-title"
              className="text-lg font-semibold text-[#0E0E0E]"
            >
              {title}
            </h2>
            <p
              id="dashboard-alert-modal-desc"
              className="mt-2 text-sm leading-relaxed text-gray-600"
            >
              {message}
            </p>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full bg-[#124541] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#0e3835] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#124541]/40"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
