"use client";

import React from "react";

export default function PageLoadingOverlay() {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#F8F4F0]/70 backdrop-blur-[1px]">
      <Spinner />
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="animate-spin"
      style={{ animationDuration: "0.8s" }}
    >
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const opacity = (i + 1) / 12;
        const x1 = 24 + 14 * Math.sin(angle);
        const y1 = 24 - 14 * Math.cos(angle);
        const x2 = 24 + 20 * Math.sin(angle);
        const y2 = 24 - 20 * Math.cos(angle);
        return (
          <line
            key={i}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke="#124541"
            strokeWidth="4"
            strokeLinecap="round"
            opacity={opacity}
          />
        );
      })}
    </svg>
  );
}
