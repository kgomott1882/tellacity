"use client";

import { motion } from "framer-motion";

export default function AnimatedLogoOutline() {
  return (
    <div className="mx-auto mt-16 w-full max-w-md">
      <svg
        viewBox="0 0 300 260"
        className="w-full"
        aria-hidden="true"
      >
        <motion.path
          d="
            M30 60
            L90 10
            H160
            L190 70
            L260 10
            H290
            L250 80
            H170
            L200 140
            L150 240
            H100
            L150 140
            H70
            Z
          "
          fill="none"
          stroke="#1FAF9E"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          transition={{
            duration: 2,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      </svg>
    </div>
  );
}

