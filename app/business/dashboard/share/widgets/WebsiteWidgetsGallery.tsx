"use client";

import { useMemo, useState } from "react";
import { Check, ExternalLink, Lock, Sparkles } from "lucide-react";
import AvailableToUseLabel from "@/components/dashboard/AvailableToUseLabel";
import { canAccessWebsiteWidget, type PlanKey } from "@/lib/plans";
import {
  WIDGET_CATEGORIES,
  WIDGET_CATEGORY_KEYS,
  WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS,
  type WebsiteWidgetDefinition,
  type WebsiteWidgetId,
  type WidgetCategoryKey,
  planBadgeClasses,
  planDisplayName,
  requiredPlanForWebsiteWidget,
} from "@/lib/widgetsConfig";
import { WIDGET_GALLERY_PANE_HEIGHT } from "@/lib/widgetGalleryThumb";
import WidgetGalleryPreview from "./WidgetGalleryPreview";

type GalleryFilter = "all" | WidgetCategoryKey;

type Props = {
  planKey: PlanKey;
  slug: string;
  previewBaseUrl: string;
  previewExtraParams: string;
  selected: WebsiteWidgetId;
  configureOpen: boolean;
  onSelect: (id: WebsiteWidgetId) => void;
  onOpenConfigure: (id: WebsiteWidgetId) => void;
};

