"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useBusinessContext } from "../../_context/BusinessContext";
import { Check, Copy } from "lucide-react";

const WIDGETS = [
  {
    id: "badge",
    name: "Trust Badge",
    description: "Compact rating badge for headers and footers.",
    previewHeight: 120,
  },
  {
    id: "carousel",
    name: "Review Carousel",
    description: "Showcase rotating customer reviews.",
    previewHeight: 300,
  },
  {
    id: "list",
    name: "Review List",
    description: "Display latest reviews in a vertical list.",
    previewHeight: 420,
  },
  {
    id: "collector",
    name: "Review Collector",
    description: "Button to collect new reviews.",
    previewHeight: 80,
  },
] as const;

type WidgetId = (typeof WIDGETS)[number]["id"];

function resolveWidgetBaseUrl(): string {
  const envBase = (process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");
  const raw =
    envBase ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    "https://tellacity.com";

  try {
    const parsed = new URL(raw);
    const isLocal =
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "::1";
    if (parsed.protocol === "http:" && !isLocal) {
      parsed.protocol = "https:";
    }
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return "https://tellacity.com";
  }
}

export default function WebsiteWidgetsPage() {
  const { selectedBusiness } = useBusinessContext();
  if (!selectedBusiness?.id) return null;
  const [selected, setSelected] = useState<WidgetId>("badge");
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const baseUrl = useMemo(() => resolveWidgetBaseUrl(), []);
  const previewBaseUrl = useMemo(
    () => (typeof window !== "undefined" ? window.location.origin : baseUrl),
    [baseUrl]
  );
  const previewExtraParams = useMemo(() => {
    if (typeof window === "undefined") return "";
    const host = window.location.hostname;
    const isLocal =
      host === "localhost" || host === "127.0.0.1" || host === "::1";
    // Hide Next.js dev indicator inside iframe preview in local dev.
    return isLocal ? "&__nextjs_disable_dev_indicator=true" : "";
  }, []);

  const slug = selectedBusiness?.slug ?? "";

  const previewUrl = useMemo(
    () =>
      slug
        ? `${previewBaseUrl}/widgets/embed?business=${encodeURIComponent(slug)}&type=${selected}${previewExtraParams}`
        : "",
    [previewBaseUrl, previewExtraParams, slug, selected]
  );

  const embedCode = useMemo(
    () =>
      `<script src="${baseUrl}/widgets/v1.js" data-business="${slug}" data-type="${selected}"></script>`,
    [baseUrl, slug, selected]
  );

  // Auto-resize iframe from postMessage
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (
        e.data?.type === "tellacity-widget-resize" &&
        iframeRef.current &&
        e.data.src === previewUrl
      ) {
        iframeRef.current.style.height = `${e.data.height + 20}px`;
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [previewUrl]);

  // Reset iframe height when widget type changes
  const currentWidget = WIDGETS.find((w) => w.id === selected)!;
  useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.style.height = `${currentWidget.previewHeight}px`;
    }
  }, [selected, currentWidget.previewHeight]);

  function handleCopy() {
    navigator.clipboard.writeText(embedCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="max-w-5xl space-y-10">
      <div>
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Website widgets</h1>
        <p className="mt-1 text-sm text-gray-500">
          Showcase verified feedback across your website and channels.
        </p>
      </div>

      {/* Widget selector */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Choose a widget
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {WIDGETS.map((widget) => {
            const isActive = selected === widget.id;
            return (
              <button
                key={widget.id}
                type="button"
                onClick={() => setSelected(widget.id)}
                className={`text-left rounded-xl border-2 p-4 transition-all ${
                  isActive
                    ? "border-[#2fb2a8] bg-[#2fb2a8]/5 shadow-sm"
                    : "border-gray-200 hover:border-[#2fb2a8]/50 bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-[#0E0E0E]">{widget.name}</h3>
                  {isActive && (
                    <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#2fb2a8]">
                      <Check size={10} strokeWidth={3} className="text-white" />
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-500">{widget.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Live preview */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Live preview
        </h2>
        <div className="rounded-xl border-2 border-[#2fb2a8] bg-white p-5 shadow-sm">
          {!slug ? (
            <p className="text-sm text-gray-400">
              No business selected. Please select a business to preview the widget.
            </p>
          ) : (
            <iframe
              ref={iframeRef}
              key={previewUrl}
              src={previewUrl}
              title={`${currentWidget.name} preview`}
              className="w-full transition-all duration-300"
              style={{ height: currentWidget.previewHeight, border: 0, display: "block", overflow: "hidden" }}
              scrolling="no"
            />
          )}
        </div>
      </div>

      {/* Embed code */}
      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Embed code
        </h2>
        <div className="rounded-xl border-2 border-[#2fb2a8] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2.5">
            <span className="text-xs font-medium text-gray-500">HTML</span>
            <button
              type="button"
              onClick={handleCopy}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                copied
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-transparent"
              }`}
            >
              {copied ? (
                <>
                  <Check size={12} strokeWidth={2.5} />
                  Copied!
                </>
              ) : (
                <>
                  <Copy size={12} strokeWidth={2} />
                  Copy code
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto px-4 py-4 text-xs leading-relaxed text-gray-700 font-mono whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Paste this snippet anywhere in your website HTML where you want the widget to appear.
        </p>
      </div>
    </div>
  );
}
