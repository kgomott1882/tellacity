"use client";

import { motion } from "framer-motion";

const steps = [
  {
    title: "Customer submits a verified review",
    description:
      "A customer shares an authentic experience about a business through Tellacity's verified review system.",
  },
  {
    title: "Business receives instant notification",
    description:
      "The business is notified immediately so they can read the customer feedback and respond quickly.",
  },
  {
    title: "Business responds and resolves issues",
    description:
      "Businesses can reply publicly or privately to address concerns, provide support, and show transparency.",
  },
  {
    title: "Trust signals update automatically",
    description:
      "Ratings, reputation signals, and review insights update in real time to reflect the latest customer feedback.",
  },
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
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
    },
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
} as const;

export default function ReviewFlowSteps() {
  return (
    <motion.div
      className="mt-4 sm:mt-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-4 min-w-0"
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-30px" }}
    >
      {steps.map((item, index) => (
        <motion.div
          key={item.title}
          className="rounded-xl sm:rounded-2xl border border-gray-200 bg-white p-3 sm:p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(0,0,0,0.08)] active:scale-95 hover:bg-teal-50 min-w-0"
          variants={cardVariants}
        >
          <motion.span
            className="mb-2 sm:mb-3 inline-flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full bg-[#1FAF9E] text-xs font-semibold text-white"
            variants={numberVariants}
          >
            {index + 1}
          </motion.span>
          <h3 className="text-sm font-semibold text-[#0E0E0E] leading-snug">{item.title}</h3>
          <p className="mt-1 text-sm text-gray-600 leading-snug">{item.description}</p>
        </motion.div>
      ))}
    </motion.div>
  );
}
