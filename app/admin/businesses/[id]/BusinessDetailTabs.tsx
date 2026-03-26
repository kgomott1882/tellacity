"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type BusinessDetailTabsProps = {
  details: ReactNode;
  controls: ReactNode;
};

export default function BusinessDetailTabs({ details, controls }: BusinessDetailTabsProps) {
  const [activeTab, setActiveTab] = useState<"details" | "controls">("details");

  return (
    <div className="flex w-full p-4 sm:p-6">
      <div className="w-64 border-r pr-4">
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setActiveTab("details")}
            className={`text-left px-3 py-2 rounded ${
              activeTab === "details" ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
            }`}
          >
            Details
          </button>

          <button
            onClick={() => setActiveTab("controls")}
            className={`text-left px-3 py-2 rounded ${
              activeTab === "controls" ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
            }`}
          >
            Controls
          </button>
        </div>
      </div>

      <div className="min-w-0 flex-1 pl-6">
        {activeTab === "details" && <>{details}</>}
        {activeTab === "controls" && <>{controls}</>}
      </div>
    </div>
  );
}
