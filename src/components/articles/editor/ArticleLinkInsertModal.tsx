"use client";

import { useEffect, useId, useRef, useState } from "react";

export type ArticleLinkModalMode = "anchor" | "url-only" | "edit";

export type ArticleLinkModalSubmit = {
  url: string;
  linkText?: string;
};

type Props = {
  open: boolean;
  mode: ArticleLinkModalMode;
  anchorText: string;
  initialUrl: string;
  initialLinkText?: string;
  validationError?: string | null;
  onClose: () => void;
  onSubmit: (payload: ArticleLinkModalSubmit) => void;
  onRemove?: () => void;
};

function normalizeUrlField(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith("/")) return trimmed;
  return `https://${trimmed}`;
}

export default function ArticleLinkInsertModal({
  open,
  mode,
  anchorText,
  initialUrl,
  initialLinkText = "",
  validationError,
  onClose,
  onSubmit,
  onRemove,
}: Props) {
  const titleId = useId();
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [url, setUrl] = useState(initialUrl);
  const [linkText, setLinkText] = useState(initialLinkText);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setUrl(initialUrl);
    setLinkText(initialLinkText);
    setLocalError(null);
  }, [open, initialUrl, initialLinkText]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => urlInputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open, mode]);

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

  const displayError = localError ?? validationError ?? null;
  const isEdit = mode === "edit";
  const showAnchorReadOnly = mode === "anchor" || mode === "edit";
  const showOptionalLinkText = mode === "url-only";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    const normalized = normalizeUrlField(url);
    if (!normalized) {
      setLocalError("Enter a URL to create a link.");
      return;
    }

    onSubmit({
      url: normalized,
      linkText: showOptionalLinkText ? linkText.trim() : undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
      >
        <h2 id={titleId} className="text-lg font-semibold text-gray-900">
          {isEdit ? "Edit Link" : "Add Link"}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {showAnchorReadOnly
            ? "The selected text stays visible in your article. Only the destination URL changes."
            : "Add optional link text, or leave it blank to show the URL itself."}
        </p>

        <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
          {showAnchorReadOnly ? (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Selected text
              </label>
              <div
                className="mt-1.5 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-800"
                aria-readonly="true"
              >
                {anchorText.trim() || "—"}
              </div>
            </div>
          ) : null}

          {showOptionalLinkText ? (
            <div>
              <label htmlFor="article-link-text" className="block text-sm font-medium text-gray-700">
                Link text <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <input
                id="article-link-text"
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Text shown to readers"
                className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1FAF9E] focus:ring-2 focus:ring-[#1FAF9E]/20"
              />
            </div>
          ) : null}

          <div>
            <label htmlFor="article-link-url" className="block text-sm font-medium text-gray-700">
              URL
            </label>
            <input
              ref={urlInputRef}
              id="article-link-url"
              type="url"
              inputMode="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://"
              autoComplete="url"
              className="mt-1.5 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-[#1FAF9E] focus:ring-2 focus:ring-[#1FAF9E]/20"
            />
          </div>

          {displayError ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
              {displayError}
            </p>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {isEdit && onRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="text-sm font-semibold text-red-600 hover:text-red-700"
              >
                Remove link
              </button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-[#1FAF9E] px-4 py-2 text-sm font-semibold text-white hover:bg-[#189786]"
              >
                {isEdit ? "Save link" : "Insert link"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
