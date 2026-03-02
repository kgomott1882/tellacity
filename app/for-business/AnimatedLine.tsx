"use client";

import { motion } from "framer-motion";

interface Props {
  d: string;
  stroke?: string;
  strokeWidth?: number;
}

export default function AnimatedLine({
  d,
  stroke = "#1FAF9E",
  strokeWidth = 6,
}: Props) {
  return (
    <svg viewBox="0 0 800 200" className="mx-auto w-full max-w-3xl">
      <motion.path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        transition={{ duration: 1.6, ease: "easeInOut" }}
      />
    </svg>
  );
}

