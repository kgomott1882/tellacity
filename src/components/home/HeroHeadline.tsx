"use client";

import { motion } from "framer-motion";

const wordVariants = {
  hidden: { opacity: 0, y: 18 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 + i * 0.07,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
};

const WORDS = ["Customer", "Reviews", "&", "Feedback"];

export default function HeroHeadline() {
  return (
    <h1 className="home-hero-headline text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem]">
      {WORDS.map((word, index) => {
        const isCustomer = word === "Customer";

        return (
          <motion.span
            key={`${word}-${index}`}
            custom={index}
            initial="hidden"
            animate="visible"
            variants={wordVariants}
            className={`inline-block ${index < WORDS.length - 1 ? "mr-[0.28em]" : ""} ${
              isCustomer ? "home-hero-gradient-text" : "text-[#F5F0E8]"
            }`}
          >
            {word}
          </motion.span>
        );
      })}
    </h1>
  );
}
