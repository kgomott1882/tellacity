"use client";

import { useState } from "react";

const values = [
  {
    title: "Integrity First",
    description:
      "We act with honesty and hold ourselves to high standards in every decision.",
  },
  {
    title: "Radical Transparency",
    description:
      "We communicate openly, share context, and build trust through clarity.",
  },
  {
    title: "Customer Empathy",
    description:
      "We listen closely to consumers and businesses to solve real problems.",
  },
  {
    title: "Own the Outcome",
    description:
      "We take responsibility, follow through, and deliver quality work.",
  },
  {
    title: "Grow Together",
    description:
      "We invest in each other's growth, learning, and long-term success.",
  },
];

export default function ValuesTabs() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="space-y-3">
      {values.map((item, index) => {
        const isActive = activeIndex === index;
        return (
          <button
            key={item.title}
            type="button"
            onClick={() => setActiveIndex(index)}
            className={`w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all duration-300 ease-out ${
              isActive
                ? "border-[#0E3B36] ring-2 ring-[#0E3B36]/20"
                : "border-gray-200 hover:border-gray-300"
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                  isActive
                    ? "border-[#0E3B36] bg-[#0E3B36] text-white"
                    : "border-[#CFEAE6] text-[#0E3B36]"
                }`}
              >
                ✓
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-[#0E0E0E]">
                  {item.title}
                </h3>
                <p
                  className={`mt-1 text-xs text-gray-600 transition-all duration-300 ${
                    isActive ? "opacity-100" : "opacity-90"
                  }`}
                >
                  {item.description}
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
