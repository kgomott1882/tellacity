"use client";

import { motion } from "framer-motion";

const steps = [
  "Customer leaves a verified review",
  "Business is notified instantly",
  "Business responds publicly or privately",
  "Trust indicators update automatically",
];

const container = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.08 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

const numberVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
      delay: 0.15,
    },
  },
};

export default function ReviewFlowSteps() {
  return (
    <motion.div
      className="mt-6 grid gap-6 md:grid-cols-4"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
      {steps.map((item, index) => (
        <motion.div
          key={item}
          className="rounded-2xl border border-gray-200 bg-white p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)] active:scale-95 hover:bg-teal-50"
          variants={cardVariants}
        >
          <motion.span
            className="mb-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1FAF9E] text-xs font-semibold text-white"
            variants={numberVariants}
          >
            {index + 1}
          </motion.span>
          <p className="text-sm font-semibold text-[#0E0E0E]">{item}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
