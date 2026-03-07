"use client";

import { motion } from "framer-motion";

const steps = [
  { num: 1, label: "Customer posts review" },
  { num: 2, label: "Business responds" },
  { num: 3, label: "Trust updates" },
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.1 },
  },
};

const circleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 260,
      damping: 20,
    },
  },
} as const;

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeInOut" },
  },
} as const;

export default function ReviewFlowGraphic() {
  return (
    <motion.div
      className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 min-w-0"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
    >
      {steps.map((step, i) => (
        <div key={step.num} className="contents">
          <div className="flex flex-col items-center">
            <motion.div
              className="flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full bg-[#1FAF9E] text-sm sm:text-base font-semibold text-white"
              variants={circleVariants}
            >
              {step.num}
            </motion.div>
            <p className="mt-1.5 sm:mt-2 text-xs text-gray-600 text-center">{step.label}</p>
          </div>
          {i < steps.length - 1 && (
            <>
              <motion.div
                className="hidden sm:block h-[2px] w-12 sm:w-16 shrink-0 origin-left bg-gray-300"
                variants={lineVariants}
              />
              <motion.div
                className="sm:hidden h-6 w-px shrink-0 bg-gray-300"
                variants={lineVariants}
              />
            </>
          )}
        </div>
      ))}
    </motion.div>
  );
}
