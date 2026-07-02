"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type TabKey = "details" | "controls" | "reviews" | "photos" | "articles";

type BusinessDetailTabsProps = {
  details: ReactNode;
  controls: ReactNode;
  reviews: ReactNode;
  photos: ReactNode;
  articles: ReactNode;
  pendingPhotoCount?: number;
  pendingArticleCount?: number;
  flaggedReviewCount?: number;
};

export default function BusinessDetailTabs({
  details,
  controls,
  reviews,
  photos,
  articles,
  pendingPhotoCount = 0,
  pendingArticleCount = 0,
  flaggedReviewCount = 0,
}: BusinessDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("details");

  const tabBtn = (key: TabKey, label: string, badge?: number) => (
    <button
      onClick={() => setActiveTab(key)}
      className={`flex items-center justify-between gap-2 text-left px-3 py-2 rounded ${
        activeTab === key ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
      }`}
    >
      <span>{label}</span>
      {badge && badge > 0 ? (
        <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[11px] font-semibold text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </button>
  );

  return (
    <div className="flex w-full p-4 sm:p-6">
      <div className="w-64 border-r pr-4">
        <div className="flex flex-col gap-2">
          {tabBtn("details", "Details")}
          {tabBtn("controls", "Controls")}
          {tabBtn("reviews", "Reviews", flaggedReviewCount)}
          {tabBtn("photos", "Photos", pendingPhotoCount)}
          {tabBtn("articles", "Articles", pendingArticleCount)}
        </div>
      </div>

      <div className="min-w-0 flex-1 pl-6">
        {activeTab === "details" && <>{details}</>}
        {activeTab === "controls" && <>{controls}</>}
        {activeTab === "reviews" && <>{reviews}</>}
        {activeTab === "photos" && <>{photos}</>}
        {activeTab === "articles" && <>{articles}</>}
      </div>
    </div>
  );
}
