"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type ShareArticleProps = {
  title: string;
  path: string;
};

function buildUrl(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  if (typeof window !== "undefined") {
    return `${window.location.origin}${normalizedPath}`;
  }
  const base = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  return base ? `${base}${normalizedPath}` : "";
}

export default function ShareArticle({ title, path }: ShareArticleProps) {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState(() => buildUrl(path));

  useEffect(() => {
    if (!url && typeof window !== "undefined") {
      setUrl(buildUrl(path));
    }
  }, [path, url]);

  const encodedUrl = encodeURIComponent(url || "");
  const encodedTitle = encodeURIComponent(title);

  const shareX = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const shareFacebook = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const shareLinkedIn = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;

  const handleCopyLink = useCallback(async () => {
    const linkUrl = typeof window !== "undefined" ? buildUrl(path) : url;
    try {
      await navigator.clipboard.writeText(linkUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [path, url]);

  return (
    <>
    <div className="border-t border-b border-gray-200 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm font-semibold text-[#0E0E0E]">Share this article</p>
        <div className="flex items-center gap-2">
          <a
            href={shareX}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0E0E0E] transition-colors hover:border-gray-300 hover:bg-gray-50"
            aria-label="Share on X (Twitter)"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a
            href={shareFacebook}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[#1877F2] transition-colors hover:border-gray-300 hover:bg-gray-50"
            aria-label="Share on Facebook"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a
            href={shareLinkedIn}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-[#0A66C2] transition-colors hover:border-gray-300 hover:bg-gray-50"
            aria-label="Share on LinkedIn"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <button
            type="button"
            onClick={handleCopyLink}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition-colors hover:border-gray-300 hover:bg-gray-50"
            aria-label="Copy link"
          >
            {copied ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
    <div className="mt-10 flex justify-center">
      <Link
        href="/blog"
        className="inline-flex items-center gap-2 rounded-full border-2 border-[#2fb2a8] bg-white px-6 py-3 text-sm font-semibold text-[#2fb2a8] transition-colors hover:bg-[#2fb2a8] hover:text-white"
      >
        View more blog posts
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" />
          <path d="M12 5l7 7-7 7" />
        </svg>
      </Link>
    </div>
    </>
  );
}
