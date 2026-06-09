"use client";

import { AlertTriangle } from "lucide-react";

type Props = {
  externalLinkCount: number;
  maxExternalLinks: number;
  message?: string;
};

export default function ArticleExternalLinkBlocker({
  externalLinkCount,
  maxExternalLinks,
  message,
}: Props) {
  const overLimit = externalLinkCount > maxExternalLinks;
  const overBy = externalLinkCount - maxExternalLinks;

  return (
    <div
      className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center bg-gray-900/45 pt-16 sm:pt-24"
      role="alert"
      aria-live="assertive"
    >
      <div className="pointer-events-auto mx-4 max-w-md rounded-xl border border-red-200 bg-white p-5 shadow-xl">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden />
          <div>
            <h3 className="text-sm font-semibold text-gray-900">Link issue must be fixed</h3>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              {message ??
                (overLimit
                  ? `This article has ${externalLinkCount} external links (${maxExternalLinks} allowed). Remove at least ${overBy} link${overBy === 1 ? "" : "s"} in the editor below to continue.`
                  : "Fix the link issues shown above before continuing.")}
            </p>
            <p className="mt-2 text-xs text-gray-500">
              Your business website and Tellacity links do not count toward the external link limit.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
