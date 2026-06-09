"use client";

import { useEffect, useRef, useState } from "react";

type StatItem = {
  value: number;
  suffix: string;
  label: string;
};

const STATS: StatItem[] = [
  { value: 50000, suffix: "+", label: "Reviews Published" },
  { value: 12000, suffix: "+", label: "Verified Businesses" },
  { value: 180, suffix: "+", label: "Countries Covered" },
];

function formatCount(value: number, target: number, suffix: string): string {
  const rounded = Math.round(value);
  if (target >= 1000) {
    return `${rounded.toLocaleString()}${suffix}`;
  }
  return `${rounded}${suffix}`;
}

function AnimatedStat({ value, suffix, label }: StatItem) {
  const ref = useRef<HTMLDivElement>(null);
  const [display, setDisplay] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setStarted(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!started) return;

    const duration = 1800;
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - (1 - t) ** 3;
      setDisplay(Math.round(value * eased));
      if (t < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [started, value]);

  return (
    <div ref={ref} className="home-stat-item text-center">
      <p className="home-stat-value text-3xl font-bold tabular-nums sm:text-4xl md:text-5xl">
        {formatCount(display, value, suffix)}
      </p>
      <p className="home-stat-label mt-2 text-sm text-white/80 sm:text-base">
        {label}
      </p>
    </div>
  );
}

export default function HomeStatsBar() {
  return (
    <section className="home-stats-bar" aria-label="Tellacity platform stats">
      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-3 sm:gap-8 sm:py-14">
        {STATS.map((stat) => (
          <AnimatedStat key={stat.label} {...stat} />
        ))}
      </div>
    </section>
  );
}