export default function WebsiteWidgetsGallery({
  planKey,
  slug,
  previewBaseUrl,
  previewExtraParams,
  selected,
  configureOpen,
  onSelect,
  onOpenConfigure,
}: Props) {
  const [filter, setFilter] = useState<GalleryFilter>("all");

  const stats = useMemo(() => {
    let total = 0;
    let unlocked = 0;
    for (const w of WIDGET_CATEGORIES.CRUCIAL_WIDGETS.widgets) {
      total += 1;
      if (canAccessWebsiteWidget(planKey, w.planWidget)) unlocked += 1;
    }
    for (const w of WIDGET_CATEGORIES.TESTIMONIAL_WIDGETS.widgets) {
      total += 1;
      if (canAccessWebsiteWidget(planKey, w.planWidget)) unlocked += 1;
    }
    return { total, unlocked };
  }, [planKey]);

  const visibleCategories = useMemo(() => {
    if (filter === "all") return WIDGET_CATEGORY_KEYS;
    return [filter];
  }, [filter]);

  function openWidget(widget: WebsiteWidgetDefinition) {
    onSelect(widget.id);
    onOpenConfigure(widget.id);
  }

  function buildPreviewSrc(widget: WebsiteWidgetDefinition): string {
    if (!slug) return "";
    const params = new URLSearchParams({
      business: slug,
      type: widget.id,
      dashboard_demo: "1",
      gallery: "1",
      theme: "minimal",
      show_business_name: "1",
    });
    if (
      (WIDGET_EMBED_IDS_WITH_PREVIEW_AND_STAR_CONTROLS as readonly string[]).includes(widget.id)
    ) {
      params.set("limit", "2");
    }
    return `${previewBaseUrl}/widgets/embed?${params.toString()}${previewExtraParams}`;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[#E9E1D2] bg-gradient-to-br from-white via-white to-[#F9F6EF] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#1FAF9E]">
              Widget library
            </p>
            <h2 className="mt-1 text-xl font-semibold text-[#0E0E0E] sm:text-2xl">
              Every style, one place
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Browse live previews for all {stats.total} widgets. Open any card for full-size preview,
              customization, and embed code. Locked widgets still preview — upgrade only when you are
              ready to publish.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#124541]/10 px-3 py-1.5 text-xs font-semibold text-[#124541]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              {stats.unlocked} available on your plan
            </span>
            <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-medium text-gray-600 ring-1 ring-gray-200">
              {stats.total} widgets total
            </span>
          </div>
        </div>

        <div
          className="mt-5 flex flex-wrap gap-2"
          role="tablist"
          aria-label="Filter widgets by category"
        >
          {(
            [
              { key: "all" as const, label: "All widgets", count: stats.total },
              {
                key: "CRUCIAL_WIDGETS" as const,
                label: "Crucial",
                count: WIDGET_CATEGORIES.CRUCIAL_WIDGETS.widgets.length,
              },
              {
                key: "TESTIMONIAL_WIDGETS" as const,
                label: "Testimonial",
                count: WIDGET_CATEGORIES.TESTIMONIAL_WIDGETS.widgets.length,
              },
            ] as const
          ).map((tab) => {
            const active = filter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setFilter(tab.key)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#124541] text-white shadow-sm"
                    : "bg-white text-gray-700 ring-1 ring-gray-200 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 tabular-nums ${active ? "text-white/80" : "text-gray-400"}`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-10">
        {visibleCategories.map((categoryKey) => {
          const cat = WIDGET_CATEGORIES[categoryKey];
          const accent =
            categoryKey === "CRUCIAL_WIDGETS"
              ? "border-l-[#1FAF9E]"
              : "border-l-[#6366f1]";

          return (
            <section
              key={categoryKey}
              aria-labelledby={`widget-cat-${categoryKey}`}
              className={`rounded-2xl border border-gray-200 bg-white p-5 sm:p-6 border-l-4 ${accent}`}
            >
              <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3
                    id={`widget-cat-${categoryKey}`}
                    className="text-lg font-semibold text-[#0E0E0E]"
                  >
                    {cat.label}
                  </h3>
                  <p className="mt-1 max-w-3xl text-sm text-gray-600">{cat.description}</p>
                </div>
                <span className="shrink-0 text-xs font-medium text-gray-500">
                  {cat.widgets.length} widget{cat.widgets.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {cat.widgets.map((widget) => {
                  const isActive = selected === widget.id;
                  const cardLocked = !canAccessWebsiteWidget(planKey, widget.planWidget);
                  const requiredPlan = requiredPlanForWebsiteWidget(widget.planWidget);
                  const previewSrc = buildPreviewSrc(widget);

                  return (
                    <article
                      key={widget.id}
                      className={`group flex flex-col overflow-hidden rounded-xl border bg-white transition-all ${
                        isActive && configureOpen
                          ? "border-[#1FAF9E] shadow-md ring-2 ring-[#1FAF9E]/20"
                          : "border-gray-200 shadow-sm hover:border-[#1FAF9E]/40 hover:shadow-md"
                      }`}
                    >
                      <div
                        className="relative overflow-hidden border-b border-gray-100 bg-[#fafafa]"
                        style={{ height: WIDGET_GALLERY_PANE_HEIGHT }}
                      >
                        {previewSrc ? (
                          <WidgetGalleryPreview
                            src={previewSrc}
                            title={`${widget.name} live preview`}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-gray-400">
                            Preview unavailable
                          </div>
                        )}
                        {cardLocked ? (
                          <div className="absolute right-3 top-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200 backdrop-blur-sm">
                              <Lock className="h-3 w-3" aria-hidden />
                              {planDisplayName(requiredPlan)} plan
                            </span>
                          </div>
                        ) : (
                          <div className="absolute right-3 top-3">
                            <span className="inline-flex items-center gap-1 rounded-full bg-[#124541] px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm">
                              <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                              Ready to embed
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-4 sm:p-5">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="text-base font-semibold text-[#0E0E0E]">{widget.name}</h4>
                            {!cardLocked ? (
                              <div className="mt-1">
                                <AvailableToUseLabel />
                              </div>
                            ) : null}
                          </div>
                          <span
                            className={`inline-flex shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ${planBadgeClasses(requiredPlan)}`}
                          >
                            {planDisplayName(requiredPlan)}
                          </span>
                        </div>

                        <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600">
                          {widget.description}
                        </p>
                        <p className="mt-2 text-xs text-gray-500">{widget.sizesHelp}</p>

                        <button
                          type="button"
                          onClick={() => openWidget(widget)}
                          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1FAF9E] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#189786] group-hover:bg-[#189786]"
                        >
                          Preview &amp; configure
                          <ExternalLink className="h-4 w-4 opacity-80" aria-hidden />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
