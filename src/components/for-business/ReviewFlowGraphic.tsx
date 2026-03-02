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
};

const lineVariants = {
  hidden: { scaleX: 0, opacity: 0 },
  visible: {
    scaleX: 1,
    opacity: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function ReviewFlowGraphic() {
  return (
    <motion.div
      className="flex items-center justify-center gap-6"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
    >
      {steps.map((step, i) => (
        <div key={step.num} className="contents">
          <div className="flex flex-col items-center">
            <motion.div
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1FAF9E] font-semibold text-white"
              variants={circleVariants}
            >
              {step.num}
            </motion.div>
            <p className="mt-2 text-xs text-gray-600">{step.label}</p>
          </div>
          {i < steps.length - 1 && (
            <motion.div
              className="h-[2px] w-16 origin-left bg-gray-300"
              variants={lineVariants}
            />
          )}
        </div>
      ))}
    </motion.div>
  );
}
