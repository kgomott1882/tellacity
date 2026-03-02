"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

type Props = {
  score: number;
};

export default function TrustScoreGauge({ score }: Props) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timeout = setTimeout(() => setAnimatedScore(score), 200);
    return () => clearTimeout(timeout);
  }, [score]);

  const r             = 70;
  const circumference = 2 * Math.PI * r;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const strokeColor =
    score >= 80 ? "#34d399" :  // emerald-400
    score >= 60 ? "#4ade80" :  // green-400
    score >= 40 ? "#facc15" :  // yellow-400
                  "#ef4444";   // red-500

  const tier =
    score >= 80 ? "Excellent" :
    score >= 60 ? "Strong"    :
    score >= 40 ? "Average"   :
                  "Needs Attention";

  const tierColor =
    score >= 80 ? "text-emerald-400" :
    score >= 60 ? "text-green-400"   :
    score >= 40 ? "text-yellow-400"  :
                  "text-red-500";

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-44 w-44">
        <svg
          width="180"
          height="180"
          viewBox="0 0 180 180"
          className="-rotate-90"
        >
          {/* Track */}
          <circle
            cx="90" cy="90" r={r}
            strokeWidth="14"
            stroke="#262626"
            fill="transparent"
          />
          {/* Animated fill */}
          <motion.circle
            cx="90" cy="90" r={r}
            strokeWidth="14"
            fill="transparent"
            stroke={strokeColor}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.4, ease: "easeOut" }}
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-white leading-none">
            {animatedScore}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-widest text-slate-400">
            Trust Score
          </span>
        </div>
      </div>

      <span className={`mt-3 text-sm font-semibold ${tierColor}`}>{tier}</span>
    </div>
  );
}
