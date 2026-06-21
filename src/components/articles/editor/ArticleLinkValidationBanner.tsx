"use client";

import { AlertTriangle, CheckCircle2, Link2 } from "lucide-react";
import type { LinkValidationResult } from "@/lib/articles/linkValidation";

type Props = {
  result: LinkValidationResult;
  compact?: boolean;
};

export default function ArticleLinkValidationBanner({ result, compact = false }: Props) {
  const { issues, externalLinkCount, maxExternalLinks, ok } = result;
  const shell = compact
    ? "px-3 py-2 text-xs"
    : "px-4 py-3 text-sm";

  if (ok && externalLinkCount === 0) {
    return null;
  }

  if (ok && externalLinkCount > 0) {
    const atLimit = externalLinkCount >= maxExternalLinks;
    return (
      <div
        className={`flex items-start gap-2 rounded-lg border ${
          atLimit
            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
            : "border-gray-200 bg-gray-50 text-gray-700"
        } ${shell}`}
      >
        {atLimit ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
        ) : (
          <Link2 className="mt-0.5 h-4 w-4 shrink-0 text-[#1FAF9E]" aria-hidden />
        )}
        <p>
          External links: {externalLinkCount} / {maxExternalLinks}
          {atLimit
            ? ", maximum allowed (your business website and Tellacity links are unlimited)"
            : " (your business website and Tellacity links are unlimited)"}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 text-red-900 ${shell}`}
      role="alert"
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        <div>
          <p className="font-semibold">Link issues must be fixed before saving or submitting</p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4">
            {issues.map((item) => (
              <li key={item.code}>{item.message}</li>
            ))}
          </ul>
          {externalLinkCount > 0 ? (
            <p className="mt-2 text-red-800/80">
              External links counted: {externalLinkCount} / {maxExternalLinks}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
